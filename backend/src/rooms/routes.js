import { Router } from 'express';
import { requireUser, requireRoles } from '../community/auth.js';

const rooms = Router();
const operators = ['staff', 'coordinator', 'admin'];
const ROOM_FIELDS = 'id,code,name,capacity,location,equipment,active,created_at,updated_at';
const RES_FIELDS = 'id,room_id,student_id,starts_at,ends_at,purpose,status,processed_by,decision_note,created_at,updated_at,decided_at,closed_at,closed_by';
const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
const plain = value => typeof value==='string' ? value.trim() : '';
const iso = value => typeof value==='string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
const replyError = (res,error, fallback='Não foi possível concluir a operação.') => {
  if (process.env.NODE_ENV !== 'production') console.error('[Sonorum/Salas]',error?.code,error?.message);
  if(error?.code==='23P01')return res.status(409).json({error:'Esta sala já está reservada no horário selecionado. Escolha outro intervalo.'});
  if(error?.code==='23505')return res.status(409).json({error:'Já existe uma sala cadastrada com esse código.'});
  if(error?.code==='42501')return res.status(403).json({error:'Você não tem permissão para realizar esta operação.'});
  if(error?.code==='23514'||error?.code==='22023')return res.status(400).json({error:'Horário, justificativa ou mudança de estado inválida. Confira os dados e tente novamente.'});
  return res.status(500).json({error:fallback});
};
const cleanRoom = data => ({
 code:plain(data?.code).slice(0,25).toUpperCase(),
 name:plain(data?.name).slice(0,100),
 location:plain(data?.location).slice(0,150),
 equipment:plain(data?.equipment).slice(0,600),
 capacity:Number(data?.capacity),
 active: data?.active !== false
});

rooms.use(requireUser);
rooms.get('/rooms',async(req,res)=>{
 const {data,error}=await req.db.from('rooms').select(ROOM_FIELDS).order('code',{ascending:true});
 if(error)return replyError(res,error,'Não foi possível carregar as salas. Execute o SQL do RF02 no Supabase.');
 return res.json({rooms:data||[]});
});
rooms.post('/rooms',requireRoles(...operators),async(req,res)=>{
 const input=cleanRoom(req.body);
 if(input.code.length<2||input.name.length<3||!Number.isInteger(input.capacity)||input.capacity<1||input.capacity>200)
   return res.status(400).json({error:'Informe código, nome e capacidade entre 1 e 200.'});
 const {data,error}=await req.db.from('rooms').insert(input).select(ROOM_FIELDS).single();
 if(error)return replyError(res,error,'Não foi possível cadastrar a sala.');
 return res.status(201).json({room:data});
});
rooms.patch('/rooms/:id',requireRoles(...operators),async(req,res)=>{
 if(!uuid(req.params.id))return res.status(400).json({error:'Sala inválida.'});
 const input=cleanRoom(req.body);
 if(input.code.length<2||input.name.length<3||!Number.isInteger(input.capacity)||input.capacity<1||input.capacity>200)
   return res.status(400).json({error:'Informe código, nome e capacidade entre 1 e 200.'});
 const {data,error}=await req.db.from('rooms').update(input).eq('id',req.params.id).select(ROOM_FIELDS).single();
 if(error)return replyError(res,error,'Não foi possível editar a sala.');
 return res.json({room:data});
});
rooms.get('/rooms/occupancy',async(req,res)=>{
 const {room_id,from,to}=req.query;
 if(!uuid(room_id)||!iso(from)||!iso(to)||new Date(to)<=new Date(from)||Date.parse(to)-Date.parse(from)>62*864e5)
   return res.status(400).json({error:'Informe sala e intervalo de até 62 dias.'});
 const {data,error}=await req.db.rpc('sonorum_room_busy_slots',{p_room_id:room_id,p_from:from,p_to:to});
 if(error)return replyError(res,error,'Não foi possível consultar a ocupação.');
 return res.json({slots:data||[]});
});
rooms.get('/room-reservations',async(req,res)=>{
 let query=req.db.from('room_reservations').select(RES_FIELDS).order('starts_at',{ascending:false}).limit(400);
 if(req.query.status && ['pending','approved','rejected','cancelled','completed'].includes(req.query.status)) query=query.eq('status',req.query.status);
 if(req.query.room_id && uuid(req.query.room_id))query=query.eq('room_id',req.query.room_id);
 if(req.query.from && iso(req.query.from))query=query.gte('starts_at',req.query.from);
 if(req.query.to && iso(req.query.to))query=query.lte('starts_at',req.query.to);
 const {data,error}=await query;
 if(error)return replyError(res,error,'Não foi possível consultar o histórico de reservas.');
 if(operators.includes(req.user.role)){
   const roster=await req.db.rpc('sonorum_room_roster');
   if(roster.error)return replyError(res,roster.error,'Não foi possível carregar os solicitantes.');
   const names=new Map((roster.data||[]).map(p=>[p.student_id,p.display_name]));
   return res.json({reservations:(data||[]).map(r=>({...r,student_name:names.get(r.student_id)||'Estudante'}))});
 }
 return res.json({reservations:data||[]});
});
rooms.post('/room-reservations',requireRoles('student'),async(req,res)=>{
 const {room_id,starts_at,ends_at,purpose}=req.body||{};
 if(!uuid(room_id)||!iso(starts_at)||!iso(ends_at)||!plain(purpose)||plain(purpose).length<3||plain(purpose).length>500)
  return res.status(400).json({error:'Preencha sala, data/hora e finalidade (3 a 500 caracteres).'});
 const now=Date.now(),start=Date.parse(starts_at),end=Date.parse(ends_at),diff=end-start;
 if(start<now-60000||start>now+120*864e5||diff<30*60e3||diff>8*3600e3)
  return res.status(400).json({error:'Reserve um horário futuro, com duração entre 30 minutos e 8 horas, até 120 dias à frente.'});
 // The authenticated identity comes only from requireUser, never from req.body.
 const {data,error}=await req.db.from('room_reservations').insert({room_id,student_id:req.user.id,starts_at,ends_at,purpose:plain(purpose),status:'pending'}).select(RES_FIELDS).single();
 if(error)return replyError(res,error,'Não foi possível solicitar a sala.');
 return res.status(201).json({reservation:data});
});
rooms.patch('/room-reservations/:id/status',async(req,res)=>{
 if(!uuid(req.params.id))return res.status(400).json({error:'Reserva inválida.'});
 const status=req.body?.status;
 if(!['approved','rejected','cancelled','completed'].includes(status))return res.status(400).json({error:'Estado desconhecido.'});
 if(status!=='cancelled'&&!operators.includes(req.user.role))return res.status(403).json({error:'Apenas servidores autorizados podem decidir solicitações.'});
 const note=plain(req.body?.reason).slice(0,500);
 if((status==='rejected'||(status==='cancelled'&&operators.includes(req.user.role)))&&note.length<5)
   return res.status(400).json({error:'Informe uma justificativa com pelo menos 5 caracteres.'});
 const {data,error}=await req.db.from('room_reservations').update({status,decision_note:note||null})
   .eq('id',req.params.id).select(RES_FIELDS).single();
 if(error)return replyError(res,error,'Não foi possível atualizar a reserva.');
 return res.json({reservation:data});
});
export default rooms;
