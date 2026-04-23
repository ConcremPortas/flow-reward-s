import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Calculator, Eye, Pencil, Trash2 } from 'lucide-react';
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
  if (realizado >= 10000) {
    const faixasCompletas = Math.floor((realizado - 10000) / 250);
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
  resultado_id?: string;
  valor_fixo?: number;
  valor_ajustado?: number;
  observacao_ajuste?: string;
}

const GerarPremiacoes = () => {
  const navigate = useNavigate();
  const { bases } = useBasePremiacao();
  const { funcionarios } = useFuncionarios();
  const { formulas } = useFormulasCalculo();
  const { salvarResultados, verificarResultadosExistentes, excluirResultados, resultados } = useResultadosPremiacao();
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
  const [isCalculating, setIsCalculating] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  const parametrosRef = useRef<HTMLDivElement | null>(null);

  const baseSelecionada = bases.find(b => b.id === baseId);

  // Util: normalizar texto (remover acentos e deixar maiúsculo)
  const normalize = (s?: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  // Helper: extrai multiplicador KITS do nome da base ("KIT 25%" → 0.25, "KITS" → 1.0)
  const extractKitsMultiplier = (baseName?: string): number => {
    const normalized = normalize(baseName);
    const match = normalized.match(/(\d+)%/);
    if (match) return parseInt(match[1]) / 100;
    return 1.0;
  };

  // Flags para cálculo (baseadas na base de geração selecionada)
  const isProducaoGeracao = normalize(baseSelecionada?.nome) === 'PRODUCAO';
  const isKitsGeracao = normalize(baseSelecionada?.nome).startsWith('KIT');

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
      console.log('\n🎯 ===== INICIANDO GERAÇÃO DE PREMIAÇÕES =====');
      console.log('Base utilizada para cálculo:', baseSelecionada?.nome);
      console.log('Base ID:', baseId);
      console.log('Competência:', competencia);
      console.log('==============================================\n');

      // Filtrar funcionários pela base e, opcionalmente, pela categoria
      const funcionariosAtivos = funcionarios.filter(f => 
        f.ativo && 
        f.base_premiacao_id === baseId &&
        (categoriaId ? f.categoria_id === categoriaId : true)
      );

      console.log('🔍 Filtro de funcionários:', {
        totalFuncionarios: funcionarios.length,
        baseIdSelecionada: baseId,
        baseSelecionada: baseSelecionada?.nome,
        categoriaIdSelecionada: categoriaId || 'TODAS',
        categoriaSelecionada: categoriaId ? categorias.find(c => c.id === categoriaId)?.nome : 'Todas',
        funcionariosAtivos: funcionariosAtivos.length,
        detalheFuncionarios: funcionarios.map(f => ({
          nome: f.nome,
          ativo: f.ativo,
          base_premiacao_id: f.base_premiacao_id,
          base_nome: f.base_premiacao?.nome,
          categoria_id: f.categoria_id,
          categoria_nome: f.categoria?.nome,
          match: f.ativo && f.base_premiacao_id === baseId && f.categoria_id === categoriaId
        }))
      });

      if (funcionariosAtivos.length === 0) {
        alert('Nenhum funcionário encontrado com a base de premiação selecionada (e categoria, se aplicável).');
        setIsCalculating(false);
        return;
      }
      
      const premiacoesCalculadas: FuncionarioPremiacao[] = funcionariosAtivos.map(funcionario => {
        // Buscar fórmula: 1) por categoria_id + base_premiacao_id, 2) por nome "CATEGORIA - BASE"
        const categoriaNome = funcionario.categoria?.nome?.toUpperCase() || '';
        const baseNome = baseSelecionada?.nome?.toUpperCase() || '';
        const nomeFormula = `${categoriaNome} - ${baseNome}`;

        const formula = formulas.find(f =>
          f.categoria_id === funcionario.categoria_id &&
          f.base_premiacao_id === baseId
        ) || (isKitsGeracao ? formulas.find(f =>
          f.categoria_id === funcionario.categoria_id &&
          normalize(bases.find(b => b.id === f.base_premiacao_id)?.nome || '').startsWith('KIT')
        ) : undefined) || formulas.find(f =>
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
            const setoresSupervisionados = funcionario.setor_ids && funcionario.setor_ids.length > 0
              ? setores.filter(s => funcionario.setor_ids!.includes(s.id))
              : setores.filter(s => s.supervisor_id === funcionario.id || s.encarregado_id === funcionario.id);
            
            console.log(`📊 ${categoriaNome} ${funcionario.nome} - Buscando setores supervisionados:`, {
              funcionario_id: funcionario.id,
              total_setores_encontrados: setoresSupervisionados.length,
              setores_ids: setoresSupervisionados.map(s => s.id),
              setores_nomes: setoresSupervisionados.map(s => s.nome)
            });
            
            if (setoresSupervisionados.length > 0) {
              const setorIds = setoresSupervisionados.map(s => s.id);
              const producaoDosSetores = producaoSetor.filter(p => 
                setorIds.includes(p.setor_id || '') &&
                p.data_producao >= dataInicio &&
                p.data_producao <= dataFim
              );
              
              console.log(`📈 Registros de produção encontrados para ${funcionario.nome}:`, {
                periodo: `${dataInicio} a ${dataFim}`,
                total_registros: producaoDosSetores.length,
                registros: producaoDosSetores.map(p => ({
                  setor_id: p.setor_id,
                  data: p.data_producao,
                  meta: p.meta_diaria,
                  realizado: p.producao_realizada
                }))
              });
              
              if (producaoDosSetores.length > 0) {
                const totalMeta = producaoDosSetores.reduce((acc, p) => acc + (p.meta_diaria || 0), 0);
                const totalRealizado = producaoDosSetores.reduce((acc, p) => acc + (p.producao_realizada || 0), 0);
                percentualProducao = totalMeta > 0 ? totalRealizado / totalMeta : 0;
                notaProducao = Math.min(percentualProducao, 1.0);
                
                console.log(`✅ Cálculo produção agregada ${funcionario.nome}:`, {
                  setores: setoresSupervisionados.map(s => s.nome).join(', '),
                  totalMeta,
                  totalRealizado,
                  percentualProducao: (percentualProducao * 100).toFixed(2) + '%',
                  notaProducao: (notaProducao * 100).toFixed(2) + '%'
                });
              } else {
                console.warn(`⚠️ Nenhum registro de produção encontrado para ${funcionario.nome} no período ${dataInicio} a ${dataFim}`);
              }
            } else {
              console.warn(`⚠️ ${funcionario.nome} não possui setores supervisionados`);
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
          const setoresSupervisionados = funcionario.setor_ids && funcionario.setor_ids.length > 0
            ? setores.filter(s => funcionario.setor_ids!.includes(s.id))
            : setores.filter(s => s.supervisor_id === funcionario.id || s.encarregado_id === funcionario.id);
          
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
          // Pesos da fórmula cadastrada ou fallback padrão
          const pProd = formula ? (formula.peso_producao_setor || 0) / 100 : 0.20;
          const pFat  = formula ? (formula.peso_faturamento    || 0) / 100 : 0.26;
          const pEpi  = formula ? (formula.peso_epi            || 0) / 100 : 0.10;
          const pFalt = formula ? (formula.peso_faltas         || 0) / 100 : 0.10;
          const pDss  = formula ? (formula.peso_dss            || 0) / 100 : 0.10;
          const pINC  = formula ? (formula.peso_itens_nc       || 0) / 100 : 0.05;
          const pAdv  = formula ? (formula.peso_advertencias   || 0) / 100 : 0.03;
          const pTNC  = formula ? (formula.peso_tratamento_nc  || 0) / 100 : 0.03;
          const pHM   = formula ? (formula.peso_hora_maquina   || 0) / 100 : 0.03;
          const pOS   = formula ? (formula.peso_operacao_segura|| 0) / 100 : 0.03;
          const pLimp = formula ? (formula.peso_limpeza        || 0) / 100 : 0.07;

          notaGeral = (
            (notaProducao    * pProd) +
            (notaFaturamento * pFat)  +
            (notaEpi         * pEpi)  +
            (notaFaltas      * pFalt) +
            (notaDss         * pDss)  +
            (notaItensNC     * pINC)  +
            (notaAdvertencias* pAdv)  +
            (notaTratamentoNC* pTNC)  +
            (notaHoraMaquina * pHM)   +
            (notaOperacaoSegura * pOS)+
            (notaLimpeza     * pLimp)
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
          console.log(`  Faturamento: ${(notaFaturamento * 100).toFixed(2)}% × 26% = ${(notaFaturamento * 0.26 * 100).toFixed(2)}%`);
          console.log(`  Itens NC: ${(notaItensNC * 100).toFixed(2)}% × 5% = ${(notaItensNC * 0.05 * 100).toFixed(2)}%`);
          console.log(`  Tratamento NC: ${(notaTratamentoNC * 100).toFixed(2)}% × 3% = ${(notaTratamentoNC * 0.03 * 100).toFixed(2)}%`);
          console.log(`  Hora Máquina: ${(notaHoraMaquina * 100).toFixed(2)}% × 3% = ${(notaHoraMaquina * 0.03 * 100).toFixed(2)}%`);
          console.log(`  Operação Segura: ${(notaOperacaoSegura * 100).toFixed(2)}% × 3% = ${(notaOperacaoSegura * 0.03 * 100).toFixed(2)}%`);
          console.log(`  Limpeza: ${(notaLimpeza * 100).toFixed(2)}% × 7% = ${(notaLimpeza * 0.07 * 100).toFixed(2)}%`);
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
        const valorFixo = funcionario.valor_fixo || 0;
        // KITS: buscar realizado nos indicadores gerais pelo código 'KITS'
        const kitsMes = isKitsGeracao
          ? indicadoresGerais.find(i =>
              i.tipo_indicador?.codigo === 'KITS' &&
              i.competencia === dataInicio
            )
          : null;
        const realizadoKits = kitsMes?.realizado || 0;
        const valorKits = isKitsGeracao ? calcularComissao(realizadoKits) : undefined;
        const bonusPossivel = isKitsGeracao ? (valorKits || 0) : valorFaixa;
        const multiplicadorKits = isKitsGeracao ? extractKitsMultiplier(baseSelecionada?.nome) : 1.0;
        const bonusAlcancado = bonusPossivel * notaGeral * multiplicadorKits + valorFixo;

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
          bonus_alcancado: bonusAlcancado,
          valor_fixo: valorFixo,
        };
      });
      
      // Salvar resultados na tabela
      const salvoComSucesso = await salvarResultados(competencia, baseId, premiacoesCalculadas);

      if (salvoComSucesso) {
        navigate(`/premiacoes/relatorio-premiacoes?competencia=${competencia}&baseId=${baseId}`);
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

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const calculosGerados = (() => {
    const map = new Map<
      string,
      {
        mes_competencia: string;
        competencia: string;
        base_premiacao_id: string;
        total_funcionarios: number;
        total_bonus_possivel: number;
        total_bonus_alcancado: number;
        categorias: string[];
      }
    >();

    for (const r of resultados) {
      if (!r.base_premiacao_id) continue;
      const key = `${r.mes_competencia}|${r.base_premiacao_id}`;
      const competencia = r.mes_competencia?.slice(0, 7);
      if (!competencia) continue;

      const current = map.get(key) || {
        mes_competencia: r.mes_competencia,
        competencia,
        base_premiacao_id: r.base_premiacao_id,
        total_funcionarios: 0,
        total_bonus_possivel: 0,
        total_bonus_alcancado: 0,
        categorias: [],
      };

      current.total_funcionarios += 1;
      current.total_bonus_possivel += r.bonus_possivel || 0;
      current.total_bonus_alcancado += r.bonus_alcancado || 0;

      if (r.categoria && !current.categorias.includes(r.categoria)) {
        current.categorias.push(r.categoria);
      }

      map.set(key, current);
    }

    const baseNameById = new Map(bases.map((b) => [b.id, b.nome]));

    return Array.from(map.values()).sort((a, b) => {
      if (a.mes_competencia !== b.mes_competencia) return a.mes_competencia < b.mes_competencia ? 1 : -1;
      const nameA = baseNameById.get(a.base_premiacao_id) || '';
      const nameB = baseNameById.get(b.base_premiacao_id) || '';
      return nameA.localeCompare(nameB);
    });
  })();

  const handleVisualizarGerado = (item: { competencia: string; base_premiacao_id: string }) => {
    const base = bases.find(b => b.id === item.base_premiacao_id);
    navigate(`/premiacoes/relatorio-premiacoes?competencia=${item.competencia}&baseId=${item.base_premiacao_id}`);
  };

  const handleEditarGerado = (item: { competencia: string; base_premiacao_id: string }) => {
    setBaseId(item.base_premiacao_id);
    setCompetencia(item.competencia);
    setCategoriaId('');
    setShowOverwriteDialog(true);
    requestAnimationFrame(() => scrollToRef(parametrosRef));
  };

  const handleExcluirGerado = async (item: { competencia: string; base_premiacao_id: string }) => {
    await excluirResultados(item.competencia, item.base_premiacao_id);
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
      <div ref={parametrosRef}>
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
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaId || 'TODAS'} onValueChange={(v) => setCategoriaId(v === 'TODAS' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
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
                <strong>Funcionários elegíveis:</strong> {funcionarios.filter(f => 
                  f.ativo && 
                  f.base_premiacao_id === baseId && 
                  (categoriaId ? f.categoria_id === categoriaId : true)
                ).length} funcionário(s) com base {baseSelecionada?.nome} {categoriaId ? `e categoria ${categorias.find(c => c.id === categoriaId)?.nome}` : '(todas categorias)'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Premiações Geradas</CardTitle>
        </CardHeader>
        <CardContent>
          {calculosGerados.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma premiação gerada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Categorias</TableHead>
                    <TableHead className="text-right">Funcionários</TableHead>
                    <TableHead className="text-right">Bônus Alcançado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculosGerados.map((item, idx) => {
                    const competenciaChanged =
                      idx === 0 || item.competencia !== calculosGerados[idx - 1]?.competencia;
                    const baseNome = bases.find((b) => b.id === item.base_premiacao_id)?.nome || '';

                    return (
                      <React.Fragment key={`${item.mes_competencia}-${item.base_premiacao_id}`}>
                        {competenciaChanged && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/40 font-medium">
                              {formatCompetencia(item.competencia)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => handleVisualizarGerado(item)}
                        >
                          <TableCell className="font-medium">{formatCompetencia(item.competencia)}</TableCell>
                          <TableCell>{baseNome}</TableCell>
                          <TableCell>{item.categorias.length ? item.categorias.join(', ') : '—'}</TableCell>
                          <TableCell className="text-right">{item.total_funcionarios}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total_bonus_alcancado)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleVisualizarGerado(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditarGerado(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir premiações</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Remover as premiações salvas de {formatCompetencia(item.competencia)} para a base{" "}
                                      {baseNome}? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleExcluirGerado(item)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default GerarPremiacoes;
