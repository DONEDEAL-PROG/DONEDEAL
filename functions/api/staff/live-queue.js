
import {
  staffAuth,
  can,
  result,
  originOK,
  audit
} from './_auth.js';

const ticketOK = id =>
  typeof id === 'string' &&
  /^SUP-[0-9a-f-]{36}$/i.test(id);

export async function onRequestGet({ request, env }) {
  try {
    const staff = await staffAuth(request, env);

    if (!staff) {
      return result({ error: 'Unauthorized' }, 401);
    }

    if (!can(staff, 'chat_reply')) {
      return result({ error: 'Permission denied' }, 403);
    }

    const rows = await env.DB.prepare(`
      SELECT
        q.ticket_id,
        q.state,
        q.joined_at,
        t.guest_name,
        t.subject,
        t.status
      FROM dd_support_live_queue q
      JOIN dd_support_tickets t
        ON t.id = q.ticket_id
      WHERE q.state = 'waiting'
      ORDER BY q.joined_at ASC
      LIMIT 100
    `).all();

    return result({
      ok: true,
      waiting: rows.results || []
    });

  } catch (error) {
    console.error('Live queue GET failed', error);

    return result({
      error: 'Unable to load waiting chats'
    }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!originOK(request)) {
    return result({ error: 'Invalid origin' }, 403);
  }

  try {
    const staff = await staffAuth(request, env);

    if (!staff) {
      return result({ error: 'Unauthorized' }, 401);
    }

    if (!can(staff, 'chat_reply')) {
      return result({ error: 'Permission denied' }, 403);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return result({ error: 'Invalid JSON' }, 400);
    }

    if (
      body?.action !== 'accept' ||
      !ticketOK(body.ticket_id)
    ) {
      return result({ error: 'Invalid request' }, 400);
    }

    const presence = await env.DB.prepare(`
      SELECT availability
      FROM dd_support_agent_presence
      WHERE staff_id = ?
        AND availability = 'available'
        AND heartbeat_at >= datetime('now', '-60 seconds')
    `).bind(staff.id).first();

    if (!presence) {
      return result({
        error: 'Set your availability to Available first'
      }, 409);
    }

    const accepted = await env.DB.prepare(`
      UPDATE dd_support_live_queue
      SET
        state = 'accepted',
        accepted_by = ?,
        accepted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = ?
        AND state = 'waiting'
    `).bind(
      staff.id,
      body.ticket_id
    ).run();

    if (!accepted.meta?.changes) {
      return result({
        error: 'This chat was already accepted or is unavailable'
      }, 409);
    }

    await env.DB.prepare(`
      INSERT INTO dd_support_assignments (
        ticket_id,
        staff_id
      )
      VALUES (?, ?)
      ON CONFLICT(ticket_id)
      DO UPDATE SET
        staff_id = excluded.staff_id,
        assigned_at = CURRENT_TIMESTAMP
    `).bind(
      body.ticket_id,
      staff.id
    ).run();

    await audit(
      env,
      'staff',
      staff.id,
      'live_chat_accept',
      body.ticket_id
    );

    return result({
      ok: true,
      ticket_id: body.ticket_id,
      assigned_to: staff.id
    });

  } catch (error) {
    console.error('Live chat acceptance failed', error);

    return result({
      error: 'Unable to accept live chat'
    }, 503);
  }
}
