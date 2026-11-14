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
function productPrice(p){const v=srpFor(p);return v && Number.isFinite(v.amount) && v.amount>0?v.amount:null;}
const shades={Huawei:'#d1a1a0',Samsung:'#829cdb',OPPO:'#a4c5b3',vivo:'#8aacee',Xiaomi:'#f0b381',Apple:'#c2c8d3'};
const products=Object.entries(entries).flatMap(([brand,items])=>items.map((x,i)=>({id:brand+'-'+i,brand,name:x[0],desc:x[1],spec:x[2],tag:x[3],price:null})));
let filter='All',cart=JSON.parse(localStorage.getItem('doneDealCart')||'{}');
const money=p=>p==null?'PH SRP pending verification':'₱'+p.toLocaleString('en-PH');
function render(){let q=document.getElementById('search').value.toLowerCase(),sort=document.getElementById('sort').value;let data=products.filter(p=>(filter==='All'||p.brand===filter)&&(p.brand+' '+p.name+' '+p.desc+' '+p.spec).toLowerCase().includes(q));if(sort==='az')data.sort((a,b)=>a.name.localeCompare(b.name));if(sort==='brand')data.sort((a,b)=>a.brand.localeCompare(b.brand));document.getElementById('resultCount').textContent=data.length+' products';document.getElementById('catalog').innerHTML=data.map(p=>`<article class="product"><div class="visual" style="--shade:${shades[p.brand]}"><span class="tag">${p.tag}</span><div class="mini"></div></div><div class="pbody"><div class="brand">${p.brand}</div><h3>${p.name}</h3><div class="desc">${p.desc}</div><div class="spec">${p.spec}</div><div class="price">${money(productPrice(p))}<small>Official PH SRP • subject to variant and availability</small></div><div class="actions"><button class="outline" onclick="detail('${p.id}')">View Details</button><button class="primary" onclick="add('${p.id}')">Add to Cart</button></div></div></article>`).join('')||'<div class="empty">No phones found. Try another search.</div>';}
function renderBrands(){document.getElementById('brands').innerHTML=['All',...Object.keys(entries)].map(b=>`<button class="chip ${filter===b?'active':''}" onclick="filter='${b}';renderBrands();render()">${b==='All'?'All Brands':b}</button>`).join('')}
function save(){localStorage.setItem('doneDealCart',JSON.stringify(cart));document.getElementById('cartCount').textContent='('+Object.values(cart).reduce((a,b)=>a+b,0)+')'}
function add(id){cart[id]=(cart[id]||0)+1;save();openCart()}
function changeQty(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];save();openCart()}
function closeOverlay(){document.querySelectorAll('.overlay').forEach(e=>e.classList.remove('open'))}
function openCart(){closeOverlay();document.getElementById('cartOverlay').classList.add('open');let ids=Object.keys(cart);document.getElementById('cartItems').innerHTML=ids.length?ids.map(id=>{let p=products.find(x=>x.id===id);return `<div class="cartitem"><div><strong>${p.brand} ${p.name}</strong><div style="color:#66758c;margin-top:5px">${money(productPrice(p))}</div></div><div><button onclick="changeQty('${id}',-1)">−</button> ${cart[id]} <button onclick="changeQty('${id}',1)">+</button></div></div>`}).join(''):'<div class="empty">Your cart is empty.</div>';document.getElementById('cartTotal').textContent=ids.length?'Final total: to be quoted':'Add a phone to get started.'}
function detail(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  closeOverlay();
  const specs=parseSpecs(p);
  const srp=srpFor(p);
  const specHTML=specs.map(s=>`<div class="detailSpec"><dt>${s.label}</dt><dd>${s.value}</dd></div>`).join('');
  document.getElementById('detailBody').innerHTML=`
    <div class="brand">${p.brand} / ${p.tag}</div>
    <h2 style="font-size:30px;margin:8px 0 15px">${p.name}</h2>
    <div class="visual" style="--shade:${shades[p.brand]};height:235px;border-radius:12px"><div class="mini"></div></div>
    <p style="color:#f0f0f4">${p.desc}</p>
    <h3 style="color:#fff;margin-bottom:6px">Product specifications</h3>
    <p class="detailSpecsIntro">Specifications shown below are drawn from the current catalog. Unconfirmed details are identified rather than guessed.</p>
    <dl class="detailSpecs">${specHTML}</dl>
    <div class="detailPrice">${money(productPrice(p))}</div>
    <div class="detailPriceNote">${srp&&productPrice(p)?`Philippine SRP • ${srp.variant||'specified variant'}${srp.source?' • '+srp.source:''}`:'An official Philippine SRP has not yet been verified for this model and storage variant.'}</div>
    <div class="notice">Please confirm exact Philippine variant, storage, warranty, stock and final selling price before purchase.</div>
    <button class="btn" style="margin-top:18px;width:100%" onclick="add('${p.id}')">Add to Cart</button>`;
  document.getElementById('detailOverlay').classList.add('open');
}
function openCheckout(){if(!Object.keys(cart).length){alert('Add a product to your cart first.');return}closeOverlay();document.getElementById('checkoutOverlay').classList.add('open');document.getElementById('checkoutForm').style.display='block';document.getElementById('orderConfirmation').innerHTML=''}
document.getElementById('checkoutForm').addEventListener('submit',e=>{e.preventDefault();let data=new FormData(e.target);let name=String(data.get('name')).replace(/[<>]/g,'');let summary=Object.keys(cart).map(id=>{let p=products.find(x=>x.id===id);return `${cart[id]} × ${p.brand} ${p.name}`}).join(', ');document.getElementById('checkoutForm').style.display='none';document.getElementById('orderConfirmation').innerHTML=`<div class="notice" style="margin-top:20px"><strong>Demo order summary created</strong><p>Thank you, ${name}. This is NOT an actual order. No payment has been taken and no merchant has received your information.</p><p><strong>Items:</strong> ${summary}</p><p>To accept real orders, connect a secure backend, merchant notifications, verified prices, stock management, and a payment provider.</p></div>`});
document.getElementById('search').addEventListener('input',render);document.getElementById('sort').addEventListener('change',render);renderBrands();render();save();
