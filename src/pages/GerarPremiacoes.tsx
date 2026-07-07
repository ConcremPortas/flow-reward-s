import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
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
import { useConfiguracoesKits, ConfiguracaoKits } from '@/hooks/useConfiguracoesKits';
import {
  calcularComissao,
  calcularNotaFaltas,
  calcularNotaAdvertencias,
  calcularNotaEpi,
  calcularNotaDss,
  calcularNotaProducao,
  calcularNotaGeral,
  calcularBonus,
  extractKitsMultiplier,
  isProducaoBase,
  isKitsBase,
  normalize,
} from '@/domain/premiacao/calculoPremiacao';

const FALLBACK_CONFIG: ConfiguracaoKits = {
  id: '', vigencia_inicio: '2000-01', minimo_kits: 10000,
  incremento_faixa: 250, bonus_base: 100,
  bonus_por_faixa: 25, ativo: true, created_at: '', updated_at: '',
};

// calcularComissao, calcularNotaFaltas e calcularNotaAdvertencias foram extraídos
// para @/domain/premiacao/calculoPremiacao (Etapa 3 da Reforma V2).

interface FuncionarioPremiacao {
  id: string;
  cod_funcionario: string;
  nome: string;
  setor: string;
  funcao: string;
  faixa: string;
  categoria: string;
  valor_faixa: number;
  percentual_producao?: number;
  nota_producao?: number;
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
  const { getConfigParaCompetencia } = useConfiguracoesKits();

  const [baseIds, setBaseIds] = useState<string[]>([]);
  const [competencia, setCompetencia] = useState('');
  const [categoriaIds, setCategoriaIds] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [basesAberto, setBasesAberto] = useState(false);
  const [categoriasAberto, setCategoriasAberto] = useState(false);

  const parametrosRef = useRef<HTMLDivElement | null>(null);

  const toggleBase = (id: string) =>
    setBaseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleCategoria = (id: string) =>
    setCategoriaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // normalize e extractKitsMultiplier foram extraídos para
  // @/domain/premiacao/calculoPremiacao (Etapa 3 da Reforma V2).

  const iniciarGeracao = async () => {
    if (baseIds.length === 0 || !competencia) return;
    const existentes: string[] = [];
    for (const bid of baseIds) {
      const existem = await verificarResultadosExistentes(competencia, bid);
      if (existem) existentes.push(bid);
    }
    if (existentes.length > 0) {
      setShowOverwriteDialog(true);
      return;
    }
    await gerarPremiacoes();
  };

  const gerarPremiacoes = async () => {
    if (baseIds.length === 0 || !competencia) return;

    setIsCalculating(true);
    setShowOverwriteDialog(false);

    try {
      for (const currentBaseId of baseIds) {
        const baseSelecionada = bases.find(b => b.id === currentBaseId);
        const isProducaoGeracao = isProducaoBase(baseSelecionada?.nome);
        const isKitsGeracao = isKitsBase(baseSelecionada?.nome);

        console.log('\n🎯 ===== INICIANDO GERAÇÃO DE PREMIAÇÕES =====');
        console.log('Base utilizada para cálculo:', baseSelecionada?.nome);
        console.log('Base ID:', currentBaseId);
        console.log('Competência:', competencia);
        console.log('==============================================\n');

        const funcionariosAtivos = funcionarios.filter(f =>
          f.ativo &&
          f.base_premiacao_id === currentBaseId &&
          (categoriaIds.length === 0 || categoriaIds.includes(f.categoria_id || ''))
        );

        console.log('🔍 Filtro de funcionários:', {
          totalFuncionarios: funcionarios.length,
          baseIdSelecionada: currentBaseId,
          baseSelecionada: baseSelecionada?.nome,
          categoriaIdsSelecionadas: categoriaIds.length === 0 ? 'TODAS' : categoriaIds,
          funcionariosAtivos: funcionariosAtivos.length,
        });

        if (funcionariosAtivos.length === 0) {
          alert(`Nenhum funcionário encontrado para a base ${baseSelecionada?.nome} (e categoria, se aplicável).`);
          continue;
        }

        const premiacoesCalculadas: FuncionarioPremiacao[] = funcionariosAtivos.map(funcionario => {
          const categoriaNome = funcionario.categoria?.nome?.toUpperCase() || '';
          const baseNome = baseSelecionada?.nome?.toUpperCase() || '';
          const nomeFormula = `${categoriaNome} - ${baseNome}`;

          const formula = formulas.find(f =>
            f.categoria_id === funcionario.categoria_id &&
            f.base_premiacao_id === currentBaseId
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
              base_premiacao_id: currentBaseId,
              base_nome: baseSelecionada?.nome,
              nome_formula_buscado: nomeFormula,
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

          const [ano, mes] = competencia.split('-');
          const dataInicio = `${ano}-${mes}-01`;
          const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
          const dataFim = `${ano}-${mes}-${ultimoDia}`;

          // 1. FALTAS
          const faltasDoMes = faltasAdvertencias.filter(f =>
            f.funcionario_id === funcionario.id &&
            f.tipo === 'falta' &&
            f.data_ocorrencia >= dataInicio &&
            f.data_ocorrencia <= dataFim
          );
          const totalFaltas = faltasDoMes.reduce((acc, f) => acc + (f.quantidade || 1), 0);
          const notaFaltas = calcularNotaFaltas(totalFaltas);

          // 2. ADVERTÊNCIAS
          const advertenciasDoMes = faltasAdvertencias.filter(f =>
            f.funcionario_id === funcionario.id &&
            f.tipo === 'advertencia' &&
            f.data_ocorrencia >= dataInicio &&
            f.data_ocorrencia <= dataFim
          );
          const totalAdvertencias = advertenciasDoMes.reduce((acc, f) => acc + (f.quantidade || 1), 0);
          const notaAdvertencias = calcularNotaAdvertencias(totalAdvertencias);

          // 3. EPI
          const episDoMes = epiRecords.filter(e =>
            e.funcionario_id === funcionario.id &&
            e.data_entrega >= dataInicio &&
            e.data_entrega <= dataFim
          );
          const totalAuditorias = episDoMes.length;
          const naoConformidades = episDoMes.filter(e => e.status === 'nao_conforme').length;
          const notaEpi = calcularNotaEpi(totalAuditorias, naoConformidades);

          // 4. DSS
          const dssDoLocalNoMes = dssRecords.filter(d =>
            d.local_dss_id === funcionario.local_dss_id &&
            d.data_realizacao >= dataInicio &&
            d.data_realizacao <= dataFim
          );
          const totalDssLocal = dssDoLocalNoMes.length;
          const presencasDss = dssDoLocalNoMes.filter(d =>
            d.participantes_ids?.includes(funcionario.id)
          ).length;
          const notaDss = calcularNotaDss(totalDssLocal, presencasDss);

          // 5. PRODUÇÃO
          let notaProducao = 0;
          let percentualProducao = 0;

          const isSupervisorOrEncarregado = ['SUPERVISOR', 'ENCARREGADO'].includes(categoriaNome);

          if (isProducaoGeracao) {
            if (isSupervisorOrEncarregado) {
              const setoresSupervisionados = funcionario.setor_ids && funcionario.setor_ids.length > 0
                ? setores.filter(s => funcionario.setor_ids!.includes(s.id))
                : setores.filter(s => s.supervisor_id === funcionario.id || s.encarregado_id === funcionario.id);

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
                  const producao = calcularNotaProducao(totalMeta, totalRealizado);
                  percentualProducao = producao.percentual;
                  notaProducao = producao.nota;
                }
              }
            } else {
              if (funcionario.setor_id) {
                const producaoDoSetor = producaoSetor.filter(p =>
                  p.setor_id === funcionario.setor_id &&
                  p.data_producao >= dataInicio &&
                  p.data_producao <= dataFim
                );
                if (producaoDoSetor.length > 0) {
                  const totalMeta = producaoDoSetor.reduce((acc, p) => acc + (p.meta_diaria || 0), 0);
                  const totalRealizado = producaoDoSetor.reduce((acc, p) => acc + (p.producao_realizada || 0), 0);
                  const producao = calcularNotaProducao(totalMeta, totalRealizado);
                  percentualProducao = producao.percentual;
                  notaProducao = producao.nota;
                }
              }
            }
          }

          // 6. INDICADORES ADICIONAIS (Supervisor/Encarregado em PRODUÇÃO)
          let notaFaturamento = 0;
          let notaItensNC = 0;
          let notaTratamentoNC = 0;
          let notaHoraMaquina = 0;
          let notaOperacaoSegura = 0;
          let notaLimpeza = 0;

          if (isSupervisorOrEncarregado && isProducaoGeracao) {
            const competenciaFormatada = `${ano}-${mes}-01`;

            const faturamentoMes = indicadoresGerais.find(i =>
              i.tipo_indicador?.codigo === 'FAT' &&
              i.competencia === competenciaFormatada
            );
            if (faturamentoMes) {
              notaFaturamento = faturamentoMes.percentual / 100;
            }

            const setoresSupervisionados = funcionario.setor_ids && funcionario.setor_ids.length > 0
              ? setores.filter(s => funcionario.setor_ids!.includes(s.id))
              : setores.filter(s => s.supervisor_id === funcionario.id || s.encarregado_id === funcionario.id);

            if (setoresSupervisionados.length > 0) {
              const setorIds = setoresSupervisionados.map(s => s.id);
              const indicadoresDosMeses = indicadoresSetor.filter(i =>
                setorIds.includes(i.setor_id || '') &&
                i.competencia === competenciaFormatada
              );

              const calcularMediaIndicador = (campoMeta: string, campoRealizado: string) => {
                const percentuais = indicadoresDosMeses
                  .map(i => {
                    const meta = (i as any)[campoMeta];
                    const realizado = (i as any)[campoRealizado];
                    if (!meta || meta === 0) return null;
                    return Math.min(realizado / meta, 1.0);
                  })
                  .filter(v => v != null);
                if (percentuais.length === 0) return 1.0;
                return percentuais.reduce((acc, v) => acc + v, 0) / percentuais.length;
              };

              notaItensNC = calcularMediaIndicador('identificacao_nc_meta', 'identificacao_nc_realizado');
              notaTratamentoNC = calcularMediaIndicador('tratamento_nc_meta', 'tratamento_nc_realizado');
              notaHoraMaquina = calcularMediaIndicador('hora_maquina_meta', 'hora_maquina_realizado');
              notaOperacaoSegura = calcularMediaIndicador('operacao_segura_meta', 'operacao_segura_realizado');
              notaLimpeza = calcularMediaIndicador('limpeza_meta', 'limpeza_realizado');
            }
          }

          // 7. NOTA GERAL (extraída para @/domain/premiacao/calculoPremiacao — Etapa 3)
          const notaGeral = calcularNotaGeral({
            notas: {
              notaProducao,
              notaEpi,
              notaFaltas,
              notaDss,
              notaAdvertencias,
              notaFaturamento,
              notaItensNC,
              notaTratamentoNC,
              notaHoraMaquina,
              notaOperacaoSegura,
              notaLimpeza,
            },
            formula,
            isProducaoGeracao,
            isSupervisorOrEncarregado,
          });

          // 8. BÔNUS
          const valorFaixa = funcionario.faixa?.valor || 0;
          const valorFixo = funcionario.valor_fixo || 0;

          const kitsMes = isKitsGeracao
            ? indicadoresGerais.find(i =>
                i.tipo_indicador?.codigo === 'KITS' &&
                i.competencia === dataInicio
              )
            : null;
          const realizadoKits = kitsMes?.realizado || 0;
          const configKits = getConfigParaCompetencia(competencia) || FALLBACK_CONFIG;
          const valorKits = isKitsGeracao ? calcularComissao(realizadoKits, configKits) : undefined;
          const multiplicadorKits = isKitsGeracao ? extractKitsMultiplier(baseSelecionada?.nome) : 1.0;
          const { bonusPossivel, bonusAlcancado } = calcularBonus({
            notaGeral,
            valorFaixa,
            valorFixo,
            isKitsGeracao,
            valorKits,
            multiplicadorKits,
          });

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

        await salvarResultados(competencia, currentBaseId, premiacoesCalculadas);
      }

      navigate(`/premiacoes/relatorio-premiacoes?competencia=${competencia}&baseId=${baseIds[0]}`);

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
    navigate(`/premiacoes/relatorio-premiacoes?competencia=${item.competencia}&baseId=${item.base_premiacao_id}`);
  };

  const handleEditarGerado = (item: { competencia: string; base_premiacao_id: string }) => {
    setBaseIds([item.base_premiacao_id]);
    setCompetencia(item.competencia);
    setCategoriaIds([]);
    setShowOverwriteDialog(true);
    requestAnimationFrame(() => scrollToRef(parametrosRef));
  };

  const handleExcluirGerado = async (item: { competencia: string; base_premiacao_id: string }) => {
    await excluirResultados(item.competencia, item.base_premiacao_id);
  };

  // Labels para os multi-selects
  const basesLabel = baseIds.length === 0
    ? 'Selecione bases...'
    : baseIds.length === 1
      ? bases.find(b => b.id === baseIds[0])?.nome ?? '1 base'
      : `${baseIds.length} bases selecionadas`;

  const categoriasLabel = categoriaIds.length === 0
    ? 'Todas as categorias'
    : categoriaIds.length === 1
      ? categorias.find(c => c.id === categoriaIds[0])?.nome ?? '1 categoria'
      : `${categoriaIds.length} categorias`;

  const categoriasFiltradas = categorias.filter(c =>
    ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'].includes(c.nome.toUpperCase())
  );

  const funcionariosElegiveis = funcionarios.filter(f =>
    f.ativo &&
    baseIds.includes(f.base_premiacao_id || '') &&
    (categoriaIds.length === 0 || categoriaIds.includes(f.categoria_id || ''))
  );

  const basesSelecionadasNomes = baseIds
    .map(id => bases.find(b => b.id === id)?.nome)
    .filter(Boolean)
    .join(', ');

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
              {/* Multi-select Base de Premiação */}
              <div className="space-y-2">
                <Label>Base de Premiação*</Label>
                <Popover open={basesAberto} onOpenChange={setBasesAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal truncate"
                    >
                      <span className="truncate">{basesLabel}</span>
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {bases.map(base => (
                        <div
                          key={base.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                          onClick={() => toggleBase(base.id)}
                        >
                          <Checkbox
                            checked={baseIds.includes(base.id)}
                            onCheckedChange={() => toggleBase(base.id)}
                          />
                          <span className="text-sm">{base.nome}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Multi-select Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Popover open={categoriasAberto} onOpenChange={setCategoriasAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal truncate"
                    >
                      <span className="truncate">{categoriasLabel}</span>
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1">
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                        onClick={() => setCategoriaIds([])}
                      >
                        <Checkbox
                          checked={categoriaIds.length === 0}
                          onCheckedChange={() => setCategoriaIds([])}
                        />
                        <span className="text-sm">Todas</span>
                      </div>
                      {categoriasFiltradas.map(cat => (
                        <div
                          key={cat.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                          onClick={() => toggleCategoria(cat.id)}
                        >
                          <Checkbox
                            checked={categoriaIds.includes(cat.id)}
                            onCheckedChange={() => toggleCategoria(cat.id)}
                          />
                          <span className="text-sm">{cat.nome}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mês Competência */}
              <div className="space-y-2">
                <Label htmlFor="competencia">Mês Competência*</Label>
                <Input
                  id="competencia"
                  type="month"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                />
              </div>

              {/* Botão Gerar */}
              <div className="flex items-end">
                <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={iniciarGeracao}
                      disabled={baseIds.length === 0 || !competencia || isCalculating}
                      className="w-full"
                    >
                      {isCalculating ? 'Calculando...' : 'Gerar Premiações'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Já existem resultados salvos</AlertDialogTitle>
                      <AlertDialogDescription>
                        Já existem premiações calculadas para {formatCompetencia(competencia)} com{' '}
                        {baseIds.length === 1 ? 'a base' : 'as bases'} {basesSelecionadasNomes}.
                        Deseja recalcular e sobrescrever os resultados existentes?
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

            {/* Funcionários elegíveis */}
            {baseIds.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Funcionários elegíveis:</strong>{' '}
                  {funcionariosElegiveis.length} funcionário(s) — bases: {basesSelecionadasNomes}
                  {categoriaIds.length > 0 && (
                    <> — categorias: {categoriaIds.map(id => categorias.find(c => c.id === id)?.nome).filter(Boolean).join(', ')}</>
                  )}
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
