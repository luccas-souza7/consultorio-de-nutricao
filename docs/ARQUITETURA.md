# Arquitetura do site

## Visão geral

| Camada | Tecnologia | Por quê |
|---|---|---|
| Gerador do site | [Eleventy 3](https://www.11ty.dev/) | Gera HTML estático a partir de templates e Markdown. Sem servidor, sem banco de dados, custo zero. |
| Templates | Nunjucks (`.njk`) | Cabeçalho, rodapé e componentes existem uma única vez. |
| Conteúdo | Markdown com cabeçalho YAML | Um arquivo por artigo, versionado no Git, fácil de ler e editar. |
| Cadastro sem código | Formulários de Issue do GitHub + GitHub Actions | Tudo dentro do GitHub, sem login externo nem serviço pago. |
| Estilos | CSS puro com variáveis, empacotado e minificado com esbuild | Tokens da paleta em um só lugar. |
| Interações | JavaScript sem framework, empacotado com esbuild | Carrega rápido; o 3D vira um arquivo separado, baixado sob demanda. |
| Animações | GSAP 3 (ScrollTrigger, SplitText, CustomEase) e Lenis | Padrão de mercado para animações fluidas; todos os plugins são gratuitos. |
| 3D | three.js + modelo glTF comprimido (meshopt + WebP) | Só no desktop, depois do carregamento, sem movimento reduzido. |
| Imagens | @11ty/eleventy-img | Gera WebP em 400, 800 e 1200 px com `srcset`, `width` e `height` automaticamente, inclusive das imagens enviadas pelo formulário. |
| Hospedagem | GitHub Pages (pronto para Cloudflare Pages) | Mesmo comando de build nas duas. |

### Por que não um CMS headless?

CMS headless (Contentful, Sanity, Strapi) trazem painel bonito, mas exigem conta externa, login separado e, em muitos casos, plano pago ou servidor. Para um site de exposição, o conteúdo em Markdown dentro do GitHub é mais barato, mais simples de manter e mais fácil de migrar: os arquivos são do dono do site e funcionam em qualquer gerador estático. Se um dia for preciso um painel visual, ferramentas como Decap CMS, Sveltia CMS ou Pages CMS leem exatamente esses mesmos arquivos, sem migração de conteúdo.

## Estrutura de pastas

```
src/
  _data/            dados do site (edite aqui, sem mexer em código)
    site.json         nome, WhatsApp, mensagens, endereço e horários
    planos.json       preços e benefícios dos planos
    avaliacoes.json   avaliações (demonstrativas ou vindas do Google)
    categorias.json   categorias do blog
    redirecionamentos.json  endereços antigos que apontam para os novos
  _includes/
    layouts/          base, artigo (também usado nas receitas) e página
    partials/         cabeçalho, rodapé, macros de componentes
  blog/posts/       artigos e receitas (1 arquivo .md = 1 página)
  legais/           termos, privacidade e cookies em Markdown
  css/              tokens, base, layout, componentes, home e blog
  js/               main.js, módulos e hero-3d.js
  assets/           imagens, vídeos, modelo 3D e e-book
scripts/            novo-conteudo.mjs, atualizar-avaliacoes.mjs, gerar-ebook.mjs
.github/            formulários de issue e workflows
docs/               esta documentação e modelos de artigo
```

## Fluxos automáticos

1. **Publicar o site** (`deploy.yml`): a cada push na `main`, uma vez por dia (para liberar posts agendados) e sob demanda.
2. **Novo conteúdo** (`novo-conteudo.yml`): formulário enviado → `scripts/novo-conteudo.mjs` cria o `.md` e otimiza as imagens → build de verificação → commit na `main` → publicação → comentário com o link na issue. Só roda para quem tem permissão de escrita no repositório. Textos do formulário são neutralizados para não executar código de template.
3. **Avaliações do Google** (`avaliacoes-google.yml`): toda semana, se os segredos `GOOGLE_PLACES_API_KEY` e `GOOGLE_PLACE_ID` existirem, busca nota, total e até 5 comentários na Places API (New) e republica o site. Quando a fonte vira `"google"`, o selo de demonstração some e a atribuição do Google aparece.

## Como editar dados sem programar

- **Preços:** `src/_data/planos.json`. A economia, o preço por consulta e as parcelas são calculados sozinhos.
- **WhatsApp e mensagens:** `src/_data/site.json`, campos `whatsapp.numero` e `mensagens`.
- **Endereço, horários e mapa:** `src/_data/site.json`, campos `endereco` e `horarios`.

## Comandos

```bash
npm install          # instala as dependências
npm run dev          # servidor local com recarga automática em http://localhost:8080
npm run build        # gera o site em _site/
node scripts/gerar-ebook.mjs   # regenera o PDF do e-book (precisa do Playwright)
```

## Desempenho e acessibilidade

- O vídeo do hero só é baixado depois que a página carrega, em 720p (desktop) ou 480p (celular), e nunca com `prefers-reduced-motion` ou economia de dados. Há botão de pausar.
- O módulo 3D (three.js) é um arquivo separado, carregado só em telas grandes, quando o navegador está ocioso.
- O conteúdo animado só é escondido quando o JavaScript de animação vai rodar; se ele falhar, tudo aparece em até 3,5 s.
- Navegação por teclado em menu, carrossel, FAQ, cards de serviço e sumário; foco visível em todos os elementos.
