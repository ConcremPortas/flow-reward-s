import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { maskNumericInput, parseNumberBR } from '../domain/indicatorValidation';

interface Props {
  value: number | null;
  changed?: boolean;
  ariaLabel: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
  /** Enter → confirma e (opcionalmente) avança. */
  onEnterNext?: () => void;
  /** Ctrl+Enter → salvar e avançar. */
  onCtrlEnter?: () => void;
}

/**
 * Campo de edição numérica pt-BR reutilizável (Meta/Realizado). Não salva a cada
 * tecla: mantém texto local e faz commit no blur/Enter. Aceita vírgula decimal,
 * trata colagem via máscara e mostra erro (borda) quando o texto é inválido.
 */
export function SectorIndicatorNumberInput({ value, changed, ariaLabel, disabled, onCommit, onEnterNext, onCtrlEnter }: Props) {
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
      disabled={disabled}
      value={display}
      placeholder="—"
      onFocus={() => { setFocused(true); setText(value == null ? '' : String(value).replace('.', ',')); }}
      onBlur={() => { setFocused(false); onCommit(text); }}
      onChange={(e) => setText(maskNumericInput(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(text);
          if (e.ctrlKey) { onCtrlEnter?.(); return; }
          ref.current?.blur();
          onEnterNext?.();
        }
      }}
      className={cn(
        'h-9 text-right tabular-nums',
        changed && 'border-status-warning/60 bg-status-warning/[0.06]',
        parseNumberBR(text) == null && focused && text !== '' && 'border-destructive',
      )}
    />
  );
}
