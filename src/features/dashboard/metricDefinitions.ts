// Metas de referência e textos explicativos da Central Analítica de RH.
// IMPORTANTE: não existe tabela de metas no banco — estes limiares são
// referências corporativas configuráveis, claramente rotuladas como tal.

export const METAS = {
  turnoverMax: 2.5,     // % ao mês (referência)
  absenteismoMax: 3,    // faltas por 100 colaboradores no mês (referência)
  dssMin: 90,           // % de participação (referência)
  producaoMeta: 100,    // % de atingimento
  epiPendMax: 0,        // pendências de EPI aceitáveis
} as const;

export const METRIC_TOOLTIPS = {
  ativos: 'Colaboradores com vínculo ativo ao fim da competência (admissão registrada e sem desligamento no período).',
  turnover: 'Desligamentos no mês ÷ headcount médio do mês (× 100). Referência: até 2,5%/mês.',
  absenteismo: 'Faltas registradas no mês ÷ headcount × 100 (faltas por 100 colaboradores). Aproximação sem base de dias úteis.',
  horasExtras: 'Indisponível — não há registro de horas extras no banco.',
  afastamentos: 'Indisponível — não há tabela de afastamentos no banco.',
  premiacao: 'Soma do bônus alcançado dos resultados de premiação persistidos para a competência (motor de cálculo do domínio).',
} as const;

export const UNAVAILABLE_REASONS = {
  horasExtras:
    'Sem fonte de dados: não há campo/tabela de horas extras. Requer integração de ponto eletrônico ou folha de pagamento.',
  afastamentos:
    'Sem fonte de dados: não há tabela de afastamentos (atestados/INSS). Requer cadastro de afastamentos no módulo SESMT/RH.',
} as const;
