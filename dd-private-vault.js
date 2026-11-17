/* Browser-local privacy vault. PIN is never stored. No remote account is created. */
(function(){
'use strict';
try{const theme=localStorage.getItem('dd_store_theme_v1')==='light'?'light':'dark';document.documentElement.dataset.ddStoreTheme=theme;document.documentElement.dataset.theme=theme}catch{}
const KEY='ddPrivateVaultV1',PUBLIC='ddPrivateSummaryV1',PRIVATE=['doneDealCheckoutDetailsV1','doneDealOrderHistoryV1'];
const enc=new TextEncoder(),dec=new TextDecoder();let key=null,data={},pending=Promise.resolve(),active=false,timer;
const b64=bytes=>{const a=new Uint8Array(bytes);let out='';for(let i=0;i<a.length;i+=8192)out+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(out)};
const un64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const read=()=>JSON.parse(localStorage.getItem(KEY)||'null');
const has=()=>!!localStorage.getItem(KEY);
function legacy(){const result={};for(const name of PRIVATE){const raw=localStorage.getItem(name);if(raw!==null)result[name]=raw}return result}
async function derive(pin,salt){const material=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function publicSummary(){let c={},orders=[];try{c=JSON.parse(data[PRIVATE[0]]||'{}').contact||{}}catch{}try{orders=JSON.parse(data[PRIVATE[1]]||'[]')}catch{}return {name:typeof c.name==='string'?c.name:'',email:typeof c.email==='string'&&c.email.includes('@')?c.email[0]+'•••@'+c.email.split('@')[1]:'',orders:Array.isArray(orders)?orders.slice(0,50).map(o=>({id:o.id,status:o.status,created_at:o.created_at,total:o.total,items:Array.isArray(o.items)?o.items.map(i=>({name:i.name,variant:i.variant,quantity:i.quantity,subtotal:i.subtotal,image_key:i.image_key})):[]})):[]}}
async function write(){if(!active||!key)return;const record=read();if(!record)throw Error('Private storage was removed. Unlock again.');const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data)));localStorage.setItem(KEY,JSON.stringify({v:1,salt:record.salt,iv:b64(iv),ciphertext:b64(ciphertext),failed:0,until:0}));localStorage.setItem(PUBLIC,JSON.stringify(publicSummary()));for(const name of PRIVATE)localStorage.removeItem(name);await syncRecovery()}
function enqueue(){pending=pending.then(write).catch(e=>{document.dispatchEvent(new CustomEvent('dd-vault-error',{detail:e.message}));throw e});pending.catch(()=>{});return pending}
const storage={getItem(name){return PRIVATE.includes(name)?(active?(data[name]??null):null):localStorage.getItem(name)},setItem(name,value){if(!PRIVATE.includes(name))return localStorage.setItem(name,value);if(!active)return;data[name]=String(value);enqueue()},removeItem(name){if(!PRIVATE.includes(name))return localStorage.removeItem(name);if(!active)return;delete data[name];enqueue()}};
async function setup(pin){if(!/^\d{6}$/.test(pin))throw Error('Use exactly six digits.');if(has())throw Error('A PIN already exists. Unlock instead.');if(!crypto?.subtle)throw Error('Private storage needs a secure HTTPS connection.');const salt=crypto.getRandomValues(new Uint8Array(16));const next=await derive(pin,salt);data=legacy();key=next;active=true;localStorage.setItem(KEY,JSON.stringify({v:1,salt:b64(salt)}));try{await write()}catch(e){localStorage.removeItem(KEY);active=false;key=null;throw e}watch();return storage}
async function unlock(pin){const record=read();if(!record||record.v!==1)throw Error('Saved private storage is unavailable.');if(Date.now()<Number(record.until||0))throw Error('Too many attempts. Try again in '+Math.ceil((record.until-Date.now())/1000)+' seconds.');let next,plain;try{next=await derive(pin,un64(record.salt));plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(record.iv)},next,un64(record.ciphertext));data=JSON.parse(dec.decode(plain));if(!data||typeof data!=='object'||Array.isArray(data))throw Error()}catch{record.failed=Number(record.failed||0)+1;record.until=record.failed>=5?Date.now()+300000:0;localStorage.setItem(KEY,JSON.stringify(record));throw Error(record.failed>=5?'Too many attempts. Try again in five minutes.':'Incorrect PIN. Please try again.')}key=next;active=true;record.failed=0;record.until=0;localStorage.setItem(KEY,JSON.stringify(record));await syncRecovery();watch();return storage}
async function lock(){if(!active)return;document.documentElement.style.visibility='hidden';try{await pending}finally{active=false;key=null;data={};location.reload()}}
function watch(){clearTimeout(timer);timer=setTimeout(lock,180000)}
for(const event of ['pointerdown','keydown','touchstart'])document.addEventListener(event,()=>{if(active)watch()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)lock()});
window.addEventListener('pagehide',()=>{key=null;data={};active=false});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
window.addEventListener('storage',e=>{if(e.key===KEY&&active)lock()});
function summary(){try{if(has())return JSON.parse(localStorage.getItem(PUBLIC)||'{}');data=legacy();const value=publicSummary();data={};return value}catch{return {}}}
function promptPIN({allowSkip=false,purpose="details",recoveryRecords=null}={}){return new Promise(resolve=>{
 const creating=!!recoveryRecords||!has(),dialog=document.createElement('dialog');dialog.className='dd-pin-dialog dd-pin-ios';dialog.setAttribute('aria-labelledby','dd-pin-title');dialog.setAttribute('aria-describedby','dd-pin-description');
 dialog.innerHTML='<form><div class="dd-pin-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg></div><p class="dd-pin-eyebrow">PRIVATE ACCESS</p><h2 id="dd-pin-title">'+(creating?'Create your PIN':purpose==='cancel'?'Confirm cancellation':'Welcome back')+'</h2><p id="dd-pin-description" class="dd-pin-description">'+(creating?'Choose a 6-digit PIN for your saved details.':purpose==='cancel'?'Enter your 6-digit PIN to cancel this order.':'Enter your 6-digit PIN to view your details.')+'</p><div class="dd-pin-dots" role="group" aria-label="6-digit PIN"><span></span><span></span><span></span><span></span><span></span><span></span></div><span class="dd-pin-count" role="status" aria-live="polite">0 of 6 digits entered</span><div class="dd-pin-keypad" role="group" aria-label="PIN number pad"></div><p class="dd-pin-error" role="alert"></p><button class="dd-pin-primary" type="submit" disabled>'+(creating?'Continue':purpose==='cancel'?'Confirm cancellation':'Unlock details')+'</button><button class="dd-pin-secondary" type="button">'+(allowSkip?'Continue without saved details':'Cancel')+'</button>'+(!creating?'<button class="dd-pin-forgot" type="button">Forgot PIN?</button>':'<p class="dd-pin-note">This PIN works on this browser and device. Keep it safe.</p>')+'</form>';
 document.body.append(dialog);
 const form=dialog.querySelector('form'),error=dialog.querySelector('[role=alert]'),pad=dialog.querySelector('.dd-pin-keypad'),submit=dialog.querySelector('[type=submit]'),dots=[...dialog.querySelectorAll('.dd-pin-dots span')];
 let busy=false,value='',first='',confirming=false;
 const paint=()=>{dots.forEach((dot,i)=>{dot.classList.toggle('filled',i<value.length);dot.textContent=i<value.length?'•':''});dialog.querySelector('.dd-pin-count').textContent=value.length+' of 6 digits entered';submit.disabled=busy||value.length!==6};
 const finish=result=>{value=first='';dialog.close();dialog.remove();resolve(result)};
 function enter(digit){if(busy||value.length>=6)return;value+=digit;error.textContent='';paint();if(value.length===6)form.requestSubmit()}
 function backspace(){if(busy)return;value=value.slice(0,-1);paint()}
 for(const digit of ['1','2','3','4','5','6','7','8','9','blank','0','back']){
  if(digit==='blank'){const spacer=document.createElement('span');spacer.setAttribute('aria-hidden','true');pad.append(spacer);continue}
  const button=document.createElement('button');button.type='button';button.className='dd-pin-key';button.setAttribute('aria-label',digit==='back'?'Delete last digit':digit);
  if(digit==='back')button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h12v16H9L2 12zM12 9l6 6m0-6-6 6"/></svg>';else{const numeral=document.createElement('span');numeral.className='dd-ios-numeral';numeral.textContent=digit;const letters=document.createElement('small');letters.setAttribute('aria-hidden','true');letters.textContent=({2:'ABC',3:'DEF',4:'GHI',5:'JKL',6:'MNO',7:'PQRS',8:'TUV',9:'WXYZ'})[digit]||' ';button.append(numeral,letters);}
  button.onclick=()=>digit==='back'?backspace():enter(digit);pad.append(button);
 }
 dialog.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(/^[0-9]$/.test(e.key)){e.preventDefault();enter(e.key)}else if(e.key==='Backspace'){e.preventDefault();backspace()}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)finish(null)});
 dialog.querySelector('.dd-pin-secondary').onclick=()=>{if(!busy)finish(null)};
 const forgot=dialog.querySelector('.dd-pin-forgot');if(forgot)forgot.onclick=()=>{
 if(busy)return;
 value=first='';paint();
 const panel=document.createElement('div');panel.className='dd-pin-support';
 const heading=document.createElement('h3');heading.textContent='Need help with your PIN?';
 const message=document.createElement('p');message.textContent='Request recovery, then contact support to verify your identity. Only authorized staff can approve a reset.';
 const link=document.createElement('a');link.className='dd-pin-primary';link.textContent='Request PIN recovery';link.href='/support.html?intent=pin-recovery';link.onclick=async event=>{event.preventDefault();link.textContent='Opening customer support…';let id;try{id=(await recoveryAPI('request')).request?.id}catch{}location.href='/support.html?intent=pin-recovery'+(id?'&recovery_ref='+encodeURIComponent(id):'')};
 const back=document.createElement('button');back.type='button';back.className='dd-pin-secondary';back.textContent='Back to PIN';
 const controls=[dialog.querySelector('.dd-pin-dots'),dialog.querySelector('.dd-pin-count'),pad,submit,dialog.querySelector('.dd-pin-secondary'),forgot];
 controls.forEach(el=>el.hidden=true);error.textContent='';
 back.onclick=()=>{panel.remove();controls.forEach(el=>el.hidden=false);pad.querySelector('button').focus()};
 panel.append(heading,message,link,back);form.append(panel);back.focus();
 };
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||value.length!==6)return;
  if(creating&&!confirming){first=value;value='';confirming=true;dialog.querySelector('h2').textContent='Confirm your PIN';dialog.querySelector('.dd-pin-description').textContent='Enter the same 6 digits again.';submit.textContent='Save PIN & unlock';paint();pad.querySelector('button').focus();return}
  if(creating&&first!==value){value=first='';confirming=false;dialog.querySelector('h2').textContent='Create your PIN';dialog.querySelector('.dd-pin-description').textContent='Choose a 6-digit PIN for your saved details.';submit.textContent='Continue';error.textContent='PINs did not match. Choose your PIN again.';paint();return}
  busy=true;dialog.classList.add('dd-pin-verifying');dialog.querySelector('.dd-pin-count').textContent='Verifying PIN';const buttons=[...dialog.querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);error.textContent='';
  try{const result=recoveryRecords?await installRecovered(value,recoveryRecords):creating?await setup(value):await unlock(value);finish(result)}catch(e){error.textContent=e.message;value='';pad.querySelector('button').focus()}finally{busy=false;dialog.classList.remove('dd-pin-verifying');buttons.forEach(button=>button.disabled=false);paint()}
 };
 dialog.showModal();pad.querySelector('button').focus();
})}
const RECOVERY_DEVICE='ddPinRecoveryDeviceV1';let recoveredBuffer=null;
function device(create=false){try{const found=JSON.parse(localStorage.getItem(RECOVERY_DEVICE)||'null');if(found?.id&&/^[a-f0-9]{64}$/.test(found.secret))return found;if(!create)return null;const entry={id:crypto.randomUUID(),secret:Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('')};localStorage.setItem(RECOVERY_DEVICE,JSON.stringify(entry));return entry}catch{return null}}
async function recoveryAPI(action,extra={}){const d=device(action==='backup');if(!d)throw Error('No recovery backup is registered on this browser. Contact support.');const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch('/api/pin-recovery/customer',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+d.secret},body:JSON.stringify({action,profile_id:d.id,...extra}),cache:'no-store',signal:controller.signal})}finally{clearTimeout(timeout)}let body;try{body=await response.json()}catch{throw Error('PIN recovery is unavailable. Please contact support.')}if(!response.ok)throw Error(body.error||'PIN recovery failed.');return body}
async function syncRecovery(){if(!active)return;try{await recoveryAPI('backup',{records:{...data}});localStorage.setItem('ddPinRecoveryBackedUp','1')}catch(e){document.dispatchEvent(new CustomEvent('dd-vault-error',{detail:'Your PIN is saved on this device, but staff-assisted recovery backup could not be updated. '+e.message}))}}
async function installRecovered(pin,records){
 if(!/^\d{6}$/.test(pin))throw Error('Use exactly six digits.');
 const salt=crypto.getRandomValues(new Uint8Array(16)),next=await derive(pin,salt),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},next,enc.encode(JSON.stringify(records)));
 // Replace the previous encrypted vault only after a complete new record is ready.
 localStorage.setItem(KEY,JSON.stringify({v:1,salt:b64(salt),iv:b64(iv),ciphertext:b64(ciphertext),failed:0,until:0}));
 data=records;key=next;active=true;localStorage.setItem(PUBLIC,JSON.stringify(publicSummary()));for(const name of PRIVATE)localStorage.removeItem(name);await syncRecovery();watch();return storage;
}
async function recover(requestId,code){if(!recoveredBuffer){const result=await recoveryAPI('redeem',{request_id:requestId,code});recoveredBuffer=result.records}const result=await promptPIN({recoveryRecords:recoveredBuffer});if(result)recoveredBuffer=null;return !!result}
window.DDPrivateVault={storage,has,summary,prompt:options=>promptPIN({allowSkip:options?.allowSkip,purpose:options?.purpose}),lock,flush:()=>pending,isUnlocked:()=>active,recoveryRequest:()=>recoveryAPI('request'),recoveryStatus:()=>recoveryAPI('status'),recover};

// Approval is checked with this browser's secret; no chat code is required.
function installResetStatus(){
 if(!/\/account(?:\.html)?\/?$/.test(location.pathname)||!device())return;
 const host=document.querySelector('main');if(!host)return;
 const panel=document.createElement('section');panel.className='panel dd-recovery-status';panel.hidden=true;panel.setAttribute('aria-live','polite');
 const text=document.createElement('p'),reset=document.createElement('button');reset.type='button';reset.className='primary';reset.textContent='Reset PIN';reset.hidden=true;panel.append(text,reset);host.prepend(panel);
 let requestId,busy=false;
 reset.onclick=async()=>{if(busy)return;busy=true;reset.disabled=true;try{const ok=await recover(requestId);text.textContent=ok?'Your new PIN is saved.': 'PIN creation was cancelled. Tap Reset PIN to continue.';if(ok){reset.hidden=true;location.reload()}}catch(e){text.textContent=e.message}finally{busy=false;reset.disabled=false}};
 async function check(){if(busy||document.hidden)return;try{const r=(await recoveryAPI('status')).request;if(!r){panel.hidden=true;return}requestId=r.id;const approved=r.status==='approved'&&r.expires_at>Date.now()/1000;panel.hidden=!['pending','approved'].includes(r.status);reset.hidden=!approved&&!recoveredBuffer;text.textContent=approved?'Identity verified. Your PIN reset is approved.':r.status==='pending'?'PIN recovery: customer support is reviewing your identity.':'Your reset approval expired. Contact customer support again.';}catch{}}
 check();setInterval(check,15000);window.addEventListener('focus',check);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installResetStatus);else installResetStatus();
})();
