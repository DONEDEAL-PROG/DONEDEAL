import {allowed,originOK,reply,validText} from './_auth.js';
import {priceCart} from '../_shared.js';
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
  const r=await env.DB.prepare(`SELECT o.id,o.status,o.total_centavos,o.customer_json,o.items_json,o.created_at,o.paid_at,
   m.source,m.fulfillment,m.payment_method,m.payment_status,m.shipping_note,m.notes,\n   p.pickup_code,p.pickup_status,p.claimant_name,p.verified_at,p.released_by,p.claimed_at
   FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id LEFT JOIN store_pickup_tracking p ON p.order_id=o.id ORDER BY o.created_at DESC LIMIT 300`).all();
  return reply({orders:r.results||[]});
 }catch(e){return reply({error:'Run migration-v2.sql before using orders'},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
  const b=await request.json();
  if(b.action==='pickup_init'){
   if(!validText(b.id,100))return reply({error:'Invalid order'},400);
   const row=await env.DB.prepare(`SELECT o.status,m.fulfillment FROM store_orders o JOIN store_order_meta m ON m.order_id=o.id WHERE o.id=?`).bind(b.id).first();
   if(!row||row.fulfillment!=='pickup')return reply({error:'Not a pickup order'},404);
   const code='PK-'+crypto.randomUUID().slice(0,8).toUpperCase();
   await env.DB.prepare('INSERT OR IGNORE INTO store_pickup_tracking(order_id,pickup_code) VALUES(?,?)').bind(b.id,code).run();
   return reply({ok:true});
  }
  if(b.action==='pickup'){
   if(!validText(b.id,100)||!['confirmed','preparing','ready','claimed','cancelled'].includes(b.pickup_status))return reply({error:'Invalid pickup request'},400);
   const order=await env.DB.prepare(`SELECT o.status,m.fulfillment,m.payment_status,p.pickup_status,p.pickup_code
     FROM store_orders o JOIN store_order_meta m ON m.order_id=o.id
     LEFT JOIN store_pickup_tracking p ON p.order_id=o.id WHERE o.id=?`).bind(b.id).first();
   if(!order||order.fulfillment!=='pickup')return reply({error:'Pickup order not found'},404);
   if(['delivered','cancelled'].includes(order.status)||['claimed','cancelled'].includes(order.pickup_status))return reply({error:'Finalized orders are locked'},409);
   const steps=['pending','confirmed','preparing','ready','claimed'];
   const current=order.pickup_status||'pending';
   if(b.pickup_status!=='cancelled'&&steps.indexOf(b.pickup_status)!==steps.indexOf(current)+1)return reply({error:'Complete pickup stages in order'},409);
   const claimant=String(b.claimant_name||'').trim(),releasedBy=String(b.released_by||'').trim(),code=String(b.pickup_code||'').trim();
   if(b.pickup_status==='claimed'){
    if(order.payment_status!=='paid')return reply({error:'Mark payment as paid before release'},409);
    if(!validText(claimant,120)||!validText(releasedBy,120)||code!==order.pickup_code)return reply({error:'Valid pickup code, claimant and releasing staff are required'},400);
    if(!b.release_confirmed)return reply({error:'Confirm physical gadget release'},400);
   }
   if(!order.pickup_code){
    const newCode='PK-'+crypto.randomUUID().slice(0,8).toUpperCase();
    await env.DB.prepare(`INSERT OR IGNORE INTO store_pickup_tracking(order_id,pickup_code) VALUES(?,?)`).bind(b.id,newCode).run();
   }
   const nextOrderStatus=b.pickup_status==='claimed'?'delivered':b.pickup_status==='cancelled'?'cancelled':b.pickup_status==='confirmed'?'confirmed':'processing';
   await env.DB.batch([
    env.DB.prepare(`UPDATE store_pickup_tracking SET pickup_status=?,claimant_name=CASE WHEN ?='claimed' THEN ? ELSE claimant_name END,
    released_by=CASE WHEN ?='claimed' THEN ? ELSE released_by END,
    verified_at=CASE WHEN ?='claimed' THEN CURRENT_TIMESTAMP ELSE verified_at END,
    claimed_at=CASE WHEN ?='claimed' THEN CURRENT_TIMESTAMP ELSE claimed_at END,updated_at=CURRENT_TIMESTAMP WHERE order_id=?`)
    .bind(b.pickup_status,b.pickup_status,claimant,b.pickup_status,releasedBy,b.pickup_status,b.pickup_status,b.id),
    env.DB.prepare('UPDATE store_orders SET status=? WHERE id=?').bind(nextOrderStatus,b.id)
   ]);
   return reply({ok:true});
  }
  if(b.action==='status'){
   if(!validText(b.id,100)||!['pending','confirmed','processing','shipped','delivered','cancelled'].includes(b.status)||!['unpaid','pending_verification','paid','refunded'].includes(b.payment_status))return reply({error:'Invalid status'},400);
   const existing=await env.DB.prepare('SELECT o.id,o.status,m.order_id FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id WHERE o.id=?').bind(b.id).first();
   if(!existing)return reply({error:'Order not found'},404);
   if(!existing.order_id)return reply({error:'Legacy order: manage payment through its original gateway. New dashboard statuses apply to V2 orders only.'},409);
   const pickup=await env.DB.prepare('SELECT fulfillment FROM store_order_meta WHERE order_id=?').bind(b.id).first();
   if(pickup?.fulfillment==='pickup'&&b.status!==existing.status)return reply({error:'Use the Pickup Workflow controls to update pickup status'},409);
   if(existing.status==='delivered'&&b.status!=='delivered')return reply({error:'Delivered orders are final and cannot be reopened.'},409);
   if(existing.status==='cancelled'&&b.status!=='cancelled')return reply({error:'Cancelled orders cannot be reopened; create a new order instead.'},409);
   await env.DB.batch([
    env.DB.prepare('UPDATE store_orders SET status=?,paid_at=CASE WHEN ? = ? THEN COALESCE(paid_at,CURRENT_TIMESTAMP) ELSE paid_at END WHERE id=?').bind(b.status,b.payment_status,'paid',b.id),
    env.DB.prepare(`UPDATE store_order_meta SET payment_status=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(b.payment_status,b.id)
   ]);
   return reply({ok:true});
  }
  if(b.action!=='manual')return reply({error:'Unknown action'},400);
  const c=b.customer||{};
  if(!validText(c.name,120)||!validText(c.phone,30)||!['delivery','pickup'].includes(b.fulfillment)||!['cod','gcash','bank_transfer','cash'].includes(b.payment_method))return reply({error:'Customer, fulfillment or payment invalid'},400);
  if(b.fulfillment==='delivery'&&!validText(c.address,400))return reply({error:'Delivery address required'},400);
  const q=await priceCart(env.DB,b.items);
  const id='DD-'+crypto.randomUUID(),now=new Date().toISOString();
  await env.DB.batch([
   ...q.items.map(item=>env.DB.prepare(`UPDATE store_variants SET stock=CASE WHEN enabled=1 AND NOT EXISTS (SELECT 1 FROM store_gadget_visibility AS g WHERE g.product_id=substr(store_variants.sku,1,instr(store_variants.sku,'::')-1) AND g.enabled=0) THEN stock-? ELSE -1 END WHERE sku=?`).bind(item.quantity,item.sku)),
   env.DB.prepare('INSERT INTO store_orders(id,status,total_centavos,customer_json,items_json,created_at) VALUES(?,?,?,?,?,?)').bind(id,'pending',q.total,JSON.stringify(c),JSON.stringify(q.items),now),
   env.DB.prepare(`INSERT INTO store_order_meta(order_id,source,fulfillment,payment_method,payment_status,shipping_note,notes) VALUES(?,'manual',?,?, 'unpaid',?,?)`).bind(id,b.fulfillment,b.payment_method,b.fulfillment==='delivery'?'Shipping fee to be confirmed':'Pickup arrangements to be confirmed',String(b.notes||'').slice(0,1000)),
   env.DB.prepare('INSERT INTO store_order_reservations(order_id) VALUES(?)').bind(id)
  ]);
  return reply({ok:true,id},201);
 }catch(e){return reply({error:e.message||'Could not save order'},400)}
}
