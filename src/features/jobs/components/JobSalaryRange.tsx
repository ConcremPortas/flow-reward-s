import { Lock } from 'lucide-react';
import type { Cargo } from '@/hooks/useCargos';
import { formatCurrencyBRL } from '@/lib/formatters';

interface Props {
  cargo: Pick<Cargo, 'salario_minimo' | 'salario_maximo'>;
  autorizado: boolean;
  /** Mostra o ponto médio (usado no drawer). */
  comPontoMedio?: boolean;
}

/**
 * Faixa salarial do cargo (mín/médio/máx). Guardada por autorização — usuários
 * sem permissão veem "Acesso restrito", nunca o valor. Sem faixa → "Não definida".
 * (A faixa vem de `concremrh_cargos`; a barreira aqui é de UI — ver recomendação
 * de endurecimento no relatório.)
 */
export function JobSalaryRange({ cargo, autorizado, comPontoMedio }: Props) {
  if (!autorizado) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> Acesso restrito
      </span>
    );
  }
  const min = cargo.salario_minimo;
  const max = cargo.salario_maximo;
  if (typeof min !== 'number' && typeof max !== 'number') {
    return <span className="text-sm text-muted-foreground">Não definida</span>;
  }
  const medio = typeof min === 'number' && typeof max === 'number' ? (min + max) / 2 : null;
  return (
    <span className="text-sm text-foreground">
      {typeof min === 'number' ? formatCurrencyBRL(min) : '—'}
      {' – '}
      {typeof max === 'number' ? formatCurrencyBRL(max) : '—'}
      {comPontoMedio && medio != null && (
        <span className="ml-2 text-xs text-muted-foreground">(médio {formatCurrencyBRL(medio)})</span>
      )}
    </span>
  );
}
