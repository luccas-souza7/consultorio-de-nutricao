/* Caio Valente Nutrição (marca fictícia) | JavaScript puro, sem dependências. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Armazenamento seguro ---------- */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  };

  /* ---------- Cabeçalho com sombra ao rolar + voltar ao topo ---------- */
  var header = $(".header");
  var toTop = $(".to-top");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var skip = $("#conteudo");
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ---------- Menu hambúrguer ---------- */
  var toggle = $(".nav-toggle");
  var nav = $("#menu-principal");
  function closeMenu(returnFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    nav.classList.remove("is-open");
    if (returnFocus) toggle.focus();
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
      nav.classList.toggle("is-open", !open);
      if (!open) { var first = $("a, button", nav); if (first) first.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !e.target.closest(".header")) closeMenu(false);
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function () { closeMenu(false); });
  }

  /* ---------- Link ativo conforme a seção (scrollspy) ---------- */
  var spyLinks = $$('.nav__link[href^="#"]');
  if (spyLinks.length && "IntersectionObserver" in window) {
    var map = {};
    spyLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        var link = map[en.target.id];
        if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "location"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Modal de projeto demonstrativo ---------- */
  var modal = $("#modal-demo");
  var lastTrigger = null;
  function openModal(trigger) {
    if (!modal) return;
    lastTrigger = trigger || document.activeElement;
    if (typeof modal.showModal === "function") { modal.showModal(); }
    else { modal.setAttribute("open", ""); }
    var ok = $("[data-modal-ok]", modal);
    if (ok) ok.focus();
  }
  function closeModal() {
    if (!modal) return;
    if (typeof modal.close === "function") modal.close(); else modal.removeAttribute("open");
  }
  if (modal) {
    modal.addEventListener("close", function () { if (lastTrigger && lastTrigger.focus) lastTrigger.focus(); });
    $$("[data-modal-close]", modal).forEach(function (b) { b.addEventListener("click", closeModal); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-demo]");
    if (!t) return;
    e.preventDefault();
    openModal(t);
  });

  /* ---------- Contagem dos números ---------- */
  var counters = $$("[data-count]");
  function fmt(n, dec) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased, dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: .6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Cards de serviço expansíveis ---------- */
  $$(".svc__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(!open));
      btn.closest(".svc").classList.toggle("is-open", !open);
      if (panel) panel.hidden = open;
    });
  });

  /* ---------- Carrossel de depoimentos ---------- */
  $$("[data-carousel]").forEach(function (root) {
    var track = $(".carousel__track", root);
    var prev = $("[data-prev]", root);
    var next = $("[data-next]", root);
    var status = $("[data-carousel-status]", root);
    if (!track) return;
    var items = $$(".quote", track);

    function stepSize() {
      var first = items[0];
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return first.getBoundingClientRect().width + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 8;
      if (prev) prev.disabled = track.scrollLeft <= 8;
      if (next) next.disabled = track.scrollLeft >= max;
      var idx = Math.round(track.scrollLeft / stepSize());
      var visible = Math.max(1, Math.round(track.clientWidth / stepSize()));
      if (status) status.textContent = "Mostrando depoimentos " + (idx + 1) + " a " + Math.min(idx + visible, items.length) + " de " + items.length;
    }
    function go(dir) {
      track.scrollBy({ left: dir * stepSize(), behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    var t;
    track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(update, 80); }, { passive: true });
    window.addEventListener("resize", update);

    /* Arrasto com mouse (no toque, a rolagem nativa já permite arrastar) */
    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove("is-dragging");
        var s = stepSize();
        track.scrollTo({ left: Math.round(track.scrollLeft / s) * s, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
    track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    update();
  });

  /* ---------- Formulário do e-book ---------- */
  var form = $("#form-ebook");
  if (form) {
    var rules = {
      nome: function (v) { return v.trim().length >= 2 ? "" : "Informe seu nome (pelo menos 2 letras)."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido, por exemplo nome@exemplo.com."; },
      consentimento: function (v, el) { return el.checked ? "" : "Para receber o guia, marque a caixa de consentimento."; }
    };
    function validate(el) {
      var rule = rules[el.name];
      if (!rule) return true;
      var msg = rule(el.value, el);
      var err = document.getElementById("erro-" + el.name);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) { err.hidden = !msg; $("span", err).textContent = msg; }
      return !msg;
    }
    $$("input", form).forEach(function (el) {
      el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") validate(el); });
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validate(el); });
      el.addEventListener("change", function () { if (el.type === "checkbox") validate(el); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      $$("input", form).forEach(function (el) { if (!validate(el) && !firstInvalid) firstInvalid = el; });
      if (firstInvalid) { firstInvalid.focus(); return; }
      form.reset();
      $$("input", form).forEach(function (el) { el.removeAttribute("aria-invalid"); });
      openModal($('button[type="submit"]', form));
    });
  }

  /* ---------- Banner de cookies ---------- */
  var KEY = "cv-consentimento-cookies";
  var banner = $("#cookie-banner");
  if (banner) {
    if (!store.get(KEY)) banner.hidden = false;
    $$("[data-cookie]", banner).forEach(function (b) {
      b.addEventListener("click", function () {
        store.set(KEY, b.getAttribute("data-cookie") + "|" + new Date().toISOString().slice(0, 10));
        banner.hidden = true;
      });
    });
  }
  $$("[data-cookie-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { window.localStorage.removeItem(KEY); } catch (e) { /* sem armazenamento */ }
      if (banner) { banner.hidden = false; var f = $("button", banner); if (f) f.focus(); }
    });
  });

  /* ---------- Revelação suave ao rolar ---------- */
  var reveals = $$(".reveal");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); rio.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
      reveals.forEach(function (el) { rio.observe(el); });
    }
  }
})();
