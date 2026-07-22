import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionCard } from '@/components/app/SectionCard';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { buildHistoryRows, buildMonthlyEvolution } from '@/features/occurrences/domain/occurrenceCalculations';
import { shiftCompetencia } from '@/features/dashboard/utils/dates';
import { OccurrenceHistoryDrawer } from '../OccurrenceHistoryDrawer';
import type { OccurrenceHistoryRow } from '@/features/occurrences/types';
import type { OccurrencePageProps } from './_shared';

export function OccurrencesHistoryView({ data, competencia }: OccurrencePageProps) {
  const [search, setSearch] = useState('');
  const [setorId, setSetorId] = useState('todos');
  const [tipo, setTipo] = useState<'todos' | 'falta' | 'advertencia'>('todos');
  const [compIni, setCompIni] = useState(shiftCompetencia(competencia, -5));
  const [compFim, setCompFim] = useState(competencia);
  const [selectedRow, setSelectedRow] = useState<OccurrenceHistoryRow | null>(null);

  const funcionariosInfo = useMemo(
    () => data.funcionarios.map((f) => ({ id: f.id, nome: f.nome, cod: f.cpf || '', setor: f.setor?.nome || null, setorId: f.setor_id || null })),
    [data.funcionarios],
  );

  const rows = useMemo(() => {
    let r = buildHistoryRows(data.registros, funcionariosInfo, compIni, compFim);
    if (search) {
      const t = search.toLowerCase();
      r = r.filter((x) => x.nome.toLowerCase().includes(t) || x.cod.toLowerCase().includes(t));
    }
    if (setorId !== 'todos') {
      const idsDoSetor = new Set(funcionariosInfo.filter((f) => f.setorId === setorId).map((f) => f.id));
      r = r.filter((x) => idsDoSetor.has(x.funcionarioId));
    }
    if (tipo === 'falta') r = r.filter((x) => x.faltas > 0);
    if (tipo === 'advertencia') r = r.filter((x) => x.advertencias > 0);
    return r;
  }, [data.registros, funcionariosInfo, compIni, compFim, search, setorId, tipo]);

  const evolucaoDoSelecionado = useMemo(() => {
    if (!selectedRow) return [];
    const doFuncionario = data.registros.filter((r) => r.funcionario_id === selectedRow.funcionarioId);
    return buildMonthlyEvolution(doFuncionario, selectedRow.competencia, 12);
  }, [selectedRow, data.registros]);

  return (
    <div className="space-y-[18px]">
      <SectionCard title="Histórico de Ocorrências" description="Consulte faltas e advertências por funcionário, setor e competência">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar funcionário ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={setorId} onValueChange={setSetorId}>
              <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {data.setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Faltas e advertências</SelectItem>
                <SelectItem value="falta">Somente faltas</SelectItem>
                <SelectItem value="advertencia">Somente advertências</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <CompetenciaPicker value={compIni} onChange={setCompIni} />
              <span className="text-xs text-muted-foreground">até</span>
              <CompetenciaPicker value={compFim} onChange={setCompFim} />
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead className="text-center">Advertências</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado para os filtros selecionados.</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={`${r.funcionarioId}-${r.competencia}`} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedRow(r)}>
                    <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.setor || 'Sem setor'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.competencia}</TableCell>
                    <TableCell className="text-center text-sm">{r.faltas}</TableCell>
                    <TableCell className="text-center text-sm">{r.advertencias}</TableCell>
                    <TableCell className="text-center text-sm font-semibold">{r.total}</TableCell>
                    <TableCell className="text-center text-sm">
                      {r.variacao == null ? <span className="text-muted-foreground">—</span> : (
                        <span className={r.variacao > 0 ? 'text-destructive' : r.variacao < 0 ? 'text-success' : 'text-muted-foreground'}>
                          {r.variacao > 0 ? '+' : ''}{r.variacao}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SectionCard>

      <OccurrenceHistoryDrawer row={selectedRow} evolucao={evolucaoDoSelecionado} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
