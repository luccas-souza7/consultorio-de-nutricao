/*
 * Elemento 3D do hero: limão (modelo CC0 da Poly Haven) renderizado com three.js.
 * Este módulo é carregado sob demanda, só em telas grandes, sem movimento reduzido
 * e depois que a página terminou de carregar. Se algo falhar, a imagem estática continua.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, HemisphereLight,
  PMREMGenerator, Box3, Vector3, Group, SRGBColorSpace, ACESFilmicToneMapping,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export async function iniciarHero3D(container, modelUrl, opcoes = {}) {
  const largura = () => container.clientWidth;
  const altura = () => container.clientHeight;

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(largura(), altura(), false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.domElement.className = "hero__3d-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.add(new AmbientLight(0xffffff, 0.15));
  scene.add(new HemisphereLight(0xdce8d2, 0x2f4f3a, 0.6));
  const sol = new DirectionalLight(0xfff4e0, 2.2);
  sol.position.set(3, 4, 5);
  scene.add(sol);

  const camera = new PerspectiveCamera(30, largura() / altura(), 0.01, 100);
  camera.position.set(0, 0, 4);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(modelUrl);

  /* Centraliza e ajusta a escala do modelo */
  const modelo = gltf.scene;
  const caixa = new Box3().setFromObject(modelo);
  const tamanho = caixa.getSize(new Vector3()).length();
  const centro = caixa.getCenter(new Vector3());
  modelo.position.sub(centro);
  const pivo = new Group();
  pivo.add(modelo);
  pivo.scale.setScalar(2.2 / tamanho);
  pivo.rotation.set(0.35, -0.6, 0.25);
  scene.add(pivo);

  container.appendChild(renderer.domElement);

  /* Interação: segue o ponteiro com suavidade */
  let alvoX = 0, alvoY = 0;
  const aoMover = (e) => {
    const r = container.getBoundingClientRect();
    alvoX = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
    alvoY = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
  };
  window.addEventListener("pointermove", aoMover, { passive: true });

  let rodando = true;
  let ultimo = performance.now();
  let tempo = 0;
  let quadro = 0;
  const loop = (agora) => {
    if (!rodando) return;
    requestAnimationFrame(loop);
    if (agora - ultimo < 32) return; // até 30 quadros por segundo: suave e leve para a bateria
    const dt = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    tempo += dt;
    pivo.rotation.y += dt * 0.35;
    pivo.rotation.x += ((0.35 + alvoY) - pivo.rotation.x) * 0.05;
    pivo.rotation.z += ((0.25 - alvoX * 0.4) - pivo.rotation.z) * 0.05;
    pivo.position.y = Math.sin(tempo * 1.2) * 0.06;
    renderer.render(scene, camera);
    if (++quadro === 2) container.classList.add("is-3d-ready");
  };

  const iniciar = () => { if (!rodando) { rodando = true; ultimo = performance.now(); requestAnimationFrame(loop); } };
  const parar = () => { rodando = false; };

  /* Pausa quando o hero sai da tela ou a aba fica oculta (economiza bateria) */
  const io = new IntersectionObserver(([en]) => (en.isIntersecting ? iniciar() : parar()));
  io.observe(container);
  document.addEventListener("visibilitychange", () => (document.hidden ? parar() : iniciar()));

  const redimensionar = () => {
    renderer.setSize(largura(), altura(), false);
    camera.aspect = largura() / altura();
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(redimensionar).observe(container);

  rodando = false;
  iniciar();

  if (opcoes.entrada) opcoes.entrada(renderer.domElement, pivo);
  return { parar };
}
