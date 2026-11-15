const $=id=>document.getElementById(id),money=n=>'₱'+(Number(n||0)/100).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const notice=s=>{$('notice').textContent=s};
async function api(url,body){
 const r=await fetch(url,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d;
}
function entries(id,rows,fn){
 const el=$(id);el.replaceChildren();
 if(!rows.length){el.textContent='Nothing here yet.';return}
 for(const x of rows){const row=document.createElement('div');row.className='entry';const a=document.createElement('div'),b=document.createElement('div');a.textContent=fn(x)[0];b.textContent=fn(x)[1];b.className='tag';row.append(a,b);el.append(row)}
}
async function load(){
 try{
  const d=await api('/api/partner/dashboard');
  $('auth').hidden=true;$('dashboard').hidden=false;$('welcome').textContent='Welcome, '+d.user.name;
  $('visits').textContent=d.visits;$('pending').textContent=money(d.totals.pending);$('available').textContent=money(d.totals.available);$('paid').textContent=money(d.totals.paid);
  $('referral').value=location.origin+'/r/'+d.user.referral_code;
  $('rate').textContent='Your commission rate: '+(d.user.commission_bps/100).toFixed(2)+'% of eligible order value';
  entries('orders',d.orders,x=>[x.order_id+' · '+money(x.total_centavos)+' · '+new Date(x.created_at).toLocaleDateString('en-PH'),money(x.commission_centavos)+' · '+x.status]);
  entries('payouts',d.payouts,x=>[money(x.amount_centavos)+' · '+x.method+' · '+new Date(x.created_at).toLocaleDateString('en-PH'),x.status]);
 }catch{$('auth').hidden=false;$('dashboard').hidden=true}
}
for(const [id,url] of [['login','/api/partner/login'],['register','/api/partner/register'],['payout','/api/partner/payout']]){
 $(id).addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;notice('');try{const data=Object.fromEntries(new FormData(e.target));const r=await api(url,data);notice(r.message||'Saved successfully');if(id==='register')e.target.reset();if(id!=='register')await load()}catch(err){notice(err.message)}finally{btn.disabled=false}})
}
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('referral').value);notice('Referral link copied')}catch{ $('referral').select();notice('Select and copy your referral link')}};
$('logout').onclick=async()=>{await api('/api/partner/logout',{});location.reload()};
load();
