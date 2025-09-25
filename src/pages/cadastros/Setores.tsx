import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";

// Dados de exemplo
const setores = [
  {
    id: 1,
    nome: "Produção",
    encarregado: {
      matricula: "E001",
      nome: "Pedro Silva"
    },
    supervisor: {
      matricula: "S001", 
      nome: "Marcos Santos"
    }
  },
  {
    id: 2,
    nome: "Qualidade",
    encarregado: {
      matricula: "E002",
      nome: "Ana Costa"
    },
    supervisor: {
      matricula: "S002",
      nome: "João Oliveira"
    }
  },
  {
    id: 3,
    nome: "Montagem",
    encarregado: {
      matricula: "E003",
      nome: "Carlos Lima"
    },
    supervisor: {
      matricula: "S001",
      nome: "Marcos Santos"
    }
  },
  {
    id: 4,
    nome: "Expedição",
    encarregado: {
      matricula: "E004",
      nome: "Maria Souza"
    },
    supervisor: {
      matricula: "S003",
      nome: "Roberto Alves"
    }
  }
];

export const Setores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    matriculaEncarregado: "",
    nomeEncarregado: "",
    matriculaSupervisor: "",
    nomeSupervisor: ""
  });

  const filteredSetores = setores.filter(setor =>
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setor.encarregado.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setor.supervisor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({
      nome: "",
      matriculaEncarregado: "",
      nomeEncarregado: "",
      matriculaSupervisor: "",
      nomeSupervisor: ""
    });
    setIsAddOpen(true);
  };

  const handleEdit = (setor: any) => {
    setSelectedSetor(setor);
    setFormData({
      nome: setor.nome,
      matriculaEncarregado: setor.encarregado.matricula,
      nomeEncarregado: setor.encarregado.nome,
      matriculaSupervisor: setor.supervisor.matricula,
      nomeSupervisor: setor.supervisor.nome
    });
    setIsEditOpen(true);
  };

  const handleSave = () => {
    console.log("Salvando setor:", formData);
    setIsAddOpen(false);
    setIsEditOpen(false);
  };

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                    <Label htmlFor="matriculaEncarregado">Matrícula do Encarregado</Label>
                    <Input
                      id="matriculaEncarregado"
                      value={formData.matriculaEncarregado}
                      onChange={(e) => setFormData({...formData, matriculaEncarregado: e.target.value})}
                      placeholder="Ex: E001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeEncarregado">Nome do Encarregado</Label>
                    <Input
                      id="nomeEncarregado"
                      value={formData.nomeEncarregado}
                      onChange={(e) => setFormData({...formData, nomeEncarregado: e.target.value})}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matriculaSupervisor">Matrícula do Supervisor</Label>
                    <Input
                      id="matriculaSupervisor"
                      value={formData.matriculaSupervisor}
                      onChange={(e) => setFormData({...formData, matriculaSupervisor: e.target.value})}
                      placeholder="Ex: S001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeSupervisor">Nome do Supervisor</Label>
                    <Input
                      id="nomeSupervisor"
                      value={formData.nomeSupervisor}
                      onChange={(e) => setFormData({...formData, nomeSupervisor: e.target.value})}
                      placeholder="Ex: Maria Santos"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
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
                  <TableHead>Encarregado</TableHead>
                  <TableHead>Matrícula Encarregado</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Matrícula Supervisor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSetores.map((setor) => (
                  <TableRow key={setor.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{setor.nome}</TableCell>
                    <TableCell>{setor.encarregado.nome}</TableCell>
                    <TableCell>{setor.encarregado.matricula}</TableCell>
                    <TableCell>{setor.supervisor.nome}</TableCell>
                    <TableCell>{setor.supervisor.matricula}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleEdit(setor)}
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </Button>
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

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Setor</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-matriculaEncarregado">Matrícula do Encarregado</Label>
              <Input
                id="edit-matriculaEncarregado"
                value={formData.matriculaEncarregado}
                onChange={(e) => setFormData({...formData, matriculaEncarregado: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nomeEncarregado">Nome do Encarregado</Label>
              <Input
                id="edit-nomeEncarregado"
                value={formData.nomeEncarregado}
                onChange={(e) => setFormData({...formData, nomeEncarregado: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-matriculaSupervisor">Matrícula do Supervisor</Label>
              <Input
                id="edit-matriculaSupervisor"
                value={formData.matriculaSupervisor}
                onChange={(e) => setFormData({...formData, matriculaSupervisor: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nomeSupervisor">Nome do Supervisor</Label>
              <Input
                id="edit-nomeSupervisor"
                value={formData.nomeSupervisor}
                onChange={(e) => setFormData({...formData, nomeSupervisor: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};