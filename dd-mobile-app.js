(function(){
 'use strict';
 function icon(paths){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>'}
 const icons={
 home:icon('<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>'),
 shop:icon('<path d="M4 9h16l-1 12H5L4 9zM3 9l2-6h14l2 6M9 9v3m6-3v3"/>'),
 heart:icon('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>'),
 cart:icon('<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M2 3h2l3 13h13l2-9H5"/>'),
 account:icon('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')
 };
 function start(){
  if(/^\/(admin|staff|partner)(\/|$)/.test(location.pathname))return;
  document.documentElement.classList.add('dd-premium-mobile');
  if(!document.getElementById('ddMobilePremiumStyle')){const sheet=document.createElement('link');sheet.id='ddMobilePremiumStyle';sheet.rel='stylesheet';sheet.href='/dd-mobile-premium.css?v=20261117-3';document.head.append(sheet)}
  if(!document.querySelector('.dd-mobile-premium-header')){
   const header=document.createElement('div');header.className='dd-mobile-premium-header';header.setAttribute('role','banner');
   const brand=document.createElement('a');brand.href='/';brand.className='dd-mobile-premium-brand';brand.setAttribute('aria-label','Done Deal home');brand.innerHTML='<img src="/done-deal-mark.png" alt=""><span>DONE<span>DEAL</span></span>';
   const toggle=document.createElement('button');toggle.type='button';toggle.className='dd-mobile-premium-theme';
   function current(){return document.documentElement.dataset.ddStoreTheme==='light'?'light':'dark'}
   function paint(){toggle.textContent=current()==='dark'?'☀ Light':'☾ Dark';toggle.setAttribute('aria-label','Switch to '+(current()==='dark'?'light':'dark')+' mode')}
   toggle.onclick=()=>{const next=current()==='dark'?'light':'dark';try{localStorage.setItem('dd_store_theme_v1',next)}catch{}document.documentElement.dataset.ddStoreTheme=next;document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;window.DDTheme?.apply(next);paint()};
   new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['data-dd-store-theme']});paint();header.append(brand,toggle);document.body.prepend(header);
  }

  // Keep the existing sidebar and its event handlers; expose its trigger in the mobile header.
  function placeMenu(){
   const trigger=document.querySelector('.dd-menu-trigger'),header=document.querySelector('.dd-mobile-premium-header');
   if(!trigger||!header)return;
   if(!trigger.ddOriginalParent){trigger.ddOriginalParent=trigger.parentNode;trigger.ddOriginalNext=trigger.nextSibling;}
   if(matchMedia('(max-width:767px)').matches){if(trigger.parentNode!==header)header.prepend(trigger);}
   else if(trigger.parentNode!==trigger.ddOriginalParent)trigger.ddOriginalParent.insertBefore(trigger,trigger.ddOriginalNext);
  }
  placeMenu();new MutationObserver(placeMenu).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',placeMenu);
  if(document.querySelector('.dd-mobile-bottom-nav'))return;
  const path=location.pathname.toLowerCase();
  const active=/\/(account|pin-recovery)(?:\.html)?\/?$/.test(path)?'account':path.includes('wishlist')?'heart':/\/(shop|brand-[^/]+)(?:\.html)?\/?$/.test(path)?'shop':path.includes('checkout')?'cart':/^\/(?:index(?:\.html)?)?$/.test(path)?'home':null;
  const nav=document.createElement('nav');nav.className='dd-mobile-bottom-nav';nav.setAttribute('aria-label','Mobile shopping navigation');
  [['home','Home','/'],['shop','Shop','/shop.html'],['heart','Wishlist','/wishlist.html'],['cart','Cart','#'],['account','Account','#']].forEach(([key,label,url])=>{
    const el=document.createElement(key==='cart'||key==='account'?'button':'a');
    if(el.tagName==='A')el.href=url;else el.type='button';
    el.innerHTML=icons[key]+'<span>'+label+'</span>';
    if(key===active){el.classList.add('dd-active');el.setAttribute('aria-current','page')}
    if(key==='cart')el.addEventListener('click',()=>{
      if(typeof window.openCart==='function')window.openCart();
      else location.href='/checkout.html';
    });
    if(key==='account')el.addEventListener('click',()=>{
      location.href='/account.html';
    });
    nav.appendChild(el);
  });
  document.body.appendChild(nav);
  const cartOverlay=document.getElementById('cartOverlay');
  if(cartOverlay){const sync=()=>{const cartOpen=cartOverlay.classList.contains('open');nav.querySelectorAll('a,button').forEach((el,i)=>{const selected=cartOpen?i===3:['home','shop','heart','cart','account'][i]===active;el.classList.toggle('dd-active',selected);if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')})};new MutationObserver(sync).observe(cartOverlay,{attributes:true,attributeFilter:['class']});sync()}

  if(document.querySelector('main#home>.hero')){
    const hero=document.createElement('section');
    hero.className='dd-mobile-hero';
    hero.setAttribute('aria-label','DONEDEAL featured banner');
    hero.innerHTML='<img src="hero-unified.webp" alt="DONEDEAL featured smartphone collection"><div class="dd-mobile-hero-content"><div><strong>Explore the collection</strong><small>Shop your favorite smartphone brands</small></div><button type="button">Shop now →</button></div>';
    hero.querySelector('button').addEventListener('click',()=>{location.href='/shop.html'});
    document.querySelector('main#home>.hero').before(hero);
    const search=document.createElement('a');search.className='dd-mobile-search';search.href='/#shop';search.innerHTML='⌕ &nbsp; Search phones, gadgets, accessories…';
    hero.before(search);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();