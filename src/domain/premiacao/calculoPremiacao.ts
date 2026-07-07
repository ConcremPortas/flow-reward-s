/**
 * Motor de cálculo de premiações — BASELINE DE CARACTERIZAÇÃO (Etapa 2 da Reforma V2).
 *
 * ⚠️ IMPORTANTE: este módulo é uma TRANSCRIÇÃO VERBATIM da lógica que hoje vive
 * embutida em `src/pages/GerarPremiacoes.tsx` (função `gerarPremiacoes`). O objetivo
 * é CONGELAR o comportamento atual — mesmo eventuais esquisitices — para permitir
 * refatoração segura na Etapa 3 (onde o componente passará a importar deste módulo,
 * eliminando a duplicação).
 *
 * NÃO corrigir regras aqui. Qualquer comportamento suspeito deve ser mantido idêntico
 * ao componente e registrado como achado no relatório da Etapa 2.
 *
 * Referências de linha apontam para GerarPremiacoes.tsx na data da transcrição (2026-07-07).
 */

// ----------------------------------------------------------------------------
// Tipos mínimos (desacoplados dos hooks/DB para permitir testes determinísticos)
// ----------------------------------------------------------------------------

export interface ConfiguracaoKits {
  minimo_kits: number;
  incremento_faixa: number;
  bonus_base: number;
  bonus_por_faixa: number;
}

/** Configuração-fallback embutida no componente (GerarPremiacoes.tsx:37-41). */
export const FALLBACK_CONFIG: ConfiguracaoKits = {
  minimo_kits: 10000,
  incremento_faixa: 250,
  bonus_base: 100,
  bonus_por_faixa: 25,
};

/** Pesos da fórmula de cálculo. Os 6 últimos podem não existir no schema real. */
export interface FormulaPesos {
  peso_producao_setor?: number | null;
  peso_epi?: number | null;
  peso_faltas?: number | null;
  peso_advertencias?: number | null;
  peso_dss?: number | null;
  peso_faturamento?: number | null;
  peso_itens_nc?: number | null;
  peso_tratamento_nc?: number | null;
  peso_hora_maquina?: number | null;
  peso_operacao_segura?: number | null;
  peso_limpeza?: number | null;
}

export interface NotasParciais {
  notaProducao: number;
  notaEpi: number;
  notaFaltas: number;
  notaDss: number;
  notaAdvertencias: number;
  notaFaturamento: number;
  notaItensNC: number;
  notaTratamentoNC: number;
  notaHoraMaquina: number;
  notaOperacaoSegura: number;
  notaLimpeza: number;
}

// ----------------------------------------------------------------------------
// Funções auxiliares — verbatim de GerarPremiacoes.tsx
// ----------------------------------------------------------------------------

/** GerarPremiacoes.tsx:43-49 */
export const calcularComissao = (realizado: number, config: ConfiguracaoKits): number => {
  if (realizado >= config.minimo_kits) {
    const faixasCompletas = Math.floor((realizado - config.minimo_kits) / config.incremento_faixa);
    return config.bonus_base + (faixasCompletas * config.bonus_por_faixa);
  }
  return 0;
};

/** GerarPremiacoes.tsx:52-58 */
export const calcularNotaFaltas = (quantidade: number): number => {
  if (quantidade >= 4) return 0;
  if (quantidade === 3) return 0.25;
  if (quantidade === 2) return 0.50;
  if (quantidade === 1) return 0.75;
  return 1.0;
};

/** GerarPremiacoes.tsx:60-66 */
export const calcularNotaAdvertencias = (quantidade: number): number => {
  if (quantidade >= 4) return 0;
  if (quantidade === 3) return 0.25;
  if (quantidade === 2) return 0.50;
  if (quantidade === 1) return 0.75;
  return 1.0;
};

/** GerarPremiacoes.tsx:130-131 */
export const normalize = (s?: string): string =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/** GerarPremiacoes.tsx:133-138 */
export const extractKitsMultiplier = (baseName?: string): number => {
  const normalized = normalize(baseName);
  const match = normalized.match(/(\d+)%/);
  if (match) return parseInt(match[1]) / 100;
  return 1.0;
};

/** Detecção de tipo de base (GerarPremiacoes.tsx:163-165). */
export const isProducaoBase = (baseNome?: string): boolean =>
  normalize(baseNome).includes('PRODUCAO');

export const isKitsBase = (baseNome?: string): boolean =>
  normalize(baseNome).startsWith('KIT');

// ----------------------------------------------------------------------------
// Notas parciais — verbatim dos trechos inline
// ----------------------------------------------------------------------------

/** EPI: GerarPremiacoes.tsx:262-266. Sem auditorias → 1.0. */
export const calcularNotaEpi = (totalAuditorias: number, naoConformidades: number): number =>
  totalAuditorias > 0 ? (totalAuditorias - naoConformidades) / totalAuditorias : 1.0;

/** DSS: GerarPremiacoes.tsx:274-278. Sem DSS no local → 1.0. */
export const calcularNotaDss = (totalDssLocal: number, presencasDss: number): number =>
  totalDssLocal > 0 ? presencasDss / totalDssLocal : 1.0;

/**
 * Produção: GerarPremiacoes.tsx:302-303 / 316-317.
 * Retorna o percentual real e a nota limitada a 1.0.
 * Sem meta (totalMeta<=0) → percentual 0 e nota 0.
 */
export const calcularNotaProducao = (
  totalMeta: number,
  totalRealizado: number,
): { percentual: number; nota: number } => {
  const percentual = totalMeta > 0 ? totalRealizado / totalMeta : 0;
  const nota = Math.min(percentual, 1.0);
  return { percentual, nota };
};

/** Média de indicador de setor: GerarPremiacoes.tsx:353-364. Sem itens válidos → 1.0. */
export const calcularMediaIndicador = (
  pares: Array<{ meta: number | null | undefined; realizado: number | null | undefined }>,
): number => {
  const percentuais = pares
    .map(({ meta, realizado }) => {
      if (!meta || meta === 0) return null;
      return Math.min((realizado || 0) / meta, 1.0);
    })
    .filter((v): v is number => v != null);
  if (percentuais.length === 0) return 1.0;
  return percentuais.reduce((acc, v) => acc + v, 0) / percentuais.length;
};

// ----------------------------------------------------------------------------
// Nota geral — verbatim de GerarPremiacoes.tsx:374-436
// ----------------------------------------------------------------------------

export interface CalcularNotaGeralParams {
  notas: NotasParciais;
  formula: FormulaPesos | null | undefined;
  isProducaoGeracao: boolean;
  isSupervisorOrEncarregado: boolean;
}

export const calcularNotaGeral = (params: CalcularNotaGeralParams): number => {
  const { notas, formula, isProducaoGeracao, isSupervisorOrEncarregado } = params;
  const {
    notaProducao, notaEpi, notaFaltas, notaDss, notaAdvertencias,
    notaFaturamento, notaItensNC, notaTratamentoNC, notaHoraMaquina,
    notaOperacaoSegura, notaLimpeza,
  } = notas;

  let notaGeral = 0;

  if (isProducaoGeracao && isSupervisorOrEncarregado) {
    // GerarPremiacoes.tsx:377-402 — 11 componentes, com pesos-padrão de fallback.
    const pProd = formula ? (formula.peso_producao_setor || 0) / 100 : 0.20;
    const pFat  = formula ? (formula.peso_faturamento    || 0) / 100 : 0.26;
    const pEpi  = formula ? (formula.peso_epi            || 0) / 100 : 0.10;
    const pFalt = formula ? (formula.peso_faltas         || 0) / 100 : 0.10;
    const pDss  = formula ? (formula.peso_dss            || 0) / 100 : 0.10;
    const pINC  = formula ? (formula.peso_itens_nc       || 0) / 100 : 0.05;
    const pAdv  = formula ? (formula.peso_advertencias   || 0) / 100 : 0.03;
    const pTNC  = formula ? (formula.peso_tratamento_nc  || 0) / 100 : 0.03;
    const pHM   = formula ? (formula.peso_hora_maquina   || 0) / 100 : 0.03;
    const pOS   = formula ? (formula.peso_operacao_segura || 0) / 100 : 0.03;
    const pLimp = formula ? (formula.peso_limpeza        || 0) / 100 : 0.07;

    notaGeral = (
      (notaProducao       * pProd) +
      (notaFaturamento    * pFat)  +
      (notaEpi            * pEpi)  +
      (notaFaltas         * pFalt) +
      (notaDss            * pDss)  +
      (notaItensNC        * pINC)  +
      (notaAdvertencias   * pAdv)  +
      (notaTratamentoNC   * pTNC)  +
      (notaHoraMaquina    * pHM)   +
      (notaOperacaoSegura * pOS)   +
      (notaLimpeza        * pLimp)
    );
  } else {
    if (!formula) {
      // GerarPremiacoes.tsx:404-405
      notaGeral = 0;
    } else {
      const pesoProducao     = (formula.peso_producao_setor || 0) / 100;
      const pesoEpi          = (formula.peso_epi            || 0) / 100;
      const pesoDss          = (formula.peso_dss            || 0) / 100;
      const pesoFaltas       = (formula.peso_faltas         || 0) / 100;
      const pesoAdvertencias = (formula.peso_advertencias   || 0) / 100;

      if (isProducaoGeracao) {
        // GerarPremiacoes.tsx:413-420
        notaGeral = (
          (notaProducao     * pesoProducao)     +
          (notaEpi          * pesoEpi)          +
          (notaDss          * pesoDss)          +
          (notaFaltas       * pesoFaltas)       +
          (notaAdvertencias * pesoAdvertencias)
        );
      } else {
        // KITS: GerarPremiacoes.tsx:422-433
        const somaKits = pesoEpi + pesoDss + pesoFaltas + pesoAdvertencias;
        if (somaKits > 0.01) {
          notaGeral = (
            (notaEpi          * pesoEpi)          +
            (notaDss          * pesoDss)          +
            (notaFaltas       * pesoFaltas)       +
            (notaAdvertencias * pesoAdvertencias)
          );
        } else {
          notaGeral = (notaEpi + notaDss + notaFaltas + notaAdvertencias) / 4;
        }
      }
    }
  }

  return notaGeral;
};

// ----------------------------------------------------------------------------
// Bônus — verbatim de GerarPremiacoes.tsx:438-454
// ----------------------------------------------------------------------------

export interface CalcularBonusParams {
  notaGeral: number;
  valorFaixa: number;
  valorFixo: number;
  isKitsGeracao: boolean;
  /** Comissão de kits já calculada (calcularComissao). Só usado quando isKitsGeracao. */
  valorKits?: number;
  /** Multiplicador extraído do nome da base (extractKitsMultiplier). */
  multiplicadorKits: number;
}

export const calcularBonus = (
  params: CalcularBonusParams,
): { bonusBase: number; bonusPossivel: number; bonusAlcancado: number } => {
  const { notaGeral, valorFaixa, valorFixo, isKitsGeracao, valorKits, multiplicadorKits } = params;

  const bonusBase = isKitsGeracao ? (valorKits || 0) * multiplicadorKits : valorFaixa;
  const bonusPossivel = bonusBase + valorFixo;
  const bonusAlcancado = bonusBase * notaGeral + valorFixo;

  return { bonusBase, bonusPossivel, bonusAlcancado };
};
