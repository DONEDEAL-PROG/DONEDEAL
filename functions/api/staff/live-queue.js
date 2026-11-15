
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
      FROM dd_support_live_queue AS q
      JOIN dd_support_tickets AS t
        ON t.id = q.ticket_id
      WHERE q.state = 'waiting'
        AND t.status != 'closed'
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
      !ticketOK(body?.ticket_id)
    ) {
      return result({ error: 'Invalid request' }, 400);
    }

    const ticketId = body.ticket_id;

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

    /*
      First-to-Accept:

      1. Update only a waiting chat.
      2. Save its staff assignment in the same D1 batch.
      3. Use the same eligibility condition for both writes.
      4. Confirm ownership before returning success.

      D1 batch executes statements transactionally.
    */

    const eligible = `
      SELECT q.ticket_id
      FROM dd_support_live_queue AS q
      JOIN dd_support_tickets AS t
        ON t.id = q.ticket_id
      WHERE q.ticket_id = ?
        AND q.state = 'waiting'
        AND t.status != 'closed'
    `;

    const statements = [
      env.DB.prepare(`
        INSERT INTO dd_support_assignments (
          ticket_id,
          staff_id
        )
        SELECT ?, ?
        WHERE EXISTS (
          ${eligible}
        )
        ON CONFLICT(ticket_id)
        DO NOTHING
      `).bind(
        ticketId,
        staff.id,
        ticketId
      ),

      env.DB.prepare(`
        UPDATE dd_support_live_queue
        SET
          state = 'accepted',
          accepted_by = ?,
          accepted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE ticket_id = ?
          AND state = 'waiting'
          AND EXISTS (
            SELECT 1
            FROM dd_support_assignments
            WHERE ticket_id = ?
              AND staff_id = ?
          )
          AND EXISTS (
            SELECT 1
            FROM dd_support_tickets
            WHERE id = ?
              AND status != 'closed'
          )
      `).bind(
        staff.id,
        ticketId,
        ticketId,
        staff.id,
        ticketId
      )
    ];

    const batchResult = await env.DB.batch(statements);

    const acceptedChanges =
      batchResult?.[1]?.meta?.changes || 0;

    if (acceptedChanges !== 1) {
      return result({
        error: 'This chat was already accepted or is unavailable'
      }, 409);
    }

    const ownership = await env.DB.prepare(`
      SELECT
        q.state,
        q.accepted_by,
        a.staff_id AS assigned_to
      FROM dd_support_live_queue AS q
      JOIN dd_support_assignments AS a
        ON a.ticket_id = q.ticket_id
      WHERE q.ticket_id = ?
    `).bind(ticketId).first();

    if (
      ownership?.state !== 'accepted' ||
      ownership?.accepted_by !== staff.id ||
      ownership?.assigned_to !== staff.id
    ) {
      console.error(
        'Live chat ownership mismatch',
        ticketId
      );

      return result({
        error: 'Unable to confirm chat assignment'
      }, 503);
    }

    try {
      await audit(
        env,
        'staff',
        staff.id,
        'live_chat_accept',
        ticketId
      );
    } catch (auditError) {
      console.error(
        'Live chat audit failed',
        auditError
      );
    }

    return result({
      ok: true,
      ticket_id: ticketId,
      assigned_to: staff.id,
      state: 'accepted'
    });

  } catch (error) {
    console.error('Live chat acceptance failed', error);

    return result({
      error: 'Unable to accept live chat'
    }, 503);
  }
}
