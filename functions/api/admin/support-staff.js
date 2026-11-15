import {allowed,originOK,reply} from './_auth.js';
import {permissions,passwordHash,newSalt,audit} from '../staff/_auth.js';
const usernameOK=s=>typeof s==='string'&&/^[a-zA-Z0-9._-]{3,40}$/.test(s);
const nameOK=s=>typeof s==='string'&&s.trim().length>=2&&s.trim().length<=100;
const passOK=s=>typeof s==='string'&&s.length>=12&&s.length<=256;
const permissionOK=p=>Array.isArray(p)&&p.every(x=>permissions.includes(x))&&new Set(p).size===p.length;
export async function onRequestGet({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 try{
 const rows=await env.DB.prepare('SELECT id,username,display_name,permissions_json,active,created_at FROM dd_support_staff ORDER BY created_at DESC LIMIT 200').all();
 return reply({staff:(rows.results||[]).map(s=>({...s,permissions:JSON.parse(s.permissions_json),permissions_json:undefined}))});
 }catch(e){console.error('Staff list failed',e);return reply({error:'Run support-phase2.sql migration'},503)}
}
export async function onRequestPost({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
 if(!usernameOK(b?.username)||!nameOK(b?.display_name)||!passOK(b?.password)||!permissionOK(b?.permissions))return reply({error:'Invalid staff details; password must be at least 12 characters'},400);
 try{
 const id=crypto.randomUUID(),salt=newSalt(),hash=await passwordHash(b.password,salt);
 await env.DB.prepare('INSERT INTO dd_support_staff(id,username,display_name,password_salt,password_hash,permissions_json) VALUES(?,?,?,?,?,?)').bind(id,b.username.trim(),b.display_name.trim(),salt,hash,JSON.stringify(b.permissions)).run();
 await audit(env,'admin','admin','staff_create',id,JSON.stringify({username:b.username,permissions:b.permissions}));
 return reply({ok:true,id},201);
 }catch(e){console.error('Staff create failed',e);return reply({error:'Unable to create staff; check duplicate username or migration'},409)}
}
export async function onRequestPatch({request,env}){
 if(!await allowed(request,env))return reply({error:'Unauthorized'},401);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!env.DB)return reply({error:'Database unavailable'},503);
 let b;try{b=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
 if(typeof b?.id!=='string'||!/^[a-f0-9-]{36}$/i.test(b.id)||typeof b.active!=='boolean'||!permissionOK(b.permissions)||(b.password!==undefined&&!passOK(b.password)))return reply({error:'Invalid staff update'},400);
 try{
 const staff=await env.DB.prepare('SELECT id FROM dd_support_staff WHERE id=?').bind(b.id).first();
 if(!staff)return reply({error:'Staff not found'},404);
 if(b.password!==undefined){
 const salt=newSalt(),hash=await passwordHash(b.password,salt);
 await env.DB.prepare('UPDATE dd_support_staff SET active=?,permissions_json=?,password_salt=?,password_hash=?,session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.active?1:0,JSON.stringify(b.permissions),salt,hash,b.id).run();
 }else{
 await env.DB.prepare('UPDATE dd_support_staff SET active=?,permissions_json=?,session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.active?1:0,JSON.stringify(b.permissions),b.id).run();
 }
 await audit(env,'admin','admin','staff_update',b.id,JSON.stringify({active:b.active,permissions:b.permissions,password_reset:b.password!==undefined}));
 return reply({ok:true});
 }catch(e){console.error('Staff update failed',e);return reply({error:'Staff update unavailable'},503)}
}
