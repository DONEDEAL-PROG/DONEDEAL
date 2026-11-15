import {staffAuth,can,result} from './_auth.js';
export async function onRequestGet({request,env}){
 try{
 const staff=await staffAuth(request,env);if(!staff)return result({error:'Unauthorized'},401);
 if(!can(staff,'ticket_assign'))return result({error:'Permission denied'},403);
 const rows=await env.DB.prepare('SELECT id,display_name,permissions_json FROM dd_support_staff WHERE active=1 ORDER BY display_name LIMIT 200').all();
 return result({agents:(rows.results||[]).filter(s=>JSON.parse(s.permissions_json).includes('chat_reply')).map(s=>({id:s.id,display_name:s.display_name}))});
 }catch(e){console.error('Agents failed',e);return result({error:'Unavailable'},503)}
}
