async function startPrivateCheckout(vaultStorage){
const productCatalog={"Huawei-0":{"name":"Huawei Pura 80 Ultra","brand":"Huawei"},"Huawei-1":{"name":"Huawei Pura 80 Pro","brand":"Huawei"},"Huawei-2":{"name":"Huawei Mate X6","brand":"Huawei"},"Huawei-3":{"name":"Huawei Pura 70 Pro","brand":"Huawei"},"Huawei-4":{"name":"Huawei nova 13 Pro","brand":"Huawei"},"Samsung-0":{"name":"Samsung Galaxy S25 Ultra","brand":"Samsung"},"Samsung-1":{"name":"Samsung Galaxy S25+","brand":"Samsung"},"Samsung-2":{"name":"Samsung Galaxy S25","brand":"Samsung"},"Samsung-3":{"name":"Samsung Galaxy Z Fold7","brand":"Samsung"},"Samsung-4":{"name":"Samsung Galaxy Z Flip7","brand":"Samsung"},"OPPO-0":{"name":"OPPO Find X9 Pro","brand":"OPPO"},"OPPO-1":{"name":"OPPO Find X9","brand":"OPPO"},"OPPO-2":{"name":"OPPO Find X8 Pro","brand":"OPPO"},"OPPO-3":{"name":"OPPO Find N5","brand":"OPPO"},"OPPO-4":{"name":"OPPO Reno13 Pro","brand":"OPPO"},"vivo-0":{"name":"vivo X300 Pro","brand":"vivo"},"vivo-1":{"name":"vivo X300","brand":"vivo"},"vivo-2":{"name":"vivo X200 Pro","brand":"vivo"},"vivo-3":{"name":"vivo X200","brand":"vivo"},"vivo-4":{"name":"vivo V60","brand":"vivo"},"Xiaomi-0":{"name":"Xiaomi 17 Ultra","brand":"Xiaomi"},"Xiaomi-1":{"name":"Xiaomi 17 Pro Max","brand":"Xiaomi"},"Xiaomi-2":{"name":"Xiaomi 15 Ultra","brand":"Xiaomi"},"Xiaomi-3":{"name":"Xiaomi 15","brand":"Xiaomi"},"Xiaomi-4":{"name":"Xiaomi 14T Pro","brand":"Xiaomi"},"Apple-0":{"name":"Apple iPhone 17 Pro Max","brand":"Apple"},"Apple-1":{"name":"Apple iPhone 17 Pro","brand":"Apple"},"Apple-2":{"name":"Apple iPhone Air","brand":"Apple"},"Apple-3":{"name":"Apple iPhone 17","brand":"Apple"},"Apple-4":{"name":"Apple iPhone 16 Pro Max","brand":"Apple"},"Apple-5":{"name":"Apple iPhone 16 Pro","brand":"Apple"},"Apple-6":{"name":"Apple iPhone 16 Plus","brand":"Apple"},"Apple-7":{"name":"Apple iPhone 16","brand":"Apple"},"Apple-8":{"name":"Apple iPhone 16e","brand":"Apple"},"Apple-9":{"name":"Apple iPhone 15","brand":"Apple"}};
'use strict';
const $=id=>document.getElementById(id);
const money=n=>'₱'+(n/100).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const savedKey='doneDealCheckoutDetailsV1',contactKeys=['name','phone','email'],addressKeys=['address','city','province','postal'];
let cart={},saved=null,quote=null,requestNumber=0,submitting=false,completed=false,catalogLoaded=false;
const catalog=new Map();
try{const value=JSON.parse(vaultStorage.getItem('doneDealCart')||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))cart=value}catch{}
for(const [sku,q] of Object.entries(cart))if(!Number.isInteger(Number(q))||Number(q)<1||Number(q)>99)delete cart[sku];
let selected=new Set(Object.keys(cart));
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el}
function storeCart(){try{vaultStorage.setItem('doneDealCart',JSON.stringify(cart))}catch{}}
function items(){return Object.entries(cart).filter(([sku])=>selected.has(sku)).map(([sku,q])=>({sku,quantity:Number(q)}))}
function fulfillment(){return document.querySelector('input[name="fulfillment"]:checked').value}
function fields(keys){return Object.fromEntries(keys.map(k=>[k,$(k).value.trim()]))}
function validSaved(value){return value&&value.version===1&&value.contact&&contactKeys.every(k=>typeof value.contact[k]==='string'&&value.contact[k].length<=160)&&value.contact.name.trim()&&/^(09\d{9}|\+639\d{9})$/.test(value.contact.phone)&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.contact.email)}
function addressValid(a){return a&&addressKeys.every(k=>typeof a[k]==='string'&&a[k].trim()&&a[k].length<=(k==='address'?400:100))&&/^\d{4}$/.test(a.postal)}
function summary(target,values,badge=false){target.replaceChildren();if(badge)target.append(node('span','badge','Default'));for(const text of values)target.append(node('p',null,text))}
function showContact(){summary($('contactSummary'),contactKeys.map(k=>$(k).value));$('contactSummary').hidden=false;$('contactFields').hidden=true;$('editContact').hidden=false}
function showAddress(){summary($('addressSummary'),[$('name').value,$('address').value,`${$('city').value}, ${$('province').value} ${$('postal').value}`,$('phone').value],true);$('addressSummary').hidden=false;$('addressFields').hidden=true;$('editAddress').hidden=false;$('differentAddress').hidden=false}
function editContact(){ $('contactFields').hidden=false;$('contactSummary').hidden=true;$('editContact').hidden=true;$('name').focus() }
function editAddress(clear=false){$('addressFields').hidden=false;$('addressSummary').hidden=true;$('editAddress').hidden=true;$('differentAddress').hidden=true;if(clear)addressKeys.forEach(k=>$(k).value='');$('address').focus()}
function updateFulfillment(){const delivery=fulfillment()==='delivery';$('deliverySection').hidden=!delivery;$('pickupNote').hidden=delivery;addressKeys.forEach(k=>{$(k).required=delivery;$(k).disabled=!delivery});$('feeLabel').textContent=delivery?'Delivery fee':'Pickup';$('feeValue').textContent=delivery?'To be confirmed':'To be arranged';$('shippingNote').textContent=delivery?'Shipping is not included. Our team will confirm the delivery fee before dispatch.':'Pickup time and location will be confirmed by our team.';$('paymentMethod').options[0].textContent=delivery?'Cash on delivery':'Pay at pickup'}
function restoreDetails(){try{const value=JSON.parse(vaultStorage.getItem(savedKey)||'null');if(!validSaved(value))return;saved=value;contactKeys.forEach(k=>$(k).value=value.contact[k]);if(addressValid(value.address)){addressKeys.forEach(k=>$(k).value=value.address[k]);showAddress()}if(['pickup','delivery'].includes(value.fulfillment))document.querySelector(`input[name="fulfillment"][value="${value.fulfillment}"]`).checked=true;$('paymentMethod').value='cod';$('remember').checked=true;$('forget').hidden=false;showContact();$('welcome').textContent='Your details are ready. Review your order below.'}catch{}}
function saveDetails(){if(!$('remember').checked)return;const address=fields(addressKeys);const value={version:1,contact:fields(contactKeys),address:addressValid(address)?address:(saved?.address||null),fulfillment:fulfillment(),payment:$('paymentMethod').value};try{vaultStorage.setItem(savedKey,JSON.stringify(value));saved=value;$('saveStatus').textContent='Your details are saved on this browser and device.';$('forget').hidden=false}catch{$('saveStatus').textContent='This browser could not save your details. Your order can still be placed.'}}
function forgetDetails(){try{vaultStorage.removeItem(savedKey)}catch{$('saveStatus').textContent='Unable to remove saved details. Please clear this site’s browser data.';return}saved=null;$('remember').checked=false;$('forget').hidden=true;$('saveStatus').textContent='Saved details removed from this browser.'}
function updateSubmit(){ $('pay').disabled=!quote||submitting||completed; }
function renderCart(){const list=$('cartList');list.replaceChildren();const keys=Object.keys(cart);$('cartCountLabel').textContent=`${keys.length} gadget${keys.length===1?'':'s'}`;$('selectAll').checked=keys.length>0&&keys.every(k=>selected.has(k));$('selectAll').indeterminate=keys.some(k=>selected.has(k))&&!keys.every(k=>selected.has(k));if(!keys.length){list.append(node('p','muted','Your cart is empty. Add a gadget to get started.'));return}
for(const sku of keys){const [id,variant='']=sku.split('::'),p=catalog.get(sku),verified=quote?.items.find(i=>i.sku===sku);const name=p?.name||productCatalog[id]?.name||id;
const row=node('div','cart-product'+(selected.has(sku)?'':' is-unselected')),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(sku);check.disabled=submitting;check.setAttribute('aria-label','Select '+name);check.onchange=()=>{check.checked?selected.add(sku):selected.delete(sku);refresh()};
const tile=node('div','phone-tile');const fallback=()=>tile.replaceChildren(node('span','phone-symbol','▯'));if(p?.image_key){const img=document.createElement('img');img.alt=name;img.decoding='async';img.onerror=fallback;img.src='/api/images/'+p.image_key;tile.append(img)}else fallback();
const info=node('div');info.append(node('div','cart-product-name',name),node('div','cart-product-variant',variant));const amount=verified?verified.subtotal:(p?Number(p.price_centavos)*Number(cart[sku]):null);info.append(node('div','cart-product-price',amount===null?'Checking price…':money(amount)));
const qty=node('div','qty-row'),minus=node('button',null,'−'),count=node('span',null,String(cart[sku])),plus=node('button',null,'+'),remove=node('button','remove-item','Remove');for(const b of [minus,plus,remove])b.type='button';minus.setAttribute('aria-label','Decrease '+name+' quantity');plus.setAttribute('aria-label','Increase '+name+' quantity');minus.disabled=submitting;remove.disabled=submitting;plus.disabled=submitting||!catalogLoaded||!p||Number(cart[sku])>=Math.min(Number(p.stock)||0,99);minus.onclick=()=>change(sku,-1);plus.onclick=()=>change(sku,1);remove.onclick=()=>{delete cart[sku];selected.delete(sku);storeCart();refresh()};qty.append(minus,count,plus,remove);info.append(qty);if(catalogLoaded&&(!p||Number(p.stock)<Number(cart[sku])))info.append(node('div','stock-note',p?'Quantity exceeds current stock.':'Currently unavailable.'));row.append(check,tile,info);list.append(row)}}
function change(sku,d){if(submitting)return;const next=Number(cart[sku])+d,p=catalog.get(sku);if(d>0&&(!p||next>Math.min(Number(p.stock)||0,99)))return;if(next<=0){delete cart[sku];selected.delete(sku)}else cart[sku]=next;storeCart();refresh()}
async function loadQuote(){const request=++requestNumber;quote=null;updateSubmit();$('total').textContent=$('mobileTotal').textContent='—';$('quoteStatus').className='muted';const chosen=items();if(!chosen.length){$('quoteStatus').textContent='Select at least one gadget to place an order.';return}$('quoteStatus').textContent='Checking prices and availability…';try{const r=await fetch('/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:chosen})}),d=await r.json();if(!r.ok)throw Error(d.error||'Unable to check prices and stock.');if(request!==requestNumber||completed)return;quote=d;$('total').textContent=$('mobileTotal').textContent=money(d.total);$('quoteStatus').textContent='Prices and availability checked.';renderCart();updateSubmit()}catch(e){if(request!==requestNumber)return;$('quoteStatus').textContent=e.message;$('quoteStatus').className='error';updateSubmit()}}
function refresh(){if(submitting||completed)return;quote=null;renderCart();loadQuote()}
async function submitOrder(e){e.preventDefault();if(submitting||completed||!quote)return;if(!$('checkoutForm').checkValidity()){if(contactKeys.some(k=>!$(k).checkValidity()))editContact();if(fulfillment()==='delivery'&&addressKeys.some(k=>!$(k).checkValidity()))editAddress();$('checkoutForm').reportValidity();return}
if($('remember').checked&&!DDPrivateVault.isUnlocked()){const unlocked=await DDPrivateVault.prompt();if(!unlocked)return;}
if($('paymentMethod').value!=='cod'){$('status').textContent='Online payments are coming soon. Please choose cash on delivery or pay at pickup.';return}
const submittedItems=items(),customer=fields([...contactKeys,...addressKeys]);if(fulfillment()==='pickup')addressKeys.forEach(k=>customer[k]='');submitting=true;updateSubmit();$('checkoutForm').setAttribute('aria-busy','true');$('status').className='muted';$('status').textContent='Submitting your order request…';$('pay').textContent='Submitting…';const controls=[...$('checkoutForm').querySelectorAll('input,select,textarea,button')],disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);
try{const r=await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:submittedItems,customer,fulfillment:fulfillment(),payment_method:$('paymentMethod').value})}),d=await r.json();if(!r.ok)throw Error(d.error||'Your order could not be saved.');saveDetails();recordOrder(d,submittedItems,customer);try{await DDPrivateVault.flush()}catch{ /* The server order is saved even if local privacy storage is full. */ }for(const item of submittedItems)delete cart[item.sku];storeCart();completed=true;$('checkoutForm').hidden=true;$('success').hidden=false;renderConfirmation(d,customer);$('trackOrder').href='track-order.html?order='+encodeURIComponent(d.order_id||'');$('success').focus();window.scrollTo({top:0,behavior:'smooth'})}catch(e){$('status').textContent=e.message;$('status').className='error'}finally{submitting=false;controls.forEach((el,i)=>el.disabled=disabled[i]);$('checkoutForm').removeAttribute('aria-busy');$('pay').textContent='Place order request';if(!completed){updateFulfillment();refresh()}updateSubmit()}}
$('checkoutForm').addEventListener('submit',submitOrder);
// Reveal collapsed details before native validation focuses an invalid field.
$('checkoutForm').addEventListener('invalid',e=>{if(contactKeys.includes(e.target.id)){$('contactFields').hidden=false;$('contactSummary').hidden=true;$('editContact').hidden=true}if(addressKeys.includes(e.target.id)){$('addressFields').hidden=false;$('addressSummary').hidden=true;$('editAddress').hidden=true}},true);
$('selectAll').onchange=e=>{selected=e.target.checked?new Set(Object.keys(cart)):new Set();refresh()};
document.querySelectorAll('input[name="fulfillment"]').forEach(el=>el.onchange=updateFulfillment);
$('editContact').onclick=editContact;$('editAddress').onclick=()=>editAddress();$('differentAddress').onclick=()=>editAddress(true);$('forget').onclick=forgetDetails;
$('remember').onchange=()=>{if(!$('remember').checked&&saved)forgetDetails()};
function applyTheme(theme){document.documentElement.dataset.theme=theme;document.documentElement.dataset.ddStoreTheme=theme;$('theme').textContent=theme==='light'?'Dark mode':'Light mode'}
try{applyTheme(vaultStorage.getItem('dd_store_theme_v1')==='light'?'light':'dark')}catch{applyTheme('dark')}
$('theme').onclick=()=>{const theme=document.documentElement.dataset.theme==='light'?'dark':'light';applyTheme(theme);try{vaultStorage.setItem('dd_store_theme_v1',theme)}catch{}};
// Saved details are only decrypted after an explicit customer choice.
if(window.DDPrivateVault.has()){
 const useSaved=document.createElement('button');useSaved.type='button';useSaved.className='secondary-action';useSaved.id='useDefaultDetails';useSaved.textContent='Use my default information';
 const hint=document.createElement('p');hint.className='muted';hint.textContent='Enter details below, or unlock your saved contact and delivery information.';
 $('checkoutForm').prepend(useSaved,hint);
 useSaved.onclick=async()=>{useSaved.disabled=true;try{const ok=await DDPrivateVault.prompt();if(!ok)return;restoreDetails();updateFulfillment();refresh();useSaved.textContent=saved?'Default information applied':'No default information saved';}finally{useSaved.disabled=false}};
}
updateFulfillment();refresh();
async function loadCatalog(){try{const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)throw Error('Catalog unavailable');const d=await r.json();for(const p of d.products||[])catalog.set(p.sku,p);catalogLoaded=true;if(!submitting&&!completed)renderCart()}catch{ /* Quote and order APIs remain authoritative if the photo catalog fails. */ }}
loadCatalog();

// Record only successful orders created on this browser. No sample history.
function recordOrder(result,ordered,customer){
 if(!result.order_id)return;
 try{
  const key='doneDealOrderHistoryV1';
  let history=JSON.parse(vaultStorage.getItem(key)||'[]');
  if(!Array.isArray(history))history=[];
  const entry={id:result.order_id,created_at:new Date().toISOString(),phone:customer.phone,fulfillment:fulfillment(),total:quote.total,items:quote.items.map(item=>({name:item.name,variant:item.variant,quantity:item.quantity,subtotal:item.subtotal,image_key:catalog.get(item.sku)?.image_key||''}))};
  vaultStorage.setItem(key,JSON.stringify([entry,...history.filter(o=>o&&o.id!==entry.id)].slice(0,50)));
 }catch{}
}

function renderConfirmation(result,customer){
 const delivery=fulfillment()==='delivery';
 document.querySelector('.intro').hidden=true;
 $('orderReference').textContent=result.order_id||'Pending';
 $('confirmedItems').replaceChildren();
 for(const item of quote.items){
  const row=node('div','confirmed-item'),tile=node('div','phone-tile'),p=catalog.get(item.sku);
  if(p?.image_key){const img=document.createElement('img');img.src='/api/images/'+p.image_key;img.alt=item.name;img.onerror=()=>tile.replaceChildren(node('span','phone-symbol','▯'));tile.append(img)}else tile.append(node('span','phone-symbol','▯'));
  const info=node('div');info.append(node('strong',null,item.name),node('p','muted',`${item.variant} · Qty: ${item.quantity}`),node('strong','confirmed-price',money(item.subtotal)));row.append(tile,info);$('confirmedItems').append(row);
 }
 $('confirmedSubtotal').textContent=money(quote.total);
 $('confirmedFeeLabel').textContent=delivery?'Delivery fee':'Pickup';
 $('confirmedFee').textContent=delivery?'To be confirmed':'To be arranged';
 $('confirmedShipping').textContent=delivery?'Product subtotal excludes shipping. We’ll confirm the delivery fee and final amount before dispatch.':'Our team will confirm your pickup time and location.';
 $('confirmedPayment').textContent=delivery?'Cash on delivery':'Pay at pickup';
 $('nextPaymentTitle').textContent=delivery?'Pay when your order arrives':'Pay when you collect your order';
 $('nextFulfillmentTitle').textContent=delivery?'Delivery details are arranged':'Your pickup is arranged';
 $('nextFulfillmentText').textContent=delivery?'We confirm the delivery fee, final amount, and dispatch schedule.':'We confirm the pickup location and tell you when your gadgets are ready.';
 $('confirmedContact').replaceChildren();for(const value of [customer.name,customer.phone,customer.email])$('confirmedContact').append(node('p',null,value));
 $('confirmedAddressTitle').textContent=delivery?'Delivery address':'Store pickup';$('confirmedAddress').replaceChildren();
 for(const value of delivery?[customer.address,`${customer.city}, ${customer.province} ${customer.postal}`]:['Pickup time and location to be confirmed.'])$('confirmedAddress').append(node('p',null,value));
 $('copyOrder').onclick=async()=>{try{await navigator.clipboard.writeText(result.order_id||'');$('copyStatus').textContent='Order reference copied.'}catch{$('copyStatus').textContent='Select and copy the order reference shown above.'}};
}

}

(async function(){
 const vault=window.DDPrivateVault;

 await startPrivateCheckout(vault.storage);
 if(!vault.isUnlocked()){
  const note=document.createElement('p');note.className='muted';note.textContent='Select Save my details to protect saved contact details and order history with a 6-digit PIN.';
  document.getElementById('remember').closest('label').after(note);
 }
})();
