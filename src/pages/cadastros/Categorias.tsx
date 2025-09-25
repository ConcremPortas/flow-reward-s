// Página de gestão de categorias - conectada ao banco
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useCategorias } from "@/hooks/useCategorias";

export const Categorias = () => {
  const { categorias, loading, createCategoria, deleteCategoria } = useCategorias();
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeCategoria, setNomeCategoria] = useState("");

  const filteredCategorias = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategoria = async () => {
    if (!nomeCategoria.trim()) return;
    
    await createCategoria({
      nome: nomeCategoria,
      ativo: true
    });
    
    setNomeCategoria("");
  };

  const handleDeleteCategoria = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await deleteCategoria(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nova Categoria */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Categoria</CardTitle>
          <CardDescription>
            Cadastre uma nova categoria de funcionário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Categoria</label>
              <Input
                placeholder="Ex: CLT"
                value={nomeCategoria}
                onChange={(e) => setNomeCategoria(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setNomeCategoria("")}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleAddCategoria} disabled={!nomeCategoria.trim()}>
              <Plus className="h-4 w-4" />
              Adicionar Categoria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Categorias de Funcionários</CardTitle>
              <CardDescription>
                Categorias disponíveis para classificação dos funcionários
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
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Grid de categorias */}
          {filteredCategorias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategorias.map((categoria) => (
                <Card key={categoria.id} className="card-elegant card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{categoria.nome}</h3>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCategoria(categoria.id)}
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
              <p>Nenhuma categoria cadastrada ainda.</p>
              <p className="text-sm">Adicione categorias para classificar seus funcionários.</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredCategorias.length} de {categorias.length} categorias
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};