/* Cabeçalho: sombra, esconder ao descer, menu mobile e indicação da seção ativa */
import { $, $$ } from "./utils.js";

export function iniciarNavegacao() {
  const header = $("[data-header]");
  const toggle = $(".nav-toggle");
  const nav = $("#menu-principal");
  const toTop = $(".to-top");
  let ultimoY = window.scrollY;
  let agendado = false;
  let parado = 0;
  const estado = {};
  /* Só mexe em uma classe quando o valor muda, para não forçar recálculo de estilo a cada quadro */
  const marcar = (el, classe, valor) => {
    if (!el || estado[classe] === valor) return;
    estado[classe] = valor;
    el.classList.toggle(classe, valor);
  };

  const atualizar = () => {
    agendado = false;
    const y = window.scrollY;
    marcar(header, "is-scrolled", y > 10);
    const descendo = y > ultimoY + 2 && y > 320;
    const subindo = y < ultimoY - 2;
    const menuAberto = nav?.classList.contains("is-open");
    if (descendo && !menuAberto && !header?.contains(document.activeElement)) marcar(header, "is-hidden", true);
    else if (subindo || y <= 320) marcar(header, "is-hidden", false);
    marcar(toTop, "is-visible", y > 700);
    ultimoY = y;
  };
  const aoRolar = () => {
    if (!agendado) { agendado = true; requestAnimationFrame(atualizar); }
    /* Barra de rolagem fica um pouco mais visível só enquanto a página está rolando */
    if (!parado) document.documentElement.classList.add("rolando");
    clearTimeout(parado);
    parado = setTimeout(() => { document.documentElement.classList.toggle("rolando", false); parado = 0; }, 900);
  };
  window.addEventListener("scroll", aoRolar, { passive: true });
  atualizar();
  header?.addEventListener("focusin", () => marcar(header, "is-hidden", false));

  toTop?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("cv:scrollto", { detail: { alvo: 0 } }));
    $("#conteudo")?.focus({ preventScroll: true });
  });

  if (toggle && nav) {
    const fechar = (devolverFoco) => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      nav.classList.remove("is-open");
      document.documentElement.classList.remove("menu-aberto");
      if (devolverFoco) toggle.focus();
    };
    toggle.addEventListener("click", () => {
      const abrir = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(abrir));
      toggle.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      nav.classList.toggle("is-open", abrir);
      document.documentElement.classList.toggle("menu-aberto", abrir);
      if (abrir) $("a", nav)?.focus();
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) fechar(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) fechar(true); });
    document.addEventListener("click", (e) => { if (nav.classList.contains("is-open") && !e.target.closest(".header")) fechar(false); });
    window.matchMedia("(min-width: 961px)").addEventListener("change", () => fechar(false));
  }

  /* Seção ativa na home (links do tipo /#sobre) */
  const todos = $$(".nav__link");
  const links = todos.filter((a) => {
    const u = new URL(a.href, location.href);
    return u.hash && u.pathname === location.pathname;
  });
  if (links.length && "IntersectionObserver" in window) {
    const inicio = todos.find((a) => a.dataset.nav === "inicio");
    const mapa = new Map(links.map((a) => [new URL(a.href).hash.slice(1), a]));
    const ativar = (link) => {
      todos.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
      if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", link === inicio ? "page" : "location"); }
    };
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => { if (en.isIntersecting) ativar(mapa.get(en.target.id) || inicio); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["inicio", ...mapa.keys()].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
}
