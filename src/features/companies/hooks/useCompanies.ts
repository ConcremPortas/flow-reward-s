import { useMemo } from 'react';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useSetores } from '@/hooks/useSetores';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { buildCompanyUsageMaps, usageFor } from '../domain/companyDependencies';
import { getCompanyRegistrationStatus } from '../domain/companyRegistrationStatus';
import { cnpjKey } from '../domain/companyValidation';
import { isValidCNPJ, hasCNPJValue } from '../domain/cnpjValidation';
import type { CompanyRow } from '../types/company.types';

/**
 * Composição das fontes da Gestão de Empresas. Constrói as linhas enriquecidas
 * (estrutura vinculada + situação cadastral) uma vez, com agregação em lote (sem
 * N+1). Reexpõe create/update/delete (delete é soft). Não altera o banco.
 *
 * Observação: `useEmpresas` só retorna empresas ativas (ativo=true) — convenção de
 * soft-delete do sistema. Empresas desativadas não aparecem aqui.
 */
export function useCompanies() {
  const { empresas, loading, createEmpresa, updateEmpresa, deleteEmpresa, refetch } = useEmpresas();
  const { setores } = useSetores();
  const { funcionarios } = useFuncionarios();
  const { resultados } = useResultadosPremiacao();

  const maps = useMemo(() => buildCompanyUsageMaps(setores, funcionarios, resultados), [setores, funcionarios, resultados]);

  // Duplicidade por CNPJ (dígitos), ignorando empresas sem CNPJ.
  const cnpjCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of empresas) { const k = cnpjKey(e.cnpj); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return m;
  }, [empresas]);

  const rows = useMemo<CompanyRow[]>(() => empresas.map((e) => {
    const usage = usageFor(e, maps);
    const cnpjInformado = hasCNPJValue(e.cnpj);
    const cnpjValido = cnpjInformado && isValidCNPJ(e.cnpj);
    const duplicadoCnpj = cnpjInformado && (cnpjCount.get(cnpjKey(e.cnpj)) ?? 0) > 1;
    return {
      id: e.id, nome: e.nome, cnpj: e.cnpj ?? null, ativo: e.ativo,
      cnpjValido, cnpjInformado, usage, duplicadoCnpj,
      status: getCompanyRegistrationStatus({ ativo: e.ativo, nome: e.nome, cnpjInformado, cnpjValido, duplicadoCnpj }),
    } satisfies CompanyRow;
  }), [empresas, maps, cnpjCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  /** Empresa existente com o mesmo CNPJ (dígitos). */
  const findByCnpj = (cnpj: string, exceptId?: string): CompanyRow | undefined => {
    const k = cnpjKey(cnpj);
    if (!k) return undefined;
    return rows.find(r => r.id !== exceptId && cnpjKey(r.cnpj) === k);
  };

  return { rows, rowById, loading, createEmpresa, updateEmpresa, deleteEmpresa, refetch, findByCnpj };
}

export type UseCompaniesReturn = ReturnType<typeof useCompanies>;
