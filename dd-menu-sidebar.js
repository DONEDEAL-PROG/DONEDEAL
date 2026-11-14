(function(){
function ready(){
 const nav=document.querySelector('header.nav,header .topbar,body>header');
 if(!nav||document.querySelector('.dd-menu-trigger'))return;
 const trigger=document.createElement('button');trigger.type='button';trigger.className='dd-menu-trigger';trigger.setAttribute('aria-label','Open navigation menu');trigger.setAttribute('aria-expanded','false');
 trigger.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg> Menu';
 nav.insertBefore(trigger,nav.firstChild);
 const scrim=document.createElement('div');scrim.className='dd-menu-scrim';
 const panel=document.createElement('aside');panel.className='dd-menu-panel';panel.setAttribute('aria-label','Shop navigation');panel.setAttribute('aria-hidden','true');
 const home=location.pathname.endsWith('/index.html')||location.pathname==='/'||location.pathname.endsWith('/');
 const prefix=home?'':'index.html';
 panel.innerHTML='<div class="dd-menu-top"><div class="dd-menu-brand">DONE<span>DEAL</span></div><button class="dd-menu-close" type="button" aria-label="Close menu">×</button></div><nav class="dd-menu-links"><a href="index.html"> <span>⌂</span> Home</a><a href="shop.html"><span>▣</span> Shop All Gadgets</a><a href="index.html#brands"><span>◇</span> Shop by Brand</a><a href="wishlist.html"><span>♡</span> My Wishlist</a><a href="index.html#dd-recent-grid"><span>◷</span> Recently Viewed</a><a href="index.html#about"><span>ⓘ</span> About DONEDEAL</a></nav><div class="dd-menu-foot">DONEDEAL Gadgets & Supplies</div>';
 document.body.append(scrim,panel);
 const setOpen=on=>{document.body.classList.toggle('dd-menu-open',on);trigger.setAttribute('aria-expanded',String(on));panel.setAttribute('aria-hidden',String(!on));if(on)panel.querySelector('.dd-menu-close').focus();else trigger.focus()};
 trigger.addEventListener('click',()=>setOpen(true));scrim.addEventListener('click',()=>setOpen(false));panel.querySelector('.dd-menu-close').addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('dd-menu-open'))setOpen(false)});
 panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('dd-menu-open')}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();