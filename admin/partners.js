
const $ = id => document.getElementById(id);

const money = n =>
  '₱' + (Number(n || 0) / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const msg = s => {
  $('notice').textContent = s;
};

async function api(url, body) {
  const r = await fetch(url, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });

  const d = await r.json();

  if (!r.ok) {
    throw Error(d.error || 'Request failed');
  }

  return d;
}

function node(tag, txt, cls) {
  const el = document.createElement(tag);
  if (txt != null) el.textContent = txt;
  if (cls) el.className = cls;
  return el;
}

function button(label, fn) {
  const b = node('button', label);

  b.onclick = async () => {
    b.disabled = true;
    msg('');

    try {
      await fn();
      await load();
      msg('Saved');
    } catch (e) {
      msg(e.message);
    } finally {
      b.disabled = false;
    }
  };

  return b;
}

function select(options, value) {
  const s = document.createElement('select');

  for (const x of options) {
    s.add(new Option(x, x));
  }

  s.value = value;
  return s;
}

async function load() {
  let d;

  try {
    d = await api('/api/admin/partners');
  } catch (e) {
    msg(e.message);
    return;
  }

  $('signin').hidden = true;
  $('content').hidden = false;

  for (const id of ['partners', 'orders', 'payouts']) {
    $(id).replaceChildren();
  }

  for (const p of d.partners) {
    const row = node('div', null, 'entry');
    const info = node('div');
    const controls = node('div', null, 'controls');

    const rate = document.createElement('input');
    const status = select(
      ['pending', 'approved', 'rejected', 'suspended'],
      p.status
    );

    info.append(
      node('strong', p.name),
      node('small', p.email),
      node('small', p.social_url || 'No social link'),
      node('small', 'Referral: ' + p.referral_code)
    );

    rate.type = 'number';
    rate.min = 0;
    rate.max = 100;
    rate.step = 0.01;
    rate.value = (p.commission_bps / 100).toFixed(2);
    rate.title = 'Commission %';

    controls.append(
      node('small', 'Commission %'),
      rate,
      status,
      button('Save', async () => {
        const bps = Math.round(Number(rate.value) * 100);

        await api('/api/admin/partners', {
          action: 'partner',
          id: p.id,
          status: status.value,
          commission_bps: bps
        });
      })
    );

    row.append(info, controls);
    $('partners').append(row);
  }

  for (const o of d.orders) {
    const row = node('div', null, 'entry');
    const info = node('div');
    const controls = node('div', null, 'controls');

    info.append(
      node('strong', o.name + ' · ' + o.order_id),
      node(
        'small',
        'Order ' + money(o.total_centavos) +
        ' · Commission ' + money(o.commission_centavos)
      ),
      node(
        'small',
        'Payment: ' + (o.payment_status || 'unknown') +
        ' · ' + (o.paid_at ? 'Paid at ' + o.paid_at : 'Not yet paid')
      )
    );

    controls.append(node('span', o.status, 'tag'));

    if (o.status === 'pending') {
      controls.append(
        button('Approve', () =>
          api('/api/admin/partners', {
            action: 'commission',
            id: o.order_id,
            status: 'approved'
          })
        ),
        button('Void', () =>
          api('/api/admin/partners', {
            action: 'commission',
            id: o.order_id,
            status: 'void'
          })
        )
      );
    }

    row.append(info, controls);
    $('orders').append(row);
  }

  for (const p of d.payouts) {
    const row = node('div', null, 'entry');
    const info = node('div');
    const controls = node('div', null, 'controls');

    info.append(
      node('strong', p.name + ' · ' + money(p.amount_centavos)),
      node('small', p.method + ' · ' + p.account),
      node('small', 'Requested ' + p.created_at),
      node('small', p.note || '')
    );

    controls.append(node('span', p.status, 'tag'));

    if (p.status === 'requested') {
      controls.append(
        button('Approve', () =>
          api('/api/admin/partners', {
            action: 'payout',
            id: p.id,
            status: 'approved'
          })
        ),
        button('Reject', () =>
          api('/api/admin/partners', {
            action: 'payout',
            id: p.id,
            status: 'rejected'
          })
        )
      );
    }

    if (p.status === 'approved') {
      controls.append(
        button('Mark paid', async () => {
          const note = prompt('Enter actual transfer reference (required):');

          if (!note) return;

          await api('/api/admin/partners', {
            action: 'payout',
            id: p.id,
            status: 'paid',
            note
          });
        })
      );
    }

    row.append(info, controls);
    $('payouts').append(row);
  }

  for (const id of ['partners', 'orders', 'payouts']) {
    if (!$(id).children.length) {
      $(id).textContent = 'No records yet.';
    }
  }

  await loadConversations();
}

let activePartnerId = null;

async function loadConversations() {
  try {
    const d = await api('/api/admin/partner-messages');
    const el = $('conversations');

    el.replaceChildren();

    if (!d.conversations.length) {
      el.textContent = 'No partner messages yet.';
      return;
    }

    for (const c of d.conversations) {
      const row = node('div', null, 'entry');
      const info = node('div');

      info.append(
        node('strong', c.name),
        node('small', c.email),
        node(
          'small',
          c.message_count + ' messages · Last: ' + c.last_message
        )
      );

      const b = node('button', 'Open conversation');
      b.onclick = () => openConversation(c.id);

      row.append(info, b);
      el.append(row);
    }
  } catch (e) {
    $('conversations').textContent = e.message;
  }
}

async function openConversation(id) {
  try {
    activePartnerId = id;

    const d = await api(
      '/api/admin/partner-messages?partner_id=' +
      encodeURIComponent(id)
    );

    $('admin-thread-wrap').hidden = false;
    $('admin-thread-title').textContent =
      'Conversation with ' + d.partner.name;

    const el = $('admin-thread');
    el.replaceChildren();

    if (!d.messages.length) {
      el.textContent = 'No messages yet.';
    }

    for (const m of d.messages) {
      const row = node('div', null, 'entry');
      const info = node('div');

      info.append(
        node(
          'strong',
          m.sender === 'admin' ? 'DONEDEAL Admin' : 'Partner'
        ),
        node('small', m.created_at),
        node('p', m.body)
      );

      info.style.whiteSpace = 'pre-wrap';
      info.style.overflowWrap = 'anywhere';

      row.append(info);
      el.append(row);
    }

    $('admin-thread-wrap').scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  } catch (e) {
    msg(e.message);
  }
}

$('login').onsubmit = async e => {
  e.preventDefault();

  try {
    await api('/api/admin/login', {
      password: new FormData(e.target).get('password')
    });

    await load();
  } catch (err) {
    msg(err.message);
  }
};

$('admin-reply').onsubmit = async e => {
  e.preventDefault();

  if (!activePartnerId) return;

  const btn = e.target.querySelector('button');
  btn.disabled = true;

  try {
    await api('/api/admin/partner-messages', {
      partner_id: activePartnerId,
      message: new FormData(e.target).get('message')
    });

    e.target.reset();

    await openConversation(activePartnerId);
    await loadConversations();

    msg('Reply sent');
  } catch (err) {
    msg(err.message);
  } finally {
    btn.disabled = false;
  }
};

load();
