
import { allowed, originOK, reply } from './_auth.js';

const errorResponse = (error) => {
  console.error('Admin partner messaging:', error);
  return reply({
    error: 'Unable to load partner messages. Check D1 tables and Functions logs.'
  }, 500);
};

export async function onRequestGet({ request, env }) {
  if (!(await allowed(request, env))) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!env.DB) {
    return reply({ error: 'D1 database binding missing' }, 503);
  }

  try {
    const url = new URL(request.url);
    const partnerId = url.searchParams.get('partner_id');

    if (partnerId) {
      const partner = await env.DB.prepare(`
        SELECT id, name, email
        FROM dd_affiliates
        WHERE id = ?
      `).bind(partnerId).first();

      if (!partner) {
        return reply({ error: 'Partner not found' }, 404);
      }

      const result = await env.DB.prepare(`
        SELECT id, sender, body, created_at
        FROM dd_partner_messages
        WHERE affiliate_id = ?
        ORDER BY created_at ASC, id ASC
        LIMIT 500
      `).bind(partnerId).all();

      return reply({
        partner,
        messages: result.results || []
      });
    }

    const result = await env.DB.prepare(`
      SELECT
        a.id,
        a.name,
        a.email,
        COUNT(m.id) AS message_count,
        MAX(m.created_at) AS last_message,
        SUM(
          CASE
            WHEN m.sender = 'partner'
              AND (
                r.last_read_at IS NULL
                OR m.created_at > r.last_read_at
              )
            THEN 1 ELSE 0
          END
        ) AS unread_count
      FROM dd_affiliates a
      JOIN dd_partner_messages m
        ON m.affiliate_id = a.id
      LEFT JOIN dd_admin_partner_reads r
        ON r.affiliate_id = a.id
      GROUP BY a.id, a.name, a.email
      ORDER BY last_message DESC
      LIMIT 300
    `).all();

    return reply({
      conversations: result.results || []
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await allowed(request, env))) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!originOK(request)) {
    return reply({ error: 'Invalid origin' }, 403);
  }

  if (!env.DB) {
    return reply({ error: 'D1 database binding missing' }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Invalid JSON' }, 400);
  }

  const partnerId =
    typeof body?.partner_id === 'string'
      ? body.partner_id.trim()
      : '';

  if (!partnerId || partnerId.length > 100) {
    return reply({ error: 'Invalid partner ID' }, 400);
  }

  try {
    const partner = await env.DB.prepare(`
      SELECT id FROM dd_affiliates WHERE id = ?
    `).bind(partnerId).first();

    if (!partner) {
      return reply({ error: 'Partner not found' }, 404);
    }

    if (body.action === 'read') {
      await env.DB.prepare(`
        INSERT INTO dd_admin_partner_reads
          (affiliate_id, last_read_at)
        VALUES (?, CURRENT_TIMESTAMP)
        ON CONFLICT(affiliate_id)
        DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
      `).bind(partnerId).run();

      return reply({ ok: true });
    }

    const message =
      typeof body.message === 'string'
        ? body.message.trim()
        : '';

    if (!message || message.length > 2000) {
      return reply({
        error: 'Message must be 1–2000 characters'
      }, 400);
    }

    await env.DB.prepare(`
      INSERT INTO dd_partner_messages
        (id, affiliate_id, sender, body)
      VALUES (?, ?, 'admin', ?)
    `).bind(
      crypto.randomUUID(),
      partnerId,
      message
    ).run();

    return reply({ ok: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
