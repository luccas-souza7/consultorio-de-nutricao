/*
 * Dados aplicados automaticamente a todo arquivo .md desta pasta (artigos e receitas).
 * Quem escreve o artigo só preenche o cabeçalho (título, descrição, data, categoria, capa...).
 * Layout, URL, SEO e dados estruturados são gerados aqui.
 */
import fs from "node:fs";

const categorias = JSON.parse(fs.readFileSync("src/_data/categorias.json", "utf8"));
const SITE_URL = (process.env.SITE_URL || "https://luccas-souza7.github.io/consultorio-de-nutricao").replace(/\/$/, "");
const AUTOR = { "@type": "Person", name: "Caio Valente (nutricionista fictício)" };
const EDITOR = {
  "@type": "Organization",
  name: "Caio Valente Nutrição (projeto fictício)",
  logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/img/logo.svg` },
};

const nomeCategoria = (slug) => (categorias.find((c) => c.slug === slug) || { nome: slug }).nome;
const iso = (d) => new Date(d).toISOString();

export default {
  layout: "layouts/artigo.njk",
  ogType: "article",
  navAtivo: "blog",
  eleventyComputed: {
    /* Rascunhos não geram página nem entram no sitemap */
    permalink: (data) => (data.rascunho ? false : `/blog/${data.page.fileSlug}/`),
    nomeCategoria: (data) => nomeCategoria(data.categoria),
    jsonld: (data) => {
      if (data.rascunho) return null;
      const url = SITE_URL + data.page.url;
      const imagem = data.capa ? SITE_URL + data.capa : `${SITE_URL}/assets/img/og-image.jpg`;
      const migalhas = {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog/` },
          { "@type": "ListItem", position: 3, name: nomeCategoria(data.categoria), item: `${SITE_URL}/blog/categoria/${data.categoria}/` },
          { "@type": "ListItem", position: 4, name: data.title, item: url },
        ],
      };
      const comum = {
        name: data.title,
        description: data.seo_descricao || data.description,
        image: [imagem],
        datePublished: iso(data.page.date),
        dateModified: iso(data.atualizado || data.page.date),
        author: AUTOR,
        publisher: EDITOR,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: "pt-BR",
        keywords: (data.palavras_chave || []).join(", ") || undefined,
      };
      let principal;
      if (data.categoria === "receitas") {
        principal = {
          "@type": "Recipe",
          ...comum,
          recipeCategory: data.tipo_prato || "Prato principal",
          recipeCuisine: "Brasileira",
          recipeYield: data.rendimento,
          totalTime: data.tempo_minutos ? `PT${data.tempo_minutos}M` : undefined,
          recipeIngredient: (data.ingredientes || []).flatMap((g) => g.itens || []),
          recipeInstructions: (data.preparo || []).map((p, i) => ({
            "@type": "HowToStep", position: i + 1, text: String(p).replace(/<[^>]+>/g, ""),
          })),
        };
      } else {
        principal = { "@type": "BlogPosting", headline: data.title, articleSection: nomeCategoria(data.categoria), ...comum };
      }
      return { "@context": "https://schema.org", "@graph": [principal, migalhas] };
    },
  },
};
