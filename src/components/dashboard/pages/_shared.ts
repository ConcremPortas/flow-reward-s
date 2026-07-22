import type { DashboardModel } from '@/features/dashboard/hooks/useDashboardData';
import type { DrawerData } from '@/components/dashboard/AnalyticsDrawer';

/** Props compartilhadas por todas as páginas — recebem o modelo já processado. */
export interface PageProps {
  dash: DashboardModel;
  openDrawer: (d: DrawerData) => void;
  onSeeAllAttention: () => void;
}
