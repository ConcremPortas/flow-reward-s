import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react";
import { useLocaisDSS } from "@/hooks/useLocaisDSS";

export const LocaisDSS = () => {
  const { locais, loading, createLocal, updateLocal, deleteLocal } = useLocaisDSS();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });

  const filteredLocais = locais.filter(local =>
    local.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ nome: "", descricao: "" });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    await createLocal({
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined,
      ativo: true
    });
    
    setIsAddOpen(false);
  };

  const handleEdit = (local: any) => {
    setSelectedLocal(local);
    setFormData({
      nome: local.nome,
      descricao: local.descricao || ""
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.nome.trim() || !selectedLocal) return;
    
    await updateLocal(selectedLocal.id, {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined
    });
    
    setIsEditOpen(false);
    setSelectedLocal(null);
  };

  const handleDelete = async (local: any) => {
    await deleteLocal(local.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando locais de DSS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Informativo */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Locais de DSS</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre os locais onde os DSS (Diálogos de Segurança) são realizados. 
                Cada funcionário será vinculado a um local específico para controle de presença.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Locais de DSS</CardTitle>
              <CardDescription>
                Gerencie os locais de realização dos Diálogos de Segurança
              </CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Novo Local
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Local de DSS</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Local *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Ex: Fábrica 01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      placeholder="Descrição opcional do local"
                      rows={3}
                    />
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
          {/* Filtros */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum local de DSS encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocais.map((local) => (
                    <TableRow key={local.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{local.nome}</TableCell>
                      <TableCell>{local.descricao || "Sem descrição"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleEdit(local)}
                          >
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
                                <AlertDialogTitle>Excluir Local de DSS</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o local "{local.nome}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(local)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredLocais.length} de {locais.length} locais
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Local de DSS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nome">Nome do Local *</Label>
              <Input
                id="edit_nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Fábrica 01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_descricao">Descrição</Label>
              <Textarea
                id="edit_descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição opcional do local"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.nome.trim()}>
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
