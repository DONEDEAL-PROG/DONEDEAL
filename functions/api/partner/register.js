import { respond, originOK, hashPassword, rand, clean } from '../_auth.js';
export async function onRequestPost({request,env}){
 if(!originOK(request))return respond({error:'Invalid origin'},403);
 if(!env.DB)return respond({error:'D1 not configured'},503);
 let b;try{b=await request.json()}catch{return respond({error:'Invalid request'},400)}
 const name=clean(b.name,100),email=clean(b.email,160).toLowerCase(),social=clean(b.social_url,300),password=b.password;
 if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<8||password.length>128)return respond({error:'Enter a name, valid email, and password of at least 8 characters'},400);
 if(social&&(!/^https:\/\//.test(social)||social.length>300))return respond({error:'Social profile must be an HTTPS link'},400);
 try{
  const id=rand(),salt=rand(),hash=await hashPassword(password,salt),code=crypto.randomUUID().replace(/-/g,'').slice(0,12);
  await env.DB.prepare('INSERT INTO dd_affiliates(id,name,email,social_url,password_salt,password_hash,referral_code) VALUES(?,?,?,?,?,?,?)').bind(id,name,email,social,salt,hash,code).run();
  return respond({ok:true,message:'Application submitted. You can sign in after admin approval.'},201);
 }catch(e){if(/UNIQUE/i.test(String(e)))return respond({error:'This email is already registered'},409);return respond({error:'Unable to submit application'},500)}
}
