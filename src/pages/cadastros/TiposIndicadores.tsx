import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Settings } from "lucide-react";
import { useTiposIndicadores } from "@/hooks/useTiposIndicadores";

export const TiposIndicadores = () => {
  const { tiposIndicadores, loading, createTipoIndicador, updateTipoIndicador, deleteTipoIndicador } = useTiposIndicadores();
  const [searchTerm, setSearchTerm] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const filteredTipos = tiposIndicadores.filter(tipo =>
    tipo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!codigo.trim() || !nome.trim()) {
      alert("Por favor, preencha o código e nome do indicador");
      return;
    }

    const tipoIndicador = {
      codigo: codigo.toUpperCase().trim(),
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      ativo: true
    };

    if (editingRecord) {
      await updateTipoIndicador(editingRecord, tipoIndicador);
    } else {
      await createTipoIndicador(tipoIndicador);
    }

    // Reset form
    setCodigo("");
    setNome("");
    setDescricao("");
    setEditingRecord(null);
  };

  const handleEdit = (tipo: any) => {
    setCodigo(tipo.codigo);
    setNome(tipo.nome);
    setDescricao(tipo.descricao || "");
    setEditingRecord(tipo.id);
  };

  const handleDelete = async (id: string, nome: string) => {
    await deleteTipoIndicador(id);
  };

  const handleCancel = () => {
    setCodigo("");
    setNome("");
    setDescricao("");
    setEditingRecord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando tipos de indicadores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Novo/Editar Tipo de Indicador */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {editingRecord ? "Editar" : "Novo"} Tipo de Indicador
          </CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o tipo de indicador selecionado" : "Cadastre novos tipos de indicadores para os setores"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código *</label>
              <Input
                placeholder="Ex: ID, NC, HM..."
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                placeholder="Ex: Identificação Não Conformidades"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              placeholder="Descrição detalhada do tipo de indicador..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!codigo.trim() || !nome.trim()}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Cadastrar"} Tipo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tipos de Indicadores */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Tipos de Indicadores Cadastrados</CardTitle>
              <CardDescription>
                Gerencie os tipos de indicadores disponíveis para os setores
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
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          {tiposIndicadores.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTipos.map((tipo) => (
                    <TableRow key={tipo.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {tipo.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tipo.nome}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {tipo.descricao || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tipo.ativo ? "default" : "secondary"}>
                          {tipo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tipo)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tipo.id, tipo.nome)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum tipo de indicador cadastrado ainda.</p>
              <p className="text-sm">Use o formulário acima para cadastrar novos tipos.</p>
            </div>
          )}

          {/* Resumo */}
          {tiposIndicadores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{tiposIndicadores.length}</div>
                <div className="text-sm text-muted-foreground">Total de Tipos</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">ID</div>
                <div className="text-sm text-muted-foreground">Identificação NC</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">NC</div>
                <div className="text-sm text-muted-foreground">Tratamento NC</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">HM</div>
                <div className="text-sm text-muted-foreground">Hora Máquina</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">OPC/L</div>
                <div className="text-sm text-muted-foreground">Operação/Limpeza</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};