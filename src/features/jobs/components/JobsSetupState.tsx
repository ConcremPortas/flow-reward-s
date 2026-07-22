import { Briefcase, Layers, Wallet, Users2, ClipboardCheck, ArrowRight, GitCompareArrows } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';

interface Props {
  colaboradoresAtivos: number;
  setoresTotal: number;
  niveisDistintos: number;
  funcoesDistintas: number;
  onNovoCargo: () => void;
  onAnalisarFuncoes: () => void;
}

/**
 * Estado de implantação (nenhum cargo cadastrado). Mostra dados REAIS e um
 * checklist guiado — não exibe busca/tabela vazias como conteúdo principal.
 * Não converte funções em cargos.
 */
export function JobsSetupState({ colaboradoresAtivos, setoresTotal, niveisDistintos, funcoesDistintas, onNovoCargo, onAnalisarFuncoes }: Props) {
  const checklist = [
    { icon: Layers, titulo: 'Configurar níveis hierárquicos', desc: 'Defina os níveis ao cadastrar os cargos (campo por cargo).' },
    { icon: Briefcase, titulo: 'Cadastrar cargos', desc: 'Crie os cargos que formam a estrutura organizacional.' },
    { icon: Wallet, titulo: 'Definir faixas salariais', desc: 'Estabeleça mínimo e máximo de cada cargo.' },
    { icon: Users2, titulo: 'Vincular colaboradores', desc: 'Enquadre os colaboradores nos cargos (via histórico de cargos).' },
    { icon: ClipboardCheck, titulo: 'Revisar enquadramento', desc: 'Confira consistência de setor, nível e faixa.' },
  ];

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Comece a estrutura de cargos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ainda não há cargos cadastrados. Hoje os {formatNumberBR(colaboradoresAtivos)} colaboradores ativos estão vinculados a
              <strong className="text-foreground"> funções</strong> — que não são cargos. Cadastre os cargos para estruturar níveis,
              faixas e enquadramento. Nada é convertido automaticamente.
            </p>
          </div>
          <Button className="shrink-0" onClick={onNovoCargo}>Novo cargo <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Colaboradores ativos" value={colaboradoresAtivos} />
        <Tile label="Setores" value={setoresTotal} />
        <Tile label="Cargos" value={0} emphasize />
        <Tile label="Níveis definidos" value={niveisDistintos} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="Checklist de implantação" description="Sequência recomendada para estruturar o plano de cargos.">
          <ol className="space-y-3">
            {checklist.map((c, i) => {
              const Icon = c.icon;
              return (
                <li key={c.titulo} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><Icon className="h-4 w-4" /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{i + 1}. {c.titulo}</h4>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </SectionCard>

        <SectionCard title="Funções existentes" description="Ponto de partida para desenhar os cargos — sem conversão automática.">
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><GitCompareArrows className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold leading-none text-foreground">{formatNumberBR(funcoesDistintas)}</p>
                <p className="text-xs text-muted-foreground">funções distintas cadastradas</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Analise as funções atuais e quantos colaboradores cada uma possui para planejar os cargos correspondentes.</p>
            <Button variant="outline" size="sm" onClick={onAnalisarFuncoes}>Analisar funções existentes</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Tile({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] ${emphasize ? 'border-primary/30' : 'border-border/70'}`}>
      <p className="text-[1.7rem] font-bold leading-none tracking-tight text-foreground">{formatNumberBR(value)}</p>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
