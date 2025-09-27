// Página de gestão de base de premiação - conectada ao banco
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useBasePremiacao } from "@/hooks/useBasePremiacao";

export const BasePremiacao = () => {
  const { bases, loading, createBase, deleteBase } = useBasePremiacao();
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeBase, setNomeBase] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [tipo, setTipo] = useState("percentual");

  const filteredBases = bases.filter(base =>
    base.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBase = async () => {
    if (!nomeBase.trim() || !valorBase) return;
    
    await createBase({
      nome: nomeBase,
      descricao: descricao || undefined,
      valor_base: parseFloat(valorBase),
      tipo,
      ativo: true
    });
    
    setNomeBase("");
    setDescricao("");
    setValorBase("");
    setTipo("percentual");
  };

  const handleDeleteBase = async (id: string) => {
    await deleteBase(id);
  };

  const formatTipo = (tipo: string) => {
    return tipo === 'percentual' ? 'Percentual' : 'Valor Fixo';
  };

  const formatValor = (valor: number, tipo: string) => {
    if (tipo === 'percentual') {
      return `${valor}%`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando bases de premiação...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nova Base */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Base de Premiação</CardTitle>
          <CardDescription>
            Cadastre uma nova base para cálculo de premiação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Base</label>
              <Input
                placeholder="Ex: Produtividade"
                value={nomeBase}
                onChange={(e) => setNomeBase(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual</SelectItem>
                  <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Valor Base {tipo === 'percentual' ? '(%)' : '(R$)'}
              </label>
              <Input
                type="number"
                step={tipo === 'percentual' ? '0.1' : '0.01'}
                placeholder={tipo === 'percentual' ? "Ex: 10" : "Ex: 100.00"}
                value={valorBase}
                onChange={(e) => setValorBase(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição opcional da base de premiação..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setNomeBase("");
              setDescricao("");
              setValorBase("");
              setTipo("percentual");
            }}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleAddBase} 
              disabled={!nomeBase.trim() || !valorBase}
            >
              <Plus className="h-4 w-4" />
              Adicionar Base
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Bases */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Bases de Premiação</CardTitle>
              <CardDescription>
                Bases utilizadas para cálculo das premiações dos funcionários
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de busca */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar bases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Grid de bases */}
          {filteredBases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBases.map((base) => (
                <Card key={base.id} className="card-elegant card-hover">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{base.nome}</h3>
                          <p className="text-sm text-muted-foreground">{formatTipo(base.tipo)}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Base de Premiação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta base de premiação? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteBase(base.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div className="text-lg font-bold text-primary">
                        {formatValor(base.valor_base, base.tipo)}
                      </div>
                      
                      {base.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {base.descricao}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma base de premiação cadastrada ainda.</p>
              <p className="text-sm">Adicione bases para calcular premiações dos funcionários.</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredBases.length} de {bases.length} bases
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};