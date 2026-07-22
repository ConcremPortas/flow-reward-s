import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import type { Setor } from '@/hooks/useSetores';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import { competenciaToDate } from '../domain/productionCalculations';
import { parseNumberBR } from '../domain/productionValidation';
import { UNIDADES_MEDIDA } from '../types/production-entry.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setores: Setor[];
  competenciaAtual: string;
  createRegistro: (r: Omit<ProducaoSetor, 'id' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onCreated: () => void;
}

/** Cadastro unitário — ação SECUNDÁRIA (não é o fluxo principal). Preserva os campos existentes. */
export function ProductionSingleEntryDialog({ open, onOpenChange, setores, competenciaAtual, createRegistro, onCreated }: Props) {
  const [setorId, setSetorId] = useState('');
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [unidade, setUnidade] = useState('unidades');
  const [meta, setMeta] = useState('');
  const [realizado, setRealizado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  const metaNum = parseNumberBR(meta);
  const realizadoNum = parseNumberBR(realizado);
  const valido = !!setorId && !!competencia && metaNum != null && metaNum > 0 && realizadoNum != null && realizadoNum >= 0;

  const reset = () => {
    setSetorId(''); setCompetencia(competenciaAtual); setUnidade('unidades');
    setMeta(''); setRealizado(''); setObservacoes('');
  };

  const handleSave = async () => {
    if (!valido || saving) return;
    setSaving(true);
    try {
      await createRegistro({
        setor_id: setorId,
        data_producao: competenciaToDate(competencia),
        meta_diaria: metaNum!,
        producao_realizada: realizadoNum!,
        unidade_medida: unidade,
        observacoes: observacoes || undefined,
      });
      onCreated();
      reset();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) { onOpenChange(o); if (o) setCompetencia(competenciaAtual); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar registro</DialogTitle>
          <DialogDescription>Cadastro individual de meta e produção realizada de um setor.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Setor *</Label>
            <Select value={setorId} onValueChange={setSetorId}>
              <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
              <SelectContent>
                {setores.filter((s) => s.ativo).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}{s.empresa ? ` — ${s.empresa.nome}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Competência *</Label>
            <CompetenciaPicker value={competencia} onChange={setCompetencia} className="w-full" />
          </div>

          <div className="space-y-1.5">
            <Label>Unidade de medida</Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIDADES_MEDIDA.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="single-meta">Meta mensal *</Label>
            <Input id="single-meta" inputMode="decimal" placeholder="Ex.: 30.000" value={meta} onChange={(e) => setMeta(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="single-realizado">Produção realizada *</Label>
            <Input id="single-realizado" inputMode="decimal" placeholder="Ex.: 28.500" value={realizado} onChange={(e) => setRealizado(e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="single-obs">Observações</Label>
            <Input id="single-obs" placeholder="Opcional" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!valido || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
