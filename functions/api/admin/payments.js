import {allowed,originOK,reply,validText} from './_auth.js';

export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
 const orders=await env.DB.prepare(`SELECT o.id,o.status,o.total_centavos,o.customer_json,o.created_at,o.paid_at,m.source,m.payment_method,m.payment_status,m.fulfillment FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id ORDER BY o.created_at DESC LIMIT 300`).all();
 const audit=await env.DB.prepare(`SELECT id,order_id,old_method,new_method,old_status,new_status,reason,changed_at FROM store_payment_audit ORDER BY id DESC LIMIT 150`).all();
 return reply({orders:orders.results||[],audit:audit.results||[]});
 }catch(e){return reply({error:'Payment audit migration required: run database/migration-payment-audit.sql',detail:String(e.message||e)},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database missing'},503);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
 const methods=['cod','gcash','bank_transfer','card','cash'];
 const statuses=['unpaid','pending_verification','paid','refunded'];
 if(!validText(b.id,100)||!methods.includes(b.payment_method)||!statuses.includes(b.payment_status)||!validText(b.reason,500))return reply({error:'Order, valid method/status, and reason are required'},400);
 try{
 const o=await env.DB.prepare(`SELECT m.payment_method,m.payment_status,o.status FROM store_order_meta m JOIN store_orders o ON o.id=m.order_id WHERE m.order_id=?`).bind(b.id).first();
 if(!o)return reply({error:'Order not found or legacy gateway-managed order'},404);
 if(o.payment_method===b.payment_method&&o.payment_status===b.payment_status)return reply({error:'No changes to save'},400);
 if(o.status==='cancelled'&&b.payment_status==='paid')return reply({error:'Cannot mark a cancelled order as paid'},409);
 await env.DB.batch([
 env.DB.prepare(`UPDATE store_order_meta SET payment_method=?,payment_status=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(b.payment_method,b.payment_status,b.id),
 env.DB.prepare(`UPDATE store_orders SET paid_at=CASE WHEN ?='paid' THEN COALESCE(paid_at,CURRENT_TIMESTAMP) ELSE NULL END WHERE id=?`).bind(b.payment_status,b.id),
 env.DB.prepare(`INSERT INTO store_payment_audit(order_id,old_method,new_method,old_status,new_status,reason) VALUES(?,?,?,?,?,?)`).bind(b.id,o.payment_method,b.payment_method,o.payment_status,b.payment_status,b.reason.trim())
 ]);
 return reply({ok:true});
 }catch(e){return reply({error:String(e.message||e)},500)}
}
