import {allowed,originOK,reply} from './_auth.js';
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
  const {id,action}=await request.json();
  if(typeof id!=='string'||!/^custom-[0-9a-f-]{36}$/.test(id)||!['hide','show','delete'].includes(action))return reply({error:'Invalid request'},400);
  const product=await env.DB.prepare('SELECT id,brand,model FROM store_products WHERE id=?').bind(id).first();
  if(!product)return reply({error:'Custom gadget not found'},404);
  if(action==='hide'||action==='show'){
   const count=await env.DB.prepare('UPDATE store_variants SET enabled=?,updated_at=CURRENT_TIMESTAMP WHERE sku LIKE ?').bind(action==='show'?1:0,id+'::%').run();
   return reply({ok:true,action,changed:count.meta?.changes||0});
  }
  // Do not remove products with order history. Keep order records intact.
  const history=await env.DB.prepare('SELECT id FROM store_orders WHERE items_json LIKE ? LIMIT 1').bind('%'+id+'::%').first();
  if(history)return reply({error:'This gadget is referenced by an order. Use Hide instead to preserve order history.'},409);
  // Delete database records only; do not delete R2 images that might be shared.
  await env.DB.batch([
   env.DB.prepare('DELETE FROM store_product_images WHERE product_id=?').bind(id),
   env.DB.prepare('DELETE FROM store_variants WHERE sku LIKE ?').bind(id+'::%'),
   env.DB.prepare('DELETE FROM store_products WHERE id=?').bind(id)
  ]);
  return reply({ok:true,action:'delete'});
 }catch(e){return reply({error:'Unable to update gadget'},500)}
}
