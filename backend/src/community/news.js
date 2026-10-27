import crypto from 'node:crypto';
import { publicDb, dbError } from '../supabase/client.js';
const CATEGORIES=['Curso','Eventos','Projetos','Conquistas','Comunicados'];
const canWrite=u=>['admin','coordinator','teacher'].includes(u.role);
const canPublish=u=>['admin','coordinator'].includes(u.role);
const shape=n=>({id:n.id,slug:n.slug,title:n.title,excerpt:n.excerpt,body:n.body,category:n.category,coverUrl:n.cover_url,featured:n.featured,status:n.status,authorId:n.author_id,authorName:n.author_name,createdAt:n.created_at,updatedAt:n.updated_at,publishedAt:n.published_at});
const slugify=v=>(v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'materia');
const validate=(v,old)=>{
 const title=String(v.title??old?.title??'').trim().replace(/\s+/g,' ');
 const excerpt=String(v.excerpt??old?.excerpt??'').trim();
 const body=String(v.body??old?.body??'').trim();
 const category=String(v.category??old?.category??'Curso');
 const coverUrl=String(v.coverUrl??old?.coverUrl??'').trim();
 const featured=typeof v.featured==='boolean'?v.featured:Boolean(old?.featured);
 if(title.length<5||title.length>150||excerpt.length>300||body.length>30000||!CATEGORIES.includes(category))return null;
 if(coverUrl){try{const u=new URL(coverUrl);if(u.protocol!=='https:'||u.username||u.password||coverUrl.length>1500)return null;}catch{return null;}}
 return {title,excerpt,body,category,cover_url:coverUrl,featured};
};
export async function listPublished(req,res){
 const {data,error}=await publicDb.from('sonorum_news').select('*').eq('status','published').order('published_at',{ascending:false}).limit(80);
 if(error)return dbError(res,error,'Não foi possível carregar as notícias.');
 res.json({news:data.map(shape)});
}
export async function getPublished(req,res){
 const {data,error}=await publicDb.from('sonorum_news').select('*').eq('slug',req.params.slug).eq('status','published').maybeSingle();
 if(error)return dbError(res,error);
 if(!data)return res.status(404).json({error:'Notícia não encontrada.'});
 res.json({news:shape(data)});
}
export async function listNews(req,res){
 if(!canWrite(req.user))return res.status(403).json({error:'Sem acesso à redação.'});
 let query=req.db.from('sonorum_news').select('*').order('updated_at',{ascending:false}).limit(200);
 if(req.user.role==='teacher')query=query.eq('author_id',req.user.id).eq('status','draft');
 const {data,error}=await query;
 if(error)return dbError(res,error);
 res.json({news:data.map(shape)});
}
export async function saveNews(req,res){
 if(!canWrite(req.user))return res.status(403).json({error:'Sem acesso à redação.'});
 const id=req.params.id;let old=null;
 if(id){const result=await req.db.from('sonorum_news').select('*').eq('id',id).maybeSingle();if(result.error)return dbError(res,result.error);if(!result.data)return res.status(404).json({error:'Matéria não encontrada.'});old=shape(result.data);}
 const value=validate(req.body||{},old);if(!value)return res.status(400).json({error:'Dados de notícia inválidos. Confira título, resumo e URL da capa (HTTPS).'});
 const status=String(req.body?.status??old?.status??'draft');
 if(!['draft','published','archived'].includes(status))return res.status(400).json({error:'Estado da matéria inválido.'});
 if(!canPublish(req.user)&&status!=='draft')return res.status(403).json({error:'Somente a coordenação publica matérias.'});
 if(status==='published'&&(!value.excerpt||value.body.length<40))return res.status(400).json({error:'Preencha resumo e corpo da notícia para publicar.'});
 const now=new Date().toISOString();
 const payload={...value,status,updated_at:now,published_at:status==='published'?(old?.publishedAt||now):null};
 let response;
 if(id){response=await req.db.from('sonorum_news').update(payload).eq('id',id).select('*').single();}
 else {payload.author_id=req.user.id;payload.author_name=req.user.name;payload.slug=`${slugify(value.title)}-${crypto.randomUUID().slice(0,8)}`;
 response=await req.db.from('sonorum_news').insert(payload).select('*').single();}
 if(response.error){if(response.error.code==='PGRST116')return res.status(403).json({error:'Sem permissão para editar esta notícia.'});return dbError(res,response.error);}
 res.status(id?200:201).json({news:shape(response.data)});
}
export async function listUsers(req,res){
 const [profiles,roles]=await Promise.all([req.db.from('profiles').select('id,display_name,created_at').order('created_at',{ascending:false}).limit(200),req.db.from('user_roles').select('user_id,role')]);
 if(profiles.error||roles.error)return dbError(res,profiles.error||roles.error);
 const byRole=Object.fromEntries(roles.data.map(r=>[r.user_id,r.role]));
 // Não retornamos e-mail de terceiros: coluna não consta em profiles e Auth não é exposto no navegador.
 res.json({users:profiles.data.map(p=>({id:p.id,name:p.display_name,email:'',role:byRole[p.id]||'student',createdAt:p.created_at}))});
}
export async function changeRole(req,res){
 const role=String(req.body?.role||'');
 if(!['student','teacher','staff','coordinator'].includes(role))return res.status(400).json({error:'Perfil inválido.'});
 if(req.params.id===req.user.id)return res.status(403).json({error:'Não é permitido alterar seu próprio perfil.'});
 // Validação institucional HUMANA: o domínio de e-mail não é prova de vínculo.
 const {data,error}=await req.db.from('user_roles').update({role,assigned_at:new Date().toISOString()}).eq('user_id',req.params.id).select('*');
 if(error)return dbError(res,error,'Não foi possível alterar a permissão.');
 if(!data?.length)return res.status(403).json({error:'A operação requer administrador e validação institucional.'});
 const {data:profile}=await req.db.from('profiles').select('display_name,created_at').eq('id',req.params.id).maybeSingle();
 res.json({user:{id:req.params.id,name:profile?.display_name||'',email:'',role,createdAt:profile?.created_at}});
}
