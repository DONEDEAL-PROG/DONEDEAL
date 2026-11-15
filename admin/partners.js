
const $ = id => document.getElementById(id);
const money = n => '₱' + (Number(n || 0) / 100).toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

let activePartnerId = null;
let conversations = [];
let data = { partners: [], orders: [], payouts: [] };

const msg = text => {
  $('notice').textContent = text || '';
};

async function api(url, body) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });

  const raw = await response.text();
  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    throw Error('API returned HTML or invalid JSON: ' + url);
  }

  if (!response.ok) {
    throw Error(result.error || 'Request failed');
  }

  return result;
}

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function button(label, action) {
  const el = node('button', label);

  el.type = 'button';
  el.onclick = async () => {
    el.disabled = true;
    msg('');

    try {
      await action();
      await load();
      msg('Saved successfully.');
    } catch (error) {
      msg(error.message);
    } finally {
      el.disabled = false;
    }
  };

  return el;
}

function select(options, value) {
  const el = document.createElement('select');

  for (const option of options) {
    el.add(new Option(option, option));
  }

  el.value = value;
  return el;
}

function switchTab(name) {
  document.querySelectorAll('[data-tab]').forEach(tab => {
    const selected = tab.dataset.tab === name;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-current', selected ? 'page' : 'false');
  });

  document.querySelectorAll('[data-view]').forEach(view => {
    view.hidden = view.dataset.view !== name;
  });

  if (name === 'messages') {
    loadConversations();
  }
}

document.querySelectorAll('[data-tab]').forEach(tab => {
  tab.onclick = () => switchTab(tab.dataset.tab);
});

$('go-messages').onclick = () => switchTab('messages');

function renderStats() {
  $('stat-pending').textContent =
    data.partners.filter(p => p.status === 'pending').length;

  $('stat-approved').textContent =
    data.partners.filter(p => p.status === 'approved').length;

  $('stat-commissions').textContent =
    data.orders.filter(o => o.status === 'pending').length;

  $('stat-payouts').textContent =
    data.payouts.filter(p => p.status === 'requested').length;
}


function renderPartners() {
  const root = $('partners');
  root.replaceChildren();

  for (const partner of data.partners) {
    const row = node('div', null, 'entry');
    const info = node('div');
    const controls = node('div', null, 'pm-controls');

    const rate = document.createElement('input');
    const status = select(
      ['pending', 'approved', 'rejected', 'suspended'],
      partner.status
    );

    const rateLabel = node(
      'strong',
      (Number(partner.commission_bps || 0) / 100).toFixed(2) + '%'
    );

    const statusLabel = node('span', partner.status, 'tag');

    const editButton = node('button', '✎ Edit');
    const saveButton = node('button', 'Save changes');
    const cancelButton = node('button', 'Cancel');

    editButton.type = 'button';
    saveButton.type = 'button';
    cancelButton.type = 'button';

    rate.type = 'number';
    rate.min = '0';
    rate.max = '100';
    rate.step = '0.01';
    rate.value = (Number(partner.commission_bps || 0) / 100).toFixed(2);
    rate.title = 'Commission percentage';

    info.append(
      node('strong', partner.name),
      node('small', partner.email),
      node('small', partner.social_url || 'No social link'),
      node('small', 'Referral: ' + partner.referral_code)
    );

    function setEditing(editing) {
      rate.hidden = !editing;
      status.hidden = !editing;
      saveButton.hidden = !editing;
      cancelButton.hidden = !editing;

      rateLabel.hidden = editing;
      statusLabel.hidden = editing;
      editButton.hidden = editing;
    }

    editButton.onclick = () => setEditing(true);

    cancelButton.onclick = () => {
      rate.value =
        (Number(partner.commission_bps || 0) / 100).toFixed(2);
      status.value = partner.status;
      setEditing(false);
    };

    saveButton.onclick = async () => {
      const percentage = Number(rate.value);

      if (
        rate.value.trim() === '' ||
        !Number.isFinite(percentage) ||
        percentage < 0 ||
        percentage > 100
      ) {
        msg('Commission must be between 0% and 100%.');
        return;
      }

      const changes =
        percentage !== Number(partner.commission_bps || 0) / 100 ||
        status.value !== partner.status;

      if (!changes) {
        setEditing(false);
        return;
      }

      if (!confirm('Save changes to this partner account?')) {
        return;
      }

      saveButton.disabled = true;
      msg('');

      try {
        await api('/api/admin/partners', {
          action: 'partner',
          id: partner.id,
          status: status.value,
          commission_bps: Math.round(percentage * 100)
        });

        await load();
        msg('Partner account updated successfully.');
      } catch (error) {
        msg(error.message);
        saveButton.disabled = false;
      }
    };

    controls.append(
      node('small', 'Commission'),
      rateLabel,
      rate,
      statusLabel,
      status,
      editButton,
      saveButton,
      cancelButton
    );

    row.append(info, controls);
    root.append(row);

    setEditing(false);
  }

  if (!root.children.length) {
    root.append(
      node('div', 'No partner records yet.', 'pm-empty')
    );
  }
}


function renderOrders() {
  const root = $('orders');
  root.replaceChildren();

  for (const order of data.orders) {
    const row = node('div', null, 'entry');
    const info = node('div');
    const controls = node('div', null, 'pm-controls');

    info.append(
      node('strong', order.name + ' · ' + order.order_id),
      node('small',
        'Order ' + money(order.total_centavos) +
        ' · Commission ' + money(order.commission_centavos)
      ),
      node('small',
        'Payment: ' + (order.payment_status || 'unknown') +
        ' · ' + (order.paid_at || 'Not yet paid')
      )
    );

    controls.append(node('span', order.status, 'tag'));

    if (order.status === 'pending') {
      controls.append(
        button('Approve', () => api('/api/admin/partners', {
          action: 'commission',
          id: order.order_id,
          status: 'approved'
        })),
        button('Void', () => api('/api/admin/partners', {
          action: 'commission',
          id: order.order_id,
          status: 'void'
        }))
      );
    }

    row.append(info, controls);
    root.append(row);
  }

  if (!root.children.length) {
    root.append(node('div', 'No commissions yet.', 'pm-empty'));
  }
}

function renderPayouts() {
  const root = $('payouts');
  root.replaceChildren();

  for (const payout of data.payouts) {
    const row = node('div', null, 'entry');
    const info = node('div');
    const controls = node('div', null, 'pm-controls');

    info.append(
      node('strong', payout.name + ' · ' + money(payout.amount_centavos)),
      node('small', payout.method + ' · ' + payout.account),
      node('small', 'Requested ' + payout.created_at),
      node('small', payout.note || '')
    );

    controls.append(node('span', payout.status, 'tag'));

    if (payout.status === 'requested') {
      controls.append(
        button('Approve', () => api('/api/admin/partners', {
          action: 'payout',
          id: payout.id,
          status: 'approved'
        })),
        button('Reject', () => api('/api/admin/partners', {
          action: 'payout',
          id: payout.id,
          status: 'rejected'
        }))
      );
    }

    if (payout.status === 'approved') {
      controls.append(
        button('Mark paid', async () => {
          const reference = prompt('Enter actual transfer reference:');

          if (!reference?.trim()) {
            throw Error('Transfer reference is required.');
          }

          await api('/api/admin/partners', {
            action: 'payout',
            id: payout.id,
            status: 'paid',
            note: reference.trim()
          });
        })
      );
    }

    row.append(info, controls);
    root.append(row);
  }

  if (!root.children.length) {
    root.append(node('div', 'No payout requests yet.', 'pm-empty'));
  }
}

async function load() {
  try {
    data = await api('/api/admin/partners');

    $('signin').hidden = true;
    $('content').hidden = false;

    renderStats();
    renderPartners();
    renderOrders();
    renderPayouts();

    await loadConversations();
  } catch (error) {
    msg(error.message);
  }
}

function updateUnread() {
  const total = conversations.reduce(
    (sum, conversation) => sum + Number(conversation.unread_count || 0),
    0
  );

  $('message-badge').textContent = total > 99 ? '99+' : String(total);
  $('message-badge').hidden = total === 0;
  $('stat-unread').textContent = total;
}

function renderConversations() {
  const root = $('conversations');
  const query = $('message-search').value.trim().toLowerCase();

  root.replaceChildren();

  const filtered = conversations.filter(conversation =>
    String(conversation.name || '').toLowerCase().includes(query) ||
    String(conversation.email || '').toLowerCase().includes(query)
  );

  for (const conversation of filtered) {
    const row = node('button', null, 'pm-conversation');
    const avatar = node(
      'span',
      String(conversation.name || '?').slice(0, 1).toUpperCase(),
      'pm-avatar'
    );
    const info = node('span', null, 'pm-conversation-info');

    row.type = 'button';
    row.classList.toggle('active', conversation.id === activePartnerId);

    info.append(
      node('strong', conversation.name),
      node('small', conversation.email),
      node('small', conversation.last_message || '')
    );

    row.append(avatar, info);

    const unread = Number(conversation.unread_count || 0);

    if (unread > 0) {
      row.append(node('span', unread > 99 ? '99+' : String(unread), 'pm-count'));
    }

    row.onclick = () => openConversation(conversation.id);
    root.append(row);
  }

  if (!root.children.length) {
    root.append(node('div', 'No matching conversations.', 'pm-empty'));
  }
}

async function loadConversations() {
  try {
    const result = await api('/api/admin/partner-messages');

    conversations = (result.conversations || []).sort((a, b) =>
      String(b.last_message || '').localeCompare(String(a.last_message || ''))
    );

    renderConversations();
    updateUnread();
  } catch (error) {
    $('conversations').replaceChildren(
      node('div', error.message, 'pm-empty')
    );
  }
}

async function openConversation(id) {
  try {
    const result = await api(
      '/api/admin/partner-messages?partner_id=' + encodeURIComponent(id)
    );

    activePartnerId = id;

    $('admin-thread-title').textContent = result.partner.name;
    $('thread-subtitle').textContent = result.partner.email;
    $('admin-reply').hidden = false;

    const root = $('admin-thread');
    root.replaceChildren();

    for (const message of result.messages || []) {
      const bubble = node(
        'div',
        null,
        'pm-bubble ' + (message.sender === 'admin' ? 'admin' : 'partner')
      );

      bubble.append(
        node('p', message.body),
        node('small', message.created_at || '')
      );

      root.append(bubble);
    }

    if (!root.children.length) {
      root.append(node('div', 'No messages yet.', 'pm-empty'));
    }

    root.scrollTop = root.scrollHeight;

    try {
      await api('/api/admin/partner-messages', {
        action: 'read',
        partner_id: id
      });
    } catch (error) {
      msg('Conversation opened, but unread status was not saved: ' + error.message);
    }

    await loadConversations();
  } catch (error) {
    msg(error.message);
  }
}

$('message-search').addEventListener('input', renderConversations);

$('admin-reply').onsubmit = async event => {
  event.preventDefault();

  if (!activePartnerId) return;

  const form = event.currentTarget;
  const sendButton = form.querySelector('button');
  const message = new FormData(form).get('message');

  sendButton.disabled = true;

  try {
    await api('/api/admin/partner-messages', {
      partner_id: activePartnerId,
      message
    });

    form.reset();
    await openConversation(activePartnerId);
    msg('Reply sent.');
  } catch (error) {
    msg(error.message);
  } finally {
    sendButton.disabled = false;
  }
};

$('login').onsubmit = async event => {
  event.preventDefault();

  try {
    await api('/api/admin/login', {
      password: new FormData(event.currentTarget).get('password')
    });

    event.currentTarget.reset();
    await load();
  } catch (error) {
    msg(error.message);
  }
};

load();
