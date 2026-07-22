import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Building2, UserCog, HardHat, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Empresa } from '@/hooks/useEmpresas';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { matchesSectorFilters } from '../domain/sectorFilters';
import { buildLeadershipGroups, computeLeadershipSummary } from '../domain/leadershipStructure';
import { normalizeStr } from '../domain/sectorPresentation';
import { LeadershipStructure } from '../components/LeadershipStructure';
import { DEFAULT_SECTOR_FILTERS, type SectorRow } from '../types/sector.types';

interface Props {
  rows: SectorRow[];
  empresas: Empresa[];
  supervisores: Funcionario[];
  encarregados: Funcionario[];
  onOpenSetor: (r: SectorRow) => void;
}

export function LeadershipStructureView({ rows, empresas, supervisores, encarregados, onOpenSetor }: Props) {
  const [search, setSearch] = useState('');
  const [empresaId, setEmpresaId] = useState('todos');
  const [supervisorId, setSupervisorId] = useState('todos');
  const [encarregadoId, setEncarregadoId] = useState('todos');
  const [somentePendencias, setSomentePendencias] = useState(false);

  const filtered = useMemo(() => rows.filter(r => {
    if (!matchesSectorFilters(r, { ...DEFAULT_SECTOR_FILTERS, empresaId, supervisorId, encarregadoId })) return false;
    if (search && !normalizeStr([r.nome, r.empresaNome, r.supervisorNome, r.encarregadoNome].join(' ')).includes(normalizeStr(search))) return false;
    if (somentePendencias && r.status.status === 'completo') return false;
    return true;
  }), [rows, search, empresaId, supervisorId, encarregadoId, somentePendencias]);

  const summary = useMemo(() => computeLeadershipSummary(filtered), [filtered]);
  const groups = useMemo(() => buildLeadershipGroups(filtered), [filtered]);

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Setores" value={String(summary.setores)} icon={Building2} />
        <StatCard title="Supervisores" value={String(summary.supervisores)} icon={UserCog} />
        <StatCard title="Encarregados" value={String(summary.encarregados)} icon={HardHat} />
        <StatCard title="Estrutura completa" value={String(summary.completos)} icon={CheckCircle2} status="positive" />
        <StatCard title="Pendência de liderança" value={String(summary.comPendenciaLideranca)} icon={AlertTriangle} status={summary.comPendenciaLideranca > 0 ? 'warning' : 'positive'} />
      </div>

      <SectionCard title="Estrutura de liderança" description="Agrupada por supervisor. Clique em um setor para ver os detalhes.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar setor ou liderança..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todas as empresas</SelectItem>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={supervisorId} onValueChange={setSupervisorId}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Supervisor" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos supervisores</SelectItem>{supervisores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={encarregadoId} onValueChange={setEncarregadoId}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Encarregado" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos encarregados</SelectItem>{encarregados.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
            </Select>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Checkbox checked={somentePendencias} onCheckedChange={(v) => setSomentePendencias(!!v)} /> Somente pendências
            </label>
          </div>

          <LeadershipStructure groups={groups} onOpenSetor={onOpenSetor} />
        </div>
      </SectionCard>
    </div>
  );
}
