import { Lock, Wallet, TrendingUp, Info } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import { AvailStat } from '../components/AvailStat';
import { hasValue, moneyLabel } from '../domain/dataAvailability';
import type { JobsSalariesModel } from '../domain/model';

interface Props {
  model: JobsSalariesModel;
}

/**
 * Remuneração: SEMPRE agregada (nunca salário individual) e guardada por
 * autorização. Sem autorização, mostra painel de acesso restrito. Compa-ratio
 * e compressão só aparecem quando há faixas + enquadramento.
 */
export function RemuneracaoView({ model }: Props) {
  const { remuneracao, posicionamento, compressao } = model;

  if (!remuneracao.autorizado) {
    return (
      <SectionCard>
        <EmptyState
          icon={Lock}
          title="Acesso restrito à remuneração"
          description="Você não tem autorização para visualizar dados de remuneração. Fale com um administrador para liberar o acesso ao módulo Cargos e Salários. O bloqueio é aplicado também no servidor."
        />
      </SectionCard>
    );
  }

  const compaMedio = (() => {
    const valores = posicionamento.itens.map((i) => i.compaRatio).filter(hasValue).map((a) => a.value!);
    if (valores.length === 0) return null;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
  })();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AvailStat title="Massa salarial (ativos)" avail={remuneracao.massaSalarial} formato="moeda" icon={Wallet} hint="Soma dos salários conhecidos" />
        <AvailStat title="Média salarial" avail={remuneracao.mediaSalarial} formato="moeda" hint={`${formatNumberBR(remuneracao.colaboradoresComSalario)} colaborador(es) com salário`} />
        <AvailStat title="Mediana salarial" avail={remuneracao.medianaSalarial} formato="moeda" hint="Ponto central dos salários" />
        <AvailStat title="Amplitude" avail={remuneracao.menorSalario} formato="moeda" hint={hasValue(remuneracao.maiorSalario) ? `até ${moneyLabel(remuneracao.maiorSalario)}` : 'menor salário conhecido'} />
      </div>

      <SectionCard
        title="Posicionamento salarial (compa-ratio)"
        description="Salário médio dos ocupantes vs. ponto médio da faixa do cargo."
        actions={compaMedio != null ? <StatusBadge variant={compaVariant(compaMedio)}>Médio {compaMedio.toFixed(2)}</StatusBadge> : undefined}
      >
        {!posicionamento.disponivel ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{posicionamento.motivoIndisponivel}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Cargo</th>
                  <th className="pb-2 pr-3 font-medium">Faixa</th>
                  <th className="pb-2 pr-3 font-medium">Ocupantes</th>
                  <th className="pb-2 pr-3 font-medium">Compa-ratio</th>
                  <th className="pb-2 font-medium">Fora da faixa</th>
                </tr>
              </thead>
              <tbody>
                {posicionamento.itens.map((i) => (
                  <tr key={i.cargoId} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{i.cargoNome}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{formatCurrencyBRL(i.faixaMin)} – {formatCurrencyBRL(i.faixaMax)}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{formatNumberBR(i.ocupantesComSalario)}</td>
                    <td className="py-2.5 pr-3">
                      {hasValue(i.compaRatio)
                        ? <StatusBadge variant={compaVariant(i.compaRatio.value!)}>{i.compaRatio.value!.toFixed(2)}</StatusBadge>
                        : <span className="text-xs text-muted-foreground">Não informado</span>}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {i.abaixoDaFaixa > 0 && <span className="mr-2 text-status-warning">{formatNumberBR(i.abaixoDaFaixa)} abaixo</span>}
                      {i.acimaDaFaixa > 0 && <span className="text-destructive">{formatNumberBR(i.acimaDaFaixa)} acima</span>}
                      {i.abaixoDaFaixa === 0 && i.acimaDaFaixa === 0 && <span className="text-success">Dentro da faixa</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Compressão entre níveis" description="Relação entre pontos médios de níveis adjacentes.">
        {!compressao.disponivel ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{compressao.motivoIndisponivel}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{hasValue(compressao.compressaoMedia) ? `${compressao.compressaoMedia.value!.toFixed(2)}×` : moneyLabel(compressao.compressaoMedia)}</p>
              <p className="text-xs text-muted-foreground">Progressão média do ponto médio salarial a cada nível.</p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function compaVariant(v: number): StatusVariant {
  if (v < 0.8) return 'warning';
  if (v > 1.2) return 'danger';
  return 'success';
}
