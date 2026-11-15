/* DONEDEAL storefront product photos.
   D1/R2 catalog image is authoritative; legacy local overrides are fallback only.
   This file changes presentation only, not prices, stock, or checkout. */
(function () {
  'use strict';

  const storageKey = 'ddPhotoOverrides';
  let overrides = {};
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) overrides = stored;
  } catch (_) {}

  function imageFor(product) {
    // app.js populates this from /api/catalog after the live D1 query.
    const live = typeof window.DDProductImage === 'function'
      ? window.DDProductImage(product.id) : '';
    return live || overrides[product.id] || product.image || '';
  }

  function fallback(visual, product) {
    visual.querySelectorAll('.premiumFallback').forEach(el => el.remove());
    const box = document.createElement('div');
    box.className = 'premiumFallback';
    const brand = document.createElement('span');
    brand.className = 'fallbackBrand';
    brand.textContent = product.brand;
    const name = document.createElement('strong');
    name.textContent = product.name;
    const description = document.createElement('small');
    description.textContent = 'Official product image coming soon';
    box.append(brand, name, description);
    visual.append(box);
  }

  function insertPhoto(visual, product, large) {
    if (!visual) return;
    // app.js may already have rendered a live <img> without a CSS class.
    // Reuse it instead of adding a second photo/placeholder.
    const existing = Array.from(visual.querySelectorAll('img'));
    let img = existing.shift() || document.createElement('img');
    existing.forEach(el => el.remove());
    visual.querySelectorAll('.mini, .photoPending, .premiumFallback')
      .forEach(el => el.remove());

    img.className = large ? 'detailPhoto' : 'productPhoto';
    img.loading = large ? 'eager' : 'lazy';
    img.alt = product.brand + ' ' + product.name;
    img.style.display = 'block';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';

    const url = imageFor(product);
    if (!url) {
      img.remove();
      fallback(visual, product);
      return;
    }

    img.onerror = function () {
      if (img.src !== new URL(url, location.href).href) return;
      img.remove();
      fallback(visual, product);
    };
    img.src = url;
    if (!img.parentNode) visual.append(img);
  }

  function getProducts() {
    return typeof window.DDGetProducts === 'function'
      ? window.DDGetProducts() : [];
  }

  function enhance() {
    const products = getProducts();
    document.querySelectorAll('#catalog .product').forEach(el => {
      const id = el.getAttribute('data-dd-product');
      const product = products.find(p => p.id === id);
      if (product) insertPhoto(el.querySelector('.visual'), product, false);
    });
  }

  if (typeof window.render === 'function') {
    const previousRender = window.render;
    window.render = function () {
      const result = previousRender.apply(this, arguments);
      enhance();
      return result;
    };
  }

  if (typeof window.detail === 'function') {
    const previousDetail = window.detail;
    window.detail = function (id) {
      const result = previousDetail.apply(this, arguments);
      const product = getProducts().find(p => p.id === id);
      if (product) insertPhoto(document.querySelector('#detailBody .visual'), product, true);
      return result;
    };
  }

  // Keep the old in-browser photo editor behavior for compatibility.
  if (typeof window.openAdmin === 'function') {
    const previousAdmin = window.openAdmin;
    window.openAdmin = function () {
      const result = previousAdmin.apply(this, arguments);
      document.querySelectorAll('#adminProducts .adminRow').forEach(row => {
        const id = row.querySelector('[data-id]')?.dataset.id;
        const product = getProducts().find(p => p.id === id);
        if (!product || row.querySelector('[data-dd-photo-editor]')) return;
        const field = document.createElement('input');
        field.type = 'url';
        field.dataset.ddPhotoEditor = 'true';
        field.placeholder = 'Exact-model image HTTPS URL';
        field.value = overrides[id] || product.image || '';
        field.style.cssText = 'width:180px;max-width:100%';
        field.setAttribute('aria-label', 'Product image URL for ' + product.name);
        const save = document.createElement('button');
        save.type = 'button';
        save.textContent = 'Save photo';
        save.onclick = () => {
          const value = field.value.trim();
          if (value && !/^https:\/\//i.test(value)) {
            alert('Enter an HTTPS image URL');
            return;
          }
          if (value) overrides[id] = value;
          else delete overrides[id];
          localStorage.setItem(storageKey, JSON.stringify(overrides));
          window.render();
          save.textContent = 'Saved';
        };
        row.append(field, save);
      });
      return result;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }
})();
