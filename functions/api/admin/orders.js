import {allowed,originOK,reply,validText} from './_auth.js';
import {priceCart} from '../_shared.js';
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
  const r=await env.DB.prepare(`SELECT o.id,o.status,o.total_centavos,o.customer_json,o.items_json,o.created_at,o.paid_at,
   m.source,m.fulfillment,m.payment_method,m.payment_status,m.shipping_note,m.notes
   FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id ORDER BY o.created_at DESC LIMIT 300`).all();
  return reply({orders:r.results||[]});
 }catch(e){return reply({error:'Run migration-v2.sql before using orders'},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
  const b=await request.json();
  if(b.action==='status'){
   if(!validText(b.id,100)||!['pending','confirmed','processing','shipped','delivered','cancelled'].includes(b.status)||!['unpaid','pending_verification','paid','refunded'].includes(b.payment_status))return reply({error:'Invalid status'},400);
   const existing=await env.DB.prepare('SELECT o.id,o.status,m.order_id FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id WHERE o.id=?').bind(b.id).first();
   if(!existing)return reply({error:'Order not found'},404);
   if(!existing.order_id)return reply({error:'Legacy order: manage payment through its original gateway. New dashboard statuses apply to V2 orders only.'},409);
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
