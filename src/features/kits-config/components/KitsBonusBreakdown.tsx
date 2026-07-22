import { formatCurrencyBRL, formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { computeKitsBonusBreakdown, type KitsBonusInput } from '../domain/kitsBonusBreakdown';

interface Props { kits: number; config: KitsBonusInput }

/** Detalhamento do bônus — valor final vem do motor (calcularComissao). */
export function KitsBonusBreakdown({ kits, config }: Props) {
  const b = computeKitsBonusBreakdown(kits, config);
  return (
    <div className="space-y-1.5 text-sm">
      <Row k="Quantidade informada" v={`${formatNumberBR(b.kits)} kits`} />
      <Row k="Mínimo para bônus" v={`${formatNumberBR(b.minimo)} kits`} />
      {!b.atingiuMinimo ? (
        <p className="rounded-lg bg-muted/40 p-2 text-muted-foreground">Abaixo do mínimo — sem bônus.</p>
      ) : (
        <>
          <Row k="Excedente" v={`${formatNumberBR(b.excedente)} kits`} />
          <Row k="Faixas completas" v={pluralizeBR(b.faixas, 'faixa', 'faixas')} />
          {b.limite != null && <Row k="Máximo de faixas (informado)" v={`${formatNumberBR(b.limite)} · não aplicado pelo motor`} muted />}
          <div className="my-1 border-t border-border/60" />
          <Row k="Bônus base" v={formatCurrencyBRL(b.bonusBaseAplicado)} />
          <Row k="Adicional por faixas" v={formatCurrencyBRL(b.adicional)} />
        </>
      )}
      <div className="mt-1 flex items-center justify-between rounded-lg bg-[#f7f0d7]/50 px-2 py-1.5">
        <span className="font-semibold text-[#8a6d1f]">Bônus total</span>
        <span className="text-lg font-bold tabular-nums text-[#7a5f16]">{formatCurrencyBRL(b.bonusTotal)}</span>
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className={muted ? 'text-xs text-muted-foreground' : 'font-medium tabular-nums text-foreground'}>{v}</span></div>;
}
