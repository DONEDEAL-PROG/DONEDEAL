import {respond,currentPartner,originOK,rand} from './_auth.js';
async function partner(request,env){const p=await currentPartner(request,env);return p?.status==='approved'?p:null}
export async function onRequestGet({request,env}){
 const p=await partner(request,env);if(!p)return respond({error:'Unauthorized'},401);
 try{const r=await env.DB.prepare('SELECT id,sender,body,created_at FROM dd_partner_messages WHERE affiliate_id=? ORDER BY created_at ASC LIMIT 200').bind(p.id).all();return respond({messages:r.results||[]})}
 catch(e){console.error('Partner messages load failed',e);return respond({error:'Messaging unavailable. Apply the partner messages D1 migration.'},503)}
}
export async function onRequestPost({request,env}){
 if(!originOK(request))return respond({error:'Invalid origin'},403);
 const p=await partner(request,env);if(!p)return respond({error:'Unauthorized'},401);
 let b;try{b=await request.json()}catch{return respond({error:'Invalid JSON'},400)}
 const message=typeof b.message==='string'?b.message.trim():'';
 if(!message||message.length>2000)return respond({error:'Message must be 1–2000 characters'},400);
 try{await env.DB.prepare("INSERT INTO dd_partner_messages(id,affiliate_id,sender,body) VALUES(?,?,'partner',?)").bind(rand(),p.id,message).run();return respond({ok:true},201)}
 catch(e){console.error('Partner message failed',e);return respond({error:'Messaging unavailable. Apply the partner messages D1 migration.'},503)}
}
