import { Briefcase, Users, Building2, Layers, Wallet } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { AvailStat } from '../components/AvailStat';
import { MaturityCard } from '../components/MaturityCard';
import { AttentionCenter } from '../components/AttentionCenter';
import { FuncaoCargoDiagnostico } from '../components/FuncaoCargoDiagnostico';
import { availValue } from '../domain/dataAvailability';
import type { JobsSalariesModel } from '../domain/model';

interface Props {
  model: JobsSalariesModel;
  filtrosAtivos: number;
}

/** Visão executiva: retrato geral do módulo (contagens globais), maturidade,
 * atenção e o diagnóstico função×cargo. Os filtros afetam Estrutura/Remuneração. */
export function ResumoView({ model, filtrosAtivos }: Props) {
  const c = model.countsGlobais;
  return (
    <div className="space-y-6">
      {filtrosAtivos > 0 && (
        <p className="text-xs text-muted-foreground">
          A visão executiva mostra o retrato global do módulo. Os filtros ativos afetam as visões de Estrutura e Remuneração.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AvailStat title="Cargos cadastrados" avail={availValue(c.totalCargos)} icon={Briefcase} hint="No plano de cargos" />
        <AvailStat title="Níveis hierárquicos" avail={availValue(c.totalNiveis)} icon={Layers} hint="Níveis distintos definidos" />
        <AvailStat title="Colaboradores ativos" avail={availValue(c.colaboradoresAtivos)} icon={Users} hint={`${formatNumberBR(c.totalEnquadrados)} enquadrado(s) em cargo`} />
        <AvailStat title="Massa salarial (ativos)" avail={model.remuneracao.massaSalarial} formato="moeda" icon={Wallet} hint="Soma dos salários conhecidos" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AvailStat title="Setores" avail={availValue(c.totalSetores)} icon={Building2} hint="Setores ativos" />
        <AvailStat title="Colaboradores sem cargo" avail={availValue(c.colaboradoresSemCargo)} status={c.colaboradoresSemCargo > 0 ? 'warning' : 'positive'} hint="Ativos sem enquadramento formal" />
        <AvailStat title="Média salarial (ativos)" avail={model.remuneracao.mediaSalarial} formato="moeda" hint="Somente salários conhecidos" />
        <AvailStat title="Pendências de governança" avail={availValue(model.atencao.totalPendencias)} status={model.atencao.altas > 0 ? 'critical' : model.atencao.totalPendencias > 0 ? 'warning' : 'positive'} hint={`${formatNumberBR(model.atencao.altas)} de severidade alta`} />
      </div>

      <MaturityCard maturidade={model.maturidade} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttentionCenter issues={model.pendencias} compacto />
        <SectionCard title="Distribuição por nível" description="Cargos e colaboradores enquadrados por nível hierárquico.">
          {model.distribuicaoNivel.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Não disponível — nenhum cargo no recorte atual.</p>
          ) : (
            <div className="space-y-2.5">
              {model.distribuicaoNivel.map((d) => (
                <div key={d.nivel} className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3">
                  <span className="text-sm font-medium text-foreground">{d.nivel === 'Sem nível' ? d.nivel : `Nível ${d.nivel}`}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="info">{formatNumberBR(d.cargos)} cargo(s)</StatusBadge>
                    <StatusBadge variant="neutral">{formatNumberBR(d.colaboradores)} colaborador(es)</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <FuncaoCargoDiagnostico diagnostico={model.diagnostico} />
    </div>
  );
}
