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
  if(document.querySelector('.dd-mobile-bottom-nav'))return;
  const path=location.pathname.toLowerCase();
  const active=path.includes('wishlist')?'heart':path.includes('shop')||path.includes('brand-')?'shop':path.includes('checkout')?'cart':'home';
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
      const menu=document.querySelector('.dd-menu-trigger');
      if(menu)menu.click();else location.href='/support.html';
    });
    nav.appendChild(el);
  });
  document.body.appendChild(nav);
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