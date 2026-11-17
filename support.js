
(()=>{
'use strict';

const $=id=>document.getElementById(id);

const storageKey='dd_support_guest_v1';
const historyKey='dd_support_guest_history_v1';

let ticket=null;
let mode='ticket';
let busy=false;
let checkingLive=false;
let checkingAvailability=false;
let lastAvailability=null;

const note=message=>{
  $('notice').textContent=message;
};

async function json(url,options={}){
  const response=await fetch(url,{
    cache:'no-store',
    ...options
  });

  let data;

  try{
    data=await response.json();
  }catch{
    throw Error('Support service unavailable');
  }

  if(!response.ok){
    throw Error(data.error||'Request failed');
  }

  return data;
}

function validSavedTicket(item){
  return !!(
    item&&
    typeof item.id==='string'&&
    /^SUP-[0-9a-f-]{36}$/i.test(item.id)&&
    typeof item.access==='string'&&
    item.access.length>0
  );
}

function normalizeTicket(item){
  return {
    id:item.id,
    access:item.access,
    mode:item.mode==='live'?'live':'ticket',
    subject:typeof item.subject==='string'
      ?item.subject.slice(0,140)
      :'',
    savedAt:typeof item.savedAt==='string'
      ?item.savedAt
      :new Date().toISOString()
  };
}

function readHistory(){
  try{
    const raw=JSON.parse(
      localStorage.getItem(historyKey)||'[]'
    );

    if(!Array.isArray(raw))return [];

    const seen=new Set();
    const items=[];

    for(const item of raw){
      if(!validSavedTicket(item))continue;
      if(seen.has(item.id))continue;

      seen.add(item.id);
      items.push(normalizeTicket(item));

      if(items.length>=20)break;
    }

    return items;
  }catch{
    return [];
  }
}

function saveTicket(){
  try{
    if(ticket){
      localStorage.setItem(
        storageKey,
        JSON.stringify(ticket)
      );
    }else{
      localStorage.removeItem(storageKey);
    }
  }catch{}
}

function saveHistory(item){
  if(!validSavedTicket(item))return;

  const saved=normalizeTicket(item);

  const updated=[
    saved,
    ...readHistory().filter(
      old=>old.id!==saved.id
    )
  ].slice(0,20);

  try{
    localStorage.setItem(
      historyKey,
      JSON.stringify(updated)
    );
  }catch{}

  renderHistory();
}

function renderHistory(){
  const container=$('conversationHistory');
  const count=$('conversationCount');

  if(!container||!count)return;

  const history=readHistory();

  // Include the current ticket even if it was
  // created before history storage existed.
  if(
    validSavedTicket(ticket)&&
    !history.some(item=>item.id===ticket.id)
  ){
    history.unshift(normalizeTicket(ticket));
  }

  count.textContent=
    String(history.length);

  container.replaceChildren();

  if(history.length===0){
    const empty=document.createElement('div');
    empty.className='info-box';

    const title=document.createElement('strong');
    title.textContent='No saved conversations yet';

    const description=document.createElement('p');
    description.textContent=
      'Your support conversations will appear here after you create one.';

    empty.append(title,description);
    container.append(empty);
    return;
  }

  for(const item of history){
    const card=document.createElement('div');
    card.className='history-item';

    const details=document.createElement('div');
    details.className='history-details';

    const title=document.createElement('strong');

    const type=item.mode==='live'
      ?'💬 Live Agent'
      :'🎫 Support Ticket';

    title.textContent=item.subject|| (item.mode==='live'?'Live support':'Support ticket');

    const reference=document.createElement('small');
    reference.textContent=item.mode==='live'?'Live support conversation':'Support ticket';

    const date=document.createElement('small');

    const parsed=new Date(item.savedAt);

    date.textContent=Number.isNaN(parsed.getTime())
      ?'Saved'
      :parsed.toLocaleDateString('en-PH',{month:'short',day:'numeric'});

    details.append(title,reference,date);

    const button=document.createElement('button');
    button.type='button';
    button.className='history-open';

    const isCurrent=ticket?.id===item.id;

    button.textContent='';button.setAttribute('aria-label','Open '+title.textContent);card.classList.toggle('current',isCurrent);

    button.addEventListener('click',()=>{
      document.body.classList.add('dd-support-chat');if(isCurrent){show();return}openSavedConversation(item);
    });

    card.append(details,button);
    container.append(card);
  }
}

function setMode(next){
  mode=next==='live'?'live':'ticket';

  const live=mode==='live';

  $('chooseLive').classList.toggle(
    'active',
    live
  );

  $('chooseTicket').classList.toggle(
    'active',
    !live
  );

  $('chooseLive').setAttribute(
    'aria-pressed',
    String(live)
  );

  $('chooseTicket').setAttribute(
    'aria-pressed',
    String(!live)
  );

  $('startTitle').textContent=live
    ?'Chat with a Live Agent'
    :'Create a Support Ticket';

  $('startDescription').textContent=live
    ?'Tell us how we can help. Your conversation will join the Live Agent waiting queue.'
    :'Describe your concern and our support team can reply here.';

  $('startModeLabel').textContent=live
    ?'Live Agent'
    :'Ticket Support';

  $('startModeLabel').className=live
    ?'status'
    :'status ended';

  $('startSubmit').textContent=live
    ?'Join Live Agent Queue'
    :'Create Support Ticket';

  $('liveFormNotice').classList.toggle(
    'hidden',
    !live
  );
}

function show(){
  const hasTicket=!!ticket;document.body.classList.toggle('dd-support-chat',hasTicket);
  const isLive=hasTicket&&ticket.mode==='live';

  $('supportChoices').classList.toggle(
    'hidden',
    hasTicket
  );

  $('start').classList.toggle(
    'hidden',
    hasTicket
  );

  $('conversation').classList.toggle(
    'hidden',
    !hasTicket
  );

  $('liveWaitingPanel').classList.toggle(
    'hidden',
    !isLive
  );

  $('conversationMode').textContent=isLive
    ?'Live Agent'
    :'Support Ticket';

  $('conversationMode').className=isLive
    ?'status'
    :'status ended';

  renderHistory();
}

function updateBusyNotice(){
  const waiting=
    ticket?.mode==='live'&&
    ticket.liveState==='waiting';

  const noAgents=
    lastAvailability?.available===false;

  $('agentsBusyNotice').classList.toggle(
    'hidden',
    !(waiting&&noAgents)
  );
}

function renderLiveState(state,message){
  if(!ticket||ticket.mode!=='live')return;

  ticket.liveState=state;

  const badge=$('liveQueueStatus');
  const info=$('liveQueueMessage');

  badge.className='status';

  if(state==='accepted'){
    badge.textContent='Agent Connected';
    badge.classList.add('accepted');

    info.textContent=message||
      'A support agent has accepted your chat.';

    $('waitForAgent').hidden=true;
    $('createTicketInstead').hidden=true;

  }else if(state==='waiting'){
    badge.textContent='Waiting for Agent';

    info.textContent=message||
      'Waiting for an available support agent.';

    $('waitForAgent').hidden=false;
    $('createTicketInstead').hidden=false;

  }else{
    badge.textContent='Chat '+(
      state==='ended'?'Ended':
      state==='cancelled'?'Cancelled':
      'Unavailable'
    );

    badge.classList.add('ended');

    info.textContent=message||
      'This live chat is no longer in the queue.';

    $('waitForAgent').hidden=true;
    $('createTicketInstead').hidden=false;
  }

  updateBusyNotice();
}

async function refreshAvailability(){
  if(checkingAvailability)return;

  checkingAvailability=true;

  try{
    const data=await json(
      '/api/support/availability'
    );

    if(typeof data.available!=='boolean'){
      throw Error('Invalid availability response');
    }

    lastAvailability={
      available:data.available,
      status:data.status
    };

  }catch(error){
    lastAvailability=null;

    console.warn(
      'Availability check failed:',
      error.message
    );
  }finally{
    checkingAvailability=false;
    updateBusyNotice();
  }
}

async function refreshLive(){
  if(
    !ticket||
    ticket.mode!=='live'||
    checkingLive
  )return;

  const active=ticket;
  checkingLive=true;

  try{
    const data=await json(
      '/api/support/live?id='+
      encodeURIComponent(active.id),
      {
        headers:{
          'X-Support-Access':active.access
        }
      }
    );

    if(!ticket||ticket.id!==active.id)return;

    renderLiveState(
      data.state,
      data.message
    );

  }catch(error){
    if(ticket?.id===active.id){
      $('liveQueueMessage').textContent=
        'Unable to check live status: '+
        error.message;
    }
  }finally{
    checkingLive=false;
  }
}

async function refresh(){
  if(!ticket||busy)return;

  const active=ticket;
  busy=true;

  try{
    const data=await json(
      '/api/support/conversation?id='+
      encodeURIComponent(active.id),
      {
        headers:{
          'X-Support-Access':active.access
        }
      }
    );

    if(!ticket||ticket.id!==active.id)return;

    $('ticketInfo').textContent=
      data.ticket.id+' · '+
      data.ticket.subject+' · '+
      data.ticket.status;

    if(
      data.ticket.subject&&
      ticket.subject!==data.ticket.subject
    ){
      ticket.subject=data.ticket.subject;
      saveTicket();
      saveHistory(ticket);
    }

    const list=$('messages');

    const nearBottom=
      list.scrollHeight-
      list.scrollTop-
      list.clientHeight<70;

    list.replaceChildren();

    for(const message of data.messages){
      const div=document.createElement('div');

      div.className='bubble'+(
        message.sender==='guest'
          ?' mine'
          :''
      );

      const text=document.createElement('div');
      text.textContent=message.body;

      const meta=document.createElement('small');

      meta.textContent=(
        message.sender==='guest'
          ?'You'
          :'DONEDEAL Support'
      )+' · '+message.created_at;

      div.append(text,meta);
      list.append(div);
    }

    if(nearBottom){
      list.scrollTop=list.scrollHeight;
    }

    $('send').classList.toggle(
      'hidden',
      data.ticket.status==='closed'
    );

  }catch(error){
    if(ticket?.id===active.id){
      note(error.message);
    }
  }finally{
    busy=false;
  }
}

async function refreshAll(){
  if(!ticket)return;

  await Promise.all([
    refresh(),
    ticket.mode==='live'
      ?refreshLive()
      :Promise.resolve()
  ]);
}

function openSavedConversation(item){
  if(!validSavedTicket(item))return;

  if(ticket){
    saveHistory(ticket);
  }

  ticket=normalizeTicket(item);

  lastAvailability=null;

  $('message').value='';
  $('messages').replaceChildren();
  $('ticketInfo').textContent='Loading conversation...';

  saveTicket();
  saveHistory(ticket);

  setMode(ticket.mode);
  show();

  if(ticket.mode==='live'){
    renderLiveState(
      'waiting',
      'Checking your Live Agent status...'
    );

    refreshAvailability();
  }

  note('Opening saved conversation...');

  refreshAll().then(()=>{
    if(ticket?.id===item.id){
      note('');
    }
  });

  $('conversation').scrollIntoView({
    behavior:'smooth',
    block:'start'
  });
}

function startNewConversation(nextMode){
  if(ticket){
    saveHistory(ticket);
  }

  ticket=null;
  lastAvailability=null;

  saveTicket();

  $('message').value='';
  $('initial').value='';

  setMode(nextMode||'ticket');
  show();
  note('');

  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
}

$('chooseLive').addEventListener('click',()=>{
  setMode('live');
  note('');
});

$('chooseTicket').addEventListener('click',()=>{
  setMode('ticket');
  note('');
});

$('newTicket').addEventListener(
  'submit',
  async event=>{
    event.preventDefault();

    const button=$('startSubmit');
    button.disabled=true;
    note('');

    const selectedMode=mode;

    const endpoint=selectedMode==='live'
      ?'/api/support/live'
      :'/api/support/tickets';

    const payload={
      name:$('name').value.trim(),
      email:$('email').value.trim(),
      subject:$('subject').value.trim(),
      message:$('initial').value.trim()
    };

    if(selectedMode==='live'){
      payload.phone=$('phone').value.trim();
    }

    try{
      const data=await json(endpoint,{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify(payload)
      });

      ticket={
        id:data.id,
        access:data.access,
        mode:selectedMode,
        subject:payload.subject,
        savedAt:new Date().toISOString()
      };

      saveTicket();
      saveHistory(ticket);
      show();

      if(selectedMode==='live'){
        renderLiveState(
          data.state||'waiting',
          data.message
        );
      }

      await Promise.all([
        refreshAll(),
        selectedMode==='live'
          ?refreshAvailability()
          :Promise.resolve()
      ]);

      note(selectedMode==='live'
        ?'Live Agent request created. Keep this page open while waiting.'
        :'Ticket created. Save your ticket reference.'
      );

    }catch(error){
      note(error.message);
    }finally{
      button.disabled=false;
    }
  }
);

$('send').addEventListener(
  'submit',
  async event=>{
    event.preventDefault();

    if(!ticket)return;

    const active=ticket;

    const button=event.target.querySelector(
      'button'
    );

    button.disabled=true;
    note('');

    try{
      await json('/api/support/conversation',{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          id:active.id,
          access:active.access,
          message:$('message').value
        })
      });

      $('message').value='';
      await refreshAll();

    }catch(error){
      note(error.message);
    }finally{
      button.disabled=false;
    }
  }
);

$('waitForAgent').addEventListener(
  'click',
  async()=>{
    note('Checking your Live Agent status...');

    await Promise.all([
      refreshLive(),
      refreshAvailability()
    ]);

    note('');
  }
);

$('createTicketInstead').addEventListener(
  'click',
  ()=>{
    const proceed=window.confirm(
      'Create a separate support ticket? '+
      'Your Live Agent conversation will remain open '+
      'and its access will be saved in this browser.'
    );

    if(!proceed)return;

    startNewConversation('ticket');
  }
);

$('newConversation').addEventListener(
  'click',
  ()=>{
    const proceed=window.confirm(
      'Start another conversation? '+
      'Your current conversation access will be saved '+
      'in this browser.'
    );

    if(!proceed)return;

    startNewConversation('ticket');
  }
);

const embedded=new URLSearchParams(location.search).get('widget')==='1';
if(embedded)document.documentElement.classList.add('dd-support-embedded');
function dock(action){try{if(action==='close')sessionStorage.removeItem('ddSupportDock');else sessionStorage.setItem('ddSupportDock','minimized')}catch{}if(embedded){parent.postMessage({type:'dd-support-dock',action},location.origin)}else{document.body.classList.remove('dd-support-chat');window.dispatchEvent(new CustomEvent('dd-support-dock',{detail:action}))}}
$('minimizeSupport').onclick=()=>dock('minimize');$('closeSupport').onclick=()=>dock('close');
$('backToInbox').onclick=()=>{document.body.classList.remove('dd-support-chat');$('myConversationsPanel').scrollIntoView({block:'start'});};
document.body.classList.add('dd-support-premium');
$('message').addEventListener('input',()=>{const field=$('message');field.style.height='43px';field.style.height=Math.min(110,Math.max(43,field.scrollHeight))+'px';});
const inboxActions=document.createElement('div');inboxActions.className='dd-support-inbox-actions';
for(const [label,next] of [['＋ New ticket','ticket'],['Live support','live']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{startNewConversation(next);document.body.classList.remove('dd-support-chat');$('start').scrollIntoView({block:'start',behavior:'smooth'})};inboxActions.append(b)}
$('myConversationsPanel').before(inboxActions);
// Restore current conversation.
try{
  const saved=JSON.parse(
    localStorage.getItem(storageKey)||'null'
  );

  if(validSavedTicket(saved)){
    ticket=normalizeTicket(saved);
  }
}catch{}

setMode(ticket?.mode||'ticket');
show();

if(ticket){
  saveHistory(ticket);
  refreshAll();

  if(ticket.mode==='live'){
    renderLiveState(
      'waiting',
      'Checking your Live Agent status...'
    );

    refreshAvailability();
  }
}

// Refresh messages and queue every 5 seconds.
setInterval(()=>{
  if(
    ticket&&
    document.visibilityState==='visible'
  ){
    refreshAll();
  }
},5000);

// Refresh agent availability every 15 seconds.
setInterval(()=>{
  if(
    ticket?.mode==='live'&&
    document.visibilityState==='visible'
  ){
    refreshAvailability();
  }
},15000);

document.addEventListener(
  'visibilitychange',
  ()=>{
    if(document.visibilityState!=='visible'){
      return;
    }

    if(ticket){
      refreshAll();

      if(ticket.mode==='live'){
        refreshAvailability();
      }
    }
  }
);

// A recovery link opens a fresh, unsent ticket draft; existing conversations stay in history.
(function prefillPinRecovery(){
 const params=new URLSearchParams(location.search);if(params.get('intent')!=='pin-recovery')return;
 startNewConversation('ticket');
 const reference=params.get('recovery_ref')||'';
 const validReference=/^[0-9a-f-]{36}$/i.test(reference)?reference:'';
 $('subject').value='Website Concern';
 $('initial').value='PIN RECOVERY REQUEST\n\nHello Done Deal Customer Support, I forgot my 6-digit customer PIN and would like assistance with a staff-approved reset.\n\n'+(validReference?'Recovery request reference: '+validReference+'\n\n':'A recovery reference is not available yet. Please help me check whether this browser has a registered recovery backup.\n\n')+'Please verify my identity through my previously registered contact details before approving recovery. I understand I should not share my PIN or password in this ticket.';
 try{const summary=JSON.parse(localStorage.getItem('ddPrivateSummaryV1')||'{}');if(!$('name').value&&typeof summary.name==='string')$('name').value=summary.name.slice(0,120)}catch{}
 const banner=document.createElement('div');banner.className='panel';banner.setAttribute('role','status');const title=document.createElement('strong');title.textContent='PIN recovery message prepared';const text=document.createElement('p');text.textContent='Review the message, enter your contact email, and select Submit to send your support ticket. Your PIN has not been reset.';const back=document.createElement('a');back.href='/pin-recovery.html';back.textContent='View recovery request';banner.append(title,text,back);$('start').before(banner);
 note('Your PIN recovery ticket is ready to review. Nothing has been sent yet.');
 $('start').scrollIntoView({behavior:'smooth',block:'start'});
})();

})();
