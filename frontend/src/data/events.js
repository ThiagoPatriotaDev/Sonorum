/** Categorias e apresentação da agenda institucional. Dados são carregados do Supabase. */
export const EVENT_CATEGORIES=[
 {id:'todos',label:'Todas as categorias'},
 {id:'apresentacao',label:'Apresentações'},
 {id:'oficina',label:'Oficinas'},
 {id:'projeto',label:'Projetos'},
 {id:'encontro',label:'Encontros'},
 {id:'outro',label:'Outras atividades'}
];
export const EVENT_LABELS=Object.fromEntries(EVENT_CATEGORIES.map(x=>[x.id,x.label]));
export const REFERENCE_TIMEZONE='America/Recife';
export function formatEventDate(value,options={}){
 const date=new Date(value);
 return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{timeZone:REFERENCE_TIMEZONE,...options}).format(date):'Data não informada';
}
