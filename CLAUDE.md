# ConcremRH — Recompensa Flow

Sistema de RH da Concrem: Hub RH, Premiações (cadastros, produção, indicadores, processamento e relatórios), Cargos & Salários, Controle de Estoque (Fardamentos/EPI) e Indicadores. Vite + React + TypeScript + Supabase. Páginas em `src/pages/` são shells finos que montam features em `src/features/**`. Ver `SDD.md` e `PLANO_REFORMA_V2.md`.

> ⚠️ **Controle de Estoque** é nativo, em `src/features/inventory/**`. A pasta `controle-de-estoque-main/` na raiz do repositório é um app Next.js **standalone/legado** (tentativa antiga de integração) — **não** faça alterações de estoque nela nem a trate como parte do sistema ativo. Candidata a remoção.

## 🧠 Cérebro de engenharia (consultar antes de codar)

Antes de uma mudança relevante (nova tela, refatoração, feature, correção sensível), **consulte e siga** o cérebro de engenharia no vault do Obsidian: `obsidian/kmz/Aplicações/Cérebro/Cérebro — Índice.md` e o pilar aplicável (Arquitetura, Qualidade/Refatoração, Segurança, Padrões Supabase, Testes, Métricas/Fórmulas, Metodologia). Em conflito, **este `CLAUDE.md` (contexto do projeto) prevalece** sobre as regras genéricas do cérebro.

## 📓 Sincronização com o Obsidian (OBRIGATÓRIO)

Este projeto é documentado no vault do Obsidian, usado para leitura/consulta. **Sempre que você fizer uma alteração relevante** (nova tela, nova funcionalidade, mudança de regra de negócio, mudança de stack/escopo/status, novo fluxo ou remoção de recurso), **atualize a nota correspondente**:

`C:\Users\1kmz\OneDrive\Documentos\obsidian\kmz\Aplicações\Recompensa Flow - ConcremRH.md`

Regras:
- Escreva em português, descrevendo **funcionalidades das telas** (o que faz, ações do usuário, regras de negócio). Não cole código na nota.
- **Cada tela tem sua própria nota** na pasta `obsidian/kmz/Aplicações/Telas - ConcremRH/`, nomeada `ConcremRH — <Nome da Tela>.md` (com frontmatter `projeto:` e `modulo:`, e, no corpo, `**Projeto:** [[Recompensa Flow - ConcremRH]]`). Ao criar uma tela nova, crie a nota dela nesse padrão e adicione o link no índice `## Telas` da nota-mãe (no grupo do módulo certo); ao alterar uma tela, atualize a nota dela.
- Se mudar stack, status ou escopo, atualize o frontmatter e o resumo da nota.
- Mantenha a nota clara e sem abreviações — ela é a fonte de leitura do projeto.
- Ao final da tarefa, confirme no resumo se a nota foi atualizada (ou que não havia mudança relevante a documentar).
