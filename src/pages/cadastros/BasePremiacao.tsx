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
const basesPremiacao = [
  { id: 1, nome: "Produtividade" },
  { id: 2, nome: "Qualidade" },
  { id: 3, nome: "Segurança" },
  { id: 4, nome: "Liderança" },
  { id: 5, nome: "Logística" },
  { id: 6, nome: "Eficiência" },
  { id: 7, nome: "Inovação" },
  { id: 8, nome: "Sustentabilidade" }
];

export const BasePremiacao = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeBase, setNomeBase] = useState("");

  const filteredBases = basesPremiacao.filter(base =>
    base.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBases.map((base) => (
              <Card key={base.id} className="card-elegant card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{base.nome}</h3>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredBases.length} de {basesPremiacao.length} bases
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};