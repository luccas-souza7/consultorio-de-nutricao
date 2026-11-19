// Configuração do Eleventy: Caio Valente Nutrição (projeto fictício de portfólio, LS Luccas Souza)
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownItAnchor from "markdown-it-anchor";

const PATH_PREFIX = process.env.PATH_PREFIX || "/";
/* URL pública completa (sem barra final), usada em canonical, Open Graph, sitemap e JSON-LD */
const SITE_URL = (process.env.SITE_URL || "https://luccas-souza7.github.io/consultorio-de-nutricao").replace(/\/$/, "");
const ICONS_DIR = "node_modules/lucide-static/icons";
const iconCache = new Map();

/* Converte texto em slug para URLs e âncoras (sem acentos) */
function slugify(str = "") {
  return String(str)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* Ícone Lucide embutido como SVG (lido do pacote na hora do build) */
function icon(name, cls = "ico") {
  if (!iconCache.has(name)) {
    const file = path.join(ICONS_DIR, `${name}.svg`);
    if (!fs.existsSync(file)) throw new Error(`Ícone não encontrado: ${name}`);
    const svg = fs.readFileSync(file, "utf8");
    const inner = svg.replace(/<!--[\s\S]*?-->/g, "").match(/>([\s\S]*)<\/svg>/)[1].replace(/\s+/g, " ").trim();
    iconCache.set(name, inner);
  }
  return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconCache.get(name)}</svg>`;
}

const SITE = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));

const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

export default function (eleventyConfig) {
  /* ---------- Plugins ---------- */
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp"],
    widths: [400, 800, 1200],
    urlPath: "/assets/img/otimizadas/",
    outputDir: "./_site/assets/img/otimizadas/",
    sharpWebpOptions: { quality: 76 },
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(max-width: 700px) 100vw, 50vw" },
    },
  });
  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: { name: "posts", limit: 20 },
    metadata: {
      language: "pt-BR",
      title: "Blog Caio Valente Nutrição (projeto fictício)",
      subtitle: "Artigos e receitas sobre alimentação saudável.",
      base: SITE_URL + "/",
      author: { name: "Caio Valente (personagem fictício)" },
    },
  });

  /* ---------- Markdown com âncoras nos títulos (sumário automático) ---------- */
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ typographer: false });
    md.use(markdownItAnchor, { slugify, level: [2, 3], tabIndex: false });
  });

  /* ---------- Arquivos copiados sem processamento ---------- */
  eleventyConfig.addPassthroughCopy({ "src/assets/video": "assets/video" });
  eleventyConfig.addPassthroughCopy({ "src/assets/models": "assets/models" });
  eleventyConfig.addPassthroughCopy({ "src/assets/ebook": "assets/ebook" });
  eleventyConfig.addPassthroughCopy({ "src/assets/icons": "assets/icons" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });

  /* ---------- CSS e JS empacotados com esbuild antes de cada build ---------- */
  eleventyConfig.on("eleventy.before", async () => {
    await esbuild.build({
      entryPoints: { main: "src/js/main.js" },
      bundle: true, splitting: true, format: "esm", minify: true, sourcemap: false,
      target: ["es2020"], outdir: "_site/assets/js", chunkNames: "chunks/[name]-[hash]",
      legalComments: "none",
    });
    await esbuild.build({
      entryPoints: { main: "src/css/main.css", "design-system": "src/css/design-system.css", ebook: "src/css/ebook.css" },
      bundle: true, minify: true, outdir: "_site/assets/css", external: ["*.svg", "*.webp", "*.woff2"], logLevel: "error",
    });
  });
  eleventyConfig.addWatchTarget("src/js/");
  eleventyConfig.addWatchTarget("src/css/");

  /* ---------- Filtros e shortcodes ---------- */
  eleventyConfig.addShortcode("icon", icon);
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addGlobalData("siteUrl", SITE_URL);
  eleventyConfig.addFilter("brl", brl);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("websiteLd", (site) => JSON.stringify({
    "@context": "https://schema.org", "@type": "WebSite", name: `${site.nome} (projeto fictício)`, url: SITE_URL + "/",
    inLanguage: "pt-BR", description: site.descricao,
    creator: { "@type": "Person", name: "Luccas Souza", url: "https://github.com/luccas-souza7" },
  }));
  eleventyConfig.addFilter("wa", (msg) => `https://wa.me/${SITE.whatsapp.numero}?text=${encodeURIComponent(msg)}`);
  eleventyConfig.addFilter("fmt", (str, obj = {}) => String(str).replace(/\{(\w+)\}/g, (_, k) => obj[k] ?? ""));
  eleventyConfig.addFilter("dataBR", (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }));
  eleventyConfig.addFilter("dataCurta", (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("nota", (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  eleventyConfig.addFilter("tempoLeitura", (html = "") => {
    const words = String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  });
  eleventyConfig.addFilter("sumario", (html = "") => {
    const out = [];
    String(html).replace(/<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g, (_, lvl, id, txt) => {
      out.push({ nivel: Number(lvl), id, texto: txt.replace(/<[^>]+>/g, "").trim() });
    });
    return out;
  });
  eleventyConfig.addFilter("porCategoria", (posts, cat) => posts.filter((p) => p.data.categoria === cat));
  eleventyConfig.addFilter("relacionados", (posts, url, categoria, n = 3) => {
    const mesma = posts.filter((p) => p.url !== url && p.data.categoria === categoria);
    const outras = posts.filter((p) => p.url !== url && p.data.categoria !== categoria);
    return [...mesma, ...outras].slice(0, n);
  });
  eleventyConfig.addFilter("categoria", (slug, categorias) => categorias.find((c) => c.slug === slug) || { slug, nome: slug });
  eleventyConfig.addFilter("absUrl", (url) => SITE_URL + url);
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("plano", (p, avulsa) => {
    const cheio = avulsa * p.consultas;
    const economia = cheio - p.preco;
    return {
      ...p,
      cheio,
      economia,
      pct: Math.round((economia / cheio) * 100),
      porConsulta: Math.round(p.preco / p.consultas),
      parcela: Math.round(p.preco / p.parcelas),
    };
  });

  /* Vídeo próprio dentro de artigos: {% video "/assets/video/arquivo.mp4", "/assets/video/poster.webp", "Descrição" %} */
  eleventyConfig.addShortcode("video", (src, poster, legenda = "") =>
    `<figure class="post-video"><video controls preload="none" playsinline poster="${poster}"><source src="${src}" type="video/mp4"></video><figcaption>${legenda ? `${legenda} ` : ""}<a href="${src}" download>Baixar o vídeo (MP4)</a></figcaption></figure>`);
  /* YouTube com carregamento leve: só carrega o player ao clicar */
  eleventyConfig.addShortcode("youtube", (id, titulo = "Vídeo do YouTube") =>
    `<figure class="post-video"><a class="yt-lite" href="https://www.youtube.com/watch?v=${id}" data-yt="${id}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360" eleventy:ignore><span class="yt-lite__play">${icon("play")}<span class="sr-only">Assistir: ${titulo}</span></span></a><figcaption>${titulo}</figcaption></figure>`);

  /* ---------- Coleções ---------- */
  const publicado = (p) => !p.data.rascunho && new Date(p.date) <= new Date(Date.now() + 864e5);
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/posts/*.md").filter(publicado).sort((a, b) => b.date - a.date));
  eleventyConfig.addCollection("sitemap", (api) =>
    api.getAll().filter((p) => p.url && p.data.sitemap !== false && !p.data.rascunho && p.outputPath?.endsWith(".html")));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    pathPrefix: PATH_PREFIX,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
