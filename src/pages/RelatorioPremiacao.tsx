import { RewardsReportShell } from '@/features/rewards-report/components/RewardsReportShell';

/**
 * Rota /premiacoes/relatorio-premiacoes — Central de Relatório de Premiações.
 * A orquestração vive na feature `rewards-report`; esta página apenas monta o
 * shell. As exportações existentes foram preservadas (feature domain/rewardsExport).
 */
const RelatorioPremiacao = () => <RewardsReportShell />;

export default RelatorioPremiacao;
