
import { allowed, reply } from './_auth.js';

export async function onRequestGet({ request, env }) {
  if (!await allowed(request, env)) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!env.DB) {
    return reply({ error: 'Database unavailable' }, 503);
  }

  try {
    const url = new URL(request.url);

    const limitValue = Number(
      url.searchParams.get('limit') || 100
    );

    const limit = Number.isInteger(limitValue)
      ? Math.min(Math.max(limitValue, 1), 200)
      : 100;

    const rows = await env.DB.prepare(`
      SELECT
        a.id,
        a.actor_type,
        a.actor_id,
        a.action,
        a.target_id,
        a.details,
        a.created_at,
        s.display_name AS staff_name,
        s.username AS staff_username
      FROM dd_support_audit AS a
      LEFT JOIN dd_support_staff AS s
        ON a.actor_type = 'staff'
        AND a.actor_id = s.id
      ORDER BY a.created_at DESC, a.rowid DESC
      LIMIT ?
    `).bind(limit).all();

    return reply({
      logs: rows.results || []
    });

  } catch (error) {
    console.error(
      'Admin staff activity read failed',
      error
    );

    return reply({
      error: 'Unable to load staff activity logs'
    }, 503);
  }
}
