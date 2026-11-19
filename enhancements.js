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
// Visible comparison entry point: selected cards previously had no way to open the comparison modal.
const compareLauncher=document.createElement('button');
compareLauncher.type='button';
compareLauncher.id='ddCompareLauncher';
compareLauncher.className='dd-compare-launcher';
compareLauncher.setAttribute('aria-label','View selected smartphone comparison');
compareLauncher.addEventListener('click',()=>window.openCompare());
document.body.append(compareLauncher);
function syncCompareLauncher(){
  const selected=comparison.filter(id=>products.some(p=>p.id===id));
  compareLauncher.hidden=selected.length===0;
  compareLauncher.textContent='Compare '+selected.length+' phone'+(selected.length===1?'':'s')+' →';
}
const previousRender=render;
render=function(){previousRender();syncCompareLauncher()};
syncCompareLauncher();
window.toggleWishlist=()=>{onlyWishlist=!onlyWishlist;render()};
window.openCompare=()=>{closeOverlay();const selected=comparison.map(id=>products.find(p=>p.id===id)).filter(Boolean);document.getElementById('compareBody').innerHTML=selected.length?'<div class="comparePanel">'+selected.map(p=>'<div class="compareCard"><strong>'+escapeHTML(p.brand+' '+p.name)+'</strong><p>'+escapeHTML(p.spec)+'</p><p>'+escapeHTML(p.desc)+'</p><b>'+money(price(p))+'</b></div>').join('')+'</div>':'Choose up to three products using the Compare buttons in the catalog.';document.getElementById('compareOverlay').classList.add('open')};
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
