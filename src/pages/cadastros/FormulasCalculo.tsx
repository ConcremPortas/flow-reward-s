import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
import { Search, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useFormulasCalculo, FormulaCalculo } from '@/hooks/useFormulasCalculo';
import { useCategorias } from '@/hooks/useCategorias';
import { useBasePremiacao } from '@/hooks/useBasePremiacao';

const FormulasCalculo = () => {
  const { formulas, loading, createFormula, updateFormula, deleteFormula } = useFormulasCalculo();
  const { categorias } = useCategorias();
  const { bases } = useBasePremiacao();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [baseId, setBaseId] = useState('');
  const [pesoProducao, setPesoProducao] = useState('');
  const [pesoEpi, setPesoEpi] = useState('');
  const [pesoFaltas, setPesoFaltas] = useState('');
  const [pesoAdvertencias, setPesoAdvertencias] = useState('');
  const [pesoDss, setPesoDss] = useState('');

  const filteredFormulas = formulas.filter(formula =>
    formula.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formula.categoria?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formula.base_premiacao?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setCategoriaId('');
    setBaseId('');
    setPesoProducao('');
    setPesoEpi('');
    setPesoFaltas('');
    setPesoAdvertencias('');
    setPesoDss('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;

    const totalPesos = 
      Number(pesoProducao || 0) + 
      Number(pesoEpi || 0) + 
      Number(pesoFaltas || 0) + 
      Number(pesoAdvertencias || 0) + 
      Number(pesoDss || 0);

    if (totalPesos !== 100) {
      alert('A soma dos pesos deve ser igual a 100%');
      return;
    }

    const formulaData = {
      nome,
      descricao: descricao || null,
      categoria_id: categoriaId || null,
      base_premiacao_id: baseId || null,
      peso_producao_setor: Number(pesoProducao || 0),
      peso_epi: Number(pesoEpi || 0),
      peso_faltas: Number(pesoFaltas || 0),
      peso_advertencias: Number(pesoAdvertencias || 0),
      peso_dss: Number(pesoDss || 0),
      ativo: true
    };

    if (editingId) {
      await updateFormula(editingId, formulaData);
    } else {
      await createFormula(formulaData);
    }

    resetForm();
  };

  const handleEdit = (formula: FormulaCalculo) => {
    setNome(formula.nome);
    setDescricao(formula.descricao || '');
    setCategoriaId(formula.categoria_id || '');
    setBaseId(formula.base_premiacao_id || '');
    setPesoProducao(formula.peso_producao_setor.toString());
    setPesoEpi(formula.peso_epi.toString());
    setPesoFaltas(formula.peso_faltas.toString());
    setPesoAdvertencias(formula.peso_advertencias.toString());
    setPesoDss(formula.peso_dss.toString());
    setIsEditing(true);
    setEditingId(formula.id);
  };

  const handleDelete = async (id: string) => {
    await deleteFormula(id);
  };

  const getTotalPesos = () => {
    return Number(pesoProducao || 0) + 
           Number(pesoEpi || 0) + 
           Number(pesoFaltas || 0) + 
           Number(pesoAdvertencias || 0) + 
           Number(pesoDss || 0);
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Fórmulas de Cálculo</h1>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isEditing ? 'Editar Fórmula' : 'Nova Fórmula de Cálculo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome*</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da fórmula"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base">Base de Premiação</Label>
              <Select value={baseId} onValueChange={setBaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma base" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      {base.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição da fórmula"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Pesos dos Indicadores (%)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pesoProducao">Produção Setor</Label>
                <Input
                  id="pesoProducao"
                  type="number"
                  min="0"
                  max="100"
                  value={pesoProducao}
                  onChange={(e) => setPesoProducao(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pesoEpi">EPI</Label>
                <Input
                  id="pesoEpi"
                  type="number"
                  min="0"
                  max="100"
                  value={pesoEpi}
                  onChange={(e) => setPesoEpi(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pesoFaltas">Faltas</Label>
                <Input
                  id="pesoFaltas"
                  type="number"
                  min="0"
                  max="100"
                  value={pesoFaltas}
                  onChange={(e) => setPesoFaltas(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pesoAdvertencias">Advertências</Label>
                <Input
                  id="pesoAdvertencias"
                  type="number"
                  min="0"
                  max="100"
                  value={pesoAdvertencias}
                  onChange={(e) => setPesoAdvertencias(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pesoDss">DSS</Label>
                <Input
                  id="pesoDss"
                  type="number"
                  min="0"
                  max="100"
                  value={pesoDss}
                  onChange={(e) => setPesoDss(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total dos pesos:</span>
                <span className={`font-bold ${getTotalPesos() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalPesos()}%
                </span>
              </div>
              {getTotalPesos() !== 100 && (
                <p className="text-sm text-muted-foreground mt-1">
                  A soma dos pesos deve ser igual a 100%
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={getTotalPesos() !== 100}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Atualizar' : 'Salvar'}
            </Button>
            {isEditing && (
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar fórmulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fórmulas */}
      <div className="grid gap-4">
        {filteredFormulas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {searchTerm ? 'Nenhuma fórmula encontrada.' : 'Nenhuma fórmula cadastrada.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFormulas.map((formula) => (
            <Card key={formula.id} className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{formula.nome}</h3>
                    {formula.descricao && (
                      <p className="text-muted-foreground mb-3">{formula.descricao}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {formula.categoria && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
                          <p className="text-foreground">{formula.categoria.nome}</p>
                        </div>
                      )}
                      
                      {formula.base_premiacao && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Base:</span>
                          <p className="text-foreground">{formula.base_premiacao.nome}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      {formula.peso_producao_setor > 0 && (
                        <div>
                          <span className="font-medium">Produção:</span>
                          <span className="ml-1">{formula.peso_producao_setor}%</span>
                        </div>
                      )}
                      {formula.peso_epi > 0 && (
                        <div>
                          <span className="font-medium">EPI:</span>
                          <span className="ml-1">{formula.peso_epi}%</span>
                        </div>
                      )}
                      {formula.peso_faltas > 0 && (
                        <div>
                          <span className="font-medium">Faltas:</span>
                          <span className="ml-1">{formula.peso_faltas}%</span>
                        </div>
                      )}
                      {formula.peso_advertencias > 0 && (
                        <div>
                          <span className="font-medium">Advertências:</span>
                          <span className="ml-1">{formula.peso_advertencias}%</span>
                        </div>
                      )}
                      {formula.peso_dss > 0 && (
                        <div>
                          <span className="font-medium">DSS:</span>
                          <span className="ml-1">{formula.peso_dss}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(formula)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Fórmula de Cálculo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta fórmula de cálculo? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(formula.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resumo */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Total de {filteredFormulas.length} fórmula{filteredFormulas.length !== 1 ? 's' : ''} 
            {searchTerm && ` encontrada${filteredFormulas.length !== 1 ? 's' : ''}`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormulasCalculo;