import {allowed,originOK,reply} from './_auth.js';
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 const id=new URL(request.url).searchParams.get('id');
 try{
  if(id){
   if(!/^SUP-[0-9a-f-]{36}$/i.test(id))return reply({error:'Invalid ticket'},400);
   const ticket=await env.DB.prepare('SELECT id,guest_name,guest_email,subject,status,created_at FROM dd_support_tickets WHERE id=?').bind(id).first();
   if(!ticket)return reply({error:'Ticket not found'},404);
   const messages=await env.DB.prepare('SELECT id,sender,body,created_at FROM dd_support_messages WHERE ticket_id=? ORDER BY created_at ASC LIMIT 500').bind(id).all();
   return reply({ticket,messages:messages.results||[]});
  }
  const tickets=await env.DB.prepare('SELECT id,guest_name,guest_email,subject,status,created_at,updated_at FROM dd_support_tickets ORDER BY updated_at DESC LIMIT 200').all();
  return reply({tickets:tickets.results||[]});
 }catch(e){console.error('Admin support read failed',e);return reply({error:'Support unavailable; run migration'},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid request'},400)}
 if(!/^SUP-[0-9a-f-]{36}$/i.test(b?.id||''))return reply({error:'Invalid ticket'},400);
 const body=typeof b?.message==='string'?b.message.trim():'';
 if(!body||body.length>2000)return reply({error:'Message must be 1–2000 characters'},400);
 try{
  const ticket=await env.DB.prepare('SELECT status FROM dd_support_tickets WHERE id=?').bind(b.id).first();
  if(!ticket)return reply({error:'Ticket not found'},404);
  if(ticket.status==='closed')return reply({error:'Ticket closed'},409);
  await env.DB.batch([
   env.DB.prepare("INSERT INTO dd_support_messages(id,ticket_id,sender,body) VALUES(?,?,'agent',?)").bind(crypto.randomUUID(),b.id,body),
   env.DB.prepare("UPDATE dd_support_tickets SET status='pending',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(b.id)
  ]);
  return reply({ok:true});
 }catch(e){console.error('Admin support reply failed',e);return reply({error:'Support unavailable'},503)}
}
export async function onRequestPatch({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid request'},400)}
 if(!/^SUP-[0-9a-f-]{36}$/i.test(b?.id||'')||!['open','pending','closed'].includes(b?.status))return reply({error:'Invalid request'},400);
 try{
  const result=await env.DB.prepare('UPDATE dd_support_tickets SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.status,b.id).run();
  if(!result.meta?.changes)return reply({error:'Ticket not found'},404);
  return reply({ok:true});
 }catch(e){console.error('Support status failed',e);return reply({error:'Support unavailable'},503)}
}
