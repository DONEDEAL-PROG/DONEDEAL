/* DONEDEAL — quiet opt-in sounds and lightweight shared motion */
(()=>{
'use strict';
if(window.DDSound)return;
const KEY='dd_sound_enabled_v1';
let enabled=false,ctx=null,last={};
try{enabled=localStorage.getItem(KEY)==='on'}catch{}
const icon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 5a10 10 0 0 1 0 14"/></svg>';
function play(kind){
 if(!enabled||document.hidden)return;
 const now=performance.now();
 if(now-(last[kind]||0)<260)return;
 last[kind]=now;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  if(!ctx)ctx=new AC();
  // Browser policy: never attempt to unlock audio without user interaction.
  if(ctx.state!=='running')return;
  const notes={
   cart:[[540,0,.075],[780,.09,.105]],
   wishlist:[[680,0,.09],[900,.075,.10]],
   checkout:[[510,0,.085],[690,.10,.095],[920,.21,.12]],
   success:[[620,0,.085],[830,.10,.12]],
   error:[[350,0,.09],[280,.12,.12]]
  }[kind];
  if(!notes)return;
  const t=ctx.currentTime+.008;
  notes.forEach(([freq,offset,duration])=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=kind==='error'?'triangle':'sine';
   osc.frequency.setValueAtTime(freq,t+offset);
   gain.gain.setValueAtTime(.0001,t+offset);
   gain.gain.exponentialRampToValueAtTime(.027,t+offset+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,t+offset+duration);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(t+offset);osc.stop(t+offset+duration+.015);
  });
 }catch(e){}
}
function update(){
 document.querySelectorAll('[data-dd-sound-toggle]').forEach(b=>{
  b.setAttribute('aria-pressed',String(enabled));
  b.setAttribute('aria-label',enabled?'Turn shopping sounds off':'Turn shopping sounds on');
  const label=b.querySelector('.dd-sound-label');
  if(label)label.textContent=enabled?'Sound: On':'Sound: Off';
 });
}
function toggle(){
 enabled=!enabled;
 try{localStorage.setItem(KEY,enabled?'on':'off')}catch{}
 if(enabled){
  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(AC){ctx=ctx||new AC();ctx.resume().then(()=>play('success')).catch(()=>{});}
  }catch(e){}
 }
 update();
}
window.DDSound={play,get enabled(){return enabled},toggle};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-dd-sound-toggle]');
 if(b){e.preventDefault();toggle();}
 // User gesture may unlock the audio context; never play sounds on navigation.
 if(enabled&&ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});
},true);
window.addEventListener('storage',e=>{if(e.key===KEY){enabled=e.newValue==='on';update()}});
function install(){
 if(document.querySelector('[data-dd-sound-toggle]'))return;
 const menu=document.querySelector('.dd-menu-panel .dd-menu-links');
 const btn=document.createElement('button');
 btn.type='button';btn.className='dd-sound-toggle';
 btn.dataset.ddSoundToggle='';
 btn.innerHTML=icon+'<span class="dd-sound-label"></span>';
 if(menu){
  const theme=menu.querySelector('[data-dd-theme-toggle],[data-dd-global-theme],.dd-menu-theme');
  if(theme)theme.before(btn);else menu.append(btn);
 }else{
  // Fallback for pages without the shopping sidebar.
  const header=document.querySelector('header.nav,body>header');
  if(header)header.append(btn);
 }
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();
window.addEventListener('pageshow',update);
})();
