
import { out } from './_util.js';

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return out({
      error: 'Support availability unavailable'
    }, 503);
  }

  try {
    const row = await env.DB.prepare(`
      SELECT
        COUNT(*) AS available_agents
      FROM dd_support_agent_presence AS p
      INNER JOIN dd_support_staff AS s
        ON s.id = p.staff_id
      WHERE p.availability = 'available'
        AND p.heartbeat_at >= datetime('now', '-60 seconds')
        AND s.active = 1
        AND EXISTS (
          SELECT 1
          FROM dd_support_staff_permissions AS sp
          WHERE sp.staff_id = s.id
            AND sp.permission = 'chat_reply'
        )
    `).first();

    const available = Number(
      row?.available_agents || 0
    ) > 0;

    return out({
      ok: true,
      available,
      status: available ? 'available' : 'busy',
      message: available
        ? 'Live agents are currently available.'
        : 'Our live agents are currently busy. You may continue waiting or create a support ticket.'
    });

  } catch (error) {
    console.error(
      'Public support availability failed',
      error
    );

    return out({
      error: 'Unable to check agent availability'
    }, 503);
  }
}
