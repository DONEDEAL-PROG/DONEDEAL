(function(){
const items=[
['OVERVIEW',[['▦','Dashboard','/admin/operations.html#dashboard']]],
['SALES',[['▤','Orders','/admin/operations.html#orders'],['♧','Customers','/admin/customers.html'],['▥','Payments / Transactions','/admin/payments.html'],['↗','Sales Analytics','/admin/operations.html#analytics']]],
['CATALOG',[['▣','Products','/admin/'],['▦','Categories','/admin/#categories'],['◫','Inventory / Stock','/admin/#inventory']]],
['PARTNERS',[['♡','Affiliate Partners','/admin/partners.html']]],
['OPERATIONS',[['⇄','Track Orders / Shipping','/admin/operations.html#shipping'],['⚙','Store Settings','/admin/operations.html#settings']]]];
let theme;try{theme=localStorage.getItem('dd-admin-theme')}catch(e){}
document.documentElement.dataset.ddTheme=theme==='dark'?'dark':'light';
const aside=document.createElement('aside');aside.className='dd-sidebar';aside.setAttribute('aria-label','Admin navigation');
aside.innerHTML='<div class="dd-brand">DONEDEAL<small>GADGETS & SUPPLIES</small></div><div class="dd-nav">'+items.map(([g,links])=>'<div class="dd-group">'+g+'</div>'+links.map(([i,t,u])=>'<a class="dd-link" href="'+u+'"><span class="dd-icon" aria-hidden="true">'+i+'</span><span class="dd-label">'+t+'</span></a>').join('')).join('')+'</div><div class="dd-footer"><button type="button" class="dd-theme" id="ddTheme">◐ <span class="dd-label">Toggle light / dark</span></button><button type="button" class="dd-theme" id="ddCollapse" style="margin-top:8px">☰ <span class="dd-label">Collapse sidebar</span></button></div>';
const backdrop=document.createElement('div');backdrop.className='dd-backdrop';backdrop.addEventListener('click',()=>document.body.classList.remove('dd-open'));
document.body.prepend(backdrop);document.body.prepend(aside);
const header=document.querySelector('body>header');if(header){const btn=document.createElement('button');btn.type='button';btn.className='dd-menu-toggle';btn.textContent='☰ Menu';btn.onclick=()=>document.body.classList.toggle('dd-open');header.prepend(btn)}
document.getElementById('ddTheme').onclick=()=>{let next=document.documentElement.dataset.ddTheme==='dark'?'light':'dark';document.documentElement.dataset.ddTheme=next;try{localStorage.setItem('dd-admin-theme',next)}catch(e){}};
document.getElementById('ddCollapse').onclick=()=>document.body.classList.toggle('dd-collapsed');
function navigate(){
let path=location.pathname,hash=location.hash;
aside.querySelectorAll('.dd-link').forEach(a=>a.classList.toggle('dd-active',new URL(a.href).pathname===path && new URL(a.href).hash===hash || (!hash && a.getAttribute('href')===(path==='/admin/index.html'?'/admin/':path))));
if(path.includes('operations')){
if(['#orders','#shipping'].includes(hash)){const tab=document.querySelector('[data-tab="orders"]');if(tab)tab.click()}
else if(['#dashboard','#analytics','#settings'].includes(hash)){const tab=document.querySelector('[data-tab="gadgets"]');if(tab)tab.click()}
if(hash==='#customers'){setTimeout(()=>document.getElementById('orderSearch')?.focus(),350)}
if(hash==='#settings'){setTimeout(()=>document.getElementById('ddTheme')?.focus(),150)}
}
if(path==='/admin/'||path.endsWith('/admin/index.html')){if(hash==='#categories'){setTimeout(()=>document.getElementById('brandTabs')?.scrollIntoView({behavior:'smooth'}),250)}if(hash==='#inventory'){setTimeout(()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'}),250)}}
document.body.classList.remove('dd-open');
}
window.addEventListener('hashchange',navigate);navigate();
})();