import logoPreta from '@/assets/logo-concrem-preta.png';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { DELIVERY_TYPE_LABEL } from '../domain/domainConstants';
import type { DeliveryType } from '../types/inventory.types';
import type { ReciboEntrega } from './inventoryApi';

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Abre uma janela isolada com o recibo de entrega (compacto, meia-folha) e dispara
 * a impressão. Deve ser chamada a partir de um clique (evita bloqueio de popup).
 */
export function imprimirRecibo(r: ReciboEntrega, entreguePor: string): boolean {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return false;

  const total = r.itens.reduce((s, it) => s + it.quantidade * it.custoUnitario, 0);
  const tipoLabel = DELIVERY_TYPE_LABEL[r.tipo as DeliveryType] ?? r.tipo;
  const logoUrl = new URL(logoPreta, window.location.origin).href;

  const linhas = r.itens.map((it) => `
    <tr>
      <td class="mono">${esc(it.codigo)}</td>
      <td>${esc(it.nome)}</td>
      <td class="num">${formatNumberBR(it.quantidade)}</td>
      <td class="num">${formatCurrencyBRL(it.custoUnitario)}</td>
      <td class="num">${formatCurrencyBRL(it.quantidade * it.custoUnitario)}</td>
    </tr>`).join('');

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Recibo ${esc(r.recibo)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #14181f; margin: 0; }
  .recibo { max-width: 640px; margin: 0 auto; border: 1px solid #d3d8de; border-radius: 8px; padding: 20px 22px; }
  .cab { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #08783e; padding-bottom: 12px; }
  .cab img { height: 44px; width: auto; object-fit: contain; }
  .cab .org { font-size: 12px; color: #5b6470; }
  .cab .org strong { display: block; font-size: 15px; color: #14181f; }
  .titulo { display: flex; justify-content: space-between; align-items: baseline; margin: 14px 0 10px; }
  .titulo h1 { font-size: 15px; margin: 0; letter-spacing: .3px; text-transform: uppercase; }
  .titulo .num { font-size: 13px; font-weight: bold; color: #08783e; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 12.5px; margin-bottom: 12px; }
  .meta span { color: #5b6470; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e6e9ed; }
  th { font-size: 11px; text-transform: uppercase; color: #5b6470; border-bottom: 1px solid #c9ced4; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.mono { font-family: "Courier New", monospace; }
  tfoot td { font-weight: bold; border-bottom: none; border-top: 2px solid #c9ced4; }
  .declaracao { font-size: 12px; color: #333; margin: 6px 0 22px; }
  .assinatura { margin-top: 26px; }
  .linha-ass { border-top: 1px solid #14181f; width: 320px; padding-top: 4px; font-size: 12px; }
  .ass-hint { font-size: 10.5px; color: #7a828c; }
  .rodape { display: flex; justify-content: space-between; gap: 24px; margin-top: 26px; font-size: 11.5px; }
  .rodape .bloco { flex: 1; }
  .rodape .rot { color: #5b6470; }
  .rodape .val { font-weight: bold; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .recibo { border: none; } }
</style></head>
<body>
  <div class="recibo">
    <div class="cab">
      <img src="${logoUrl}" alt="Concrem" />
      <div class="org"><strong>CONCREM</strong>Gestão de RH</div>
    </div>

    <div class="titulo">
      <h1>Recibo de Entrega de Fardamento</h1>
      <span class="num">Nº ${esc(r.recibo)}</span>
    </div>

    <div class="meta">
      <div><span>Colaborador:</span> <strong>${esc(r.colaboradorNome)}</strong></div>
      <div><span>Data de entrega:</span> ${esc(formatDateTimeBR(r.createdAt))}</div>
      <div><span>Tipo de entrega:</span> ${esc(tipoLabel)}</div>
      <div><span>Local de estoque:</span> ${esc(r.unidadeNome)}</div>
    </div>

    <table>
      <thead><tr><th>Código</th><th>Uniforme</th><th class="num">Qtd</th><th class="num">Valor unit.</th><th class="num">Subtotal</th></tr></thead>
      <tbody>${linhas}</tbody>
      <tfoot><tr><td colspan="4" class="num">Valor total</td><td class="num">${formatCurrencyBRL(total)}</td></tr></tfoot>
    </table>

    <p class="declaracao">Declaro ter recebido os itens de fardamento acima discriminados, em bom estado e nas quantidades indicadas.</p>

    <div class="assinatura">
      <div class="linha-ass">Assinatura do colaborador</div>
      <div class="ass-hint">Rubrica ou assinatura por extenso</div>
    </div>

    <div class="rodape">
      <div class="bloco"><div class="rot">Emitido por</div><div class="val">${esc(r.operadorNome)}</div></div>
      <div class="bloco"><div class="rot">Entregue por</div><div class="val">${esc(entreguePor || r.operadorNome)}</div></div>
    </div>
  </div>
  <script>window.addEventListener('load', function () { window.focus(); window.print(); });</script>
</body></html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
