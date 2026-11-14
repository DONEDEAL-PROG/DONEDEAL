/* Real multi-page navigation; brand pages contain only brand-specific shopping content. */
(function(){
const names=['Apple','Samsung','Huawei','Xiaomi','OPPO','vivo'];
const slug=s=>String(s).toLowerCase();
window.selectBrand=function(name){const b=names.find(x=>slug(x)===slug(name));if(b)window.location.assign('brand-'+slug(b)+'.html');};
window.resetBrand=function(){window.location.assign('shop.html');};
const current=document.body.dataset.brand||'';
const chips=document.getElementById('brands');
if(chips)chips.addEventListener('click',function(e){const btn=e.target.closest('button');if(!btn)return;const label=btn.textContent.trim();e.preventDefault();e.stopImmediatePropagation();if(/^all brands$/i.test(label))window.resetBrand();else window.selectBrand(label);},true);
if(current){const found=names.find(x=>slug(x)===slug(current));if(found){filter=found;renderBrands();render();document.title=found+' Phones | Done Deal Gadgets & Supplies';const sub=document.querySelector('#shop .sectionhead p');if(sub)sub.textContent='Showing '+found+' smartphones only';}}
})();