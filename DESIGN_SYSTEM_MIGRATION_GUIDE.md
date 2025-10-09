# Guia de Migração - Design System Sistema de Remuneração

Este guia contém todos os arquivos e configurações necessárias para replicar o design system completo desta aplicação em outro projeto.

---

## 1. Sistema de Cores e Tokens CSS

Crie/substitua o arquivo `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Sistema de Remuneração - Design System
Todas as cores em HSL seguindo especificação do usuário
*/

@layer base {
  :root {
    /* Cores principais do sistema */
    --primary: 142 93% 8%;           /* Verde escuro #014017 */
    --primary-hover: 142 93% 15%;    /* Verde médio #075924 */
    --primary-foreground: 0 0% 100%; /* Branco para texto sobre verde */
    
    --success: 134 61% 41%;          /* Verde claro #28a745 */
    --success-foreground: 0 0% 100%;
    
    --destructive: 354 70% 54%;      /* Vermelho #dc3545 */
    --destructive-foreground: 0 0% 100%;
    
    /* Cores de fundo e layout */
    --background: 210 17% 97%;       /* #f8f9fa */
    --foreground: 0 0% 20%;          /* #333333 */
    
    --card: 0 0% 100%;
    --card-foreground: 0 0% 20%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 20%;
    
    /* Cores secundárias */
    --secondary: 210 40% 96%;
    --secondary-foreground: 0 0% 20%;
    
    --muted: 210 40% 95%;
    --muted-foreground: 215 16% 47%;
    
    --accent: 142 40% 95%;
    --accent-foreground: 142 93% 8%;
    
    /* Bordas e inputs */
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 142 93% 8%;
    
    /* Status específicos */
    --status-active: 134 61% 41%;    /* Verde para ativo */
    --status-inactive: 354 70% 54%;  /* Vermelho para inativo */
    --status-warning: 45 93% 47%;    /* Amarelo para avisos */
    
    /* Gradientes */
    --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)));
    --gradient-success: linear-gradient(135deg, hsl(var(--success)), hsl(134 61% 35%));
    
    /* Sombras elegantes */
    --shadow-card: 0 2px 8px -2px hsl(var(--primary) / 0.1);
    --shadow-dropdown: 0 4px 12px -4px hsl(var(--primary) / 0.15);
    --shadow-hover: 0 4px 16px -4px hsl(var(--primary) / 0.2);
    
    /* Radius */
    --radius: 0.5rem;

    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans;
  }
}

@layer components {
  /* Cards com sombras elegantes */
  .card-elegant {
    @apply bg-card rounded-lg border border-border shadow-[var(--shadow-card)];
  }
  
  .card-hover {
    @apply transition-all duration-200 hover:shadow-[var(--shadow-hover)];
  }
  
  /* Status badges */
  .status-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .status-active {
    @apply bg-success/10 text-success;
  }
  
  .status-inactive {
    @apply bg-destructive/10 text-destructive;
  }
  
  .status-warning {
    @apply bg-status-warning/10 text-status-warning;
  }
  
  /* Switch personalizado para presente/conforme */
  .switch-present {
    @apply data-[state=checked]:bg-success;
  }
  
  .switch-conforme {
    @apply data-[state=checked]:bg-success;
  }
}
```

---

## 2. Configuração Tailwind

Crie/substitua o arquivo `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        status: {
          active: "hsl(var(--status-active))",
          inactive: "hsl(var(--status-inactive))",
          warning: "hsl(var(--status-warning))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 3. Componentes de Layout

### 3.1 MainLayout (`src/components/Layout/MainLayout.tsx`)

```typescript
import { ReactNode, createContext, useContext, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-background w-full">
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <Header />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};
```

### 3.2 Sidebar e Header

Copie os arquivos completos:
- `src/components/Layout/Sidebar.tsx`
- `src/components/Layout/Header.tsx`

**Nota:** Adapte os itens de menu e navegação conforme sua aplicação.

---

## 4. Componentes UI (shadcn/ui)

Copie toda a pasta `src/components/ui/` que contém todos os componentes shadcn customizados.

Componentes principais:
- `button.tsx` - Botões com variantes customizadas
- `card.tsx` - Cards
- `input.tsx` - Inputs
- `select.tsx` - Selects
- `table.tsx` - Tabelas
- `dialog.tsx` - Modais
- `toast.tsx` e `toaster.tsx` - Notificações
- `status-badge.tsx` - Badge de status customizado
- `sidebar.tsx` - Componente base do sidebar (shadcn)
- Demais componentes conforme necessário

---

## 5. Utilitários

### `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 6. Dependências Necessárias

Instale as seguintes dependências:

```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-slot
npm install @radix-ui/react-select
npm install @radix-ui/react-dialog
npm install @radix-ui/react-toast
npm install react-router-dom
# ... outras dependências do shadcn conforme necessário
```

---

## 7. Estrutura de Pastas Recomendada

```
src/
├── components/
│   ├── Layout/
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── status-badge.tsx
│       └── ... (outros componentes)
├── lib/
│   └── utils.ts
├── assets/
│   └── (seus logos/imagens)
├── index.css
└── main.tsx
```

---

## 8. Assets (Logos)

Copie os logos da pasta `src/assets/`:
- `logo-concrem-new.png` - Logo completo
- `logo-concrem-collapsed-new.png` - Logo colapsado

---

## 9. Como Usar em Outra Aplicação

1. **Copie os arquivos de configuração:**
   - `src/index.css`
   - `tailwind.config.ts`

2. **Copie os componentes base:**
   - `src/lib/utils.ts`
   - `src/components/ui/` (toda a pasta)
   - `src/components/Layout/` (adapte conforme necessário)

3. **Instale as dependências necessárias**

4. **Configure seu `App.tsx` ou roteador principal:**

```typescript
import { MainLayout } from "@/components/Layout/MainLayout";

function App() {
  return (
    <MainLayout>
      {/* Suas rotas/páginas aqui */}
    </MainLayout>
  );
}
```

5. **Use os tokens semânticos em seus componentes:**

```typescript
// ✅ CORRETO - Use tokens semânticos
<div className="bg-primary text-primary-foreground">
<Button variant="default">Ação Principal</Button>
<Badge className="status-active">Ativo</Badge>

// ❌ ERRADO - Não use cores diretas
<div className="bg-green-500 text-white">
```

---

## 10. Paleta de Cores de Referência

### Cores Principais:
- **Primary:** `#014017` (Verde escuro)
- **Primary Hover:** `#075924` (Verde médio)
- **Success:** `#28a745` (Verde claro)
- **Destructive:** `#dc3545` (Vermelho)
- **Background:** `#f8f9fa` (Cinza muito claro)
- **Foreground:** `#333333` (Cinza escuro)

### Status:
- **Active:** Verde (`#28a745`)
- **Inactive:** Vermelho (`#dc3545`)
- **Warning:** Amarelo (`#f0ad4e`)

---

## 11. Boas Práticas

1. **Sempre use tokens semânticos do design system** - Nunca use cores diretas como `text-white`, `bg-green-500`, etc.

2. **Use as classes utilitárias customizadas:**
   - `.card-elegant` - Para cards com sombra
   - `.card-hover` - Para efeito hover
   - `.status-active`, `.status-inactive`, `.status-warning` - Para badges de status

3. **Mantenha consistência:**
   - Use `Button` do shadcn para todos os botões
   - Use `Card` para containers de conteúdo
   - Use `Table` para dados tabulares

4. **Espaçamento padrão:**
   - Padding de página: `p-6`
   - Espaçamento entre seções: `space-y-4` ou `gap-4`

---

## 12. Troubleshooting

### Cores não aparecem corretamente:
- Verifique se o `index.css` está sendo importado no `main.tsx`
- Certifique-se de que todas as cores estão em formato HSL
- Nunca use funções `hsl()` com valores RGB

### Sidebar não funciona:
- Verifique se o `SidebarContext` está configurado corretamente
- Certifique-se de ter instalado `react-router-dom`

### Componentes shadcn não aparecem:
- Instale todas as dependências do Radix UI necessárias
- Verifique se o `tailwind.config.ts` inclui os paths corretos no `content`

---

**Criado em:** 2025
**Versão:** 1.0
**Licença:** Adapte conforme necessário para sua aplicação
