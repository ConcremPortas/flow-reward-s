import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import HubRH from "./pages/HubRH";
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
import { LocaisDSS } from "./pages/cadastros/LocaisDSS";
import FormulasCalculo from "./pages/cadastros/FormulasCalculo";
import GerarPremiacoes from "./pages/GerarPremiacoes";
import CargosSalariosDashboard from "./pages/cargos-salarios/Dashboard";
import Cargos from "./pages/cargos-salarios/Cargos";
import FuncionariosCargosSalarios from "./pages/cargos-salarios/Funcionarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Hub RH - Home */}
          <Route path="/" element={<HubRH />} />
          
          {/* Premiações App Routes */}
          <Route path="/premiacoes" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/premiacoes/funcionarios" element={<MainLayout><Funcionarios /></MainLayout>} />
          <Route path="/premiacoes/dss" element={<MainLayout><DSS /></MainLayout>} />
          <Route path="/premiacoes/epi" element={<MainLayout><EPI /></MainLayout>} />
          <Route path="/premiacoes/faltas-advertencias" element={<MainLayout><FaltasAdvertencias /></MainLayout>} />
          <Route path="/premiacoes/producao-setor" element={<MainLayout><ProducaoSetor /></MainLayout>} />
          <Route path="/premiacoes/indicadores-setor" element={<MainLayout><IndicadoresSetor /></MainLayout>} />
          <Route path="/premiacoes/indicadores-gerais" element={<MainLayout><IndicadoresGerais /></MainLayout>} />
          <Route path="/premiacoes/cadastros/setores" element={<MainLayout><Setores /></MainLayout>} />
          <Route path="/premiacoes/cadastros/faixas" element={<MainLayout><Faixas /></MainLayout>} />
          <Route path="/premiacoes/cadastros/funcoes" element={<MainLayout><Funcoes /></MainLayout>} />
          <Route path="/premiacoes/cadastros/categorias" element={<MainLayout><Categorias /></MainLayout>} />
          <Route path="/premiacoes/cadastros/base-premiacao" element={<MainLayout><BasePremiacao /></MainLayout>} />
          <Route path="/premiacoes/cadastros/empresas" element={<MainLayout><Empresas /></MainLayout>} />
          <Route path="/premiacoes/cadastros/tipos-indicadores" element={<MainLayout><TiposIndicadores /></MainLayout>} />
          <Route path="/premiacoes/cadastros/tipos-indicadores-gerais" element={<MainLayout><TiposIndicadoresGerais /></MainLayout>} />
          <Route path="/premiacoes/cadastros/locais-dss" element={<MainLayout><LocaisDSS /></MainLayout>} />
          <Route path="/premiacoes/cadastros/formulas-calculo" element={<MainLayout><FormulasCalculo /></MainLayout>} />
          <Route path="/premiacoes/gerar-premiacoes" element={<MainLayout><GerarPremiacoes /></MainLayout>} />
          
          {/* Cargos e Salários App Routes */}
          <Route path="/cargos-salarios" element={<MainLayout><CargosSalariosDashboard /></MainLayout>} />
          <Route path="/cargos-salarios/cargos" element={<MainLayout><Cargos /></MainLayout>} />
          <Route path="/cargos-salarios/funcionarios" element={<MainLayout><FuncionariosCargosSalarios /></MainLayout>} />
          <Route path="/cargos-salarios/cadastros/setores" element={<MainLayout><Setores /></MainLayout>} />
          
          {/* Indicadores RH App Routes - TODO */}
          <Route path="/indicadores-rh" element={<MainLayout><NotFound /></MainLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
