const $=id=>document.getElementById(id);
const money=n=>'₱'+(Number(n||0)/100).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const notice=s=>{$('notice').textContent=s;};
async function api(url,body){
 const r=await fetch(url,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed');return d;
}
let state=null;
function entries(id,rows,format){
 const el=$(id);el.replaceChildren();
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent='Nothing here yet.';el.append(p);return}
 for(const x of rows){const [left,right]=format(x),row=document.createElement('div');row.className='entry';const a=document.createElement('span'),b=document.createElement('span');a.textContent=left;b.textContent=right;row.append(a,b);el.append(row)}
}
function navigate(view){
 const titles={overview:'Overview',referral:'My Referral Link',referrals:'My Referrals',commissions:'Commissions & Payouts',messages:'Message Admin',account:'My Account'};
 if(!titles[view])view='overview';
 for(const el of document.querySelectorAll('.view'))el.hidden=el.id!=='view-'+view;
 for(const el of document.querySelectorAll('.nav')){el.classList.toggle('active',el.dataset.view===view);el.setAttribute('aria-current',el.dataset.view===view?'page':'false')}
 $('page-title').textContent=titles[view];history.replaceState(null,'','#'+view);
 $('sidebar').classList.remove('open');$('overlay').hidden=true;$('menu').setAttribute('aria-expanded','false');
 if(view==='messages')loadMessages();
}
document.querySelectorAll('.nav').forEach(el=>el.onclick=()=>navigate(el.dataset.view));
document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>navigate(el.dataset.go));
$('menu').onclick=()=>{const open=$('sidebar').classList.toggle('open');$('overlay').hidden=!open;$('menu').setAttribute('aria-expanded',String(open))};
$('overlay').onclick=()=>{$('sidebar').classList.remove('open');$('overlay').hidden=true};
function fill(data){
 state=data;const u=data.user;
 $('welcome').textContent='Welcome back, '+u.name+'.';$('topname').textContent=u.name;$('avatar').textContent=u.name.slice(0,1).toUpperCase();
 $('visits').textContent=data.visits;
 for(const [id,n] of [['pending',data.totals.pending],['available',data.totals.available],['paid',data.totals.paid],['cpending',data.totals.pending],['cavailable',data.totals.available],['cpaid',data.totals.paid]])$(id).textContent=money(n);
 $('referral').value=location.origin+'/r/'+u.referral_code;
 $('rate').textContent='Commission rate: '+(u.commission_bps/100).toFixed(2)+'% of eligible order value';
 $('account-name').textContent=u.name;$('account-email').textContent=u.email;
 const referrals=data.referrals||[];
 entries('recent-referrals',referrals.slice(0,5),x=>[x.customer_name+' · '+x.gadgets.join(', '),x.order_status]);
 const tbody=$('referral-rows');tbody.replaceChildren();
 if(!referrals.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.className='empty';td.textContent='No referred orders yet.';tr.append(td);tbody.append(tr)}
 for(const x of referrals){const tr=document.createElement('tr');for(const value of [x.customer_name,x.gadgets.join(', '),new Date(x.created_at).toLocaleDateString('en-PH'),x.order_status]){const td=document.createElement('td');td.textContent=value;tr.append(td)}tbody.append(tr)}
 entries('orders',data.orders||[],x=>[new Date(x.created_at).toLocaleDateString('en-PH')+' · '+money(x.commission_centavos),x.status]);
 entries('payouts',data.payouts||[],x=>[money(x.amount_centavos)+' · '+x.method+' · '+new Date(x.created_at).toLocaleDateString('en-PH'),x.status]);
 entries('activity',[...(data.orders||[]).map(x=>({date:x.created_at,description:'Referred order',status:x.status})),...(data.payouts||[]).map(x=>({date:x.created_at,description:'Payout request',status:x.status}))].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5),x=>[x.description+' · '+new Date(x.date).toLocaleDateString('en-PH'),x.status]);
}
async function load(){try{fill(await api('/api/partner/dashboard'));navigate(location.hash.slice(1)||'overview')}catch(e){location.replace('/partner')}}
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('referral').value);notice('Referral link copied.')}catch{ $('referral').select();notice('Select and copy your referral link.')}};
$('payout').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;notice('');try{await api('/api/partner/payout',Object.fromEntries(new FormData(e.target)));notice('Payout request submitted.');e.target.reset();fill(await api('/api/partner/dashboard'))}catch(err){notice(err.message)}finally{btn.disabled=false}};
$('logout').onclick=async()=>{try{await api('/api/partner/logout',{})}finally{location.replace('/partner')}};
async function loadMessages(){
 try{const d=await api('/api/partner/messages');const el=$('thread');el.replaceChildren();
 if(!d.messages.length){const p=document.createElement('p');p.className='empty';p.textContent='No messages yet. Send a message to the DONEDEAL team below.';el.append(p)}
 for(const m of d.messages){const b=document.createElement('div');b.className='bubble '+(m.sender==='partner'?'mine':'');b.textContent=m.body;const meta=document.createElement('small');meta.textContent=(m.sender==='partner'?'You':'DONEDEAL Admin')+' · '+m.created_at;b.append(meta);el.append(b)}
 el.scrollTop=el.scrollHeight;$('unread').hidden=true;
 }catch(e){notice(e.message)}
}
$('message-form').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;notice('');try{await api('/api/partner/messages',{message:$('message-text').value});$('message-text').value='';await loadMessages()}catch(err){notice(err.message)}finally{btn.disabled=false}};
load();
