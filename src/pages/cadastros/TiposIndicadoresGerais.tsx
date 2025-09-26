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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, BarChart3 } from "lucide-react";
import { useTiposIndicadoresGerais } from "@/hooks/useTiposIndicadoresGerais";

export const TiposIndicadoresGerais = () => {
  const { tiposIndicadores, loading, createTipoIndicador, updateTipoIndicador, deleteTipoIndicador } = useTiposIndicadoresGerais();
  const [searchTerm, setSearchTerm] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const filteredTipos = tiposIndicadores.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!nome || !codigo) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      nome,
      codigo: codigo.toUpperCase(),
      descricao: descricao || undefined,
      ativo: true
    };

    if (editingRecord) {
      await updateTipoIndicador(editingRecord, data);
    } else {
      await createTipoIndicador(data);
    }

    handleCancel();
  };

  const handleEdit = (tipo: any) => {
    setNome(tipo.nome);
    setCodigo(tipo.codigo);
    setDescricao(tipo.descricao || "");
    setEditingRecord(tipo.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este tipo de indicador?")) {
      await deleteTipoIndicador(id);
    }
  };

  const handleCancel = () => {
    setNome("");
    setCodigo("");
    setDescricao("");
    setEditingRecord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {editingRecord ? "Editar" : "Novo"} Tipo de Indicador Geral
          </CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o tipo de indicador selecionado" : "Cadastre um novo tipo de indicador geral"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                placeholder="Ex: Faturamento"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código *</label>
              <Input
                placeholder="Ex: FAT"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                placeholder="Descrição opcional..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!nome || !codigo}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Tipos de Indicadores Gerais</CardTitle>
              <CardDescription>
                Gerencie os tipos de indicadores que serão utilizados nos indicadores gerais
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
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTipos.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.codigo}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.descricao || "Sem descrição"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.ativo ? "default" : "secondary"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {tiposIndicadores.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
              <span>Total de {tiposIndicadores.length} tipo(s) cadastrado(s)</span>
              <span>{tiposIndicadores.filter(t => t.ativo).length} ativo(s)</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};