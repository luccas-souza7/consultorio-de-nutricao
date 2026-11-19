/* Componentes interativos: carrossel, FAQ animado, cards de serviço, cookies e YouTube leve */
import { $, $$, movimentoReduzido, armazenamento } from "./utils.js";

/* ---------- Carrossel com setas, teclado, arrasto e barra de progresso ---------- */
export function iniciarCarrosseis() {
  $$("[data-carousel]").forEach((raiz) => {
    const trilho = $(".carousel__track", raiz);
    const ant = $("[data-prev]", raiz);
    const prox = $("[data-next]", raiz);
    const status = $("[data-carousel-status]", raiz);
    const barra = $("[data-carousel-bar]", raiz);
    if (!trilho) return;
    const itens = Array.from(trilho.children);
    const comportamento = () => (movimentoReduzido() ? "auto" : "smooth");

    const passo = () => {
      const primeiro = itens[0];
      if (!primeiro) return trilho.clientWidth;
      const gap = parseFloat(getComputedStyle(trilho).columnGap) || 16;
      return primeiro.getBoundingClientRect().width + gap;
    };
    const atualizar = () => {
      const max = trilho.scrollWidth - trilho.clientWidth;
      if (ant) ant.disabled = trilho.scrollLeft <= 8;
      if (prox) prox.disabled = trilho.scrollLeft >= max - 8;
      const visiveis = Math.max(1, Math.round(trilho.clientWidth / passo()));
      const idx = Math.round(trilho.scrollLeft / passo());
      if (barra) {
        barra.style.width = `${Math.min(100, (visiveis / itens.length) * 100)}%`;
        barra.style.transform = `translateX(${max > 0 ? (trilho.scrollLeft / max) * ((itens.length - visiveis) / visiveis) * 100 : 0}%)`;
      }
      if (status) status.textContent = `Mostrando ${idx + 1} a ${Math.min(idx + visiveis, itens.length)} de ${itens.length}`;
    };
    const ir = (dir) => trilho.scrollBy({ left: dir * passo(), behavior: comportamento() });
    ant?.addEventListener("click", () => ir(-1));
    prox?.addEventListener("click", () => ir(1));
    trilho.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); ir(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); ir(-1); }
    });
    let t;
    trilho.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(atualizar, 60); }, { passive: true });
    window.addEventListener("resize", atualizar);

    /* Arrasto com mouse (no toque, a rolagem nativa já permite arrastar) */
    let pressionado = false, x0 = 0, inicio = 0, moveu = false;
    trilho.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pressionado = true; moveu = false; x0 = e.clientX; inicio = trilho.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!pressionado) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) { moveu = true; trilho.classList.add("is-dragging"); }
      if (moveu) trilho.scrollLeft = inicio - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!pressionado) return;
      pressionado = false;
      if (moveu) {
        trilho.classList.remove("is-dragging");
        const p = passo();
        trilho.scrollTo({ left: Math.round(trilho.scrollLeft / p) * p, behavior: comportamento() });
      }
    });
    trilho.addEventListener("click", (e) => { if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; } }, true);
    atualizar();
  });
}

/* ---------- Animação de altura (abrir e fechar) ---------- */
function animarAltura(el, de, para, aoFim) {
  if (movimentoReduzido() || !el.animate) { aoFim?.(); return; }
  el.style.overflow = "hidden";
  const anim = el.animate([{ height: `${de}px` }, { height: `${para}px` }], { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" });
  anim.onfinish = () => { el.style.overflow = ""; aoFim?.(); };
  return anim;
}

/* ---------- FAQ: <details> nativo com animação ---------- */
export function iniciarFaq() {
  $$("[data-faq]").forEach((det) => {
    const sumario = $("summary", det);
    let anim = null;
    sumario.addEventListener("click", (e) => {
      if (movimentoReduzido() || !det.animate) return; // comportamento nativo
      e.preventDefault();
      anim?.cancel();
      const altFechado = sumario.offsetHeight;
      if (det.open) {
        const de = det.offsetHeight;
        det.classList.add("is-closing");
        anim = animarAltura(det, de, altFechado, () => { det.open = false; det.classList.remove("is-closing"); det.style.height = ""; });
      } else {
        const de = det.offsetHeight;
        det.open = true;
        const para = det.offsetHeight;
        anim = animarAltura(det, de, para, () => { det.style.height = ""; });
      }
    });
  });
}

/* ---------- Cards de serviço expansíveis ---------- */
export function iniciarServicos() {
  $$(".svc__btn").forEach((btn) => {
    const painel = document.getElementById(btn.getAttribute("aria-controls"));
    const card = btn.closest(".svc");
    btn.addEventListener("click", () => {
      const abrir = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(abrir));
      card.classList.toggle("is-open", abrir);
      if (!painel) return;
      if (abrir) {
        painel.hidden = false;
        animarAltura(painel, 0, painel.scrollHeight);
      } else {
        animarAltura(painel, painel.scrollHeight, 0, () => { painel.hidden = true; });
      }
    });
  });
}

/* ---------- Banner de cookies ---------- */
export function iniciarCookies() {
  const CHAVE = "cv-consentimento-cookies";
  const banner = $("#cookie-banner");
  if (banner && !armazenamento.ler(CHAVE)) banner.hidden = false;
  $$("[data-cookie]", banner || document).forEach((b) => b.addEventListener("click", () => {
    armazenamento.gravar(CHAVE, `${b.dataset.cookie}|${new Date().toISOString().slice(0, 10)}`);
    banner.hidden = true;
  }));
  $$("[data-cookie-reset]").forEach((b) => b.addEventListener("click", () => {
    armazenamento.apagar(CHAVE);
    if (banner) { banner.hidden = false; $("button", banner)?.focus(); }
  }));
}

/* ---------- YouTube leve: troca a capa pelo player só no clique ---------- */
export function iniciarYoutube() {
  $$("[data-yt]").forEach((link) => link.addEventListener("click", (e) => {
    e.preventDefault();
    const id = link.dataset.yt;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = link.querySelector(".sr-only")?.textContent || "Vídeo do YouTube";
    iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.className = "yt-lite__frame";
    link.replaceWith(iframe);
    iframe.focus();
  }));
}

/* ---------- Copiar link do artigo ---------- */
export function iniciarCompartilhar() {
  $$("[data-copiar]").forEach((b) => b.addEventListener("click", async () => {
    const aviso = $("[data-copiar-status]");
    try {
      await navigator.clipboard.writeText(b.dataset.copiar);
      b.classList.add("is-done");
      const rotuloOriginal = b.getAttribute("aria-label");
      b.setAttribute("aria-label", "Link copiado");
      if (aviso) aviso.textContent = "Link do artigo copiado.";
      setTimeout(() => { b.setAttribute("aria-label", rotuloOriginal); b.classList.toggle("is-done", false); }, 2200);
    } catch { window.prompt("Copie o link:", b.dataset.copiar); }
  }));
}

/* ---------- Sumário do artigo: destaca a seção que está sendo lida ---------- */
export function iniciarSumario() {
  const links = $$(".toc__item a");
  if (!links.length || !("IntersectionObserver" in window)) return;
  const mapa = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-active", false));
      mapa.get(en.target.id)?.classList.add("is-active");
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  mapa.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
}
