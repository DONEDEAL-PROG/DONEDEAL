const $=id=>document.getElementById(id);
const notice=s=>{$('notice').textContent=s};
async function api(url,body){
 const r=await fetch(url,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed');return d;
}
async function check(){try{await api('/api/partner/dashboard');location.replace('/partner/dashboard');}catch{}}
for(const [id,url] of [['login','/api/partner/login'],['register','/api/partner/register']]){
 $(id).addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;notice('');
 try{const data=Object.fromEntries(new FormData(e.target));const r=await api(url,data);notice(r.message||'Saved successfully');
 if(id==='register')e.target.reset();else location.assign('/partner/dashboard');
 }catch(err){notice(err.message)}finally{btn.disabled=false}
 });
}
check();
