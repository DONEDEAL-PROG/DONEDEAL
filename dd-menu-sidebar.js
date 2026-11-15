
(function () {
  'use strict';

  function ready() {
    const nav = document.querySelector(
      'header.nav, header .topbar, body > header'
    );

    if (!nav || document.querySelector('.dd-menu-trigger')) {
      return;
    }

    // Create menu button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dd-menu-trigger';
    trigger.setAttribute('aria-label', 'Open navigation menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'dd-menu-panel');

    trigger.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
      Menu
    `;

    nav.insertBefore(trigger, nav.firstChild);

    // Create sidebar background
    const scrim = document.createElement('div');
    scrim.className = 'dd-menu-scrim';

    // Create sidebar
    const panel = document.createElement('aside');
    panel.className = 'dd-menu-panel';
    panel.id = 'dd-menu-panel';
    panel.setAttribute('aria-label', 'Shop navigation');
    panel.setAttribute('aria-hidden', 'true');

    panel.innerHTML = `
      <div class="dd-menu-top">
        <div class="dd-menu-brand">
          DONE<span>DEAL</span>
        </div>

        <button
          class="dd-menu-close"
          type="button"
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      <nav class="dd-menu-links" aria-label="Main navigation">

        <!-- MAIN MENU -->

        <a href="/">
          <span aria-hidden="true">⌂</span>
          Home
        </a>

        <a href="/shop">
          <span aria-hidden="true">▣</span>
          Shop All Gadgets
        </a>

        <a href="/#brands">
          <span aria-hidden="true">◇</span>
          Shop by Brand
        </a>

        <a href="/wishlist">
          <span aria-hidden="true">♡</span>
          My Wishlist
        </a>

        <a href="/#dd-recent-grid">
          <span aria-hidden="true">◷</span>
          Recently Viewed
        </a>

        <a href="/#about">
          <span aria-hidden="true">ⓘ</span>
          About DONEDEAL
        </a>

        <!-- CUSTOMER SUPPORT -->

        <div
          class="dd-menu-section-label"
          style="
            margin:18px 18px 8px;
            padding-top:14px;
            border-top:1px solid rgba(150,150,160,.25);
            font-size:11px;
            font-weight:800;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#a9a9b5;
          "
        >
          Customer Support
        </div>

        <a href="/support?mode=live">
          <span aria-hidden="true">🎧</span>
          Live Agent Support
        </a>

        <a href="/support?mode=ticket">
          <span aria-hidden="true">🎫</span>
          Create Support Ticket
        </a>

        <!-- AFFILIATE PROGRAM -->

        <div
          class="dd-menu-section-label"
          style="
            margin:18px 18px 8px;
            padding-top:14px;
            border-top:1px solid rgba(150,150,160,.25);
            font-size:11px;
            font-weight:800;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#a9a9b5;
          "
        >
          Affiliate Program
        </div>

        <a href="/partner">
          <span aria-hidden="true">🤝</span>
          Affiliate Sign In
        </a>

      </nav>

      <div class="dd-menu-foot">
        DONEDEAL Gadgets &amp; Supplies
      </div>
    `;

    document.body.append(scrim, panel);

    const closeButton = panel.querySelector('.dd-menu-close');

    function setOpen(open) {
      document.body.classList.toggle('dd-menu-open', open);

      trigger.setAttribute(
        'aria-expanded',
        String(open)
      );

      panel.setAttribute(
        'aria-hidden',
        String(!open)
      );

      if (open) {
        closeButton.focus();
      } else {
        trigger.focus();
      }
    }

    // Open sidebar
    trigger.addEventListener('click', () => {
      setOpen(true);
    });

    // Close when clicking outside
    scrim.addEventListener('click', () => {
      setOpen(false);
    });

    // Close button
    closeButton.addEventListener('click', () => {
      setOpen(false);
    });

    // Escape key closes sidebar
    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        document.body.classList.contains('dd-menu-open')
      ) {
        setOpen(false);
      }
    });

    // Close sidebar after selecting a link
    panel.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('dd-menu-open');

        trigger.setAttribute(
          'aria-expanded',
          'false'
        );

        panel.setAttribute(
          'aria-hidden',
          'true'
        );
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
