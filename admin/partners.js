const $=id=>document.getElementById(id),money=n=>'₱'+(Number(n||0)/100).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
import { allowed, originOK, reply, validText } from './_auth.js';

const states = ['pending', 'approved', 'rejected', 'suspended'];

const fail = (e) => {
  console.error('Partner admin API error:', e);
  return reply({
    error: 'Unable to process partner management request. Check Pages Functions logs.'
  }, 500);
};

export async function onRequestGet({ request, env }) {
  if (!await allowed(request, env)) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!env.DB) {
    return reply({ error: 'D1 database binding missing' }, 503);
  }

  try {
    const [partners, orders, payouts] = await Promise.all([
      env.DB.prepare(`
        SELECT id, name, email, social_url, status,
               referral_code, commission_bps, created_at
        FROM dd_affiliates
        ORDER BY created_at DESC
        LIMIT 300
      `).all(),

      env.DB.prepare(`
        SELECT
          ao.order_id,
          ao.affiliate_id,
          ao.commission_centavos,
          ao.commission_bps,
          ao.status,
          ao.created_at,
          a.name,
          o.total_centavos,
          o.paid_at,
          m.payment_status
        FROM dd_affiliate_orders ao
        JOIN dd_affiliates a
          ON a.id = ao.affiliate_id
        JOIN store_orders o
          ON o.id = ao.order_id
        LEFT JOIN store_order_meta m
          ON m.order_id = o.id
        ORDER BY ao.created_at DESC
        LIMIT 300
      `).all(),

      env.DB.prepare(`
        SELECT
          p.id,
          p.affiliate_id,
          p.amount_centavos,
          p.status,
          p.method,
          p.account,
          p.created_at,
          p.note,
          a.name
        FROM dd_affiliate_payouts p
        JOIN dd_affiliates a
          ON a.id = p.affiliate_id
        ORDER BY p.created_at DESC
        LIMIT 300
      `).all()
    ]);

    return reply({
      partners: partners.results || [],
      orders: orders.results || [],
      payouts: payouts.results || []
    });

  } catch (e) {
    return fail(e);
  }
}

export async function onRequestPost({ request, env }) {
  if (!await allowed(request, env)) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!originOK(request)) {
    return reply({ error: 'Invalid origin' }, 403);
  }

  if (!env.DB) {
    return reply({ error: 'D1 database binding missing' }, 503);
  }

  let b;

  try {
    b = await request.json();
  } catch {
    return reply({ error: 'Invalid JSON' }, 400);
  }

  if (
    !b ||
    typeof b !== 'object' ||
    !validText(b.id, 100)
  ) {
    return reply({ error: 'Invalid request ID' }, 400);
  }

  try {
    // APPROVE PARTNER / UPDATE COMMISSION
    if (b.action === 'partner') {
      if (
        !states.includes(b.status) ||
        !Number.isInteger(b.commission_bps) ||
        b.commission_bps < 0 ||
        b.commission_bps > 10000
      ) {
        return reply({
          error: 'Invalid status or commission rate'
        }, 400);
      }

      const result = await env.DB.prepare(`
        UPDATE dd_affiliates
        SET
          status = ?,
          commission_bps = ?,
          approved_at = CASE
            WHEN ? = 'approved'
            THEN COALESCE(approved_at, CURRENT_TIMESTAMP)
            ELSE approved_at
          END
        WHERE id = ?
      `)
        .bind(
          b.status,
          b.commission_bps,
          b.status,
          b.id
        )
        .run();

      return result.meta.changes
        ? reply({ ok: true })
        : reply({ error: 'Partner not found' }, 404);
    }

    // APPROVE / VOID COMMISSION
    if (b.action === 'commission') {
      if (!['approved', 'void'].includes(b.status)) {
        return reply({
          error: 'Invalid commission status'
        }, 400);
      }

      const row = await env.DB.prepare(`
        SELECT
          ao.status,
          o.status AS order_status,
          o.paid_at,
          m.payment_status
        FROM dd_affiliate_orders ao
        JOIN store_orders o
          ON o.id = ao.order_id
        LEFT JOIN store_order_meta m
          ON m.order_id = o.id
        WHERE ao.order_id = ?
      `).bind(b.id).first();

      if (!row) {
        return reply({ error: 'Commission not found' }, 404);
      }

      if (row.status !== 'pending') {
        return reply({
          error: 'Only pending commissions can be changed'
        }, 409);
      }

      if (
        b.status === 'approved' &&
        (
          row.order_status === 'cancelled' ||
          (!row.paid_at && row.payment_status !== 'paid') ||
          (
            row.payment_status &&
            row.payment_status !== 'paid'
          )
        )
      ) {
        return reply({
          error: 'Verify order payment before approving commission'
        }, 409);
      }

      const result = await env.DB.prepare(`
        UPDATE dd_affiliate_orders
        SET
          status = ?,
          approved_at = CASE
            WHEN ? = 'approved'
            THEN CURRENT_TIMESTAMP
            ELSE approved_at
          END
        WHERE order_id = ?
          AND status = 'pending'
      `)
        .bind(b.status, b.status, b.id)
        .run();

      return result.meta.changes
        ? reply({ ok: true })
        : reply({
            error: 'Commission changed; refresh'
          }, 409);
    }

    // PAYOUT MANAGEMENT
    if (b.action === 'payout') {
      if (
        !['approved', 'rejected', 'paid'].includes(b.status)
      ) {
        return reply({
          error: 'Invalid payout status'
        }, 400);
      }

      const row = await env.DB.prepare(`
        SELECT status
        FROM dd_affiliate_payouts
        WHERE id = ?
      `).bind(b.id).first();

      if (!row) {
        return reply({ error: 'Payout not found' }, 404);
      }

      if (
        (
          b.status === 'paid' &&
          row.status !== 'approved'
        ) ||
        (
          b.status !== 'paid' &&
          row.status !== 'requested'
        )
      ) {
        return reply({
          error: 'Invalid payout status transition'
        }, 409);
      }

      if (
        b.status === 'paid' &&
        !validText(b.note, 500)
      ) {
        return reply({
          error: 'Transfer reference required'
        }, 400);
      }

      if (b.status === 'paid') {
        await env.DB.batch([
          env.DB.prepare(`
            UPDATE dd_affiliate_payouts
            SET status = 'paid', note = ?
            WHERE id = ?
              AND status = 'approved'
          `).bind(b.note.trim(), b.id),

          env.DB.prepare(`
            UPDATE dd_affiliate_orders
            SET status = 'paid'
            WHERE status = 'approved'
              AND order_id IN (
                SELECT order_id
                FROM dd_affiliate_payout_orders
                WHERE payout_id = ?
              )
          `).bind(b.id)
        ]);

      } else {
        const result = await env.DB.prepare(`
          UPDATE dd_affiliate_payouts
          SET status = ?
          WHERE id = ?
            AND status = 'requested'
        `)
          .bind(b.status, b.id)
          .run();

        if (!result.meta.changes) {
          return reply({
            error: 'Payout changed; refresh'
          }, 409);
        }

        if (b.status === 'rejected') {
          await env.DB.prepare(`
            DELETE FROM dd_affiliate_payout_orders
            WHERE payout_id = ?
          `).bind(b.id).run();
        }
      }

      return reply({ ok: true });
    }

    return reply({ error: 'Unknown action' }, 400);

  } catch (e) {
    return fail(e);
  }
}
