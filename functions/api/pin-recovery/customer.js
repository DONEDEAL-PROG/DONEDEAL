import {json,originOK,ready,uuid,hash,profile,seal,open,validRecords,now,auditSQL,rate} from './_util.js';
export async function onRequestPost({request,env}){
 if(!originOK(request))return json({error:'Origin not allowed'},403);
 if(!ready(env))return json({error:'PIN recovery is not configured yet. Please contact customer support.'},503);
 if(!String(request.headers.get('content-type')||'').includes('application/json'))return json({error:'Invalid request'},415);
 if(Number(request.headers.get('content-length')||0)>260000)return json({error:'Request too large'},413);
 try{
  const raw=await request.text();if(raw.length>260000)return json({error:'Request too large'},413);const b=JSON.parse(raw);
  if(b.action==='backup'){
   if(!await rate(request,env,'backup',240,3600))return json({error:'Too many backup attempts. Please try later.'},429);
   if(!uuid(b.profile_id)||!validRecords(b.records))return json({error:'Invalid recovery backup'},400);
   const secret=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(secret))return json({error:'Invalid browser credential'},401);
   const existing=await env.DB.prepare('SELECT id,device_hash FROM dd_pin_profiles WHERE id=?').bind(b.profile_id).first(),digest=await hash(secret);
   if(existing&&existing.device_hash!==digest)return json({error:'Browser credential mismatch'},403);
   // Freeze backups while recovery is pending/approved, so a forgotten-PIN backup cannot be overwritten.
   if(existing){const pending=await env.DB.prepare("SELECT id FROM dd_pin_recovery_requests WHERE profile_id=? AND (status='pending' OR (status='approved' AND expires_at>?)) LIMIT 1").bind(b.profile_id,now()).first();if(pending)return json({ok:true,frozen:true})}
   if(!existing&&!await rate(request,env,'registration',10,86400))return json({error:'Too many recovery registrations. Please contact support.'},429);
   const encrypted=await seal(b.records,env,b.profile_id);
   const result=await env.DB.prepare('INSERT INTO dd_pin_profiles(id,device_hash,encrypted_data,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET encrypted_data=excluded.encrypted_data,updated_at=excluded.updated_at WHERE device_hash=excluded.device_hash').bind(b.profile_id,digest,encrypted,now(),now()).run();if(!result.meta?.changes)return json({error:'Backup could not be authorized'},403);
   return json({ok:true});
  }
  const p=await profile(request,env,b.profile_id);if(!p)return json({error:'No recovery backup is registered for this browser. Contact support.'},404);
  if(b.action==='request'){
   if(!await rate(request,env,'request',20,86400))return json({error:'Too many requests. Please contact support.'},429);
   const pending=await env.DB.prepare("SELECT id,status,created_at,expires_at FROM dd_pin_recovery_requests WHERE profile_id=? AND (status='pending' OR (status='approved' AND expires_at>?)) ORDER BY created_at DESC LIMIT 1").bind(p.id,now()).first();if(pending)return json({request:pending});
   const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM dd_pin_recovery_requests WHERE profile_id=? AND created_at>?').bind(p.id,now()-86400).first();if(Number(count?.n)>=3)return json({error:'Too many recovery requests. Please contact support.'},429);
   const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO dd_pin_recovery_requests(id,profile_id,status,created_at) VALUES(?,?,?,?)').bind(id,p.id,'pending',now()).run();return json({request:{id,status:'pending',created_at:now()}},201);
  }
  if(b.action==='status'){const row=await env.DB.prepare('SELECT id,status,created_at,expires_at FROM dd_pin_recovery_requests WHERE profile_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').bind(p.id).first();return json({request:row||null})}
  if(b.action==='redeem'){
   if(!await rate(request,env,'redeem',60,3600))return json({error:'Too many recovery attempts. Please try later.'},429);
   if(!uuid(b.request_id)||typeof b.code!=='string'||!/^[a-f0-9]{32}$/i.test(b.code.trim()))return json({error:'Enter the recovery code supplied by verified customer support.'},400);
   const row=await env.DB.prepare('SELECT * FROM dd_pin_recovery_requests WHERE id=? AND profile_id=?').bind(b.request_id,p.id).first();if(!row||row.status!=='approved'||row.expires_at<=now()||row.attempts>=5)return json({error:'This recovery approval is unavailable or expired. Ask support to review your request again.'},409);
   const digest=await hash(b.code.trim().toLowerCase());
   if(digest!==row.code_hash){await env.DB.prepare("UPDATE dd_pin_recovery_requests SET attempts=attempts+1 WHERE id=? AND status='approved'").bind(row.id).run();return json({error:'Incorrect recovery code.'},403)}
   const records=await open(p.encrypted_data,env,p.id);
   // RETURNING prevents simultaneous requests from redeeming the same approval twice.
   const used=await env.DB.prepare("UPDATE dd_pin_recovery_requests SET status='used',used_at=?,code_hash=NULL WHERE id=? AND profile_id=? AND status='approved' AND expires_at>? AND attempts<5 AND code_hash=? RETURNING id").bind(now(),row.id,p.id,now(),digest).first();if(!used)return json({error:'This code has already been used or expired.'},409);
   return json({ok:true,records});
  }
  return json({error:'Unknown action'},400);
 }catch(e){console.error('PIN recovery operation failed');return json({error:'PIN recovery is temporarily unavailable. Please contact support.'},503)}
}
