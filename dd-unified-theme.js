(function(){
const KEY='dd_store_theme_v1';
function get(){try{return localStorage.getItem(KEY)==='light'?'light':'dark'}catch{return 'dark'}}
function apply(t){document.documentElement.dataset.ddStoreTheme=t;document.documentElement.style.colorScheme=t;
document.querySelectorAll('[data-dd-theme-toggle],#ddCheckoutTheme').forEach(b=>{
b.textContent=t==='dark'?'☀ Light':'☾ Dark';b.setAttribute('aria-label','Switch to '+(t==='dark'?'light':'dark')+' mode')})}
apply(get());
document.addEventListener('click',e=>{const b=e.target.closest('[data-dd-global-theme]');if(!b)return;const next=document.documentElement.dataset.ddStoreTheme==='dark'?'light':'dark';try{localStorage.setItem(KEY,next)}catch{}apply(next)});
window.addEventListener('storage',e=>{if(e.key===KEY)apply(get())});
document.addEventListener('DOMContentLoaded',()=>{
apply(get());
const nav=document.querySelector('header.nav,header .topbar,body>header');
if(nav&&!nav.querySelector('[data-dd-theme-toggle],#ddCheckoutTheme')){
const b=document.createElement('button');b.type='button';b.className='dd-unified-theme-toggle';b.dataset.ddGlobalTheme='1';nav.append(b);apply(get())}
});
window.DDTheme={apply,get};
})();