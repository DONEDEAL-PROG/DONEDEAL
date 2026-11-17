(function(){
'use strict';
const icons={
dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
orders:'<path d="M8 3h8l2 3v15l-6-3-6 3V6z"/><path d="M9 9h6M9 13h6"/>',
customers:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
payments:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
analytics:'<path d="M4 20V11M10 20V7M16 20V13M22 20V3"/>',
products:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
categories:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
inventory:'<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 5 9-5M12 12v9"/>',
staff:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M18 8v6M15 11h6"/>',
refunds:'<path d="M3 11a9 9 0 1 1 3 7M3 4v7h7"/><path d="M12 7v5l3 2"/>',
activity:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2M3 12h3M3 18h3"/>',
partners:'<path d="M8 12l3 3 5-6"/><path d="M12 22s9-4.5 9-11V5l-9-3-9 3v6c0 6.5 9 11 9 11z"/>',
shipping:'<path d="M3 6h12v12H3zM15 10h4l3 4v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
theme:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
collapse:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 9l-3 3 3 3"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
ledger:'<path d="M4 3h14a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2zM8 7h8M8 11h8M8 15h5"/>',
plus:'<path d="M12 5v14M5 12h14"/>'
};
function svg(name){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>'}
const groups=[
['OVERVIEW',[['dashboard','Dashboard','/admin/operations.html#dashboard']]],
['SALES',[['orders','Orders','/admin/operations.html#orders'],['customers','Customers','/admin/customers.html'],['payments','Payments / Transactions','/admin/payments.html'],['analytics','Sales Analytics','/admin/operations.html#analytics']]],
['CATALOG',[['products','Products','/admin/'],
    ['ledger','Master Price Ledger','/admin/master-ledger.html'],['plus','Add Gadget','/admin/operations.html#gadgets'],['inventory','Inventory / Stock','/admin/#inventory']]],
['CUSTOMER SERVICE',[['staff','Staff Management','/admin/support-staff.html'],['refunds','Refund Approvals','/admin/staff-refunds.html'],['activity','Staff Activity Logs','/admin/staff-activity.html'],['pin','Customer PIN Recovery','/staff/pin-recovery.html']]],
['PARTNERS',[['partners','Affiliate Partners','/admin/partners.html']]],
['OPERATIONS',[['shipping','Track Orders / Shipping','/admin/operations.html#shipping'],['settings','Store Settings','/admin/operations.html#settings']]]
];
let theme;try{theme=localStorage.getItem('dd-admin-theme')}catch(e){}
document.documentElement.dataset.ddTheme=theme==='dark'?'dark':'light';
const aside=document.createElement('aside');aside.className='dd-sidebar';aside.setAttribute('aria-label','Admin navigation');
const brand=document.createElement('div');brand.className='dd-brand';brand.innerHTML='<span class="dd-brand-mark">DD</span><span class="dd-brand-copy">DONEDEAL<small>ADMIN CONTROL CENTER</small></span>';aside.append(brand);
const nav=document.createElement('nav');nav.className='dd-nav';nav.setAttribute('aria-label','Admin sections');
for(const [heading,links] of groups){
 const section=document.createElement('div');section.className='dd-nav-section';
 const group=document.createElement('div');group.className='dd-group';group.textContent=heading;section.append(group);
 for(const [icon,label,url] of links){
 const a=document.createElement('a');a.className='dd-link';a.href=url;a.title=label;
 a.innerHTML='<span class="dd-icon">'+svg(icon)+'</span><span class="dd-label"></span>';
 a.querySelector('.dd-label').textContent=label;
 a.addEventListener('click',()=>document.body.classList.remove('dd-open'));
 section.append(a);
 }
 nav.append(section);
}
aside.append(nav);
const footer=document.createElement('div');footer.className='dd-footer';
for(const [id,icon,label] of [['ddTheme','theme','Toggle light / dark'],['ddCollapse','collapse','Collapse sidebar']]){
 const b=document.createElement('button');b.type='button';b.id=id;b.className='dd-theme';b.title=label;b.innerHTML='<span class="dd-icon">'+svg(icon)+'</span><span class="dd-label">'+label+'</span>';footer.append(b);
}
aside.append(footer);
const backdrop=document.createElement('div');backdrop.className='dd-backdrop';backdrop.addEventListener('click',()=>document.body.classList.remove('dd-open'));
document.body.prepend(backdrop);document.body.prepend(aside);
// Keep all menu labels visible when moving between admin pages.
document.body.classList.remove('dd-collapsed');
const readability=document.createElement('link');
readability.rel='stylesheet';
readability.href='/admin/dd-readability-fix.css';
document.head.appendChild(readability);
const header=document.querySelector('body>header');
if(header){const b=document.createElement('button');b.type='button';b.className='dd-menu-toggle';b.innerHTML=svg('menu')+'<span>Menu</span>';b.setAttribute('aria-label','Open admin navigation');b.onclick=()=>document.body.classList.toggle('dd-open');header.prepend(b)}
document.getElementById('ddTheme').onclick=()=>{const next=document.documentElement.dataset.ddTheme==='dark'?'light':'dark';document.documentElement.dataset.ddTheme=next;try{localStorage.setItem('dd-admin-theme',next)}catch(e){}};
document.getElementById('ddCollapse').onclick=()=>{document.body.classList.toggle('dd-collapsed');const collapsed=document.body.classList.contains('dd-collapsed');document.getElementById('ddCollapse').title=collapsed?'Expand sidebar':'Collapse sidebar'};
function navigate(){
 document.body.classList.remove('dd-collapsed');
 const path=location.pathname,hash=location.hash;
 for(const a of aside.querySelectorAll('.dd-link')){
 const url=new URL(a.href);
 const active=url.pathname===path&&(url.hash===hash||(!hash&&url.hash==='#dashboard'&&path.includes('operations'))||(!hash&&!url.hash));
 a.classList.toggle('dd-active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 }
 if(path.includes('operations')){
 const mode=hash==='#orders'||hash==='#shipping'?'orders':hash==='#gadgets'?'gadgets':'dashboard';
 const home=document.getElementById('dashboardHome'),gadgets=document.getElementById('gadgets'),orders=document.getElementById('orders'),manage=document.getElementById('manageGadgets');
 if(home)home.hidden=mode!=='dashboard';
 if(gadgets)gadgets.classList.toggle('hide',mode!=='gadgets');
 if(orders)orders.classList.toggle('hide',mode!=='orders');
 if(manage)manage.hidden=mode!=='gadgets';
 if(hash==='#settings')document.getElementById('ddTheme')?.focus({preventScroll:true});
 }
 if(path==='/admin/'||path.endsWith('/admin/index.html')){
 if(hash==='#categories')document.getElementById('brandTabs')?.scrollIntoView({behavior:'smooth'});
 if(hash==='#inventory')document.getElementById('products')?.scrollIntoView({behavior:'smooth'});
 }
 document.body.classList.remove('dd-open');
}
window.addEventListener('hashchange',navigate);navigate();
})();
