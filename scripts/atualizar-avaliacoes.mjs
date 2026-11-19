/*
 * Atualiza src/_data/avaliacoes.json com as avaliações reais do Perfil da Empresa no Google,
 * usando a Google Places API (New): https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 * Requer duas variáveis de ambiente (no GitHub: Settings > Secrets and variables > Actions):
 *   GOOGLE_PLACES_API_KEY  chave da API com a "Places API (New)" ativada
 *   GOOGLE_PLACE_ID        ID do local (encontre em https://developers.google.com/maps/documentation/places/web-service/place-id)
 *
 * Sem essas variáveis o script não faz nada, e o site continua com as avaliações demonstrativas.
 * A API devolve no máximo 5 avaliações por consulta, além da nota média e do total.
 */
import fs from "node:fs";

const CHAVE = process.env.GOOGLE_PLACES_API_KEY;
const LOCAL = process.env.GOOGLE_PLACE_ID;
const ARQUIVO = "src/_data/avaliacoes.json";

if (!CHAVE || !LOCAL) {
  console.log("Integração com o Google não configurada: mantendo as avaliações atuais.");
  process.exit(0);
}

const resp = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(LOCAL)}?languageCode=pt-BR`, {
  headers: {
    "X-Goog-Api-Key": CHAVE,
    "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks",
  },
});
if (!resp.ok) {
  console.error(`Erro na Places API: ${resp.status} ${await resp.text()}`);
  process.exit(1);
}
const local = await resp.json();
const atual = JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));

const itens = (local.reviews || []).map((r) => ({
  nome: r.authorAttribution?.displayName || "Usuário do Google",
  url: r.authorAttribution?.uri || "",
  foto: r.authorAttribution?.photoUri || "",
  data: (r.publishTime || "").slice(0, 10),
  relativo: r.relativePublishTimeDescription || "",
  nota: r.rating || 5,
  texto: r.text?.text || r.originalText?.text || "",
})).filter((r) => r.texto);

const novo = {
  fonte: "google",
  aviso: "",
  nota: local.rating ?? atual.nota,
  total: local.userRatingCount ?? atual.total,
  urlPerfil: local.googleMapsUri || "",
  urlAvaliar: local.googleMapsLinks?.writeAReviewUri || "",
  atualizadoEm: new Date().toISOString().slice(0, 10),
  itens: itens.length ? itens : atual.itens,
};
fs.writeFileSync(ARQUIVO, JSON.stringify(novo, null, 2) + "\n");
console.log(`Avaliações atualizadas: nota ${novo.nota}, ${novo.total} avaliações, ${itens.length} comentários.`);
