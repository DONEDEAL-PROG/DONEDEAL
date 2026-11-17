export const normPhone=v=>String(v||'').replace(/[^0-9]/g,'').replace(/^63(?=9[0-9]{9}$)/,'0');
export const canCancel=o=>['pending','confirmed'].includes(o.status)&&o.payment_status==='unpaid'&&!o.paid_at&&(!o.pickup_status||['pending','confirmed'].includes(o.pickup_status));
export const cancelCondition=`status IN ('pending','confirmed') AND paid_at IS NULL
 AND EXISTS(SELECT 1 FROM store_order_meta m WHERE m.order_id=store_orders.id AND m.payment_status='unpaid')
 AND NOT EXISTS(SELECT 1 FROM store_pickup_tracking p WHERE p.order_id=store_orders.id AND p.pickup_status NOT IN ('pending','confirmed'))`;
