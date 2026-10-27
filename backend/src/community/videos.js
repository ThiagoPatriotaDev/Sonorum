import { publicDb, dbError } from '../supabase/client.js';
const instruments=['violao','violino','teclado','flauta','canto','baixo','saxofone','bateria'];
export function getYouTubeId(input) {
 try {const u=new URL(input);let id;
  if(['youtu.be','www.youtu.be'].includes(u.hostname)) id=u.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname))
   id=u.pathname==='/watch'?u.searchParams.get('v'):/^\/(shorts|embed|live)\//.test(u.pathname)?u.pathname.split('/')[2]:null;
  return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;
 } catch {return null;}
}
const shape=v=>({id:v.id,title:v.title,description:v.description,instrumentId:v.instrument_id,youtubeId:v.youtube_id,authorId:v.author_id,author:v.author_name,authorRole:v.author_role,createdAt:v.created_at});
export async function listVideos(req,res){
 let q=publicDb.from('sonorum_videos').select('*').order('created_at',{ascending:false}).limit(100);
 if(typeof req.query.instrument==='string' && instruments.includes(req.query.instrument)) q=q.eq('instrument_id',req.query.instrument);
 const {data,error}=await q;
 if(error)return dbError(res,error,'Não foi possível carregar as videoaulas.');
 res.json(data.map(shape));
}
export async function publishVideo(req,res){
 const {title,description,instrumentId,url}=req.body||{};
 const youtubeId=getYouTubeId(url),name=typeof title==='string'?title.trim():'',caption=typeof description==='string'?description.trim():'';
 if(name.length<5||name.length>120||caption.length>500||!instruments.includes(instrumentId)||!youtubeId)
  return res.status(400).json({error:'Preencha título, instrumento e link válido do YouTube.'});
 const {data,error}=await req.db.from('sonorum_videos').insert({title:name,description:caption,instrument_id:instrumentId,youtube_id:youtubeId,author_id:req.user.id,author_name:req.user.name,author_role:req.user.role}).select('*').single();
 if(error)return dbError(res,error,'Não foi possível publicar a videoaula.');
 res.status(201).json(shape(data));
}
export async function deleteVideo(req,res){
 const {data,error}=await req.db.from('sonorum_videos').delete().eq('id',req.params.id).select('id');
 if(error)return dbError(res,error,'Não foi possível excluir a publicação.');
 if(!data?.length)return res.status(404).json({error:'Publicação indisponível ou acesso não autorizado.'});
 res.json({deleted:true});
}
