import { Sparkles, ThumbsUp, Recycle, Wrench, Ban, PackageCheck, Droplets, ArchiveX, Trash2, type LucideIcon } from 'lucide-react';
import { deveReestocar } from '../../domain/returns';
import { RESTOCK_CONDITIONS, RETURN_CONDITION_LABEL, RETURN_DESTINATION_LABEL } from '../../domain/domainConstants';
import type { ReturnCondition, ReturnDestination } from '../../types/inventory.types';

export interface CondMeta { key: ReturnCondition; label: string; desc: string; icon: LucideIcon; reaproveitavel: boolean }
export const CONDICOES: CondMeta[] = [
  { key: 'NOVO', label: RETURN_CONDITION_LABEL.NOVO, desc: 'Sem sinais de uso e apto para reutilização.', icon: Sparkles, reaproveitavel: true },
  { key: 'BOM', label: RETURN_CONDITION_LABEL.BOM, desc: 'Usado, mas em condição adequada para retorno ao estoque.', icon: ThumbsUp, reaproveitavel: true },
  { key: 'USADO', label: RETURN_CONDITION_LABEL.USADO, desc: 'Apresenta desgaste, porém ainda pode ser reaproveitado.', icon: Recycle, reaproveitavel: true },
  { key: 'DANIFICADO', label: RETURN_CONDITION_LABEL.DANIFICADO, desc: 'Necessita análise, manutenção ou baixa.', icon: Wrench, reaproveitavel: false },
  { key: 'SEM_REUSO', label: RETURN_CONDITION_LABEL.SEM_REUSO, desc: 'Não deve retornar ao estoque.', icon: Ban, reaproveitavel: false },
].map((c) => ({ ...c, reaproveitavel: RESTOCK_CONDITIONS.includes(c.key as ReturnCondition) })) as CondMeta[];

export interface DestMeta { key: ReturnDestination; label: string; desc: string; icon: LucideIcon; tone: 'success' | 'info' | 'danger' }
export const DESTINOS: DestMeta[] = [
  { key: 'ESTOQUE', label: RETURN_DESTINATION_LABEL.ESTOQUE, desc: 'Retorna ao saldo disponível quando a condição for reaproveitável.', icon: PackageCheck, tone: 'success' },
  { key: 'HIGIENIZACAO', label: RETURN_DESTINATION_LABEL.HIGIENIZACAO, desc: 'Não retorna ao saldo agora — segue para higienização.', icon: Droplets, tone: 'info' },
  { key: 'MANUTENCAO', label: RETURN_DESTINATION_LABEL.MANUTENCAO, desc: 'Aguarda reparo — não retorna ao saldo.', icon: Wrench, tone: 'info' },
  { key: 'BAIXA', label: RETURN_DESTINATION_LABEL.BAIXA, desc: 'Retirada de circulação — não retorna ao estoque.', icon: ArchiveX, tone: 'danger' },
  { key: 'DESCARTE', label: RETURN_DESTINATION_LABEL.DESCARTE, desc: 'Será descartada — não retorna ao estoque.', icon: Trash2, tone: 'danger' },
];

export interface Combinacao { reentra: boolean; texto: string; tone: 'success' | 'warning' | 'info' }
export function resultadoCombinacao(condicao: ReturnCondition, destino: ReturnDestination): Combinacao {
  if (deveReestocar(destino, condicao)) return { reentra: true, texto: 'Este item retornará ao saldo da unidade.', tone: 'success' };
  if (destino === 'ESTOQUE') return { reentra: false, texto: 'Esta combinação não permite reentrada automática no estoque (condição não reaproveitável).', tone: 'warning' };
  return { reentra: false, texto: `O item será registrado como devolvido e encaminhado para ${RETURN_DESTINATION_LABEL[destino]}; não retorna ao saldo neste momento.`, tone: 'info' };
}
