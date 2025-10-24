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
import { useFaltasAdvertencias } from '@/hooks/useFaltasAdvertencias';
import { useEPI } from '@/hooks/useEPI';
import { useDSS } from '@/hooks/useDSS';
import { useProducaoSetor } from '@/hooks/useProducaoSetor';
import { useCategorias } from '@/hooks/useCategorias';
import { useSetores } from '@/hooks/useSetores';
import { useIndicadoresSetor } from '@/hooks/useIndicadoresSetor';
import { useIndicadoresGerais } from '@/hooks/useIndicadoresGerais';
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
const calcularNotaFaltas = (quantidade: number) => {
  if (quantidade >= 4) return 0;
  if (quantidade === 3) return 0.25;
  if (quantidade === 2) return 0.50;
  if (quantidade === 1) return 0.75;
  return 1.0; // 0 faltas
};

const calcularNotaAdvertencias = (quantidade: number) => {
  if (quantidade >= 4) return 0;
  if (quantidade === 3) return 0.25;
  if (quantidade === 2) return 0.50;
  if (quantidade === 1) return 0.75;
  return 1.0; // 0 advertências
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
  // Percentuais e notas individuais
  percentual_producao?: number; // Percentual real da produção (pode ser > 100%)
  nota_producao?: number; // Nota da produção (limitada a 100%)
  nota_epi: number;
  nota_faltas: number;
  nota_advertencias: number;
  nota_dss: number;
  nota_faturamento?: number;
  nota_itens_nc?: number;
  nota_tratamento_nc?: number;
  nota_hora_maquina?: number;
  nota_operacao_segura?: number;
  nota_limpeza?: number;
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
  const { registros: faltasAdvertencias } = useFaltasAdvertencias();
  const { epiRecords } = useEPI();
  const { dssRecords } = useDSS();
  const { registros: producaoSetor } = useProducaoSetor();
  const { categorias } = useCategorias();
  const { setores } = useSetores();
  const { indicadores: indicadoresSetor } = useIndicadoresSetor();
  const { indicadores: indicadoresGerais } = useIndicadoresGerais();
  
  const [baseId, setBaseId] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [competenciaVisualizacao, setCompetenciaVisualizacao] = useState('');
  const [baseVisualizacao, setBaseVisualizacao] = useState('');
  const [categoriaVisualizacao, setCategoriaVisualizacao] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [premiacoes, setPremiacoes] = useState<FuncionarioPremiacao[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  const baseSelecionada = bases.find(b => b.id === baseId);
  const baseVisualizacaoSelecionada = bases.find(b => b.id === baseVisualizacao);

  // Util: normalizar texto (remover acentos e deixar maiúsculo)
  const normalize = (s?: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  // Flags para visualização (baseadas na base de visualização)
  const isProducao = normalize(baseVisualizacaoSelecionada?.nome) === 'PRODUCAO';
  const isKits = normalize(baseVisualizacaoSelecionada?.nome) === 'KITS';

  // Flags para cálculo (baseadas na base de geração selecionada)
  const isProducaoGeracao = normalize(baseSelecionada?.nome) === 'PRODUCAO';
  const isKitsGeracao = normalize(baseSelecionada?.nome) === 'KITS';

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
    let resultadosFiltrados = resultados.filter(r => 
      r.mes_competencia === mesCompetencia && 
      r.base_premiacao_id === baseVisualizacao
    );

    // Filtrar por categoria se selecionada
    if (categoriaVisualizacao) {
      resultadosFiltrados = resultadosFiltrados.filter(r => 
        r.categoria?.toUpperCase().includes(categoriaVisualizacao.toUpperCase())
      );
    }

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
        percentual_producao: r.percentual_producao || undefined,
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

  // Carregar resultados salvos quando base/competência/categoria de visualização mudar
  React.useEffect(() => {
    carregarResultadosSalvos();
  }, [baseVisualizacao, competenciaVisualizacao, categoriaVisualizacao, resultados]);

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
    if (!baseId || !competencia || !categoriaId) return;
    
    setIsCalculating(true);
    setShowOverwriteDialog(false);
    
    try {
      console.log('\n🎯 ===== INICIANDO GERAÇÃO DE PREMIAÇÕES =====');
      console.log('Base utilizada para cálculo:', baseSelecionada?.nome);
      console.log('Base ID:', baseId);
      console.log('Competência:', competencia);
      console.log('==============================================\n');

      // Filtrar apenas funcionários com a base de premiação E categoria selecionadas
      const funcionariosAtivos = funcionarios.filter(f => 
        f.ativo && 
        f.base_premiacao_id === baseId &&
        f.categoria_id === categoriaId
      );

      if (funcionariosAtivos.length === 0) {
        alert('Nenhum funcionário encontrado com a base de premiação selecionada.');
        setIsCalculating(false);
        return;
      }
      
      const premiacoesCalculadas: FuncionarioPremiacao[] = funcionariosAtivos.map(funcionario => {
        // Buscar fórmula pelo nome: "CATEGORIA - BASE"
        const categoriaNome = funcionario.categoria?.nome?.toUpperCase() || '';
        const baseNome = baseSelecionada?.nome?.toUpperCase() || '';
        const nomeFormula = `${categoriaNome} - ${baseNome}`;
        
        const formula = formulas.find(f => 
          normalize(f.nome) === normalize(nomeFormula)
        );
        
        if (!formula) {
          console.error(`❌ FÓRMULA NÃO ENCONTRADA para funcionário ${funcionario.nome}`, {
            funcionario_id: funcionario.id,
            categoria_id: funcionario.categoria_id,
            categoria_nome: funcionario.categoria?.nome,
            base_premiacao_id: baseId,
            base_nome: baseSelecionada?.nome,
            nome_formula_buscado: nomeFormula,
            formulas_disponiveis: formulas.map(f => ({
              id: f.id,
              nome: f.nome,
              categoria_id: f.categoria_id,
              categoria_nome: f.categoria?.nome,
              base_premiacao_id: f.base_premiacao_id,
              base_nome: f.base_premiacao?.nome
            }))
          });
        } else {
          console.log(`✅ Fórmula encontrada para ${funcionario.nome}:`, {
            formula_id: formula.id,
            formula_nome: formula.nome,
            categoria: formula.categoria?.nome || categoriaNome,
            pesos: {
              producao: formula.peso_producao_setor,
              epi: formula.peso_epi,
              dss: formula.peso_dss,
              faltas: formula.peso_faltas,
              advertencias: formula.peso_advertencias
            }
          });
        }

        // Calcular período de competência (mês completo)
        const [ano, mes] = competencia.split('-');
        const dataInicio = `${ano}-${mes}-01`;
        const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
        const dataFim = `${ano}-${mes}-${ultimoDia}`;

        // 1. CALCULAR NOTA DE FALTAS
        const faltasDoMes = faltasAdvertencias.filter(f => 
          f.funcionario_id === funcionario.id &&
          f.tipo === 'falta' &&
          f.data_ocorrencia >= dataInicio &&
          f.data_ocorrencia <= dataFim
        );
        const totalFaltas = faltasDoMes.reduce((acc, f) => acc + (f.quantidade || 1), 0);
        const notaFaltas = calcularNotaFaltas(totalFaltas);

        // 2. CALCULAR NOTA DE ADVERTÊNCIAS
        const advertenciasDoMes = faltasAdvertencias.filter(f => 
          f.funcionario_id === funcionario.id &&
          f.tipo === 'advertencia' &&
          f.data_ocorrencia >= dataInicio &&
          f.data_ocorrencia <= dataFim
        );
        const totalAdvertencias = advertenciasDoMes.reduce((acc, f) => acc + (f.quantidade || 1), 0);
        const notaAdvertencias = calcularNotaAdvertencias(totalAdvertencias);

        // 3. CALCULAR NOTA DE EPI (baseado em auditorias)
        const episDoMes = epiRecords.filter(e => 
          e.funcionario_id === funcionario.id &&
          e.data_entrega >= dataInicio &&
          e.data_entrega <= dataFim
        );
        
        console.log(`\n=== EPI para ${funcionario.nome} ===`, {
          funcionario_id: funcionario.id,
          periodo: `${dataInicio} a ${dataFim}`,
          totalRegistrosEPI: episDoMes.length,
          registrosEPI: episDoMes.map(e => ({
            id: e.id,
            data_entrega: e.data_entrega,
            status: e.status,
            tipo_epi: e.tipo_epi,
            descricao: e.descricao
          }))
        });
        
        const totalAuditorias = episDoMes.length;
        const naoConformidades = episDoMes.filter(e => e.status === 'nao_conforme').length;
        const notaEpi = totalAuditorias > 0 
          ? (totalAuditorias - naoConformidades) / totalAuditorias 
          : 1.0;
        
        console.log(`Cálculo EPI ${funcionario.nome}:`, {
          totalAuditorias,
          naoConformidades,
          conformidades: totalAuditorias - naoConformidades,
          notaEpi: (notaEpi * 100).toFixed(2) + '%',
          formula: totalAuditorias > 0 
            ? `(${totalAuditorias} - ${naoConformidades}) / ${totalAuditorias} = ${notaEpi.toFixed(4)}`
            : 'Sem auditorias no período, considerando 100%'
        });

        // 4. CALCULAR NOTA DE DSS (presença / total DSS do local)
        const dssDoLocalNoMes = dssRecords.filter(d => 
          d.local_dss_id === funcionario.local_dss_id &&
          d.data_realizacao >= dataInicio &&
          d.data_realizacao <= dataFim
        );
        const totalDssLocal = dssDoLocalNoMes.length;
        const presencasDss = dssDoLocalNoMes.filter(d => 
          d.participantes_ids?.includes(funcionario.id)
        ).length;
        const notaDss = totalDssLocal > 0 ? presencasDss / totalDssLocal : 1.0;

        // 5. CALCULAR NOTA DE PRODUÇÃO (se for base PRODUCAO)
        let notaProducao = 0;
        let percentualProducao = 0;
        
        // Verificar se é Supervisor ou Encarregado
        const isSupervisorOrEncarregado = ['SUPERVISOR', 'ENCARREGADO'].includes(categoriaNome);
        
        if (isProducaoGeracao) {
          if (isSupervisorOrEncarregado) {
            // Para supervisores/encarregados, agregar produção de todos os setores que supervisionam
            const setoresSupervisionados = setores.filter(s => 
              s.supervisor_id === funcionario.id || s.encarregado_id === funcionario.id
            );
            
            console.log(`${categoriaNome} ${funcionario.nome} supervisiona ${setoresSupervisionados.length} setores:`, 
              setoresSupervisionados.map(s => s.nome)
            );
            
            if (setoresSupervisionados.length > 0) {
              const setorIds = setoresSupervisionados.map(s => s.id);
              const producaoDosSetores = producaoSetor.filter(p => 
                setorIds.includes(p.setor_id || '') &&
                p.data_producao >= dataInicio &&
                p.data_producao <= dataFim
              );
              
              if (producaoDosSetores.length > 0) {
                const totalMeta = producaoDosSetores.reduce((acc, p) => acc + (p.meta_diaria || 0), 0);
                const totalRealizado = producaoDosSetores.reduce((acc, p) => acc + (p.producao_realizada || 0), 0);
                percentualProducao = totalMeta > 0 ? totalRealizado / totalMeta : 0;
                notaProducao = Math.min(percentualProducao, 1.0);
                
                console.log(`Cálculo produção agregada ${funcionario.nome}:`, {
                  setores: setoresSupervisionados.map(s => s.nome).join(', '),
                  totalMeta,
                  totalRealizado,
                  percentualProducao: (percentualProducao * 100).toFixed(2) + '%',
                  notaProducao: (notaProducao * 100).toFixed(2) + '%'
                });
              }
            }
          } else {
            // Para auxiliares, usar apenas o setor do funcionário
            if (funcionario.setor_id) {
              const producaoDoSetor = producaoSetor.filter(p => 
                p.setor_id === funcionario.setor_id &&
                p.data_producao >= dataInicio &&
                p.data_producao <= dataFim
              );
              
              if (producaoDoSetor.length > 0) {
                const totalMeta = producaoDoSetor.reduce((acc, p) => acc + (p.meta_diaria || 0), 0);
                const totalRealizado = producaoDoSetor.reduce((acc, p) => acc + (p.producao_realizada || 0), 0);
                percentualProducao = totalMeta > 0 ? totalRealizado / totalMeta : 0;
                notaProducao = Math.min(percentualProducao, 1.0);
                
                console.log(`Cálculo produção ${funcionario.nome}:`, {
                  totalMeta,
                  totalRealizado,
                  percentualProducao: (percentualProducao * 100).toFixed(2) + '%',
                  notaProducao: (notaProducao * 100).toFixed(2) + '%'
                });
              }
            }
          }
        }

        // 6. CALCULAR INDICADORES ADICIONAIS PARA SUPERVISOR/ENCARREGADO
        let notaFaturamento = 0;
        let notaItensNC = 0;
        let notaTratamentoNC = 0;
        let notaHoraMaquina = 0;
        let notaOperacaoSegura = 0;
        let notaLimpeza = 0;
        
        if (isSupervisorOrEncarregado && isProducaoGeracao) {
          // Buscar indicador de faturamento do mês
          const [ano, mes] = competencia.split('-');
          const competenciaFormatada = `${ano}-${mes}-01`;
          
          const faturamentoMes = indicadoresGerais.find(i => 
            i.tipo_indicador?.codigo === 'FAT' &&
            i.competencia === competenciaFormatada
          );
          
          if (faturamentoMes) {
            notaFaturamento = faturamentoMes.percentual / 100;
            console.log(`Faturamento ${funcionario.nome}:`, {
              meta: faturamentoMes.meta,
              realizado: faturamentoMes.realizado,
              percentual: faturamentoMes.percentual,
              nota: (notaFaturamento * 100).toFixed(2) + '%'
            });
          }
          
          // Buscar indicadores de setor (agregar dos setores supervisionados)
          const setoresSupervisionados = setores.filter(s => 
            s.supervisor_id === funcionario.id || s.encarregado_id === funcionario.id
          );
          
          if (setoresSupervisionados.length > 0) {
            const setorIds = setoresSupervisionados.map(s => s.id);
            const indicadoresDosMeses = indicadoresSetor.filter(i => 
              setorIds.includes(i.setor_id || '') &&
              i.competencia === competenciaFormatada
            );
            
            // Calcular médias dos indicadores baseado em meta e realizado
            const calcularMediaIndicador = (campoMeta: string, campoRealizado: string) => {
              const percentuais = indicadoresDosMeses
                .map(i => {
                  const meta = (i as any)[campoMeta];
                  const realizado = (i as any)[campoRealizado];
                  if (!meta || meta === 0) return null;
                  return Math.min((realizado / meta), 1.0); // Calcular percentual e limitar a 100%
                })
                .filter(v => v != null);
              
              if (percentuais.length === 0) return 1.0; // Se não há dados, considera 100%
              const media = percentuais.reduce((acc, v) => acc + v, 0) / percentuais.length;
              return media;
            };
            
            notaItensNC = calcularMediaIndicador('identificacao_nc_meta', 'identificacao_nc_realizado');
            notaTratamentoNC = calcularMediaIndicador('tratamento_nc_meta', 'tratamento_nc_realizado');
            notaHoraMaquina = calcularMediaIndicador('hora_maquina_meta', 'hora_maquina_realizado');
            notaOperacaoSegura = calcularMediaIndicador('operacao_segura_meta', 'operacao_segura_realizado');
            notaLimpeza = calcularMediaIndicador('limpeza_meta', 'limpeza_realizado');
            
            console.log(`Indicadores de setor agregados ${funcionario.nome}:`, {
              totalSetores: setoresSupervisionados.length,
              setores: setoresSupervisionados.map(s => s.nome).join(', '),
              registrosEncontrados: indicadoresDosMeses.length,
              itensNC: (notaItensNC * 100).toFixed(2) + '%',
              tratamentoNC: (notaTratamentoNC * 100).toFixed(2) + '%',
              horaMaquina: (notaHoraMaquina * 100).toFixed(2) + '%',
              operacaoSegura: (notaOperacaoSegura * 100).toFixed(2) + '%',
              limpeza: (notaLimpeza * 100).toFixed(2) + '%'
            });
          }
        }

        // 7. CALCULAR NOTA GERAL
        let notaGeral = 0;
        
        // Para Supervisor/Encarregado em PRODUÇÃO, calcular SEM depender de fórmula no banco
        if (isProducaoGeracao && isSupervisorOrEncarregado) {
          // Pesos fixos: Prod(20%), EPI(10%), Faltas(10%), Adv(3%), DSS(10%),
          // Fat(30%), ItensNC(5%), TratNC(3%), HoraMaq(3%), OpSeg(3%), Limp(3%)
          notaGeral = (
            (notaProducao * 0.20) +
            (notaEpi * 0.10) +
            (notaFaltas * 0.10) +
            (notaAdvertencias * 0.03) +
            (notaDss * 0.10) +
            (notaFaturamento * 0.30) +
            (notaItensNC * 0.05) +
            (notaTratamentoNC * 0.03) +
            (notaHoraMaquina * 0.03) +
            (notaOperacaoSegura * 0.03) +
            (notaLimpeza * 0.03)
          );
          
          console.log(`\n=== NOTA GERAL ${categoriaNome} ${funcionario.nome} ===`);
          console.log(`Notas individuais:`, {
            producao: `${(notaProducao * 100).toFixed(2)}%`,
            epi: `${(notaEpi * 100).toFixed(2)}%`,
            faltas: `${(notaFaltas * 100).toFixed(2)}%`,
            advertencias: `${(notaAdvertencias * 100).toFixed(2)}%`,
            dss: `${(notaDss * 100).toFixed(2)}%`,
            faturamento: `${(notaFaturamento * 100).toFixed(2)}%`,
            itensNC: `${(notaItensNC * 100).toFixed(2)}%`,
            tratamentoNC: `${(notaTratamentoNC * 100).toFixed(2)}%`,
            horaMaquina: `${(notaHoraMaquina * 100).toFixed(2)}%`,
            operacaoSegura: `${(notaOperacaoSegura * 100).toFixed(2)}%`,
            limpeza: `${(notaLimpeza * 100).toFixed(2)}%`
          });
          console.log(`Cálculo detalhado:`);
          console.log(`  Produção: ${(notaProducao * 100).toFixed(2)}% × 20% = ${(notaProducao * 0.20 * 100).toFixed(2)}%`);
          console.log(`  EPI: ${(notaEpi * 100).toFixed(2)}% × 10% = ${(notaEpi * 0.10 * 100).toFixed(2)}%`);
          console.log(`  Faltas: ${(notaFaltas * 100).toFixed(2)}% × 10% = ${(notaFaltas * 0.10 * 100).toFixed(2)}%`);
          console.log(`  Advertências: ${(notaAdvertencias * 100).toFixed(2)}% × 3% = ${(notaAdvertencias * 0.03 * 100).toFixed(2)}%`);
          console.log(`  DSS: ${(notaDss * 100).toFixed(2)}% × 10% = ${(notaDss * 0.10 * 100).toFixed(2)}%`);
          console.log(`  Faturamento: ${(notaFaturamento * 100).toFixed(2)}% × 30% = ${(notaFaturamento * 0.30 * 100).toFixed(2)}%`);
          console.log(`  Itens NC: ${(notaItensNC * 100).toFixed(2)}% × 5% = ${(notaItensNC * 0.05 * 100).toFixed(2)}%`);
          console.log(`  Tratamento NC: ${(notaTratamentoNC * 100).toFixed(2)}% × 3% = ${(notaTratamentoNC * 0.03 * 100).toFixed(2)}%`);
          console.log(`  Hora Máquina: ${(notaHoraMaquina * 100).toFixed(2)}% × 3% = ${(notaHoraMaquina * 0.03 * 100).toFixed(2)}%`);
          console.log(`  Operação Segura: ${(notaOperacaoSegura * 100).toFixed(2)}% × 3% = ${(notaOperacaoSegura * 0.03 * 100).toFixed(2)}%`);
          console.log(`  Limpeza: ${(notaLimpeza * 100).toFixed(2)}% × 3% = ${(notaLimpeza * 0.03 * 100).toFixed(2)}%`);
          console.log(`Nota Geral Final: ${(notaGeral * 100).toFixed(2)}%`);
          console.log(`---`);
        } else {
          // Demais casos exigem fórmula cadastrada
          if (!formula) {
            console.error(`❌ Não foi possível calcular nota geral para ${funcionario.nome} - fórmula não encontrada`);
            notaGeral = 0;
          } else {
            // Converter pesos de número para decimal (ex: 60 -> 0.60)
            const pesoProducao = (formula.peso_producao_setor || 0) / 100;
            const pesoEpi = (formula.peso_epi || 0) / 100;
            const pesoDss = (formula.peso_dss || 0) / 100;
            const pesoFaltas = (formula.peso_faltas || 0) / 100;
            const pesoAdvertencias = (formula.peso_advertencias || 0) / 100;
            
            if (isProducaoGeracao) {
              // Auxiliares em PRODUÇÃO usam pesos da fórmula
              notaGeral = (
                (notaProducao * pesoProducao) +
                (notaEpi * pesoEpi) +
                (notaDss * pesoDss) +
                (notaFaltas * pesoFaltas) +
                (notaAdvertencias * pesoAdvertencias)
              );
              
              const somaPesos = pesoProducao + pesoEpi + pesoDss + pesoFaltas + pesoAdvertencias;
              if (Math.abs(somaPesos - 1.0) > 0.01) {
                console.warn(`⚠️ Soma dos pesos não é 100% para ${funcionario.nome}: ${(somaPesos * 100).toFixed(2)}%`);
              }
              
              console.log(`\n=== NOTA GERAL ${funcionario.nome} ===`);
              console.log(`Categoria: ${funcionario.categoria?.nome}`);
              console.log(`Fórmula: ${formula.nome}`);
              console.log(`Cálculo detalhado: produção, epi, dss, faltas, advertências com pesos da fórmula`);
            } else {
              // Para KITS, usa os mesmos pesos da fórmula (que já não deve ter peso de produção)
              notaGeral = (
                (notaEpi * pesoEpi) +
                (notaDss * pesoDss) +
                (notaFaltas * pesoFaltas) +
                (notaAdvertencias * pesoAdvertencias)
              );
            }
          }
        }

        // 8. CALCULAR BÔNUS
        const valorFaixa = funcionario.faixa?.valor || 0;
        const valorKits = isKitsGeracao ? calcularComissao(Math.floor(Math.random() * 5000) + 8000) : undefined;
        const bonusPossivel = isKitsGeracao ? (valorKits || 0) : valorFaixa;
        const bonusAlcancado = bonusPossivel * notaGeral;

        return {
          id: funcionario.id,
          cod_funcionario: funcionario.cpf || funcionario.id.substring(0, 8),
          nome: funcionario.nome,
          setor: funcionario.setor?.nome || 'N/A',
          funcao: funcionario.funcao?.nome || 'N/A',
          faixa: funcionario.faixa?.nome || 'N/A',
          categoria: funcionario.categoria?.nome || 'N/A',
          valor_faixa: valorFaixa,
          percentual_producao: isProducaoGeracao ? percentualProducao : undefined,
          nota_producao: isProducaoGeracao ? notaProducao : undefined,
          nota_epi: notaEpi,
          nota_faltas: notaFaltas,
          nota_advertencias: notaAdvertencias,
          nota_dss: notaDss,
          nota_faturamento: (isSupervisorOrEncarregado && isProducaoGeracao) ? notaFaturamento : undefined,
          nota_itens_nc: (isSupervisorOrEncarregado && isProducaoGeracao) ? notaItensNC : undefined,
          nota_tratamento_nc: (isSupervisorOrEncarregado && isProducaoGeracao) ? notaTratamentoNC : undefined,
          nota_hora_maquina: (isSupervisorOrEncarregado && isProducaoGeracao) ? notaHoraMaquina : undefined,
          nota_operacao_segura: (isSupervisorOrEncarregado && isProducaoGeracao) ? notaOperacaoSegura : undefined,
          nota_limpeza: (isSupervisorOrEncarregado && isProducaoGeracao) ? notaLimpeza : undefined,
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="categoria">Categoria*</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter(c => ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'].includes(c.nome.toUpperCase()))
                    .map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
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
                    disabled={!baseId || !categoriaId || !competencia || isCalculating}
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
          {baseId && categoriaId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Funcionários elegíveis:</strong> {funcionarios.filter(f => 
                  f.ativo && 
                  f.base_premiacao_id === baseId && 
                  f.categoria_id === categoriaId
                ).length} funcionário(s) com base {baseSelecionada?.nome} e categoria {categorias.find(c => c.id === categoriaId)?.nome}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="categoriaVisualizacao">Categoria</Label>
              <Select value={categoriaVisualizacao || "TODAS"} onValueChange={(value) => setCategoriaVisualizacao(value === "TODAS" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {categorias
                    .filter(c => ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'].includes(c.nome.toUpperCase()))
                    .map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.nome}>
                        {categoria.nome}
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
                    <TableHead>Faixa</TableHead>
                    {isProducao && <TableHead>% Produção</TableHead>}
                    <TableHead>Nota DSS</TableHead>
                    <TableHead>Nota EPI</TableHead>
                    <TableHead>Nota Faltas</TableHead>
                    <TableHead>Nota Advertências</TableHead>
                    {isProducao && <TableHead>Faturamento</TableHead>}
                    {isProducao && <TableHead>Itens NC</TableHead>}
                    {isProducao && <TableHead>Trat. NC</TableHead>}
                    {isProducao && <TableHead>Hora Máq.</TableHead>}
                    {isProducao && <TableHead>Op. Segura</TableHead>}
                    {isProducao && <TableHead>Limpeza</TableHead>}
                    {isKits && <TableHead>Valor Kits</TableHead>}
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
                      <TableCell>{premiacao.faixa}</TableCell>
                      {isProducao && <TableCell>{formatPercentage(premiacao.percentual_producao || 0)}</TableCell>}
                      <TableCell>{formatPercentage(premiacao.nota_dss)}</TableCell>
                      <TableCell>{formatPercentage(premiacao.nota_epi)}</TableCell>
                      <TableCell>{formatPercentage(premiacao.nota_faltas)}</TableCell>
                      <TableCell>{formatPercentage(premiacao.nota_advertencias)}</TableCell>
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_faturamento || 0)}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_itens_nc || 0)}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_tratamento_nc || 0)}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_hora_maquina || 0)}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_operacao_segura || 0)}</TableCell>}
                      {isProducao && <TableCell>{formatPercentage(premiacao.nota_limpeza || 0)}</TableCell>}
                      {isKits && <TableCell>{formatCurrency(premiacao.valor_kits || 0)}</TableCell>}
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