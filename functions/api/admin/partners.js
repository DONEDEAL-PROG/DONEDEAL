
import { allowed, originOK, reply, validText } from './_auth.js';

const partnerStatuses = [
  'pending',
  'approved',
  'rejected',
  'suspended'
];

function serverError(error) {
  console.error('Partner management API:', error);

  return reply({
    error: 'Partner management database error. Check Cloudflare Pages Functions logs.'
  }, 500);
}

export async function onRequestGet({ request, env }) {
  if (!(await allowed(request, env))) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!env.DB) {
    return reply({ error: 'D1 database binding missing' }, 503);
  }

  try {
    const [partners, orders, payouts] = await Promise.all([
      env.DB.prepare(`
        SELECT
          id,
          name,
          email,
          social_url,
          status,
          referral_code,
          commission_bps,
          created_at
        FROM dd_affiliates
        ORDER BY created_at DESC
        LIMIT 300
      `).all(),

      env.DB.prepare(`
        SELECT
          ao.order_id,
          ao.affiliate_id,
          ao.commission_bps,
          ao.commission_centavos,
          ao.status,
          ao.created_at,
          a.name,
          o.total_centavos,
          o.paid_at,
          m.payment_status
        FROM dd_affiliate_orders AS ao
        JOIN dd_affiliates AS a
          ON a.id = ao.affiliate_id
        JOIN store_orders AS o
          ON o.id = ao.order_id
        LEFT JOIN store_order_meta AS m
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
        FROM dd_affiliate_payouts AS p
        JOIN dd_affiliates AS a
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
  } catch (error) {
    return serverError(error);
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await allowed(request, env))) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  if (!originOK(request)) {
    return reply({ error: 'Invalid request origin' }, 403);
  }

  if (!env.DB) {
    return reply({ error: 'D1 database binding missing' }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Invalid JSON request' }, 400);
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !validText(body.id, 100)
  ) {
    return reply({ error: 'Invalid request ID' }, 400);
  }

  try {
    // Partner approval and commission rate
    if (body.action === 'partner') {
      if (
        !partnerStatuses.includes(body.status) ||
        !Number.isInteger(body.commission_bps) ||
        body.commission_bps < 0 ||
        body.commission_bps > 10000
      ) {
        return reply({
          error: 'Invalid partner status or commission rate'
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
          body.status,
          body.commission_bps,
          body.status,
          body.id
        )
        .run();

      if (!result.meta.changes) {
        return reply({ error: 'Partner not found' }, 404);
      }

      return reply({ ok: true });
    }

    // Commission approval or void
    if (body.action === 'commission') {
      if (!['approved', 'void'].includes(body.status)) {
        return reply({
          error: 'Invalid commission status'
        }, 400);
      }

      const order = await env.DB.prepare(`
        SELECT
          ao.status,
          o.status AS order_status,
          o.paid_at,
          m.payment_status
        FROM dd_affiliate_orders AS ao
        JOIN store_orders AS o
          ON o.id = ao.order_id
        LEFT JOIN store_order_meta AS m
          ON m.order_id = o.id
        WHERE ao.order_id = ?
      `)
        .bind(body.id)
        .first();

      if (!order) {
        return reply({ error: 'Commission not found' }, 404);
      }

      if (order.status !== 'pending') {
        return reply({
          error: 'Only pending commissions can be changed'
        }, 409);
      }

      if (body.status === 'approved') {
        const cancelled = [
          'cancelled',
          'canceled'
        ].includes(order.order_status);

        const unpaid =
          (!order.paid_at &&
            order.payment_status !== 'paid') ||
          (order.payment_status &&
            order.payment_status !== 'paid');

        if (cancelled || unpaid) {
          return reply({
            error: 'Order must be paid and not cancelled before commission approval'
          }, 409);
        }
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
        .bind(body.status, body.status, body.id)
        .run();

      if (!result.meta.changes) {
        return reply({
          error: 'Commission already updated. Refresh the page.'
        }, 409);
      }

      return reply({ ok: true });
    }

    // Payout approval, rejection and payment
    if (body.action === 'payout') {
      if (
        !['approved', 'rejected', 'paid'].includes(body.status)
      ) {
        return reply({
          error: 'Invalid payout status'
        }, 400);
      }

      const payout = await env.DB.prepare(`
        SELECT status
        FROM dd_affiliate_payouts
        WHERE id = ?
      `)
        .bind(body.id)
        .first();

      if (!payout) {
        return reply({ error: 'Payout not found' }, 404);
      }

      const expectedStatus =
        body.status === 'paid' ? 'approved' : 'requested';

      if (payout.status !== expectedStatus) {
        return reply({
          error: 'Invalid payout status transition'
        }, 409);
      }

      if (body.status === 'paid') {
        if (!validText(body.note, 500)) {
          return reply({
            error: 'Transfer reference is required'
          }, 400);
        }

        await env.DB.batch([
          env.DB.prepare(`
            UPDATE dd_affiliate_payouts
            SET
              status = 'paid',
              note = ?
            WHERE id = ?
              AND status = 'approved'
          `).bind(body.note.trim(), body.id),

          env.DB.prepare(`
            UPDATE dd_affiliate_orders
            SET status = 'paid'
            WHERE status = 'approved'
              AND order_id IN (
                SELECT order_id
                FROM dd_affiliate_payout_orders
                WHERE payout_id = ?
              )
          `).bind(body.id)
        ]);

        return reply({ ok: true });
      }

      const result = await env.DB.prepare(`
        UPDATE dd_affiliate_payouts
        SET status = ?
        WHERE id = ?
          AND status = 'requested'
      `)
        .bind(body.status, body.id)
        .run();

      if (!result.meta.changes) {
        return reply({
          error: 'Payout already updated. Refresh the page.'
        }, 409);
      }

      if (body.status === 'rejected') {
        await env.DB.prepare(`
          DELETE FROM dd_affiliate_payout_orders
          WHERE payout_id = ?
        `)
          .bind(body.id)
          .run();
      }

      return reply({ ok: true });
    }

    return reply({ error: 'Unknown action' }, 400);
  } catch (error) {
    return serverError(error);
  }
}
