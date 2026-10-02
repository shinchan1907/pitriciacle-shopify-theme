/* ==========================================================================
   Pitriciacle — theme.js (vanilla, no libraries)
   Drawers + focus trap, cart AJAX, predictive search, quick view,
   recently viewed, mobile filters, reveal/parallax/announcement/hotspots.
   ========================================================================== */
(function () {
  'use strict';

  /* no-js -> js */
  document.documentElement.classList.replace('no-js', 'js');

  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sized(url, w) {
    if (!url) return '';
    return String(url).replace(/(\.[a-z]{3,4})(\?[^]*)?$/i, '_' + w + 'x$1$2');
  }

  function money(cents) {
    try {
      return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'INR', minimumFractionDigits: 0 });
    } catch (err) {
      return '₹' + (cents / 100).toLocaleString('en-IN');
    }
  }

  /* ---------- Focus trap ---------- */
  var trapState = null;
  function focusables(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.getClientRects().length > 0; });
  }
  function activateTrap(container) {
    deactivateTrap();
    var prev = document.activeElement;
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var f = focusables(container);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    trapState = { container: container, prev: prev, onKey: onKey };
    var f = focusables(container);
    if (f[0]) f[0].focus();
  }
  function deactivateTrap() {
    if (!trapState) return;
    trapState.container.removeEventListener('keydown', trapState.onKey);
    if (trapState.prev && typeof trapState.prev.focus === 'function') {
      try { trapState.prev.focus(); } catch (e) { /* noop */ }
    }
    trapState = null;
  }

  /* ---------- Drawers (generic open/close) ---------- */
  function openDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    activateTrap(drawer.querySelector('[data-trap-root]') || drawer);
  }

  function closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    deactivateTrap();
    if (!document.querySelector('.pt-drawer.is-open')) body.style.overflow = '';
  }

  function closeAllDrawers() {
    document.querySelectorAll('.pt-drawer.is-open').forEach(closeDrawer);
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-drawer-open]');
    if (opener) {
      e.preventDefault();
      openDrawer(opener.getAttribute('data-drawer-open'));
      return;
    }
    var closer = e.target.closest('[data-drawer-close]');
    if (closer) {
      var drawer = closer.closest('.pt-drawer');
      closeDrawer(drawer);
      return;
    }
    var overlay = e.target.closest('.pt-drawer__overlay');
    if (overlay) closeDrawer(overlay.closest('.pt-drawer'));
  });

  /* ---------- Quick view modal ---------- */
  var qv = document.getElementById('QuickView');
  var qvContent = qv ? qv.querySelector('[data-qv-content]') : null;

  function openQuickView(handle) {
    if (!qv || !handle) return;
    qv.hidden = false;
    window.requestAnimationFrame(function () {
      qv.classList.add('is-open');
      qv.setAttribute('aria-hidden', 'false');
    });
    body.style.overflow = 'hidden';
    if (qvContent) {
      qvContent.innerHTML = '<p class="pt-qv__loading" role="status">Pitriciacle</p>';
    }
    fetch('/products/' + encodeURIComponent(handle) + '.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('qv'); return r.json(); })
      .then(function (p) {
        if (qvContent) qvContent.innerHTML = qvHTML(p);
        wireQuickViewVariants(p);
        activateTrap(qv.querySelector('[data-trap-root]'));
      })
      .catch(function () { closeQuickView(); });
  }

  function closeQuickView() {
    if (!qv || qv.hidden) return;
    qv.classList.remove('is-open');
    qv.setAttribute('aria-hidden', 'true');
    deactivateTrap();
    if (!document.querySelector('.pt-drawer.is-open')) body.style.overflow = '';
    window.setTimeout(function () { qv.hidden = true; }, 400);
  }

  function qvHTML(p) {
    var t = {
      add: qv.getAttribute('data-qv-add') || 'Add to bag',
      sold: qv.getAttribute('data-qv-soldout') || 'Sold out',
      view: qv.getAttribute('data-qv-view-full') || 'View full details'
    };
    var img = p.featured_image
      ? '<div class="pt-qv__media"><img src="' + sized(p.featured_image, 900) + '" alt="' + escapeHTML(p.title) + '" loading="eager" decoding="async"></div>'
      : '<div class="pt-qv__media"></div>';
    var desc = String(p.description || '').replace(/<[^>]*>/g, '');
    if (desc.length > 220) desc = desc.slice(0, 220).trim() + '…';
    var first = p.variants && p.variants[0];
    var price = first ? money(first.price) : money(p.price);
    var variantUI = '';
    if (p.variants && p.variants.length > 1) {
      variantUI = '<div class="pt-qv__variants">' + p.options.map(function (opt, i) {
        var key = 'option' + (i + 1);
        var opts = opt.values.map(function (v) {
          return '<option value="' + escapeHTML(v) + '">' + escapeHTML(v) + '</option>';
        }).join('');
        return '<label class="pt-label">' + escapeHTML(opt.name) +
          '<select class="pt-input" data-qv-option="' + key + '">' + opts + '</select></label>';
      }).join('') + '</div>';
    }
    return img +
      '<div class="pt-qv__info">' +
        '<h2 class="pt-qv__title" id="qv-title">' + escapeHTML(p.title) + '</h2>' +
        '<p class="pt-price pt-qv__price" data-qv-price>' + price + '</p>' +
        (desc ? '<p class="pt-qv__desc">' + escapeHTML(desc) + '</p>' : '') +
        '<div class="pt-qv__form">' +
          variantUI +
          '<button type="button" class="pt-btn pt-btn--full" data-add-to-cart="' + (first ? first.id : '') + '"' +
            (first && first.available ? '' : ' disabled') + ' data-qv-add>' +
            ((first && first.available) ? escapeHTML(t.add) : escapeHTML(t.sold)) + '</button>' +
          '<a href="' + p.url + '" class="pt-btn--quiet pt-qv__link">' + escapeHTML(t.view) + '</a>' +
        '</div>' +
      '</div>';
  }

  function wireQuickViewVariants(p) {
    if (!qvContent || !p.variants || p.variants.length < 2) return;
    var selects = qvContent.querySelectorAll('[data-qv-option]');
    var addBtn = qvContent.querySelector('[data-qv-add]');
    var priceEl = qvContent.querySelector('[data-qv-price]');
    var t = {
      add: qv.getAttribute('data-qv-add') || 'Add to bag',
      sold: qv.getAttribute('data-qv-soldout') || 'Sold out'
    };
    function current() {
      var vals = Array.prototype.map.call(selects, function (s) { return s.value; });
      for (var i = 0; i < p.variants.length; i++) {
        var v = p.variants[i];
        if (v.option1 === vals[0] && (vals.length < 2 || v.option2 === vals[1]) && (vals.length < 3 || v.option3 === vals[2])) return v;
      }
      return p.variants[0];
    }
    Array.prototype.forEach.call(selects, function (s) {
      s.addEventListener('change', function () {
        var v = current();
        if (addBtn) {
          addBtn.setAttribute('data-add-to-cart', v.id);
          addBtn.disabled = !v.available;
          addBtn.textContent = v.available ? t.add : t.sold;
        }
        if (priceEl) priceEl.textContent = money(v.price);
      });
    });
  }

  document.addEventListener('click', function (e) {
    var qvBtn = e.target.closest('[data-quick-view]');
    if (qvBtn) {
      e.preventDefault();
      openQuickView(qvBtn.getAttribute('data-quick-view'));
      return;
    }
    if (e.target.closest('[data-qv-close]') || (qv && !qv.hidden && e.target.classList && e.target.classList.contains('pt-qv__overlay'))) {
      closeQuickView();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDrawers();
      closeQuickView();
      closeFilters();
    }
  });

  /* ---------- Cart drawer: state + AJAX ---------- */
  var cartDrawerBody = document.querySelector('[data-cart-drawer-body]');
  var cartCountEls = document.querySelectorAll('[data-cart-count]');

  function updateCartCounts(count) {
    cartCountEls.forEach(function (el) {
      el.textContent = count;
      if (el.classList.contains('pt-cart-count')) {
        if (count > 0) { el.removeAttribute('hidden'); } else { el.setAttribute('hidden', ''); }
      }
    });
  }

  function cartItemHTML(item) {
    var img = item.image
      ? '<img src="' + sized(item.image, 200) + '" alt="' + escapeHTML(item.product_title) + '" loading="lazy" width="200" height="200">'
      : '';
    var variant = item.variant_title && item.variant_title !== 'Default Title'
      ? '<p class="pt-cart-item__variant">' + escapeHTML(item.variant_title) + '</p>'
      : '';
    return (
      '<div class="pt-cart-item" data-line-key="' + item.key + '">' +
        '<div class="pt-cart-item__media">' + img + '</div>' +
        '<div>' +
          '<h3 class="pt-cart-item__title"><a href="' + item.url + '">' + escapeHTML(item.product_title) + '</a></h3>' +
          variant +
          '<div class="pt-cart-item__row">' +
            '<div class="pt-qty" data-qty-stepper>' +
              '<button type="button" data-qty="minus" aria-label="Decrease quantity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
              '<input type="number" value="' + item.quantity + '" min="1" aria-label="Quantity" data-line-key="' + item.key + '">' +
              '<button type="button" data-qty="plus" aria-label="Increase quantity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
            '</div>' +
            '<span class="pt-price">' + money(item.line_price) + '</span>' +
          '</div>' +
          '<button type="button" class="pt-cart-item__remove" data-cart-remove="' + item.key + '">Remove</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCart(cart) {
    updateCartCounts(cart.item_count);
    if (typeof syncGiftSuite === 'function') syncGiftSuite(cart);
    if (!cartDrawerBody) return;
    var itemsWrap = cartDrawerBody.querySelector('[data-cart-items]');
    var foot = document.querySelector('[data-cart-drawer-foot]');
    if (!itemsWrap) return;

    if (cart.item_count === 0) {
      itemsWrap.innerHTML =
        '<div class="pt-cart-empty">' +
          '<h3 class="pt-h3">Your cart is empty</h3>' +
          '<p class="pt-muted">Beautiful rooms begin with a single object.</p>' +
          '<p style="margin-top:2rem"><a class="pt-btn" href="/collections/all">Continue shopping</a></p>' +
        '</div>';
      if (foot) foot.style.display = 'none';
      var ups = cartDrawerBody.querySelector('[data-cart-upsells]');
      if (ups) ups.style.display = 'none';
      return;
    }

    itemsWrap.innerHTML = cart.items.map(cartItemHTML).join('');
    if (foot) {
      foot.style.display = '';
      var subtotal = foot.querySelector('[data-cart-subtotal]');
      if (subtotal) subtotal.textContent = money(cart.total_price);
      var progress = foot.querySelector('[data-shipping-progress]');
      if (progress) {
        var threshold = parseInt(progress.getAttribute('data-shipping-threshold') || '0', 10);
        var label = progress.querySelector('[data-shipping-label]');
        var fill = progress.querySelector('[data-shipping-fill]');
        if (threshold > 0 && label && fill) {
          var pct = Math.min(100, Math.round((cart.total_price / threshold) * 100));
          fill.style.width = pct + '%';
          if (cart.total_price >= threshold) {
            label.textContent = 'Complimentary shipping unlocked';
          } else {
            label.innerHTML = 'You are <strong>' + money(threshold - cart.total_price) + '</strong> away from complimentary shipping';
          }
        }
      }
    }
  }

  function refreshCart() {
    return fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(renderCart)
      .catch(function () { /* drawer keeps last state; no console noise */ });
  }

  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      if (addBtn.disabled) return;
      var id = addBtn.getAttribute('data-add-to-cart');
      var qtyInput = addBtn.closest('form, [data-product-form]') ? addBtn.closest('form, [data-product-form]').querySelector('[data-qty-input]') : null;
      var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      addBtn.setAttribute('disabled', '');
      var bodyData = new FormData();
      bodyData.append('id', id);
      bodyData.append('quantity', qty);
      fetch('/cart/add.js', { method: 'POST', body: bodyData, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('add-failed'); return r.json(); })
        .then(function () { return refreshCart(); })
        .then(function () {
          if (qv && !qv.hidden) closeQuickView();
          openDrawer('CartDrawer');
        })
        .catch(function () { window.location.href = '/cart'; })
        .finally(function () { addBtn.removeAttribute('disabled'); });
      return;
    }

    var removeBtn = e.target.closest('[data-cart-remove]');
    if (removeBtn) {
      e.preventDefault();
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: removeBtn.getAttribute('data-cart-remove'), quantity: 0 })
      }).then(function (r) { return r.json(); }).then(renderCart).catch(function () {});
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-qty-input][data-line-key]');
    if (!input) return;
    var qty = Math.max(0, parseInt(input.value, 10) || 0);
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: input.getAttribute('data-line-key'), quantity: qty })
    }).then(function (r) { return r.json(); }).then(renderCart).catch(function () {});
  });

  /* Gift note — saved to the cart on change */
  var giftNote = document.querySelector('[data-gift-note]');
  var giftTimer = null;
  if (giftNote) {
    giftNote.addEventListener('input', function () {
      window.clearTimeout(giftTimer);
      giftTimer = window.setTimeout(function () {
        fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ note: giftNote.value })
        }).catch(function () {});
      }, 700);
    });
  }

  /* ---------- Quantity steppers (event delegation) ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty]');
    if (!btn) return;
    var wrap = btn.closest('[data-qty-stepper]');
    if (!wrap) return;
    var input = wrap.querySelector('input');
    if (!input) return;
    var step = btn.getAttribute('data-qty') === 'plus' ? 1 : -1;
    var next = Math.max(parseInt(input.min || '1', 10), (parseInt(input.value, 10) || 1) + step);
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Mobile collection filters ---------- */
  var filtersForm = document.querySelector('[data-filters-open]') ? document.getElementById(document.querySelector('[data-filters-open]').getAttribute('aria-controls')) : null;
  var filtersScrim = document.querySelector('[data-filters-scrim]');
  function openFilters() {
    var toggle = document.querySelector('[data-filters-open]');
    if (!toggle || !filtersForm) return;
    filtersForm.classList.add('is-open');
    if (filtersScrim) filtersScrim.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
    activateTrap(filtersForm);
  }
  function closeFilters() {
    var toggle = document.querySelector('[data-filters-open]');
    if (!filtersForm || !filtersForm.classList.contains('is-open')) return;
    filtersForm.classList.remove('is-open');
    if (filtersScrim) filtersScrim.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    deactivateTrap();
    if (!document.querySelector('.pt-drawer.is-open') && (!qv || qv.hidden)) body.style.overflow = '';
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-filters-open]')) { e.preventDefault(); openFilters(); return; }
    if (e.target.closest('[data-filters-close]') || e.target.closest('[data-filters-scrim]')) { closeFilters(); }
  });

  /* ---------- Header hide on scroll down (subtle) ---------- */
  var header = document.querySelector('[data-site-header]');
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > 240 && y > lastY + 4) {
          header.classList.add('pt-header--hidden');
        } else if (y < lastY - 4 || y < 240) {
          header.classList.remove('pt-header--hidden');
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.pt-reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Accordions (event delegation) ---------- */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-accordion-trigger]');
    if (!trigger) return;
    var item = trigger.closest('.pt-accordion__item');
    if (!item) return;
    var isOpen = item.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  /* ---------- Predictive search (products, collections, pages) ---------- */
  var searchInput = document.querySelector('[data-predictive-search-input]');
  var searchResults = document.querySelector('[data-predictive-search-results]');
  var searchTimer = null;
  var psActive = -1;

  function psLinks() {
    return searchResults ? Array.prototype.slice.call(searchResults.querySelectorAll('[role="option"]')) : [];
  }
  function psSetActive(idx) {
    var links = psLinks();
    psActive = idx;
    links.forEach(function (a, i) {
      var on = i === idx;
      a.classList.toggle('is-active', on);
      a.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) searchInput.setAttribute('aria-activedescendant', a.id);
    });
    if (idx < 0) searchInput.removeAttribute('aria-activedescendant');
  }

  function psRender(data, labels) {
    var res = (data.resources && data.resources.results) || {};
    var groups = [
      { key: 'products', label: labels.products, items: res.products || [] },
      { key: 'collections', label: labels.collections, items: res.collections || [] },
      { key: 'pages', label: labels.pages, items: res.pages || [] }
    ];
    var html = '';
    var n = 0;
    groups.forEach(function (g) {
      if (!g.items.length) return;
      html += '<div class="pt-search-group" role="presentation"><p class="pt-search-group__title" id="ps-group-' + g.key + '">' + escapeHTML(g.label) + '</p>';
      g.items.forEach(function (it) {
        var id = 'ps-opt-' + (n++);
        var img = it.image
          ? '<span class="pt-search-result__media"><img src="' + sized(it.image, 200) + '" alt="" loading="lazy" width="200" height="200"></span>'
          : '<span class="pt-search-result__media"></span>';
        var sub = g.key === 'products' ? '<span class="pt-price">' + money(it.price) + '</span>' : '';
        html += '<a class="pt-search-result" role="option" id="' + id + '" aria-selected="false" href="' + it.url + '">' + img +
          '<span class="pt-search-result__text"><span class="pt-search-result__label">' + escapeHTML(it.title) + '</span>' +
          (g.key === 'collections' ? '<span class="pt-search-result__hint">' + escapeHTML(labels.collection_hint || '') + '</span>' : '') +
          '</span>' + sub + '</a>';
      });
      html += '</div>';
    });
    if (!html) {
      searchResults.innerHTML = '<p class="pt-muted pt-search-empty">' + escapeHTML(labels.no_results) + '</p>';
    } else {
      searchResults.innerHTML = html +
        '<div class="pt-search-viewall"><a class="pt-btn--quiet" role="option" id="ps-opt-' + (n) + '" aria-selected="false" href="/search?q=' + encodeURIComponent(searchInput.value.trim()) + '">' + escapeHTML(labels.view_all) + '</a></div>';
    }
    searchResults.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
    psSetActive(-1);
  }

  if (searchInput && searchResults) {
    var psLabels = {
      products: searchInput.getAttribute('data-label-products') || 'Products',
      collections: searchInput.getAttribute('data-label-collections') || 'Collections',
      pages: searchInput.getAttribute('data-label-pages') || 'Pages',
      view_all: searchInput.getAttribute('data-label-view-all') || 'View all results',
      no_results: searchInput.getAttribute('data-label-no-results') || 'No matches found.'
    };
    searchInput.setAttribute('role', 'combobox');
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-controls', searchResults.id || 'predictive-results');
    searchResults.setAttribute('role', 'listbox');

    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim();
      window.clearTimeout(searchTimer);
      psSetActive(-1);
      if (q.length < 2) {
        searchResults.innerHTML = '';
        searchResults.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        return;
      }
      searchTimer = window.setTimeout(function () {
        fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product,collection,page&resources[limit]=6&resources[options][unavailable_products]=hide', {
          headers: { Accept: 'application/json' }
        })
          .then(function (r) { return r.json(); })
          .then(function (data) { psRender(data, psLabels); })
          .catch(function () { /* leave previous results */ });
      }, 280);
    });

    searchInput.addEventListener('keydown', function (e) {
      var links = psLinks();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!links.length) return;
        e.preventDefault();
        var next = e.key === 'ArrowDown' ? psActive + 1 : psActive - 1;
        if (next < 0) next = links.length - 1;
        if (next >= links.length) next = 0;
        psSetActive(next);
        links[next].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        if (psActive >= 0 && links[psActive]) {
          e.preventDefault();
          window.location.href = links[psActive].getAttribute('href');
        }
      }
    });
  }

  /* ---------- Recently viewed ---------- */
  var rvSection = document.querySelector('[data-recently-viewed]');
  if (rvSection) {
    try {
      var rvHandles = JSON.parse(localStorage.getItem('pt_recently_viewed') || '[]');
      if (body.classList.contains('template-product')) rvHandles = rvHandles.slice(1);
      var rvLimit = parseInt(rvSection.getAttribute('data-rv-limit') || '4', 10);
      rvHandles = rvHandles.slice(0, rvLimit);
      if (rvHandles.length >= 2) {
        var rvGrid = rvSection.querySelector('[data-rv-grid]');
        Promise.all(rvHandles.map(function (h) {
          return fetch('/products/' + encodeURIComponent(h) + '.js', { headers: { Accept: 'application/json' } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; });
        })).then(function (products) {
          var html = products.filter(Boolean).map(function (p) {
            return '<article class="pt-product-card">' +
              '<div class="pt-product-card__media"><a class="pt-product-card__link" href="' + p.url + '" aria-label="' + escapeHTML(p.title) + '">' +
              (p.featured_image ? '<img class="pt-product-card__img" src="' + sized(p.featured_image, 800) + '" alt="' + escapeHTML(p.title) + '" loading="lazy" width="800" height="1000">' : '') +
              '</a></div>' +
              '<div class="pt-product-card__info"><h3 class="pt-product-card__title"><a href="' + p.url + '">' + escapeHTML(p.title) + '</a></h3>' +
              '<div class="pt-product-card__price"><p class="pt-price">' + money(p.price) + '</p></div></div></article>';
          }).join('');
          if (html) {
            rvGrid.innerHTML = html;
            rvSection.hidden = false;
          }
        });
      }
    } catch (e) { /* private mode — section stays hidden */ }
  }

  /* Initial cart count sync (silent) */
  if (document.querySelector('[data-cart-count]')) {
    fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartCounts(cart.item_count); })
      .catch(function () {});
  }

  /* ---------- Overlay header: frosted state on scroll ---------- */
  var headerOverlay = document.querySelector('[data-header-overlay]');
  if (headerOverlay) {
    var hovTicking = false;
    window.addEventListener('scroll', function () {
      if (hovTicking) return;
      hovTicking = true;
      window.requestAnimationFrame(function () {
        if (window.scrollY > 32) {
          headerOverlay.classList.add('pt-header--scrolled');
        } else {
          headerOverlay.classList.remove('pt-header--scrolled');
        }
        hovTicking = false;
      });
    }, { passive: true });
  }

  /* ---------- rAF-throttled scroll parallax (desktop, motion-safe only) ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var parallaxOK = !reduceMotion && window.matchMedia('(min-width: 750px)').matches && parallaxEls.length > 0;
  if (parallaxOK) {
    var parTicking = false;
    var updateParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var delta = (rect.top + rect.height / 2) - vh / 2;
        el.style.transform = 'translate3d(0,' + (-delta * speed).toFixed(1) + 'px,0)';
      });
      parTicking = false;
    };
    window.addEventListener('scroll', function () {
      if (!parTicking) {
        parTicking = true;
        window.requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
    window.addEventListener('resize', updateParallax);
    updateParallax();
  }

  /* ---------- Announcement bar: fade between messages ---------- */
  var annList = document.querySelector('[data-announcement-rotate]');
  if (annList) {
    var annItems = Array.prototype.slice.call(annList.querySelectorAll('.pt-announcement__item'));
    if (annItems.length > 1 && !reduceMotion) {
      annList.classList.add('is-rotating');
      var annIdx = 0;
      annItems[0].classList.add('is-active');
      window.setInterval(function () {
        annItems[annIdx].classList.remove('is-active');
        annIdx = (annIdx + 1) % annItems.length;
        annItems[annIdx].classList.add('is-active');
      }, 5200);
    }
  }

  /* ---------- Shop-the-look hotspots ---------- */
  function closeHotspots(except) {
    document.querySelectorAll('[data-hotspot].is-open').forEach(function (h) {
      if (h !== except) {
        h.classList.remove('is-open');
        h.setAttribute('aria-expanded', 'false');
      }
    });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-hotspot-popover]')) return;
    var hot = e.target.closest('[data-hotspot]');
    closeHotspots(hot);
    if (hot) {
      var willOpen = !hot.classList.contains('is-open');
      hot.classList.toggle('is-open', willOpen);
      hot.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeHotspots(null);
  });

  /* ---------- Wishlist (localStorage) ---------- */
  var WL_KEY = 'pt-wishlist';
  function wlGet() {
    try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function wlSet(list) {
    try { localStorage.setItem(WL_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
  }
  function wlUpdateCounts(n) {
    document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
      el.textContent = n;
      if (el.hasAttribute('hidden') || el.classList.contains('pt-cart-count')) {
        if (n > 0) { el.removeAttribute('hidden'); } else { el.setAttribute('hidden', ''); }
      }
    });
  }
  function wlSyncToggles() {
    var list = wlGet();
    document.querySelectorAll('[data-wishlist-toggle]').forEach(function (btn) {
      var on = list.indexOf(btn.getAttribute('data-wishlist-toggle')) !== -1;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    wlUpdateCounts(list.length);
  }
  function wlItemHTML(p, moveLabel, removeLabel) {
    var img = p.featured_image
      ? '<img src="' + sized(p.featured_image, 200) + '" alt="' + escapeHTML(p.title) + '" loading="lazy" width="200" height="200">'
      : '';
    var vid = (p.variants && p.variants.length) ? p.variants[0].id : null;
    return (
      '<div class="pt-cart-item">' +
        '<div class="pt-cart-item__media"><a href="' + p.url + '" aria-label="' + escapeHTML(p.title) + '">' + img + '</a></div>' +
        '<div>' +
          '<h3 class="pt-cart-item__title"><a href="' + p.url + '">' + escapeHTML(p.title) + '</a></h3>' +
          '<p class="pt-price">' + money(p.price) + '</p>' +
          '<div class="pt-wl-actions">' +
            (vid ? '<button type="button" class="pt-btn pt-btn--full" data-wishlist-move="' + vid + '" data-wl-handle="' + escapeHTML(p.handle) + '">' + escapeHTML(moveLabel) + '</button>' : '') +
            '<button type="button" class="pt-cart-item__remove" data-wishlist-remove="' + escapeHTML(p.handle) + '">' + escapeHTML(removeLabel) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }
  function renderWishlistDrawer() {
    var drawer = document.querySelector('[data-wishlist-drawer]');
    if (!drawer) return;
    var wrap = drawer.querySelector('[data-wishlist-items]');
    if (!wrap) return;
    var list = wlGet();
    wlUpdateCounts(list.length);
    if (!list.length) {
      wrap.innerHTML =
        '<div class="pt-cart-empty">' +
          '<h3 class="pt-h3">' + escapeHTML(drawer.getAttribute('data-empty-heading') || '') + '</h3>' +
          '<p class="pt-muted">' + escapeHTML(drawer.getAttribute('data-empty-text') || '') + '</p>' +
          '<p style="margin-top:2rem"><a class="pt-btn" href="/collections/all" data-drawer-close>' + escapeHTML(drawer.getAttribute('data-empty-cta') || '') + '</a></p>' +
        '</div>';
      return;
    }
    var moveLabel = drawer.getAttribute('data-move-to-cart') || '';
    var removeLabel = drawer.getAttribute('data-remove') || '';
    Promise.all(list.map(function (h) {
      return fetch('/products/' + encodeURIComponent(h) + '.js', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    })).then(function (products) {
      var valid = [];
      products.forEach(function (p, i) { if (p) valid.push(p); });
      var pruned = valid.map(function (p) { return p.handle; });
      if (pruned.length !== list.length) { wlSet(pruned); wlSyncToggles(); }
      wrap.innerHTML = valid.length
        ? valid.map(function (p) { return wlItemHTML(p, moveLabel, removeLabel); }).join('')
        : '<div class="pt-cart-empty"><h3 class="pt-h3">' + escapeHTML(drawer.getAttribute('data-empty-heading') || '') + '</h3></div>';
    });
  }
  function wlToggle(handle) {
    var list = wlGet();
    var i = list.indexOf(handle);
    if (i > -1) { list.splice(i, 1); } else { list.push(handle); }
    wlSet(list);
    wlSyncToggles();
    var drawer = document.getElementById('WishlistDrawer');
    if (drawer && drawer.classList.contains('is-open')) renderWishlistDrawer();
  }
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-wishlist-toggle]');
    if (toggle) { e.preventDefault(); wlToggle(toggle.getAttribute('data-wishlist-toggle')); return; }
    var opener = e.target.closest('[data-drawer-open]');
    if (opener && opener.getAttribute('data-drawer-open') === 'WishlistDrawer') { renderWishlistDrawer(); return; }
    var move = e.target.closest('[data-wishlist-move]');
    if (move) {
      e.preventDefault();
      var vid = parseInt(move.getAttribute('data-wishlist-move'), 10);
      var handle = move.getAttribute('data-wl-handle');
      move.setAttribute('disabled', '');
      fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: vid, quantity: 1 })
      })
        .then(function (r) { if (!r.ok) throw new Error('wl-move'); return r.json(); })
        .then(function () {
          var list = wlGet().filter(function (h) { return h !== handle; });
          wlSet(list); wlSyncToggles(); renderWishlistDrawer();
          return refreshCart();
        })
        .then(function () {
          var drawer = document.getElementById('WishlistDrawer');
          if (drawer) closeDrawer(drawer);
          openDrawer('CartDrawer');
        })
        .catch(function () { move.removeAttribute('disabled'); });
      return;
    }
    var remove = e.target.closest('[data-wishlist-remove]');
    if (remove) {
      e.preventDefault();
      var list = wlGet().filter(function (h) { return h !== remove.getAttribute('data-wishlist-remove'); });
      wlSet(list); wlSyncToggles(); renderWishlistDrawer();
    }
  });
  wlSyncToggles();

  /* ---------- Country / currency selector (Shopify Markets) ---------- */
  document.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-country-select]');
    if (sel && sel.form) sel.form.submit();
  });

  /* ---------- Gifting suite (cart drawer) ---------- */
  var giftSuite = document.querySelector('[data-gift-suite]');
  function giftWrapHandle() {
    return giftSuite ? (giftSuite.getAttribute('data-wrap-handle') || '') : '';
  }
  function giftHasWrap(cart) {
    var h = giftWrapHandle();
    if (!h) return false;
    for (var i = 0; i < (cart.items || []).length; i++) {
      if (cart.items[i].handle === h) return true;
    }
    return false;
  }
  function syncGiftSuite(cart) {
    if (!giftSuite || !cart) return;
    var toggle = giftSuite.querySelector('[data-gift-toggle]');
    var fields = giftSuite.querySelector('[data-gift-fields]');
    var message = giftSuite.querySelector('[data-gift-message]');
    var on = giftHasWrap(cart);
    if (toggle) toggle.checked = on;
    if (fields) fields.hidden = !on;
    if (message) message.value = (cart.attributes && cart.attributes['Gift message']) || '';
  }
  if (giftSuite) {
    var giftToggle = giftSuite.querySelector('[data-gift-toggle]');
    var giftFields = giftSuite.querySelector('[data-gift-fields]');
    var giftMessage = giftSuite.querySelector('[data-gift-message]');
    var giftTimer = null;
    if (giftToggle) {
      giftToggle.addEventListener('change', function () {
        var on = giftToggle.checked;
        if (giftFields) giftFields.hidden = !on;
        var handle = giftWrapHandle();
        if (!on) {
          fetch('/cart.js', { headers: { Accept: 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (cart) {
              var line = null;
              for (var i = 0; i < (cart.items || []).length; i++) {
                if (cart.items[i].handle === handle) { line = cart.items[i]; break; }
              }
              var p = line
                ? fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: line.key, quantity: 0 }) })
                : Promise.resolve();
              return p.then(function () {
                return fetch('/cart/update.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attributes: { 'Gift message': '' } }) });
              });
            })
            .then(refreshCart)
            .catch(function () { /* keep last state */ });
        } else if (handle) {
          fetch('/products/' + encodeURIComponent(handle) + '.js', { headers: { Accept: 'application/json' } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (p) {
              var vid = (p && p.variants && p.variants.length) ? p.variants[0].id : null;
              if (!vid) return null;
              return fetch('/cart.js', { headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); })
                .then(function (cart) {
                  if (giftHasWrap(cart)) return null;
                  return fetch('/cart/add.js', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ id: vid, quantity: 1, properties: { _gift: 'Signature gift wrap' } })
                  });
                });
            })
            .then(refreshCart)
            .catch(function () { /* keep last state */ });
        }
      });
    }
    if (giftMessage) {
      giftMessage.addEventListener('input', function () {
        if (giftTimer) clearTimeout(giftTimer);
        giftTimer = setTimeout(function () {
          fetch('/cart/update.js', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attributes: { 'Gift message': giftMessage.value } })
          }).catch(function () { /* silent */ });
        }, 800);
      });
    }
    fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(syncGiftSuite)
      .catch(function () { /* silent */ });
  }

  /* Public hook for section-scoped add-to-cart flows (e.g. main-product):
     refreshes the drawer contents, then opens it. */
  window.ptOpenCart = function () {
    refreshCart().then(function () { openDrawer('CartDrawer'); });
  };
})();
