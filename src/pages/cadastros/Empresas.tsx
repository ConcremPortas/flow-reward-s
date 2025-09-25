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
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Edit, Trash2, Search, Building } from "lucide-react";
import { useEmpresas } from "@/hooks/useEmpresas";

export const Empresas = () => {
  const { empresas, loading, createEmpresa, deleteEmpresa } = useEmpresas();
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (empresa.cnpj && empresa.cnpj.includes(searchTerm))
  );

  const handleAddEmpresa = async () => {
    if (!nomeEmpresa.trim()) return;
    
    await createEmpresa({
      nome: nomeEmpresa,
      cnpj: cnpj || undefined,
      ativo: true
    });
    
    setNomeEmpresa("");
    setCnpj("");
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      await deleteEmpresa(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando empresas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nova Empresa */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Empresa</CardTitle>
          <CardDescription>
            Cadastre uma nova empresa no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Empresa</label>
              <Input
                placeholder="Ex: Empresa Principal"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input
                placeholder="Ex: 12.345.678/0001-90"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => { setNomeEmpresa(""); setCnpj(""); }}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleAddEmpresa} disabled={!nomeEmpresa.trim()}>
              <Plus className="h-4 w-4" />
              Adicionar Empresa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>
                Empresas registradas no sistema de remuneração
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
                placeholder="Buscar empresas..."
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
                  <TableHead>Nome da Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{empresa.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {empresa.cnpj || "Não informado"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={empresa.ativo ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEmpresa(empresa.id)}
                        >
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

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {empresas.filter(e => e.ativo).length}
              </div>
              <div className="text-sm text-muted-foreground">Empresas Ativas</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{empresas.length}</div>
              <div className="text-sm text-muted-foreground">Total de Empresas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};