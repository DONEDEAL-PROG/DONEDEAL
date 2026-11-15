import {out,sameOrigin,valid,verified} from './_util.js';
export async function onRequestGet({request,env}){
 if(!env.DB)return out({error:'Support unavailable'},503);
 const u=new URL(request.url),id=u.searchParams.get('id')||'',access=request.headers.get('X-Support-Access')||'';
 try{
  const ticket=await verified(env.DB,id,access);
  if(!ticket)return out({error:'Ticket not found or access denied'},404);
  const m=await env.DB.prepare('SELECT id,sender,body,created_at FROM dd_support_messages WHERE ticket_id=? ORDER BY created_at ASC LIMIT 500').bind(id).all();
  return out({ticket,messages:m.results||[]});
 }catch(e){console.error('Support read failed',e);return out({error:'Support unavailable'},503)}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return out({error:'Invalid origin'},403);
 if(!env.DB)return out({error:'Support unavailable'},503);
 let b;try{b=await request.json()}catch{return out({error:'Invalid request'},400)}
 const id=b?.id,access=b?.access,body=b?.message?.trim();
 if(!valid(body,2000))return out({error:'Message must be 1–2000 characters'},400);
 try{
  const ticket=await verified(env.DB,id,access);
  if(!ticket)return out({error:'Ticket not found or access denied'},404);
  if(ticket.status==='closed')return out({error:'This ticket is closed'},409);
  await env.DB.batch([
   env.DB.prepare("INSERT INTO dd_support_messages(id,ticket_id,sender,body) VALUES(?,?,'guest',?)").bind(crypto.randomUUID(),id,body),
   env.DB.prepare("UPDATE dd_support_tickets SET status='open',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id)
  ]);
  return out({ok:true});
 }catch(e){console.error('Support reply failed',e);return out({error:'Support unavailable'},503)}
}
