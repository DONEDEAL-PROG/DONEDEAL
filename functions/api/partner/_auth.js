const encoder=new TextEncoder();
export const respond=(x,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
export const originOK=req=>{const origin=req.headers.get('Origin');return !!origin&&origin===new URL(req.url).origin};
const hex=a=>Array.from(new Uint8Array(a),x=>x.toString(16).padStart(2,'0')).join('');
export const rand=()=>crypto.randomUUID();
export async function hashPassword(password,salt){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations: 100000,hash:'SHA-256'},key,256));
}
async function mac(value,secret){
 const k=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',k,encoder.encode(value)));
}
export async function sessionCookie(id,env){
 const expires=Math.floor(Date.now()/1000)+86400;
 const value=`${id}.${expires}`;
 const sig=await mac(value,env.PARTNER_SESSION_SECRET);
 return `dd_partner=${value}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`;
}
export async function currentPartner(request,env){
 if(!env.PARTNER_SESSION_SECRET||!env.DB)return null;
 const token=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('dd_partner='))?.slice(11)||'';
 const m=/^([a-f0-9-]{36})\.(\d+)\.([a-f0-9]{64})$/.exec(token);
 if(!m||Number(m[2])<Date.now()/1000)return null;
 const actual=await mac(`${m[1]}.${m[2]}`,env.PARTNER_SESSION_SECRET);
 let diff=0;for(let i=0;i<64;i++)diff|=actual.charCodeAt(i)^m[3].charCodeAt(i);
 if(diff)return null;
 return env.DB.prepare('SELECT id,name,email,status,referral_code,commission_bps,payout_method,payout_account FROM dd_affiliates WHERE id=?').bind(m[1]).first();
}
export const clean=(x,max=160)=>typeof x==='string'?x.trim().slice(0,max):'';
