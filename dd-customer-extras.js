
(function(){
 const W='dd_wishlist_v1',R='dd_recent_v1',T='dd_store_theme_v1';
 const read=k=>{try{const a=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(a)?a:[]}catch{return []}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 const products=()=>typeof window.products!=='undefined'?window.products:[];
 // The storefront catalog uses a top-level lexical products binding.
 const getProducts=()=>{try{return products}catch{return []}};
 const all=()=>{try{return evalCatalog()}catch{return []}};
 function evalCatalog(){return typeof window.DDGetProducts==='function'?window.DDGetProducts():[]}
 const byId=id=>all().find(p=>p.id===id)||readSnapshots()[id];
 const readSnapshots=()=>{try{return JSON.parse(localStorage.getItem('dd_product_snapshots_v1')||'{}')}catch{return {}}};
 function snapshot(id){const p=all().find(x=>x.id===id);if(!p)return;const obj=readSnapshots();obj[id]={id:p.id,name:p.name,brand:p.brand,photo:image(p),savedPrice:price(p)};try{localStorage.setItem('dd_product_snapshots_v1',JSON.stringify(obj))}catch{}}
 const image=p=>p.photo||window.DDProductImage?.(p.id)||'';
 const price=p=>p.savedPrice??window.DDProductPrice?.(p);
 function refresh(){
  document.querySelectorAll('[data-dd-wish]').forEach(b=>{const yes=read(W).includes(b.dataset.ddWish);b.textContent=yes?'♥':'♡';b.setAttribute('aria-pressed',String(yes));b.title=yes?'Remove from wishlist':'Save to wishlist'});
  document.querySelectorAll('[data-dd-wish-count]').forEach(e=>e.textContent=read(W).length||'');
  if(document.getElementById('dd-recent-grid'))renderRecent();
  if(document.getElementById('dd-wishlist-grid'))renderWishlist();
 }
 function card(p){
  const div=document.createElement('article');div.className='dd-extra-card';
  const photo=image(p);
  div.innerHTML='<div class="dd-extra-photo"></div><div class="dd-extra-info"><small></small><h3></h3><p></p><div class="dd-extra-actions"><button type="button" class="dd-open">View Details</button><button type="button" class="dd-save" data-dd-wish="'+p.id+'">♡</button></div></div>';
  if(photo){const img=document.createElement('img');img.src=photo;img.alt=p.name;img.loading='lazy';div.querySelector('.dd-extra-photo').append(img)}else div.querySelector('.dd-extra-photo').textContent='📱';
  div.querySelector('small').textContent=p.brand;div.querySelector('h3').textContent=p.name;
  const val=price(p);div.querySelector('p').textContent=val==null?'Price available on product page':'₱'+Number(val).toLocaleString('en-PH');
  div.querySelector('.dd-open').onclick=()=>{if(typeof window.detail==='function')window.detail(p.id);else location.href='shop.html?product='+encodeURIComponent(p.id)};
  return div;
 }
 function renderInto(id,ids){const host=document.getElementById(id);if(!host)return;host.replaceChildren();const found=ids.map(byId).filter(Boolean);if(!found.length){host.textContent=id==='dd-recent-grid'?'Products you view will appear here.':'No saved gadgets yet. Browse the shop and tap a heart.';return}found.forEach(p=>host.append(card(p)))}
 function renderRecent(){renderInto('dd-recent-grid',read(R).slice(0,8))}
 function renderWishlist(){renderInto('dd-wishlist-grid',read(W))}
 function view(id){snapshot(id);const list=read(R).filter(x=>x!==id);list.unshift(id);write(R,list.slice(0,12));refresh()}
 function toggle(id){snapshot(id);const list=read(W);write(W,list.includes(id)?list.filter(x=>x!==id):[...list,id]);refresh()}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-dd-wish]');if(b){e.preventDefault();e.stopPropagation();toggle(b.dataset.ddWish)}});
 function theme(t){document.documentElement.dataset.ddStoreTheme=t;try{localStorage.setItem(T,t)}catch{};document.querySelectorAll('[data-dd-theme-toggle]').forEach(b=>{b.textContent=t==='dark'?'☀ Light':'☾ Dark';b.setAttribute('aria-label','Switch to '+(t==='dark'?'light':'dark')+' mode')})}
 theme(localStorage.getItem(T)==='light'?'light':'dark');
 document.addEventListener('click',e=>{if(e.target.closest('[data-dd-theme-toggle]'))theme(document.documentElement.dataset.ddStoreTheme==='dark'?'light':'dark')});
 window.DDExtras={view,refresh};
 document.addEventListener('DOMContentLoaded',()=>{const nav=document.querySelector('header.nav');if(nav){const area=document.createElement('div');area.className='dd-header-tools';area.innerHTML='<a class="dd-wishlist-link" href="wishlist.html" aria-label="My wishlist">♡ <span data-dd-wish-count></span></a><button type="button" data-dd-theme-toggle></button>';nav.insertBefore(area,nav.lastElementChild);theme(document.documentElement.dataset.ddStoreTheme)}
 if(document.body.dataset.ddRecent==='yes'){const target=document.querySelector('#shop')||document.querySelector('main');if(target){const section=document.createElement('section');section.className='dd-extra-section';section.innerHTML='<h2>Recently Viewed</h2><p>Pick up where you left off</p><div id="dd-recent-grid" class="dd-extra-grid"></div>';target.append(section)}}
 refresh();setTimeout(refresh,700);
 const query=new URLSearchParams(location.search).get('product');if(query){let tries=0;const open=setInterval(()=>{if(byId(query)&&typeof window.detail==='function'){clearInterval(open);window.detail(query)}else if(++tries>20)clearInterval(open)},300)}
 });
})();
