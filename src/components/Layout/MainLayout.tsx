import { ReactNode, createContext, useContext, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // Uma única sidebar global (AppSidebar) para todos os módulos; a árvore de
  // navegação é resolvida internamente pela rota. O deslocamento do conteúdo é
  // o mesmo em toda a aplicação (não há margem específica por módulo).
  const marginClass = isMobile ? 'ml-0' : isCollapsed ? 'ml-[76px]' : 'ml-60';

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-background w-full flex">
        <AppSidebar />
        <main className={`min-w-0 flex-1 p-4 transition-all duration-300 sm:p-6 ${marginClass}`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
};