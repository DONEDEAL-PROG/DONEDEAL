import {respond,originOK,currentPartner,rand,clean} from './_auth.js';
export async function onRequestPost({request,env}){
 if(!originOK(request))return respond({error:'Invalid origin'},403);
 const user=await currentPartner(request,env);if(!user||user.status!=='approved')return respond({error:'Unauthorized'},401);
 let b;try{b=await request.json()}catch{return respond({error:'Invalid JSON'},400)}
 const method=clean(b.method,40),account=clean(b.account,160);
 if(!['GCash','Bank transfer'].includes(method)||account.length<5)return respond({error:'Provide GCash or bank transfer payout details'},400);
 const id=rand();
 try{
  // Claim all approved, unreserved order commissions atomically; one payout per order.
  const rows=await env.DB.prepare(`SELECT order_id,commission_centavos FROM dd_affiliate_orders WHERE affiliate_id=? AND status='approved' AND NOT EXISTS(SELECT 1 FROM dd_affiliate_payout_orders p WHERE p.order_id=dd_affiliate_orders.order_id)`).bind(user.id).all();
  const items=rows.results||[],total=items.reduce((s,x)=>s+x.commission_centavos,0);
  if(total<=0)return respond({error:'No approved commission available for withdrawal'},409);
  const queries=[
   env.DB.prepare('INSERT INTO dd_affiliate_payouts(id,affiliate_id,amount_centavos,method,account) VALUES(?,?,?,?,?)').bind(id,user.id,total,method,account),
   ...items.map(x=>env.DB.prepare('INSERT INTO dd_affiliate_payout_orders(order_id,payout_id) VALUES(?,?)').bind(x.order_id,id))
  ];
  await env.DB.batch(queries);
  return respond({ok:true,id,amount_centavos:total},201);
 }catch{return respond({error:'Payout request changed. Please refresh and retry.'},409)}
}
