# Fase Visual V1 — Recompensa RH

**Data:** 2026-07-10 · **Branch:** `visual/recompensa-rh-v1`
**Regra:** só aparência (classes/estilos/markup). Sem lógica, dados, Supabase, Auth, RLS, regras de premiação, migrations ou `.env`.

## Direção visual
Corporativo, moderno, limpo, premium. **Verde institucional** (`--primary #014017`) como marca. Menos poluição, boa leitura, foco gerencial/operacional.

## Mapa
- **Tokens globais:** `src/index.css` (CSS vars HSL) + `tailwind.config.ts`. Base boa; verde definido, Manrope, sombras, radius `0.5rem`.
- **Componentes base:** `src/components/ui/*` (shadcn) + `button.tsx` (variants `sidebar`/`success`), `status-badge.tsx`.
- **Layout:** `Layout/MainLayout.tsx` (sidebar + main). `Header.tsx` **não usado**.
- **Menu:** `Sidebar.tsx` (verde `bg-primary`), `CargosSalariosSidebar.tsx`.
- **Telas de maior impacto:** `Login`, `HubRH`, `Dashboard`, `GerarPremiacoes`, `RelatorioPremiacao`, `Funcionarios`.

## Diagnóstico central
Base de tokens sólida, mas **~100 cores hardcoded** em 13 arquivos (`green-600`, `green-900`, `#10b981`, `amber-*`) que ignoram os tokens → cada tela com um verde diferente. Unificar isso é o maior ganho de consistência.

## Plano por etapa
1. **Login premium + intro pós-login** ✅ *(primeira entrega — decisão do gestor: maior impacto imediato)*.
2. **Fundação de tokens + consistência de cor** (refina `index.css`/`tailwind`; troca os 100 hardcodes por tokens — cascata p/ 26 telas).
3. **Componentes base** (button/card/input/table/badge).
4. **Layout & Sidebar** (item ativo, seções, densidade; header de página reutilizável).
5. **Hub + Dashboard** (hero, cards).
6. **Telas densas** (tabelas: Funcionários/Relatório/Gerar).
7. **Cadastros/forms**.

## Riscos
- Cascata de tokens afeta todas as telas → mudar conservador + `build`/smoke a cada etapa.
- Hardcodes não seguem tokens → a etapa de cor deve trocá-los explicitamente.
- Manter variants/classes custom (`button sidebar/success`, `.card-elegant`, `.status-badge`).
- `.dark` e `ui/sidebar.tsx` aparentemente não usados → não tocar.
- Zero lógica/dados; `typecheck/test/build` a cada etapa.

## Entrega 1 (esta) — Login + Intro
- `Login.tsx` refeito (premium): wallpaper `/logos/Wallpaper-Concrem-Op4v2.png`, card glass, `Logo-Verde`, inputs com ícone, botão verde institucional, entrada suave. Lógica de `signIn` intacta.
- `IntroOverlay.tsx` (novo): exibida **só após login validado**, gate por `localStorage['recompensa_intro_seen_<id>']`; typing "Bem-vindo à Gestão RH" + subtítulo + barra de progresso ~3s; skip por clique/Esc; transição suave ao hub.
- `tailwind.config.ts`: keyframes aditivos (`fade-in`, `fade-in-up`, `scale-in`).
