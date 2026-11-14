/* Dedicated brand-page navigation. All pages share the same catalog, cart and product logic. */
(function(){
 const names=['Apple','Samsung','Huawei','Xiaomi','OPPO','vivo'];
 const slug=s=>String(s).toLowerCase();
 const current=document.body.dataset.brand||'';
 window.selectBrand=function(name){if(names.some(x=>slug(x)===slug(name)))location.href='brand-'+slug(name)+'.html';};
 window.resetBrand=function(){location.href='index.html#shop';};
 // Route catalog brand filter buttons to dedicated pages instead of filtering in place.
 const chips=document.getElementById('brands');
 if(chips)chips.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;const name=b.textContent.trim();e.preventDefault();e.stopImmediatePropagation();if(/^all brands$/i.test(name))resetBrand();else selectBrand(name);},true);
 if(current){
  const found=names.find(x=>slug(x)===slug(current));if(!found)return;
  filter=found;
  window.render();
  document.title=found+' Smartphones | Done Deal Gadgets & Supplies';
  const heading=document.querySelector('#shop .sectionhead h2');if(heading){heading.style.display='block';heading.textContent=found+' Smartphones';}
  const sub=document.querySelector('#shop .sectionhead p');if(sub)sub.textContent='Explore our '+found+' smartphone collection';
  const featured=document.querySelector('.featuredHeading');if(featured)featured.style.display='none';
  const shop=document.getElementById('shop');if(shop){const crumb=document.createElement('div');crumb.className='dd-breadcrumb';crumb.innerHTML='<a href="index.html">Home</a><span> / </span><span>'+found+'</span>';shop.prepend(crumb);}
  const all=document.querySelector('#brands button');if(all)all.classList.remove('active');
  document.querySelectorAll('#brands button').forEach(b=>b.classList.toggle('active',slug(b.textContent.trim())===slug(found)));
 }
})();