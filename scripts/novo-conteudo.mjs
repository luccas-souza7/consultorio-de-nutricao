/*
 * Converte o formulário "Novo artigo" ou "Nova receita" (Issue do GitHub) em um arquivo Markdown do blog.
 *
 * Uso no GitHub Actions (automático):  node scripts/novo-conteudo.mjs
 *   Lê ISSUE_BODY, ISSUE_TITLE, ISSUE_NUMBER e GITHUB_TOKEN das variáveis de ambiente.
 * Uso local (para testar):  node scripts/novo-conteudo.mjs exemplo-issue.md "Novo artigo: Título" 123
 *
 * O que faz:
 *  1. separa os campos do formulário;
 *  2. baixa a imagem de capa (e as imagens do texto), reduz para no máximo 1600 px e salva em WebP;
 *  3. cria (ou atualiza, se a mesma issue for editada) src/blog/posts/<slug>.md.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PASTA_POSTS = "src/blog/posts";
const PASTA_IMAGENS = "src/assets/img/blog";
const categorias = JSON.parse(fs.readFileSync("src/_data/categorias.json", "utf8"));

const [arqCorpo, tituloArg, numeroArg] = process.argv.slice(2);
const corpo = arqCorpo ? fs.readFileSync(arqCorpo, "utf8") : process.env.ISSUE_BODY || "";
const tituloIssue = tituloArg || process.env.ISSUE_TITLE || "";
const numeroIssue = Number(numeroArg || process.env.ISSUE_NUMBER || 0);
if (!corpo.trim()) { console.error("Formulário vazio."); process.exit(1); }

/* ---------- 1. Campos do formulário (formato "### Rótulo" + valor) ---------- */
const ROTULOS = {
  "Título": "titulo", "Nome da receita": "titulo", "Resumo (descrição)": "resumo", "Categoria": "categoria",
  "Data de publicação": "data", "Imagem de capa": "capa", "Foto da receita": "capa",
  "Descrição da imagem (texto alternativo)": "capa_alt", "Descrição da foto (texto alternativo)": "capa_alt",
  "Texto do artigo": "conteudo", "Texto de introdução (opcional)": "conteudo",
  "Título para o Google (opcional)": "seo_titulo", "Palavras-chave (opcional)": "palavras_chave",
  "Tempo de preparo (em minutos)": "tempo", "Rendimento": "rendimento", "Dificuldade": "dificuldade",
  "Tipo de prato": "tipo_prato", "Ingredientes": "ingredientes", "Modo de preparo": "preparo",
  "Dica do nutricionista (opcional)": "dica", "Confirmações": "confirmacoes",
};
const campos = {};
const partes = corpo.replace(/\r\n/g, "\n").split(/^### /m).slice(1);
for (const parte of partes) {
  const quebra = parte.indexOf("\n");
  const rotulo = parte.slice(0, quebra).trim();
  let valor = parte.slice(quebra + 1).trim();
  if (valor === "_No response_" || valor === "None") valor = "";
  valor = valor.replace(/^```(?:markdown)?\n([\s\S]*?)\n```$/, "$1").trim();
  if (ROTULOS[rotulo]) campos[ROTULOS[rotulo]] = valor;
}
const ehReceita = "ingredientes" in campos || /^nova receita/i.test(tituloIssue);

/* ---------- Validações ---------- */
const obrigatorios = ehReceita
  ? ["titulo", "resumo", "capa", "capa_alt", "ingredientes", "preparo"]
  : ["titulo", "resumo", "categoria", "capa", "capa_alt", "conteudo"];
const faltando = obrigatorios.filter((c) => !campos[c]);
if (faltando.length) { console.error(`Campos obrigatórios vazios: ${faltando.join(", ")}`); process.exit(1); }

/* ---------- Utilidades ---------- */
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");
/* Impede que o texto do formulário seja interpretado como código de template */
const neutralizar = (s) => String(s).replace(/\{([{%#])/g, "&#123;$1");
const yaml = (v) => JSON.stringify(v);
const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
function lerData(txt) {
  const m = String(txt || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return hoje();
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/* Arquivo existente para a mesma issue (edição) ou slug novo e único */
function definirSlug(titulo) {
  if (numeroIssue) {
    for (const f of fs.readdirSync(PASTA_POSTS)) {
      if (!f.endsWith(".md")) continue;
      const txt = fs.readFileSync(path.join(PASTA_POSTS, f), "utf8");
      if (new RegExp(`^issue: ${numeroIssue}$`, "m").test(txt)) return f.replace(/\.md$/, "");
    }
  }
  const base = slugify(titulo) || `artigo-${Date.now()}`;
  let slug = base, n = 2;
  while (fs.existsSync(path.join(PASTA_POSTS, `${slug}.md`))) slug = `${base}-${n++}`;
  return slug;
}

/* ---------- 2. Imagens ---------- */
const URL_IMAGEM = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)|<img[^>]+src="(https?:\/\/[^"]+)"[^>]*>/g;
async function baixarImagem(url, nome) {
  const cabecalhos = {};
  if (process.env.GITHUB_TOKEN && /github(usercontent)?\.com/.test(new URL(url).hostname)) {
    cabecalhos.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const resp = await fetch(url, { headers: cabecalhos, redirect: "follow" });
  if (!resp.ok) throw new Error(`Não foi possível baixar a imagem (${resp.status}): ${url}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.mkdirSync(PASTA_IMAGENS, { recursive: true });
  const destino = path.join(PASTA_IMAGENS, `${nome}.webp`);
  await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(destino);
  return "/" + destino.replace(/^src\//, "").split(path.sep).join("/");
}
async function imagensDoTexto(texto, slug) {
  let i = 1;
  const trocas = [];
  for (const m of texto.matchAll(URL_IMAGEM)) {
    const url = m[1] || m[2];
    const alt = (m[0].match(/!\[([^\]]*)\]/) || m[0].match(/alt="([^"]*)"/) || [])[1] || "Imagem do artigo";
    const local = await baixarImagem(url, `${slug}-${i++}`);
    trocas.push([m[0], `![${alt}](${local})`]);
  }
  for (const [de, para] of trocas) texto = texto.replace(de, para);
  return texto;
}
/* Link do YouTube sozinho em uma linha vira vídeo incorporado (carregamento leve) */
const youtube = (texto) => texto.replace(
  /^[ \t]*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})\S*[ \t]*$/gm,
  (_, id) => `\n{% youtube "${id}", "Vídeo do YouTube" %}\n`,
);

/* ---------- 3. Montagem do arquivo ---------- */
const titulo = campos.titulo.trim();
const slug = definirSlug(titulo);
const capaUrl = (campos.capa.match(/https?:\/\/[^)\s"]+/) || [])[0];
if (!capaUrl) { console.error("Nenhuma imagem de capa encontrada no formulário."); process.exit(1); }
const capa = await baixarImagem(capaUrl, slug);

const categoria = ehReceita
  ? "receitas"
  : (categorias.find((c) => c.nome.toLowerCase() === campos.categoria.trim().toLowerCase()) || { slug: "nutricao" }).slug;

const fm = [
  "---",
  `title: ${yaml(titulo)}`,
  `description: ${yaml(campos.resumo.replace(/\s+/g, " ").trim())}`,
  `date: ${lerData(campos.data)}`,
  `categoria: ${categoria}`,
  `capa: ${capa}`,
  `capa_alt: ${yaml(campos.capa_alt.trim())}`,
  "autor: Caio Valente",
];
if (campos.seo_titulo) fm.push(`seo_titulo: ${yaml(campos.seo_titulo.trim())}`);
if (campos.palavras_chave) fm.push(`palavras_chave: ${yaml(campos.palavras_chave.split(",").map((s) => s.trim()).filter(Boolean))}`);

if (ehReceita) {
  const minutos = parseInt(campos.tempo, 10) || 30;
  const grupos = [];
  for (const linha of campos.ingredientes.split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean)) {
    if (/:$/.test(linha)) grupos.push({ grupo: linha.slice(0, -1), itens: [] });
    else { if (!grupos.length) grupos.push({ grupo: "", itens: [] }); grupos[grupos.length - 1].itens.push(neutralizar(linha)); }
  }
  const passos = campos.preparo.split("\n").map((l) => l.replace(/^(\d+[.)]|[-*])\s*/, "").trim()).filter(Boolean).map(neutralizar);
  fm.push(
    `tipo_prato: ${yaml(campos.tipo_prato || "Prato principal")}`,
    `tempo: ${yaml(minutos >= 60 && minutos % 60 === 0 ? `${minutos / 60} hora${minutos > 60 ? "s" : ""}` : `${minutos} minutos`)}`,
    `tempo_minutos: ${minutos}`,
    `rendimento: ${yaml(campos.rendimento)}`,
    `dificuldade: ${yaml(campos.dificuldade || "Fácil")}`,
    `ingredientes: ${yaml(grupos)}`,
    `preparo: ${yaml(passos)}`,
  );
  if (campos.dica) fm.push(`dica: ${yaml(neutralizar(campos.dica.replace(/\s+/g, " ").trim()))}`);
}
if (numeroIssue) fm.push(`issue: ${numeroIssue}`);
fm.push("---", "");

let texto = neutralizar(campos.conteudo || "");
texto = await imagensDoTexto(texto, slug);
texto = youtube(texto);

const destino = path.join(PASTA_POSTS, `${slug}.md`);
fs.writeFileSync(destino, fm.join("\n") + texto.trim() + "\n");
console.log(`Arquivo gerado: ${destino}`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\narquivo=${destino}\ntitulo=${titulo.replace(/\n/g, " ")}\n`);
}
