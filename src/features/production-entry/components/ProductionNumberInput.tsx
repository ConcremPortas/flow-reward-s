import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { maskNumericInput, parseNumberBR } from '../domain/productionValidation';

interface Props {
  value: number | null;
  changed?: boolean;
  ariaLabel: string;
  onCommit: (value: string) => void;
  /** Enter → avança para o próximo campo (mesma coluna). */
  onEnterNext?: () => void;
}

/**
 * Campo de edição rápida numérico pt-BR. Não salva a cada tecla: mantém texto
 * local e faz commit no blur/Enter. Mostra o número formatado quando não focado.
 */
export function ProductionNumberInput({ value, changed, ariaLabel, onCommit, onEnterNext }: Props) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused) setText(value == null ? '' : String(value).replace('.', ','));
  }, [value, focused]);

  const display = focused
    ? text
    : value == null ? '' : formatNumberBR(value, Number.isInteger(value) ? 0 : 2);

  return (
    <Input
      ref={ref}
      inputMode="decimal"
      aria-label={ariaLabel}
      value={display}
      placeholder="—"
      onFocus={() => { setFocused(true); setText(value == null ? '' : String(value).replace('.', ',')); }}
      onBlur={() => { setFocused(false); onCommit(text); }}
      onChange={(e) => setText(maskNumericInput(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(text);
          ref.current?.blur();
          onEnterNext?.();
        }
      }}
      className={cn(
        'h-8 w-28 text-right tabular-nums',
        changed && 'border-status-warning/60 bg-status-warning/[0.06]',
        parseNumberBR(text) == null && focused && text !== '' && 'border-destructive',
      )}
    />
  );
}
