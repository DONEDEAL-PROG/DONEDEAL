(()=>{
'use strict';const $=id=>document.getElementById(id);let current=null;
const notice=m=>{$('notice').textContent=m};
async function api(url,options={}){const r=await fetch(url,{cache:'no-store',...options});let data;try{data=await r.json()}catch{throw Error('Support API unavailable')};if(r.status===401)throw Error('Admin session expired. Sign in at /admin/ first.');if(!r.ok)throw Error(data.error||'Request failed');return data}
const ddConcerns = new Set(["Refund Request", "Delivery Concern", "Order Follow-up", "Warranty Inquiry", "General Inquiry", "Affiliate Application", "Store Pickup", "Website Concern", "Rewards Inquiry", "Payment Error"]);
let ddAllCases=[];
function ddRenderCases(){
 const category=$('ddConcernFilter')?.value||'';
 const query=($('ddCaseSearch')?.value||'').trim().toLowerCase();
 const body=$('ddCaseRows');if(!body)return;
 body.replaceChildren();
 const shown=ddAllCases.filter(t=>{
  const match=category==='__other'?!ddConcerns.has(t.subject):!category||t.subject===category;
  return match&&[t.id,t.guest_name,t.subject,t.status].join(' ').toLowerCase().includes(query);
 });
 for(const t of shown){
  const tr=document.createElement('tr');
  for(const value of [t.id,t.guest_name,t.subject||'Uncategorized',t.status,t.updated_at||t.created_at||'—']){
   const td=document.createElement('td');td.textContent=value||'—';tr.append(td);
  }
  const action=document.createElement('td'),button=document.createElement('button');
  button.type='button';button.className='dd-case-open';button.textContent='View / Edit';
  button.addEventListener('click',()=>open(t.id));action.append(button);tr.append(action);body.append(tr);
 }
 if(!shown.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.className='dd-case-empty';td.textContent='No matching customer cases.';tr.append(td);body.append(tr);}
}
$('ddConcernFilter').addEventListener('change',ddRenderCases);
$('ddCaseSearch').addEventListener('input',ddRenderCases);
async function list(){
 try{
  const data=await api('/api/admin/support');$('tickets').replaceChildren();ddAllCases=data.tickets||[];ddRenderCases();
  for(const t of data.tickets){
   const btn=document.createElement('button');btn.className='ticket';btn.type='button';
   btn.textContent=t.subject+' · '+t.status+' · '+t.guest_name;
   btn.addEventListener('click',()=>open(t.id));$('tickets').append(btn);
  }
  if(!data.tickets.length)$('tickets').textContent='No tickets yet.';
 }catch(e){notice(e.message)}
}
async function open(id){
 try{
  const data=await api('/api/admin/support?id='+encodeURIComponent(id));current=id;
  $('heading').textContent=data.ticket.subject;$('details').textContent=data.ticket.guest_name+' · '+data.ticket.guest_email+' · '+id;
  $('messages').replaceChildren();
  for(const m of data.messages){
   const div=document.createElement('div');div.className='bubble'+(m.sender==='agent'?' agent':'');
   const body=document.createElement('div');body.textContent=m.body;
   const small=document.createElement('small');small.textContent=m.sender+' · '+m.created_at;
   div.append(body,small);$('messages').append(div);
  }
  $('messages').scrollTop=$('messages').scrollHeight;
  $('reply').hidden=data.ticket.status==='closed';$('status').hidden=false;$('state').value=data.ticket.status;
  notice('');
 }catch(e){notice(e.message)}
}
$('reload').addEventListener('click',list);
$('reply').addEventListener('submit',async e=>{
 e.preventDefault();if(!current)return;
 const button=e.target.querySelector('button');button.disabled=true;
 try{
  await api('/api/admin/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:current,message:$('message').value})});
  $('message').value='';await open(current);await list();
 }catch(err){notice(err.message)}finally{button.disabled=false}
});
$('saveState').addEventListener('click',async()=>{
 if(!current)return;
 try{
  await api('/api/admin/support',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:current,status:$('state').value})});
  await open(current);await list();
 }catch(err){notice(err.message)}
});
list();setInterval(()=>{if(document.visibilityState==='visible'){list();if(current)open(current)}},10000);
})();
