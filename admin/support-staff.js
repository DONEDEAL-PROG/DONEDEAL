
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

    // Staff name
    const h = document.createElement('h3');
    h.textContent = s.display_name + ' (@' + s.username + ')';

    // Active account
    const activeLabel = document.createElement('label');
    const active = document.createElement('input');

    active.type = 'checkbox';
    active.checked = !!s.active;

    activeLabel.append(
      active,
      document.createTextNode(' Active account')
    );

    // Permissions
    const permBox = document.createElement('div');
    permBox.className = 'permissions';

    checkboxes(permBox, s.permissions);

    // Password
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent =
      'New password (optional, min 8 characters)';

    const password = document.createElement('input');
    password.type = 'password';
    password.minLength = 8;
    password.autocomplete = 'new-password';
    password.placeholder = 'Enter new password';

    passwordLabel.append(password);

    // Buttons
    const actions = document.createElement('div');

    actions.style.display = 'flex';
    actions.style.flexWrap = 'wrap';
    actions.style.gap = '10px';
    actions.style.marginTop = '14px';

    const edit = makeButton('Edit');
    const save = makeButton('Save Changes');
    const cancel = makeButton('Cancel');

    actions.append(edit, save, cancel);

    // Store original values for Cancel
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

      // Hide password field until Edit is clicked
      setVisible(passwordLabel, enabled);
    }

    // Default: read-only
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

        // Update original values after successful save
        original.active = data.active;
        original.permissions = [...data.permissions];

        password.value = '';

        setEditMode(false);

        notice(
          'Saved ' + s.username +
          '. Existing staff sessions revoked.'
        );

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

    } catch (e) {
      notice(e.message);
    }
  }

  // Create new staff account
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
