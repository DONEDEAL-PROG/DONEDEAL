import {allowed,originOK,reply,validText} from './_auth.js';
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ');
const validPrice=p=>Number.isSafeInteger(p)&&p>=1&&p<=1000000000;
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 try{
  const [prices,products]=await Promise.all([
   env.DB.prepare('SELECT device_name,variant,price_centavos,updated_at FROM dd_master_prices ORDER BY device_name,variant').all(),
   env.DB.prepare('SELECT DISTINCT name AS device_name,variant FROM store_variants ORDER BY name,variant').all()
  ]);
  return reply({prices:prices.results||[],products:products.results||[]});
 }catch(e){return reply({error:'Run database/migration-master-price-ledger.sql in Cloudflare D1 first.'},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 try{
  const b=await request.json();
  const name=normalize(b.device_name),variant=normalize(b.variant),price=b.price_centavos;
  if(!validText(name,150)||!validText(variant,120)||!validPrice(price))return reply({error:'Enter a valid device, variant and price'},400);
  const old=await env.DB.prepare('SELECT price_centavos FROM dd_master_prices WHERE device_name=? COLLATE NOCASE AND variant=? COLLATE NOCASE').bind(name,variant).first();
  // All changes in one D1 transaction. Only current inventory prices are changed; old orders retain recorded amounts.
  await env.DB.batch([
   env.DB.prepare(`INSERT INTO dd_master_prices(device_name,variant,price_centavos,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(device_name,variant) DO UPDATE SET price_centavos=excluded.price_centavos,updated_at=CURRENT_TIMESTAMP`).bind(name,variant,price),
   env.DB.prepare(`UPDATE store_variants SET price_centavos=?,updated_at=CURRENT_TIMESTAMP
    WHERE lower(trim(name))=lower(?) AND lower(trim(variant))=lower(?)`).bind(price,name,variant),
   env.DB.prepare('INSERT INTO dd_master_price_history(device_name,variant,old_price_centavos,new_price_centavos) VALUES(?,?,?,?)').bind(name,variant,old?.price_centavos??null,price)
  ]);
  return reply({ok:true,locked:true,price_centavos:price});
 }catch(e){return reply({error:e.message||'Unable to save master price'},400)}
}
