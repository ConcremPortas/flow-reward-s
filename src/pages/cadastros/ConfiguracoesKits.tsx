import { KitsConfigShell } from '@/features/kits-config/components/KitsConfigShell';

/**
 * Rota /premiacoes/cadastros/configuracoes-kits — Central de Regras de Premiação
 * por Kits. A orquestração vive na feature `kits-config`; esta página apenas monta
 * o shell. Não altera o motor (`src/domain/premiacao/calculoPremiacao.ts`).
 */
const ConfiguracoesKits = () => <KitsConfigShell />;

export default ConfiguracoesKits;
