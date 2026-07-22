import { InventoryShell } from '@/features/inventory/components/InventoryShell';

/**
 * Rota /controle-estoque — Central de Controle de Estoque (Gestão de Fardamentos).
 * A orquestração vive na feature `inventory` (abas via ?view=). Esta página apenas
 * monta o shell. Dados/mutações no mesmo banco Supabase; escrita de saldo via RPC
 * transacional; leitura/escrita respeitam a RLS (seção `estoque`, admin total).
 */
export default function ControleEstoque() {
  return <InventoryShell />;
}
