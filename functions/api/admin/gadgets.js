import {allowed,originOK,reply,validText} from './_auth.js';
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database missing'},503);
 try{
  const b=await request.json();
  if(!validText(b.brand,40)||!validText(b.model,100)||typeof b.description!=='string'||b.description.length>1200||!Array.isArray(b.variants)||!b.variants.length||b.variants.length>30)return reply({error:'Invalid gadget fields'},400);
  const variants=b.variants.map(v=>{
   if(!validText(v.storage,60)||! /^[A-Za-z0-9 +./_-]+$/.test(v.storage)||typeof v.color!=='string'||v.color.length>60||!/^[A-Za-z0-9 +./_-]*$/.test(v.color)||!Number.isSafeInteger(v.price_centavos)||v.price_centavos<1||v.price_centavos>1000000000||!Number.isSafeInteger(v.stock)||v.stock<0||v.stock>100000||![0,1].includes(v.enabled))throw Error('Invalid variant values');
   return {...v,label:[v.storage.trim(),v.color.trim()].filter(Boolean).join(' / ')};
  });
  if(new Set(variants.map(v=>v.label.toLowerCase())).size!==variants.length)return reply({error:'Duplicate variants'},400);
  const id='custom-'+crypto.randomUUID();
  const name=b.brand.trim()+' '+b.model.trim();
  const stmts=[env.DB.prepare('INSERT INTO store_products(id,brand,model,description) VALUES(?,?,?,?)').bind(id,b.brand.trim(),b.model.trim(),b.description.trim())];
  for(const v of variants)stmts.push(env.DB.prepare('INSERT INTO store_variants(sku,name,variant,price_centavos,stock,enabled) VALUES(?,?,?,?,?,?)').bind(id+'::'+v.label,name,v.label,v.price_centavos,v.stock,v.enabled));
  await env.DB.batch(stmts);
  return reply({ok:true,id,name,variants:variants.length},201);
 }catch(e){return reply({error:e.message||'Could not add gadget'},400)}
}
