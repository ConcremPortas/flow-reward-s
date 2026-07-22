// Exportação client-side (não depende de infraestrutura de servidor).
import type { Funcionario } from '@/hooks/useFuncionarios';

const escapeCsv = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function exportFuncionariosCsv(list: Funcionario[], filename = 'funcionarios.csv') {
  const headers = ['Código', 'Nome', 'Empresa', 'Setor', 'Função', 'Categoria', 'Status', 'Admissão'];
  const lines = [headers.join(';')];
  list.forEach((f) => {
    lines.push([
      f.cpf || '', f.nome, f.empresa?.nome || '', f.setor?.nome || '',
      f.funcao?.nome || '', f.categoria?.nome || '', f.status || 'Ativo', f.data_admissao || '',
    ].map((v) => escapeCsv(String(v))).join(';'));
  });
  const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
