// Página de gestão de funções - conectada ao banco
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useFuncoes } from "@/hooks/useFuncoes";

export const Funcoes = () => {
  const { funcoes, loading, createFuncao, deleteFuncao } = useFuncoes();
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeFuncao, setNomeFuncao] = useState("");

  const filteredFuncoes = funcoes.filter(funcao =>
    funcao.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFuncao = async () => {
    if (!nomeFuncao.trim()) return;
    
    await createFuncao({
      nome: nomeFuncao,
      ativo: true
    });
    
    setNomeFuncao("");
  };

  const handleDeleteFuncao = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta função?")) {
      await deleteFuncao(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando funções...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nova Função */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Função</CardTitle>
          <CardDescription>
            Cadastre uma nova função para os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Função</label>
              <Input
                placeholder="Ex: Operador"
                value={nomeFuncao}
                onChange={(e) => setNomeFuncao(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setNomeFuncao("")}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleAddFuncao} disabled={!nomeFuncao.trim()}>
              <Plus className="h-4 w-4" />
              Adicionar Função
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Funções */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Funções Cadastradas</CardTitle>
              <CardDescription>
                Funções disponíveis para os funcionários
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
                placeholder="Buscar funções..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Grid de funções */}
          {filteredFuncoes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFuncoes.map((funcao) => (
                <Card key={funcao.id} className="card-elegant card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{funcao.nome}</h3>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFuncao(funcao.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma função cadastrada ainda.</p>
              <p className="text-sm">Adicione funções para organizarmelhor seus funcionários.</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredFuncoes.length} de {funcoes.length} funções
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};