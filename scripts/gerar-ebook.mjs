/*
 * Gera o PDF do "Guia da Marmita Saudável" a partir da página /ebook/guia-da-marmita-saudavel/.
 * Uso (depois de `npm run build`): node scripts/gerar-ebook.mjs
 * Requer o Playwright instalado na máquina (npx playwright install chromium).
 * O PDF gerado fica em src/assets/ebook/ e é versionado junto com o site.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const RAIZ = path.resolve("_site");
const SAIDA = path.resolve("src/assets/ebook/guia-da-marmita-saudavel.pdf");
const tipos = { ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp" };

const servidor = http.createServer((req, res) => {
  let arquivo = path.join(RAIZ, decodeURIComponent(req.url.split("?")[0]));
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, "index.html");
  if (!arquivo.startsWith(RAIZ) || !fs.existsSync(arquivo)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": tipos[path.extname(arquivo)] || "application/octet-stream" });
  fs.createReadStream(arquivo).pipe(res);
}).listen(0);

const porta = servidor.address().port;
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto(`http://localhost:${porta}/ebook/guia-da-marmita-saudavel/`, { waitUntil: "networkidle" });
await pagina.evaluate(() => document.fonts.ready);
fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
await pagina.pdf({ path: SAIDA, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
await navegador.close();
servidor.close();
console.log(`PDF gerado em ${path.relative(process.cwd(), SAIDA)} (${Math.round(fs.statSync(SAIDA).size / 1024)} KB)`);
