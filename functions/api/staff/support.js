
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

/*
 * GET /api/staff/support
 * GET /api/staff/support?id=SUP-...
 *
 * List tickets with per-staff unread counts,
 * or load one ticket and its messages.
 */
export async function onRequestGet({ request, env }) {
  try {
    const staff = await staffAuth(request, env);

    if (!staff) {
      return result({ error: 'Unauthorized' }, 401);
    }

    if (
      !can(staff, 'chat_reply') &&
      !can(staff, 'ticket_assign')
    ) {
      return result({
        error: 'Permission denied'
      }, 403);
    }

    const id = new URL(request.url)
      .searchParams.get('id');

    /*
     * Load a single conversation.
     *
     * Do not automatically mark messages as read.
     * The existing staff frontend refreshes the
     * conversation every 12 seconds.
     */
    if (id) {
      if (!ticketOK(id)) {
        return result({
          error: 'Invalid ticket'
        }, 400);
      }

      const ticket = await env.DB.prepare(`
        SELECT
          t.id,
          t.guest_name,
          t.guest_email,
          t.subject,
          t.status,
          t.created_at,
          a.staff_id AS assigned_to
        FROM dd_support_tickets t
        LEFT JOIN dd_support_assignments a
          ON a.ticket_id = t.id
        WHERE t.id = ?
      `).bind(id).first();

      if (!ticket) {
        return result({
          error: 'Ticket not found'
        }, 404);
      }

      const rows = await env.DB.prepare(`
        SELECT
          id,
          sender,
          body,
          created_at
        FROM dd_support_messages
        WHERE ticket_id = ?
        ORDER BY created_at ASC
        LIMIT 500
      `).bind(id).all();

      return result({
        ticket,
        messages: rows.results || []
      });
    }

    /*
     * Load the ticket inbox.
     *
     * Unread messages are guest messages created
     * after this staff member's last_seen_at.
     *
     * A missing read-state row means the staff
     * member has not marked the ticket as read.
     */
    const rows = await env.DB.prepare(`
      SELECT
        t.id,
        t.guest_name,
        t.subject,
        t.status,
        t.updated_at,
        a.staff_id AS assigned_to,

        (
          SELECT COUNT(*)
          FROM dd_support_messages m
          WHERE m.ticket_id = t.id
            AND m.sender = 'guest'
            AND (
              rs.last_seen_at IS NULL
              OR m.created_at > rs.last_seen_at
            )
        ) AS unread_count

      FROM dd_support_tickets t

      LEFT JOIN dd_support_assignments a
        ON a.ticket_id = t.id

      LEFT JOIN dd_support_inbox_read_state rs
        ON rs.ticket_id = t.id
       AND rs.staff_id = ?

      ORDER BY t.updated_at DESC
      LIMIT 200
    `).bind(staff.id).all();

    const tickets = rows.results || [];

    const totalUnread = tickets.reduce(
      (total, ticket) =>
        total + Number(ticket.unread_count || 0),
      0
    );

    return result({
      tickets,
      unread_count: totalUnread
    });

  } catch (error) {
    console.error(
      'Staff inbox failed',
      error
    );

    return result({
      error: 'Support unavailable; check unread tracking'
    }, 503);
  }
}

/*
 * POST /api/staff/support
 *
 * Send an agent reply.
 * Existing behavior preserved.
 */
export async function onRequestPost({ request, env }) {
  if (!originOK(request)) {
    return result({
      error: 'Invalid origin'
    }, 403);
  }

  try {
    const staff = await staffAuth(request, env);

    if (!staff) {
      return result({
        error: 'Unauthorized'
      }, 401);
    }

    if (!can(staff, 'chat_reply')) {
      return result({
        error: 'Reply permission required'
      }, 403);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return result({
        error: 'Invalid JSON'
      }, 400);
    }

    const message =
      typeof body?.message === 'string'
        ? body.message.trim()
        : '';

    if (
      !ticketOK(body?.id) ||
      !message ||
      message.length > 2000
    ) {
      return result({
        error: 'Invalid reply'
      }, 400);
    }

    const ticket = await env.DB.prepare(`
      SELECT status
      FROM dd_support_tickets
      WHERE id = ?
    `).bind(body.id).first();

    if (!ticket) {
      return result({
        error: 'Ticket not found'
      }, 404);
    }

    if (ticket.status === 'closed') {
      return result({
        error: 'Ticket closed'
      }, 409);
    }

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO dd_support_messages (
          id,
          ticket_id,
          sender,
          body
        )
        VALUES (?, ?, 'agent', ?)
      `).bind(
        crypto.randomUUID(),
        body.id,
        message
      ),

      env.DB.prepare(`
        UPDATE dd_support_tickets
        SET
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(body.id)
    ]);

    await audit(
      env,
      'staff',
      staff.id,
      'support_reply',
      body.id
    );

    return result({ ok: true });

  } catch (error) {
    console.error(
      'Staff reply failed',
      error
    );

    return result({
      error: 'Support unavailable'
    }, 503);
  }
}

/*
 * PATCH /api/staff/support
 *
 * Change ticket status or manually assign staff.
 * Existing permissions and behavior preserved.
 */
export async function onRequestPatch({ request, env }) {
  if (!originOK(request)) {
    return result({
      error: 'Invalid origin'
    }, 403);
  }

  try {
    const staff = await staffAuth(request, env);

    if (!staff) {
      return result({
        error: 'Unauthorized'
      }, 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return result({
        error: 'Invalid JSON'
      }, 400);
    }

    if (!ticketOK(body?.id)) {
      return result({
        error: 'Invalid ticket'
      }, 400);
    }

    /*
     * Update ticket status.
     */
    if (body.action === 'status') {
      if (!can(staff, 'chat_reply')) {
        return result({
          error: 'Permission denied'
        }, 403);
      }

      if (
        !['open', 'pending', 'closed']
          .includes(body.status)
      ) {
        return result({
          error: 'Invalid status'
        }, 400);
      }

      const updated = await env.DB.prepare(`
        UPDATE dd_support_tickets
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.status,
        body.id
      ).run();

      if (!updated.meta?.changes) {
        return result({
          error: 'Ticket not found'
        }, 404);
      }

      await audit(
        env,
        'staff',
        staff.id,
        'support_status',
        body.id,
        body.status
      );

      return result({ ok: true });
    }

    /*
     * Manually assign a ticket.
     */
    if (body.action === 'assign') {
      if (!can(staff, 'ticket_assign')) {
        return result({
          error: 'Permission denied'
        }, 403);
      }

      if (
        typeof body.staff_id !== 'string' ||
        !/^[a-f0-9-]{36}$/i.test(body.staff_id)
      ) {
        return result({
          error: 'Invalid assignee'
        }, 400);
      }

      const [ticket, target] = await Promise.all([
        env.DB.prepare(`
          SELECT id
          FROM dd_support_tickets
          WHERE id = ?
        `).bind(body.id).first(),

        env.DB.prepare(`
          SELECT id, permissions_json
          FROM dd_support_staff
          WHERE id = ?
            AND active = 1
        `).bind(body.staff_id).first()
      ]);

      if (!ticket) {
        return result({
          error: 'Ticket not found'
        }, 404);
      }

      let targetPermissions = [];

      try {
        targetPermissions = JSON.parse(
          target?.permissions_json || '[]'
        );
      } catch {
        targetPermissions = [];
      }

      if (
        !target ||
        !Array.isArray(targetPermissions) ||
        !targetPermissions.includes('chat_reply')
      ) {
        return result({
          error: 'Assignee must be active with reply permission'
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
        body.id,
        body.staff_id
      ).run();

      await audit(
        env,
        'staff',
        staff.id,
        'support_assign',
        body.id,
        body.staff_id
      );

      return result({ ok: true });
    }

    return result({
      error: 'Unknown action'
    }, 400);

  } catch (error) {
    console.error(
      'Staff ticket update failed',
      error
    );

    return result({
      error: 'Support unavailable'
    }, 503);
  }
}
