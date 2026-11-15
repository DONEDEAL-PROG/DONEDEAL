import {allowed,originOK,reply} from './_auth.js';
import {audit} from '../staff/_auth.js';
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 try{
  const r=await env.DB.prepare(`SELECT r.*,s.display_name AS staff_name,o.total_centavos,o.status AS order_status,m.payment_status
   FROM dd_staff_refund_requests r JOIN dd_support_staff s ON s.id=r.staff_id
   JOIN store_orders o ON o.id=r.order_id LEFT JOIN store_order_meta m ON m.order_id=r.order_id
   ORDER BY r.created_at DESC LIMIT 200`).all();
  return reply({requests:r.results||[]});
 }catch(e){return reply({error:'Run database/migration-support-phase3.sql'},503)}
}
export async function onRequestPatch({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
 if(typeof b?.id!=='string'||!['approved','rejected'].includes(b.status)||typeof b.note!=='string'||b.note.trim().length<5||b.note.length>500)return reply({error:'Request, decision, and note (5-500 characters) required'},400);
 try{
  const r=await env.DB.prepare(`UPDATE dd_staff_refund_requests SET status=?,admin_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'`).bind(b.status,b.note.trim(),b.id).run();
  if(!r.meta?.changes)return reply({error:'Request already reviewed or missing'},409);
  await audit(env,'admin','admin','refund_review',b.id,JSON.stringify({status:b.status,note:b.note.trim()}));
  return reply({ok:true,message:'Decision recorded. Payment refund must be processed separately by Admin.'});
 }catch(e){return reply({error:'Unable to review request'},503)}
}
