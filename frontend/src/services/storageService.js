// Somente sessão de visitante em memória. Nenhuma partitura/perfil/progresso persiste em arquivos locais.
// Dados de usuários autenticados são geridos pela API /api/my/* em Supabase com RLS.
let visitorScores=[];
let visitorProgress={};
export const StorageService={
 getScores:()=>[...visitorScores],
 saveScore:score=>{
   const now=new Date().toISOString();
   const updated={...score,id:score.id||crypto.randomUUID(),updatedAtISO:now,updatedAt:new Date(now).toLocaleDateString('pt-BR')};
   visitorScores=[updated,...visitorScores.filter(s=>s.id!==updated.id)];
   return updated;
 },
 deleteScore:id=>{visitorScores=visitorScores.filter(s=>s.id!==id);return [...visitorScores];},
 getProgress:()=>({...visitorProgress}),
 toggleLessonProgress:id=>{visitorProgress={...visitorProgress,[id]:!visitorProgress[id]};return {...visitorProgress};}
};
