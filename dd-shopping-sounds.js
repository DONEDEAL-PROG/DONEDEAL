/* DONEDEAL — quiet opt-in sounds and lightweight shared motion */
(()=>{
'use strict';
if(window.DDSound)return;
let enabled=true,ctx=null,last={};
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
  if(ctx.state!=='running'){ctx.resume().catch(()=>{});return;}
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
// Sounds are built in: no header/menu control is created.
function toggle(){ enabled=!enabled; }
window.DDSound={play,get enabled(){return enabled},toggle};
// Browsers require a real user gesture before audio can start.
function unlock(){
 if(!enabled)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  if(!ctx)ctx=new AC();
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 }catch(e){}
}
document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
document.addEventListener('keydown',unlock,{capture:true});
document.addEventListener('touchstart',unlock,{capture:true,passive:true});

})();
