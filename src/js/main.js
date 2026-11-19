/* Caio Valente Nutrição (marca fictícia) | ponto de entrada do JavaScript */
import { iniciarNavegacao } from "./modules/nav.js";
import { iniciarVideoHero, iniciar3D } from "./modules/video.js";
import { iniciarCarrosseis, iniciarFaq, iniciarServicos, iniciarCookies, iniciarYoutube, iniciarCompartilhar } from "./modules/componentes.js";
import { iniciarAnimacoes } from "./modules/animacoes.js";

const etapas = [iniciarNavegacao, iniciarCookies, iniciarCarrosseis, iniciarFaq, iniciarServicos, iniciarYoutube, iniciarCompartilhar, iniciarVideoHero, iniciarAnimacoes, iniciar3D];
for (const etapa of etapas) {
  try { etapa(); } catch (erro) { console.warn(`[site] ${etapa.name}:`, erro); }
}
