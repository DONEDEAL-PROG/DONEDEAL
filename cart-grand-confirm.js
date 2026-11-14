/* Done Deal: resilient Add to Cart confirmation.
   Independent of legacy celebration CSS; shows only if cart storage changed. */
(()=>{
 const style=document.createElement('style');
 style.textContent=`
 #ddGrandCartConfirm{position:fixed!important;inset:0!important;z-index:2147483646!important;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,5,13,.86);backdrop-filter:blur(12px)}
 #ddGrandCartConfirm.dd-visible{display:flex!important}
 #ddGrandCartConfirm .ddgc-card{position:relative;overflow:hidden;width:min(92vw,490px);padding:48px 26px 35px;text-align:center;color:white;background:radial-gradient(ellipse at 50% 0%,#612344,#27202e 57%,#17131d);border:2px solid #ff65ac;border-radius:30px;box-shadow:0 0 85px #fa338c5e,0 28px 80px #000a;animation:ddgcPop 1s cubic-bezier(.15,.8,.22,1.12) both}
 #ddGrandCartConfirm .ddgc-icon{width:110px;height:110px;margin:0 auto 16px;display:grid;place-items:center;font-size:63px;border-radius:28px;background:linear-gradient(145deg,#ff75b5,#df2077);box-shadow:0 12px 38px #fa2b8c99;animation:ddgcBag 1.35s cubic-bezier(.2,.85,.2,1.2) both}
 #ddGrandCartConfirm h2{font-size:clamp(29px,7vw,43px);line-height:1.1;margin:0 0 16px;color:white;font-weight:900;letter-spacing:-.025em;text-shadow:0 5px 22px #ff329999;animation:ddgcTitle 1.45s cubic-bezier(.2,.8,.2,1.1) .15s both}
 #ddGrandCartConfirm .ddgc-product{color:#ffc2df;font-size:15px;font-weight:700;line-height:1.5;overflow-wrap:anywhere}
 #ddGrandCartConfirm .ddgc-sub{color:#e6d6e1;font-size:13px;margin:14px 0 0}
 #ddGrandCartConfirm .ddgc-close{display:block;width:100%;border:0;border-radius:12px;padding:13px 15px;margin-top:26px;background:#ed4089;color:white;font-weight:800;font-size:15px;cursor:pointer}
 #ddGrandCartConfirm .ddgc-sparks{position:absolute;inset:0;pointer-events:none;opacity:0;background-image:radial-gradient(circle,#ffd875 3px,transparent 4px),radial-gradient(circle,#ff81c0 3px,transparent 4px),radial-gradient(circle,#a4a1ff 3px,transparent 4px);background-size:58px 69px,83px 87px,109px 95px;animation:ddgcSparks 1.8s ease-out .2s both}
 @keyframes ddgcPop{0%{opacity:0;transform:translateY(95px) scale(.62) rotate(-5deg)}48%{opacity:1;transform:translateY(-18px) scale(1.09) rotate(2deg)}72%{transform:translateY(9px) scale(.96)}88%{transform:translateY(-5px) scale(1.02)}100%{opacity:1;transform:none}}
 @keyframes ddgcBag{0%{opacity:0;transform:translateY(-115px) rotate(-20deg) scale(.5)}40%{opacity:1;transform:translateY(24px) rotate(12deg) scale(1.15)}65%{transform:translateY(-19px) rotate(-8deg)}83%{transform:translateY(9px) rotate(4deg)}100%{transform:none}}
 @keyframes ddgcTitle{0%{opacity:0;transform:translateY(-80px) scale(.65)}40%{opacity:1;transform:translateY(22px) scale(1.12)}62%{transform:translateY(-18px) scale(.94)}82%{transform:translateY(8px) scale(1.04)}100%{opacity:1;transform:none}}
 @keyframes ddgcSparks{0%{opacity:0;transform:translateY(-45px)}25%{opacity:1}100%{opacity:0;transform:translateY(90px)}}
 @media(prefers-reduced-motion:reduce){#ddGrandCartConfirm .ddgc-card,#ddGrandCartConfirm .ddgc-icon,#ddGrandCartConfirm h2,#ddGrandCartConfirm .ddgc-sparks{animation:none!important;opacity:1;transform:none}}
 `;
 document.head.append(style);
 let timer;
 function snapshot(){try{return localStorage.getItem('doneDealCart')||'{}'}catch{return '{}'}}
 function show(){
   let overlay=document.getElementById('ddGrandCartConfirm');
   if(!overlay){
     overlay=document.createElement('div');overlay.id='ddGrandCartConfirm';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Added to cart');
     overlay.innerHTML='<div class="ddgc-card"><div class="ddgc-sparks" aria-hidden="true"></div><div class="ddgc-icon" aria-hidden="true">✓</div><h2>ADDED TO CART!</h2><div class="ddgc-product"></div><p class="ddgc-sub">Your next favorite gadget is in the bag ✨</p><button class="ddgc-close" type="button">Continue Shopping</button></div>';
     document.body.append(overlay);
     overlay.querySelector('button').addEventListener('click',()=>overlay.classList.remove('dd-visible'));
     overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('dd-visible')});
   }
   const title=document.querySelector('#variantOverlay h2')?.textContent?.trim()||'Your gadget';
   const selected=document.querySelector('#variantChoices .selected')?.textContent?.trim()||'';
   overlay.querySelector('.ddgc-product').textContent=title+(selected?' · '+selected:'');
   document.getElementById('variantOverlay')?.classList.remove('open');
   // Hide the old overlay if a previous animation version is present.
   document.getElementById('ddCelebration')?.classList.remove('dd-celebrate-show');
   overlay.classList.remove('dd-visible');void overlay.offsetWidth;overlay.classList.add('dd-visible');
   clearTimeout(timer);timer=setTimeout(()=>overlay.classList.remove('dd-visible'),4200);
 }
 document.addEventListener('click',event=>{
   const btn=event.target.closest?.('#confirmVariant');
   if(!btn||btn.disabled)return;
   const before=snapshot();
   // Let the existing add-to-cart code save first; do not show a false success.
   setTimeout(()=>{if(snapshot()!==before)show()},100);
 },true);
})();
