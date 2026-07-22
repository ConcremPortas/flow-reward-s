import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ItemForm { varianteId: string; quantidade: string }
export interface VarianteOpt { id: string; label: string }

interface Props {
  itens: ItemForm[];
  options: VarianteOpt[];
  disabled?: boolean;
  onChange: (itens: ItemForm[]) => void;
}

/** Campo reutilizável de linhas de item (variante + quantidade) com adicionar/remover. */
export function ItemRowsField({ itens, options, disabled, onChange }: Props) {
  const setItem = (i: number, patch: Partial<ItemForm>) => onChange(itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const add = () => onChange([...itens, { varianteId: '', quantidade: '' }]);
  const remove = (i: number) => onChange(itens.length === 1 ? itens : itens.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {itens.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">
            <Select value={it.varianteId} onValueChange={(v) => setItem(i, { varianteId: v })} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Selecione o item" /></SelectTrigger>
              <SelectContent>{options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input type="number" min={1} step={1} placeholder="Qtd" className="w-24" value={it.quantidade} onChange={(e) => setItem(i, { quantidade: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => remove(i)} disabled={itens.length === 1} aria-label="Remover item">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Adicionar item</Button>
    </div>
  );
}

/** Extrai/valida os itens preenchidos → payload das RPCs. Lança mensagem se inválido. */
export function itensParaPayload(itens: ItemForm[]): { variante_id: string; quantidade: number }[] {
  const validos = itens
    .filter((it) => it.varianteId && it.quantidade.trim() !== '')
    .map((it) => ({ variante_id: it.varianteId, quantidade: Number(it.quantidade) }));
  if (validos.length === 0) throw new Error('Adicione ao menos um item com quantidade.');
  if (validos.some((it) => !Number.isInteger(it.quantidade) || it.quantidade <= 0)) throw new Error('Quantidades devem ser inteiros positivos.');
  return validos;
}
