// The admin session cookie is scoped to /api/admin. Keep admin calls on this route.
import {allowed,reply,originOK} from './_auth.js';
import {onRequestGet as readRecovery,onRequestPost as reviewRecovery} from '../staff/pin-recovery.js';
export async function onRequestGet(context){
 if(!await allowed(context.request,context.env))return reply({error:'Admin sign-in required'},401);
 return readRecovery(context);
}
export async function onRequestPost(context){
 if(!originOK(context.request))return reply({error:'Origin not allowed'},403);
 if(!await allowed(context.request,context.env))return reply({error:'Admin sign-in required'},401);
 return reviewRecovery(context);
}
