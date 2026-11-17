const enc=new TextEncoder(),dec=new TextDecoder();
export const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const originOK=req=>req.headers.get('Origin')===new URL(req.url).origin;
export const now=()=>Math.floor(Date.now()/1000);
export const hex=buf=>Array.from(new Uint8Array(buf),v=>v.toString(16).padStart(2,'0')).join('');
export const hash=async text=>hex(await crypto.subtle.digest('SHA-256',enc.encode(text)));
export const uuid=s=>typeof s==='string'&&/^[0-9a-f-]{36}$/i.test(s);
export const ready=env=>!!env.DB&&typeof env.PIN_RECOVERY_SECRET==='string'&&env.PIN_RECOVERY_SECRET.length>=32;
const b64=bytes=>{let out='';const a=new Uint8Array(bytes);for(let i=0;i<a.length;i+=8192)out+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(out)};
const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function key(env){return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',enc.encode('DONEDEAL-PIN-RECOVERY-v1:'+env.PIN_RECOVERY_SECRET)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function seal(records,env,id){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(id)},await key(env),enc.encode(JSON.stringify(records)));return JSON.stringify({v:1,iv:b64(iv),data:b64(encrypted)})}
export async function open(value,env,id){const record=JSON.parse(value);return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(record.iv),additionalData:enc.encode(id)},await key(env),un64(record.data))))}
export async function profile(request,env,id){if(!uuid(id))return null;const secret=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(secret))return null;return env.DB.prepare('SELECT * FROM dd_pin_profiles WHERE id=? AND device_hash=?').bind(id,await hash(secret)).first()}
export function validRecords(records){if(!records||typeof records!=='object'||Array.isArray(records)||JSON.stringify(records).length>240000)return false;const keys=Object.keys(records);if(keys.some(k=>!['doneDealCheckoutDetailsV1','doneDealOrderHistoryV1'].includes(k)))return false;return keys.every(k=>typeof records[k]==='string'&&(()=>{try{JSON.parse(records[k]);return true}catch{return false}})())}
export function auditSQL(env,requestId,profileId,type,actor,action,details=null){return env.DB.prepare('INSERT INTO dd_pin_recovery_audit(id,request_id,profile_id,actor_type,actor_id,action,created_at,details) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),requestId,profileId,type,actor,action,now(),details)}

export async function rate(request,env,scope,limit,windowSeconds){const ip=request.headers.get('CF-Connecting-IP')||'unknown';const period=Math.floor(now()/windowSeconds),bucket=await hash(env.PIN_RECOVERY_SECRET+':'+ip+':'+scope+':'+period);const row=await env.DB.prepare('INSERT INTO dd_pin_recovery_rate(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,(period+1)*windowSeconds).first();return row.count<=limit}
