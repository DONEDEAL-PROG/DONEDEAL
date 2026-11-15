
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

  // Floating Live Agent for customer shopping pages
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
        /* Hide older homepage floating support button */
        .dd-support-float {
          display: none !important;
        }

        /* New consistent Live Agent button */
        .dd-global-live-agent {
          position: fixed;
          right: 20px;
          bottom: 88px;
          z-index: 99997;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          padding: 13px 18px;
          border-radius: 999px;

          background: #ed0871;
          color: #ffffff;
          text-decoration: none;

          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.2;

          border: 1px solid rgba(255,255,255,.2);
          box-shadow: 0 8px 26px rgba(0,0,0,.42);

          transition:
            background .2s ease,
            transform .2s ease;
        }

        .dd-global-live-agent:hover {
          background: #ff398c;
          color: #ffffff;
          transform: translateY(-2px);
        }

        .dd-global-live-agent:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 3px;
        }

        .dd-global-live-agent svg {
          width: 21px;
          height: 21px;
          flex: none;
        }

        .dd-global-live-agent span {
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .dd-global-live-agent {
            right: 14px;
            bottom: 78px;
            padding: 12px 15px;
            font-size: 12px;
          }

          .dd-global-live-agent svg {
            width: 19px;
            height: 19px;
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

  // Initialize both features
  function initialize() {
    installSidebar();
    installFloatingLiveAgent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
