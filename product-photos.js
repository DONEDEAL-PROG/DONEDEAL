/* Exact-model premium photography. No automated third-party photo guessing. */
(function(){
'use strict';
const key='ddPhotoOverrides';let overrides={};try{overrides=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function photo(p){return overrides[p.id]||p.image||''}
function insertPhoto(visual,p,large){if(!visual)return;
 visual.querySelector('.mini')?.remove();visual.querySelector('.photoPending')?.remove();
 let img=visual.querySelector('img.productPhoto,img.detailPhoto');
 if(!img){img=document.createElement('img');img.className=large?'detailPhoto':'productPhoto';img.loading=large?'eager':'lazy';visual.append(img)}
 const url=photo(p);if(url){img.alt=p.brand+' '+p.name;img.style.display='block';img.src=url;img.onerror=()=>{img.style.display='none';fallback(visual,p)}}else{img.style.display='none';fallback(visual,p)}
}
function fallback(visual,p){if(visual.querySelector('.premiumFallback'))return;const box=document.createElement('div');box.className='premiumFallback';const brand=document.createElement('span');brand.className='fallbackBrand';brand.textContent=p.brand;const name=document.createElement('strong');name.textContent=p.name;const sub=document.createElement('small');sub.textContent='Official product image coming soon';box.append(brand,name,sub);visual.append(box)}
function enhance(){document.querySelectorAll('#catalog .product').forEach(el=>{const name=el.querySelector('h3')?.textContent;const brand=el.querySelector('.brand')?.textContent;const p=products.find(x=>x.name===name&&x.brand.toLowerCase()===brand?.toLowerCase());if(p)insertPhoto(el.querySelector('.visual'),p,false)})}
const oldRender=window.render;window.render=function(){oldRender();enhance()};
const oldDetail=window.detail;window.detail=function(id){oldDetail(id);const p=products.find(x=>x.id===id);if(p)insertPhoto(document.querySelector('#detailBody .visual'),p,true)};
const oldAdmin=window.openAdmin;window.openAdmin=function(){oldAdmin();document.querySelectorAll('#adminProducts .adminRow').forEach(row=>{const id=row.querySelector('[data-id]')?.dataset.id;const p=products.find(x=>x.id===id);if(!p)return;const field=document.createElement('input');field.type='url';field.placeholder='Exact-model image HTTPS URL';field.value=overrides[id]||p.image||'';field.style.cssText='width:180px;max-width:100%';field.setAttribute('aria-label','Product image URL for '+p.name);const save=document.createElement('button');save.type='button';save.textContent='Save photo';save.onclick=()=>{const value=field.value.trim();if(value&&!/^https:\/\//i.test(value)){alert('Enter an HTTPS image URL');return}if(value)overrides[id]=value;else delete overrides[id];localStorage.setItem(key,JSON.stringify(overrides));render();save.textContent='Saved'};row.append(field,save)})};
window.addEventListener('DOMContentLoaded',enhance);enhance();
})();
