import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { EmptyState } from '@/components/app/EmptyState';
import { Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { Setor } from '@/hooks/useSetores';
import { distribuicaoPorNivel, cargosPorSetor, matrizSetorNivel, matrizCelulaKey, type MatrizEstado } from '../domain/jobStructure';
import type { JobRow } from '../types/job.types';

interface Props {
  rows: JobRow[];
  setores: Setor[];
  onSelectSetor: (setorId: string | null) => void;
  onSelectNivel: (nivel: string) => void;
}

const ESTADO_CLASS: Record<MatrizEstado, string> = {
  estruturado: 'bg-success/15 text-success border-success/30',
  parcial: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  vazio: 'bg-muted/40 text-muted-foreground border-border/50',
};

/** Mapa da estrutura: distribuição por nível, cobertura por setor e matriz Setor × Nível. */
export function JobsStructureMap({ rows, setores, onSelectSetor, onSelectNivel }: Props) {
  const distribuicao = distribuicaoPorNivel(rows);
  const cobertura = cargosPorSetor(rows, setores);
  const matriz = matrizSetorNivel(rows, setores);

  if (rows.length === 0) {
    return <SectionCard><EmptyState icon={Network} title="Sem cargos para mapear" description="Cadastre cargos ou ajuste os filtros para visualizar a estrutura." /></SectionCard>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Distribuição por nível" description="Cargos e colaboradores enquadrados por nível.">
          <div className="space-y-2.5">
            {distribuicao.map((d) => (
              <button
                key={d.nivel} type="button"
                onClick={() => d.nivel !== 'Sem nível' && onSelectNivel(d.nivel)}
                disabled={d.nivel === 'Sem nível'}
                className={cn('flex w-full items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3 text-left', d.nivel !== 'Sem nível' && 'hover:border-primary/25 hover:bg-muted/40')}
              >
                <span className="text-sm font-medium text-foreground">{d.nivel === 'Sem nível' ? d.nivel : `Nível ${d.nivel}`}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge variant="info">{formatNumberBR(d.cargos)} cargo(s)</StatusBadge>
                  <StatusBadge variant="neutral">{formatNumberBR(d.ocupantes)} colaborador(es)</StatusBadge>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cobertura por setor" description="Cargos e headcount por setor.">
          <div className="space-y-2.5">
            {cobertura.map((s) => (
              <button
                key={s.setorId ?? '__sem__'} type="button"
                onClick={() => onSelectSetor(s.setorId)}
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3 text-left hover:border-primary/25 hover:bg-muted/40"
              >
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{s.setorNome}</h4>
                  <p className="text-xs text-muted-foreground">{formatNumberBR(s.ocupantes)} colaborador(es)</p>
                </div>
                <StatusBadge variant={s.cobertura === 'estruturado' ? 'success' : s.cobertura === 'parcial' ? 'warning' : 'neutral'}>
                  {s.cobertura === 'estruturado' ? 'Estruturado' : s.cobertura === 'parcial' ? 'Parcial' : 'Sem cargos'} · {formatNumberBR(s.cargos)}
                </StatusBadge>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Matriz Setor × Nível" description="Cargos por setor e nível. Verde = ocupado, amarelo = sem ocupantes.">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">Setor \ Nível</th>
                {matriz.niveis.map((n) => <th key={n} className="p-2 text-center text-xs font-medium text-muted-foreground">{n === 'Sem nível' ? n : `Nível ${n}`}</th>)}
              </tr>
            </thead>
            <tbody>
              {matriz.setores.map((s) => (
                <tr key={s.id ?? '__sem__'}>
                  <td className="p-2 text-xs font-medium text-foreground">{s.nome}</td>
                  {matriz.niveis.map((n) => {
                    const cel = matriz.celulas.get(matrizCelulaKey(s.id, n));
                    return (
                      <td key={n} className="p-1 text-center">
                        {cel ? (
                          <div className={cn('rounded-lg border px-2 py-1.5 text-xs', ESTADO_CLASS[cel.estado])} title={`${cel.cargos} cargo(s), ${cel.ocupantes} colaborador(es)`}>
                            <div className="font-semibold">{formatNumberBR(cel.cargos)}</div>
                            <div className="text-[10px] opacity-80">{formatNumberBR(cel.ocupantes)} pes.</div>
                          </div>
                        ) : <span className="text-muted-foreground/40">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
