/* Done Deal: product photography. Uses supplied HTTPS photo URLs first,
   then optional local product-images/<ID>.jpg, then Wikimedia Commons image search.
   Wikimedia photos are third-party references; verify model and licensing before production. */
(function(){
'use strict';
const cacheKey='ddPhotoUrlsV2';let cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||'{}')}catch{}
const overridesKey='ddPhotoOverrides';let overrides={};try{overrides=JSON.parse(localStorage.getItem(overridesKey)||'{}')}catch{}
const originalRender=window.render;
let requests=0;const queue=[];const waiting=new Set();
const safe=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function urlFor(p){return overrides[p.id]||p.image||cache[p.id]||''}
function insertPhoto(visual,p,large=false){
 if(!visual)return;
 const mini=visual.querySelector('.mini');if(mini)mini.remove();
 let img=visual.querySelector('img.productPhoto, img.detailPhoto');
 if(!img){img=document.createElement('img');img.className=large?'detailPhoto':'productPhoto';img.alt=p.brand+' '+p.name+' product photograph';img.loading=large?'eager':'lazy';visual.append(img)}
 const src=urlFor(p);
 if(src){img.style.display='block';img.src=src;img.onerror=()=>{img.style.display='none';let note=visual.querySelector('.photoPending');if(!note){note=document.createElement('div');note.className='photoPending';visual.append(note)}note.textContent='Product photo unavailable';};}
 else {img.style.display='none';let note=visual.querySelector('.photoPending');if(!note){note=document.createElement('div');note.className='photoPending';visual.append(note)}note.textContent='Loading product photo…';schedule(p)}
}
function schedule(p){if(waiting.has(p.id)||cache[p.id]==='unavailable')return;waiting.add(p.id);queue.push(p);pump()}
function pump(){while(requests<3&&queue.length){const p=queue.shift();requests++;findPhoto(p).finally(()=>{requests--;pump()})}}
async function findPhoto(p){
 try{
  const q=(p.brand==='Apple'?'Apple ':'')+p.name+' smartphone';
  const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:q,gsrnamespace:'6',gsrlimit:'12',prop:'imageinfo',iiprop:'url|mime',iiurlwidth:'650',format:'json',origin:'*'});
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),8500);
  let response;try{response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:ctrl.signal})}finally{clearTimeout(timer)}
  if(!response.ok)throw Error('Image search failed');const data=await response.json();
  const pages=Object.values(data.query?.pages||{});
  const tokens=p.name.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>1);
  const scored=pages.map(page=>{const title=(page.title||'').toLowerCase();const info=page.imageinfo?.[0];const url=info?.thumburl||info?.url;let score=tokens.reduce((n,t)=>n+(title.includes(t)?1:0),0);if(title.includes(p.brand.toLowerCase()))score+=1;if(/logo|icon|box|advert|screenshot|rendering|concept|case|mockup/.test(title))score-=4;if(!/image\/(jpeg|png|webp)/.test(info?.mime||''))score-=10;return {url,score}}).sort((a,b)=>b.score-a.score);
  const best=scored[0];if(!best?.url||best.score<Math.max(2,Math.ceil(tokens.length*.65)))throw Error('No matching photograph');
  cache[p.id]=best.url;localStorage.setItem(cacheKey,JSON.stringify(cache));
  document.querySelectorAll('#catalog .product').forEach(el=>{const title=el.querySelector('h3')?.textContent;if(title===p.name){const visual=el.querySelector('.visual');const img=visual?.querySelector('.productPhoto');if(img){img.style.display='block';img.src=best.url;visual.querySelector('.photoPending')?.remove()}}});
 }catch(e){cache[p.id]='unavailable';try{localStorage.setItem(cacheKey,JSON.stringify(cache))}catch{};document.querySelectorAll('#catalog .product').forEach(el=>{if(el.querySelector('h3')?.textContent===p.name){const note=el.querySelector('.photoPending');if(note)note.textContent='Photo coming soon'}})}
}
function enhance(){document.querySelectorAll('#catalog .product').forEach(el=>{const name=el.querySelector('h3')?.textContent;const brand=el.querySelector('.brand')?.textContent;const p=products.find(x=>x.name===name&&x.brand.toLowerCase()===brand?.toLowerCase());if(p)insertPhoto(el.querySelector('.visual'),p)})}
window.render=function(){originalRender();enhance()};
const oldDetail=window.detail;window.detail=function(id){oldDetail(id);const p=products.find(x=>x.id===id);if(p)insertPhoto(document.querySelector('#detailBody .visual'),p,true)};
// Allow a real image URL for every existing phone through the store manager.
const oldAdmin=window.openAdmin;window.openAdmin=function(){oldAdmin();const rows=document.querySelectorAll('#adminProducts .adminRow');rows.forEach(row=>{const id=row.querySelector('[data-id]')?.dataset.id;if(!id)return;const p=products.find(x=>x.id===id);if(!p)return;const field=document.createElement('input');field.type='url';field.placeholder='Product photo HTTPS URL';field.value=overrides[id]||p.image||'';field.style.cssText='width:170px;max-width:100%';field.setAttribute('aria-label','Photo URL for '+p.name);const save=document.createElement('button');save.type='button';save.textContent='Save photo';save.onclick=()=>{const val=field.value.trim();if(val&&!/^https:\/\//i.test(val)){alert('Enter an HTTPS image URL');return}if(val)overrides[id]=val;else delete overrides[id];localStorage.setItem(overridesKey,JSON.stringify(overrides));delete cache[id];localStorage.setItem(cacheKey,JSON.stringify(cache));render();save.textContent='Saved'};row.append(field,save)})};
window.addEventListener('DOMContentLoaded',enhance);enhance();
})();