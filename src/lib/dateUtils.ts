// Utilitários para lidar com datas no fuso horário de Brasília

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