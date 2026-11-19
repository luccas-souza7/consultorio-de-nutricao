# Migrar para a Cloudflare Pages (quando quiser)

O site é estático e o build é o mesmo em qualquer hospedagem. A migração não exige mudar código.

## Passo a passo

1. Crie uma conta gratuita na Cloudflare e abra **Workers & Pages > Create > Pages > Connect to Git**.
2. Escolha o repositório `consultorio-de-nutricao`.
3. Configure o build:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `_site`
   - **Variáveis de ambiente:**
     - `NODE_VERSION` = `20`
     - `PATH_PREFIX` = `/` (na Cloudflare o site fica na raiz do domínio)
     - `SITE_URL` = `https://seu-dominio.com.br` (sem barra no final)
4. Clique em **Save and Deploy**.

A cada commit na `main` a Cloudflare publica de novo, inclusive os artigos criados pelo formulário de issue, que continua funcionando porque ele só faz commits no repositório.

## Depois de migrar

- Desative o workflow `deploy.yml` (ou apague o arquivo) para não publicar em dois lugares.
- Para posts agendados, crie na Cloudflare um **Deploy Hook** e chame-o uma vez por dia (por exemplo, com um workflow agendado que faz `curl -X POST <url do hook>`).
- Domínio próprio: **Custom domains** no projeto da Cloudflare. Atualize `SITE_URL`.
- Opcional: redirecionamentos de verdade (HTTP 301) com um arquivo `_redirects` gerado a partir de `src/_data/redirecionamentos.json`.
