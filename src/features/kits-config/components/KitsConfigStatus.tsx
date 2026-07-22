import { StatusBadge } from '@/components/app/StatusBadge';
import type { KitsConfigState } from '../types/kits-config.types';

export function KitsConfigStatus({ state }: { state: KitsConfigState }) {
  return <StatusBadge variant={state.variant}>{state.label}</StatusBadge>;
}
