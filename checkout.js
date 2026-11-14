const productCatalog={"Huawei-0":{"name":"Huawei Pura 80 Ultra","brand":"Huawei"},"Huawei-1":{"name":"Huawei Pura 80 Pro","brand":"Huawei"},"Huawei-2":{"name":"Huawei Mate X6","brand":"Huawei"},"Huawei-3":{"name":"Huawei Pura 70 Pro","brand":"Huawei"},"Huawei-4":{"name":"Huawei nova 13 Pro","brand":"Huawei"},"Samsung-0":{"name":"Samsung Galaxy S25 Ultra","brand":"Samsung"},"Samsung-1":{"name":"Samsung Galaxy S25+","brand":"Samsung"},"Samsung-2":{"name":"Samsung Galaxy S25","brand":"Samsung"},"Samsung-3":{"name":"Samsung Galaxy Z Fold7","brand":"Samsung"},"Samsung-4":{"name":"Samsung Galaxy Z Flip7","brand":"Samsung"},"OPPO-0":{"name":"OPPO Find X9 Pro","brand":"OPPO"},"OPPO-1":{"name":"OPPO Find X9","brand":"OPPO"},"OPPO-2":{"name":"OPPO Find X8 Pro","brand":"OPPO"},"OPPO-3":{"name":"OPPO Find N5","brand":"OPPO"},"OPPO-4":{"name":"OPPO Reno13 Pro","brand":"OPPO"},"vivo-0":{"name":"vivo X300 Pro","brand":"vivo"},"vivo-1":{"name":"vivo X300","brand":"vivo"},"vivo-2":{"name":"vivo X200 Pro","brand":"vivo"},"vivo-3":{"name":"vivo X200","brand":"vivo"},"vivo-4":{"name":"vivo V60","brand":"vivo"},"Xiaomi-0":{"name":"Xiaomi 17 Ultra","brand":"Xiaomi"},"Xiaomi-1":{"name":"Xiaomi 17 Pro Max","brand":"Xiaomi"},"Xiaomi-2":{"name":"Xiaomi 15 Ultra","brand":"Xiaomi"},"Xiaomi-3":{"name":"Xiaomi 15","brand":"Xiaomi"},"Xiaomi-4":{"name":"Xiaomi 14T Pro","brand":"Xiaomi"},"Apple-0":{"name":"Apple iPhone 17 Pro Max","brand":"Apple"},"Apple-1":{"name":"Apple iPhone 17 Pro","brand":"Apple"},"Apple-2":{"name":"Apple iPhone Air","brand":"Apple"},"Apple-3":{"name":"Apple iPhone 17","brand":"Apple"},"Apple-4":{"name":"Apple iPhone 16 Pro Max","brand":"Apple"},"Apple-5":{"name":"Apple iPhone 16 Pro","brand":"Apple"},"Apple-6":{"name":"Apple iPhone 16 Plus","brand":"Apple"},"Apple-7":{"name":"Apple iPhone 16","brand":"Apple"},"Apple-8":{"name":"Apple iPhone 16e","brand":"Apple"},"Apple-9":{"name":"Apple iPhone 15","brand":"Apple"}};
const catalogPrices={"Huawei-0":{"16GB / 512GB":89999},"Huawei-1":{"12GB / 512GB":59999}};
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
  const photo=safeNode('div','phone-tile');photo.append(safeNode('span','phone-symbol','▯'));photo.title='Product photo not yet available';
  const info=safeNode('div');const [id,storage='']=key.split('::');const product=productCatalog[id];info.append(safeNode('div','cart-product-name',product?.name||id));
  info.append(safeNode('div','cart-product-variant',storage||'Storage to confirm'));
  const side=safeNode('div','cart-product-side');
  const published=catalogPrices[id]?.[storage];side.append(safeNode('div','cart-product-price',published?'Catalog SRP: ₱'+published.toLocaleString('en-PH'):'Price to confirm'));
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
  const url=new URL(d.checkout_url);if(url.protocol!=='https:'||!(url.hostname==='checkout.paymongo.com'||url.hostname.endsWith('.paymongo.com')))throw Error('Unexpected payment URL');
  $('step2').className='step done';$('step3').className='step active';location.assign(d.checkout_url);
 }catch(e){$('status').textContent=e.message;$('status').className='error';button.disabled=false}
});
refresh();
