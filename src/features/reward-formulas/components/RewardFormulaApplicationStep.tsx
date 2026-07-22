import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Option { id: string; nome: string }
interface Props {
  nome: string; setNome: (v: string) => void;
  descricao: string; setDescricao: (v: string) => void;
  categoriaId: string; setCategoriaId: (v: string) => void;
  baseId: string; setBaseId: (v: string) => void;
  categorias: Option[]; bases: Option[];
  duplicados: RewardFormulaRow[];
  onOpenExisting: (r: RewardFormulaRow) => void;
}

export function RewardFormulaApplicationStep({ nome, setNome, descricao, setDescricao, categoriaId, setCategoriaId, baseId, setBaseId, categorias, bases, duplicados, onOpenExisting }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="rf-nome">Nome *</Label>
        <Input id="rf-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Auxiliar - PRODUÇÃO" autoFocus />
        <p className="text-[11px] text-muted-foreground">O nome é usado como chave de fallback pelo motor (padrão "Categoria - BASE") quando categoria/base não casam por ID.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={categoriaId || 'none'} onValueChange={(v) => setCategoriaId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Não definida</SelectItem>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Base de premiação</Label>
          <Select value={baseId || 'none'} onValueChange={(v) => setBaseId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Não definida</SelectItem>{bases.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rf-desc">Descrição</Label>
        <Textarea id="rf-desc" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional..." />
      </div>

      {duplicados.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
          <div>
            <p className="font-semibold text-status-warning">Já existe fórmula para esta combinação</p>
            <p className="text-foreground">{duplicados.length} fórmula(s) para a mesma categoria × base. No cálculo, a <strong>primeira por nome</strong> prevalece.</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {duplicados.map(d => <Button key={d.id} variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(d)}>{d.nome}</Button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
