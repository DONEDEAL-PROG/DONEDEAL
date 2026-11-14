const entries={
Huawei:[
['Pura 80 Ultra','Photography flagship with advanced dual-telephoto imaging.','6.8-inch LTPO OLED • 50MP main • 100W wired charging','Flagship'],
['Pura 80 Pro','Premium camera phone with refined design and rapid charging.','6.8-inch LTPO OLED • 50MP main • 100W wired charging','Premium'],
['Mate X6','Book-style foldable built for multitasking and productivity.','7.93-inch inner OLED • 50MP main • 66W wired charging','Foldable'],
['Pura 70 Pro','Versatile flagship featuring a variable-aperture camera.','6.8-inch LTPO OLED • Kirin 9010 • 50MP main','Camera'],
['nova 13 Pro','Portrait-first design with advanced selfie capabilities.','6.76-inch OLED • 50MP main • 100W wired charging','Portrait']],
Samsung:[
['Galaxy S25 Ultra','S Pen flagship with a large display and pro-grade cameras.','6.9-inch AMOLED • Snapdragon 8 Elite for Galaxy • 200MP main','Flagship'],
['Galaxy S25+','Large-screen flagship for everyday creativity.','6.7-inch AMOLED • 50MP main • 4900mAh battery','Premium'],
['Galaxy S25','Compact flagship with powerful Galaxy AI features.','6.2-inch AMOLED • 50MP main • 4000mAh battery','Compact'],
['Galaxy Z Fold7','Large foldable screen for productivity and entertainment.','8.0-inch inner AMOLED • 200MP main • foldable','Foldable'],
['Galaxy Z Flip7','Pocket-sized flip design with a useful cover screen.','6.9-inch inner AMOLED • 4.1-inch cover • 50MP main','Foldable']],
OPPO:[
['Find X9 Pro','Premium imaging flagship with a large battery.','6.78-inch AMOLED • Dimensity 9500 • 200MP telephoto','Flagship'],
['Find X9','Balanced flagship with fast performance and photography.','6.59-inch AMOLED • Dimensity 9500 • 50MP main','Premium'],
['Find X8 Pro','Quad-camera flagship with advanced zoom features.','6.78-inch AMOLED • Dimensity 9400 • quad 50MP rear','Camera'],
['Find N5','Slim book-style foldable for productivity.','8.12-inch inner AMOLED • Snapdragon 8 Elite • foldable','Foldable'],
['Reno13 Pro','Stylish phone optimized for portraits and everyday use.','6.83-inch AMOLED • Dimensity 8350 • 50MP main','Portrait']],
vivo:[
['X300 Pro','High-end ZEISS imaging flagship with powerful zoom.','6.78-inch AMOLED • Dimensity 9500 • 200MP telephoto','Flagship'],
['X300','Compact premium phone focused on high-resolution photography.','6.31-inch AMOLED • Dimensity 9500 • 200MP main','Compact'],
['X200 Pro','ZEISS photography flagship with long-range telephoto.','6.78-inch AMOLED • Dimensity 9400 • 200MP telephoto','Camera'],
['X200','Balanced flagship with strong camera performance.','6.67-inch AMOLED • Dimensity 9400 • 50MP main','Premium'],
['V60','Portrait-focused mid-premium smartphone with long battery life.','6.77-inch AMOLED • Snapdragon 7 Gen 4 • 6500mAh','Portrait']],
Xiaomi:[
['17 Ultra','Leica photography flagship with advanced optical zoom.','6.9-inch AMOLED • Snapdragon 8 Elite Gen 5 • 200MP telephoto','Flagship'],
['17 Pro Max','Large flagship featuring a secondary rear display.','6.9-inch AMOLED • Snapdragon 8 Elite Gen 5 • rear display','Premium'],
['15 Ultra','Leica camera flagship for serious mobile photography.','6.73-inch AMOLED • Snapdragon 8 Elite • 200MP telephoto','Camera'],
['15','Compact flagship with Leica camera tuning.','6.36-inch AMOLED • Snapdragon 8 Elite • 50MP main','Compact'],
['14T Pro','Performance-focused phone with fast charging.','6.67-inch AMOLED • Dimensity 9300+ • 50MP main','Performance']],
Apple:[
['iPhone 17 Pro Max','Large Pro iPhone for photography and professional video.','6.9-inch OLED ProMotion • A19 Pro • triple 48MP rear','Flagship'],
['iPhone 17 Pro','Powerful Pro iPhone in a more compact form.','6.3-inch OLED ProMotion • A19 Pro • triple 48MP rear','Premium'],
['iPhone Air','Remarkably thin iPhone with premium performance.','6.5-inch OLED ProMotion • A19 Pro • 48MP main','Slim'],
['iPhone 17','Everyday iPhone with a smooth ProMotion display.','6.3-inch OLED ProMotion • A19 • dual 48MP rear','Popular'],
['iPhone 16 Pro Max','Previous-generation Pro Max with strong video capabilities.','6.9-inch OLED ProMotion • A18 Pro • 48MP main','Premium'],
['iPhone 16 Pro','Compact professional iPhone with Camera Control.','6.3-inch OLED ProMotion • A18 Pro • 48MP main','Camera'],
['iPhone 16 Plus','Large-screen everyday iPhone with excellent battery life.','6.7-inch OLED • A18 • 48MP main','Large screen'],
['iPhone 16','Well-rounded iPhone with Apple Intelligence support.','6.1-inch OLED • A18 • 48MP main','Popular'],
['iPhone 16e','Affordable entry into modern iPhone features.','6.1-inch OLED • A18 • 48MP main','Value'],
['iPhone 15','Modern iPhone with Dynamic Island and USB-C.','6.1-inch OLED • A16 Bionic • 48MP main','Value']]
};
// Philippine SRP configuration. Enter only verified official Philippine SRPs.
// Format: 'Apple-0': { amount: 0, variant: '256GB', source: 'Official PH link' }
// Unverified prices deliberately remain unlisted.
const philippineSRP = {};
const specificationLabels = {
  'inch':'Display', 'OLED':'Display', 'AMOLED':'Display',
  'Snapdragon':'Processor', 'Dimensity':'Processor', 'Kirin':'Processor', 'Bionic':'Processor',
  'MP':'Camera', 'mAh':'Battery', 'charging':'Charging', 'foldable':'Form factor',
  'rear display':'Secondary display'
};
function parseSpecs(p){
  const parts=p.spec.split(' • ').filter(Boolean);
  const result=[];
  for(const part of parts){
    let label='Feature';
    if(/inch|OLED|AMOLED|ProMotion|inner/i.test(part))label='Display';
    else if(/Snapdragon|Dimensity|Kirin|Bionic|\bA1[89]\b/i.test(part))label='Processor';
    else if(/MP|telephoto|camera/i.test(part))label='Camera';
    else if(/mAh/i.test(part))label='Battery';
    else if(/charging|\b[0-9]+W\b/i.test(part))label='Charging';
    else if(/foldable/i.test(part))label='Form factor';
    else if(/rear display/i.test(part))label='Secondary display';
    result.push({label,value:part});
  }
  result.push({label:'Storage & RAM',value:'Select the Philippine variant; exact configurations to be confirmed'});
  result.push({label:'Connectivity',value:'Regional network bands and SIM support to be confirmed'});
  result.push({label:'Warranty',value:'Confirm official Philippine warranty and included accessories'});
  return result;
}
function srpFor(p){return philippineSRP[p.id] || null;}
function productPrice(p){const v=variantList(p)[0];return v?v[1]:null;}

// Philippine published SRPs by specific memory variant (not live selling prices).
const phVariants = {"Samsung-0": [["12GB / 256GB", 83190], ["12GB / 512GB", 97790], ["12GB / 1TB", 112390]], "Samsung-1": [["12GB / 256GB", 70790], ["12GB / 512GB", 80090]], "Samsung-2": [["12GB / 256GB", 54090], ["12GB / 512GB", 68690]], "Samsung-3": [["12GB / 256GB", 117590], ["12GB / 512GB", 132090], ["16GB / 1TB", 153990]], "Samsung-4": [["12GB / 256GB", 73890], ["12GB / 512GB", 88390]], "Apple-3": [["256GB", 69990]], "Huawei-0": [["16GB / 512GB", 89999]], "Huawei-1": [["12GB / 512GB", 59999]]};
const verifiedSpecs = {"Huawei-0": {"Display":"6.8-inch LTPO OLED, 1–120Hz, 2848 × 1276","Processor":"Kirin 9020 octa-core","RAM":"16GB","Storage":"512GB","Rear cameras":"50MP 1-inch main + 40MP ultrawide + 50MP telephoto + 12.5MP telephoto","Front camera":"13MP","Battery":"5,170mAh rated","Charging":"100W wired / 80W wireless","Connectivity":"4G LTE, Wi-Fi, Bluetooth, NFC; SIM support depends on variant","Operating system":"EMUI 15.0","Other features":"IP68/IP69, dual telephoto optical zoom"},"Huawei-1":{"Display":"6.8-inch LTPO OLED","Processor":"Kirin 9020","RAM":"12GB","Storage":"512GB","Battery":"5,170mAh rated","Charging":"100W wired"},"Samsung-0": {"Display": "6.9-inch Dynamic AMOLED 2X, 120Hz", "Processor": "Snapdragon 8 Elite for Galaxy", "RAM": "12GB", "Rear cameras": "200MP main + 50MP ultrawide + 50MP telephoto + 10MP telephoto", "Front camera": "12MP", "Battery": "5,000mAh", "Charging": "45W wired", "Connectivity": "5G, Wi-Fi 7, Bluetooth", "Operating system": "Android / One UI", "Other features": "Integrated S Pen, IP68"}, "Samsung-1": {"Display": "6.7-inch Dynamic AMOLED 2X", "Rear camera": "50MP main", "Battery": "4,900mAh", "Operating system": "Android / One UI"}, "Samsung-2": {"Display": "6.2-inch Dynamic AMOLED 2X", "Rear camera": "50MP main", "Battery": "4,000mAh", "Operating system": "Android / One UI"}, "Samsung-3": {"Display": "8.0-inch foldable AMOLED inner display", "Rear camera": "200MP main", "Form factor": "Book-style foldable"}, "Samsung-4": {"Display": "6.9-inch inner AMOLED + 4.1-inch cover", "Rear camera": "50MP main", "Form factor": "Flip foldable"}};
const phSources = {'Samsung':'https://hptotosamsung.com/ph/trade-in/','Apple':'https://www.apple.com/ph/shop/buy-iphone','Huawei':'https://consumer.huawei.com/ph/phones/'};
function variantList(p){return phVariants[p.id]||[];}
const chosenStorage={};
function selectedVariant(p){const list=variantList(p);return list.find(x=>x[0]===chosenStorage[p.id])||list[0]||null;}
function specsFor(p){
 const base=Object.assign({},verifiedSpecs[p.id]||{});
 for(const part of p.spec.split(' • ')){
   const key=/display|oled|amoled|ltpo/i.test(part)?'Display':/snapdragon|dimensity|kirin|bionic|A19|A18/i.test(part)?'Processor':/camera|MP/i.test(part)?'Camera':/battery|mAh/i.test(part)?'Battery':/charging|[0-9]+W/i.test(part)?'Charging':/foldable/i.test(part)?'Form factor':'Highlights';
   if(!base[key])base[key]=part;
 }
 const v=selectedVariant(p);if(v)base['Storage / RAM']=v[0];
 return Object.entries(base);
}
function setDetailVariant(id,value){chosenStorage[id]=value;detail(id);}

const shades={Huawei:'#d1a1a0',Samsung:'#829cdb',OPPO:'#a4c5b3',vivo:'#8aacee',Xiaomi:'#f0b381',Apple:'#c2c8d3'};
const products=Object.entries(entries).flatMap(([brand,items])=>items.map((x,i)=>({id:brand+'-'+i,brand,name:x[0],desc:x[1],spec:x[2],tag:x[3],price:null})));
let filter='All',cart=JSON.parse(localStorage.getItem('doneDealCart')||'{}');
const money=p=>p==null?'PH SRP pending verification':'₱'+p.toLocaleString('en-PH');
function render(){let q=document.getElementById('search').value.toLowerCase(),sort=document.getElementById('sort').value;let data=products.filter(p=>(filter==='All'||p.brand===filter)&&(p.brand+' '+p.name+' '+p.desc+' '+p.spec).toLowerCase().includes(q));if(sort==='az')data.sort((a,b)=>a.name.localeCompare(b.name));if(sort==='brand')data.sort((a,b)=>a.brand.localeCompare(b.brand));document.getElementById('resultCount').textContent=data.length+' products';document.getElementById('catalog').innerHTML=data.map(p=>`<article class="product"><div class="visual" style="--shade:${shades[p.brand]}"><span class="tag">${p.tag}</span><div class="mini"></div></div><div class="pbody"><div class="brand">${p.brand}</div><h3>${p.name}</h3><div class="desc">${p.desc}</div><div class="spec">${p.spec}</div><div class="price">${money(productPrice(p))}<small>Published PH SRP where verified • confirm availability</small></div><div class="actions"><button class="outline" onclick="detail('${p.id}')">View Details</button><button class="primary" onclick="add('${p.id}')">Add to Cart</button></div></div></article>`).join('')||'<div class="empty">No phones found. Try another search.</div>';}
function renderBrands(){document.getElementById('brands').innerHTML=['All',...Object.keys(entries)].map(b=>`<button class="chip ${filter===b?'active':''}" onclick="filter='${b}';renderBrands();render()">${b==='All'?'All Brands':b}</button>`).join('')}
function save(){localStorage.setItem('doneDealCart',JSON.stringify(cart));document.getElementById('cartCount').textContent='('+Object.values(cart).reduce((a,b)=>a+Number(b||0),0)+')'}
function cartKey(id,storage){return storage?id+'::'+storage:id;}
function cartEntry(key){const [id,storage]=key.split('::');const p=products.find(x=>x.id===id);if(!p)return null;const v=variantList(p).find(x=>x[0]===storage);return {p,storage:storage||null,price:v?v[1]:null};}
let pendingCartId=null,pendingCartStorage=null,pendingCartQty=1;
function add(id){openVariantPicker(id);}
function openVariantPicker(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 pendingCartId=id;pendingCartQty=1;
 const variants=variantList(p);pendingCartStorage=variants.length?null:null;
 closeOverlay();
 document.getElementById('variantTitle').textContent=p.brand+' '+p.name;
 const choices=document.getElementById('variantChoices');
 choices.innerHTML=variants.length?variants.map(([storage,price])=>`<button type="button" class="variantOption" data-storage="${storage}" onclick="chooseCartVariant(this)"><strong>${storage}</strong><span>${money(price)}</span></button>`).join(''):'<div class="variantUnavailable">Storage options and Philippine SRP have not yet been verified for this model. You can add it as a quotation request.</div>';
 document.getElementById('variantLabel').textContent=variants.length?'Select storage':'Storage to be confirmed';
 document.getElementById('variantQty').textContent='1';
 document.getElementById('variantPrice').textContent=variants.length?'Choose a storage option to see its price':'Price on request';
 const confirm=document.getElementById('confirmVariant');confirm.disabled=variants.length>0;
 confirm.textContent=variants.length?'Select storage to continue':'Add quotation item to cart';
 document.getElementById('variantOverlay').classList.add('open');
}
function chooseCartVariant(button){
 pendingCartStorage=button.dataset.storage;
 document.querySelectorAll('#variantChoices .variantOption').forEach(el=>el.classList.toggle('selected',el===button));
 const p=products.find(x=>x.id===pendingCartId);
 const v=variantList(p).find(x=>x[0]===pendingCartStorage);
 document.getElementById('variantPrice').textContent=v?money(v[1])+' · Published PH SRP':'Price on request';
 document.getElementById('confirmVariant').disabled=false;
 document.getElementById('confirmVariant').textContent='Confirm Add to Cart';
}
function adjustVariantQty(delta){pendingCartQty=Math.max(1,Math.min(99,pendingCartQty+delta));document.getElementById('variantQty').textContent=pendingCartQty;}
function confirmCartVariant(){
 const p=products.find(x=>x.id===pendingCartId);if(!p)return;
 if(variantList(p).length&&!pendingCartStorage)return;
 const key=cartKey(p.id,pendingCartStorage);
 cart[key]=(cart[key]||0)+pendingCartQty;
 if(pendingCartStorage)chosenStorage[p.id]=pendingCartStorage;
 save();render();openCart();
}
function changeQty(key,d){cart[key]=(cart[key]||0)+d;if(cart[key]<=0)delete cart[key];save();openCart();}
function closeOverlay(){document.querySelectorAll('.overlay').forEach(e=>e.classList.remove('open'))}
function openCart(){closeOverlay();document.getElementById('cartOverlay').classList.add('open');let keys=Object.keys(cart).filter(k=>cartEntry(k));let total=0,hasUnknown=false;document.getElementById('cartItems').innerHTML=keys.length?keys.map(key=>{const e=cartEntry(key);if(e.price==null)hasUnknown=true;else total+=e.price*cart[key];return `<div class="cartitem"><div><strong>${e.p.brand} ${e.p.name}</strong><div style="color:#aeb7ca;margin-top:5px">${e.storage||'Storage to confirm'} · ${money(e.price)}</div></div><div><button onclick="changeQty('${key}',-1)">−</button> ${cart[key]} <button onclick="changeQty('${key}',1)">+</button></div></div>`}).join(''):'<div class="empty">Your cart is empty.</div>';document.getElementById('cartTotal').textContent=!keys.length?'Add a phone to get started.':hasUnknown?'Known SRP subtotal: '+money(total)+' · Other items require a quote':'Published PH SRP subtotal: '+money(total)+' (not a final selling price)';}
function detail(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 closeOverlay();const variants=variantList(p);const selected=selectedVariant(p);
 const specRows=specsFor(p).map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('');
 const picker=variants.length?`<label class="storageLabel">Choose storage variant<select class="storageSelect" onchange="setDetailVariant('${p.id}',this.value)">${variants.map(([v,price])=>`<option value="${v}" ${selected&&selected[0]===v?'selected':''}>${v} — ₱${price.toLocaleString('en-PH')}</option>`).join('')}</select></label>`:'';
 const price=selected?'₱'+selected[1].toLocaleString('en-PH'):'PH SRP not confirmed';
 document.getElementById('detailBody').innerHTML=`<div class="brand">${p.brand} / ${p.tag}</div><h2 style="font-size:30px;margin:8px 0 15px">${p.name}</h2><div class="visual" style="--shade:${shades[p.brand]};height:200px;border-radius:12px"><div class="mini"></div></div><p style="color:#eee">${p.desc}</p><h3>Full product specifications</h3><table class="specTable"><tbody>${specRows}</tbody></table>${picker}<div class="detailPrice">${price}</div><div class="detailPriceNote">${selected?`Published Philippine SRP for ${selected[0]} · <a href="${phSources[p.brand]}" target="_blank" rel="noopener">Source</a>`:'A reliable published Philippine SRP for this exact variant was not established. Request a quotation before checkout.'}</div><button class="btn" style="margin-top:18px;width:100%" onclick="add('${p.id}')">Add to Cart</button>`;
 document.getElementById('detailOverlay').classList.add('open');
}
function openCheckout(){if(!Object.keys(cart).length){alert('Add a product to your cart first.');return}closeOverlay();document.getElementById('checkoutOverlay').classList.add('open');document.getElementById('checkoutForm').style.display='block';document.getElementById('orderConfirmation').innerHTML=''}
document.getElementById('checkoutForm').addEventListener('submit',e=>{
 e.preventDefault();const d=new FormData(e.target);
 const lines=['DONE DEAL — ORDER REQUEST','Name: '+d.get('name'),'Email: '+d.get('email'),'Phone: '+d.get('phone'),'Delivery address: '+d.get('address'),'','Requested items:'];
 for(const key of Object.keys(cart)){const item=cartEntry(key);if(item)lines.push(cart[key]+' x '+item.p.brand+' '+item.p.name+' ('+(item.storage||'storage to confirm')+') — '+money(item.price));}
 lines.push('','Final price, stock and delivery fees are subject to seller confirmation.');
 const request=lines.join('\n');window.doneDealOrderRequest=request;
 document.getElementById('checkoutForm').style.display='none';
 const area=document.getElementById('orderConfirmation');area.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='Your order request is ready';area.append(heading);
 const explanation=document.createElement('p');explanation.textContent='Copy these details and send them to Done Deal through your preferred contact channel. This does not automatically submit an order or take payment.';area.append(explanation);
 const output=document.createElement('textarea');output.readOnly=true;output.value=request;output.style.cssText='width:100%;min-height:220px;padding:12px;background:#32323b;color:white;border:1px solid #555;border-radius:10px';area.append(output);
 const actions=document.createElement('div');actions.className='orderRequestActions';
 const copy=document.createElement('button');copy.textContent='Copy Order Request';copy.onclick=async()=>{try{await navigator.clipboard.writeText(request);copy.textContent='Copied!'}catch{output.select();document.execCommand('copy');copy.textContent='Copied!'}};
 const email=document.createElement('button');email.textContent='Open Email App';email.onclick=()=>{location.href='mailto:?subject='+encodeURIComponent('Done Deal Order Request')+'&body='+encodeURIComponent(request)};
 actions.append(copy,email);area.append(actions);
});
document.getElementById('search').addEventListener('input',render);document.getElementById('sort').addEventListener('change',render);renderBrands();render();save();
