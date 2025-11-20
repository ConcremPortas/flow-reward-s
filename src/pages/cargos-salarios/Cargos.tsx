import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Briefcase, DollarSign, Edit, Trash2, Eye } from 'lucide-react';
import { useCargos } from '@/hooks/useCargos';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CargoForm } from '@/components/cargos-salarios/CargoForm';
import { CargoDetails } from '@/components/cargos-salarios/CargoDetails';
import type { Cargo } from '@/hooks/useCargos';

export default function Cargos() {
  const { cargos, loading, deleteCargo } = useCargos();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredCargos = cargos.filter(cargo =>
    cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargo.concrem_setores?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = (cargo: Cargo) => {
    setSelectedCargo(cargo);
    setIsFormOpen(true);
  };

  const handleView = (cargo: Cargo) => {
    setSelectedCargo(cargo);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cargo?')) {
      await deleteCargo(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCargo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Cargos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os cargos da empresa
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setSelectedCargo(null)}>
              <Plus className="h-4 w-4" />
              Novo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCargo ? 'Editar Cargo' : 'Novo Cargo'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do cargo
              </DialogDescription>
            </DialogHeader>
            <CargoForm cargo={selectedCargo} onClose={handleFormClose} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista de Cargos ({filteredCargos.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cargos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredCargos.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCargos.map((cargo) => (
                <Card key={cargo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{cargo.nome}</h3>
                          {cargo.nivel_hierarquico && (
                            <Badge variant="outline">
                              Nível {cargo.nivel_hierarquico}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {cargo.concrem_setores && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {cargo.concrem_setores.nome}
                            </span>
                          )}
                          {(cargo.salario_minimo || cargo.salario_maximo) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(cargo.salario_minimo)} - {formatCurrency(cargo.salario_maximo)}
                            </span>
                          )}
                        </div>
                        {cargo.missao && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {cargo.missao}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(cargo)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cargo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cargo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cargo</DialogTitle>
          </DialogHeader>
          {selectedCargo && <CargoDetails cargo={selectedCargo} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
