/*
 * Animações do site com GSAP (ScrollTrigger + SplitText) e rolagem suave com Lenis.
 * Tudo fica dentro de gsap.matchMedia: com "reduzir movimento" ativo, nada anima e o conteúdo aparece direto.
 * O CSS só esconde os elementos animáveis quando <html> tem a classe "anim" (colocada no <head>).
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
import { $, $$ } from "./utils.js";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("suave", "0.22, 1, 0.36, 1");

const html = document.documentElement;
let lenis = null;

/* ---------- Rolagem: Lenis no desktop, nativa no resto. Âncoras com desconto do cabeçalho ---------- */
function alturaHeader() {
  const h = $("[data-header]");
  return h ? h.getBoundingClientRect().height + 12 : 0;
}

function rolarPara(alvo) {
  if (typeof alvo === "number") {
    if (lenis) lenis.scrollTo(alvo); else window.scrollTo({ top: alvo, behavior: "smooth" });
    return;
  }
  if (lenis) {
    /* Atualiza as medidas da página (imagens e títulos podem ter mudado a altura) e rola até a posição exata */
    lenis.resize();
    const destino = alvo.getBoundingClientRect().top + window.scrollY - alturaHeader();
    lenis.scrollTo(Math.max(0, destino));
  } else alvo.scrollIntoView({ behavior: "smooth", block: "start" });
}

function iniciarRolagem(permitirLenis) {
  if (permitirLenis) {
    /* lerp baixo: responde na hora e desacelera suave, sem a sensação de "arrasto" */
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    html.classList.add("lenis-ativo");
  }
  /* Links internos com âncora na mesma página */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href*='#']");
    if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const alvo = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!alvo) return;
    e.preventDefault();
    rolarPara(alvo);
    history.pushState(null, "", url.hash);
    alvo.setAttribute("tabindex", alvo.getAttribute("tabindex") || "-1");
    alvo.focus({ preventScroll: true });
  });
  window.addEventListener("cv:scrollto", (e) => rolarPara(e.detail.alvo));
  /* Chegou de outra página com #ancora: ajusta depois do layout */
  if (location.hash) {
    const alvo = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (alvo) requestAnimationFrame(() => window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY - alturaHeader(), behavior: "instant" }));
  }
}

/* ---------- Contadores ---------- */
function contadores() {
  $$("[data-count]").forEach((el) => {
    const alvo = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const pre = el.dataset.prefix || "";
    const fmt = (n) => pre + n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const obj = { v: 0 };
    gsap.to(obj, {
      v: alvo, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => { el.textContent = fmt(obj.v); },
      onComplete: () => { el.textContent = fmt(alvo); },
    });
  });
}

/* ---------- Títulos revelados por linhas (máscara) ---------- */
function dividir(el, atraso = 0) {
  SplitText.create(el, {
    type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
    onSplit(self) {
      gsap.set(el, { opacity: 1 });
      return gsap.from(self.lines, { yPercent: 110, duration: 1, ease: "suave", stagger: 0.09, delay: atraso });
    },
  });
}
function titulos() {
  $$("[data-split='lines']").forEach((el) => {
    const topo = el.closest(".hero, .page-hero, .post-hero");
    if (topo) { dividir(el, 0.2); return; }
    /* Os demais títulos só são divididos quando chegam perto da tela (menos trabalho no carregamento) */
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => dividir(el) });
  });
}

/* ---------- Abertura da página ---------- */
function abertura() {
  const tl = gsap.timeline({ defaults: { ease: "suave" } });
  /* Só o conteúdo do cabeçalho entra animado; o cabeçalho fixo nunca recebe transform do GSAP */
  const conteudoHeader = $(".header__inner");
  if (conteudoHeader) tl.fromTo(conteudoHeader, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.7, clearProps: "transform" }, 0);
  const poster = $(".hero__media");
  if (poster) tl.fromTo(poster, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "power2.out" }, 0);
  const itens = $$("[data-hero-item]");
  if (itens.length) tl.fromTo(itens, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.45);
  const base = $(".hero__bottom");
  if (base) tl.fromTo(base, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.9);
  /* Páginas internas: o cabeçalho da página entra suave */
  const topo = $$(".page-hero [data-hero-item]");
  if (topo.length) tl.fromTo(topo, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.15);
}

/* ---------- Entradas ao rolar ---------- */
function entradas() {
  $$("[data-reveal]").forEach((el) => {
    gsap.fromTo(el, { y: 26, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: "suave",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
  gsap.set("[data-reveal-card]", { y: 44, opacity: 0 });
  ScrollTrigger.batch("[data-reveal-card]", {
    start: "top 92%", once: true,
    onEnter: (lote) => gsap.to(lote, { y: 0, opacity: 1, duration: 0.9, ease: "suave", stagger: 0.09, overwrite: true }),
  });
  $$("[data-reveal-image]").forEach((el) => {
    const img = $("img, iframe", el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    tl.fromTo(el, { clipPath: "inset(14% 10% 14% 10% round 24px)", opacity: 0 }, { clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1, duration: 1.3, ease: "suave" });
    if (img && img.tagName === "IMG") tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: "suave" }, 0);
  });
}

/* ---------- Movimento contínuo e parallax ---------- */
function movimento() {
  $$("[data-parallax]").forEach((el) => {
    const forca = parseFloat(el.dataset.parallax) || 10;
    gsap.fromTo(el, { yPercent: -forca / 2 }, {
      yPercent: forca / 2, ease: "none",
      scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  /* Flutuação suave: só roda enquanto o elemento está na tela */
  $$("[data-float]").forEach((el, i) => {
    const anim = gsap.to(el, { y: -12, rotation: i % 2 ? 1.5 : -1.5, duration: 3.2 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true });
    ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => (self.isActive ? anim.play() : anim.pause()) });
  });
  const hero = $(".hero");
  if (hero) {
    const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero__media", { yPercent: 10, ease: "none", scrollTrigger: st });
    gsap.to(".hero__inner", { yPercent: -8, opacity: 0.25, ease: "none", scrollTrigger: st });
  }
  /* Linha do passo a passo se desenha conforme a rolagem */
  const passos = $("[data-steps]");
  if (passos) {
    gsap.fromTo(passos, { "--progresso": 0 }, {
      "--progresso": 1, ease: "none",
      scrollTrigger: { trigger: passos, start: "top 80%", end: "bottom 55%", scrub: 0.6 },
    });
    gsap.from($$(".step__num", passos), {
      scale: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.15,
      scrollTrigger: { trigger: passos, start: "top 82%", once: true },
    });
  }
}

/* ---------- Botões magnéticos (só com mouse) ---------- */
function magneticos() {
  $$("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

export function iniciarAnimacoes() {
  const mm = gsap.matchMedia();
  mm.add({
    animar: "(prefers-reduced-motion: no-preference)",
    reduzir: "(prefers-reduced-motion: reduce)",
    mouse: "(pointer: fine) and (min-width: 1024px)",
  }, (ctx) => {
    const { animar, mouse } = ctx.conditions;
    if (!animar) { html.classList.remove("anim"); return; }
    abertura();
    titulos();
    entradas();
    movimento();
    contadores();
    if (mouse) magneticos();
  });
  iniciarRolagem(window.matchMedia("(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 1024px)").matches);
  html.classList.add("anim-ok");
  /* Recalcula posições depois que fontes e imagens terminam de carregar */
  window.addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
