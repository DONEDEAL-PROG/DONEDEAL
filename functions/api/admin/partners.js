import {allowed,originOK,reply} from './_auth.js';
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'D1 not configured'},503);
 try{
 const [partners,payouts,orders]=await Promise.all([
 env.DB.prepare("SELECT id,name,email,social_url,status,referral_code,commission_bps,created_at FROM dd_affiliates ORDER BY created_at DESC LIMIT 500").all(),
 env.DB.prepare("SELECT p.*,a.name,a.email FROM dd_affiliate_payouts p JOIN dd_affiliates a ON a.id=p.affiliate_id ORDER BY p.created_at DESC LIMIT 300").all(),
 env.DB.prepare(`SELECT ao.order_id,ao.affiliate_id,ao.status,ao.commission_centavos,ao.commission_bps,o.status AS order_status,o.total_centavos,o.paid_at,m.payment_status,a.name FROM dd_affiliate_orders ao JOIN store_orders o ON o.id=ao.order_id LEFT JOIN store_order_meta m ON m.order_id=o.id JOIN dd_affiliates a ON a.id=ao.affiliate_id ORDER BY ao.created_at DESC LIMIT 300`).all()
 ]);
 return reply({partners:partners.results||[],payouts:payouts.results||[],orders:orders.results||[]});
 }catch{return reply({error:'Run database/migration-partner-hub.sql first'},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
 if(!env.DB)return reply({error:'D1 not configured'},503);
 try{
  if(b.action==='partner'){
   if(!['approved','rejected','suspended','pending'].includes(b.status)||!Number.isInteger(b.commission_bps)||b.commission_bps<0||b.commission_bps>10000)return reply({error:'Invalid status or commission rate'},400);
   await env.DB.prepare("UPDATE dd_affiliates SET status=?,commission_bps=?,approved_at=CASE WHEN ?='approved' THEN COALESCE(approved_at,CURRENT_TIMESTAMP) ELSE approved_at END WHERE id=?").bind(b.status,b.commission_bps,b.status,b.id).run();
  }else if(b.action==='commission'){
   const row=await env.DB.prepare(`SELECT ao.status,o.paid_at,o.status AS order_status,m.payment_status FROM dd_affiliate_orders ao JOIN store_orders o ON o.id=ao.order_id LEFT JOIN store_order_meta m ON m.order_id=o.id WHERE ao.order_id=?`).bind(b.id).first();
   if(!row||row.status!=='pending')return reply({error:'Only pending commissions can be reviewed'},409);
   if(!['approved','void'].includes(b.status))return reply({error:'Invalid action'},400);
   if(b.status==='approved'&&(!row.paid_at||row.payment_status!=='paid'||row.order_status==='cancelled'))return reply({error:'Payment must be confirmed paid and order not cancelled'},409);
   await env.DB.prepare("UPDATE dd_affiliate_orders SET status=?,approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE order_id=? AND status='pending'").bind(b.status,b.status,b.id).run();
  }else if(b.action==='payout'){
   if(!['approved','rejected','paid'].includes(b.status))return reply({error:'Invalid payout status'},400);
   const p=await env.DB.prepare('SELECT * FROM dd_affiliate_payouts WHERE id=?').bind(b.id).first();
   if(!p||!((p.status==='requested'&&['approved','rejected'].includes(b.status))||(p.status==='approved'&&b.status==='paid')))return reply({error:'Invalid payout transition'},409);
   if(b.status==='paid'&&(!String(b.note||'').trim()))return reply({error:'Enter payment reference or confirmation'},400);
   const stmts=[env.DB.prepare('UPDATE dd_affiliate_payouts SET status=?,note=?,processed_at=CURRENT_TIMESTAMP WHERE id=? AND status=?').bind(b.status,String(b.note||'').slice(0,300),b.id,p.status)];
   if(b.status==='rejected')stmts.push(env.DB.prepare('DELETE FROM dd_affiliate_payout_orders WHERE payout_id=?').bind(b.id));
   if(b.status==='paid')stmts.push(env.DB.prepare("UPDATE dd_affiliate_orders SET status='paid' WHERE order_id IN (SELECT order_id FROM dd_affiliate_payout_orders WHERE payout_id=?) AND status='approved'").bind(b.id));
   await env.DB.batch(stmts);
  }else return reply({error:'Unknown action'},400);
  return reply({ok:true});
 }catch(e){return reply({error:'Unable to save partner changes'},500)}
}
