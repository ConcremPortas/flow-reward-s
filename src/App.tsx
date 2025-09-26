import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Funcionarios } from "./pages/Funcionarios";
import { DSS } from "./pages/DSS";
import { EPI } from "./pages/EPI";
import { FaltasAdvertencias } from "./pages/FaltasAdvertencias";
import { ProducaoSetor } from "./pages/ProducaoSetor";
import { IndicadoresSetor } from "./pages/IndicadoresSetor";
import { IndicadoresGerais } from "./pages/IndicadoresGerais";
import { Setores } from "./pages/cadastros/Setores";
import { Faixas } from "./pages/cadastros/Faixas";
import { Funcoes } from "./pages/cadastros/Funcoes";
import { Categorias } from "./pages/cadastros/Categorias";
import { BasePremiacao } from "./pages/cadastros/BasePremiacao";
import { Empresas } from "./pages/cadastros/Empresas";
import { TiposIndicadores } from "./pages/cadastros/TiposIndicadores";
import { TiposIndicadoresGerais } from "./pages/cadastros/TiposIndicadoresGerais";
import FormulasCalculo from "./pages/cadastros/FormulasCalculo";
import GerarPremiacoes from "./pages/GerarPremiacoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/funcionarios" element={<MainLayout><Funcionarios /></MainLayout>} />
          <Route path="/dss" element={<MainLayout><DSS /></MainLayout>} />
          <Route path="/epi" element={<MainLayout><EPI /></MainLayout>} />
          <Route path="/faltas-advertencias" element={<MainLayout><FaltasAdvertencias /></MainLayout>} />
          <Route path="/producao-setor" element={<MainLayout><ProducaoSetor /></MainLayout>} />
          <Route path="/indicadores-setor" element={<MainLayout><IndicadoresSetor /></MainLayout>} />
          <Route path="/indicadores-gerais" element={<MainLayout><IndicadoresGerais /></MainLayout>} />
          <Route path="/cadastros/setores" element={<MainLayout><Setores /></MainLayout>} />
          <Route path="/cadastros/faixas" element={<MainLayout><Faixas /></MainLayout>} />
          <Route path="/cadastros/funcoes" element={<MainLayout><Funcoes /></MainLayout>} />
          <Route path="/cadastros/categorias" element={<MainLayout><Categorias /></MainLayout>} />
          <Route path="/cadastros/base-premiacao" element={<MainLayout><BasePremiacao /></MainLayout>} />
          <Route path="/cadastros/empresas" element={<MainLayout><Empresas /></MainLayout>} />
          <Route path="/cadastros/tipos-indicadores" element={<MainLayout><TiposIndicadores /></MainLayout>} />
          <Route path="/cadastros/tipos-indicadores-gerais" element={<MainLayout><TiposIndicadoresGerais /></MainLayout>} />
          <Route path="/cadastros/formulas-calculo" element={<MainLayout><FormulasCalculo /></MainLayout>} />
          <Route path="/gerar-premiacoes" element={<MainLayout><GerarPremiacoes /></MainLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
