import {staffAuth,can,result,originOK,audit} from './_auth.js';
const ticketOK=id=>typeof id==='string'&&/^SUP-[0-9a-f-]{36}$/i.test(id);
export async function onRequestGet({request,env}){
 try{
 const staff=await staffAuth(request,env);if(!staff)return result({error:'Unauthorized'},401);
 if(!can(staff,'chat_reply')&&!can(staff,'ticket_assign'))return result({error:'Permission denied'},403);
 const id=new URL(request.url).searchParams.get('id');
 if(id){
 if(!ticketOK(id))return result({error:'Invalid ticket'},400);
 const ticket=await env.DB.prepare(`SELECT t.id,t.guest_name,t.guest_email,t.subject,t.status,t.created_at,a.staff_id AS assigned_to FROM dd_support_tickets t LEFT JOIN dd_support_assignments a ON a.ticket_id=t.id WHERE t.id=?`).bind(id).first();
 if(!ticket)return result({error:'Ticket not found'},404);
 const rows=await env.DB.prepare('SELECT id,sender,body,created_at FROM dd_support_messages WHERE ticket_id=? ORDER BY created_at ASC LIMIT 500').bind(id).all();
 return result({ticket,messages:rows.results||[]});
 }
 const rows=await env.DB.prepare(`SELECT t.id,t.guest_name,t.subject,t.status,t.updated_at,a.staff_id AS assigned_to FROM dd_support_tickets t LEFT JOIN dd_support_assignments a ON a.ticket_id=t.id ORDER BY t.updated_at DESC LIMIT 200`).all();
 return result({tickets:rows.results||[]});
 }catch(e){console.error('Staff inbox failed',e);return result({error:'Support unavailable; check Phase 2 migration'},503)}
}
export async function onRequestPost({request,env}){
 if(!originOK(request))return result({error:'Invalid origin'},403);
 try{
 const staff=await staffAuth(request,env);if(!staff)return result({error:'Unauthorized'},401);
 if(!can(staff,'chat_reply'))return result({error:'Reply permission required'},403);
 let b;try{b=await request.json()}catch{return result({error:'Invalid JSON'},400)}
 const body=typeof b?.message==='string'?b.message.trim():'';
 if(!ticketOK(b?.id)||!body||body.length>2000)return result({error:'Invalid reply'},400);
 const ticket=await env.DB.prepare('SELECT status FROM dd_support_tickets WHERE id=?').bind(b.id).first();
 if(!ticket)return result({error:'Ticket not found'},404);
 if(ticket.status==='closed')return result({error:'Ticket closed'},409);
 await env.DB.batch([
 env.DB.prepare("INSERT INTO dd_support_messages(id,ticket_id,sender,body) VALUES(?,?,'agent',?)").bind(crypto.randomUUID(),b.id,body),
 env.DB.prepare("UPDATE dd_support_tickets SET status='pending',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(b.id)
 ]);
 await audit(env,'staff',staff.id,'support_reply',b.id);
 return result({ok:true});
 }catch(e){console.error('Staff reply failed',e);return result({error:'Support unavailable'},503)}
}
export async function onRequestPatch({request,env}){
 if(!originOK(request))return result({error:'Invalid origin'},403);
 try{
 const staff=await staffAuth(request,env);if(!staff)return result({error:'Unauthorized'},401);
 let b;try{b=await request.json()}catch{return result({error:'Invalid JSON'},400)}
 if(!ticketOK(b?.id))return result({error:'Invalid ticket'},400);
 if(b.action==='status'){
 if(!can(staff,'chat_reply'))return result({error:'Permission denied'},403);
 if(!['open','pending','closed'].includes(b.status))return result({error:'Invalid status'},400);
 const updated=await env.DB.prepare('UPDATE dd_support_tickets SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.status,b.id).run();
 if(!updated.meta?.changes)return result({error:'Ticket not found'},404);
 await audit(env,'staff',staff.id,'support_status',b.id,b.status);
 return result({ok:true});
 }
 if(b.action==='assign'){
 if(!can(staff,'ticket_assign'))return result({error:'Permission denied'},403);
 if(typeof b.staff_id!=='string'||!/^[a-f0-9-]{36}$/i.test(b.staff_id))return result({error:'Invalid assignee'},400);
 const [ticket,target]=await Promise.all([
 env.DB.prepare('SELECT id FROM dd_support_tickets WHERE id=?').bind(b.id).first(),
 env.DB.prepare('SELECT id,permissions_json FROM dd_support_staff WHERE id=? AND active=1').bind(b.staff_id).first()
 ]);
 if(!ticket)return result({error:'Ticket not found'},404);
 if(!target||!JSON.parse(target.permissions_json).includes('chat_reply'))return result({error:'Assignee must be active with reply permission'},409);
 await env.DB.prepare('INSERT INTO dd_support_assignments(ticket_id,staff_id) VALUES(?,?) ON CONFLICT(ticket_id) DO UPDATE SET staff_id=excluded.staff_id,assigned_at=CURRENT_TIMESTAMP').bind(b.id,b.staff_id).run();
 await audit(env,'staff',staff.id,'support_assign',b.id,b.staff_id);
 return result({ok:true});
 }
 return result({error:'Unknown action'},400);
 }catch(e){console.error('Staff ticket update failed',e);return result({error:'Support unavailable'},503)}
}
