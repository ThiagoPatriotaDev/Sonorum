import { Router } from 'express';
import { requireUser, requireRoles } from '../community/auth.js';
import { publicDb, dbError } from '../supabase/client.js';

const router=Router();
const authorized=[requireUser,requireRoles('admin','coordinator')];
const sections=['curso','matriz','docentes','infraestrutura'];
const categories=['apresentacao','oficina','projeto','encontro','outro'];
const normalize=s=>String(s??'').trim();
const txt=(v,max=4000)=>normalize(v).slice(0,max);
const own=(req,res)=>res.status(403).json({error:'Somente a coordenação ou administração pode publicar conteúdo institucional.'});
const fail=(res,error,fallback='Não foi possível concluir esta operação.')=>{
  if(error?.code==='23514'||error?.code==='23505'||error?.code==='23503'||error?.code==='22P02')return res.status(400).json({error:'Revise os dados, a validação editorial e as autorizações antes de continuar.'});
  return dbError(res,error,fallback);
};
const validId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'');
const url=(input)=>{try{const u=new URL(input);return u.protocol==='https:'&&!u.username&&!u.password&&String(input).length<=1600;}catch{return false;}};
function shapeItems(items){
  if(!Array.isArray(items)||items.length>80)return null;
  const clean=items.map(i=>({group:txt(i?.group,90),title:txt(i?.title,150),meta:txt(i?.meta,120),description:txt(i?.description,1200)}));
  return clean.every(i=>i.title.length>=2)?clean:null;
}
function readEvent(body){
  const data={title:txt(body.title,161),category:txt(body.category,40),description:txt(body.description,6000),location:txt(body.location,200),audience:txt(body.audience,200),start_at:body.startAt,end_at:body.endAt||null};
  if(data.title.length<4||data.title.length>160||!categories.includes(data.category)||!data.start_at||Number.isNaN(Date.parse(data.start_at))||data.end_at&&Number.isNaN(Date.parse(data.end_at))||data.end_at&&Date.parse(data.end_at)<=Date.parse(data.start_at))return null;
  return data;
}
function readGallery(body){
  const data={title:txt(body.title,151),description:txt(body.description,1200),image_url:txt(body.imageUrl,1700),alt_text:txt(body.altText,301),category:txt(body.category,50)||'curso'};
  if(data.title.length<3||data.title.length>150||!url(data.image_url)||data.alt_text.length<8||data.alt_text.length>300)return null;
  return data;
}

// Público: a query filtra status, e RLS impede que drafts vazem mesmo em erro da API.
router.get('/course/pages',async(req,res)=>{
  const {data,error}=await publicDb.from('course_pages').select('section,title,summary,body,items,updated_at').eq('status','published');
  if(error)return dbError(res,error,'Não foi possível consultar as páginas institucionais.');
  res.json({pages:data});
});
router.get('/course/events',async(req,res)=>{
  const {data,error}=await publicDb.from('course_events').select('id,title,category,description,location,audience,start_at,end_at').eq('status','published').order('start_at',{ascending:true}).limit(200);
  if(error)return dbError(res,error,'Não foi possível consultar a agenda.');
  res.json({events:data});
});
router.get('/course/gallery',async(req,res)=>{
  const {data,error}=await publicDb.from('course_gallery').select('id,title,description,image_url,alt_text,category').eq('status','published').order('published_at',{ascending:false}).limit(90);
  if(error)return dbError(res,error,'Não foi possível consultar a galeria.');
  res.json({gallery:data});
});

router.get('/admin/course/pages',...authorized,async(req,res)=>{
 const [pages,reviews]=await Promise.all([req.db.from('course_pages').select('*').order('section'),req.db.from('course_page_reviews').select('section,revision,evidence_reference,lawful_basis,verified_at')]);
 if(pages.error||reviews.error)return fail(res,pages.error||reviews.error);
 res.json({pages:pages.data,reviews:reviews.data});
});
router.put('/admin/course/pages/:section',...authorized,async(req,res)=>{
 if(!sections.includes(req.params.section))return res.status(404).json({error:'Seção não encontrada.'});
 const items=shapeItems(req.body?.items);
 if(!items)return res.status(400).json({error:'Confira os itens da seção. Cada item precisa de título.'});
 const payload={section:req.params.section,title:txt(req.body?.title,150),summary:txt(req.body?.summary,450),body:txt(req.body?.body,15000),items};
 if(!payload.title)return res.status(400).json({error:'Informe o título da seção.'});
 // Não aceitamos status, revisão, autor, validação ou user_id do navegador.
 const existing=await req.db.from('course_pages').select('section,status').eq('section',req.params.section).maybeSingle();
 if(existing.error)return fail(res,existing.error);
 let result;
 if(existing.data)result=await req.db.from('course_pages').update(payload).eq('section',req.params.section).select('*').single();
 else result=await req.db.from('course_pages').insert(payload).select('*').single();
 if(result.error)return fail(res,result.error);
 res.json({page:result.data});
});
router.post('/admin/course/pages/:section/review',...authorized,async(req,res)=>{
 if(!sections.includes(req.params.section))return res.status(404).json({error:'Seção não encontrada.'});
 const reference=txt(req.body?.evidenceReference,500);
 const basis=txt(req.body?.lawfulBasis,500);
 if(reference.length<8||req.params.section==='docentes'&&basis.length<8)return res.status(400).json({error:'Registre a fonte revisada; para docentes, informe também a base adequada para publicar dados pessoais.'});
 const {data:page,error:pageError}=await req.db.from('course_pages').select('revision,title,body,items').eq('section',req.params.section).maybeSingle();
 if(pageError)return fail(res,pageError);
 if(!page)return res.status(404).json({error:'Salve a página como rascunho antes de validá-la.'});
 if(page.body.length<25)return res.status(400).json({error:'Complete o conteúdo antes de registrar a validação.'});
 if(req.params.section!=='curso'&&!page.items?.length)return res.status(400).json({error:'Cadastre os componentes, docentes ou ambientes reais antes de validar esta seção.'});
 const {error}=await req.db.from('course_page_reviews').upsert({section:req.params.section,revision:page.revision,evidence_reference:reference,lawful_basis:basis||null,verified_by:req.user.id,verified_at:new Date().toISOString()},{onConflict:'section'});
 if(error)return fail(res,error);
 res.json({ok:true,revision:page.revision});
});
router.patch('/admin/course/pages/:section/status',...authorized,async(req,res)=>{
 if(!sections.includes(req.params.section)||!['draft','published'].includes(req.body?.status))return res.status(400).json({error:'Seção ou estado inválido.'});
 const {data,error}=await req.db.from('course_pages').update({status:req.body.status}).eq('section',req.params.section).select('*').maybeSingle();
 if(error)return fail(res,error);
 if(!data)return res.status(404).json({error:'Salve primeiro um rascunho desta seção.'});
 res.json({page:data});
});
router.get('/admin/course/events',...authorized,async(req,res)=>{
 const [events,reviews]=await Promise.all([req.db.from('course_events').select('*').order('start_at',{ascending:true}).limit(300),req.db.from('course_event_reviews').select('event_id,revision,evidence_reference,verified_at')]);
 if(events.error||reviews.error)return fail(res,events.error||reviews.error);
 res.json({events:events.data,reviews:reviews.data});
});
router.post('/admin/course/events',...authorized,async(req,res)=>{
 const value=readEvent(req.body||{});
 if(!value)return res.status(400).json({error:'Informe título, categoria e datas válidas do evento.'});
 const {data,error}=await req.db.from('course_events').insert({...value,status:'draft'}).select('*').single();
 if(error)return fail(res,error);
 res.status(201).json({event:data});
});
router.put('/admin/course/events/:id',...authorized,async(req,res)=>{
 if(!validId(req.params.id))return res.status(400).json({error:'Evento inválido.'});
 const value=readEvent(req.body||{});
 if(!value)return res.status(400).json({error:'Revise os dados do evento.'});
 // Toda edição de informações em item publicado volta para rascunho.
 const {data,error}=await req.db.from('course_events').update({...value,status:'draft'}).eq('id',req.params.id).select('*').maybeSingle();
 if(error)return fail(res,error);
 if(!data)return res.status(404).json({error:'Evento não encontrado.'});
 res.json({event:data});
});
router.post('/admin/course/events/:id/review',...authorized,async(req,res)=>{
 if(!validId(req.params.id))return res.status(400).json({error:'Evento inválido.'});
 const reference=txt(req.body?.evidenceReference,500);
 if(reference.length<8)return res.status(400).json({error:'Informe a referência do documento ou confirmação da coordenação.'});
 const {data:event,error:eventError}=await req.db.from('course_events').select('id,revision,title,description,location').eq('id',req.params.id).maybeSingle();
 if(eventError)return fail(res,eventError);
 if(!event)return res.status(404).json({error:'Evento não encontrado.'});
 if(event.description.length<20||event.location.length<3)return res.status(400).json({error:'Complete os dados da programação antes de validar.'});
 const {error}=await req.db.from('course_event_reviews').upsert({event_id:event.id,revision:event.revision,evidence_reference:reference,verified_by:req.user.id,verified_at:new Date().toISOString()},{onConflict:'event_id'});
 if(error)return fail(res,error);
 res.json({ok:true,revision:event.revision});
});
router.patch('/admin/course/events/:id/status',...authorized,async(req,res)=>{
 if(!validId(req.params.id)||!['draft','published'].includes(req.body?.status))return res.status(400).json({error:'Evento ou estado inválido.'});
 const {data,error}=await req.db.from('course_events').update({status:req.body.status}).eq('id',req.params.id).select('*').maybeSingle();
 if(error)return fail(res,error);
 if(!data)return res.status(404).json({error:'Evento não encontrado.'});
 res.json({event:data});
});
router.get('/admin/course/gallery',...authorized,async(req,res)=>{
 const [gallery,reviews]=await Promise.all([req.db.from('course_gallery').select('*').order('created_at',{ascending:false}).limit(250),req.db.from('course_gallery_reviews').select('gallery_id,revision,legal_basis,evidence_reference,verified_at')]);
 if(gallery.error||reviews.error)return fail(res,gallery.error||reviews.error);
 res.json({gallery:gallery.data,reviews:reviews.data});
});
router.post('/admin/course/gallery',...authorized,async(req,res)=>{
 const value=readGallery(req.body||{});
 if(!value)return res.status(400).json({error:'Informe título, imagem HTTPS e texto alternativo válido.'});
 const {data,error}=await req.db.from('course_gallery').insert({...value,status:'draft'}).select('*').single();
 if(error)return fail(res,error);
 res.status(201).json({item:data});
});
router.put('/admin/course/gallery/:id',...authorized,async(req,res)=>{
 if(!validId(req.params.id))return res.status(400).json({error:'Imagem inválida.'});
 const value=readGallery(req.body||{});
 if(!value)return res.status(400).json({error:'Revise os dados da imagem.'});
 const {data,error}=await req.db.from('course_gallery').update(value).eq('id',req.params.id).select('*').maybeSingle();
 if(error)return fail(res,error);
 if(!data)return res.status(404).json({error:'Imagem não encontrada.'});
 res.json({item:data});
});
router.post('/admin/course/gallery/:id/review',...authorized,async(req,res)=>{
 if(!validId(req.params.id))return res.status(400).json({error:'Imagem inválida.'});
 const basis=req.body?.legalBasis;
 const reference=txt(req.body?.evidenceReference,500);
 if(!['consentimento','outra_hipotese_documentada'].includes(basis)||reference.length<8)return res.status(400).json({error:'Informe a hipótese adequada e a referência da comprovação antes de publicar.'});
 const {data:item,error:itemError}=await req.db.from('course_gallery').select('id,revision').eq('id',req.params.id).maybeSingle();
 if(itemError)return fail(res,itemError);
 if(!item)return res.status(404).json({error:'Imagem não encontrada.'});
 const {error}=await req.db.from('course_gallery_reviews').upsert({gallery_id:item.id,revision:item.revision,legal_basis:basis,evidence_reference:reference,verified_by:req.user.id,verified_at:new Date().toISOString()},{onConflict:'gallery_id'});
 if(error)return fail(res,error);
 res.json({ok:true,revision:item.revision});
});
router.patch('/admin/course/gallery/:id/status',...authorized,async(req,res)=>{
 if(!validId(req.params.id)||!['draft','published'].includes(req.body?.status))return res.status(400).json({error:'Imagem ou estado inválido.'});
 const {data,error}=await req.db.from('course_gallery').update({status:req.body.status}).eq('id',req.params.id).select('*').maybeSingle();
 if(error)return fail(res,error);
 if(!data)return res.status(404).json({error:'Imagem não encontrada.'});
 res.json({item:data});
});
export default router;
