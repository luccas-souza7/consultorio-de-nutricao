# Como publicar um artigo ou uma receita

Este guia é para quem **não programa**. Tudo é feito pelo site do GitHub, no navegador, sem instalar nada. A publicação é automática: cerca de 2 minutos depois de enviar, o conteúdo aparece no site.

Você só precisa estar logado no GitHub com a conta dona do repositório (ou com uma conta que tenha permissão de escrita).

---

## Opção 1: pelo formulário (recomendada)

### Passo 1. Abra o formulário

1. Entre no repositório: <https://github.com/luccas-souza7/consultorio-de-nutricao>
2. Clique na aba **Issues**.
3. Clique no botão verde **New issue**.
4. Escolha **📝 Novo artigo do blog** ou **🥗 Nova receita** e clique em **Get started**.

### Passo 2. Preencha os campos

| Campo | O que colocar |
|---|---|
| **Título** | O título do artigo. Ideal entre 40 e 65 caracteres. |
| **Resumo** | Uma ou duas frases. Aparece nos cards do blog e no Google. |
| **Categoria** | Nutrição, Emagrecimento, Ganho de massa ou Qualidade de vida. (Receitas vão sozinhas para a categoria Receitas.) |
| **Data de publicação** | No formato DD/MM/AAAA. Em branco = hoje. Uma data futura **agenda** a publicação. |
| **Imagem de capa** | **Arraste a foto** para dentro da caixa. Espere aparecer o texto `![...](https://github.com/...)`. |
| **Descrição da imagem** | O que aparece na foto, para pessoas que usam leitor de tela. |
| **Texto do artigo** | O conteúdo. Veja as dicas de formatação abaixo. |
| **Título para o Google / Palavras-chave** | Opcionais. |

Na receita, os campos são parecidos, com **Ingredientes** (um por linha) e **Modo de preparo** (um passo por linha).

### Passo 3. Envie

Marque as duas confirmações e clique em **Submit new issue**.

Em cerca de 2 minutos aparece um comentário automático na issue com o **link do artigo publicado**, e a issue é fechada.

### Precisa corrigir algo?

Abra a mesma issue (aba Issues, filtro **Closed**), clique nos três pontinhos `...` do primeiro comentário, escolha **Edit**, corrija e clique em **Update comment**. O artigo é atualizado automaticamente.

### Algo deu errado?

Se faltar um campo obrigatório ou a imagem não tiver carregado, a issue recebe um comentário avisando. Corrija editando a issue, como acima.

---

## Dicas de formatação do texto

Escreva normalmente. Para formatar, use estes atalhos:

| Para ter | Escreva |
|---|---|
| Subtítulo | `## Meu subtítulo` (em uma linha só) |
| Subtítulo menor | `### Meu subtítulo menor` |
| **Negrito** | `**texto**` |
| *Itálico* | `*texto*` |
| Lista | `- item` (um por linha) |
| Lista numerada | `1. item` |
| Link | `[texto do link](https://endereco.com)` |
| Foto no meio do texto | Arraste a imagem para a caixa de texto |
| Vídeo do YouTube | Cole o link do vídeo sozinho em uma linha |

Os subtítulos (`##`) viram automaticamente o **sumário** do artigo.

---

## Opção 2: editando os arquivos (para quem já conhece o GitHub)

Cada artigo é um arquivo de texto em `src/blog/posts/`. O nome do arquivo vira o endereço: `meu-artigo.md` fica em `/blog/meu-artigo/`.

1. Envie a imagem de capa para `src/assets/img/blog/` (**Add file > Upload files**).
2. Em `src/blog/posts/`, clique em **Add file > Create new file**.
3. Copie o conteúdo de [`docs/modelos/artigo-modelo.md`](modelos/artigo-modelo.md) (ou [`receita-modelo.md`](modelos/receita-modelo.md)), preencha e clique em **Commit changes**.

### Despublicar ou guardar como rascunho

No cabeçalho do arquivo, acrescente a linha `rascunho: true`. O artigo some do site e do sitemap, mas continua guardado. Para apagar de vez, abra o arquivo e use o menu `...` > **Delete file**.

### Trocar a imagem de capa

Envie a nova imagem para `src/assets/img/blog/` e altere a linha `capa:` do artigo.

---

## O que acontece automaticamente

Ao publicar, o site gera sozinho:

- a página do artigo com endereço próprio (`/blog/nome-do-artigo/`);
- título e descrição para o Google, link canônico e dados para compartilhamento (Open Graph);
- dados estruturados (`BlogPosting` para artigos e `Recipe` para receitas);
- imagens otimizadas em vários tamanhos;
- sumário, tempo de leitura e "Leia também";
- o `sitemap.xml` e o feed RSS atualizados;
- o card do artigo no blog, na categoria e na página inicial.

## Regras de conteúdo (ética profissional)

- Nada de fotos de "antes e depois".
- Nenhuma promessa de resultado garantido.
- Nenhuma indicação de produto ou suplemento de marca.
- Use apenas imagens próprias ou de bancos com licença livre (Pexels, Unsplash).
