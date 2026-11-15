import {respond,originOK,hashPassword,sessionCookie} from './_auth.js';
export async function onRequestPost({request,env}){
 if(!originOK(request))return respond({error:'Invalid origin'},403);
 if(!env.DB||!env.PARTNER_SESSION_SECRET)return respond({error:'Partner login not configured'},503);
 let b;try{b=await request.json()}catch{return respond({error:'Invalid request'},400)}
 const email=String(b.email||'').trim().toLowerCase(),password=b.password;
 if(email.length>160||typeof password!=='string'||password.length>128)return respond({error:'Invalid credentials'},401);
 const user=await env.DB.prepare('SELECT * FROM dd_affiliates WHERE email=?').bind(email).first();
 if(!user)return respond({error:'Invalid credentials'},401);
 const hash=await hashPassword(password,user.password_salt);
 let diff=0;for(let i=0;i<64;i++)diff|=hash.charCodeAt(i)^user.password_hash.charCodeAt(i);
 if(diff)return respond({error:'Invalid credentials'},401);
 if(user.status!=='approved')return respond({error:user.status==='pending'?'Your application is awaiting admin approval':'Your account is not active'},403);
 const r=respond({ok:true});
 r.headers.set('Set-Cookie',await sessionCookie(user.id,env));return r;
}
