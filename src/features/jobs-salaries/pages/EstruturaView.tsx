import { Network } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { FuncaoCargoDiagnostico } from '../components/FuncaoCargoDiagnostico';
import type { JobsSalariesModel } from '../domain/model';

interface Props {
  model: JobsSalariesModel;
}

/** Estrutura: distribuição por nível, cobertura por setor e diagnóstico. Respeita os filtros globais. */
export function EstruturaView({ model }: Props) {
  const semCargos = model.cargosFiltrados === 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Distribuição por nível hierárquico" description={`${formatNumberBR(model.cargosFiltrados)} cargo(s) no recorte atual.`}>
          {semCargos ? (
            <EmptyState icon={Network} title="Nenhum cargo no recorte" description="Ajuste os filtros ou cadastre cargos para visualizar a distribuição." />
          ) : (
            <div className="space-y-2.5">
              {model.distribuicaoNivel.map((d) => (
                <div key={d.nivel} className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3.5">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{d.nivel === 'Sem nível' ? d.nivel : `Nível ${d.nivel}`}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatNumberBR(d.colaboradores)} colaborador(es) enquadrado(s)</p>
                  </div>
                  <StatusBadge variant="info">{formatNumberBR(d.cargos)} cargo(s)</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Cobertura por setor" description="Cargos e headcount ativo por setor.">
          {model.coberturaSetor.length === 0 ? (
            <EmptyState icon={Network} title="Nenhum setor" description="Não há setores para exibir no recorte atual." />
          ) : (
            <div className="space-y-2.5">
              {model.coberturaSetor.map((s) => (
                <div key={s.setorId} className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3.5">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{s.setorNome}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatNumberBR(s.colaboradores)} colaborador(es) ativo(s)</p>
                  </div>
                  <StatusBadge variant={s.cargos > 0 ? 'info' : 'neutral'}>{formatNumberBR(s.cargos)} cargo(s)</StatusBadge>
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
