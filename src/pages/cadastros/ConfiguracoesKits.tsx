import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Edit, Trash2, Info } from "lucide-react";
import { useConfiguracoesKits, ConfiguracaoKits } from "@/hooks/useConfiguracoesKits";

export const ConfiguracoesKits = () => {
  const { configuracoes, loading, createConfiguracao, updateConfiguracao, deleteConfiguracao } = useConfiguracoesKits();
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [minimoKits, setMinimoKits] = useState("10000");
  const [incrementoFaixa, setIncrementoFaixa] = useState("250");
  const [bonusBase, setBonusBase] = useState("100");
  const [bonusPorFaixa, setBonusPorFaixa] = useState("25");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const formatCompetencia = (vigencia: string) => {
    if (!vigencia) return "";
    const [ano, mes] = vigencia.split("-");
    return `${mes}/${ano}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const calcularExemplo = (kits: number) => {
    const minimo = parseInt(minimoKits) || 0;
    const incremento = parseInt(incrementoFaixa) || 1;
    const base = parseFloat(bonusBase) || 0;
    const porFaixa = parseFloat(bonusPorFaixa) || 0;
    if (kits < minimo) return 0;
    const faixas = Math.floor((kits - minimo) / incremento);
    return base + faixas * porFaixa;
  };

  const handleSave = async () => {
    if (!vigenciaInicio || !minimoKits) return;

    const payload = {
      vigencia_inicio: vigenciaInicio,
      minimo_kits: parseInt(minimoKits),
      incremento_faixa: parseInt(incrementoFaixa),
      bonus_base: parseFloat(bonusBase),
      bonus_por_faixa: parseFloat(bonusPorFaixa),
      ativo: true,
    };

    if (editingRecord) {
      await updateConfiguracao(editingRecord, payload);
    } else {
      await createConfiguracao(payload);
    }

    handleCancel();
  };

  const handleEdit = (config: ConfiguracaoKits) => {
    setVigenciaInicio(config.vigencia_inicio);
    setMinimoKits(String(config.minimo_kits));
    setIncrementoFaixa(String(config.incremento_faixa));
    setBonusBase(String(config.bonus_base));
    setBonusPorFaixa(String(config.bonus_por_faixa));
    setEditingRecord(config.id);
  };

  const handleCancel = () => {
    setVigenciaInicio("");
    setMinimoKits("10000");
    setIncrementoFaixa("250");
    setBonusBase("100");
    setBonusPorFaixa("25");
    setEditingRecord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando configurações...</div>
      </div>
    );
  }

  const minKits = parseInt(minimoKits) || 0;
  const incr = parseInt(incrementoFaixa) || 250;

  return (
    <div className="space-y-6">
      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Como funciona</h3>
              <p className="text-sm text-blue-700">
                Cada configuração define os parâmetros de cálculo da comissão de kits a partir de um mês de vigência.
                Ao gerar premiações, o sistema usa a configuração vigente para o mês de competência selecionado.
                Premiações já geradas não são afetadas por novas configurações.
                Não há limite de faixas — quanto mais kits produzidos, maior o bônus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>{editingRecord ? "Editar" : "Nova"} Configuração de Kits</CardTitle>
          <CardDescription>
            Defina os parâmetros de cálculo e o mês a partir do qual a regra será aplicada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vigência a partir de *</label>
              <Input
                type="month"
                value={vigenciaInicio}
                onChange={(e) => setVigenciaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mínimo de Kits *</label>
              <Input
                type="number"
                placeholder="Ex: 11000"
                value={minimoKits}
                onChange={(e) => setMinimoKits(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Incremento por Faixa (kits)</label>
              <Input
                type="number"
                placeholder="Ex: 250"
                value={incrementoFaixa}
                onChange={(e) => setIncrementoFaixa(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bônus Base (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 100"
                value={bonusBase}
                onChange={(e) => setBonusBase(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bônus por Faixa (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 25"
                value={bonusPorFaixa}
                onChange={(e) => setBonusPorFaixa(e.target.value)}
              />
            </div>
          </div>

          {/* Prévia com exemplos */}
          {minimoKits && (
            <div className="p-4 bg-accent/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Produção mínima para bônus:</span>
                <span className="font-bold text-primary">{minKits.toLocaleString("pt-BR")} kits</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Bônus ao atingir mínimo ({minKits.toLocaleString("pt-BR")} kits):</span>
                <span className="font-bold text-primary">{formatCurrency(calcularExemplo(minKits))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Exemplo: {(minKits + incr * 10).toLocaleString("pt-BR")} kits (10 faixas):</span>
                <span className="font-bold text-primary">{formatCurrency(calcularExemplo(minKits + incr * 10))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Exemplo: {(minKits + incr * 48).toLocaleString("pt-BR")} kits (48 faixas):</span>
                <span className="font-bold text-primary">{formatCurrency(calcularExemplo(minKits + incr * 48))}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sem limite — a cada {incr} kits acima do mínimo, soma-se {formatCurrency(parseFloat(bonusPorFaixa) || 0)}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={!vigenciaInicio || !minimoKits}>
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Configurações Vigentes</CardTitle>
          <CardDescription>
            Histórico de configurações de cálculo de kits por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configuracoes.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Vigência a partir de</TableHead>
                    <TableHead className="text-right">Mínimo Kits</TableHead>
                    <TableHead className="text-right">Incremento</TableHead>
                    <TableHead className="text-right">Bônus Base</TableHead>
                    <TableHead className="text-right">Bônus/Faixa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configuracoes.map((config, idx) => (
                    <TableRow key={config.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {formatCompetencia(config.vigencia_inicio)}
                        {idx === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Atual
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{config.minimo_kits.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{config.incremento_faixa} kits</TableCell>
                      <TableCell className="text-right">{formatCurrency(config.bonus_base)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(config.bonus_por_faixa)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit(config)}>
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Configuração</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a configuração vigente a partir de{" "}
                                  {formatCompetencia(config.vigencia_inicio)}? Premiações já geradas não serão afetadas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteConfiguracao(config.id)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma configuração cadastrada.</p>
              <p className="text-sm">Adicione uma configuração para definir as regras de cálculo de kits.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesKits;
