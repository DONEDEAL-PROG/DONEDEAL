(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const perms = [
    ['chat_reply', 'Reply to customer messages'],
    ['orders_view', 'View and track orders (Phase 3)'],
    ['payment_change', 'Change payment method (Phase 3)'],
    ['orders_cancel', 'Cancel orders (Phase 3)'],
    ['orders_edit', 'Edit customer/order details (Phase 3)'],
    ['refund_request', 'Handle refund requests (Phase 3)'],
    ['ticket_assign', 'Assign conversations']
  ];

  const notice = s => {
    $('notice').textContent = s;
  };

  async function api(options = {}) {
    const r = await fetch('/api/admin/support-staff', {
      cache: 'no-store',
      ...options
    });

    let d;

    try {
      d = await r.json();
    } catch {
      throw Error('Staff API unavailable');
    }

    if (!r.ok) {
      throw Error(d.error || 'Request failed');
    }

    return d;
  }

  async function getOverviewData(path) {
    const r = await fetch(path, {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    let d;
    try {
      d = await r.json();
    } catch {
      throw Error('Invalid API response');
    }
    if (!r.ok) throw Error(d.error || 'Unable to load data');
    return d;
  }

  function showOverviewMessage(id, message) {
    const element = $(id);
    if (element) element.textContent = message;
  }

  function philippinesDay(value) {
    if (!value) return '';
    const raw = String(value).trim();
    const normalized = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(raw)
      ? raw.replace(' ', 'T') + 'Z'
      : raw;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date);
  }

  function formatManilaTime(value) {
    if (!value) return '';
    const raw = String(value).trim();
    const normalized = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(raw)
      ? raw.replace(' ', 'T') + 'Z'
      : raw;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(date);
  }

  function listLines(containerId, entries, emptyMessage) {
    const container = $(containerId);
    if (!container) return;
    container.replaceChildren();
    if (!entries.length) {
      container.textContent = emptyMessage;
      return;
    }
    const ul = document.createElement('ul');
    for (const entry of entries) {
      const li = document.createElement('li');
      li.textContent = entry;
      ul.append(li);
    }
    container.append(ul);
  }

  async function loadOverview(staffData = null) {
    const errors = [];

    const staffResult = staffData
      ? { status: 'fulfilled', value: staffData }
      : await Promise.allSettled([api()]).then(r => r[0]);

    if (staffResult.status === 'fulfilled' &&
        Array.isArray(staffResult.value.staff)) {
      const staff = staffResult.value.staff;
      $('totalStaff').textContent = String(staff.length);
      $('activeStaff').textContent =
        String(staff.filter(s => !!s.active).length);
    } else {
      $('totalStaff').textContent = '—';
      $('activeStaff').textContent = '—';
      errors.push('staff counts');
    }

    const [refundResult, activityResult] = await Promise.allSettled([
      getOverviewData('/api/admin/staff-refunds'),
      getOverviewData('/api/admin/staff-activity?limit=200')
    ]);

    if (refundResult.status === 'fulfilled' &&
        Array.isArray(refundResult.value.requests)) {
      const requests = refundResult.value.requests;
      const pending = requests.filter(r => r.status === 'pending');
      $('pendingRefunds').textContent = String(pending.length);
      listLines(
        'refundSummary',
        pending.slice(0, 3).map(r =>
          'Order ' + (r.order_id || '—') +
          ' · ' + (r.staff_name || 'Staff') +
          ' · Pending review'
        ),
        'No pending requests in the latest 200 records.'
      );
    } else {
      $('pendingRefunds').textContent = '—';
      showOverviewMessage('refundSummary', 'Unable to load refund requests.');
      errors.push('refund requests');
    }

    if (activityResult.status === 'fulfilled' &&
        Array.isArray(activityResult.value.logs)) {
      const logs = activityResult.value.logs;
      const today = philippinesDay(new Date().toISOString());
      $('activitiesToday').textContent =
        String(logs.filter(log => philippinesDay(log.created_at) === today).length);
      listLines(
        'activitySummary',
        logs.slice(0, 4).map(log =>
          (log.staff_name || log.staff_username ||
           (log.actor_type === 'admin' ? 'Admin' : 'Staff')) +
          ' · ' + String(log.action || 'Activity').replace(/_/g, ' ') +
          (log.target_id ? ' · ' + log.target_id : '') +
          (log.created_at ? ' · ' + formatManilaTime(log.created_at) : '')
        ),
        'No staff activity records yet.'
      );
    } else {
      $('activitiesToday').textContent = '—';
      showOverviewMessage('activitySummary', 'Unable to load staff activity.');
      errors.push('activity logs');
    }

    showOverviewMessage(
      'overviewStatus',
      errors.length
        ? 'Some overview data could not load: ' + errors.join(', ') + '.'
        : 'Live data · Philippines time · Refunds and activities use the latest 200 records.'
    );
  }

  const json = (method, data) => ({
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  function checkboxes(container, values = []) {
    container.replaceChildren();

    for (const [id, label] of perms) {
      const l = document.createElement('label');
      const c = document.createElement('input');

      c.type = 'checkbox';
      c.value = id;
      c.checked = values.includes(id);

      l.append(
        c,
        document.createTextNode(' ' + label)
      );

      container.append(l);
    }
  }

  function selected(container) {
    return Array.from(
      container.querySelectorAll('input:checked'),
      x => x.value
    );
  }

  function makeButton(text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    return button;
  }

  function setVisible(element, visible) {
    element.hidden = !visible;
    element.style.display = visible ? '' : 'none';
  }

  function createStaffCard(s) {
    const card = document.createElement('section');
    card.className = 'staff';

    const h = document.createElement('h3');
    h.textContent = s.display_name + ' (@' + s.username + ')';

    const activeLabel = document.createElement('label');
    const active = document.createElement('input');

    active.type = 'checkbox';
    active.checked = !!s.active;

    activeLabel.append(
      active,
      document.createTextNode(' Active account')
    );

    const permBox = document.createElement('div');
    permBox.className = 'permissions';

    checkboxes(permBox, s.permissions);

    const passwordLabel = document.createElement('label');
    passwordLabel.textContent =
      'New password (optional, min 8 characters)';

    const password = document.createElement('input');
    password.type = 'password';
    password.minLength = 8;
    password.autocomplete = 'new-password';
    password.placeholder = 'Enter new password';

    passwordLabel.append(password);

    const actions = document.createElement('div');

    actions.style.display = 'flex';
    actions.style.flexWrap = 'wrap';
    actions.style.gap = '10px';
    actions.style.marginTop = '14px';

    const edit = makeButton('Edit');
    const save = makeButton('Save Changes');
    const cancel = makeButton('Cancel');

    actions.append(edit, save, cancel);

    const original = {
      active: !!s.active,
      permissions: [...s.permissions]
    };

    function setEditMode(enabled) {
      active.disabled = !enabled;
      password.disabled = !enabled;

      for (const checkbox of permBox.querySelectorAll('input')) {
        checkbox.disabled = !enabled;
      }

      setVisible(edit, !enabled);
      setVisible(save, enabled);
      setVisible(cancel, enabled);

      setVisible(passwordLabel, enabled);
    }

    setEditMode(false);

    edit.addEventListener('click', () => {
      setEditMode(true);
      notice('Editing ' + s.username + '.');
    });

    cancel.addEventListener('click', () => {
      active.checked = original.active;

      checkboxes(permBox, original.permissions);

      password.value = '';

      setEditMode(false);
      notice('Changes cancelled.');
    });

    save.addEventListener('click', async () => {
      save.disabled = true;
      cancel.disabled = true;

      try {
        const data = {
          id: s.id,
          active: active.checked,
          permissions: selected(permBox)
        };

        if (password.value) {
          if (password.value.length < 8) {
            throw Error(
              'Password must be at least 8 characters.'
            );
          }

          data.password = password.value;
        }

        await api(json('PATCH', data));

        original.active = data.active;
        original.permissions = [...data.permissions];

        password.value = '';

        setEditMode(false);

        notice(
          'Saved ' + s.username +
          '. Existing staff sessions revoked.'
        );
        loadOverview().catch(() => {
          showOverviewMessage('overviewStatus', 'Unable to refresh overview.');
        });

      } catch (e) {
        notice(e.message);
      } finally {
        save.disabled = false;
        cancel.disabled = false;
      }
    });

    card.append(
      h,
      activeLabel,
      permBox,
      passwordLabel,
      actions
    );

    return card;
  }

  async function load() {
    try {
      const d = await api();

      const staffList = $('staffList');
      staffList.replaceChildren();

      for (const s of d.staff) {
        staffList.append(createStaffCard(s));
      }

      if (!d.staff.length) {
        staffList.textContent = 'No staff accounts yet.';
      }

      await loadOverview(d);
    } catch (e) {
      notice(e.message);
      loadOverview().catch(() => {
        showOverviewMessage('overviewStatus', 'Unable to refresh overview.');
      });
    }
  }

  $('create').addEventListener('submit', async e => {
    e.preventDefault();

    const b = e.target.querySelector('button');
    b.disabled = true;

    try {
      await api(json('POST', {
        username: $('username').value,
        display_name: $('displayName').value,
        password: $('password').value,
        permissions: selected($('newPermissions'))
      }));

      $('create').reset();

      notice(
        'Staff account created. Share credentials securely.'
      );

      await load();

    } catch (err) {
      notice(err.message);
    } finally {
      b.disabled = false;
    }
  });

  $('refresh').addEventListener('click', load);

  checkboxes($('newPermissions'), ['chat_reply']);

  load();
})();
