import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TipoIndicadorGeral } from '@/hooks/useTiposIndicadoresGerais';

interface Props {
  tipos: TipoIndicadorGeral[];
  value: string;
  onChange: (tipoId: string) => void;
  label?: string;
  className?: string;
}

/** Seletor de indicador analisado (Visão Geral / Evolução). */
export function GeneralIndicatorSelector({ tipos, value, onChange, label = 'Indicador analisado', className }: Props) {
  return (
    <div className={className}>
      {label && <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-[240px]"><SelectValue placeholder="Selecione o indicador" /></SelectTrigger>
        <SelectContent>
          {tipos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
