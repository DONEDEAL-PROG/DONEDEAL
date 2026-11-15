
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const API = {
    me: '/api/staff/me',
    presence: '/api/staff/live-presence',
    queue: '/api/staff/live-queue',
    support: '/api/staff/support'
  };

  const POLL_MS = 12000;
  const HEARTBEAT_MS = 25000;

  let staff = null;
  let availability = 'offline';

  let previousWaiting = null;
  let refreshing = false;
  let saving = false;
  let accepting = false;

  let soundEnabled = false;
  let audioContext = null;

  const json = (method, data) => ({
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  async function api(url, options = {}) {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error('API unavailable');
    }

    if (!response.ok) {
      throw new Error(
        data.error || 'Request failed'
      );
    }

    return data;
  }

  function message(text) {
    const el = $('availabilityNotice');

    if (el) {
      el.textContent = text;
    }
  }

  function updateStatus(state) {
    availability = state;

    const pill = $('agentStatus');
    const text = $('agentStatusText');
    const select = $('availability');

    if (pill) {
      pill.dataset.state = state;
    }

    if (text) {
      text.textContent =
        state === 'available'
          ? 'Available'
          : state === 'busy'
          ? 'Busy'
          : 'Offline';
    }

    if (select && !saving) {
      select.value = state;
    }
  }

  function setPanels(visible) {
    for (const id of [
      'liveAgentPanel',
      'liveStats',
      'liveQueuePanel'
    ]) {
      const el = $(id);

      if (el) {
        el.hidden = !visible;
      }
    }
  }

  function setUnreadCount(count) {
    const safeCount = Math.max(
      0,
      Number(count) || 0
    );

    const counter = $('unreadCount');
    const badge = $('unreadBadge');

    if (counter) {
      counter.textContent = String(safeCount);
    }

    if (badge) {
      badge.textContent = String(safeCount);
      badge.hidden = safeCount === 0;
    }
  }

  async function loadUnread() {
    if (!staff) {
      return;
    }

    const data = await api(API.support);

    const tickets = Array.isArray(data.tickets)
      ? data.tickets
      : [];

    const total = tickets.reduce(
      (sum, ticket) => {
        return sum + Math.max(
          0,
          Number(ticket.unread_count) || 0
        );
      },
      0
    );

    setUnreadCount(total);
  }

  function playNotification() {
    if (!soundEnabled || !audioContext) {
      return;
    }

    try {
      if (audioContext.state !== 'running') {
        return;
      }

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 780;

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        audioContext.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.22
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.23
      );

    } catch (error) {
      console.warn(
        'Notification sound unavailable',
        error
      );
    }
  }

  async function loadPresence() {
    const data = await api(API.presence);

    updateStatus(
      data.availability || 'offline'
    );

    return data;
  }

  async function savePresence(state, quiet = false) {
    if (!staff || saving) {
      return;
    }

    saving = true;

    const button = $('saveAvailability');

    if (button) {
      button.disabled = true;
    }

    try {
      const data = await api(
        API.presence,
        json('POST', {
          availability: state
        })
      );

      updateStatus(data.availability);

      const select = $('availability');

      if (select) {
        select.value = data.availability;
      }

      if (!quiet) {
        message(
          'Your status is now ' +
          data.availability + '.'
        );
      }

    } catch (error) {
      message(error.message);

      try {
        await loadPresence();
      } catch {}

    } finally {
      saving = false;

      if (button) {
        button.disabled = false;
      }
    }
  }

  function renderQueue(items) {
    const container = $('liveQueue');

    if (!container) {
      return;
    }

    container.replaceChildren();

    if (!items.length) {
      const empty = document.createElement('p');

      empty.className = 'empty-state';

      empty.textContent =
        'No customers waiting for a live agent.';

      container.append(empty);
      return;
    }

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'queue-item';

      const info = document.createElement('div');
      info.className = 'queue-info';

      const title = document.createElement('strong');

      title.textContent =
        item.subject || 'Live Support';

      const details = document.createElement('small');

      details.textContent = [
        item.guest_name || 'Customer',
        'Waiting since ' + item.joined_at
      ].join(' · ');

      info.append(title, details);

      const button = document.createElement('button');

      button.type = 'button';
      button.textContent = 'Accept Chat';

      button.disabled =
        availability !== 'available' ||
        accepting;

      button.addEventListener(
        'click',
        async () => {
          await acceptChat(
            item.ticket_id,
            button
          );
        }
      );

      row.append(info, button);
      container.append(row);
    }
  }

  async function loadQueue() {
    const data = await api(API.queue); 
    // Update My Active Chats counter
const activeCount = Number(data.my_active_count ?? 0);

const myChatsCounter = document.getElementById('myChatsCount');

if (myChatsCounter) {
  myChatsCounter.textContent = String(activeCount);
}

    const waiting = Array.isArray(data.waiting)
      ? data.waiting
      : [];

    const count = waiting.length;

    if ($('waitingCount')) {
      $('waitingCount').textContent =
        String(count);
    }

    if ($('queueBadge')) {
      $('queueBadge').textContent =
        count + ' waiting';
    }

    renderQueue(waiting);

    const ids = new Set(
      waiting.map(item => item.ticket_id)
    );

    if (previousWaiting !== null) {
      const newChats = [...ids].filter(
        id => !previousWaiting.has(id)
      );

      if (newChats.length > 0) {
        playNotification();
      }
    }

    previousWaiting = ids;
  }

  async function acceptChat(ticketId, button) {
    if (
      accepting ||
      availability !== 'available'
    ) {
      message(
        'Set your status to Available first.'
      );
      return;
    }

    accepting = true;

    button.disabled = true;
    button.textContent = 'Accepting...';

    try {
      const data = await api(
        API.queue,
        json('POST', {
          action: 'accept',
          ticket_id: ticketId
        })
      );

      message('Chat accepted successfully.');

      await loadQueue();

      const reload = $('reload');

      if (reload) {
        reload.click();
      }

      if (data.ticket_id) {
        message(
          'Chat accepted! Select the customer ' +
          'conversation under Support Tickets.'
        );
      }

    } catch (error) {
      message(error.message);

      try {
        await loadQueue();
      } catch {}

    } finally {
      accepting = false;

      button.disabled = false;
      button.textContent = 'Accept Chat';
    }
  }

  async function refresh() {
    if (
      !staff ||
      refreshing ||
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    refreshing = true;

    try {
      const results = await Promise.allSettled([
        loadQueue(),
        loadUnread()
      ]);

      for (const item of results) {
        if (item.status === 'rejected') {
          console.warn(
            'Staff dashboard refresh failed',
            item.reason
          );
        }
      }

    } finally {
      refreshing = false;
    }
  }

  async function heartbeat() {
    if (
      !staff ||
      saving ||
      availability === 'offline' ||
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    await savePresence(
      availability,
      true
    );
  }

  async function initialize() {
    try {
      const data = await api(API.me);

      if (!data.staff) {
        throw new Error('Unauthorized');
      }

      const nextStaff = data.staff;

      if (
        !Array.isArray(nextStaff.permissions) ||
        !nextStaff.permissions.includes('chat_reply')
      ) {
        staff = null;
        previousWaiting = null;

        setUnreadCount(0);
        setPanels(false);

        return;
      }

      const changed =
        !staff ||
        staff.id !== nextStaff.id;

      staff = nextStaff;

      setPanels(true);

      if (changed) {
        previousWaiting = null;

        await loadPresence();
        await refresh();
      }

    } catch {
      staff = null;
      previousWaiting = null;

      setUnreadCount(0);
      setPanels(false);
    }
  }

  function bindEvents() {
    $('saveAvailability')?.addEventListener(
      'click',
      async () => {
        const state = $('availability').value;

        await savePresence(state);
        await refresh();
      }
    );

    $('refreshLiveQueue')?.addEventListener(
      'click',
      refresh
    );

    $('notificationSound')?.addEventListener(
      'change',
      async event => {
        soundEnabled = event.target.checked;

        if (!soundEnabled) {
          return;
        }

        try {
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (!AudioContextClass) {
            throw new Error(
              'Audio not supported'
            );
          }

          audioContext ||= new AudioContextClass();

          await audioContext.resume();

        } catch {
          soundEnabled = false;
          event.target.checked = false;

          message(
            'Notification sound is unavailable.'
          );
        }
      }
    );

    $('loginForm')?.addEventListener(
      'submit',
      () => {
        setTimeout(initialize, 1200);
      }
    );

    $('logout')?.addEventListener(
      'click',
      () => {
        staff = null;
        previousWaiting = null;

        updateStatus('offline');
        setUnreadCount(0);
        setPanels(false);
      }
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (
          document.visibilityState === 'visible'
        ) {
          initialize().then(refresh);
        }
      }
    );
  }

  bindEvents();

  initialize();

  setInterval(
    initialize,
    30000
  );

  setInterval(
    refresh,
    POLL_MS
  );

  setInterval(
    () => {
      heartbeat().catch(error => {
        console.warn(
          'Live agent heartbeat failed',
          error
        );
      });
    },
    HEARTBEAT_MS
  );

})();
