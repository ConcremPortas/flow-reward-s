import { useNavigate } from 'react-router-dom';
import { Shirt, Footprints, Ruler, History } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateBR } from '@/lib/dateTime';
import { formatNumberBR } from '@/lib/formatters';
import { DELIVERY_TYPE_LABEL } from '../../domain/domainConstants';
import { maskCpf } from './cpf';
import type { DeliveryType } from '../../types/inventory.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { MedidasFuncionario, EntregaFuncionario } from '../../services/inventoryApi';

interface Props {
  funcionario: Funcionario; medidas: MedidasFuncionario | null; loadingMedidas: boolean;
  historico: EntregaFuncionario[]; loadingHist: boolean;
}

export function EmployeePanel({ funcionario: f, medidas, loadingMedidas, historico, loadingHist }: Props) {
  const navigate = useNavigate();
  const ultima = historico[0];

  return (
    <SectionCard title="Colaborador" description="Dados do cadastro do RH.">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{f.nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{f.nome}</div>
            <div className="truncate text-xs text-muted-foreground">{maskCpf(f.cpf) || '—'}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge variant={f.ativo !== false ? 'success' : 'neutral'}>{f.status || (f.ativo !== false ? 'Ativo' : 'Inativo')}</StatusBadge>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo rot="Empresa" val={f.empresa?.nome ?? '—'} />
          <Campo rot="Setor" val={f.setor?.nome ?? '—'} />
          <Campo rot="Cargo/Função" val={f.funcao?.nome ?? '—'} />
          <Campo rot="Admissão" val={f.data_admissao ? formatDateBR(f.data_admissao) : '—'} />
        </dl>

        {/* Medidas */}
        <div className="rounded-lg border border-border/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Ruler className="h-3.5 w-3.5" /> Medidas cadastradas</p>
          {loadingMedidas ? <Skeleton className="h-6 w-full" /> : !medidas || (!medidas.camisa && !medidas.calca && !medidas.calcado) ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Medidas não cadastradas</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/premiacoes/funcionarios')}>Cadastrar</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {medidas.camisa && <StatusBadge variant="info"><Shirt className="mr-1 h-3 w-3" />Camisa {medidas.camisa}</StatusBadge>}
              {medidas.calca && <StatusBadge variant="info">Calça {medidas.calca}</StatusBadge>}
              {medidas.calcado && <StatusBadge variant="info"><Footprints className="mr-1 h-3 w-3" />Calçado {medidas.calcado}</StatusBadge>}
            </div>
          )}
        </div>

        {/* Histórico */}
        <div>
          <p className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground"><span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Entregas anteriores</span>{ultima && <span>última {formatDateBR(ultima.createdAt)}</span>}</p>
          {loadingHist ? <Skeleton className="h-10 w-full" /> : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma entrega anterior registrada.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {historico.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="min-w-0"><span className="font-mono text-xs text-foreground">{h.recibo}</span> <span className="text-xs text-muted-foreground">· {DELIVERY_TYPE_LABEL[h.tipo as DeliveryType] ?? h.tipo}</span></span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatNumberBR(h.pecas)} pç · {formatDateBR(h.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="truncate font-medium text-foreground">{val}</dd></div>;
}
