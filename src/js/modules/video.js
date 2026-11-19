/* Vídeo de fundo do hero e elemento 3D */
import { $, movimentoReduzido, economiaDeDados } from "./utils.js";

/* Escolhe a melhor fonte, respeita movimento reduzido e economia de dados */
export function iniciarVideoHero() {
  const video = $("[data-hero-video]");
  const botao = $("[data-video-toggle]");
  if (!video) return;
  if (movimentoReduzido() || economiaDeDados()) return; // fica só a imagem estática

  const celular = window.matchMedia("(max-width: 700px)").matches;
  const fonte = celular ? video.dataset.mp4Mobile
    : (video.canPlayType('video/webm; codecs="vp9"') ? video.dataset.webm : video.dataset.mp4);
  video.src = fonte;
  video.preload = "auto";

  let pausadoPeloUsuario = false;
  const atualizarBotao = () => {
    botao?.setAttribute("aria-pressed", String(video.paused));
    botao?.classList.toggle("is-paused", video.paused);
  };
  const tocar = () => video.play().then(() => {
    video.closest(".hero")?.classList.add("is-video-playing");
    atualizarBotao();
  }).catch(() => { /* autoplay bloqueado: fica a imagem */ });

  video.addEventListener("canplay", () => { if (!pausadoPeloUsuario) tocar(); }, { once: true });
  video.addEventListener("pause", atualizarBotao);
  video.addEventListener("play", atualizarBotao);

  if (botao) {
    botao.hidden = false;
    botao.addEventListener("click", () => {
      if (video.paused) { pausadoPeloUsuario = false; tocar(); } else { pausadoPeloUsuario = true; video.pause(); }
    });
  }
  /* Pausa quando sai da tela */
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { if (!pausadoPeloUsuario && video.readyState > 2) video.play().catch(() => {}); }
    else video.pause();
  }, { threshold: 0.05 }).observe(video);
}

/* Elemento 3D: carregado depois do load, só em telas grandes e sem movimento reduzido */
export function iniciar3D() {
  const box = $("[data-hero-3d]");
  if (!box || movimentoReduzido() || economiaDeDados()) return;
  if (!window.matchMedia("(min-width: 1024px)").matches) return;
  const urlModelo = box.dataset.model;
  const carregar = () => import("../hero-3d.js")
    .then((m) => m.iniciarHero3D(box, urlModelo))
    .catch(() => { /* sem WebGL: mantém a imagem */ });
  const quandoOcioso = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  if (document.readyState === "complete") quandoOcioso(carregar);
  else window.addEventListener("load", () => quandoOcioso(carregar), { once: true });
}
