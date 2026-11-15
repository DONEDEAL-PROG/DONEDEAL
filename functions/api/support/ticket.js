import {out,sameOrigin,valid,sha,token} from './_util.js';
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return out({error:'Invalid origin'},403);
 if(!env.DB)return out({error:'Support is unavailable'},503);
 if(!request.headers.get('content-type')?.includes('application/json'))return out({error:'Invalid request'},415);
 let b;try{b=await request.json()}catch{return out({error:'Invalid request'},400)}
 const name=b?.name?.trim(),email=b?.email?.trim(),subject=b?.subject?.trim(),message=b?.message?.trim();
 if(!valid(name,80)||!valid(email,160)||!/^\S+@\S+\.\S+$/.test(email)||!valid(subject,140)||!valid(message,2000))return out({error:'Check your name, email, subject and message'},400);
 const id='SUP-'+crypto.randomUUID(),access=token();
 try{
  await env.DB.batch([
   env.DB.prepare('INSERT INTO dd_support_tickets(id,access_hash,guest_name,guest_email,subject) VALUES(?,?,?,?,?)').bind(id,await sha(access),name,email,subject),
   env.DB.prepare("INSERT INTO dd_support_messages(id,ticket_id,sender,body) VALUES(?,?,'guest',?)").bind(crypto.randomUUID(),id,message)
  ]);
  return out({ok:true,id,access},201);
 }catch(e){console.error('Support ticket create failed',e);return out({error:'Support is temporarily unavailable. Check D1 migration.'},503)}
