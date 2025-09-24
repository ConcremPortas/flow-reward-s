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

  const filteredSetores = setores.filter(setor =>
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setor.encarregado.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setor.supervisor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Setor
            </Button>
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
                        <Button variant="ghost" size="sm" className="gap-1">
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
    </div>
  );
};