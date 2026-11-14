const enc=new TextEncoder();
export const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function allowed(request,env){
 if(!env.ADMIN_SESSION_SECRET)return false;
 const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('dd_admin='))?.slice(9);
 const m=/^admin\.(\d+)\.([a-f0-9]{64})$/.exec(token||'');
 if(!m||Number(m[1])<=Date.now()/1000)return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(env.ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',key,Uint8Array.from(m[2].match(/../g),x=>parseInt(x,16)),enc.encode('admin.'+m[1]));
}
export function originOK(req){return req.headers.get('Origin')===new URL(req.url).origin}
export const validText=(s,max=150)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
