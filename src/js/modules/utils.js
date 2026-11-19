/* Utilitários compartilhados */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
export const movimentoReduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const telaGrande = () => window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
export const economiaDeDados = () => {
  const c = navigator.connection;
  return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")));
};
/* localStorage sempre protegido: pode não existir em janelas privadas */
export const armazenamento = {
  ler(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  gravar(k, v) { try { window.localStorage.setItem(k, v); } catch { /* sem armazenamento */ } },
  apagar(k) { try { window.localStorage.removeItem(k); } catch { /* sem armazenamento */ } },
};
