import {respond,currentPartner} from './_auth.js';
function publicReferral(row){
 let customer={},items=[];
 try{customer=JSON.parse(row.customer_json||'{}')}catch{}
 try{items=JSON.parse(row.items_json||'[]')}catch{}
 const name=typeof customer.name==='string'?customer.name.trim().slice(0,100):'Customer';
 const gadgets=Array.isArray(items)?items.slice(0,20).map(i=>String(i.name||'Gadget').slice(0,120)):[];
 return {customer_name:name||'Customer',gadgets,created_at:row.created_at,order_status:row.order_status};
}
export async function onRequestGet({request,env}){
 const user=await currentPartner(request,env);
 if(!user||user.status!=='approved')return respond({error:'Please sign in'},401);
 try{
 const [visits,orders,payouts,referrals,totals]=await Promise.all([
 env.DB.prepare('SELECT COUNT(*) AS count FROM dd_affiliate_visits WHERE affiliate_id=?').bind(user.id).first(),
 env.DB.prepare('SELECT commission_centavos,status,created_at FROM dd_affiliate_orders WHERE affiliate_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all(),
 env.DB.prepare('SELECT id,amount_centavos,status,method,created_at FROM dd_affiliate_payouts WHERE affiliate_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all(),
 env.DB.prepare(`SELECT o.customer_json,o.items_json,o.created_at,o.status AS order_status FROM dd_affiliate_orders ao JOIN store_orders o ON o.id=ao.order_id WHERE ao.affiliate_id=? ORDER BY o.created_at DESC LIMIT 100`).bind(user.id).all(),
 env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN status='approved' THEN commission_centavos ELSE 0 END),0) AS available,COALESCE(SUM(CASE WHEN status='pending' THEN commission_centavos ELSE 0 END),0) AS pending,COALESCE(SUM(CASE WHEN status='paid' THEN commission_centavos ELSE 0 END),0) AS paid FROM dd_affiliate_orders WHERE affiliate_id=?`).bind(user.id).first()
 ]);
 // Never send customer_json, items_json, contact information, or order IDs to partners.
 const safeUser={name:user.name,email:user.email,referral_code:user.referral_code,commission_bps:user.commission_bps};
 return respond({user:safeUser,visits:visits?.count||0,orders:orders.results||[],payouts:payouts.results||[],referrals:(referrals.results||[]).map(publicReferral),totals});
 }catch(e){console.error('Partner dashboard failed',e);return respond({error:'Unable to load partner dashboard'},500)}
}
