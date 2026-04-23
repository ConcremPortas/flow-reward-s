// Utilitários para lidar com datas no fuso horário de Brasília

/**
 * Parseia uma string YYYY-MM-DD sem shift de timezone.
 * new Date("2026-03-06") interpreta como UTC e vira 05/03 no Brasil.
 * Usar T12:00:00 garante que o meio-dia UTC nunca cruza a meia-noite local.
 */
export const parseDateSafe = (dateString: string): Date => {
  if (!dateString) return new Date();
  // Se já tem componente de hora, usa direto
  if (dateString.includes('T') || dateString.includes(' ')) {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date(dateString + 'T12:00:00');
};

/**
 * Formata uma data do banco para exibição usando date-fns sem perda de dia.
 * Substitui: format(new Date(dateString), pattern)
 */
export const formatDate = (dateString: string, pattern = 'dd/MM/yyyy'): string => {
  if (!dateString) return '';
  // Import dinâmico não funciona aqui — retorna string diretamente
  const d = parseDateSafe(dateString);
  const pad = (n: number) => String(n).padStart(2, '0');
  const map: Record<string, string> = {
    'dd/MM/yyyy': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    'MM/yyyy':    `${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    'dd/MM/yyyy HH:mm': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
  return map[pattern] ?? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/**
 * Converte uma data do input (YYYY-MM-DD) para o fuso horário de Brasília
 * e retorna no formato correto para o banco de dados
 */
export const formatDateToBrasilia = (dateString: string): string => {
  if (!dateString) return '';
  
  // Adiciona horário meio-dia no fuso de Brasília para evitar mudanças de data
  const dataLocal = new Date(dateString + 'T12:00:00-03:00');
  return dataLocal.toISOString().split('T')[0];
};

/**
 * Converte uma data do banco para exibição no formato brasileiro
 */
export const formatDateToBrazilian = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString + 'T12:00:00-03:00');
  return date.toLocaleDateString('pt-BR');
};

/**
 * Converte uma data do banco para o formato do input date (YYYY-MM-DD)
 */
export const formatDateToInput = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se já estiver no formato correto, retorna como está
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  const date = new Date(dateString + 'T12:00:00-03:00');
  return date.toISOString().split('T')[0];
};

/**
 * Obtém a data atual no fuso horário de Brasília no formato YYYY-MM-DD
 */
export const getCurrentDateBrasilia = (): string => {
  const now = new Date();
  const brasiliaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  return brasiliaTime.toISOString().split('T')[0];
};