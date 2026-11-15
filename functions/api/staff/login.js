import {result,originOK,passwordHash,sign} from './_auth.js';
export async function onRequestPost({request,env}){
 if(!originOK(request))return result({error:'Invalid origin'},403);
 if(!env.DB||!env.ADMIN_SESSION_SECRET)return result({error:'Staff login unavailable'},503);
 let b;try{b=await request.json()}catch{return result({error:'Invalid request'},400)}
 const username=String(b?.username||'').trim(),password=String(b?.password||'');
 if(!username||username.length>80||!password||password.length>1024)return result({error:'Invalid credentials'},401);
 try{
 const staff=await env.DB.prepare('SELECT id,password_salt,password_hash,active,session_version FROM dd_support_staff WHERE username=? COLLATE NOCASE').bind(username).first();
 const salt=staff?.password_salt||'00000000000000000000000000000000';
 const computed=await passwordHash(password,salt);
 if(!staff||!staff.active||computed!==staff.password_hash)return result({error:'Invalid credentials'},401);
 const expiry=Math.floor(Date.now()/1000)+3600,payload=`${staff.id}.${expiry}.${staff.session_version}`;
 const sig=await sign(payload,env.ADMIN_SESSION_SECRET);
 return result({ok:true},200,{'Set-Cookie':`dd_staff=${payload}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/api/staff; Max-Age=3600`});
 }catch(e){console.error('Staff login failed',e);return result({error:'Staff login unavailable'},503)}
}
