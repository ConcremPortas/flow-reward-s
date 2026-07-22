import { StatusBadge } from '@/components/app/StatusBadge';
import { SEV_LABEL, SEV_VARIANT, type Severidade } from './severity';

/** Selo de severidade (texto + cor). Ícone/contexto via tooltip nos consumidores. */
export function InventorySeverityBadge({ sev }: { sev: Severidade }) {
  return <StatusBadge variant={SEV_VARIANT[sev]}>{SEV_LABEL[sev]}</StatusBadge>;
}
