import crypto from 'node:crypto';
import { communityStore } from './store.js';
import { safeUser } from './auth.js';
const CATEGORIES=['Curso','Eventos','Projetos','Conquistas','Comunicados'];
const canPublish=u=>['admin','coordinator'].includes(u.role);
const canWrite=u=>['admin','coordinator','teacher'].includes(u.role);
const publicShape = n => ({id:n.id,slug:n.slug,title:n.title,excerpt:n.excerpt,body:n.body,category:n.category,coverUrl:n.coverUrl,featured:n.featured,authorName:n.authorName,publishedAt:n.publishedAt,updatedAt:n.updatedAt});
const slugify=v=>(v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72)||'materia');
const sortNew=(a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt);
const validate=(input,existing=null)=>{
 const title=String(input.title??existing?.title??'').trim().replace(/\s+/g,' ');
 const excerpt=String(input.excerpt??existing?.excerpt??'').trim();
 const body=String(input.body??existing?.body??'').trim();
 const category=String(input.category??existing?.category??'Curso');
 const coverUrl=String(input.coverUrl??existing?.coverUrl??'').trim();
 const featured=typeof input.featured==='boolean'?input.featured:Boolean(existing?.featured);
 if(title.length<5||title.length>150||excerpt.length>300||body.length>30000||!CATEGORIES.includes(category))return {error:'Informe título (5–150), resumo (até 300) e categoria válida.'};
 if(coverUrl){try{const url=new URL(coverUrl);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||coverUrl.length>1500)return {error:'A capa deve ser uma URL HTTP(S) válida.'};}catch{return {error:'URL de capa inválida.'};}}
 return {value:{title,excerpt,body,category,coverUrl,featured}};
};
export function listPublished(req,res){
 const list=communityStore.read().news.filter(n=>n.status==='published').sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)).map(publicShape);
 res.json({news:list});
}
export function getPublished(req,res){const n=communityStore.read().news.find(x=>x.slug===req.params.slug&&x.status==='published');if(!n)return res.status(404).json({error:'Notícia não encontrada.'});res.json({news:publicShape(n)});}
export function listNews(req,res){
 if(!canWrite(req.user))return res.status(403).json({error:'Sem permissão de redação.'});
 const news=communityStore.read().news.filter(n=>canPublish(req.user)||n.authorId===req.user.id).sort(sortNew);
 res.json({news});
}
export function saveNews(req,res){
 if(!canWrite(req.user))return res.status(403).json({error:'Sem permissão de redação.'});
 const id=req.params.id;
 const existing=id?communityStore.read().news.find(n=>n.id===id):null;
 if(id&&!existing)return res.status(404).json({error:'Matéria não encontrada.'});
 if(existing&&!canPublish(req.user)&&(existing.authorId!==req.user.id||existing.status!=='draft'))return res.status(403).json({error:'Somente o autor pode alterar o próprio rascunho.'});
 const result=validate(req.body||{},existing);
 if(result.error)return res.status(400).json({error:result.error});
 const status=String(req.body?.status??existing?.status??'draft');
 if(!['draft','published','archived'].includes(status))return res.status(400).json({error:'Estado inválido.'});
 if(!canPublish(req.user)&&status!=='draft')return res.status(403).json({error:'Somente coordenação ou administração podem publicar.'});
 if(status==='published'&&(!result.value.excerpt||result.value.body.length<40))return res.status(400).json({error:'Para publicar, inclua resumo e corpo com pelo menos 40 caracteres.'});
 const now=new Date().toISOString();
 let news;
 communityStore.write(s=>{
  if(existing){news=existing;Object.assign(news,result.value,{status,updatedAt:now});if(status==='published'&&!news.publishedAt)news.publishedAt=now;if(status==='draft')news.publishedAt=null;}
  else {
    let slug=slugify(result.value.title);if(s.news.some(n=>n.slug===slug))slug=`${slug}-${crypto.randomBytes(3).toString('hex')}`;
    news={id:crypto.randomUUID(),slug,...result.value,status,createdAt:now,updatedAt:now,publishedAt:status==='published'?now:null,authorId:req.user.id,authorName:req.user.name};s.news.push(news);
  }
 });
 res.status(existing?200:201).json({news});
}
export function listUsers(req,res){res.json({users:communityStore.read().users.map(safeUser).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))});}
export function changeRole(req,res){
 const role=String(req.body?.role||'');
 if(!['pending','student','teacher','staff','coordinator'].includes(role))return res.status(400).json({error:'Perfil inválido ou protegido.'});
 const target=communityStore.read().users.find(u=>u.id===req.params.id);
 if(!target)return res.status(404).json({error:'Usuário não encontrado.'});
 if(target.id===req.user.id||target.role==='admin'||target.demo)return res.status(403).json({error:'Não é possível alterar o administrador por esta interface.'});
 if(role==='teacher'||role==='staff'||role==='coordinator'){
  const staff=/@(ifpe\.edu\.br|belojardim\.ifpe\.edu\.br)$/.test(target.email);
  if(!staff)return res.status(400).json({error:'Perfil institucional exige e-mail de servidor do IFPE.'});
 }
 communityStore.write(s=>{const u=s.users.find(x=>x.id===target.id);u.role=role;u.roleReviewedAt=new Date().toISOString();u.roleReviewedBy=req.user.id;});
 res.json({user:safeUser(target)});
}
