/* Done Deal: progressive, browser-only storefront upgrades. No live order/payment claims. */
(function(){
'use strict';
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let wishlist=get('ddWishlist',[]), comparison=get('ddCompare',[]), onlyWishlist=false;
let customPrices=get('ddPrices',{}), customProducts=get('ddCustomProducts',[]);
for(const p of customProducts){if(!products.some(x=>x.id===p.id))products.push(p)}
function price(p){return customPrices[p.id]!==undefined?Number(customPrices[p.id]):productPrice(p)}
const originalRender=render;
render=function(){originalRender();const budget=Number(document.getElementById('budgetFilter')?.value||0);const cards=[...document.querySelectorAll('#catalog .product')];const q=document.getElementById('search').value.toLowerCase();let shown=0;
// Keep catalog rendering owned by the original app, then enhance each matching card.
let all=products.filter(p=>(filter==='All'||p.brand===filter)&&(p.brand+' '+p.name+' '+p.desc+' '+p.spec).toLowerCase().includes(q));
const sort=document.getElementById('sort').value;if(sort==='az')all.sort((a,b)=>a.name.localeCompare(b.name));if(sort==='brand')all.sort((a,b)=>a.brand.localeCompare(b.brand));
all.forEach((p,i)=>{const el=cards[i];if(!el)return;const cost=price(p);const visible=(!onlyWishlist||wishlist.includes(p.id))&&(!budget||(cost!==null&&cost<=budget));el.style.display=visible?'':'none';if(visible)shown++;
const visual=el.querySelector('.visual');if(p.image&&/^https:\/\//.test(p.image)){const mini=visual.querySelector('.mini');if(mini)mini.outerHTML='<img class="productPhoto" alt="Product photo">';const image=visual.querySelector('.productPhoto');image.src=p.image;image.onerror=()=>{image.style.display='none'};}
const wish=document.createElement('button');wish.type='button';wish.className='wishButton'+(wishlist.includes(p.id)?' on':'');wish.setAttribute('aria-label','Toggle wishlist for '+p.name);wish.textContent=wishlist.includes(p.id)?'♥':'♡';wish.onclick=()=>{wishlist=wishlist.includes(p.id)?wishlist.filter(x=>x!==p.id):[...wishlist,p.id];put('ddWishlist',wishlist);render()};visual.append(wish);
const cp=document.createElement('button');cp.type='button';cp.className='outline compareBtn';cp.textContent=comparison.includes(p.id)?'✓ In comparison':'⇄ Compare';cp.onclick=()=>{comparison=comparison.includes(p.id)?comparison.filter(x=>x!==p.id):comparison.length<3?[...comparison,p.id]:comparison;put('ddCompare',comparison);render()};el.querySelector('.actions').append(cp);
if(customPrices[p.id]!==undefined){const elPrice=el.querySelector('.price');elPrice.innerHTML=money(cost)+'<small>Demo selling price set in this browser</small>'}
});document.getElementById('resultCount').textContent=shown+' products';document.getElementById('compareCount').textContent=comparison.length;document.getElementById('wishlistToggle').textContent=onlyWishlist?'♥ Show all phones':'♡ Wishlist';};
// Comparison selection must have a visible entry point to open the modal.
const compareLauncher=document.createElement('button');
compareLauncher.type='button';
compareLauncher.id='ddCompareLauncher';
compareLauncher.className='dd-compare-launcher';
compareLauncher.setAttribute('aria-label','Open smartphone comparison');
compareLauncher.addEventListener('click',()=>window.openCompare());
document.body.append(compareLauncher);
function syncCompareLauncher(){
  const count=comparison.filter(id=>products.some(p=>p.id===id)).length;
  compareLauncher.hidden=count===0;
  compareLauncher.textContent='Compare '+count+' phone'+(count===1?'':'s')+' →';
}
const previousComparisonRender=render;
render=function(){previousComparisonRender();syncCompareLauncher()};
syncCompareLauncher();
window.toggleWishlist=()=>{onlyWishlist=!onlyWishlist;render()};
function compareImage(p){
  let overrides={};
  try{overrides=JSON.parse(localStorage.getItem('ddPhotoOverrides')||'{}')||{}}catch(_){}
  return (typeof window.DDProductImage==='function'&&window.DDProductImage(p.id))||overrides[p.id]||p.image||'';
}
window.openCompare=()=>{
  closeOverlay();
  const selected=comparison.map(id=>products.find(p=>p.id===id)).filter(Boolean);
  const body=document.getElementById('compareBody');
  body.replaceChildren();
  if(!selected.length){body.textContent='Choose up to three products using the Compare buttons in the catalog.'}
  else{
    const grid=document.createElement('div');grid.className='comparePanel dd-compare-premium';
    selected.forEach(p=>{
      const card=document.createElement('article');card.className='compareCard';
      const photo=document.createElement('div');photo.className='dd-compare-photo';
      const imageUrl=compareImage(p);
      if(imageUrl){
        const img=document.createElement('img');img.alt=p.brand+' '+p.name;img.loading='lazy';
        img.onerror=()=>{img.remove();photo.textContent='Product image unavailable'};
        img.src=imageUrl;photo.append(img);
      }else{photo.textContent='Product image unavailable'}
      const brand=document.createElement('span');brand.className='dd-compare-brand';brand.textContent=p.brand;
      const name=document.createElement('h3');name.textContent=p.name;
      const specs=document.createElement('p');specs.className='dd-compare-spec';specs.textContent=p.spec||'Specifications pending';
      const desc=document.createElement('p');desc.className='dd-compare-desc';desc.textContent=p.desc||'';
      const priceTag=document.createElement('strong');priceTag.className='dd-compare-price';priceTag.textContent=money(price(p));
      card.append(photo,brand,name,specs,desc,priceTag);grid.append(card);
    });body.append(grid);
  }
  document.getElementById('compareOverlay').classList.add('open');
};
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.openAdmin=()=>{closeOverlay();const count=products.length,priced=products.filter(p=>price(p)!=null).length;document.getElementById('adminStats').innerHTML='<div class="adminStat">Products<b>'+count+'</b></div><div class="adminStat">Priced models<b>'+priced+'</b></div><div class="adminStat">Cart items<b>'+Object.values(cart).reduce((a,b)=>a+Number(b),0)+'</b></div>';document.getElementById('adminProducts').innerHTML=products.map(p=>'<div class="adminRow"><span>'+escapeHTML(p.brand+' '+p.name)+'</span><label>₱ <input type="number" min="0" step="1" data-id="'+escapeHTML(p.id)+'" placeholder="Price" value="'+(customPrices[p.id]??'')+'"></label><button type="button" data-save="'+escapeHTML(p.id)+'">Save</button></div>').join('');document.querySelectorAll('#adminProducts button').forEach(b=>b.onclick=()=>{const id=b.dataset.save;const v=[...document.querySelectorAll('#adminProducts input')].find(x=>x.dataset.id===id).value;if(v==='')delete customPrices[id];else customPrices[id]=Math.max(0,Math.round(Number(v)));put('ddPrices',customPrices);render();openAdmin()});document.getElementById('adminOverlay').classList.add('open')};
window.resetDemo=()=>{if(!confirm('Clear local demo products and selling prices on this browser?'))return;customProducts.forEach(p=>{const i=products.findIndex(x=>x.id===p.id);if(i>=0)products.splice(i,1)});customProducts=[];customPrices={};put('ddCustomProducts',[]);put('ddPrices',{});render();openAdmin()};
document.getElementById('adminAddForm').onsubmit=e=>{e.preventDefault();const d=new FormData(e.target),model=String(d.get('model')).trim();if(!model)return;const image=String(d.get('image')).trim();const p={id:'Custom-'+Date.now(),brand:String(d.get('brand')),name:model,desc:String(d.get('description')).trim(),spec:String(d.get('spec')).trim(),tag:'New',image:/^https:\/\//.test(image)?image:'',price:null};products.push(p);customProducts.push(p);if(d.get('price')!=='')customPrices[p.id]=Math.round(Number(d.get('price')));put('ddCustomProducts',customProducts);put('ddPrices',customPrices);e.target.reset();render();openAdmin()};
// Product prices set in local demo are displayed as such; variant SRPs remain unchanged.
const oldDetail=detail;detail=function(id){oldDetail(id);const p=products.find(x=>x.id===id);if(!p)return;const body=document.getElementById('detailBody');if(p.image&&/^https:\/\//.test(p.image)){const visual=body.querySelector('.visual');if(visual){visual.innerHTML='<img class="detailPhoto" alt="Product photo">';visual.querySelector('img').src=p.image;}}
if(customPrices[id]!==undefined){const el=body.querySelector('.detailPrice');if(el)el.textContent=money(price(p));const note=body.querySelector('.detailPriceNote');if(note)note.textContent='Demo selling price set in this browser; verify stock and final quotation.';}};
// The existing cart and checkout remain clearly labeled as demos, not real orders.
document.getElementById('budgetFilter').addEventListener('change',render);
render();
})();
