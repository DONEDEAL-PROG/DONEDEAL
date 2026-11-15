(()=>{
'use strict';
const $=id=>document.getElementById(id);
const storageKey='dd_support_guest_v1';
let ticket=null,busy=false;
const note=msg=>{$('notice').textContent=msg};
const json=async (url,opts={})=>{const r=await fetch(url,{cache:'no-store',...opts});let b;try{b=await r.json()}catch{throw Error('Support service unavailable')};if(!r.ok)throw Error(b.error||'Request failed');return b};
function show(){
 $('start').classList.toggle('hidden',!!ticket);$('conversation').classList.toggle('hidden',!ticket);
}
function remember(){try{if(ticket)localStorage.setItem(storageKey,JSON.stringify(ticket));else localStorage.removeItem(storageKey)}catch{}}
async function refresh(){
 if(!ticket||busy)return;
 busy=true;
 try{
  const data=await json('/api/support/conversation?id='+encodeURIComponent(ticket.id),{headers:{'X-Support-Access':ticket.access}});
  $('ticketInfo').textContent=data.ticket.id+' · '+data.ticket.subject+' · '+data.ticket.status;
  const list=$('messages');const bottom=list.scrollHeight-list.scrollTop-list.clientHeight<70;
  list.replaceChildren();
  for(const m of data.messages){
   const div=document.createElement('div');div.className='bubble'+(m.sender==='guest'?' mine':'');
   const text=document.createElement('div');text.textContent=m.body;
   const meta=document.createElement('small');meta.textContent=(m.sender==='guest'?'You':'DONEDEAL Support')+' · '+m.created_at;
   div.append(text,meta);list.append(div);
  }
  if(bottom)list.scrollTop=list.scrollHeight;
  $('send').classList.toggle('hidden',data.ticket.status==='closed');
 }catch(e){note(e.message)}
 finally{busy=false}
}
$('newTicket').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;note('');
 try{
  const data=await json('/api/support/tickets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   name:$('name').value,email:$('email').value,subject:$('subject').value,message:$('initial').value
  })});
  ticket={id:data.id,access:data.access};remember();show();await refresh();note('Ticket created. Save your ticket reference.');
 }catch(err){note(err.message)}finally{button.disabled=false}
});
$('send').addEventListener('submit',async e=>{
 e.preventDefault();if(!ticket)return;
 const btn=e.target.querySelector('button');btn.disabled=true;note('');
 try{
  await json('/api/support/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...ticket,message:$('message').value})});
  $('message').value='';await refresh();
 }catch(err){note(err.message)}finally{btn.disabled=false}
});
$('newConversation').addEventListener('click',()=>{ticket=null;remember();show();note('')});
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved.id==='string'&&typeof saved.access==='string')ticket=saved}catch{}
show();if(ticket)refresh();setInterval(()=>{if(ticket&&document.visibilityState==='visible')refresh()},5000);
})();
