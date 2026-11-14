import {allowed,originOK,reply,validText} from './_auth.js';
const idOK=id=>typeof id==='string'&&/^(?:[A-Za-z]+-\d+|custom-[0-9a-f-]{36})$/.test(id);
const storageOK=s=>validText(s,120)&&/^[A-Za-z0-9 +./_-]+$/.test(s);
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 try{
  const b=await request.json();
  if(!idOK(b.product_id))return reply({error:'Invalid gadget'},400);
  if(b.action==='gadget'){
   if(![0,1].includes(b.enabled))return reply({error:'Invalid status'},400);
   const exists=await env.DB.prepare('SELECT sku FROM store_variants WHERE sku LIKE ? LIMIT 1').bind(b.product_id+'::%').first();
   if(!exists)return reply({error:'Gadget not found'},404);
   await env.DB.prepare('INSERT INTO store_gadget_visibility(product_id,enabled) VALUES(?,?) ON CONFLICT(product_id) DO UPDATE SET enabled=excluded.enabled').bind(b.product_id,b.enabled).run();
   return reply({ok:true});
  }
  if(b.action==='create'){
   if(!storageOK(b.storage)||!Number.isSafeInteger(b.price_centavos)||b.price_centavos<1||b.price_centavos>1000000000||!Number.isSafeInteger(b.stock)||b.stock<0||b.stock>100000)return reply({error:'Invalid storage, price or stock'},400);
   const sku=b.product_id+'::'+b.storage.trim();
   const existing=await env.DB.prepare('SELECT name FROM store_variants WHERE sku LIKE ? LIMIT 1').bind(b.product_id+'::%').first();
   if(!existing)return reply({error:'Gadget not found'},404);
   await env.DB.prepare('INSERT INTO store_variants(sku,name,variant,price_centavos,stock,enabled) VALUES(?,?,?,?,?,0)').bind(sku,existing.name,b.storage.trim(),b.price_centavos,b.stock).run();
   return reply({ok:true,sku,enabled:0},201);
  }
  if(['inspect_gadget','delete_gadget'].includes(b.action)){
   const rows=await env.DB.prepare('SELECT sku FROM store_variants WHERE sku LIKE ?').bind(b.product_id+'::%').all();
   if(!rows.results?.length)return reply({error:'Gadget not found'},404);
   const stats=await env.DB.prepare(`SELECT COUNT(DISTINCT o.id) AS total,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('delivered','cancelled') THEN 1 ELSE 0 END),0) AS active
    FROM store_orders o WHERE EXISTS(SELECT 1 FROM json_each(o.items_json) j
     WHERE json_extract(j.value,'$.sku') LIKE ?)`).bind(b.product_id+'::%').first();
   const total=Number(stats?.total||0),active=Number(stats?.active||0);
   if(b.action==='inspect_gadget')return reply({ok:true,total,active,variants:rows.results.length});
   if(active)return reply({error:'This gadget has '+active+' active order(s). Deactivate the gadget until orders are delivered or cancelled.',total,active},409);
   // Delete variants only if no active order refers to any of them.
   const removed=await env.DB.prepare(`DELETE FROM store_variants
     WHERE sku LIKE ? AND NOT EXISTS(
       SELECT 1 FROM store_orders o WHERE o.status NOT IN ('delivered','cancelled')
       AND EXISTS(SELECT 1 FROM json_each(o.items_json) j
         WHERE json_extract(j.value,'$.sku') LIKE ?)
     )`).bind(b.product_id+'::%',b.product_id+'::%').run();
   if(!removed.meta?.changes)return reply({error:'Deletion blocked by an active order or already deleted'},409);
   await env.DB.batch([
    env.DB.prepare('DELETE FROM store_gadget_visibility WHERE product_id=?').bind(b.product_id),
    env.DB.prepare('DELETE FROM store_product_images WHERE product_id=?').bind(b.product_id),
    env.DB.prepare('DELETE FROM store_products WHERE id=?').bind(b.product_id)
   ]);
   return reply({ok:true,deleted:true,total,variants:removed.meta.changes});
  }
  if(['inspect','delete'].includes(b.action)){
   if(typeof b.sku!=='string'||!b.sku.startsWith(b.product_id+'::')||b.sku.length>150)return reply({error:'Invalid variant'},400);
   const existing=await env.DB.prepare('SELECT sku,variant FROM store_variants WHERE sku=?').bind(b.sku).first();
   if(!existing)return reply({error:'Variant not found'},404);
   const stats=await env.DB.prepare(`SELECT COUNT(*) AS total,
     COALESCE(SUM(CASE WHEN o.status NOT IN ('delivered','cancelled') THEN 1 ELSE 0 END),0) AS active
     FROM store_orders o WHERE EXISTS(
      SELECT 1 FROM json_each(o.items_json) j
      WHERE json_extract(j.value,'$.sku')=?)`).bind(b.sku).first();
   const total=Number(stats?.total||0),active=Number(stats?.active||0);
   if(b.action==='inspect')return reply({ok:true,total,active,variant:existing.variant});
   if(active)return reply({error:'This variant has '+active+' active order(s). Deactivate it instead; deletion is blocked until orders are delivered or cancelled.',total,active},409);
   // Recheck active orders inside DELETE to guard against checkout races.
   const deleted=await env.DB.prepare(`DELETE FROM store_variants WHERE sku=? AND NOT EXISTS (
     SELECT 1 FROM store_orders o WHERE o.status NOT IN ('delivered','cancelled')
     AND EXISTS(SELECT 1 FROM json_each(o.items_json) j WHERE json_extract(j.value,'$.sku')=store_variants.sku)
   )`).bind(b.sku).run();
   if(!deleted.meta?.changes)return reply({error:'Deletion blocked by an active order. Refresh and deactivate instead.'},409);
   return reply({ok:true,deleted:true,total});
  }
  if(b.action==='rename'){
   if(!storageOK(b.storage)||typeof b.sku!=='string'||!b.sku.startsWith(b.product_id+'::'))return reply({error:'Invalid variant'},400);
   const old=await env.DB.prepare('SELECT * FROM store_variants WHERE sku=?').bind(b.sku).first();
   if(!old)return reply({error:'Variant not found'},404);
   const newSku=b.product_id+'::'+b.storage.trim();
   if(newSku===b.sku)return reply({ok:true,sku:b.sku});
   // Preserve old SKU for order history, but retire it from sales.
   // Renaming a variant with reserved orders is blocked to keep cancellation restocks accurate.
   const reserved=await env.DB.prepare(`SELECT o.id FROM store_orders o WHERE o.status NOT IN ('delivered','cancelled') AND EXISTS(SELECT 1 FROM json_each(o.items_json) j WHERE json_extract(j.value,'$.sku')=?) LIMIT 1`).bind(b.sku).first();
   if(reserved)return reply({error:'This storage has an active order. Deactivate it and add a new storage variant instead.'},409);
   await env.DB.batch([
    env.DB.prepare('UPDATE store_variants SET stock=0,enabled=0,updated_at=CURRENT_TIMESTAMP WHERE sku=?').bind(b.sku),
    env.DB.prepare('INSERT INTO store_variants(sku,name,variant,price_centavos,stock,enabled) VALUES(?,?,?,?,?,0)').bind(newSku,old.name,b.storage.trim(),old.price_centavos,old.stock)
   ]);
   return reply({ok:true,sku:newSku,enabled:0},201);
  }
  return reply({error:'Unknown action'},400);
 }catch(e){
  if(/UNIQUE constraint failed/i.test(String(e)))return reply({error:'That storage variant already exists'},409);
  console.error('Variant management failed',e);
  return reply({error:'Unable to save variant'},500);
 }
}
