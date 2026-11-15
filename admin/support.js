(()=>{
'use strict';const $=id=>document.getElementById(id);let current=null;
const notice=m=>{$('notice').textContent=m};
async function api(url,options={}){const r=await fetch(url,{cache:'no-store',...options});let data;try{data=await r.json()}catch{throw Error('Support API unavailable')};if(r.status===401)throw Error('Admin session expired. Sign in at /admin/ first.');if(!r.ok)throw Error(data.error||'Request failed');return data}
async function list(){
 try{
  const data=await api('/api/admin/support');$('tickets').replaceChildren();
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
