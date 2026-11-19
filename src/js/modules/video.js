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

/* Há aceleração de hardware? Em renderização por software o 3D pesaria demais: fica a imagem estática. */
function temGpu() {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const placa = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(placa);
  } catch { return false; }
}

/*
 * Elemento 3D: só em telas grandes, com GPU e sem movimento reduzido.
 * A imagem estática (renderizada do mesmo modelo) aparece de imediato; o three.js só é baixado
 * na primeira interação do visitante, depois que a página terminou de carregar.
 */
export function iniciar3D() {
  const box = $("[data-hero-3d]");
  if (!box || movimentoReduzido() || economiaDeDados()) return;
  if (!window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) return;
  const urlModelo = box.dataset.model;
  let iniciado = false;
  const eventos = ["pointermove", "scroll", "keydown", "touchstart"];
  const carregar = () => {
    if (iniciado) return;
    iniciado = true;
    eventos.forEach((ev) => window.removeEventListener(ev, carregar));
    if (!temGpu()) return;
    import("../hero-3d.js")
      .then((m) => m.iniciarHero3D(box, urlModelo))
      .catch(() => { /* sem WebGL: mantém a imagem */ });
  };
  const aguardarInteracao = () => eventos.forEach((ev) => window.addEventListener(ev, carregar, { once: true, passive: true }));
  if (document.readyState === "complete") aguardarInteracao();
  else window.addEventListener("load", aguardarInteracao, { once: true });
}
