// Página de gestão de faixas - conectada ao banco
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
  TableRow 
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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useFaixas } from "@/hooks/useFaixas";

export const Faixas = () => {
  const { faixas, loading, createFaixa, deleteFaixa } = useFaixas();
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeFaixa, setNomeFaixa] = useState("");
  const [valor, setValor] = useState("");

  const filteredFaixas = faixas.filter(faixa =>
    faixa.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddFaixa = async () => {
    if (!nomeFaixa.trim() || !valor) return;
    
    await createFaixa({
      nome: nomeFaixa,
      valor: parseFloat(valor),
      ativo: true
    });
    
    setNomeFaixa("");
    setValor("");
  };

  const handleDeleteFaixa = async (id: string) => {
    await deleteFaixa(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando faixas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nova Faixa */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Faixa de Categoria Bônus</CardTitle>
          <CardDescription>
            Cadastre uma nova faixa de categoria bônus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Faixa</label>
              <Input
                placeholder="Ex: Faixa A"
                value={nomeFaixa}
                onChange={(e) => setNomeFaixa(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 500.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>

          {/* Prévia dos valores */}
          {valor && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor da faixa:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(Number(valor))}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setNomeFaixa("");
              setValor("");
            }}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleAddFaixa} disabled={!nomeFaixa.trim() || !valor}>
              <Plus className="h-4 w-4" />
              Adicionar Faixa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Faixas */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Faixas de Categoria Bônus</CardTitle>
              <CardDescription>
                Faixas cadastradas para premiação dos funcionários
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
                placeholder="Buscar faixas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          {filteredFaixas.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome da Faixa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaixas.map((faixa) => (
                  <TableRow key={faixa.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{faixa.nome}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(faixa.valor)}
                    </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Faixa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a faixa "{faixa.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteFaixa(faixa.id)}
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
              <p>Nenhuma faixa cadastrada ainda.</p>
              <p className="text-sm">Adicione faixas para categorizar premiações.</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredFaixas.length} de {faixas.length} faixas
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};