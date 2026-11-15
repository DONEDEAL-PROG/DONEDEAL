import {result,originOK} from './_auth.js';
export function onRequestPost({request}){
 if(!originOK(request))return result({error:'Invalid origin'},403);
 return result({ok:true},200,{'Set-Cookie':'dd_staff=; HttpOnly; Secure; SameSite=Strict; Path=/api/staff; Max-Age=0'});
}
