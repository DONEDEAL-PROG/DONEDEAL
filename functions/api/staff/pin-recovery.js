import {allowed} from '../admin/_auth.js';
import {staffAuth,can} from './_auth.js';
import {json,originOK,ready,open,hash,uuid,now,auditSQL,hex} from '../pin-recovery/_util.js';
async function actor(request,env){if(await allowed(request,env))return {type:'admin',id:'admin'};const staff=await staffAuth(request,env);return can(staff,'pin_recovery')?{type:'staff',id:staff.id}:null}
export async function onRequestGet({request,env}){
 try{const user=await actor(request,env);if(!user)return json({error:'PIN recovery permission required'},403);if(!ready(env))return json({error:'Configure PIN_RECOVERY_SECRET and run the recovery SQL migration.'},503);
 const result=await env.DB.prepare('SELECT r.*,p.encrypted_data FROM dd_pin_recovery_requests r JOIN dd_pin_profiles p ON p.id=r.profile_id ORDER BY r.created_at DESC,r.rowid DESC LIMIT 100').all();const requests=[];
 for(const row of result.results||[]){let contact={},orders=[];try{const records=await open(row.encrypted_data,env,row.profile_id);contact=JSON.parse(records.doneDealCheckoutDetailsV1||'{}').contact||{};orders=JSON.parse(records.doneDealOrderHistoryV1||'[]')}catch{}
 requests.push({id:row.id,profile_id:row.profile_id,status:row.status,created_at:row.created_at,reviewed_at:row.reviewed_at,expires_at:row.expires_at,attempts:row.attempts,verification_method:row.verification_method,verification_note:row.verification_note,actor_id:row.actor_id,contact:{name:contact.name||'',phone:contact.phone||'',email:contact.email||''},order_references:Array.isArray(orders)?orders.map(o=>o.id).filter(x=>typeof x==='string').slice(0,10):[]})}
 const audit=await env.DB.prepare('SELECT request_id,actor_type,actor_id,action,created_at,details FROM dd_pin_recovery_audit ORDER BY created_at DESC,rowid DESC LIMIT 100').all();return json({requests,audit:audit.results||[]});
 }catch{return json({error:'PIN recovery tools are unavailable'},503)}
}
export async function onRequestPost({request,env}){
 if(!originOK(request))return json({error:'Origin not allowed'},403);
 try{const user=await actor(request,env);if(!user)return json({error:'PIN recovery permission required'},403);if(!ready(env))return json({error:'PIN recovery is not configured'},503);
 const b=await request.json();if(!uuid(b.id)||!['approve','reject'].includes(b.action))return json({error:'Invalid recovery action'},400);
 const note=typeof b.note==='string'?b.note.trim():'';if(note.length<20||note.length>1000)return json({error:'Record a verification or rejection note of 20–1,000 characters.'},400);
 if(b.action==='approve'&&(b.identity_verified!==true||!['registered_phone_callback','registered_email','in_person'].includes(b.method)))return json({error:'Complete identity verification through a previously registered channel or in person.'},400);
 const row=await env.DB.prepare('SELECT * FROM dd_pin_recovery_requests WHERE id=?').bind(b.id).first();if(!row)return json({error:'Request not found'},404);
 const mutable="(status='pending' OR (status='approved' AND (expires_at<=? OR attempts>=5)))";
 const code=b.action==='approve'?hex(crypto.getRandomValues(new Uint8Array(16))):null,expires=now()+900;
 const result=await env.DB.prepare(`UPDATE dd_pin_recovery_requests SET status=?,reviewed_at=?,actor_type=?,actor_id=?,verification_method=?,verification_note=?,code_hash=?,expires_at=?,attempts=0 WHERE id=? AND ${mutable} RETURNING id`).bind(b.action==='approve'?'approved':'rejected',now(),user.type,user.id,b.action==='approve'?b.method:null,note,code?await hash(code):null,code?expires:null,row.id,now()).first();if(!result)return json({error:'This request was already reviewed. Refresh the list.'},409);
 
 return json({ok:true,recovery_code:code,expires_at:code?expires:null,message:code?'Share this single-use code only through the independently verified customer contact channel. It is shown once.':'Recovery request rejected.'});
 }catch{return json({error:'Recovery review could not be completed'},503)}
}
