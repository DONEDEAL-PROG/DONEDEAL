export async function onRequestGet({request,env,params}){
 const code=String(params.code||'');
 const base=new URL(request.url);
 if(!/^[a-f0-9]{12}$/.test(code))return Response.redirect(base.origin+'/shop.html',302);
 if(!env.DB)return Response.redirect(base.origin+'/shop.html',302);
 const affiliate=await env.DB.prepare("SELECT id FROM dd_affiliates WHERE referral_code=? AND status='approved'").bind(code).first();
 if(!affiliate)return Response.redirect(base.origin+'/shop.html',302);
 const id=crypto.randomUUID();
 try{await env.DB.prepare('INSERT INTO dd_affiliate_visits(id,affiliate_id) VALUES(?,?)').bind(id,affiliate.id).run()}catch{}
 const dest=new URL('/shop.html',base.origin);
 const res=Response.redirect(dest.toString(),302);
 res.headers.set('Set-Cookie',`dd_ref=${code}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
 res.headers.set('Cache-Control','no-store');
 return res;
}
