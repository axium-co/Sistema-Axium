/**
 * Utility functions for WhatsApp integration
 */

export interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
  active: boolean;
  order: number;
}

export const COMPANY_NAME = 'Ventura Luz e Efeitos';

export const DEFAULT_TEMPLATES: Omit<WhatsAppTemplate, 'id'>[] = [
  {
    name: 'Saudação',
    message: 'Olá {nome}! Tudo bem? Aqui é {responsavel} da {empresa}. Gostaria de conversar sobre o seu evento. Pode falar agora?',
    active: true,
    order: 0,
  },
  {
    name: 'Envio de proposta',
    message: 'Olá {nome}! Preparei uma proposta para o evento *{evento}* no dia {data_evento}. O investimento total é de *{valor}*. Posso te enviar os detalhes completos?',
    active: true,
    order: 1,
  },
  {
    name: 'Acompanhamento',
    message: 'Oi {nome}, tudo bem? Estou passando para saber se você teve a oportunidade de analisar nossa proposta para o {evento}. Ficou com alguma dúvida?',
    active: true,
    order: 2,
  },
];

export const VARIABLES_LIST = [
  { key: 'nome', label: 'Nome do cliente', example: 'João Silva' },
  { key: 'evento', label: 'Nome do evento', example: 'Casamento' },
  { key: 'data_evento', label: 'Data do evento', example: '15/12/2026' },
  { key: 'valor', label: 'Valor total', example: 'R$ 5.000,00' },
  { key: 'responsavel', label: 'Nome do responsável', example: 'Maria' },
  { key: 'empresa', label: 'Nome da empresa', example: COMPANY_NAME },
] as const;

export function replaceTemplateVariables(
  message: string,
  variables: Record<string, string>
): string {
  let result = message;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
  }
  return result;
}

/**
 * Cleans a phone number by removing parentheses, spaces, hyphens and other non-numeric characters
 * Ensures the number starts with the country code (55 for Brazil)
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  let cleaned = phone.replace(/\D/g, '');
  
  cleaned = cleaned.replace(/^0+/, '');
  
  if (cleaned.length > 0 && !cleaned.startsWith('55')) {
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generates a WhatsApp link (wa.me) for a given phone number
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '';
  
  let url = `https://wa.me/${cleaned}`;
  
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  return url;
}

export const WHATSAPP_MESSAGE_TEMPLATES = [
  {
    id: 'greeting',
    label: 'Saudação',
    template: (leadName: string, userName: string) => 
      `Olá ${leadName}! Tudo bem? Aqui é o ${userName} da Axium. Como posso ajudar?`,
  },
  {
    id: 'followup',
    label: 'Acompanhamento',
    template: (leadName: string, userName: string) => 
      `${leadName}, tudo bem? Estou passando para saber se você já conseguiu resolver aquela questão. Atenciosamente, ${userName}.`,
  },
  {
    id: 'proposal',
    label: 'Enviar Proposta',
    template: (leadName: string, userName: string) => 
      `${leadName}, preparei uma proposta especial para você! Podemos conversar sobre ela agora? ${userName}.`,
  },
];
