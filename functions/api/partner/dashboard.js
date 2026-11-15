import {respond,currentPartner} from './_auth.js';
export async function onRequestGet({request,env}){
 const user=await currentPartner(request,env);
 if(!user||user.status!=='approved')return respond({error:'Please sign in'},401);
 const [visits,orders,payouts]=await Promise.all([
  env.DB.prepare('SELECT COUNT(*) AS count FROM dd_affiliate_visits WHERE affiliate_id=?').bind(user.id).first(),
  env.DB.prepare(`SELECT a.order_id,a.commission_centavos,a.status,a.created_at,o.total_centavos FROM dd_affiliate_orders a JOIN store_orders o ON o.id=a.order_id WHERE a.affiliate_id=? ORDER BY a.created_at DESC LIMIT 100`).bind(user.id).all(),
  env.DB.prepare('SELECT id,amount_centavos,status,method,created_at FROM dd_affiliate_payouts WHERE affiliate_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all()
 ]);
 const totals=await env.DB.prepare(`SELECT
 COALESCE(SUM(CASE WHEN status='approved' THEN commission_centavos ELSE 0 END),0) AS available,
 COALESCE(SUM(CASE WHEN status='pending' THEN commission_centavos ELSE 0 END),0) AS pending,
 COALESCE(SUM(CASE WHEN status='paid' THEN commission_centavos ELSE 0 END),0) AS paid
 FROM dd_affiliate_orders WHERE affiliate_id=?`).bind(user.id).first();
 return respond({user,visits:visits?.count||0,orders:orders.results||[],payouts:payouts.results||[],totals});
}
