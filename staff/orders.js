(()=>{
'use strict';
const $=id=>document.getElementById(id);let me=null,current=null;
const notice=s=>$('notice').textContent=s;
async function api(url,opt={}){const r=await fetch(url,{cache:'no-store',...opt});let d;try{d=await r.json()}catch{throw Error('API unavailable')}if(!r.ok)throw Error(d.error||'Request failed');return d}
const payload=(method,data)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const has=p=>me?.permissions?.includes(p);
function customer(o){try{return JSON.parse(o.customer_json)}catch{return {}}}
async function list(){
 try{const q=$('query').value.trim(),d=await api('/api/staff/orders?q='+encodeURIComponent(q));$('orders').replaceChildren();
 for(const o of d.orders){const b=document.createElement('button');b.className='order';b.textContent=o.id+' · '+o.status+' · '+(customer(o).name||'Customer');b.onclick=()=>open(o.id);$('orders').append(b)}
 if(!d.orders.length)$('orders').textContent='No orders found.';notice('');
 }catch(e){notice(e.message)}
}
async function open(id){
 try{
 const d=await api('/api/staff/orders?id='+encodeURIComponent(id));current=d.order;
 const o=current,c=customer(o);$('title').textContent=o.id;
 $('info').textContent=JSON.stringify({status:o.status,payment_status:o.payment_status,payment_method:o.payment_method,fulfillment:o.fulfillment,total_php:(o.total_centavos/100).toFixed(2),customer:c,items:JSON.parse(o.items_json||'[]'),created_at:o.created_at},null,2);
 $('name').value=c.name||'';$('phone').value=c.phone||'';$('address').value=c.address||'';$('method').value=o.payment_method||'cod';
 $('actions').hidden=false;
 const editable=['pending','confirmed'].includes(o.status),unpaid=o.payment_status==='unpaid';
 $('editArea').hidden=!(has('orders_edit')&&editable);
 $('paymentArea').hidden=!(has('payment_change')&&editable&&unpaid);
 $('cancelArea').hidden=!(has('orders_cancel')&&editable&&unpaid);
 $('refundArea').hidden=!(has('refund_request')&&o.payment_status==='paid');
 }catch(e){notice(e.message)}
}
async function change(action,extra={},method='PATCH'){
 if(!current)return;
 const reason=$('reason').value.trim();
 if(reason.length<5){notice('Enter reason and customer authorization reference (minimum 5 characters).');return}
 if(!confirm('Confirm '+action+' for '+current.id+'?'))return;
 try{const d=await api('/api/staff/orders',payload(method,{id:current.id,action,reason,...extra}));notice(d.message||'Action saved.');$('reason').value='';await open(current.id);await list()}catch(e){notice(e.message)}
}
$('search').onclick=list;
$('query').addEventListener('keydown',e=>{if(e.key==='Enter')list()});
$('saveEdit').onclick=()=>change('edit',{name:$('name').value,phone:$('phone').value,address:$('address').value});
$('savePayment').onclick=()=>change('payment',{payment_method:$('method').value});
$('cancelOrder').onclick=()=>change('cancel');
$('requestRefund').onclick=()=>change('refund',{},'POST');
(async()=>{try{me=(await api('/api/staff/me')).staff;if(!has('orders_view'))throw Error('Order viewing permission required');await list()}catch(e){notice(e.message)}})();
})();
