import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Briefcase, DollarSign, Target, CheckSquare, FileText, Award, AlertCircle } from 'lucide-react';
import type { Cargo } from '@/hooks/useCargos';

interface CargoDetailsProps {
  cargo: Cargo;
}

export function CargoDetails({ cargo }: CargoDetailsProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{cargo.nome}</h2>
          {cargo.nivel_hierarquico && (
            <Badge variant="outline">Nível {cargo.nivel_hierarquico}</Badge>
          )}
        </div>
        {cargo.concrem_setores && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>{cargo.concrem_setores.nome}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Faixa Salarial */}
      {(cargo.salario_minimo || cargo.salario_maximo) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3>Faixa Salarial</h3>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mínimo</p>
                <p className="text-lg font-semibold">{formatCurrency(cargo.salario_minimo)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Máximo</p>
                <p className="text-lg font-semibold">{formatCurrency(cargo.salario_maximo)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missão */}
      {cargo.missao && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5 text-primary" />
            <h3>Missão do Cargo</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">{cargo.missao}</p>
        </div>
      )}

      {/* Responsabilidades */}
      {cargo.responsabilidades && cargo.responsabilidades.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3>Responsabilidades</h3>
          </div>
          <ul className="space-y-2">
            {cargo.responsabilidades.map((resp, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Atividades */}
      {cargo.atividades && cargo.atividades.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            <h3>Atividades</h3>
          </div>
          <ul className="space-y-2">
            {cargo.atividades.map((ativ, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">{ativ}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competências */}
      {cargo.competencias && cargo.competencias.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Award className="h-5 w-5 text-primary" />
            <h3>Competências</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {cargo.competencias.map((comp, i) => (
              <Badge key={i} variant="secondary">
                {comp}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Requisitos */}
      {cargo.requisitos && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h3>Requisitos</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">{cargo.requisitos}</p>
        </div>
      )}

      {/* Observações */}
      {cargo.observacoes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            <h3>Observações</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">{cargo.observacoes}</p>
        </div>
      )}
    </div>
  );
}
