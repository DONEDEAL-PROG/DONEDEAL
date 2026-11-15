
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  let me = null;
  let current = null;
  let editing = null;

  const notice = s => {
    $('notice').textContent = s;
  };

  async function api(url, opt = {}) {
    const r = await fetch(url, {
      cache: 'no-store',
      ...opt
    });

    let d;

    try {
      d = await r.json();
    } catch {
      throw Error('API unavailable');
    }

    if (!r.ok) {
      throw Error(d.error || 'Request failed');
    }

    return d;
  }

  const payload = (method, data) => ({
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const has = p => me?.permissions?.includes(p);

  function parseJSON(value, fallback) {
    try {
      return typeof value === 'string'
        ? JSON.parse(value)
        : (value ?? fallback);
    } catch {
      return fallback;
    }
  }

  function customer(o) {
    return parseJSON(o.customer_json, {}) || {};
  }

  function money(centavos) {
    const n = Number(centavos);

    return Number.isFinite(n)
      ? new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP'
        }).format(n / 100)
      : '—';
  }

  function readable(value) {
    return String(value ?? '—')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function el(tag, className = '', value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = String(value);
    return node;
  }

  function detail(label, value) {
    const box = el('div', 'dd-detail');
    box.append(
      el('div', 'dd-detail-label', label),
      el('div', 'dd-detail-value', value ?? '—')
    );
    return box;
  }

  function installStyles() {
    if (document.getElementById('dd-order-details-style')) return;

    const style = document.createElement('style');
    style.id = 'dd-order-details-style';
    style.textContent = `
      .dd-order-details {
        display: grid;
        gap: 15px;
        margin: 14px 0 20px;
        color: inherit;
      }
      .dd-badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .dd-badge {
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 700;
        background: #343244;
        color: #f6f3fa;
      }
      .dd-status {
        background: #48354d;
        color: #ffb8da;
      }
      .dd-payment {
        background: #343b4b;
        color: #cbd8ff;
      }
      .dd-section-title {
        margin: 12px 0 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #383642;
        font-size: 15px;
        font-weight: 700;
      }
      .dd-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .dd-detail {
        min-width: 0;
        border: 1px solid #383642;
        background: #25242e;
        border-radius: 10px;
        padding: 12px;
      }
      .dd-detail-label {
        color: #aaa5b6;
        font-size: 12px;
        margin-bottom: 6px;
      }
      .dd-detail-value {
        color: #f6f3fa;
        font-size: 14px;
        font-weight: 600;
        overflow-wrap: anywhere;
      }
      .dd-items {
        border: 1px solid #383642;
        border-radius: 10px;
        overflow: hidden;
      }
      .dd-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 14px;
        border-bottom: 1px solid #383642;
      }
      .dd-item:last-child {
        border-bottom: none;
      }
      .dd-item-name {
        font-size: 14px;
        font-weight: 700;
      }
      .dd-item-meta {
        margin-top: 5px;
        color: #aaa5b6;
        font-size: 12px;
      }
      .dd-item-price {
        white-space: nowrap;
      }
      .dd-total-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 14px;
        border-radius: 10px;
        background: #34303d;
        color: #ffb8da;
        font-size: 17px;
      }
      .dd-edit-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 12px 0;
      }
      .dd-edit-actions button {
        cursor: pointer;
      }
      .dd-edit-actions [hidden] {
        display: none !important;
      }
      .dd-locked {
        opacity: .7;
        cursor: not-allowed;
      }
      @media (max-width: 600px) {
        .dd-detail-grid {
          grid-template-columns: 1fr;
        }
        .dd-item {
          flex-wrap: wrap;
        }
        .dd-total-row {
          font-size: 15px;
        }
      }
    `;

    document.head.append(style);
  }

  function renderOrder(o) {
    installStyles();

    const c = customer(o);
    const items = parseJSON(o.items_json, []);
    const root = el('div', 'dd-order-details');

    const badges = el('div', 'dd-badges');
    badges.append(
      el('span', 'dd-badge dd-status', readable(o.status)),
      el('span', 'dd-badge dd-payment', readable(o.payment_status))
    );
    root.append(badges);

    root.append(el('h3', 'dd-section-title', 'Customer Information'));

    const customerGrid = el('div', 'dd-detail-grid');
    customerGrid.append(
      detail('Customer Name', c.name || '—'),
      detail('Phone Number', c.phone || '—'),
      detail('Delivery Address', c.address || '—')
    );
    root.append(customerGrid);

    root.append(el('h3', 'dd-section-title', 'Payment & Order Information'));

    const orderGrid = el('div', 'dd-detail-grid');
    orderGrid.append(
      detail('Payment Method', readable(o.payment_method)),
      detail('Fulfillment', readable(o.fulfillment)),
      detail('Order Status', readable(o.status)),
      detail('Payment Status', readable(o.payment_status)),
      detail('Order Total', money(o.total_centavos)),
      detail(
        'Date Ordered',
        o.created_at
          ? new Date(o.created_at).toLocaleString('en-PH')
          : '—'
      )
    );
    root.append(orderGrid);

    root.append(el('h3', 'dd-section-title', 'Ordered Products'));

    const itemsBox = el('div', 'dd-items');

    if (Array.isArray(items) && items.length) {
      for (const item of items) {
        const row = el('div', 'dd-item');
        const left = el('div');

        left.append(
          el('div', 'dd-item-name', item.name || item.sku || 'Product'),
          el(
            'div',
            'dd-item-meta',
            [
              item.variant ? 'Variant: ' + item.variant : '',
              'Quantity: ' + (item.quantity ?? 1)
            ].filter(Boolean).join(' · ')
          )
        );

        const amount = item.subtotal ?? item.amount;

        row.append(
          left,
          el('strong', 'dd-item-price',
            amount == null ? '—' : money(amount))
        );

        itemsBox.append(row);
      }
    } else {
      itemsBox.append(el('p', '', 'No product details available.'));
    }

    root.append(itemsBox);

    const total = el('div', 'dd-total-row');
    total.append(
      el('strong', '', 'Order Total'),
      el('strong', '', money(o.total_centavos))
    );
    root.append(total);

    $('info').replaceChildren(root);
  }

  function button(text) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    return b;
  }

  function setVisible(node, visible) {
    node.hidden = !visible;
    node.style.display = visible ? '' : 'none';
  }

  function ensureEditControls() {
    // Reuse the existing action sections from orders.html.
    const sections = [
      {
        area: 'editArea',
        saveId: 'saveEdit',
        type: 'customer',
        fields: ['name', 'phone', 'address']
      },
      {
        area: 'paymentArea',
        saveId: 'savePayment',
        type: 'payment',
        fields: ['method']
      }
    ];

    for (const config of sections) {
      const area = $(config.area);
      const originalSave = $(config.saveId);

      if (!area || !originalSave) continue;

      const actions = el('div', 'dd-edit-actions');

      const edit = button('Edit');
      const cancel = button('Cancel');

      // Move existing Save button into the action bar.
      originalSave.parentNode.removeChild(originalSave);

      originalSave.textContent = 'Save Changes';

      actions.append(edit, originalSave, cancel);
      area.append(actions);

      function mode(enabled) {
        for (const id of config.fields) {
          const field = $(id);
          if (!field) continue;

          field.disabled = !enabled;
          field.classList.toggle('dd-locked', !enabled);
        }

        setVisible(edit, !enabled);
        setVisible(originalSave, enabled);
        setVisible(cancel, enabled);
      }

      function restore() {
        if (!current) return;

        const c = customer(current);

        if (config.type === 'customer') {
          $('name').value = c.name || '';
          $('phone').value = c.phone || '';
          $('address').value = c.address || '';
        } else {
          $('method').value = current.payment_method || 'cod';
        }
      }

      edit.addEventListener('click', () => {
        if (editing && editing !== config.type) {
          notice('Finish or cancel the current edit first.');
          return;
        }

        editing = config.type;
        mode(true);
        notice('Editing ' + config.type + ' information.');
      });

      cancel.addEventListener('click', () => {
        restore();
        editing = null;
        mode(false);
        notice('Changes cancelled.');
      });

      // Save is handled by the existing action handlers below.
      originalSave.addEventListener('click', () => {
        // Locking occurs only after a successful API response.
      });

      config.lock = () => {
        editing = null;
        mode(false);
      };

      config.reset = () => {
        restore();
        editing = null;
        mode(false);
      };

      if (!window.ddOrderEditControls) {
        window.ddOrderEditControls = {};
      }

      window.ddOrderEditControls[config.type] = config;

      mode(false);
    }
  }

  function lockEdits() {
    if (!window.ddOrderEditControls) return;

    for (const config of Object.values(window.ddOrderEditControls)) {
      config.lock();
    }
  }

  function resetEdits() {
    if (!window.ddOrderEditControls) return;

    for (const config of Object.values(window.ddOrderEditControls)) {
      config.reset();
    }
  }

  async function list() {
    try {
      const q = $('query').value.trim();

      const d = await api(
        '/api/staff/orders?q=' + encodeURIComponent(q)
      );

      $('orders').replaceChildren();

      for (const o of d.orders) {
        const b = document.createElement('button');
        b.className = 'order';

        b.textContent =
          o.id + ' · ' + o.status + ' · ' +
          (customer(o).name || 'Customer');

        b.onclick = () => open(o.id);
        $('orders').append(b);
      }

      if (!d.orders.length) {
        $('orders').textContent = 'No orders found.';
      }

    } catch (e) {
      notice(e.message);
    }
  }

  async function open(id) {
    try {
      const d = await api(
        '/api/staff/orders?id=' + encodeURIComponent(id)
      );

      current = d.order;

      const o = current;
      const c = customer(o);

      $('title').textContent = o.id;
      renderOrder(o);

      $('name').value = c.name || '';
      $('phone').value = c.phone || '';
      $('address').value = c.address || '';
      $('method').value = o.payment_method || 'cod';

      $('actions').hidden = false;

      const editable = ['pending', 'confirmed'].includes(o.status);
      const unpaid = o.payment_status === 'unpaid';

      $('editArea').hidden = !(has('orders_edit') && editable);
      $('paymentArea').hidden = !(
        has('payment_change') && editable && unpaid
      );
      $('cancelArea').hidden = !(
        has('orders_cancel') && editable && unpaid
      );
      $('refundArea').hidden = !(
        has('refund_request') && o.payment_status === 'paid'
      );

      resetEdits();

    } catch (e) {
      notice(e.message);
    }
  }

  async function change(action, extra = {}, method = 'PATCH') {
    if (!current) return;

    const reason = $('reason').value.trim();

    if (reason.length < 5) {
      notice(
        'Enter reason and customer authorization reference ' +
        '(minimum 5 characters).'
      );
      return;
    }

    const messages = {
      edit: 'Are you sure you want to save these customer details?',
      payment: 'Are you sure you want to change the payment method?',
      cancel: 'Are you sure you want to CANCEL this order? This action cannot be undone.',
      refund: 'Are you sure you want to submit this refund request for Admin review?'
    };

    if (!confirm(messages[action] || 'Are you sure?')) return;

    try {
      const d = await api(
        '/api/staff/orders',
        payload(method, {
          id: current.id,
          action,
          reason,
          ...extra
        })
      );

      $('reason').value = '';

      await open(current.id);
      await list();

      lockEdits();

      notice(
        d.message ||
        (action === 'refund'
          ? 'Refund request submitted for Admin review.'
          : 'Changes saved successfully.')
      );

    } catch (e) {
      notice(e.message);
    }
  }

  $('search').onclick = list;

  $('query').addEventListener('keydown', e => {
    if (e.key === 'Enter') list();
  });

  $('saveEdit').onclick = () => {
    if (editing !== 'customer') return;

    change('edit', {
      name: $('name').value,
      phone: $('phone').value,
      address: $('address').value
    });
  };

  $('savePayment').onclick = () => {
    if (editing !== 'payment') return;

    change('payment', {
      payment_method: $('method').value
    });
  };

  $('cancelOrder').onclick = () => change('cancel');

  $('requestRefund').onclick = () =>
    change('refund', {}, 'POST');

  ensureEditControls();

  (async () => {
    try {
      me = (await api('/api/staff/me')).staff;

      if (!has('orders_view')) {
        throw Error('Order viewing permission required');
      }

      await list();

    } catch (e) {
      notice(e.message);
    }
  })();
})();
