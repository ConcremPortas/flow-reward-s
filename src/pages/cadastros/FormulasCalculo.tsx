import { RewardFormulasShell } from '@/features/reward-formulas/components/RewardFormulasShell';

/**
 * Rota /premiacoes/cadastros/formulas-calculo — Central de Fórmulas de Premiação.
 * A orquestração vive na feature `reward-formulas`; esta página apenas monta o
 * shell. Não altera o motor (`src/domain/premiacao/calculoPremiacao.ts`).
 */
const FormulasCalculo = () => <RewardFormulasShell />;

export default FormulasCalculo;
