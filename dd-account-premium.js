(()=>{
 const primary=document.getElementById('unlockPrivate'),button=document.getElementById('ddPremiumUnlock'),note=document.getElementById('compactNote');if(!primary||!button)return;
 button.onclick=()=>primary.click();
 // The overview never exposes private field values, even during an unlocked session.
 function sync(){button.textContent=window.DDPrivateVault?.isUnlocked()?'View private details':window.DDPrivateVault?.has()?'Unlock private details':'Set up privacy PIN';const unlocked=window.DDPrivateVault?.isUnlocked();document.querySelector('.dd-privacy-caption').textContent=unlocked?'Private details open only when you choose to view them.':'Protected with your 6-digit PIN'}
 if(note)new MutationObserver(sync).observe(note,{childList:true,characterData:true,subtree:true});sync();
})();
