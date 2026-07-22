import { GitCompareArrows, Info } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { formatNumberBR } from '@/lib/formatters';
import type { FuncaoCargoDiagnostico as Diag } from '../domain/structureAnalysis';

interface Props {
  diagnostico: Diag;
}

/**
 * Diagnóstico honesto do descompasso FUNÇÃO × CARGO. Não converte função em
 * cargo automaticamente — apenas expõe a distância entre o vínculo cadastral
 * (função) e o enquadramento formal (cargo), deixando a decisão para o RH.
 */
export function FuncaoCargoDiagnostico({ diagnostico }: Props) {
  const { colaboradoresComFuncao, colaboradoresComCargo, colaboradoresSemVinculoCargo, cargosSemOcupante } = diagnostico;
  return (
    <SectionCard title="Diagnóstico: função × cargo" description="Por que colaboradores existem, mas o enquadramento em cargos pode estar vazio.">
      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Função</strong> é o vínculo operacional do colaborador no cadastro.
            <strong className="text-foreground"> Cargo</strong> é a posição formal no plano de cargos e salários. O
            enquadramento colaborador↔cargo só existe via <strong className="text-foreground">histórico de cargos</strong> —
            não há conversão automática. Os números abaixo medem o quanto os dois mundos ainda estão distantes.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={GitCompareArrows} label="Com função" value={colaboradoresComFuncao} hint="Colaboradores com vínculo de função" />
        <Tile label="Enquadrados em cargo" value={colaboradoresComCargo} hint="Colaboradores com cargo formal (via histórico)" />
        <Tile label="Sem cargo formal" value={colaboradoresSemVinculoCargo} hint="Precisam ser enquadrados" alerta={colaboradoresSemVinculoCargo > 0} />
        <Tile label="Cargos sem ocupante" value={cargosSemOcupante} hint="Cargos criados sem colaborador enquadrado" alerta={cargosSemOcupante > 0} />
      </div>
    </SectionCard>
  );
}

function Tile({ icon: Icon, label, value, hint, alerta }: { icon?: typeof GitCompareArrows; label: string; value: number; hint: string; alerta?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${alerta ? 'border-status-warning/40' : 'border-border/70'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
      </div>
      <p className="mt-2 text-[1.7rem] font-bold leading-none tracking-tight text-foreground">{formatNumberBR(value)}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
