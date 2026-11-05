import { Router } from 'express';
import { requireUser, requireRoles } from '../community/auth.js';

const api = Router();
const staffRoles = ['staff', 'coordinator', 'admin'];
const idValid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const clean = value => typeof value === 'string' ? value.trim() : '';
const dateValid = value => /^\d{4}-\d\d-\d\d$/.test(String(value || '')) && !Number.isNaN(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0,10)===value;
const ASSET_SELECT = 'id,asset_code,name,category,conservation,photo_url,location,description,status,created_at,updated_at';
const LOAN_SELECT = 'id,instrument_id,student_id,purpose,requested_until,status,due_at,reviewed_by,reviewed_at,decision_note,checked_out_at,checked_out_by,checkout_condition,checkout_note,returned_at,returned_by,return_condition,return_note,created_at,updated_at';
const conditions = ['excellent','good','fair','needs_repair'];
const states = ['available','maintenance','inactive'];
const isStaff = role => staffRoles.includes(role);

function dbFailure(res, error, context='Não foi possível concluir a operação.') {
  if (process.env.NODE_ENV !== 'production') console.error('[Sonorum/Acervo]',error?.code,error?.message);
  if (error?.code === '23505') return res.status(409).json({error:'Este patrimônio já está cadastrado ou possui empréstimo ativo. Não é possível emprestar o mesmo exemplar duas vezes.'});
  if (error?.code === '23514' || error?.code === '22007' || error?.code === '22008') return res.status(400).json({error:'Dados ou transição inválidos. Confira estado, prazo e inspeção do instrumento.'});
  if (error?.code === '42501') return res.status(403).json({error:'Você não tem permissão para realizar esta operação.'});
  if (error?.code === '23503') return res.status(400).json({error:'O instrumento informado não existe ou não pode ser utilizado.'});
  return res.status(500).json({error:context});
}
function assetInput(payload) {
  const photo = clean(payload?.photo_url);
  return {
    asset_code:clean(payload?.asset_code).toUpperCase().slice(0,45),
    name:clean(payload?.name).slice(0,120),
    category:clean(payload?.category).slice(0,75),
    conservation:clean(payload?.conservation) || 'good',
    photo_url:photo ? photo.slice(0,800) : null,
    location:clean(payload?.location).slice(0,140),
    description:clean(payload?.description).slice(0,700),
    status:clean(payload?.status) || 'available'
  };
}

api.use(requireUser);
api.get('/instrument-assets', async (req,res) => {
  const {data,error}=await req.db.from('instruments').select(ASSET_SELECT).order('name');
  if(error)return dbFailure(res,error,'Não foi possível carregar o acervo. Instale a query 08.');
  return res.json({instruments:data||[]});
});
api.get('/instrument-assets/availability',async(req,res)=>{
  const {data,error}=await req.db.rpc('sonorum_instrument_busy');
  if(error)return dbFailure(res,error,'Não foi possível consultar a disponibilidade patrimonial.');
  return res.json({busy_ids:(data||[]).map(row=>row.instrument_id)});
});
api.post('/instrument-assets',requireRoles(...staffRoles),async(req,res)=>{
  const input=assetInput(req.body);
  if(input.asset_code.length<3 || input.name.length<2 || input.category.length<2 || !conditions.includes(input.conservation) || !states.includes(input.status) || (input.photo_url && !/^https:\/\//.test(input.photo_url)))
    return res.status(400).json({error:'Informe patrimônio, nome, categoria, condição e situação válidos. Fotos devem usar HTTPS.'});
  const {data,error}=await req.db.from('instruments').insert(input).select(ASSET_SELECT).single();
  if(error)return dbFailure(res,error,'Não foi possível cadastrar o instrumento.');
  return res.status(201).json({instrument:data});
});
api.patch('/instrument-assets/:id',requireRoles(...staffRoles),async(req,res)=>{
  if(!idValid(req.params.id))return res.status(400).json({error:'Instrumento inválido.'});
  const input=assetInput(req.body);
  if(input.asset_code.length<3 || input.name.length<2 || input.category.length<2 || !conditions.includes(input.conservation) || !states.includes(input.status) || (input.photo_url && !/^https:\/\//.test(input.photo_url)))
    return res.status(400).json({error:'Confira os dados do patrimônio e o endereço da foto.'});
  const {data,error}=await req.db.from('instruments').update(input).eq('id',req.params.id).select(ASSET_SELECT).maybeSingle();
  if(error)return dbFailure(res,error,'Não foi possível alterar o patrimônio.');
  if(!data)return res.status(404).json({error:'Instrumento não encontrado.'});
  return res.json({instrument:data});
});
api.get('/instrument-loans',async(req,res)=>{
  const page=Math.min(10000,Math.max(0,Number.parseInt(req.query.page,10)||0));
  const pageSize=60;
  let query=req.db.from('instrument_loans').select(LOAN_SELECT,{count:'exact'}).order('created_at',{ascending:false}).range(page*pageSize,(page+1)*pageSize-1);
  if(req.query.status && ['pending','approved','checked_out','returned','rejected','cancelled'].includes(req.query.status))query=query.eq('status',req.query.status);
  if(req.query.instrument_id && idValid(req.query.instrument_id))query=query.eq('instrument_id',req.query.instrument_id);
  const {data,error,count}=await query;
  if(error)return dbFailure(res,error,'Não foi possível consultar os empréstimos. Instale a query 08.');
  const paging={page,has_more:(count||0) > (page*pageSize+(data||[]).length),total:count||0};
  if(!isStaff(req.user.role))return res.json({loans:data||[],...paging});
  const roster=await req.db.rpc('sonorum_instrument_roster');
  if(roster.error)return dbFailure(res,roster.error,'Não foi possível carregar os nomes da fila.');
  const names=new Map((roster.data||[]).map(record=>[record.student_id,record.display_name]));
  return res.json({loans:(data||[]).map(loan=>({...loan,student_name:names.get(loan.student_id)||'Estudante'})),...paging});
});
api.post('/instrument-loans',requireRoles('student'),async(req,res)=>{
  const {instrument_id,requested_until}=req.body||{};
  const purpose=clean(req.body?.purpose);
  if(!idValid(instrument_id)||purpose.length<5||purpose.length>500||!dateValid(requested_until))
    return res.status(400).json({error:'Escolha um instrumento, uma finalidade (5–500 caracteres) e a data pretendida para devolução.'});
  // Não confie em student_id e status recebidos do cliente.
  const {data,error}=await req.db.from('instrument_loans').insert({instrument_id,student_id:req.user.id,purpose,requested_until,status:'pending'}).select(LOAN_SELECT).single();
  if(error)return dbFailure(res,error,'Não foi possível solicitar o empréstimo.');
  return res.status(201).json({loan:data});
});
api.patch('/instrument-loans/:id/status',async(req,res)=>{
  if(!idValid(req.params.id))return res.status(400).json({error:'Empréstimo inválido.'});
  const status=clean(req.body?.status);
  if(!['approved','checked_out','returned','rejected','cancelled'].includes(status))
    return res.status(400).json({error:'Situação inválida.'});
  if(!isStaff(req.user.role) && status!=='cancelled')return res.status(403).json({error:'Operação restrita à equipe autorizada.'});
  const body={status};
  if(status==='approved'){
    const date=clean(req.body?.due_date);
    if(!dateValid(date))return res.status(400).json({error:'Informe o prazo de devolução.'});
    // Fim do dia no Recife. Timestamp sempre armazenado UTC no Postgres.
    body.due_at=new Date(Date.parse(`${date}T23:59:00-03:00`)).toISOString();
  }
  if(status==='rejected'||status==='cancelled'){
    body.decision_note=clean(req.body?.reason).slice(0,500);
    if((status==='rejected'||isStaff(req.user.role))&&body.decision_note.length<5)
      return res.status(400).json({error:'Informe uma justificativa com pelo menos cinco caracteres.'});
  }
  if(status==='checked_out'){
    body.checkout_condition=clean(req.body?.condition);
    body.checkout_note=clean(req.body?.note).slice(0,700);
    if(!conditions.includes(body.checkout_condition))return res.status(400).json({error:'Informe a condição verificada na retirada.'});
  }
  if(status==='returned'){
    body.return_condition=clean(req.body?.condition);
    body.return_note=clean(req.body?.note).slice(0,700);
    if(!conditions.includes(body.return_condition))return res.status(400).json({error:'Informe a condição verificada na devolução.'});
  }
  const {data,error}=await req.db.from('instrument_loans').update(body).eq('id',req.params.id).select(LOAN_SELECT).maybeSingle();
  if(error)return dbFailure(res,error,'Não foi possível registrar a mudança.');
  if(!data)return res.status(404).json({error:'Empréstimo não encontrado ou sem acesso.'});
  return res.json({loan:data});
});
export default api;
