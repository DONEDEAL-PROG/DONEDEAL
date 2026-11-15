import {staffAuth,result} from './_auth.js';
export async function onRequestGet({request,env}){
 try{
 const staff=await staffAuth(request,env);
 if(!staff)return result({error:'Unauthorized'},401);
 return result({staff:{id:staff.id,username:staff.username,display_name:staff.display_name,permissions:staff.permissions}});
 }catch(e){console.error('Staff session failed',e);return result({error:'Unavailable'},503)}
}
