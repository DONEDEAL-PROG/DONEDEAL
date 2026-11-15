
import {
  out,
  sameOrigin,
  valid,
  sha,
  token,
  verified
} from './_util.js';

const ticketOK = id =>
  typeof id === 'string' &&
  /^SUP-[0-9a-f-]{36}$/i.test(id);

const emailOK = email =>
  typeof email === 'string' &&
  email.length <= 160 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const phoneOK = phone =>
  typeof phone === 'string' &&
  phone.length <= 30 &&
  /^[+0-9()\s-]+$/.test(phone);

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) {
    return out({ error: 'Invalid origin' }, 403);
  }

  if (!env.DB) {
    return out({ error: 'Support unavailable' }, 503);
  }

  if (!request.headers.get('content-type')
    ?.includes('application/json')) {
    return out({ error: 'Invalid request type' }, 415);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return out({ error: 'Invalid JSON' }, 400);
  }

  const name = typeof body?.name === 'string'
    ? body.name.trim()
    : '';

  const email = typeof body?.email === 'string'
    ? body.email.trim()
    : '';

  const phone = typeof body?.phone === 'string'
    ? body.phone.trim()
    : '';

  const subject = typeof body?.subject === 'string'
    ? body.subject.trim()
    : 'Live Agent Support';

  const message = typeof body?.message === 'string'
    ? body.message.trim()
    : '';

  if (
    !valid(name, 80) ||
    !emailOK(email) ||
    !valid(subject, 140) ||
    !valid(message, 2000) ||
    (phone && !phoneOK(phone))
  ) {
    return out({
      error: 'Check your name, email, phone and message'
    }, 400);
  }

  const id = 'SUP-' + crypto.randomUUID();
  const access = token();

  try {
    const statements = [
      env.DB.prepare(`
        INSERT INTO dd_support_tickets (
          id,
          access_hash,
          guest_name,
          guest_email,
          subject
        )
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        id,
        await sha(access),
        name,
        email,
        subject
      ),

      env.DB.prepare(`
        INSERT INTO dd_support_messages (
          id,
          ticket_id,
          sender,
          body
        )
        VALUES (?, ?, 'guest', ?)
      `).bind(
        crypto.randomUUID(),
        id,
        message
      ),

      env.DB.prepare(`
        INSERT INTO dd_support_live_queue (
          ticket_id,
          state
        )
        VALUES (?, 'waiting')
      `).bind(id)
    ];

    if (phone) {
      statements.push(
        env.DB.prepare(`
          INSERT INTO dd_support_contact_preferences (
            ticket_id,
            contact_email,
            contact_phone,
            preferred_contact
          )
          VALUES (?, ?, ?, 'either')
        `).bind(id, email, phone)
      );
    }

    await env.DB.batch(statements);

    return out({
      ok: true,
      id,
      access,
      state: 'waiting',
      message: 'You are now in the Live Agent queue.'
    }, 201);

  } catch (error) {
    console.error('Live chat creation failed', error);

    return out({
      error: 'Unable to start live chat'
    }, 503);
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return out({ error: 'Support unavailable' }, 503);
  }

  const url = new URL(request.url);

  const id = url.searchParams.get('id') || '';
  const access =
    request.headers.get('X-Support-Access') || '';

  if (!ticketOK(id)) {
    return out({ error: 'Invalid ticket' }, 400);
  }

  try {
    const ticket = await verified(
      env.DB,
      id,
      access
    );

    if (!ticket) {
      return out({
        error: 'Ticket not found or access denied'
      }, 404);
    }

    const queue = await env.DB.prepare(`
      SELECT
        state,
        joined_at,
        accepted_at
      FROM dd_support_live_queue
      WHERE ticket_id = ?
    `).bind(id).first();

    if (!queue) {
      return out({
        error: 'Live chat not found'
      }, 404);
    }

    return out({
      ok: true,
      ticket_id: id,
      ticket_status: ticket.status,
      state: queue.state,
      joined_at: queue.joined_at,
      accepted_at: queue.accepted_at,
      message:
        queue.state === 'waiting'
          ? 'Waiting for an available agent.'
          : queue.state === 'accepted'
          ? 'A support agent has accepted your chat.'
          : 'This live chat is no longer in the queue.'
    });

  } catch (error) {
    console.error('Live chat status failed', error);

    return out({
      error: 'Unable to check live chat status'
    }, 503);
  }
}
