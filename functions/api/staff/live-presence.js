
import {
  staffAuth,
  can,
  result,
  originOK
} from './_auth.js';

const STATES = ['available', 'busy', 'offline'];

const HEARTBEAT_SECONDS = 60;

export async function onRequestGet({ request, env }) {
  try {
    const staff = await staffAuth(request, env);

    if (!staff) {
      return result({ error: 'Unauthorized' }, 401);
    }

    if (!can(staff, 'chat_reply')) {
      return result({ error: 'Permission denied' }, 403);
    }

    const row = await env.DB.prepare(`
      SELECT
        availability,
        heartbeat_at,
        CASE
          WHEN heartbeat_at >= datetime('now', '-60 seconds')
          THEN 1
          ELSE 0
        END AS heartbeat_fresh
      FROM dd_support_agent_presence
      WHERE staff_id = ?
    `).bind(staff.id).first();

    const online = !!row?.heartbeat_fresh &&
      row.availability !== 'offline';

    return result({
      ok: true,
      availability: online
        ? row.availability
        : 'offline',
      online,
      heartbeat_seconds: HEARTBEAT_SECONDS
    });

  } catch (error) {
    console.error('Agent presence GET failed', error);

    return result({
      error: 'Unable to load agent availability'
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

    const availability = body?.availability;

    if (!STATES.includes(availability)) {
      return result({
        error: 'Invalid availability status'
      }, 400);
    }

    await env.DB.prepare(`
      INSERT INTO dd_support_agent_presence (
        staff_id,
        availability,
        heartbeat_at,
        updated_at
      )
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

      ON CONFLICT(staff_id)
      DO UPDATE SET
        availability = excluded.availability,
        heartbeat_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      staff.id,
      availability
    ).run();

    return result({
      ok: true,
      availability,
      online: availability !== 'offline',
      heartbeat_seconds: HEARTBEAT_SECONDS
    });

  } catch (error) {
    console.error('Agent presence POST failed', error);

    return result({
      error: 'Unable to update agent availability'
    }, 503);
  }
}
