
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  let me = null;
  let current = null;
  let editing = null;
  let saving = false;
  let openSequence = 0;

  const notice = message => {
    $('notice').textContent = message;
  };

  async function api(url, options = {}) {
    const response = await fetch(url, {
      cache: 'no-store',
      ...options
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw Error('API unavailable');
    }

    if (!response.ok) {
      throw Error(data.error || 'Request failed');
    }

    return data;
  }

  const payload = (method, data) => ({
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const has = permission =>
    Array.isArray(me?.permissions) &&
    me.permissions.includes(permission);

  function parseJSON(value, fallback) {
    try {
      return typeof value === 'string'
        ? JSON.parse(value)
        : (value ?? fallback);
    } catch {
      return fallback;
    }
  }

  function customer(order) {
    return parseJSON(order.customer_json, {}) || {};
  }

  function money(centavos) {
    const value = Number(centavos);

    if (!Number.isFinite(value)) return '—';

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value / 100);
  }

  function readable(value) {
    return String(value ?? '—')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character =>
        character.toUpperCase()
      );
  }

  function element(tag, className = '', text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text !== undefined && text !== null) {
      node.textContent = String(text);
    }

    return node;
  }

  function detail(label, value) {
    const box = element('div', 'dd-detail');

    box.append(
      element('div', 'dd-detail-label', label),
      element('div', 'dd-detail-value', value ?? '—')
    );

    return box;
  }

  function installStyles() {
    if (document.getElementById('dd-order-details-style')) {
      return;
    }

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
        flex-wrap: wrap;
        gap: 8px;
      }

      .dd-badge {
        display: inline-flex;
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
        align-items: flex-start;
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
        opacity: 0.75;
        cursor: not-allowed;
      }

      .dd-inline-message {
        margin: 8px 0;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #91465f;
        background: #38212e;
        color: #ffb8d0;
        font-size: 13px;
        line-height: 1.5;
      }

      .dd-inline-message[hidden] {
        display: none !important;
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

  function renderOrder(order) {
    installStyles();

    const c = customer(order);
    const items = parseJSON(order.items_json, []);
    const root = element('div', 'dd-order-details');

    const badges = element('div', 'dd-badges');

    badges.append(
      element(
        'span',
        'dd-badge dd-status',
        readable(order.status)
      ),
      element(
        'span',
        'dd-badge dd-payment',
        readable(order.payment_status)
      )
    );

    root.append(badges);

    root.append(
      element(
        'h3',
        'dd-section-title',
        'Customer Information'
      )
    );

    const customerGrid = element('div', 'dd-detail-grid');

    customerGrid.append(
      detail('Customer Name', c.name || '—'),
      detail('Phone Number', c.phone || '—'),
      detail('Delivery Address', c.address || '—')
    );

    root.append(customerGrid);

    root.append(
      element(
        'h3',
        'dd-section-title',
        'Payment & Order Information'
      )
    );

    const orderGrid = element('div', 'dd-detail-grid');

    let date = '—';

    if (order.created_at) {
      const parsed = new Date(order.created_at);

      date = Number.isNaN(parsed.getTime())
        ? order.created_at
        : parsed.toLocaleString('en-PH');
    }

    orderGrid.append(
      detail('Payment Method', readable(order.payment_method)),
      detail('Fulfillment', readable(order.fulfillment)),
      detail('Order Status', readable(order.status)),
      detail('Payment Status', readable(order.payment_status)),
      detail('Order Total', money(order.total_centavos)),
      detail('Date Ordered', date)
    );

    root.append(orderGrid);

    root.append(
      element(
        'h3',
        'dd-section-title',
        'Ordered Products'
      )
    );

    const itemsBox = element('div', 'dd-items');

    if (Array.isArray(items) && items.length) {
      for (const item of items) {
        const row = element('div', 'dd-item');
        const left = element('div');

        left.append(
          element(
            'div',
            'dd-item-name',
            item.name || item.sku || 'Product'
          ),
          element(
            'div',
            'dd-item-meta',
            [
              item.variant
                ? 'Variant: ' + item.variant
                : '',
              'Quantity: ' + (item.quantity ?? 1)
            ].filter(Boolean).join(' · ')
          )
        );

        const amount = item.subtotal ?? item.amount;

        row.append(
          left,
          element(
            'strong',
            'dd-item-price',
            amount == null ? '—' : money(amount)
          )
        );

        itemsBox.append(row);
      }
    } else {
      itemsBox.append(
        element('p', '', 'No product details available.')
      );
    }

    root.append(itemsBox);

    const total = element('div', 'dd-total-row');

    total.append(
      element('strong', '', 'Order Total'),
      element('strong', '', money(order.total_centavos))
    );

    root.append(total);

    $('info').replaceChildren(root);
  }

  function makeButton(text) {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = text;

    return button;
  }

  function setVisible(node, visible) {
    node.hidden = !visible;
    node.style.display = visible ? '' : 'none';
  }

  const editControls = {};

  function showInlineMessage(type, message) {
    const config = editControls[type];

    if (!config) {
      notice(message);
      return;
    }

    config.message.textContent = message;
    setVisible(config.message, true);
    notice(message);
  }

  function clearInlineMessages() {
    for (const config of Object.values(editControls)) {
      config.message.textContent = '';
      setVisible(config.message, false);
    }
  }

  function restoreFields(type) {
    if (!current) return;

    const c = customer(current);

    if (type === 'customer') {
      $('name').value = c.name || '';
      $('phone').value = c.phone || '';
      $('address').value = c.address || '';
    }

    if (type === 'payment') {
      $('method').value =
        current.payment_method || 'cod';
    }
  }

  function setEditMode(type, enabled) {
    const config = editControls[type];

    if (!config) return;

    for (const id of config.fields) {
      const field = $(id);

      if (!field) continue;

      field.disabled = !enabled;

      field.classList.toggle(
        'dd-locked',
        !enabled
      );
    }

    setVisible(config.edit, !enabled);
    setVisible(config.save, enabled);
    setVisible(config.cancel, enabled);
  }

  function resetEdits() {
    editing = null;

    for (const type of Object.keys(editControls)) {
      restoreFields(type);
      setEditMode(type, false);
    }

    clearInlineMessages();
  }

  function setupEditControls() {
    const configs = [
      {
        type: 'customer',
        area: 'editArea',
        saveId: 'saveEdit',
        fields: ['name', 'phone', 'address']
      },
      {
        type: 'payment',
        area: 'paymentArea',
        saveId: 'savePayment',
        fields: ['method']
      }
    ];

    for (const config of configs) {
      const area = $(config.area);
      const save = $(config.saveId);

      if (!area || !save) continue;

      save.type = 'button';
      save.textContent = 'Save Changes';

      const edit = makeButton('Edit');
      const cancel = makeButton('Cancel');
      const message = element('p', 'dd-inline-message');

      message.setAttribute('role', 'alert');

      const actions = element('div', 'dd-edit-actions');
      actions.append(edit, save, cancel);

      area.append(actions, message);

      editControls[config.type] = {
        fields: config.fields,
        edit,
        save,
        cancel,
        message
      };

      edit.addEventListener('click', event => {
        event.preventDefault();

        if (saving) return;

        if (editing && editing !== config.type) {
          showInlineMessage(
            config.type,
            'Finish or cancel your current edit first.'
          );
          return;
        }

        editing = config.type;
        clearInlineMessages();
        setEditMode(config.type, true);
        notice('');
      });

      cancel.addEventListener('click', event => {
        event.preventDefault();

        if (saving) return;

        restoreFields(config.type);
        editing = null;

        setEditMode(config.type, false);
        clearInlineMessages();
        notice('Changes cancelled.');
      });

      setEditMode(config.type, false);
      setVisible(message, false);
    }
  }

  async function list() {
    try {
      const query = $('query').value.trim();

      const data = await api(
        '/api/staff/orders?q=' +
        encodeURIComponent(query)
      );

      $('orders').replaceChildren();

      for (const order of data.orders) {
        const button = makeButton(
          order.id + ' · ' +
          order.status + ' · ' +
          (customer(order).name || 'Customer')
        );

        button.className = 'order';

        button.addEventListener('click', () => {
          if (saving) return;
          openOrder(order.id);
        });

        $('orders').append(button);
      }

      if (!data.orders.length) {
        $('orders').textContent =
          'No orders found.';
      }

    } catch (error) {
      notice(error.message);
    }
  }

  async function openOrder(id) {
    const sequence = ++openSequence;

    try {
      const data = await api(
        '/api/staff/orders?id=' +
        encodeURIComponent(id)
      );

      if (sequence !== openSequence) return;

      current = data.order;

      const order = current;
      const c = customer(order);

      $('title').textContent = order.id;

      renderOrder(order);

      $('name').value = c.name || '';
      $('phone').value = c.phone || '';
      $('address').value = c.address || '';
      $('method').value =
        order.payment_method || 'cod';

      $('actions').hidden = false;

      const editable = [
        'pending',
        'confirmed'
      ].includes(order.status);

      const unpaid =
        order.payment_status === 'unpaid';

      $('editArea').hidden = !(
        has('orders_edit') && editable
      );

      $('paymentArea').hidden = !(
        has('payment_change') &&
        editable &&
        unpaid
      );

      $('cancelArea').hidden = !(
        has('orders_cancel') &&
        editable &&
        unpaid
      );

      $('refundArea').hidden = !(
        has('refund_request') &&
        order.payment_status === 'paid'
      );

      resetEdits();

    } catch (error) {
      if (sequence === openSequence) {
        notice(error.message);
      }
    }
  }

  async function change(
    action,
    extra = {},
    method = 'PATCH'
  ) {
    if (!current || saving) return;

    const type =
      action === 'edit'
        ? 'customer'
        : action === 'payment'
          ? 'payment'
          : null;

    if (type && editing !== type) {
      showInlineMessage(type, 'Click Edit first.');
      return;
    }

    clearInlineMessages();

    const reason = $('reason').value.trim();

    if (reason.length < 5) {
      const message =
        'Please enter a reason and customer authorization ' +
        'reference (minimum 5 characters) before saving.';

      if (type) {
        showInlineMessage(type, message);
      } else {
        notice(message);
      }

      $('reason').focus();
      $('reason').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      return;
    }

    if (reason.length > 500) {
      const message =
        'Reason must not exceed 500 characters.';

      if (type) {
        showInlineMessage(type, message);
      } else {
        notice(message);
      }

      return;
    }

    const messages = {
      edit:
        'Are you sure you want to save these customer details?',
      payment:
        'Are you sure you want to change the payment method?',
      cancel:
        'Are you sure you want to CANCEL this order? This cannot be undone.',
      refund:
        'Are you sure you want to submit this refund request for Admin review?'
    };

    if (!window.confirm(
      messages[action] || 'Are you sure?'
    )) {
      return;
    }

    const orderId = current.id;

    saving = true;

    if (editControls.customer) {
      editControls.customer.save.disabled = true;
    }

    if (editControls.payment) {
      editControls.payment.save.disabled = true;
    }

    $('cancelOrder').disabled = true;
    $('requestRefund').disabled = true;

    try {
      const data = await api(
        '/api/staff/orders',
        payload(method, {
          id: orderId,
          action,
          reason,
          ...extra
        })
      );

      $('reason').value = '';

      await openOrder(orderId);
      await list();

      resetEdits();

      notice(
        data.message ||
        (
          action === 'refund'
            ? 'Refund request submitted for Admin review.'
            : 'Changes saved successfully.'
        )
      );

    } catch (error) {
      if (type) {
        showInlineMessage(type, error.message);
      } else {
        notice(error.message);
      }
    } finally {
      saving = false;

      if (editControls.customer) {
        editControls.customer.save.disabled = false;
      }

      if (editControls.payment) {
        editControls.payment.save.disabled = false;
      }

      $('cancelOrder').disabled = false;
      $('requestRefund').disabled = false;
    }
  }

  $('search').addEventListener('click', list);

  $('query').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      list();
    }
  });

  $('saveEdit').addEventListener('click', event => {
    event.preventDefault();

    if (saving) return;

    change('edit', {
      name: $('name').value,
      phone: $('phone').value,
      address: $('address').value
    });
  });

  $('savePayment').addEventListener('click', event => {
    event.preventDefault();

    if (saving) return;

    change('payment', {
      payment_method: $('method').value
    });
  });

  $('cancelOrder').addEventListener('click', event => {
    event.preventDefault();

    if (saving) return;

    change('cancel');
  });

  $('requestRefund').addEventListener('click', event => {
    event.preventDefault();

    if (saving) return;

    change('refund', {}, 'POST');
  });

  setupEditControls();

  (async () => {
    try {
      me = (await api('/api/staff/me')).staff;

      if (!has('orders_view')) {
        throw Error(
          'Order viewing permission required'
        );
      }

      await list();

    } catch (error) {
      notice(error.message);
    }
  })();
})();
