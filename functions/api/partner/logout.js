import {respond,originOK} from './_auth.js';
export async function onRequestPost({request}){if(!originOK(request))return respond({error:'Invalid origin'},403);const r=respond({ok:true});r.headers.set('Set-Cookie','dd_partner=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');return r}
