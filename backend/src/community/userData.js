import { dbError } from '../supabase/client.js';
const shape = row=>({...row.score_data,id:row.id,updatedAtISO:row.updated_at,updatedAt:new Date(row.updated_at).toLocaleDateString('pt-BR')});
export async function listMyScores(req,res){
 const {data,error}=await req.db.from('sonorum_scores').select('id,score_data,updated_at').eq('user_id',req.user.id).order('updated_at',{ascending:false});
 if(error)return dbError(res,error);res.json({scores:data.map(shape)});
}
export async function saveMyScore(req,res){
 const input=req.body||{};
 if(!Array.isArray(input.notes)||input.notes.length>2000||JSON.stringify(input).length>90000)return res.status(400).json({error:'Partitura inválida ou muito grande.'});
 const {id,...payload}=input;
 const updatedAt=new Date().toISOString();let result;
 if(id){result=await req.db.from('sonorum_scores').update({title:String(input.title||'Sem título').slice(0,150),score_data:payload,updated_at:updatedAt}).eq('user_id',req.user.id).eq('id',id).select('id,score_data,updated_at').maybeSingle();
 if(!result.error&&!result.data)return res.status(404).json({error:'Partitura não encontrada nesta conta.'});}
 else {result=await req.db.from('sonorum_scores').insert({user_id:req.user.id,title:String(input.title||'Sem título').slice(0,150),score_data:payload}).select('id,score_data,updated_at').single();}
 if(result.error)return dbError(res,result.error);
 res.json({score:shape(result.data)});
}
export async function deleteMyScore(req,res){
 const {data,error}=await req.db.from('sonorum_scores').delete().eq('id',req.params.id).eq('user_id',req.user.id).select('id');
 if(error)return dbError(res,error);if(!data?.length)return res.status(404).json({error:'Partitura não encontrada.'});res.json({deleted:true});
}
export async function listMyProgress(req,res){
 const {data,error}=await req.db.from('sonorum_lesson_progress').select('lesson_id,completed').eq('user_id',req.user.id);
 if(error)return dbError(res,error);res.json({progress:Object.fromEntries(data.map(x=>[x.lesson_id,x.completed]))});
}
export async function setMyProgress(req,res){
 const lessonId=String(req.params.id||'');if(lessonId.length>130||!lessonId)return res.status(400).json({error:'Identificador de aula inválido.'});
 if(typeof req.body?.completed!=='boolean')return res.status(400).json({error:'Estado inválido.'});
 const {error}=await req.db.from('sonorum_lesson_progress').upsert({user_id:req.user.id,lesson_id:lessonId,completed:req.body.completed});
 if(error)return dbError(res,error);res.json({completed:req.body.completed});
}
