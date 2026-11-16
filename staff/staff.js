(()=>{
'use strict';
const $=id=>document.getElementById(id);let current=null,me=null;
const notice=s=>{$('notice').textContent=s};
async function api(url,options={}){
 const r=await fetch(url,{cache:'no-store',...options});let d;try{d=await r.json()}catch{throw Error('API unavailable')}
 if(!r.ok)throw Error(d.error||'Request failed');return d;
}
const json=(method,data)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
async function session(){
 try{me=(await api('/api/staff/me')).staff;$('login').hidden=true;$('app').hidden=false;$('staffName').textContent=me.display_name;
 $('reply').hidden=!me.permissions.includes('chat_reply');$('statusArea').hidden=!me.permissions.includes('chat_reply');
 $('assignArea').hidden=!me.permissions.includes('ticket_assign');await list();
 if(me.permissions.includes('ticket_assign'))await agents();
 }catch(e){$('login').hidden=false;$('app').hidden=true;if(e.message!=='Unauthorized')notice(e.message)}
}
async function agents(){
 try{const d=await api('/api/staff/agents');$('assignee').replaceChildren();
 for(const a of d.agents){const o=document.createElement('option');o.value=a.id;o.textContent=a.display_name;$('assignee').append(o)}
 }catch(e){notice(e.message)}
}
function ddRenderConversations(){
 const host=$('ddConversationList');if(!host)return;
 host.replaceChildren();
 const active=ddAllCases.filter(t=>!['closed','resolved','cancelled','completed'].includes(String(t.status||'').toLowerCase()));
 if(!active.length){const p=document.createElement('p');p.className='empty-state';p.textContent='No open conversations at the moment.';host.append(p);return;}
 for(const t of active){
  const b=document.createElement('button');b.type='button';b.className='dd-conversation-row';
  const left=document.createElement('span');left.className='dd-conversation-person';
  const name=document.createElement('strong');name.textContent=t.guest_name||'Customer';
  const detail=document.createElement('small');detail.textContent=(t.subject||'Support concern')+' · '+String(t.id||'').slice(0,14);
  left.append(name,detail);
  const state=document.createElement('span');state.className='dd-conversation-state';state.textContent=t.status||'Open';
  b.append(left,state);
  b.addEventListener('click',()=>{
   document.querySelector('[data-staff-tab="cases"]')?.click();
   open(t.id);
  });
  host.append(b);
 }
}
$('ddRefreshConversations')?.addEventListener('click',list);
const ddConcerns = new Set(["Refund Request", "Delivery Concern", "Order Follow-up", "Warranty Inquiry", "General Inquiry", "Affiliate Application", "Store Pickup", "Website Concern", "Rewards Inquiry", "Payment Error"]);
let ddAllCases=[];
function ddRenderCases(){
 const category=$('ddConcernFilter')?.value||'';
 const query=($('ddCaseSearch')?.value||'').trim().toLowerCase();
 const body=$('ddCaseRows');if(!body)return;
 body.replaceChildren();
 const shown=ddAllCases.filter(t=>{
  const match=category==='__other'?!ddConcerns.has(t.subject):!category||t.subject===category;
  return match&&[t.id,t.guest_name,t.subject,t.status,t.guest_email].join(' ').toLowerCase().includes(query);
 });
 for(const t of shown){
  const row=document.createElement('button');row.type='button';row.className='dd-messenger-thread';
  if(current===t.id)row.classList.add('is-selected');
  const avatar=document.createElement('span');avatar.className='dd-messenger-avatar';
  avatar.textContent=(t.guest_name||'C').trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
  const main=document.createElement('span');main.className='dd-messenger-thread-main';
  const top=document.createElement('span');top.className='dd-messenger-thread-top';
  const name=document.createElement('strong');name.textContent=t.guest_name||'Customer';
  const time=document.createElement('small');time.textContent=String(t.updated_at||t.created_at||'').slice(0,16);
  top.append(name,time);
  const concern=document.createElement('span');concern.className='dd-concern';concern.textContent=t.subject||'Uncategorized concern';
  const preview=document.createElement('span');preview.className='dd-preview';preview.textContent=(t.status||'Open')+' · '+String(t.id||'').slice(0,16);
  main.append(top,concern,preview);row.append(avatar,main);
  row.addEventListener('click',()=>open(t.id));body.append(row);
 }
 if(!shown.length){const p=document.createElement('p');p.className='empty-state';p.style.padding='20px';p.textContent='No matching conversations.';body.append(p);}
}
$('ddConcernFilter').addEventListener('change',ddRenderCases);
$('ddCaseSearch').addEventListener('input',ddRenderCases);
async function list(){
 try{const d=await api('/api/staff/support');$('tickets').replaceChildren();ddAllCases=d.tickets||[];ddRenderCases();ddRenderConversations();
 for(const t of d.tickets){const b=document.createElement('button');b.type='button';b.className='ticket';b.textContent=t.subject+' · '+t.status+' · '+t.guest_name;b.addEventListener('click',()=>open(t.id));$('tickets').append(b)}
 if(!d.tickets.length)$('tickets').textContent='No tickets yet.';
 }catch(e){notice(e.message)}
}
async function open(id){
 try{const d=await api('/api/staff/support?id='+encodeURIComponent(id));current=id;
 $('ddMessenger')?.classList.add('has-selection');ddRenderCases();
 $('heading').textContent=d.ticket.subject;$('details').textContent=d.ticket.guest_name+' · '+d.ticket.guest_email+' · '+id;
 $('messages').replaceChildren();
 for(const m of d.messages){const div=document.createElement('div');div.className='bubble'+(m.sender==='agent'?' agent':'');const body=document.createElement('div');body.textContent=m.body;const small=document.createElement('small');small.textContent=m.sender+' · '+m.created_at;div.append(body,small);$('messages').append(div)}
 $('messages').scrollTop=$('messages').scrollHeight;
 $('reply').hidden=d.ticket.status==='closed'||!me.permissions.includes('chat_reply');
 $('statusArea').hidden=!me.permissions.includes('chat_reply');$('state').value=d.ticket.status;
 $('assignArea').hidden=!me.permissions.includes('ticket_assign');
 if(d.ticket.assigned_to)$('assignee').value=d.ticket.assigned_to;notice('');
 }catch(e){notice(e.message)}
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/staff/login',json('POST',{username:$('username').value,password:$('password').value}));$('password').value='';notice('');await session()}catch(err){notice(err.message)}});
$('logout').addEventListener('click',async()=>{try{await api('/api/staff/logout',json('POST',{}))}catch{}me=null;current=null;$('app').hidden=true;$('login').hidden=false});
$('reload').addEventListener('click',list);
$('reply').addEventListener('submit',async e=>{e.preventDefault();if(!current)return;const b=e.target.querySelector('button');b.disabled=true;try{await api('/api/staff/support',json('POST',{id:current,message:$('message').value}));$('message').value='';await open(current);await list()}catch(err){notice(err.message)}finally{b.disabled=false}});
$('saveState').addEventListener('click',async()=>{if(!current)return;try{await api('/api/staff/support',json('PATCH',{action:'status',id:current,status:$('state').value}));await open(current);await list()}catch(e){notice(e.message)}});
$('saveAssign').addEventListener('click',async()=>{if(!current)return;try{await api('/api/staff/support',json('PATCH',{action:'assign',id:current,staff_id:$('assignee').value}));await open(current);notice('Ticket assigned')}catch(e){notice(e.message)}});
$('ddBackToInbox')?.addEventListener('click',()=>{$('ddMessenger').classList.remove('has-selection');$('ddMessenger').classList.remove('is-expanded');$('ddExpandChat').textContent='Expand ↗';});
$('ddExpandChat')?.addEventListener('click',()=>{const m=$('ddMessenger');const expanded=m.classList.toggle('is-expanded');$('ddExpandChat').textContent=expanded?'Minimize ↙':'Expand ↗';$('ddExpandChat').setAttribute('aria-pressed',String(expanded));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('ddMessenger')?.classList.contains('is-expanded')){$('ddMessenger').classList.remove('is-expanded');$('ddExpandChat').textContent='Expand ↗';}});
session();setInterval(()=>{if(me&&document.visibilityState==='visible'){list();if(current&&!document.activeElement?.matches('#message'))open(current)}},12000);
})();
