import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSetores } from '@/hooks/useSetores';
import { useCargos, type Cargo } from '@/hooks/useCargos';
import { Loader2, Plus, X } from 'lucide-react';

interface CargoFormProps {
  cargo: Cargo | null;
  onClose: () => void;
}

export function CargoForm({ cargo, onClose }: CargoFormProps) {
  const { setores } = useSetores();
  const { createCargo, updateCargo } = useCargos();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    setor_id: '',
    nivel_hierarquico: '',
    missao: '',
    responsabilidades: [] as string[],
    atividades: [] as string[],
    competencias: [] as string[],
    requisitos: '',
    salario_minimo: '',
    salario_maximo: '',
    observacoes: '',
    ativo: true,
  });

  const [newResp, setNewResp] = useState('');
  const [newAtiv, setNewAtiv] = useState('');
  const [newComp, setNewComp] = useState('');

  useEffect(() => {
    if (cargo) {
      setFormData({
        nome: cargo.nome || '',
        setor_id: cargo.setor_id || '',
        nivel_hierarquico: cargo.nivel_hierarquico?.toString() || '',
        missao: cargo.missao || '',
        responsabilidades: cargo.responsabilidades || [],
        atividades: cargo.atividades || [],
        competencias: cargo.competencias || [],
        requisitos: cargo.requisitos || '',
        salario_minimo: cargo.salario_minimo?.toString() || '',
        salario_maximo: cargo.salario_maximo?.toString() || '',
        observacoes: cargo.observacoes || '',
        ativo: cargo.ativo,
      });
    }
  }, [cargo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      nome: formData.nome,
      setor_id: formData.setor_id || null,
      nivel_hierarquico: formData.nivel_hierarquico ? parseInt(formData.nivel_hierarquico) : null,
      missao: formData.missao || null,
      responsabilidades: formData.responsabilidades.length > 0 ? formData.responsabilidades : null,
      atividades: formData.atividades.length > 0 ? formData.atividades : null,
      competencias: formData.competencias.length > 0 ? formData.competencias : null,
      requisitos: formData.requisitos || null,
      salario_minimo: formData.salario_minimo ? parseFloat(formData.salario_minimo) : null,
      salario_maximo: formData.salario_maximo ? parseFloat(formData.salario_maximo) : null,
      observacoes: formData.observacoes || null,
      ativo: formData.ativo,
    };

    if (cargo) {
      await updateCargo(cargo.id, data);
    } else {
      await createCargo(data);
    }

    setLoading(false);
    onClose();
  };

  const addItem = (type: 'responsabilidades' | 'atividades' | 'competencias', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      if (type === 'responsabilidades') setNewResp('');
      if (type === 'atividades') setNewAtiv('');
      if (type === 'competencias') setNewComp('');
    }
  };

  const removeItem = (type: 'responsabilidades' | 'atividades' | 'competencias', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Cargo *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setor">Setor</Label>
          <Select value={formData.setor_id} onValueChange={(value) => setFormData({ ...formData, setor_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um setor" />
            </SelectTrigger>
            <SelectContent>
              {setores.map((setor) => (
                <SelectItem key={setor.id} value={setor.id}>
                  {setor.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nivel">Nível Hierárquico</Label>
          <Input
            id="nivel"
            type="number"
            value={formData.nivel_hierarquico}
            onChange={(e) => setFormData({ ...formData, nivel_hierarquico: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="missao">Missão do Cargo</Label>
        <Textarea
          id="missao"
          value={formData.missao}
          onChange={(e) => setFormData({ ...formData, missao: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Responsabilidades</Label>
        <div className="flex gap-2">
          <Input
            value={newResp}
            onChange={(e) => setNewResp(e.target.value)}
            placeholder="Digite uma responsabilidade"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('responsabilidades', newResp))}
          />
          <Button type="button" onClick={() => addItem('responsabilidades', newResp)} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {formData.responsabilidades.map((resp, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1 text-sm">{resp}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem('responsabilidades', i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Atividades</Label>
        <div className="flex gap-2">
          <Input
            value={newAtiv}
            onChange={(e) => setNewAtiv(e.target.value)}
            placeholder="Digite uma atividade"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('atividades', newAtiv))}
          />
          <Button type="button" onClick={() => addItem('atividades', newAtiv)} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {formData.atividades.map((ativ, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1 text-sm">{ativ}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem('atividades', i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Competências</Label>
        <div className="flex gap-2">
          <Input
            value={newComp}
            onChange={(e) => setNewComp(e.target.value)}
            placeholder="Digite uma competência"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('competencias', newComp))}
          />
          <Button type="button" onClick={() => addItem('competencias', newComp)} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {formData.competencias.map((comp, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1 text-sm">{comp}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem('competencias', i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requisitos">Requisitos</Label>
        <Textarea
          id="requisitos"
          value={formData.requisitos}
          onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salario_min">Salário Mínimo</Label>
          <Input
            id="salario_min"
            type="number"
            step="0.01"
            value={formData.salario_minimo}
            onChange={(e) => setFormData({ ...formData, salario_minimo: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salario_max">Salário Máximo</Label>
          <Input
            id="salario_max"
            type="number"
            step="0.01"
            value={formData.salario_maximo}
            onChange={(e) => setFormData({ ...formData, salario_maximo: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {cargo ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
