
(function () {
  'use strict';

  function installSidebar() {
    const nav = document.querySelector(
      'header.nav, header .topbar, body > header'
    );

    if (!nav || document.querySelector('.dd-menu-trigger')) {
      return;
    }

    // Menu trigger
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

    // Sidebar backdrop
    const scrim = document.createElement('div');
    scrim.className = 'dd-menu-scrim';

    // Sidebar panel
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

        <a href="/">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-8h6v8"/></svg>
          Home
        </a>

        <a href="/shop">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>
          Shop All Gadgets
        </a>

        <a href="/#brands">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>
          Shop by Brand
        </a>

        <a href="/wishlist">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>
          My Wishlist
        </a>

        <a href="/track-order.html">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></svg>
          Track My Order
        </a>

        <a href="/#dd-recent-grid">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          Recently Viewed
        </a>

        <a href="/#about">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>
          About DONEDEAL
        </a>

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
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="13" width="4" height="7" rx="2"/><rect x="18" y="13" width="4" height="7" rx="2"/></svg>
          Live Agent Support
        </a>

        <a href="/support?mode=ticket">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="M12 5v14" stroke-dasharray="2 3"/></svg>
          Create Support Ticket
        </a>

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

        <button
          type="button"
          class="dd-menu-theme-control"
          role="switch"
          aria-checked="false"
          aria-label="Light Mode"
        >
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/></svg>
          <span class="dd-menu-theme-label">Light Mode</span>
          <span class="dd-menu-switch-state">OFF</span>
          <span class="dd-menu-switch-track" aria-hidden="true">
            <span class="dd-menu-switch-thumb"></span>
          </span>
        </button>

        <a href="/partner">
          <svg class="dd-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></svg>
          Affiliate Sign In
        </a>

      </nav>

      <div class="dd-menu-foot">
        DONEDEAL Gadgets &amp; Supplies
      </div>
    `;

    // Sidebar styles
    if (!document.getElementById('dd-menu-actions-style')) {
      const style = document.createElement('style');
      style.id = 'dd-menu-actions-style';

      style.textContent = `
        .dd-menu-panel .dd-menu-links > a,
        .dd-menu-panel .dd-menu-theme-control {
          display:flex;
          align-items:center;
          gap:14px;
          box-sizing:border-box;
          min-height:48px;
          width:100%;
          padding:12px 18px;
          color:inherit;
          text-decoration:none;
        }

        .dd-menu-panel .dd-menu-icon {
          display:block;
          flex:0 0 21px;
          width:21px;
          height:21px;
          color:inherit;
          opacity:.9;
        }

        .dd-menu-panel .dd-menu-theme-control {
          border:0;
          background:transparent;
          text-align:left;
          font:inherit;
          cursor:pointer;
        }

        .dd-menu-panel .dd-menu-theme-control:hover,
        .dd-menu-panel .dd-menu-links > a:hover {
          background:rgba(150,150,160,.12);
        }

        .dd-menu-panel .dd-menu-theme-control:focus-visible {
          outline:2px solid #e83b86;
          outline-offset:-3px;
        }

        .dd-menu-panel .dd-menu-theme-label {
          flex:1;
          min-width:0;
        }

        .dd-menu-panel .dd-menu-switch-state {
          font-size:10px;
          font-weight:800;
          letter-spacing:.06em;
          opacity:.8;
        }

        .dd-menu-panel .dd-menu-switch-track {
          width:42px;
          height:24px;
          flex:0 0 42px;
          border-radius:999px;
          background:#66606e;
          display:flex;
          align-items:center;
          padding:3px;
          box-sizing:border-box;
          transition:background .2s ease;
        }

        .dd-menu-panel .dd-menu-switch-thumb {
          width:18px;
          height:18px;
          border-radius:50%;
          background:white;
          box-shadow:0 1px 4px #0003;
          transition:transform .2s ease;
        }

        .dd-menu-panel
        .dd-menu-theme-control[aria-checked="true"]
        .dd-menu-switch-track {
          background:#e83b86;
        }

        .dd-menu-panel
        .dd-menu-theme-control[aria-checked="true"]
        .dd-menu-switch-thumb {
          transform:translateX(18px);
        }

        .dd-track-float {
          display:none!important;
        }

        header.nav [data-dd-theme-toggle],
        header.nav [data-dd-global-theme],
        header.nav #ddCheckoutTheme,
        header.nav a[href*="wishlist"],
        header.nav button[onclick*="wishlist" i],
        header.nav #wishlistToggle,
        header.nav .wishlist-btn {
          display:none!important;
        }

        @media(max-width:767px) {
          .dd-global-live-agent,
          .dd-support-float,
          .dd-track-float {
            display:none!important;
          }
        }
      `;

      document.head.appendChild(style);
    }

    document.body.append(scrim, panel);

    // Light/Dark Mode
    const menuTheme = panel.querySelector(
      '.dd-menu-theme-control'
    );

    function getCurrentTheme() {
      const current =
        document.documentElement.dataset.ddStoreTheme;

      if (current === 'light' || current === 'dark') {
        return current;
      }

      try {
        return localStorage.getItem('dd_store_theme_v1') === 'light'
          ? 'light'
          : 'dark';
      } catch (e) {
        return 'dark';
      }
    }

    function syncMenuTheme() {
      const isLight = getCurrentTheme() === 'light';

      menuTheme.setAttribute(
        'aria-checked',
        String(isLight)
      );

      menuTheme.setAttribute(
        'aria-label',
        'Light Mode ' + (isLight ? 'on' : 'off')
      );

      const state = menuTheme.querySelector(
        '.dd-menu-switch-state'
      );

      if (state) {
        state.textContent = isLight ? 'ON' : 'OFF';
      }
    }

    menuTheme.addEventListener('click', function (event) {
      event.preventDefault();

      // Prevent the global theme handler from
      // toggling the theme a second time.
      event.stopPropagation();

      const current = getCurrentTheme();
      const next = current === 'dark' ? 'light' : 'dark';

      try {
        localStorage.setItem('dd_store_theme_v1', next);
      } catch (e) {}

      if (
        window.DDTheme &&
        typeof window.DDTheme.apply === 'function'
      ) {
        window.DDTheme.apply(next);
      } else {
        document.documentElement.dataset.ddStoreTheme = next;
        document.documentElement.style.colorScheme = next;
      }

      syncMenuTheme();
    });

    syncMenuTheme();

    new MutationObserver(syncMenuTheme).observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: ['data-dd-store-theme']
      }
    );

    window.addEventListener('storage', function (event) {
      if (event.key === 'dd_store_theme_v1') {
        syncMenuTheme();
      }
    });

    // Sidebar open/close
    const closeButton = panel.querySelector('.dd-menu-close');

    function setOpen(open, restoreFocus = true) {
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
      } else if (restoreFocus) {
        trigger.focus();
      }
    }

    trigger.addEventListener('click', () => {
      setOpen(true);
    });

    scrim.addEventListener('click', () => {
      setOpen(false);
    });

    closeButton.addEventListener('click', () => {
      setOpen(false);
    });

    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        document.body.classList.contains('dd-menu-open')
      ) {
        setOpen(false);
      }
    });

    panel.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        setOpen(false, false);
      });
    });
  }

  // Floating Live Agent for desktop shopping pages
  function installFloatingLiveAgent() {
    const path =
      window.location.pathname.replace(/\/+$/, '') || '/';

    const shoppingPages = new Set([
      '/',
      '/index',
      '/shop',
      '/cart',
      '/checkout',
      '/wishlist'
    ]);

    if (!shoppingPages.has(path)) {
      return;
    }

    if (!document.getElementById('dd-global-live-agent-style')) {
      const style = document.createElement('style');
      style.id = 'dd-global-live-agent-style';

      style.textContent = `
        .dd-support-float {
          display:none!important;
        }

        .dd-global-live-agent {
          position:fixed;
          right:20px;
          bottom:88px;
          z-index:99997;

          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:9px;

          padding:13px 18px;
          border-radius:999px;

          background:#ed0871;
          color:#ffffff;
          text-decoration:none;

          font-family:'DM Sans',system-ui,sans-serif;
          font-size:14px;
          font-weight:800;
          line-height:1.2;

          border:1px solid rgba(255,255,255,.2);
          box-shadow:0 8px 26px rgba(0,0,0,.42);

          transition:
            background .2s ease,
            transform .2s ease;
        }

        .dd-global-live-agent:hover {
          background:#ff398c;
          color:#ffffff;
          transform:translateY(-2px);
        }

        .dd-global-live-agent:focus-visible {
          outline:3px solid #ffffff;
          outline-offset:3px;
        }

        .dd-global-live-agent svg {
          width:21px;
          height:21px;
          flex:none;
        }

        .dd-global-live-agent span {
          white-space:nowrap;
        }

        @media(max-width:767px) {
          .dd-global-live-agent {
            display:none!important;
          }
        }
      `;

      document.head.appendChild(style);
    }

    if (document.querySelector('.dd-global-live-agent')) {
      return;
    }

    const button = document.createElement('a');

    button.className = 'dd-global-live-agent';
    button.href = '/support?mode=live';

    button.setAttribute(
      'aria-label',
      'Chat with a Live Agent'
    );

    button.title = 'Chat with a Live Agent';

    button.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 14v-3a8 8 0 0 1 16 0v3"/>
        <rect x="2" y="12" width="4" height="7" rx="2"/>
        <rect x="18" y="12" width="4" height="7" rx="2"/>
        <path d="M20 19a5 5 0 0 1-5 3h-3"/>
      </svg>

      <span>Live Agent</span>
    `;

    document.body.appendChild(button);
  }

  // Initialize
  function initialize() {
    installSidebar();
    installFloatingLiveAgent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );
  } else {
    initialize();
  }

})();
