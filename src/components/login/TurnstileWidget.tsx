import { useEffect, useRef } from 'react';

/**
 * Widget do Cloudflare Turnstile (modo explícito). Carrega o script uma vez e
 * renderiza o desafio; devolve o token via onToken. Em expiração/erro chama
 * onExpire/onError para o pai invalidar o token. Para forçar um novo desafio,
 * remonte o componente com uma `key` diferente (o token é de uso único).
 */
interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface Props {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export function TurnstileWidget({ siteKey, onToken, onExpire, onError, theme = 'auto' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Mantém os callbacks atuais sem re-renderizar o widget.
  const cbs = useRef({ onToken, onExpire, onError });
  cbs.current = { onToken, onExpire, onError };

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme,
        callback: (t: string) => cbs.current.onToken(t),
        'expired-callback': () => cbs.current.onExpire?.(),
        'error-callback': () => cbs.current.onError?.(),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let sc = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!sc) {
        sc = document.createElement('script');
        sc.src = SCRIPT_SRC;
        sc.async = true;
        sc.defer = true;
        document.head.appendChild(sc);
      }
      sc.addEventListener('load', render);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* já removido */ }
      }
      widgetId.current = null;
    };
  }, [siteKey, theme]);

  return <div ref={ref} className="min-h-[65px]" />;
}
