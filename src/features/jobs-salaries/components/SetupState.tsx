import { Briefcase, Layers, Wallet, Users2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';
import type { StructureCounts } from '../domain/structureAnalysis';

interface Props {
  counts: StructureCounts;
}

/**
 * Estado de IMPLANTAÇÃO: o módulo ainda não tem cargos cadastrados. Explica a
 * aparente inconsistência (há colaboradores e setores, mas 0 cargos/0 níveis/
 * remuneração vazia) sem transformar ausência em zero de desempenho.
 */
export function SetupState({ counts }: Props) {
  const passos = [
    { icon: Briefcase, titulo: '1. Cadastrar cargos', desc: 'Defina os cargos do plano (missão, responsabilidades, requisitos).', to: '/cargos-salarios/cargos' },
    { icon: Layers, titulo: '2. Definir níveis e faixas', desc: 'Atribua nível hierárquico e faixa salarial (mínimo/máximo) a cada cargo.', to: '/cargos-salarios/cargos' },
    { icon: Users2, titulo: '3. Enquadrar colaboradores', desc: 'Registre o enquadramento de cada colaborador no cargo correspondente.', to: '/cargos-salarios/funcionarios' },
    { icon: Wallet, titulo: '4. Acompanhar remuneração', desc: 'Com faixas e enquadramento, o posicionamento salarial passa a ser calculado.', to: null },
  ];

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Módulo de cargos ainda não implantado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Não há cargos cadastrados. Os colaboradores existentes hoje estão vinculados a
              <strong className="text-foreground"> funções</strong>, que não são o mesmo que
              <strong className="text-foreground"> cargos</strong> — por isso a estrutura de cargos, os níveis
              e a remuneração aparecem vazios. Cadastre os cargos para começar a implantação.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/cargos-salarios/cargos">Cadastrar cargos <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoTile label="Colaboradores no sistema" value={formatNumberBR(counts.totalColaboradores)} hint={`${formatNumberBR(counts.colaboradoresAtivos)} ativo(s) — vinculados a funções`} />
        <InfoTile label="Setores cadastrados" value={formatNumberBR(counts.totalSetores)} hint="Prontos para receber cargos" />
        <InfoTile label="Cargos cadastrados" value={formatNumberBR(counts.totalCargos)} hint="Nenhum cargo criado até agora" emphasize />
      </div>

      <SectionCard title="Como implantar" description="Sequência recomendada para estruturar o plano de cargos e salários.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {passos.map((p) => {
            const Icon = p.icon;
            const inner = (
              <div className="flex h-full items-start gap-3 rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-primary/25 hover:bg-muted/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><Icon className="h-4.5 w-4.5" /></div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{p.titulo}</h4>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            );
            return p.to ? <Link key={p.titulo} to={p.to} className="block">{inner}</Link> : <div key={p.titulo}>{inner}</div>;
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function InfoTile({ label, value, hint, emphasize }: { label: string; value: string; hint: string; emphasize?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] ${emphasize ? 'border-primary/30' : 'border-border/70'}`}>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-[1.7rem] font-bold leading-none tracking-tight text-foreground">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
