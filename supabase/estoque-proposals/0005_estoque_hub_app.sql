-- ============================================================================
-- PROPOSTA — Controle de Estoque · 0005_estoque_hub_app.sql
-- Registra o CARD do módulo no Hub de Aplicações (tabela concremrh_hr_applications).
--
-- ⚠️  NÃO APLICAR AUTOMATICAMENTE. O card do Hub é DIRIGIDO POR DADOS: sem esta
--     linha, o módulo NÃO aparece no Hub (mas a rota /controle-estoque e a entrada
--     na sidebar já funcionam via código). Rodar após revisão.
--
--   code = 'controle_estoque' → casa com HUB_MODULE_SECTIONS['controle_estoque']
--          = ['estoque'] (AuthContext). Admin tem acesso total.
--   icon = 'Boxes' → resolvido por resolveHubIcon (hubIcons.ts).
--   route = '/controle-estoque' (rota real em App.tsx).
-- ============================================================================

insert into public.concremrh_hr_applications (code, name, description, icon, color, route, is_active, display_order)
values (
  'controle_estoque',
  'Controle de Farda',
  'Gestão de fardamentos, entradas, entregas e devoluções.',
  'Boxes',
  null,
  '/controle-estoque',
  true,
  (select coalesce(max(display_order), 0) + 1 from public.concremrh_hr_applications)   -- após os módulos atuais
)
on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      route = excluded.route,
      is_active = excluded.is_active;

-- ROLLBACK: delete from public.concremrh_hr_applications where code = 'controle_estoque';
-- (ou is_active=false para apenas ocultar o card sem remover)
