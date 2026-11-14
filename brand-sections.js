/* Done Deal: organized brand sections, preserving search, filters and existing cards. */
(function(){
 'use strict';
 const order=['Apple','Samsung','Huawei','Xiaomi','OPPO','vivo'];
 const catalog=document.getElementById('catalog');
 if(!catalog || typeof window.render!=='function')return;
 const original=window.render;
 function groupCards(){
  const cards=[...catalog.querySelectorAll(':scope > .product')];
  if(!cards.length)return;
  const sections=new Map();
  const fragment=document.createDocumentFragment();
  for(const brand of order){
   const matched=cards.filter(card=>card.querySelector('.brand')?.textContent.trim().toLowerCase()===brand.toLowerCase() && card.style.display!=='none');
   if(!matched.length)continue;
   const section=document.createElement('section');section.className='dd-brand-section';section.id='brand-'+brand.toLowerCase();
   const heading=document.createElement('div');heading.className='dd-brand-heading';
   const title=document.createElement('h3');title.textContent=brand;
   const count=document.createElement('span');count.textContent=matched.length+' '+(matched.length===1?'phone':'phones');
   heading.append(title,count);
   const grid=document.createElement('div');grid.className='dd-brand-grid';
   matched.forEach(card=>grid.appendChild(card));
   section.append(heading,grid);fragment.appendChild(section);sections.set(brand,true);
  }
  // Preserve any new brand added through future catalog updates.
  const extras=cards.filter(card=>card.style.display!=='none' && !order.some(b=>b.toLowerCase()===card.querySelector('.brand')?.textContent.trim().toLowerCase()));
  if(extras.length){const section=document.createElement('section');section.className='dd-brand-section';const heading=document.createElement('h3');heading.textContent='Other phones';const grid=document.createElement('div');grid.className='dd-brand-grid';extras.forEach(card=>grid.appendChild(card));section.append(heading,grid);fragment.appendChild(section)}
  catalog.replaceChildren(fragment);
 }
 window.render=function(){original();groupCards()};
 // Initial catalog was rendered before this file loaded.
 window.render();
})();
