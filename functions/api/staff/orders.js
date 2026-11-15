import {staffAuth,can,result,originOK,audit} from './_auth.js';
const methods=['cod','gcash','bank_transfer','cash'];
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=100;
const reasonOK=s=>typeof s==='string'&&s.trim().length>=5&&s.trim().length<=500;
async function order(env,id){
 return env.DB.prepare(`SELECT o.id,o.status,o.total_centavos,o.customer_json,o.items_json,o.created_at,o.paid_at,
 m.fulfillment,m.payment_method,m.payment_status,m.source,m.shipping_note,m.notes
 FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id WHERE o.id=?`).bind(id).first();
}
export async function onRequestGet({request,env}){
 try{
  const staff=await staffAuth(request,env);
  if(!staff)return result({error:'Unauthorized'},401);
  if(!can(staff,'orders_view'))return result({error:'Order viewing permission required'},403);
  const url=new URL(request.url),id=url.searchParams.get('id');
  if(id){
   if(!validId(id))return result({error:'Invalid order ID'},400);
   const o=await order(env,id);
   return o?result({order:o}):result({error:'Order not found'},404);
  }
  const q=(url.searchParams.get('q')||'').trim();
  if(q.length>100)return result({error:'Search too long'},400);
  const rows=await env.DB.prepare(`SELECT o.id,o.status,o.total_centavos,o.customer_json,o.created_at,
   m.fulfillment,m.payment_method,m.payment_status
   FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id
   WHERE (?='' OR o.id LIKE ? OR o.customer_json LIKE ?)
   ORDER BY o.created_at DESC LIMIT 100`).bind(q,'%'+q+'%','%'+q+'%').all();
  return result({orders:rows.results||[]});
 }catch(e){console.error('Staff order read failed',e);return result({error:'Order service unavailable'},503)}
}
export async function onRequestPatch({request,env}){
 if(!originOK(request))return result({error:'Invalid origin'},403);
 try{
  const staff=await staffAuth(request,env);
  if(!staff)return result({error:'Unauthorized'},401);
  let b;try{b=await request.json()}catch{return result({error:'Invalid JSON'},400)}
  if(!validId(b?.id)||!reasonOK(b?.reason))return result({error:'Order and reason (5-500 characters) required'},400);
  const o=await order(env,b.id);
  if(!o)return result({error:'Order not found'},404);
  if(!o.payment_method)return result({error:'Legacy orders must be handled by Admin'},409);
  if(['cancelled','delivered'].includes(o.status))return result({error:'Finalized orders cannot be edited'},409);
  if(b.action==='payment'){
   if(!can(staff,'payment_change'))return result({error:'Payment change permission required'},403);
   if(o.payment_status!=='unpaid'||!['pending','confirmed'].includes(o.status))return result({error:'Only unpaid pending/confirmed orders can change payment method'},409);
   if(!methods.includes(b.payment_method)||b.payment_method===o.payment_method)return result({error:'Choose a different supported payment method'},400);
   const r=await env.DB.prepare(`UPDATE store_order_meta SET payment_method=?,updated_at=CURRENT_TIMESTAMP
    WHERE order_id=? AND payment_status='unpaid' AND payment_method=?`).bind(b.payment_method,b.id,o.payment_method).run();
   if(!r.meta?.changes)return result({error:'Order changed; refresh'},409);
   await audit(env,'staff',staff.id,'order_payment_method',b.id,JSON.stringify({from:o.payment_method,to:b.payment_method,reason:b.reason.trim()}));
   return result({ok:true});
  }
  if(b.action==='cancel'){
   if(!can(staff,'orders_cancel'))return result({error:'Cancellation permission required'},403);
   if(!['pending','confirmed'].includes(o.status)||o.payment_status!=='unpaid')return result({error:'Only unpaid pending/confirmed orders can be cancelled by staff'},409);
   const r=await env.DB.prepare(`UPDATE store_orders SET status='cancelled' WHERE id=? AND status IN ('pending','confirmed')
    AND EXISTS (SELECT 1 FROM store_order_meta WHERE order_id=? AND payment_status='unpaid')`).bind(b.id,b.id).run();
   if(!r.meta?.changes)return result({error:'Order changed; refresh'},409);
   await audit(env,'staff',staff.id,'order_cancel',b.id,b.reason.trim());
   return result({ok:true});
  }
  if(b.action==='edit'){
   if(!can(staff,'orders_edit'))return result({error:'Order edit permission required'},403);
   if(!['pending','confirmed'].includes(o.status))return result({error:'Only pending/confirmed orders can be edited'},409);
   let customer;try{customer=JSON.parse(o.customer_json)}catch{return result({error:'Customer data unavailable'},409)}
   const name=String(b.name||'').trim(),phone=String(b.phone||'').trim(),address=String(b.address||'').trim();
   if(name.length<2||name.length>120||phone.length<3||phone.length>30||address.length>400||(o.fulfillment==='delivery'&&!address))return result({error:'Valid name, phone and delivery address required'},400);
   const next=JSON.stringify({...customer,name,phone,address});
   const r=await env.DB.prepare(`UPDATE store_orders SET customer_json=? WHERE id=? AND status IN ('pending','confirmed')`).bind(next,b.id).run();
   if(!r.meta?.changes)return result({error:'Order changed; refresh'},409);
   await audit(env,'staff',staff.id,'order_customer_edit',b.id,JSON.stringify({reason:b.reason.trim(),previous:{name:customer.name,phone:customer.phone,address:customer.address},updated:{name,phone,address}}));
   return result({ok:true});
  }
  return result({error:'Unknown action'},400);
 }catch(e){console.error('Staff order change failed',e);return result({error:'Order change unavailable'},503)}
}
export async function onRequestPost({request,env}){
 if(!originOK(request))return result({error:'Invalid origin'},403);
 try{
  const staff=await staffAuth(request,env);
  if(!staff)return result({error:'Unauthorized'},401);
  if(!can(staff,'refund_request'))return result({error:'Refund request permission required'},403);
  let b;try{b=await request.json()}catch{return result({error:'Invalid JSON'},400)}
  if(!validId(b?.id)||!reasonOK(b?.reason))return result({error:'Order and reason required'},400);
  const o=await order(env,b.id);
  if(!o)return result({error:'Order not found'},404);
  if(o.payment_status!=='paid')return result({error:'Refund requests require a paid order'},409);
  const pending=await env.DB.prepare(`SELECT id FROM dd_staff_refund_requests WHERE order_id=? AND status='pending'`).bind(b.id).first();
  if(pending)return result({error:'A refund request is already pending'},409);
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO dd_staff_refund_requests(id,order_id,staff_id,reason) VALUES(?,?,?,?)`).bind(id,b.id,staff.id,b.reason.trim()).run();
  await audit(env,'staff',staff.id,'refund_request',b.id,JSON.stringify({request_id:id,reason:b.reason.trim()}));
  return result({ok:true,id},201);
 }catch(e){console.error('Staff refund request failed',e);return result({error:'Refund service unavailable; run Phase 3 migration'},503)}
}
