/** RF02 • Fonte de dados para a agenda pública do Sonorum.
 * Insira somente informações CONFIRMADAS pela coordenação em OFFICIAL_EVENTS.
 * Futuramente, substitua esta camada pelo endpoint/Supabase mantendo o mesmo esquema.
 */
export const OFFICIAL_EVENTS = [];

export const EVENT_CATEGORIES = [
  { id: 'todos', label: 'Todos os formatos' },
  { id: 'apresentacao', label: 'Apresentações' },
  { id: 'projeto', label: 'Projetos' },
  { id: 'oficina', label: 'Oficinas' },
  { id: 'encontro', label: 'Encontros' }
];

// APENAS DEMONSTRAÇÃO: não são eventos do IFPE e nunca devem ser divulgados como oficiais.
export const SAMPLE_EVENTS = [
  { id:'demo-ensaio', category:'apresentacao', title:'Mostra de repertório instrumental', startAt:'2026-11-06T19:00:00-03:00', endAt:'2026-11-06T21:00:00-03:00', location:'Auditório (local ilustrativo)', description:'Apresentações de diferentes formações musicais em uma programação aberta aos visitantes. Exemplo de como o curso poderá divulgar seus concertos.', audience:'Comunidade acadêmica e visitantes', isDemo:true },
  { id:'demo-oficina', category:'oficina', title:'Oficina de prática em conjunto', startAt:'2026-11-13T14:00:00-03:00', endAt:'2026-11-13T16:00:00-03:00', location:'Sala de música (local ilustrativo)', description:'Atividade demonstrativa para divulgação de práticas coletivas e vivências de aprendizagem musical.', audience:'Estudantes e interessados', isDemo:true },
  { id:'demo-projeto', category:'projeto', title:'Encontro de projetos musicais', startAt:'2026-12-02T16:00:00-03:00', endAt:'2026-12-02T18:00:00-03:00', location:'Espaço cultural (local ilustrativo)', description:'Exemplo de evento para apresentar à comunidade as iniciativas e projetos desenvolvidos por estudantes e docentes.', audience:'Público geral', isDemo:true }
];

export const EVENT_LABELS = Object.fromEntries(EVENT_CATEGORIES.map(({id,label}) => [id,label]));
export const REFERENCE_TIMEZONE = 'America/Recife';
export function formatEventDate(value, options) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {timeZone:REFERENCE_TIMEZONE, ...options}).format(date);
}
export function eventIsValid(item) {
  return item && typeof item.id === 'string' && item.title?.trim() && item.location?.trim()
    && item.description?.trim() && EVENT_LABELS[item.category]
    && Number.isFinite(new Date(item.startAt).getTime());
}
