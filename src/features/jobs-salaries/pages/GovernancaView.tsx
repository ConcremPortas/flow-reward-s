import { SectionCard } from '@/components/app/SectionCard';
import { formatPercentBR, formatNumberBR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AttentionCenter } from '../components/AttentionCenter';
import type { JobsSalariesModel } from '../domain/model';
import type { JobsSalariesData } from '../types/jobsSalaries.types';

interface Props {
  model: JobsSalariesModel;
  data: JobsSalariesData;
}

interface Qualidade {
  rotulo: string;
  proporcao: number | null; // null = não avaliável (ex.: sem base)
  detalhe: string;
}

/** Governança: pendências completas + qualidade de dados (cobertura cadastral). */
export function GovernancaView({ model, data }: Props) {
  const totalCargos = data.cargos.length;
  const comFaixa = data.cargos.filter((c) => typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number').length;
  const comNivel = data.cargos.filter((c) => c.nivel_hierarquico != null && String(c.nivel_hierarquico).trim() !== '').length;
  const comSetor = data.cargos.filter((c) => !!c.setor_id).length;
  const ativos = data.funcionarios.filter((f) => f.ativo !== false);
  const enquadrados = model.countsGlobais.totalEnquadrados;

  const itens: Qualidade[] = [
    { rotulo: 'Cargos com faixa salarial', proporcao: totalCargos ? comFaixa / totalCargos : null, detalhe: `${formatNumberBR(comFaixa)} de ${formatNumberBR(totalCargos)}` },
    { rotulo: 'Cargos com nível hierárquico', proporcao: totalCargos ? comNivel / totalCargos : null, detalhe: `${formatNumberBR(comNivel)} de ${formatNumberBR(totalCargos)}` },
    { rotulo: 'Cargos vinculados a setor', proporcao: totalCargos ? comSetor / totalCargos : null, detalhe: `${formatNumberBR(comSetor)} de ${formatNumberBR(totalCargos)}` },
    { rotulo: 'Colaboradores ativos enquadrados', proporcao: ativos.length ? enquadrados / ativos.length : null, detalhe: `${formatNumberBR(enquadrados)} de ${formatNumberBR(ativos.length)}` },
  ];

  if (data.autorizadoRemuneracao) {
    const comSalario = ativos.filter((f) => f.salario != null).length;
    itens.push({ rotulo: 'Colaboradores ativos com salário', proporcao: ativos.length ? comSalario / ativos.length : null, detalhe: `${formatNumberBR(comSalario)} de ${formatNumberBR(ativos.length)}` });
  }

  return (
    <div className="space-y-6">
      <AttentionCenter issues={model.pendencias} />

      <SectionCard title="Qualidade dos dados" description="Cobertura cadastral que sustenta as análises deste módulo.">
        <div className="space-y-3.5">
          {itens.map((q) => (
            <div key={q.rotulo} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{q.rotulo}</span>
                <span className="tabular-nums text-muted-foreground">
                  {q.proporcao == null ? 'Não disponível' : formatPercentBR(q.proporcao * 100, 0)} <span className="text-xs">({q.detalhe})</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all', barColor(q.proporcao))}
                  style={{ width: q.proporcao == null ? '0%' : `${Math.round(q.proporcao * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function barColor(p: number | null): string {
  if (p == null) return 'bg-muted-foreground/30';
  if (p >= 0.85) return 'bg-success';
  if (p >= 0.5) return 'bg-status-warning';
  return 'bg-destructive';
}
