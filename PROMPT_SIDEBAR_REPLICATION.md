# Prompt para Replicar Sidebar

Use este prompt para replicar a sidebar em outra aplicação React/TypeScript:

---

## Prompt

Preciso criar uma sidebar para minha aplicação React com as seguintes características:

### Funcionalidades
1. **Sidebar colapsável** que alterna entre largura completa (256px) e mini (64px)
2. **Logo clicável** que alterna o estado de colapso (logo completo quando expandido, logo reduzido quando colapsado)
3. **Menu principal** com ícones e títulos (títulos ocultos quando colapsado)
4. **Submenu "Cadastros"** que:
   - Quando expandido: mostra dropdown com chevron indicador
   - Quando colapsado: mostra todos os itens individualmente com apenas ícones
5. **Indicador visual de rota ativa** com background diferenciado
6. **Context API** para gerenciar estado de colapso em toda aplicação
7. **Transições suaves** entre estados

### Especificações Técnicas

**Cores do sistema (HSL):**
- Primary: `142 93% 8%` (verde escuro #014017)
- Primary Hover: `142 93% 15%` (verde médio #075924)
- Primary Foreground: `0 0% 100%` (branco)

**Estrutura de arquivos necessária:**
```
src/
├── components/
│   └── Layout/
│       ├── MainLayout.tsx    # Provider do contexto + layout principal
│       ├── Sidebar.tsx        # Componente da sidebar
│       └── Header.tsx         # Header da aplicação
├── assets/
│   ├── logo-completo.png      # Logo para sidebar expandida
│   └── logo-colapsado.png     # Logo para sidebar colapsada
```

### Itens do Menu Principal
```typescript
[
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Funcionários", href: "/funcionarios", icon: Users },
  { title: "DSS", href: "/dss", icon: Shield },
  { title: "EPI", href: "/epi", icon: HardHat },
  { title: "Faltas/Advertências", href: "/faltas-advertencias", icon: AlertTriangle },
  { title: "Produção por Setor", href: "/producao-setor", icon: BarChart3 },
  { title: "Indicadores por Setor", href: "/indicadores-setor", icon: TrendingUp },
  { title: "Indicadores Gerais", href: "/indicadores-gerais", icon: PieChart },
  { title: "Gerar Premiações", href: "/gerar-premiacoes", icon: Gift },
]
```

### Itens do Submenu Cadastros
```typescript
[
  { title: "Setores", href: "/cadastros/setores", icon: Building2 },
  { title: "Faixas", href: "/cadastros/faixas", icon: Layers },
  { title: "Funções", href: "/cadastros/funcoes", icon: UserCog },
  { title: "Categorias", href: "/cadastros/categorias", icon: Tag },
  { title: "Base Premiação", href: "/cadastros/base-premiacao", icon: Target },
  { title: "Empresas", href: "/cadastros/empresas", icon: Factory },
  { title: "Tipos de Indicadores", href: "/cadastros/tipos-indicadores", icon: BarChart4 },
  { title: "Tipos Indicadores Gerais", href: "/cadastros/tipos-indicadores-gerais", icon: PieChart },
  { title: "Fórmulas de Cálculo", href: "/cadastros/formulas-calculo", icon: Settings },
]
```

### Requisitos de Implementação

1. **MainLayout.tsx:**
   - Criar Context para controlar estado `isCollapsed`
   - Hook `useSidebar()` para acessar o contexto
   - Layout com sidebar fixa e conteúdo principal com margin-left responsivo
   - Transição suave de 300ms na margem quando colapsar/expandir

2. **Sidebar.tsx:**
   - Sidebar fixa no lado esquerdo, altura total da tela
   - Background: `bg-primary`
   - Width: `w-64` quando expandida, `w-16` quando colapsada
   - Logo no topo com borda inferior
   - Logo clicável para alternar colapso
   - Navegação com `react-router-dom` usando componente `Link`
   - Botões com variant "sidebar" (criar no button.tsx se não existir)
   - Active state: `bg-primary-hover`
   - Ícones sempre visíveis (h-5 w-5)
   - Texto visível apenas quando expandida
   - Tooltip com título quando colapsada
   - Submenu "Cadastros" com:
     - Botão principal com ícone Settings e chevrons (Down/Right)
     - Estado controlado `cadastrosOpen`
     - Quando expandida: mostrar dropdown indentado (ml-4)
     - Quando colapsada: mostrar itens diretamente no menu principal
   - Padding: `p-4` para navegação, `p-6` para header
   - Espaçamento entre itens: `space-y-2`

3. **Button variant "sidebar":**
   - Adicionar no `src/components/ui/button.tsx`:
   ```typescript
   sidebar: "w-full justify-start bg-transparent text-primary-foreground hover:bg-primary-hover"
   ```

4. **Detecção de rota ativa:**
   - Usar `useLocation()` do react-router-dom
   - Função `isActive(href)` que:
     - Para "/": retorna true apenas se pathname === "/"
     - Para outras rotas: usa `pathname.startsWith(href)`
   - Submenu cadastros fica com bg-primary-hover se algum item estiver ativo

5. **Ícones:**
   - Usar `lucide-react`
   - Importar: LayoutDashboard, Users, Shield, HardHat, AlertTriangle, BarChart3, TrendingUp, PieChart, Settings, ChevronDown, ChevronRight, Building2, Layers, UserCog, Tag, Target, Factory, BarChart4, Gift

### Comportamento Esperado

**Quando Expandida:**
- Logo completo visível
- Todos os textos dos menus visíveis
- Submenu "Cadastros" mostra apenas o botão principal
- Ao clicar em "Cadastros", abre dropdown com itens
- Width: 256px (w-64)

**Quando Colapsada:**
- Logo reduzido visível (centralizado)
- Apenas ícones visíveis
- Tooltips aparecem no hover com o título
- Submenu "Cadastros" mostra todos os 9 itens diretamente
- Width: 64px (w-16)

**Transições:**
- Todas as mudanças de width com `transition-all duration-300`
- Ícones mantêm tamanho fixo
- Textos aparecem/desaparecem suavemente

### Dependências Necessárias
```bash
npm install react-router-dom lucide-react
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### Notas Importantes
- Usar utilitário `cn()` de `@/lib/utils` para combinar classes
- Todos os ícones devem ter className "h-5 w-5"
- Botões do submenu quando expandido usam variant "ghost"
- Border entre logo e menu: `border-b border-primary-hover`
- Sempre usar cores semânticas (primary, primary-hover, primary-foreground)

Por favor, implemente esta sidebar seguindo todas as especificações acima.
