
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

const note=msg=>{
  $('notice').textContent=msg;
};

async function json(url,opts={}){
  const response=await fetch(url,{
    cache:'no-store',
    ...opts
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
  if(!item?.id||!item?.access)return;

  try{
    const saved=JSON.parse(
      localStorage.getItem(historyKey)||'[]'
    );

    const history=Array.isArray(saved)?saved:[];

    const updated=[
      item,
      ...history.filter(t=>t.id!==item.id)
    ].slice(0,20);

    localStorage.setItem(
      historyKey,
      JSON.stringify(updated)
    );
  }catch{}
}

function setMode(next){
  mode=next==='live'?'live':'ticket';

  const live=mode==='live';

  $('chooseLive').classList.toggle('active',live);
  $('chooseTicket').classList.toggle('active',!live);

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
  const hasTicket=!!ticket;
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
}

function updateBusyNotice(){
  const panel=$('agentsBusyNotice');

  const waiting=
    ticket?.mode==='live'&&
    ticket.liveState==='waiting';

  const noAvailableAgents=
    lastAvailability?.available===false;

  panel.classList.toggle(
    'hidden',
    !(waiting&&noAvailableAgents)
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

    info.textContent=
      message||
      'A support agent has accepted your chat.';

    $('waitForAgent').hidden=true;
    $('createTicketInstead').hidden=true;

  }else if(state==='waiting'){
    badge.textContent='Waiting for Agent';

    info.textContent=
      message||
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

    info.textContent=
      message||
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

    updateBusyNotice();

  }catch(error){
    // Unknown availability must not be
    // displayed as confirmed busy.
    lastAvailability=null;
    updateBusyNotice();

    console.warn(
      'Availability check failed:',
      error.message
    );

  }finally{
    checkingAvailability=false;
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

function startNewConversation(nextMode){
  if(ticket){
    saveHistory(ticket);
  }

  ticket=null;
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
        mode:selectedMode
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

// Restore existing conversation.
try{
  const saved=JSON.parse(
    localStorage.getItem(storageKey)||'null'
  );

  if(
    saved&&
    typeof saved.id==='string'&&
    typeof saved.access==='string'
  ){
    ticket={
      id:saved.id,
      access:saved.access,
      mode:saved.mode==='live'?'live':'ticket'
    };
  }
}catch{}

setMode(ticket?.mode||'ticket');
show();

if(ticket){
  refreshAll();

  if(ticket.mode==='live'){
    refreshAvailability();
  }
}

// Conversation updates every 5 seconds.
setInterval(()=>{
  if(
    ticket&&
    document.visibilityState==='visible'
  ){
    refreshAll();
  }
},5000);

// Availability updates every 15 seconds.
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

})();
