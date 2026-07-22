import { useLocation } from 'react-router-dom';
import { VisaoGeralView } from '../pages/VisaoGeralView';
import { FardamentosView } from '../pages/FardamentosView';
import { EntradasView } from '../pages/EntradasView';
import { EntregasView } from '../pages/EntregasView';
import { DevolucoesView } from '../pages/DevolucoesView';
import { TrocaView } from '../pages/TrocaView';
import { AjusteView } from '../pages/AjusteView';
import { MovimentacoesView } from '../pages/MovimentacoesView';
import { AlertasView } from '../pages/AlertasView';
import { EstornosView } from '../pages/EstornosView';
import { CadastrosView } from '../pages/CadastrosView';

type InventoryView = 'visao-geral' | 'fardamentos' | 'entradas' | 'entregas' | 'devolucoes' | 'troca' | 'ajuste' | 'movimentacoes' | 'alertas' | 'estornos' | 'cadastros';
const VALID = new Set<string>(['fardamentos', 'entradas', 'entregas', 'devolucoes', 'troca', 'ajuste', 'movimentacoes', 'alertas', 'estornos', 'cadastros']);

/** Deriva a view do primeiro segmento após /controle-estoque (raiz = visão geral). */
function viewFromPath(pathname: string): InventoryView {
  const seg = pathname.replace(/^\/controle-estoque\/?/, '').split('/')[0];
  return (VALID.has(seg) ? seg : 'visao-geral') as InventoryView;
}

/**
 * Shell do módulo Controle de Estoque. A navegação entre telas fica na AppSidebar
 * global (rotas /controle-estoque[/entradas|entregas|devolucoes|cadastros]); aqui
 * apenas resolvemos a rota para a view correspondente.
 */
export function InventoryShell() {
  const { pathname } = useLocation();
  const view = viewFromPath(pathname);

  return (
    <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
      {view === 'fardamentos' ? <FardamentosView />
        : view === 'entradas' ? <EntradasView />
        : view === 'entregas' ? <EntregasView />
        : view === 'devolucoes' ? <DevolucoesView />
        : view === 'troca' ? <TrocaView />
        : view === 'ajuste' ? <AjusteView />
        : view === 'movimentacoes' ? <MovimentacoesView />
        : view === 'alertas' ? <AlertasView />
        : view === 'estornos' ? <EstornosView />
        : view === 'cadastros' ? <CadastrosView />
        : <VisaoGeralView />}
    </div>
  );
}
