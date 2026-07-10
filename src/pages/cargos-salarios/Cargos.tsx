import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { PageHeader } from '@/components/app/PageHeader';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';

export default function Cargos() {
  const { cargos, loading, deleteCargo } = useCargos();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredCargos = cargos.filter(cargo =>
    cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargo.concremrh_setores?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Cargos"
        description="Gerencie os cargos da empresa"
        actions={
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
        }
      />

      <SectionCard
        title={`Lista de Cargos (${filteredCargos.length})`}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cargos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredCargos.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado ainda'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredCargos.map((cargo) => (
              <div
                key={cargo.id}
                className="rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-primary/25 hover:bg-muted/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{cargo.nome}</h3>
                      {cargo.nivel_hierarquico && (
                        <StatusBadge variant="info">
                          Nível {cargo.nivel_hierarquico}
                        </StatusBadge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {cargo.concremrh_setores && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          {cargo.concremrh_setores.nome}
                        </span>
                      )}
                      {(cargo.salario_minimo || cargo.salario_maximo) && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCurrency(cargo.salario_minimo)} - {formatCurrency(cargo.salario_maximo)}
                        </span>
                      )}
                    </div>
                    {cargo.missao && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
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
              </div>
            ))}
          </div>
        )}
      </SectionCard>

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
