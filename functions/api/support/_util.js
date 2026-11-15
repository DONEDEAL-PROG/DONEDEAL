export const out=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const sameOrigin=r=>r.headers.get('Origin')===new URL(r.url).origin;
export const valid=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;
export async function sha(s){const bytes=new TextEncoder().encode(s);const h=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
export function token(){return crypto.randomUUID()+crypto.randomUUID().replace(/-/g,'')}
export async function verified(db,id,secret){
 if(!/^SUP-[0-9a-f-]{36}$/i.test(id)||!/^[-a-f0-9]{60,100}$/i.test(secret))return null;
 const t=await db.prepare('SELECT id,status,subject,guest_name,created_at FROM dd_support_tickets WHERE id=? AND access_hash=?').bind(id,await sha(secret)).first();
 return t||null;
}
