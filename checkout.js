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
 $('reviewAddress').textContent=$('fulfillment').value==='pickup'?'Store pickup — details to be confirmed':[customer.address,customer.city,customer.province,customer.postal].join(', ');
 $('entry').style.display='none';$('review').style.display='block';window.scrollTo({top:0,behavior:'smooth'});
});
$('editBtn').addEventListener('click',()=>{$('review').style.display='none';$('entry').style.display='block';$('status').textContent=''});
$('fulfillment').addEventListener('change',()=>{
 const pickup=$('fulfillment').value==='pickup';
 for(const id of ['address','city','province','postal']){
  const el=$(id);if(el)el.required=!pickup;
 }
});
$('pay').addEventListener('click',async()=>{
 if(!quote||!customer)return;
 const button=$('pay');button.disabled=true;$('status').textContent='Submitting order request…';
 try{
  const r=await fetch('/api/create-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:items(),customer,fulfillment:$('fulfillment').value,payment_method:$('paymentMethod').value})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Order unavailable');
  for(const item of items())delete cart[item.sku];
  save();
  $('review').style.display='block';
  $('review').replaceChildren();
  const box=safeNode('section','dd-order-success');
  box.setAttribute('role','status');
  box.setAttribute('aria-live','polite');
  const celebration=safeNode('div','dd-order-celebration');
  celebration.setAttribute('aria-hidden','true');
  const bag=safeNode('div','dd-order-bag','✓');
  celebration.append(bag);
  for(let i=0;i<18;i++){
    const bit=safeNode('i','dd-order-confetti');
    bit.style.setProperty('--i',String(i));
    bit.style.setProperty('--angle',(i*20)+'deg');
    celebration.append(bit);
  }
  box.append(celebration);
  box.append(safeNode('h2','dd-order-bounce-title','Order Request Received!'));
  box.append(safeNode('p','muted','Thank you! Your order is awaiting confirmation.'));
  box.append(safeNode('p','muted','Order reference: '+(d.order_id||'Pending')));
  if(d.message)box.append(safeNode('p','muted',d.message));
  const a=safeNode('a','btn','Continue shopping');a.href='shop.html';box.append(a);
  $('review').append(box);
  window.scrollTo({top:0,behavior:'smooth'});
  $('step2').className='step done';$('step3').className='step active';
  $('status').textContent='';
 }catch(e){$('status').textContent=e.message;$('status').className='error';button.disabled=false}
});

refresh();
async function loadCheckoutCatalog(){
 try{
  const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)return;
  const d=await r.json();
  for(const p of d.products||[]){
   const id=p.sku.split('::')[0];
   if(!productCatalog[id])productCatalog[id]={name:p.name,brand:p.brand||''};
   if(!catalogPrices[id])catalogPrices[id]={};
   catalogPrices[id][p.variant]=p.price_centavos/100;
  }
  renderCart();
 }catch(e){console.warn('Catalog preview unavailable',e)}
}
loadCheckoutCatalog();

(function(){
 if(window.__ddMotionInstalled)return;
 window.__ddMotionInstalled=true;
 const st=document.createElement('style');st.id='dd-motion-style';st.textContent='\n/* Done Deal motion system */\n@keyframes ddEnter{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:translateY(0)}}\n@keyframes ddOverlayEnter{from{opacity:0}to{opacity:1}}\n@keyframes ddModalEnter{from{opacity:0;transform:translateY(15px) scale(.975)}to{opacity:1;transform:translateY(0) scale(1)}}\n@keyframes ddDrawerEnter{from{transform:translateX(24px);opacity:.55}to{transform:translateX(0);opacity:1}}\n@keyframes ddCartPulse{0%,100%{transform:scale(1)}45%{transform:scale(1.13)}}\nbody.dd-motion-ready main,body.dd-motion-ready .wrap{animation:ddEnter .38s cubic-bezier(.2,.7,.25,1) both}\nbody.dd-leaving main,body.dd-leaving .wrap{opacity:0;transform:translateY(-7px);transition:opacity .2s ease,transform .2s ease}\na,button,.btn,.chip,.brandTile,.dd-brand-tile,.product,.variantOption{transition:transform .2s ease,box-shadow .22s ease,background-color .2s ease,border-color .2s ease,filter .2s ease}\nbutton:not(:disabled):active,.btn:not(:disabled):active,.chip:active,.variantOption:active{transform:scale(.965)}\n.product:hover,.dd-brand-tile:hover{transform:translateY(-5px);box-shadow:0 15px 35px #0005,0 0 0 1px #ec438366}\n.product:hover .visual img,.dd-brand-tile:hover img{transform:scale(1.035);transition:transform .35s ease}\n.overlay.open{animation:ddOverlayEnter .22s ease both}\n.overlay.open .modal{animation:ddModalEnter .27s cubic-bezier(.2,.7,.2,1) both}\n.overlay.open .drawer{animation:ddDrawerEnter .3s cubic-bezier(.2,.7,.2,1) both}\n#cartCount.dd-count-pulse{animation:ddCartPulse .42s ease}\n:focus-visible{outline:2px solid #ff7eae;outline-offset:3px}\n@media(prefers-reduced-motion:reduce){body.dd-motion-ready main,body.dd-motion-ready .wrap,.overlay.open,.overlay.open .modal,.overlay.open .drawer,#cartCount.dd-count-pulse{animation:none!important}body.dd-leaving main,body.dd-leaving .wrap{opacity:1;transform:none}a,button,.btn,.chip,.brandTile,.dd-brand-tile,.product,.variantOption{transition:none!important;transform:none!important}}\n';document.head.append(st);
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduce)requestAnimationFrame(()=>document.body.classList.add('dd-motion-ready'));
 document.addEventListener('click',e=>{
  const link=e.target.closest('a[href]');
  if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||link.target&&link.target!=='_self'||link.hasAttribute('download'))return;
  const u=new URL(link.href,location.href);
  if(u.origin!==location.origin||!u.pathname.endsWith('.html')||u.pathname===location.pathname&&u.search===location.search)return;
  if(reduce)return;
  e.preventDefault();
  document.body.classList.add('dd-leaving');
  setTimeout(()=>location.assign(u.href),210);
 },false);
})();



(function installOrderConfirmationMotion(){
 if(document.getElementById('dd-order-success-style'))return;
 const style=document.createElement('style');
 style.id='dd-order-success-style';
 style.textContent=`
 .dd-order-success{position:relative;text-align:center;max-width:560px;margin:18px auto;padding:26px 20px 32px;border:1px solid #ff70b04d;border-radius:22px;background:linear-gradient(155deg,#28242e,#17171d);box-shadow:0 22px 60px #0005;overflow:hidden}
 .dd-order-success h2{margin:8px 0 12px;color:#fff}
 .dd-order-success .dd-order-bounce-title{font-size:clamp(1.55rem,4.2vw,2.35rem);font-weight:850;letter-spacing:-.035em;line-height:1.15;transform-origin:center bottom;animation:ddHeadlineBounce 1.3s cubic-bezier(.2,.8,.25,1) .12s both}
 .dd-order-success .muted{line-height:1.65;overflow-wrap:anywhere}
 .dd-order-success .btn{display:inline-block;margin-top:20px}
 .dd-order-celebration{height:140px;position:relative;display:grid;place-items:center}
 .dd-order-bag{width:92px;height:92px;border-radius:26px;background:linear-gradient(145deg,#ff66af,#d32175);color:white;display:grid;place-items:center;font-size:58px;font-weight:800;box-shadow:0 15px 35px #d3217566;z-index:2;animation:ddOrderBounce .95s cubic-bezier(.2,.85,.25,1.15) both}
 .dd-order-confetti{position:absolute;left:50%;top:50%;width:8px;height:13px;border-radius:3px;background:hsl(calc(var(--i)*23 + 310) 95% 72%);transform:rotate(var(--angle)) translateY(-10px);opacity:0;animation:ddOrderConfetti 1.25s ease-out .18s both}
 @keyframes ddHeadlineBounce{0%{opacity:0;transform:translateY(-70px) scale(.65)}30%{opacity:1;transform:translateY(12px) scale(1.12)}48%{transform:translateY(-15px) scale(.94)}66%{transform:translateY(7px) scale(1.05)}82%{transform:translateY(-4px) scale(.99)}100%{opacity:1;transform:translateY(0) scale(1)}}
 @keyframes ddOrderBounce{0%{opacity:0;transform:translateY(-95px) scale(.55) rotate(-15deg)}40%{opacity:1;transform:translateY(15px) scale(1.1) rotate(6deg)}65%{transform:translateY(-14px) scale(.96) rotate(-3deg)}82%{transform:translateY(5px) scale(1.03)}100%{transform:translateY(0) scale(1)}}
 @keyframes ddOrderConfetti{0%{opacity:0;transform:rotate(var(--angle)) translateY(-12px) scale(.4)}20%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(-118px) rotate(170deg)}}
 @media(prefers-reduced-motion:reduce){.dd-order-bag,.dd-order-confetti,.dd-order-bounce-title{animation:none!important}.dd-order-confetti{display:none}}
 `;
 document.head.append(style);
})();
