# Software Design Document (SDD) — ConcremRH / Recompensa-Flow

**Versão:** 1.0
**Data:** 2026-07-07
**Aplicação:** Sistema de Gestão de RH, Premiações e Cargos & Salários — Concrem
**Repositório:** `recompensa-flow` (Vite + React + TypeScript + Supabase)

---

## 1. Introdução

### 1.1 Objetivo
Este documento descreve o desenho técnico da aplicação **ConcremRH**, uma plataforma web interna de Recursos Humanos que centraliza três domínios de negócio: **Premiações** (cálculo de bônus por desempenho), **Cargos & Salários** e **Indicadores de RH**. O foco central e mais elaborado do sistema é o **motor de cálculo de premiações mensais** por funcionário.

### 1.2 Escopo
O sistema cobre:
- Gestão de funcionários, setores, empresas, funções, faixas salariais e categorias.
- Registro de eventos que alimentam o cálculo de bônus: DSS (Diálogo de Segurança), auditorias de EPI, faltas/advertências, produção por setor e indicadores gerais/setoriais.
- Configuração de **fórmulas de cálculo** (pesos por categoria/base) e **kits de comissão** com vigência mensal.
- Geração, ajuste, persistência e exportação (Excel/PDF) de resultados de premiação.
- Módulo de Cargos & Salários (cargos, plano de carreira, histórico, avaliações de desempenho).
- Controle de acesso por perfil e por seção.

### 1.3 Definições e siglas
| Termo | Significado |
|-------|-------------|
| **DSS** | Diálogo de Segurança e Saúde — reunião de segurança registrada por local |
| **EPI** | Equipamento de Proteção Individual — auditorias de conformidade |
| **Base de Premiação** | Agrupamento que define o "pote" de bônus (ex.: Produção, Kits 100%, Kits 50%) |
| **Competência** | Mês de referência do cálculo (formato `YYYY-MM`) |
| **Faixa** | Faixa salarial associada a um valor de bônus base |
| **Nota** | Valor entre 0 e 1 que representa o desempenho num critério |
| **RLS** | Row Level Security (Postgres/Supabase) |

---

## 2. Visão Geral da Arquitetura

A aplicação é uma **Single Page Application (SPA)** cliente-servidor de duas camadas:

```
┌─────────────────────────────────────────────┐
│  Cliente (Browser) — React SPA               │
│  ┌────────────┐  ┌──────────────┐            │
│  │  Pages     │  │  Components   │            │
│  │  (rotas)   │  │  (UI shadcn)  │            │
│  └─────┬──────┘  └──────────────┘            │
│        │                                      │
│  ┌─────▼───────────────────────┐             │
│  │  Hooks (camada de dados)     │             │
│  │  useFuncionarios, useDSS...  │             │
│  └─────┬───────────────────────┘             │
│        │  supabase-js client                  │
└────────┼──────────────────────────────────────┘
         │  HTTPS (REST + RPC)
┌────────▼──────────────────────────────────────┐
│  Supabase (PostgreSQL gerenciado)              │
│  • Tabelas concremrh_* / concrem_*             │
│  • Funções RPC (SECURITY DEFINER)              │
│  • RLS Policies + Triggers                     │
└────────────────────────────────────────────────┘
```

**Características arquiteturais:**
- Toda a **lógica de negócio de cálculo roda no cliente** (ver [src/pages/GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx)). O Supabase funciona primariamente como camada de dados/persistência.
- Não há backend próprio (sem Node/Express); a comunicação é direta do browser para o Supabase via `@supabase/supabase-js`.
- Autenticação é **customizada via RPC** (não usa o Supabase Auth nativo).

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Linguagem | TypeScript | 5.8 |
| Framework UI | React | 18.3 |
| Build tool | Vite | 5.4 (plugin `@vitejs/plugin-react-swc`) |
| Roteamento | react-router-dom | 6.30 |
| Estado servidor | @tanstack/react-query | 5.83 |
| Componentes | shadcn/ui sobre Radix UI | — |
| Estilo | Tailwind CSS | 3.4 (+ `tailwindcss-animate`, `@tailwindcss/typography`) |
| Formulários | react-hook-form + zod | 7.61 / 3.25 |
| Backend/DB | Supabase (PostgreSQL) | client 2.57 |
| Gráficos | recharts | 2.15 |
| Exportação Excel | exceljs / xlsx | 4.4 / 0.18 |
| Exportação PDF | jspdf + jspdf-autotable | 4.2 / 5.0 |
| Exportação Word | docx | 9.7 |
| Ícones | lucide-react | 0.462 |
| Deploy | Vercel (`framework: vite`, output `dist`) | — |

Configuração de build: [vite.config.ts](vite.config.ts) — servidor local na porta **8080**, alias `@` → `./src`, `vite-plugin-node-polyfills` (necessário para as libs de exportação que dependem de APIs Node no browser).

---

## 4. Estrutura do Projeto

```
src/
├── App.tsx                 # Definição de todas as rotas + providers globais
├── main.tsx                # Bootstrap React
├── contexts/
│   └── AuthContext.tsx     # Estado de autenticação, perfis, controle de acesso
├── components/
│   ├── Layout/             # MainLayout, Header, Sidebar, CargosSalariosSidebar
│   ├── ProtectedRoute.tsx  # Guarda de rota por perfil
│   ├── cargos-salarios/    # CargoForm, CargoDetails
│   └── ui/                 # ~50 componentes shadcn/ui reutilizáveis
├── hooks/                  # ~30 hooks de acesso a dados (1 por entidade)
├── pages/                  # Telas por domínio
│   ├── cadastros/          # CRUDs de configuração
│   └── cargos-salarios/    # Módulo Cargos & Salários
├── integrations/supabase/  # client.ts + types.ts (schema tipado gerado)
└── lib/                    # utils, dateUtils

supabase/
├── config.toml
└── migrations/             # 21 migrações SQL (schema, RLS, triggers, seeds)
```

**Padrão de camadas:** cada entidade de negócio tem um hook dedicado (`useFuncionarios`, `useDSS`, `useResultadosPremiacao`, etc.) que encapsula as chamadas ao Supabase e expõe estado + operações CRUD. As páginas consomem esses hooks e concentram a lógica de apresentação e, no caso de premiações, o cálculo.

---

## 5. Autenticação e Autorização

### 5.1 Autenticação
Implementada em [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx). **Não usa o Supabase Auth nativo** — usa uma RPC customizada:

- **Login:** `supabase.rpc('concremrh_verify_login', { p_email, p_password })` → retorna `{ ok, id, email, nome, perfil, secoes }`.
- A sessão é persistida em `localStorage` sob a chave `concremrh_session` (objeto `UserProfile` serializado).
- Não há token JWT/refresh do Supabase Auth; a sessão é puramente client-side.

> **Nota de segurança (dívida técnica):** como a validação de credenciais é feita por RPC e a sessão fica só no `localStorage`, a proteção efetiva depende inteiramente das políticas RLS no banco. Ver §11.

### 5.2 Modelo de perfis
Tipo `UserPerfil = 'admin' | 'rh' | 'sesmt' | 'producao' | 'custom'`.

Cada usuário tem um conjunto de **seções** (`SectionKey`): `dashboard`, `rh`, `sesmt`, `producao`, `premiacoes`, `cadastros`, `cargos_salarios`.

Regras de acesso (`AuthContext`):
- `admin` → acesso total (bypassa checagens).
- Demais perfis → acesso liberado apenas às seções presentes em `profile.secoes`.
- `canAccessHub(appCode)` mapeia módulos do Hub para seções via `HUB_MODULE_SECTIONS`.

Rota default por perfil (`DEFAULT_ROUTE`): admin/rh → `/`; sesmt → `/premiacoes/dss`; producao → `/premiacoes/producao-setor`.

### 5.3 Autorização de rotas
[src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) recebe `allowedPerfis` e envolve cada rota em [src/App.tsx](src/App.tsx). Exemplos:
- `/` (Hub) → `admin`, `rh`
- `/premiacoes/dss`, `/premiacoes/epi` → `admin`, `rh`, `sesmt`
- `/premiacoes/producao-setor`, `/indicadores-*` → `admin`, `rh`, `producao`
- `/premiacoes/gerar-premiacoes`, `/relatorio-premiacoes`, `/cadastros/*` → `admin`, `rh`
- `/cadastros/usuarios` → **`admin` apenas**

### 5.4 Gestão de usuários
[src/hooks/useUsuarios.ts](src/hooks/useUsuarios.ts) via RPCs `SECURITY DEFINER`:
- `concremrh_create_user(p_nome, p_email, p_senha, p_perfil, p_secoes)`
- `concremrh_update_user_password(p_id, p_senha)`
- Update de perfil/seções/ativo direto na tabela `concremrh_usuarios`.

---

## 6. Modelo de Dados

O schema tipado está em [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts). As tabelas do domínio ativo usam o prefixo **`concremrh_`** (uma geração anterior de migrações usa `concrem_`; ver §11 — dívida de nomenclatura).

### 6.1 Tabelas principais (prefixo `concremrh_`)

**Núcleo organizacional**
| Tabela | Papel |
|--------|-------|
| `concremrh_funcionarios` | Colaboradores; FKs para setor, função, faixa, categoria, empresa, base_premiacao, local_dss; `valor_fixo`, `ativo`, `setor_ids[]` (multi-setor) |
| `concremrh_setores` | Setores; `supervisor_id`, `encarregado_id` |
| `concremrh_empresas` | Empresas do grupo |
| `concremrh_funcoes` | Funções/cargos operacionais |
| `concremrh_categorias` | Categorias (AUXILIAR, SUPERVISOR, ENCARREGADO…) — dirigem a fórmula |
| `concremrh_faixas` | Faixas salariais → `valor` de bônus base |
| `concremrh_funcionario_setores` | Relação N:N funcionário↔setor |

**Eventos que alimentam o cálculo**
| Tabela | Papel |
|--------|-------|
| `concremrh_dss` | Registros de DSS: `local_dss_id`, `data_realizacao`, `participantes_ids[]` |
| `concremrh_locais_dss` | Locais onde o DSS ocorre |
| `concremrh_epi` | Auditorias de EPI: `funcionario_id`, `data_entrega`, `status` (`nao_conforme`) |
| `concremrh_faltas_advertencias` | `tipo` (`falta`\|`advertencia`), `data_ocorrencia`, `quantidade` |
| `concremrh_producao_setor` | `setor_id`, `data_producao`, `meta_diaria`, `producao_realizada` |
| `concremrh_indicadores_setor` | Indicadores setoriais (NC, hora-máquina, operação segura, limpeza) meta/realizado por competência |
| `concremrh_indicadores_gerais` | Indicadores gerais por competência (ex.: `FAT` faturamento, `KITS`) via `tipo_indicador.codigo` |
| `concremrh_tipos_indicadores` / `_gerais` | Catálogos de tipos de indicador |

**Premiação**
| Tabela | Papel |
|--------|-------|
| `concremrh_base_premiacao` | Bases (Produção, Kits X%…); o nome dirige regras (`startsWith('KIT')`, `%`) |
| `concremrh_formulas_calculo` | Pesos por (categoria × base): `peso_producao_setor`, `peso_epi`, `peso_dss`, `peso_faltas`, `peso_advertencias`, `peso_faturamento`, `peso_itens_nc`, `peso_tratamento_nc`, `peso_hora_maquina`, `peso_operacao_segura`, `peso_limpeza` |
| `concremrh_configuracoes_kits` | Parâmetros de comissão de Kits com **vigência mensal** (`vigencia_inicio` `YYYY-MM`, `minimo_kits`, `incremento_faixa`, `bonus_base`, `bonus_por_faixa`) |
| `concremrh_resultados_premiacao` | Resultado calculado por funcionário/competência/base (todas as notas + `bonus_possivel`, `bonus_alcancado`, `valor_ajustado`, `observacao_ajuste`) |

**Cargos & Salários / RH**
| Tabela | Papel |
|--------|-------|
| `concremrh_cargos` | Cargos: missão, responsabilidades[], competências[], salário mín/máx, nível hierárquico |
| `concremrh_plano_carreira` | Trilhas de carreira |
| `concremrh_historico_cargos` | Histórico de movimentações de cargo |
| `concremrh_avaliacoes_desempenho` | Avaliações: competências (JSON), nota geral, elegibilidade a promoção, período |
| `concremrh_estrutura_hierarquica` | Estrutura organizacional |
| `concremrh_hr_applications` | Catálogo de módulos do Hub RH |
| `concremrh_user_application_permissions` | Permissão de usuário por aplicação |
| `concremrh_user_roles` | Papéis (`app_role`: admin, rh_manager, user) |
| `concremrh_usuarios` | Contas de usuário (email, senha hash, perfil, seções, ativo) |

### 6.2 Funções RPC (Postgres)
- `concremrh_verify_login`, `concremrh_create_user`, `concremrh_update_user_password` — autenticação/gestão de usuários (SECURITY DEFINER).
- `has_role(_user_id, _role)` e `has_app_permission(_user_id, _app_code)` — checagens de autorização usadas em RLS ([migração 20251120130201](supabase/migrations/20251120130201_d7ad1ee5-0fb8-4255-bce9-81e0f934f197.sql)).
- `update_funcionario_setor_ids`, `get_all_funcionario_setor_ids` — manutenção do relacionamento multi-setor.

### 6.3 RLS e triggers
- Todas as tabelas têm RLS habilitado. Várias políticas de configuração são permissivas (`USING (true)`), delegando a proteção à camada de aplicação/RPC.
- Trigger padrão `update_updated_at_column()` mantém `updated_at` em `BEFORE UPDATE`.

---

## 7. Módulos Funcionais

### 7.1 Hub RH ([HubRH.tsx](src/pages/HubRH.tsx))
Tela inicial (rota `/`) que apresenta os módulos disponíveis (Premiações, Cargos & Salários, Indicadores RH) conforme as permissões do usuário, lidos de `concremrh_hr_applications` via `useHRApplications`.

### 7.2 SESMT (Segurança)
- **DSS** ([DSS.tsx](src/pages/DSS.tsx)): registra reuniões de segurança por local e lista de participantes. Base da `nota_dss`.
- **EPI** ([EPI.tsx](src/pages/EPI.tsx)): auditorias de conformidade de EPI por funcionário. Base da `nota_epi`.

### 7.3 Produção
- **Produção por Setor** ([ProducaoSetor.tsx](src/pages/ProducaoSetor.tsx)): meta diária × realizado por setor. Base da `nota_producao`.
- **Indicadores por Setor** ([IndicadoresSetor.tsx](src/pages/IndicadoresSetor.tsx)): NC (identificação/tratamento), hora-máquina, operação segura, limpeza — meta/realizado por competência (usados para supervisores/encarregados).
- **Indicadores Gerais** ([IndicadoresGerais.tsx](src/pages/IndicadoresGerais.tsx)): faturamento (`FAT`) e volume de kits (`KITS`) por competência.

### 7.4 RH / Premiações
- **Funcionários** ([Funcionarios.tsx](src/pages/Funcionarios.tsx)): CRUD do cadastro central, com exportação.
- **Faltas & Advertências** ([FaltasAdvertencias.tsx](src/pages/FaltasAdvertencias.tsx)): eventos disciplinares que reduzem notas.
- **Gerar Premiações** ([GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx)): motor de cálculo (§8).
- **Relatório de Premiações** ([RelatorioPremiacao.tsx](src/pages/RelatorioPremiacao.tsx)): visualização, ajuste manual (`valor_ajustado`/`observacao_ajuste`) e exportação Excel/PDF.
- **Dashboard** ([Dashboard.tsx](src/pages/Dashboard.tsx)): consolidação/indicadores de premiação.

### 7.5 Cadastros (config — admin/rh)
Setores, Faixas, Funções, Categorias, Base de Premiação, Empresas, Tipos de Indicadores (setor e gerais), Locais DSS, **Fórmulas de Cálculo**, **Configurações de Kits**, Usuários.

### 7.6 Cargos & Salários
Dashboard, Cargos (com `CargoForm`/`CargoDetails`), Funcionários (visão C&S). Suporta plano de carreira, histórico de cargos, avaliações de desempenho e estrutura hierárquica.

---

## 8. Motor de Cálculo de Premiações (núcleo do sistema)

Implementado integralmente no cliente em [src/pages/GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx). É o componente mais crítico do sistema.

### 8.1 Entradas
- **Bases de premiação** selecionadas (multi-select).
- **Competência** (`YYYY-MM`).
- **Categorias** (opcional; filtro).
- Para cada funcionário ativo vinculado à base: eventos do mês (faltas, advertências, EPI, DSS, produção, indicadores) + fórmula de pesos aplicável.

### 8.2 Cálculo das notas parciais (cada uma ∈ [0, 1])
Recorte da lógica por critério (mês = intervalo `dataInicio`..`dataFim` derivado da competência):

| Nota | Regra |
|------|-------|
| **Faltas** | `4+→0`, `3→0.25`, `2→0.5`, `1→0.75`, `0→1.0` |
| **Advertências** | mesma escala das faltas |
| **EPI** | `(auditorias − não_conformidades) / auditorias`; sem auditorias → `1.0` |
| **DSS** | `presenças_no_local / total_DSS_do_local`; sem DSS → `1.0` |
| **Produção** | `min(realizado/meta, 1.0)` somando `meta_diaria`/`producao_realizada` do(s) setor(es) |
| **Faturamento** | indicador geral `FAT` da competência ÷ 100 (só supervisor/encarregado) |
| **Indicadores NC/HM/OS/Limpeza** | média de `min(realizado/meta, 1.0)` sobre setores supervisionados |

**Produção — supervisor vs. operacional:** para categorias `SUPERVISOR`/`ENCARREGADO`, a nota agrega os setores supervisionados (via `setor_ids` ou `supervisor_id`/`encarregado_id`); para os demais, usa o `setor_id` do funcionário.

### 8.3 Nota geral (média ponderada pelos pesos da fórmula)
Os pesos vêm de `concremrh_formulas_calculo`, selecionada por (categoria × base) — com fallbacks por nome de fórmula. Todos os pesos são divididos por 100.

- **Produção — Supervisor/Encarregado:** combina 11 componentes (produção, faturamento, EPI, faltas, DSS, itens NC, advertências, tratamento NC, hora-máquina, operação segura, limpeza). Há pesos-padrão de fallback quando a fórmula não define (ex.: `pProd=0.20`, `pFat=0.26`…).
- **Produção — demais categorias:** produção, EPI, DSS, faltas, advertências.
- **Kits:** EPI, DSS, faltas, advertências ponderados; se a soma dos pesos ≈ 0, usa média aritmética simples dos 4.

### 8.4 Comissão de Kits e vigência
Para bases cujo nome começa com `KIT`:
```
calcularComissao(realizado, config):
  se realizado >= config.minimo_kits:
    faixasCompletas = floor((realizado − minimo_kits) / incremento_faixa)
    retorna bonus_base + faixasCompletas * bonus_por_faixa
  senão: retorna 0
```
- `config` vem de `getConfigParaCompetencia(competencia)` ([useConfiguracoesKits.ts](src/hooks/useConfiguracoesKits.ts)) — seleciona a configuração vigente de `concremrh_configuracoes_kits` cuja `vigencia_inicio` ≤ competência, permitindo alterar parâmetros sem afetar meses passados. Há `FALLBACK_CONFIG` embutido.
- O **multiplicador** vem do percentual no nome da base (ex.: "KITS 50%" → 0.5), extraído por regex.

### 8.5 Bônus final
```
valorFaixa   = funcionario.faixa.valor
valorFixo    = funcionario.valor_fixo
bonusBase    = isKits ? (valorKits * multiplicadorKits) : valorFaixa
bonusPossivel   = bonusBase + valorFixo
bonusAlcancado  = bonusBase * notaGeral + valorFixo
```

### 8.6 Persistência
[src/hooks/useResultadosPremiacao.ts](src/hooks/useResultadosPremiacao.ts): `salvarResultados` faz **delete-then-insert** por (competência, base) em `concremrh_resultados_premiacao`. `verificarResultadosExistentes` dispara o diálogo de sobrescrita antes de recalcular. `updateResultado` grava ajustes manuais (`valor_ajustado`, `observacao_ajuste`).

### 8.7 Saída / Relatórios
[RelatorioPremiacao.tsx](src/pages/RelatorioPremiacao.tsx) exibe os resultados, permite ajuste manual e exporta em **Excel** (exceljs/xlsx) e **PDF** (jspdf + jspdf-autotable), com branding Concrem. Outras telas (Funcionários, Faltas, Produção) também exportam.

### 8.8 Fluxo resumido
```
Seleciona bases + competência (+ categorias)
        │
        ▼
Para cada base:
  filtra funcionários ativos da base/categoria
  para cada funcionário:
     coleta eventos do mês → notas parciais
     resolve fórmula (pesos) → nota geral
     resolve bônus base (faixa ou comissão de kits)
     → bonus_possivel / bonus_alcancado
  delete+insert em concremrh_resultados_premiacao
        │
        ▼
Redireciona ao Relatório (visualizar/ajustar/exportar)
```

---

## 9. Padrões de Projeto e Convenções

- **Um hook por entidade**, encapsulando acesso ao Supabase e expondo `{ dados, loading, create, update, delete, refetch }`.
- **Providers globais** em [App.tsx](src/App.tsx): `QueryClientProvider`, `TooltipProvider`, `AuthProvider`, `BrowserRouter`, + dois toasters (shadcn `Toaster` e `Sonner`).
- **UI**: shadcn/ui (Radix + Tailwind) em `components/ui/` — biblioteca de componentes acessíveis e consistentes.
- **Tipagem forte** do schema via `types.ts` gerado do Supabase.
- **Feedback ao usuário** via toasts em operações de dados.
- **Idioma**: domínio em português; nomes de tabelas/campos em português.

---

## 10. Build, Deploy e Configuração

- **Scripts** ([package.json](package.json)): `dev` (Vite :8080), `build`, `build:dev`, `preview`, `lint` (ESLint 9 + typescript-eslint).
- **Variáveis de ambiente** ([.env](.env)): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (chave anon), `VITE_SUPABASE_PROJECT_ID`. Consumidas em [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts).
- **Deploy**: Vercel ([vercel.json](vercel.json)) — `framework: vite`, `buildCommand: npm run build`, `outputDirectory: dist`.
- **Migrações**: 21 arquivos SQL versionados em `supabase/migrations/`.

---

## 11. Riscos, Dívidas Técnicas e Considerações

1. **Lógica de negócio no cliente** — todo o motor de premiação roda no browser. Isso facilita manipulação e dificulta auditoria/teste; um recálculo server-side (Edge Function/RPC) seria mais robusto e seguro.
2. **Autenticação client-side** — sessão só no `localStorage`, sem token do Supabase Auth. A segurança real depende das RLS; várias políticas de configuração são `USING (true)` (abertas). Recomenda-se endurecer RLS e/ou migrar para Supabase Auth.
3. **Dupla nomenclatura de tabelas** — coexistem prefixos `concrem_` (migrações antigas) e `concremrh_` (schema ativo). Convém consolidar para evitar confusão.
4. **Regras acopladas a strings** — a distinção de base (Produção/Kits) e o multiplicador de kits derivam do **nome** da base (`startsWith('KIT')`, regex de `%`). Frágil a renomeações; um campo estruturado (tipo/percentual) seria mais seguro.
5. **Pesos de fallback hard-coded** — o cálculo de supervisor/encarregado tem pesos padrão embutidos no componente; idealmente todos os pesos deveriam vir de `concremrh_formulas_calculo`.
6. **Ausência de testes automatizados** — não há suíte de testes; dada a criticidade do cálculo financeiro, testes de unidade sobre o motor de premiação são altamente recomendados.
7. **`config.toml` diverge do `.env`** — o `project_id` em `supabase/config.toml` não corresponde ao projeto em `.env`; verificar qual é o ambiente ativo.

---

## 12. Referências

- Rotas e composição: [src/App.tsx](src/App.tsx)
- Autenticação/autorização: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx), [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)
- Motor de premiação: [src/pages/GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx)
- Persistência de resultados: [src/hooks/useResultadosPremiacao.ts](src/hooks/useResultadosPremiacao.ts)
- Config de kits: [src/hooks/useConfiguracoesKits.ts](src/hooks/useConfiguracoesKits.ts), [migração configuracoes_kits](supabase/migrations/20260624000000_configuracoes_kits.sql)
- Schema tipado: [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts)
- Autorização no banco: [migração 20251120130201](supabase/migrations/20251120130201_d7ad1ee5-0fb8-4255-bce9-81e0f934f197.sql)
