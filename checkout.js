const $=id=>document.getElementById(id);
const money=n=>'₱'+(n/100).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
let cart={};try{cart=JSON.parse(localStorage.getItem('doneDealCart')||'{}')}catch{}
const validQty=q=>Number.isInteger(Number(q))&&Number(q)>0;
for(const [k,v] of Object.entries(cart))if(!validQty(v))delete cart[k];
let selected=new Set(Object.keys(cart)),quote=null,customer=null,requestNumber=0;
function save(){localStorage.setItem('doneDealCart',JSON.stringify(cart))}
function items(){return Object.entries(cart).filter(([k,q])=>selected.has(k)&&validQty(q)).map(([sku,quantity])=>({sku,quantity:Number(quantity)}))}
function safeNode(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el}
function renderCart(){
 const list=$('cartList');list.replaceChildren();
 const keys=Object.keys(cart).filter(k=>validQty(cart[k]));
 $('cartCountLabel').textContent=`${keys.length} product${keys.length===1?'':'s'} in cart`;
 $('selectAll').checked=keys.length>0&&keys.every(k=>selected.has(k));
 $('selectAll').indeterminate=keys.some(k=>selected.has(k))&&!keys.every(k=>selected.has(k));
 if(!keys.length){list.append(safeNode('div','empty-cart','Your shopping cart is empty.'));return}
 for(const key of keys){
  const row=safeNode('div','cart-product'+(selected.has(key)?'':' is-unselected'));
  const check=document.createElement('input');check.type='checkbox';check.className='cart-select';check.checked=selected.has(key);check.setAttribute('aria-label','Select '+key);check.addEventListener('change',()=>{check.checked?selected.add(key):selected.delete(key);refresh()});
  const photo=safeNode('div','phone-tile');photo.append(safeNode('span','phone-symbol','▯'));
  const info=safeNode('div');info.append(safeNode('div','cart-product-name',key.replace(/-\d+\|/,' · ').replace(/\|/g,' · ')));
  info.append(safeNode('div','cart-product-variant','Configuration will be verified at checkout'));
  const side=safeNode('div','cart-product-side');
  side.append(safeNode('div','cart-product-price','Price verified in summary'));
  const qty=safeNode('div','qty-row');
  const minus=safeNode('button',null,'−');minus.type='button';minus.setAttribute('aria-label','Decrease quantity');
  const count=safeNode('span',null,String(cart[key]));
  const plus=safeNode('button',null,'+');plus.type='button';plus.setAttribute('aria-label','Increase quantity');
  minus.addEventListener('click',()=>change(key,-1));plus.addEventListener('click',()=>change(key,1));
  qty.append(minus,count,plus);side.append(qty);
  const remove=safeNode('button','remove-item','Remove');remove.type='button';remove.addEventListener('click',()=>{delete cart[key];selected.delete(key);save();refresh()});side.append(remove);
  row.append(check,photo,info,side);list.append(row);
 }
}
function change(key,d){const n=Number(cart[key]||0)+d;if(n<=0){delete cart[key];selected.delete(key)}else cart[key]=Math.min(n,20);save();refresh()}
async function loadQuote(){
 const request=++requestNumber;quote=null;$('deliveryBtn').disabled=true;$('reviewBtn').disabled=true;$('pay').disabled=true;
 const chosen=items();$('items').replaceChildren();$('total').textContent='—';$('productTotal').textContent='—';
 if(!chosen.length){$('items').textContent='Select at least one item to see your total.';return}
 $('items').textContent='Checking prices and stock…';
 try{
  const r=await fetch('/api/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:chosen})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to price selected items');
  if(request!==requestNumber)return;quote=d;
  $('items').replaceChildren();
  for(const item of d.items){const row=safeNode('div','item');row.append(safeNode('span',null,`${item.name} · ${item.variant} × ${item.quantity}`),safeNode('strong',null,money(item.subtotal)));$('items').append(row)}
  $('total').textContent=money(d.total);$('productTotal').textContent=money(d.total);
  $('deliveryBtn').disabled=false;$('reviewBtn').disabled=false;$('pay').disabled=false;
 }catch(e){if(request!==requestNumber)return;$('items').textContent=e.message;$('items').className='error';$('total').textContent='Unavailable';$('productTotal').textContent='Unavailable'}
}
function refresh(){renderCart();loadQuote()}
$('selectAll').addEventListener('change',e=>{selected=e.target.checked?new Set(Object.keys(cart)):new Set();refresh()});
$('deliveryBtn').addEventListener('click',()=>{if(!quote)return;$('cartStage').style.display='none';$('entry').style.display='block';$('step1').className='step done';$('step2').className='step active';window.scrollTo({top:0,behavior:'smooth'})});
$('form').addEventListener('submit',e=>{
 e.preventDefault();if(!quote||!$('form').reportValidity())return;
 customer=Object.fromEntries(new FormData($('form')));
 $('reviewName').textContent=customer.name;$('reviewEmail').textContent=customer.email;$('reviewPhone').textContent=customer.phone;
 $('reviewAddress').textContent=[customer.address,customer.city,customer.province,customer.postal].join(', ');
 $('entry').style.display='none';$('review').style.display='block';window.scrollTo({top:0,behavior:'smooth'});
});
$('editBtn').addEventListener('click',()=>{$('review').style.display='none';$('entry').style.display='block';$('status').textContent=''});
$('pay').addEventListener('click',async()=>{
 if(!quote||!customer)return;
 const button=$('pay');button.disabled=true;$('status').textContent='Preparing secure payment…';
 try{
  const r=await fetch('/api/create-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:items(),customer})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Checkout unavailable');
  const url=new URL(d.checkout_url);if(url.protocol!=='https:'||url.hostname!=='checkout.paymongo.com')throw Error('Unexpected payment URL');
  $('step2').className='step done';$('step3').className='step active';location.assign(d.checkout_url);
 }catch(e){$('status').textContent=e.message;$('status').className='error';button.disabled=false}
});
refresh();
