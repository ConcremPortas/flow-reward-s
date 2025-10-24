import { ReactNode, createContext, useContext, useState } from "react";
import { Sidebar } from "./Sidebar";

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
      <div className="min-h-screen bg-background w-full flex">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
};