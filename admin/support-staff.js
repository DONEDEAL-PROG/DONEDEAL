(()=>{
'use strict';
const $=id=>document.getElementById(id);
const perms=[['chat_reply','Reply to customer messages'],['orders_view','View and track orders (Phase 3)'],['payment_change','Change payment method (Phase 3)'],['orders_cancel','Cancel orders (Phase 3)'],['orders_edit','Edit customer/order details (Phase 3)'],['refund_request','Handle refund requests (Phase 3)'],['ticket_assign','Assign conversations']];
const notice=s=>{$('notice').textContent=s};
async function api(options={}){const r=await fetch('/api/admin/support-staff',{cache:'no-store',...options});let d;try{d=await r.json()}catch{throw Error('Staff API unavailable')};if(!r.ok)throw Error(d.error||'Request failed');return d}
const json=(method,data)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function checkboxes(container,selected=[]){
 container.replaceChildren();
 for(const [id,label] of perms){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.value=id;c.checked=selected.includes(id);l.append(c,document.createTextNode(' '+label));container.append(l)}
}
function selected(container){return Array.from(container.querySelectorAll('input:checked'),x=>x.value)}
async function load(){
 try{
 const d=await api();$('staffList').replaceChildren();
 for(const s of d.staff){
 const card=document.createElement('section');card.className='staff';
 const h=document.createElement('h3');h.textContent=s.display_name+' (@'+s.username+')';
 const activeLabel=document.createElement('label'),active=document.createElement('input');active.type='checkbox';active.checked=!!s.active;activeLabel.append(active,document.createTextNode(' Active account'));
 const permBox=document.createElement('div');permBox.className='permissions';checkboxes(permBox,s.permissions);
 const passwordLabel=document.createElement('label');passwordLabel.textContent='New password (optional, min 12 characters)';
 const password=document.createElement('input');password.type='password';password.minLength=12;password.autocomplete='new-password';passwordLabel.append(password);
 const save=document.createElement('button');save.textContent='Save permissions / account';save.addEventListener('click',async()=>{
 save.disabled=true;try{const data={id:s.id,active:active.checked,permissions:selected(permBox)};if(password.value)data.password=password.value;await api(json('PATCH',data));password.value='';notice('Saved '+s.username+'. Existing staff sessions revoked.');await load()}catch(e){notice(e.message)}finally{save.disabled=false}
 });
 card.append(h,activeLabel,permBox,passwordLabel,save);$('staffList').append(card);
 }
 if(!d.staff.length)$('staffList').textContent='No staff accounts yet.';
 }catch(e){notice(e.message)}
}
$('create').addEventListener('submit',async e=>{
 e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;
 try{await api(json('POST',{username:$('username').value,display_name:$('displayName').value,password:$('password').value,permissions:selected($('newPermissions'))}));$('create').reset();notice('Staff account created. Share credentials securely.');await load()}catch(err){notice(err.message)}finally{b.disabled=false}
});
$('refresh').addEventListener('click',load);checkboxes($('newPermissions'),['chat_reply']);load();
})();
