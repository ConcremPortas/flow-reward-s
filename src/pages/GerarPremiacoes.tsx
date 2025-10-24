import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Download, Calculator } from 'lucide-react';
import { useBasePremiacao } from '@/hooks/useBasePremiacao';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useFormulasCalculo } from '@/hooks/useFormulasCalculo';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { format } from 'date-fns';

// Função para calcular comissão de Kits
const calcularComissao = (realizado: number) => {
  if (realizado >= 9000) {
    const faixasCompletas = Math.floor((realizado - 9000) / 250);
    const faixasLimitadas = Math.min(faixasCompletas, 44);
    const bonus = 100 + (faixasLimitadas * 25);
    return bonus;
  } else {
    return 0;
  }
};

// Funções para calcular notas
const calcularNotaFaltasAdvertencias = (quantidade: number) => {
  if (quantidade > 4) return 0;
  if (quantidade === 4) return 0;
  if (quantidade === 3) return 0.25;
  if (quantidade === 2) return 0.50;
  if (quantidade === 1) return 0.75;
  return 1.0; // 0 faltas/advertências
};

interface FuncionarioPremiacao {
  id: string;
  cod_funcionario: string;
  nome: string;
  setor: string;
  funcao: string;
  faixa: string;
  categoria: string;
  valor_faixa: number;
  // Notas individuais
  nota_producao?: number;
  nota_epi: number;
  nota_faltas: number;
  nota_advertencias: number;
  nota_dss: number;
  // Cálculos
  valor_kits?: number;
  nota_geral: number;
  bonus_possivel: number;
  bonus_alcancado: number;
}

const GerarPremiacoes = () => {
  const { bases } = useBasePremiacao();
  const { funcionarios } = useFuncionarios();
  const { formulas } = useFormulasCalculo();
  const { salvarResultados, verificarResultadosExistentes, resultados } = useResultadosPremiacao();
  
  const [baseId, setBaseId] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [competenciaVisualizacao, setCompetenciaVisualizacao] = useState('');
  const [baseVisualizacao, setBaseVisualizacao] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [premiacoes, setPremiacoes] = useState<FuncionarioPremiacao[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  const baseSelecionada = bases.find(b => b.id === baseId);
  const baseVisualizacaoSelecionada = bases.find(b => b.id === baseVisualizacao);
  const isProducao = baseVisualizacaoSelecionada?.nome === 'PRODUCAO';
  const isKits = baseVisualizacaoSelecionada?.nome === 'KITS';

  const filteredPremiacoes = premiacoes.filter(premiacao =>
    premiacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    premiacao.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    premiacao.cod_funcionario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Carregar resultados salvos quando mudar base/competência de visualização
  const carregarResultadosSalvos = () => {
    if (!baseVisualizacao || !competenciaVisualizacao) {
      setPremiacoes([]);
      return;
    }

    const mesCompetencia = competenciaVisualizacao + '-01';
    const resultadosFiltrados = resultados.filter(r => 
      r.mes_competencia === mesCompetencia && 
      r.base_premiacao_id === baseVisualizacao
    );

    if (resultadosFiltrados.length > 0) {
      const premiacoesCarregadas: FuncionarioPremiacao[] = resultadosFiltrados.map(r => ({
        id: r.funcionario_id || r.id,
        cod_funcionario: r.cod_funcionario || '',
        nome: r.nome,
        setor: r.setor || 'N/A',
        funcao: r.funcao || 'N/A',
        faixa: r.faixa || 'N/A',
        categoria: r.categoria || 'N/A',
        valor_faixa: r.valor_faixa || 0,
        nota_producao: r.nota_producao || undefined,
        nota_epi: r.nota_epi,
        nota_faltas: r.nota_faltas,
        nota_advertencias: r.nota_advertencias,
        nota_dss: r.nota_dss,
        valor_kits: r.valor_kits || undefined,
        nota_geral: r.nota_geral,
        bonus_possivel: r.bonus_possivel,
        bonus_alcancado: r.bonus_alcancado
      }));
      setPremiacoes(premiacoesCarregadas);
    } else {
      setPremiacoes([]);
    }
  };

  // Carregar resultados salvos quando base/competência de visualização mudar
  React.useEffect(() => {
    carregarResultadosSalvos();
  }, [baseVisualizacao, competenciaVisualizacao, resultados]);

  const iniciarGeracao = async () => {
    if (!baseId || !competencia) return;
    
    // Verificar se já existem resultados para este mês/base
    const existem = await verificarResultadosExistentes(competencia, baseId);
    
    if (existem) {
      setShowOverwriteDialog(true);
      return;
    }
    
    await gerarPremiacoes();
  };

  const gerarPremiacoes = async () => {
    if (!baseId || !competencia) return;
    
    setIsCalculating(true);
    setShowOverwriteDialog(false);
    
    try {

      // Filtrar apenas funcionários com a base de premiação selecionada
      const funcionariosAtivos = funcionarios.filter(f => 
        f.ativo && f.base_premiacao_id === baseId
      );

      if (funcionariosAtivos.length === 0) {
        alert('Nenhum funcionário encontrado com a base de premiação selecionada.');
        setIsCalculating(false);
        return;
      }
      
      const premiacoesCalculadas: FuncionarioPremiacao[] = funcionariosAtivos.map(funcionario => {
        // Buscar fórmula para a categoria do funcionário
        const formula = formulas.find(f => 
          f.categoria_id === funcionario.categoria_id && 
          f.base_premiacao_id === baseId
        );
        
        if (!formula) {
          // Valores padrão se não encontrar fórmula
          return {
            id: funcionario.id,
            cod_funcionario: funcionario.cpf || funcionario.id.substring(0, 8),
            nome: funcionario.nome,
            setor: funcionario.setor?.nome || 'N/A',
            funcao: funcionario.funcao?.nome || 'N/A',
            faixa: 'Faixa 1', // Buscar da relação do funcionário
            categoria: funcionario.categoria?.nome || 'N/A',
            valor_faixa: 500, // Valor mock - buscar da faixa real
            nota_producao: isProducao ? 0.85 : undefined,
            nota_epi: 0.9,
            nota_faltas: 1.0,
            nota_advertencias: 1.0,
            nota_dss: 0.8,
            valor_kits: isKits ? calcularComissao(9500) : undefined,
            nota_geral: 0.85,
            bonus_possivel: isKits ? calcularComissao(9500) : 500,
            bonus_alcancado: isKits ? calcularComissao(9500) * 0.85 : 500 * 0.85
          };
        }

        // Calcular notas baseadas na fórmula
        const notaEpi = Math.random() * 0.3 + 0.7; // Mock - calcular real
        const notaFaltas = calcularNotaFaltasAdvertencias(Math.floor(Math.random() * 3));
        const notaAdvertencias = calcularNotaFaltasAdvertencias(Math.floor(Math.random() * 2));
        const notaDss = Math.random() * 0.3 + 0.7; // Mock - calcular real
        const notaProducao = isProducao ? Math.random() * 0.3 + 0.7 : 0;

        // Calcular nota geral baseada nos pesos da fórmula
        let notaGeral = 0;
        if (isProducao) {
          notaGeral = (
            (notaProducao * formula.peso_producao_setor / 100) +
            (notaEpi * formula.peso_epi / 100) +
            (notaFaltas * formula.peso_faltas / 100) +
            (notaAdvertencias * formula.peso_advertencias / 100) +
            (notaDss * formula.peso_dss / 100)
          );
        } else {
          notaGeral = (
            (notaEpi * formula.peso_epi / 100) +
            (notaFaltas * formula.peso_faltas / 100) +
            (notaAdvertencias * formula.peso_advertencias / 100) +
            (notaDss * formula.peso_dss / 100)
          );
        }

        const valorFaixa = 500; // Mock - buscar valor real da faixa
        const valorKits = isKits ? calcularComissao(Math.floor(Math.random() * 5000) + 8000) : undefined;
        const bonusPossivel = isKits ? (valorKits || 0) : valorFaixa;
        const bonusAlcancado = bonusPossivel * notaGeral;

        return {
          id: funcionario.id,
          cod_funcionario: funcionario.cpf || funcionario.id.substring(0, 8),
          nome: funcionario.nome,
          setor: funcionario.setor?.nome || 'N/A',
          funcao: funcionario.funcao?.nome || 'N/A',
          faixa: 'Faixa 1', // Mock - buscar real
          categoria: funcionario.categoria?.nome || 'N/A',
          valor_faixa: valorFaixa,
          nota_producao: isProducao ? notaProducao : undefined,
          nota_epi: notaEpi,
          nota_faltas: notaFaltas,
          nota_advertencias: notaAdvertencias,
          nota_dss: notaDss,
          valor_kits: valorKits,
          nota_geral: notaGeral,
          bonus_possivel: bonusPossivel,
          bonus_alcancado: bonusAlcancado
        };
      });
      
      // Salvar resultados na tabela
      const salvoComSucesso = await salvarResultados(competencia, baseId, premiacoesCalculadas);
      
      if (salvoComSucesso) {
        setPremiacoes(premiacoesCalculadas);
        // Definir automaticamente os filtros de visualização para a competência recém-gerada
        setCompetenciaVisualizacao(competencia);
        setBaseVisualizacao(baseId);
      }
      
    } catch (error) {
      console.error('Erro ao gerar premiações:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCompetencia = (competencia: string) => {
    if (!competencia) return '';
    const [ano, mes] = competencia.split('-');
    return `${mes}/${ano}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Gerar Premiações</h1>
      </div>

      {/* Card Informativo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Salvamento Automático</h3>
              <p className="text-sm text-blue-700">
                Os resultados das premiações são salvos automaticamente. Se já existir um cálculo 
                para o mesmo mês e base de premiação, o sistema perguntará se deseja sobrescrever.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Parâmetros de Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base">Base de Premiação*</Label>
              <Select value={baseId} onValueChange={setBaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma base" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      {base.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competencia">Mês Competência*</Label>
              <Input
                id="competencia"
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    onClick={iniciarGeracao} 
                    disabled={!baseId || !competencia || isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? 'Calculando...' : 'Gerar Premiações'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Já existem resultados salvos</AlertDialogTitle>
                    <AlertDialogDescription>
                      Já existem premiações calculadas para {competencia && format(new Date(competencia + '-01'), 'MM/yyyy')} 
                      com a base {baseSelecionada?.nome}. Deseja recalcular e sobrescrever os resultados existentes?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={gerarPremiacoes}>
                      Sim, Recalcular
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          {/* Informação sobre funcionários elegíveis */}
          {baseId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Funcionários elegíveis:</strong> {funcionarios.filter(f => f.ativo && f.base_premiacao_id === baseId).length} funcionário(s) com base de premiação {baseSelecionada?.nome}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle>Visualizar Premiações Salvas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseVisualizacao">Base de Premiação</Label>
              <Select value={baseVisualizacao} onValueChange={setBaseVisualizacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma base" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      {base.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competenciaVisualizacao">Mês Competência</Label>
              <Input
                id="competenciaVisualizacao"
                type="month"
                value={competenciaVisualizacao}
                onChange={(e) => setCompetenciaVisualizacao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Buscar Funcionário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Buscar funcionários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {premiacoes.length > 0 && (
            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-muted-foreground">
                Exibindo resultados de {formatCompetencia(competenciaVisualizacao)} - {baseVisualizacaoSelecionada?.nome}
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Resultados */}
      {premiacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Premiações - {baseVisualizacaoSelecionada?.nome} - {formatCompetencia(competenciaVisualizacao)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cód. Funcionário</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Função</TableHead>
                    {isProducao && <TableHead>Faixa</TableHead>}
                    {isProducao && <TableHead>Resultado Produção %</TableHead>}
                    {isProducao && <TableHead>Nota DSS</TableHead>}
                    {isKits && <TableHead>Valor Kits</TableHead>}
                    <TableHead>Nota EPI</TableHead>
                    <TableHead>Nota Faltas</TableHead>
                    <TableHead>Nota Advertências</TableHead>
                    <TableHead>Nota Geral</TableHead>
                    <TableHead>Bônus Possível</TableHead>
                    <TableHead>Bônus Alcançado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPremiacoes.map((premiacao) => (
                    <TableRow key={premiacao.id}>
                      <TableCell className="font-mono">{premiacao.cod_funcionario}</TableCell>
                      <TableCell className="font-medium">{premiacao.nome}</TableCell>
                      <TableCell>{premiacao.setor}</TableCell>
                      <TableCell>{premiacao.funcao}</TableCell>
                      {isProducao && <TableCell>{premiacao.faixa}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_producao || 0)}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_dss)}</TableCell>}
                      {isKits && <TableCell>{formatCurrency(premiacao.valor_kits || 0)}</TableCell>}
                      <TableCell>{formatPercentage(premiacao.nota_epi)}</TableCell>
                      <TableCell>{formatPercentage(premiacao.nota_faltas)}</TableCell>
                      <TableCell>{formatPercentage(premiacao.nota_advertencias)}</TableCell>
                      <TableCell className="font-bold">{formatPercentage(premiacao.nota_geral)}</TableCell>
                      <TableCell>{formatCurrency(premiacao.bonus_possivel)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(premiacao.bonus_alcancado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      {filteredPremiacoes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total de Funcionários:</span>
                <p className="text-lg font-bold">{filteredPremiacoes.length}</p>
              </div>
              <div>
                <span className="font-medium">Total Bônus Possível:</span>
                <p className="text-lg font-bold">
                  {formatCurrency(filteredPremiacoes.reduce((acc, p) => acc + p.bonus_possivel, 0))}
                </p>
              </div>
              <div>
                <span className="font-medium">Total Bônus Alcançado:</span>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(filteredPremiacoes.reduce((acc, p) => acc + p.bonus_alcancado, 0))}
                </p>
              </div>
              <div>
                <span className="font-medium">Eficiência Média:</span>
                <p className="text-lg font-bold">
                  {formatPercentage(filteredPremiacoes.reduce((acc, p) => acc + p.nota_geral, 0) / filteredPremiacoes.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GerarPremiacoes;