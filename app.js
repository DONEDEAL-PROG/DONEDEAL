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
// Prices must come from the live D1 catalog, never hardcoded SRP values.
const phVariants = {};
const verifiedSpecs = {"Huawei-0": {"Display":"6.8-inch LTPO OLED, 1–120Hz, 2848 × 1276","Processor":"Kirin 9020 octa-core","RAM":"16GB","Storage":"512GB","Rear cameras":"50MP 1-inch main + 40MP ultrawide + 50MP telephoto + 12.5MP telephoto","Front camera":"13MP","Battery":"5,170mAh rated","Charging":"100W wired / 80W wireless","Connectivity":"4G LTE, Wi-Fi, Bluetooth, NFC; SIM support depends on variant","Operating system":"EMUI 15.0","Other features":"IP68/IP69, dual telephoto optical zoom"},"Huawei-1":{"Display":"6.8-inch LTPO OLED","Processor":"Kirin 9020","RAM":"12GB","Storage":"512GB","Battery":"5,170mAh rated","Charging":"100W wired"},"Samsung-0": {"Display": "6.9-inch Dynamic AMOLED 2X, 120Hz", "Processor": "Snapdragon 8 Elite for Galaxy", "RAM": "12GB", "Rear cameras": "200MP main + 50MP ultrawide + 50MP telephoto + 10MP telephoto", "Front camera": "12MP", "Battery": "5,000mAh", "Charging": "45W wired", "Connectivity": "5G, Wi-Fi 7, Bluetooth", "Operating system": "Android / One UI", "Other features": "Integrated S Pen, IP68"}, "Samsung-1": {"Display": "6.7-inch Dynamic AMOLED 2X", "Rear camera": "50MP main", "Battery": "4,900mAh", "Operating system": "Android / One UI"}, "Samsung-2": {"Display": "6.2-inch Dynamic AMOLED 2X", "Rear camera": "50MP main", "Battery": "4,000mAh", "Operating system": "Android / One UI"}, "Samsung-3": {"Display": "8.0-inch foldable AMOLED inner display", "Rear camera": "200MP main", "Form factor": "Book-style foldable"}, "Samsung-4": {"Display": "6.9-inch inner AMOLED + 4.1-inch cover", "Rear camera": "50MP main", "Form factor": "Flip foldable"}};
const phSources = {'Samsung':'https://hptotosamsung.com/ph/trade-in/','Apple':'https://www.apple.com/ph/shop/buy-iphone','Huawei':'https://consumer.huawei.com/ph/phones/'};

const liveVariants = {};
const productImages = {};

async function loadLiveVariants() {
  try {
    const response = await fetch("/api/catalog", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Catalog unavailable");
    }

    const data = await response.json();

    for (const product of data.products || []) {
      // New models are read from D1; the old hardcoded models remain intact.
      const newId = String(product.sku||'').split('::')[0];
      if (/^custom-[0-9a-f-]{36}$/.test(newId) && !products.some(p=>p.id===newId)) {
        const safe = value => String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const brand=safe(product.brand||'Other'),model=safe(product.model||product.name||'Gadget');
        products.push({id:newId,brand,name:model,desc:safe(product.description||'New arrival'),spec:'Storage and color options available',tag:'New',price:null});
        if(!entries[brand])entries[brand]=[];
      }

      const separator = product.sku.lastIndexOf("::");
      if (separator === -1) continue;

      const productId = product.sku.slice(0, separator);
      const variant = product.variant;
      const price = product.price_centavos / 100;

      if (!liveVariants[productId]) {
        liveVariants[productId] = [];
      }

      liveVariants[productId].push([variant, price]);
      if (
        typeof product.image_key === "string" &&
        /^products\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(product.image_key)
      ) {
        productImages[productId] = "/api/images/" + product.image_key;
      }
    }

    Object.assign(phVariants, liveVariants);

    console.log("Done Deal catalog loaded from D1");
  } catch (error) {
    console.error("Unable to load live catalog:", error);
    const notice = document.createElement("div");
    notice.setAttribute("role","alert");
    notice.style.cssText = "position:fixed;bottom:12px;left:12px;right:12px;z-index:99999;background:#42202e;color:white;padding:14px;border:1px solid #ff69b3;border-radius:12px;text-align:center";
    notice.textContent = "Live prices are temporarily unavailable. Please try refreshing or contact Done Deal before ordering.";
    document.body.appendChild(notice);
  }
}

function variantList(p) {
  return phVariants[p.id] || [];
}

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
function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const sort = document.getElementById('sort').value;
  let data = products.filter(p =>
    (filter === 'All' || p.brand === filter) &&
    (p.brand + ' ' + p.name + ' ' + p.desc + ' ' + p.spec).toLowerCase().includes(q)
  );
  if (sort === 'az') data.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'brand') data.sort((a,b) => a.brand.localeCompare(b.brand));
  document.getElementById('resultCount').textContent = data.length + ' products';
  document.getElementById('catalog').innerHTML = data.map(p => `
    <article class="product">
      <div class="visual" style="--shade:${shades[p.brand]||'#bca3b5'}">
        <span class="tag">${p.tag}</span>
        ${productImages[p.id]
          ? `<img src="${productImages[p.id]}" alt="${p.brand} ${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;position:relative;z-index:1">`
          : `<div class="mini"></div>`}
      </div>
      <div class="pbody">
        <div class="brand">${p.brand}</div>
        <h3>${p.name}</h3>
        <div class="desc">${p.desc}</div>
        <div class="spec">${p.spec}</div>
        <div class="price">${money(productPrice(p))}<small>Confirm price and availability at checkout</small></div>
        <div class="actions">
          <button class="outline" onclick="detail('${p.id}')">View Details</button>
          <button class="primary" onclick="add('${p.id}')">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join('') || '<div class="empty">No phones found. Try another search.</div>';
}
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
let ddConfirmBusy=false;
function confirmCartVariant(){
 if(ddConfirmBusy)return;
 const p=products.find(x=>x.id===pendingCartId);if(!p)return;
 if(variantList(p).length&&!pendingCartStorage)return;
 ddConfirmBusy=true;
 const key=cartKey(p.id,pendingCartStorage);
 const qty=pendingCartQty;
 const label=p.brand+' '+p.name+(pendingCartStorage?' · '+pendingCartStorage:'');
 cart[key]=(cart[key]||0)+qty;
 if(pendingCartStorage)chosenStorage[p.id]=pendingCartStorage;
 save();render();
 const button=document.getElementById('confirmVariant');
 if(button){launchAddToCartAnimation(button);button.textContent='✓ Successfully added!';button.disabled=true;}
 showCartCelebration(label,qty);
 const counter=document.getElementById('cartCount');
 if(counter){counter.classList.remove('dd-cart-bounce');void counter.offsetWidth;counter.classList.add('dd-cart-bounce');}
 // Close the picker behind the celebration, without leaving a persistent Web Animation.
 setTimeout(()=>{
   document.getElementById('variantOverlay')?.classList.remove('open');
   if(button){button.disabled=false;button.textContent='Confirm Add to Cart';}
   ddConfirmBusy=false;
 },350);
}
function showCartCelebration(label,qty){
 let screen=document.getElementById('ddCelebration');
 if(!screen){
   screen=document.createElement('div');
   screen.id='ddCelebration';
   screen.setAttribute('role','status');
   screen.setAttribute('aria-live','polite');
   screen.innerHTML='<div class="dd-celebrate-card"><div class="dd-confetti" aria-hidden="true"></div><div class="dd-bag" aria-hidden="true"><svg viewBox="0 0 100 110" width="112" height="124" fill="none"><path d="M19 37H81L87 101H13L19 37Z" fill="#f62b87"/><path d="M34 41V28C34 7 66 7 66 28V41" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="68" r="22" fill="#fff"/><path d="M39 68L47 76L63 59" stroke="#e41e76" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="dd-celebrate-title">ADDED TO CART!</div><div class="dd-celebrate-detail"></div><div class="dd-celebrate-sub">Your next favorite gadget is in the bag ✨</div><div class="dd-celebrate-progress"></div></div>';
   document.body.appendChild(screen);
 }
 screen.querySelector('.dd-celebrate-detail').textContent=label+' · Qty '+qty;
 screen.classList.remove('dd-celebrate-show');
 void screen.offsetWidth;
 screen.classList.add('dd-celebrate-show');
 clearTimeout(window.ddCelebrationTimer);
 window.ddCelebrationTimer=setTimeout(()=>screen.classList.remove('dd-celebrate-show'),2200);
}
function launchAddToCartAnimation(button){
 const bounds=button.getBoundingClientRect();
 const ripple=document.createElement('span');
 ripple.className='dd-click-ripple';
 ripple.style.left='50%';ripple.style.top='50%';
 button.appendChild(ripple);
 setTimeout(()=>ripple.remove(),650);
 const target=document.querySelector('#cartCount')?.closest('button')||document.querySelector('[onclick="openCart()"]');
 if(!target||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const end=target.getBoundingClientRect();
 const dot=document.createElement('span');
 dot.className='dd-fly-to-cart';dot.textContent='✓';
 dot.style.left=(bounds.left+bounds.width/2)+'px';
 dot.style.top=(bounds.top+bounds.height/2)+'px';
 document.body.appendChild(dot);
 requestAnimationFrame(()=>{
  dot.style.transform=`translate(${end.left+end.width/2-(bounds.left+bounds.width/2)}px,${end.top+end.height/2-(bounds.top+bounds.height/2)}px) scale(.4)`;
  dot.style.opacity='0';
 });
 setTimeout(()=>dot.remove(),780);
}
function showCartSuccess(label,qty){const badge=document.getElementById('cartCount');if(badge){badge.classList.remove('dd-count-pulse');void badge.offsetWidth;badge.classList.add('dd-count-pulse');setTimeout(()=>badge.classList.remove('dd-count-pulse'),450)}
 let toast=document.getElementById('ddCartToast');
 if(!toast){
   toast=document.createElement('div');toast.id='ddCartToast';toast.className='dd-cart-toast';toast.style.cssText='position:fixed!important;top:24px!important;left:50%!important;right:auto!important;bottom:auto!important;z-index:2147483647!important;min-width:min(390px,calc(100vw - 32px))!important;box-shadow:0 20px 80px #000b!important;';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
   document.body.appendChild(toast);
 }
 toast.replaceChildren();
 const tick=document.createElement('span');tick.className='dd-toast-check';tick.textContent='✓';
 const body=document.createElement('div');
 const title=document.createElement('strong');title.textContent='Successfully added to cart';
 const detail=document.createElement('small');detail.textContent=label+' · Qty '+qty;
 body.append(title,detail);
 const view=document.createElement('button');view.type='button';view.textContent='View cart';view.addEventListener('click',()=>{toast.classList.remove('dd-show');toast.style.opacity='0';toast.style.pointerEvents='none';openCart()});
 toast.append(tick,body,view);
 toast.classList.remove('dd-show');void toast.offsetWidth;toast.classList.add('dd-show');toast.style.opacity='1';toast.style.pointerEvents='auto';
 clearTimeout(window.ddToastTimeout);
 window.ddToastTimeout=setTimeout(()=>{toast.classList.remove('dd-show');toast.style.opacity='0';toast.style.pointerEvents='none';},3000);
}

function changeQty(key,d){cart[key]=(cart[key]||0)+d;if(cart[key]<=0)delete cart[key];save();openCart();}
function closeOverlay(){document.querySelectorAll('.overlay').forEach(e=>e.classList.remove('open'))}
function openCart(){closeOverlay();document.getElementById('cartOverlay').classList.add('open');let keys=Object.keys(cart).filter(k=>cartEntry(k));let total=0,hasUnknown=false;document.getElementById('cartItems').innerHTML=keys.length?keys.map(key=>{const e=cartEntry(key);if(e.price==null)hasUnknown=true;else total+=e.price*cart[key];return `<div class="cartitem"><div><strong>${e.p.brand} ${e.p.name}</strong><div style="color:#aeb7ca;margin-top:5px">${e.storage||'Storage to confirm'} · ${money(e.price)}</div></div><div><button onclick="changeQty('${key}',-1)">−</button> ${cart[key]} <button onclick="changeQty('${key}',1)">+</button></div></div>`}).join(''):'<div class="empty">Your cart is empty.</div>';document.getElementById('cartTotal').textContent=!keys.length?'Add a phone to get started.':hasUnknown?'Known SRP subtotal: '+money(total)+' · Other items require a quote':'Catalog subtotal: '+money(total);}
function detail(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 closeOverlay();const variants=variantList(p);const selected=selectedVariant(p);
 const specRows=specsFor(p).map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('');
 const picker=variants.length?`<label class="storageLabel">Choose storage variant<select class="storageSelect" onchange="setDetailVariant('${p.id}',this.value)">${variants.map(([v,price])=>`<option value="${v}" ${selected&&selected[0]===v?'selected':''}>${v} — ₱${price.toLocaleString('en-PH')}</option>`).join('')}</select></label>`:'';
 const price=selected?'₱'+selected[1].toLocaleString('en-PH'):'PH SRP not confirmed';
 document.getElementById('detailBody').innerHTML=`<div class="brand">${p.brand} / ${p.tag}</div><h2 style="font-size:30px;margin:8px 0 15px">${p.name}</h2><div class="visual" style="--shade:${shades[p.brand]||'#bca3b5'};height:200px;border-radius:12px">${productImages[p.id] ? `<img src="${productImages[p.id]}" alt="${p.brand} ${p.name}" style="width:100%;height:100%;object-fit:contain;position:relative;z-index:1">` : `<div class="mini"></div>`}</div><p style="color:#eee">${p.desc}</p><h3>Full product specifications</h3><table class="specTable"><tbody>${specRows}</tbody></table>${picker}<div class="detailPrice">${price}</div><div class="detailPriceNote">${selected?`Price for ${selected[0]} · Confirm at checkout`:'A reliable published Philippine SRP for this exact variant was not established. Request a quotation before checkout.'}</div><button class="btn" style="margin-top:18px;width:100%" onclick="add('${p.id}')">Add to Cart</button>`;
 document.getElementById('detailOverlay').classList.add('open');
}
function openCheckout(){if(!Object.keys(cart).length){alert('Add a product to your cart first.');return;} window.location.href='checkout.html';}
document.getElementById('checkoutForm')?.addEventListener('submit',e=>{
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
document.getElementById('search').addEventListener('input',render);document.getElementById('sort').addEventListener('change',render);
loadLiveVariants().finally(() => {
  renderBrands();
  render();
  save();
});


// Online checkout uses server-authoritative prices; browser SRP and demo prices never set payment amounts.
document.querySelectorAll('button[onclick="openCheckout()"]').forEach(b=>b.textContent='Secure Checkout');

// Microinteractions for product selection and add-to-cart confirmation.
(function(){
 const css=`
 .dd-cart-toast{position:fixed;left:50%;right:auto;top:24px;bottom:auto;z-index:100002;display:flex;align-items:center;gap:13px;max-width:min(450px,calc(100vw - 32px));padding:15px 17px;background:#24242c;color:#fff;border:1px solid #ed4b8a;border-radius:16px;box-shadow:0 20px 55px #0009;opacity:0;transform:translate(-50%,22px) scale(.96);pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.2,.8,.2,1)}
 .dd-cart-toast.dd-show{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}
 .dd-toast-check{display:grid;place-items:center;flex:0 0 33px;height:33px;border-radius:50%;background:#e33d7d;font-weight:800}
 .dd-cart-toast strong{display:block;font-size:13px}.dd-cart-toast small{display:block;color:#c7c3ce;margin-top:4px;font-size:11px}
 .dd-cart-toast button{margin-left:auto;border:1px solid #f26da0;border-radius:9px;background:#e33d7d;color:white;padding:9px 12px;white-space:nowrap;cursor:pointer;font-size:12px;font-weight:700}
 #confirmVariant{position:relative;overflow:hidden;isolation:isolate}
 .dd-click-ripple{position:absolute;z-index:2;width:28px;height:28px;border-radius:50%;background:#fff8;pointer-events:none;transform:translate(-50%,-50%) scale(0);animation:ddRipple .6s ease-out forwards}
 @keyframes ddRipple{to{transform:translate(-50%,-50%) scale(30);opacity:0}}
 #confirmVariant.dd-success-pop{animation:ddSuccessPop .4s cubic-bezier(.2,.9,.3,1.2)}
 @keyframes ddSuccessPop{0%{transform:scale(1)}45%{transform:scale(.96)}80%{transform:scale(1.035)}100%{transform:scale(1)}}
 .dd-fly-to-cart{position:fixed;z-index:100000;pointer-events:none;display:grid;place-items:center;width:34px;height:34px;margin:-17px;background:#e33d7d;border:2px solid #fff;color:white;border-radius:50%;font-size:18px;font-weight:800;box-shadow:0 0 22px #e33d7d88;transition:transform .75s cubic-bezier(.2,.75,.25,1),opacity .75s ease}
 #confirmVariant.dd-added{background:#23835e!important;color:white!important;opacity:1!important;cursor:default}
 .dd-cart-bounce{display:inline-block;animation:ddCartPop .5s cubic-bezier(.2,.8,.2,1)}
 @keyframes ddCartPop{0%{transform:scale(1)}40%{transform:scale(1.38);color:#ff78ae}100%{transform:scale(1)}}
 button,.product,.dd-brand-tile,.chip,.variantOption,a{transition:transform .18s ease,background-color .2s ease,border-color .2s ease,box-shadow .2s ease,opacity .2s ease}
 button:not(:disabled):active,.chip:active,.variantOption:active{transform:scale(.96)}
 .product:hover{transform:translateY(-3px)}
 .variantOption:hover{border-color:#e33d7d;transform:translateY(-2px)}
 @media(hover:hover){.primary:hover,.btn:hover,#confirmVariant:not(:disabled):hover{filter:brightness(1.08);box-shadow:0 8px 24px #e33d7d33}}
 @media(max-width:540px){.dd-cart-toast{top:16px;max-width:calc(100vw - 32px)}}
 @media(prefers-reduced-motion:reduce){.dd-cart-toast,button,.product,.dd-brand-tile,.chip,.variantOption,a,.dd-click-ripple,.dd-fly-to-cart{transition:none!important;animation:none!important}}
 `;
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
})();


(function(){
 if(window.__ddMotionInstalled)return;
 window.__ddMotionInstalled=true;
 const st=document.createElement('style');st.id='dd-motion-style';st.textContent='\n/* Done Deal motion system */\n@keyframes ddEnter{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:translateY(0)}}\n@keyframes ddOverlayEnter{from{opacity:0}to{opacity:1}}\n@keyframes ddModalEnter{from{opacity:0;transform:translate(-50%,calc(-50% + 15px)) scale(.975)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}\n@keyframes ddDrawerEnter{from{transform:translateX(24px);opacity:.55}to{transform:translateX(0);opacity:1}}\n@keyframes ddCartPulse{0%,100%{transform:scale(1)}45%{transform:scale(1.13)}}\nbody.dd-motion-ready main,body.dd-motion-ready .wrap{animation:ddEnter .38s cubic-bezier(.2,.7,.25,1) both}\nbody.dd-leaving main,body.dd-leaving .wrap{opacity:0;transform:translateY(-7px);transition:opacity .2s ease,transform .2s ease}\na,button,.btn,.chip,.brandTile,.dd-brand-tile,.product,.variantOption{transition:transform .2s ease,box-shadow .22s ease,background-color .2s ease,border-color .2s ease,filter .2s ease}\nbutton:not(:disabled):active,.btn:not(:disabled):active,.chip:active,.variantOption:active{transform:scale(.965)}\n.product:hover,.dd-brand-tile:hover{transform:translateY(-5px);box-shadow:0 15px 35px #0005,0 0 0 1px #ec438366}\n.product:hover .visual img,.dd-brand-tile:hover img{transform:scale(1.035);transition:transform .35s ease}\n.overlay.open{animation:ddOverlayEnter .22s ease both}\n.overlay.open .modal{animation:ddModalEnter .27s cubic-bezier(.2,.7,.2,1) both}\n.overlay.open .drawer{animation:ddDrawerEnter .3s cubic-bezier(.2,.7,.2,1) both}\n#cartCount.dd-count-pulse{animation:ddCartPulse .42s ease}\n:focus-visible{outline:2px solid #ff7eae;outline-offset:3px}\n@media(prefers-reduced-motion:reduce){body.dd-motion-ready main,body.dd-motion-ready .wrap,.overlay.open,.overlay.open .modal,.overlay.open .drawer,#cartCount.dd-count-pulse{animation:none!important}body.dd-leaving main,body.dd-leaving .wrap{opacity:1;transform:none}a,button,.btn,.chip,.brandTile,.dd-brand-tile,.product,.variantOption{transition:none!important;transform:none!important}}\n';document.head.append(st);
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


/* Popup positioning safeguard: center remains fixed during transitions */
(function(){const style=document.createElement('style');style.textContent=`
#variantOverlay.open .variantModal,#detailOverlay.open .modal,#checkoutOverlay.open .modal{left:50%;top:50%;animation:ddModalEnter .28s cubic-bezier(.2,.7,.2,1) both}
#ddCartToast{z-index:100002!important}
@media(prefers-reduced-motion:reduce){#variantOverlay.open .variantModal,#detailOverlay.open .modal,#checkoutOverlay.open .modal{animation:none!important;transform:translate(-50%,-50%)!important}}
`;document.head.appendChild(style)})();
(function(){const style=document.createElement("style");style.id="dd-cart-celebration-css";style.textContent="\n/* Done Deal full-screen add-to-cart celebration */\n#ddCelebration{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:22px;background:rgba(9,8,14,.82);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s ease,visibility .25s ease}\n#ddCelebration.dd-celebrate-show{opacity:1;visibility:visible;pointer-events:auto}\n.dd-celebrate-card{position:relative;width:min(440px,100%);padding:45px 24px 36px;text-align:center;overflow:hidden;border:1px solid #79314f;border-radius:28px;background:radial-gradient(ellipse at 50% 12%,#59213f 0%,#28202d 55%,#17161d 100%);box-shadow:0 28px 100px #000b;color:#fff;transform:translateY(35px) scale(.75)}\n.dd-celebrate-show .dd-celebrate-card{animation:ddCardBounce .85s cubic-bezier(.2,.85,.25,1.1) both}\n.dd-bag{position:relative;z-index:1;filter:drop-shadow(0 16px 18px #f62b8766)}\n.dd-celebrate-show .dd-bag{animation:ddBagBounce 1.25s ease-in-out .05s both}\n.dd-celebrate-title{position:relative;z-index:1;margin-top:10px;font:900 clamp(26px,7vw,36px)/1.15 Manrope,Arial,sans-serif;letter-spacing:-1px;color:#fff;text-shadow:0 3px 18px #ff277b77}\n.dd-celebrate-detail{position:relative;z-index:1;margin:16px auto 8px;font:700 14px/1.5 'DM Sans',Arial,sans-serif;color:#ff9ac4;overflow-wrap:anywhere}\n.dd-celebrate-sub{position:relative;z-index:1;color:#c8bdc8;font:500 12px/1.5 'DM Sans',Arial,sans-serif}\n.dd-celebrate-progress{height:4px;width:75%;margin:28px auto 0;border-radius:9px;background:#4a3948;overflow:hidden}\n.dd-celebrate-progress:after{content:'';display:block;width:100%;height:100%;background:linear-gradient(90deg,#ed1680,#ff88b9);transform-origin:left}\n.dd-celebrate-show .dd-celebrate-progress:after{animation:ddCelebrationProgress 2.2s linear both}\n.dd-confetti{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,#ff6ba9 2px,transparent 3px),radial-gradient(circle,#ffd0e3 2px,transparent 3px),radial-gradient(circle,#e92c83 3px,transparent 4px);background-size:78px 96px,112px 87px,133px 124px;background-position:0 0,22px 28px,50px 7px;opacity:.7}\n.dd-celebrate-show .dd-confetti{animation:ddConfetti 2.2s ease-out both}\n@keyframes ddCardBounce{0%{transform:translateY(35px) scale(.75)}45%{transform:translateY(-14px) scale(1.06)}65%{transform:translateY(5px) scale(.97)}82%{transform:translateY(-5px) scale(1.02)}100%{transform:translateY(0) scale(1)}}\n@keyframes ddBagBounce{0%{transform:translateY(-75px) rotate(-13deg) scale(.65);opacity:0}35%{transform:translateY(15px) rotate(8deg) scale(1.12);opacity:1}55%{transform:translateY(-16px) rotate(-6deg)}75%{transform:translateY(5px) rotate(3deg)}100%{transform:translateY(0) rotate(0) scale(1)}}\n@keyframes ddConfetti{0%{transform:translateY(-35px) rotate(-8deg);opacity:0}25%{opacity:.8}100%{transform:translateY(65px) rotate(10deg);opacity:.2}}\n@keyframes ddCelebrationProgress{from{transform:scaleX(1)}to{transform:scaleX(0)}}\n@media(prefers-reduced-motion:reduce){.dd-celebrate-show .dd-celebrate-card,.dd-celebrate-show .dd-bag,.dd-celebrate-show .dd-confetti{animation:none;transform:none}.dd-celebrate-show .dd-celebrate-progress:after{animation:none}}\n";document.head.appendChild(style)})();