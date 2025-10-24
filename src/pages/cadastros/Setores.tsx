import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useSetores } from "@/hooks/useSetores";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Setores = () => {
  const { setores, loading, createSetor, deleteSetor } = useSetores();
  const { empresas } = useEmpresas();
  const { funcionarios } = useFuncionarios();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    empresa_id: "",
    supervisor_id: "",
    encarregado_id: ""
  });

  const filteredSetores = setores.filter(setor =>
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (setor.descricao && setor.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    setFormData({
      nome: "",
      descricao: "",
      empresa_id: "",
      supervisor_id: "",
      encarregado_id: ""
    });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    await createSetor({
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      empresa_id: formData.empresa_id || undefined,
      supervisor_id: formData.supervisor_id || undefined,
      encarregado_id: formData.encarregado_id || undefined,
      ativo: true
    });
    
    setIsAddOpen(false);
    setFormData({ nome: "", descricao: "", empresa_id: "", supervisor_id: "", encarregado_id: "" });
  };

  const handleDeleteSetor = async (id: string) => {
    await deleteSetor(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando setores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Cadastro de Setores</CardTitle>
              <CardDescription>
                Gerenciamento dos setores da empresa
              </CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Novo Setor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Setor</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Setor</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Ex: Produção"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      placeholder="Ex: Setor responsável pela produção"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Select value={formData.empresa_id} onValueChange={(value) => setFormData({...formData, empresa_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map(empresa => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor (Opcional)</Label>
                    <Select value={formData.supervisor_id} onValueChange={(value) => setFormData({...formData, supervisor_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um supervisor ou deixe em branco" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.filter(f => f.ativo).map(funcionario => (
                          <SelectItem key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="encarregado">Encarregado (Opcional)</Label>
                    <Select value={formData.encarregado_id} onValueChange={(value) => setFormData({...formData, encarregado_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um encarregado ou deixe em branco" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.filter(f => f.ativo).map(funcionario => (
                          <SelectItem key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.nome.trim()}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtro de busca */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar setores..."
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
                  <TableHead>Nome do Setor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Encarregado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSetores.map((setor) => (
                  <TableRow key={setor.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{setor.nome}</TableCell>
                    <TableCell>{setor.descricao || "Sem descrição"}</TableCell>
                    <TableCell>{setor.empresa?.nome || "Não vinculado"}</TableCell>
                    <TableCell>{setor.supervisor?.nome || "Não definido"}</TableCell>
                    <TableCell>{setor.encarregado?.nome || "Não definido"}</TableCell>
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
                              <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o setor "{setor.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteSetor(setor.id)}
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

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredSetores.length} de {setores.length} setores
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};