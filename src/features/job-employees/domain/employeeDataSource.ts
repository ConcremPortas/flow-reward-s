/**
 * Documentação e rótulos da fonte de verdade dos colaboradores desta tela.
 *
 * A tela NÃO possui cadastro próprio de pessoas: os colaboradores vêm da tabela
 * mestre do RH `concremrh_funcionarios` (mesma origem do módulo de Premiação).
 * Este módulo é responsável apenas pelo ENQUADRAMENTO (vínculo com cargo via
 * `concremrh_historico_cargos`) — não pela criação/edição do cadastro mestre,
 * que vive em `/premiacoes/funcionarios`.
 */
export const RH_MASTER_ROUTE = '/premiacoes/funcionarios';

/** Origem do cadastro exibida no drawer. */
export const CADASTRO_ORIGEM = 'Cadastro de RH (concremrh_funcionarios)';

/** Rótulos que deixam explícita a diferença função (RH) × cargo (estrutura). */
export const FUNCAO_HELP = 'Função do cadastro operacional (RH) — não é o cargo estruturado.';
export const CARGO_HELP = 'Cargo do plano de cargos e salários, vinculado via histórico de cargos.';
