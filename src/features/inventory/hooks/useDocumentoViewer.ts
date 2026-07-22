import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { urlAssinadaDocumento } from '../services/inventoryApi';

/**
 * Abre um documento privado do Storage (NF) via URL assinada curta. A janela é
 * aberta de forma síncrona no clique (evita bloqueio de popup) e só então tem a
 * URL definida — nunca expõe URL pública.
 */
export function useDocumentoViewer() {
  const { toast } = useToast();
  const [abrindo, setAbrindo] = useState<string | null>(null);

  const abrir = useCallback(async (storageKey: string) => {
    // Abre a aba SÍNCRONO no clique (evita bloqueio de popup). Sem 'noopener' aqui,
    // senão window.open retorna null; a segurança é garantida zerando win.opener.
    const win = window.open('', '_blank');
    if (win) win.opener = null;
    setAbrindo(storageKey);
    try {
      const url = await urlAssinadaDocumento(storageKey);
      if (win) {
        win.location.replace(url); // navega SÓ a aba nova; nunca a aba do sistema
      } else {
        // Popup bloqueado: tenta abrir em nova aba sem tocar na aba atual.
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      win?.close();
      toast({ title: 'Não foi possível abrir a nota fiscal', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setAbrindo(null);
    }
  }, [toast]);

  return { abrir, abrindo };
}
