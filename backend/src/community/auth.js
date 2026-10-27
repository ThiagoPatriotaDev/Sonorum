import crypto from 'node:crypto';
import { communityStore } from './store.js';

const SECRET = process.env.SONORUM_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex'));
if (!SECRET) throw new Error('Configure SONORUM_SESSION_SECRET no ambiente de produção.');
const sign = value => crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
export const safeUser = ({ id, name, email, role, createdAt, verified = false, demo = false }) => ({ id, name, email, role, createdAt, verified, demo });
const failures = new Map();
const STUDENT_DOMAIN = '@discente.ifpe.edu.br';
const STAFF_DOMAINS = ['@ifpe.edu.br','@belojardim.ifpe.edu.br'];
const isDemo = () => process.env.NODE_ENV !== 'production' && process.env.SONORUM_ENABLE_DEMO_ADMIN === '1';

export function bootstrapDevAdmin() {
  if (!isDemo()) return;
  const email = 'admin.demo@sonorum.local';
  if (communityStore.read().users.some(u => u.email === email)) return;
  const password = 'Sonorum#Demo2026!';
  const salt = crypto.randomBytes(16).toString('hex');
  const user = { id:crypto.randomUUID(), name:'Admin Demonstração', email, role:'admin', verified:true, demo:true,
    salt, passwordHash:crypto.scryptSync(password,salt,64).toString('hex'), createdAt:new Date().toISOString() };
  communityStore.write(s => {s.users.push(user);s.news.push({
    id:crypto.randomUUID(),slug:'demonstracao-redacao-sonorum',title:'DEMONSTRAÇÃO: conheça a redação do Sonorum',
    excerpt:'Matéria de teste para explorar o editor antes da primeira publicação oficial.',
    body:'Este conteúdo é apenas uma demonstração do painel editorial.\n\nAbra a matéria, edite os campos e utilize a prévia para verificar a aparência da publicação.\n\nQuando estiver satisfeito, salve como rascunho ou publique no ambiente local.',
    category:'Comunicados',coverUrl:'',featured:false,status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),publishedAt:null,authorId:user.id,authorName:user.name
  });});
  console.log('[Sonorum DEV] Conta demonstrativa criada. Utilize as credenciais do README_RF03_RF04.md. Nunca habilite esse modo em produção.');
}

export function issueToken(user) {
  const content = Buffer.from(JSON.stringify({ sub:user.id, exp:Date.now()+24*60*60*1000 })).toString('base64url');
  return `${content}.${sign(content)}`;
}

export function requireUser(req,res,next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i,'') || '';
  const parts = token.split('.');
  if (parts.length!==2 || !parts[0] || !parts[1]) return res.status(401).json({error:'Faça login para continuar.'});
  const expected = sign(parts[0]);
  if (parts[1].length!==expected.length || !crypto.timingSafeEqual(Buffer.from(parts[1]),Buffer.from(expected))) return res.status(401).json({error:'Sessão inválida.'});
  try {
    const data = JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
    if (!Number.isFinite(data.exp) || Date.now()>data.exp) throw Error('expired');
    const user = communityStore.read().users.find(u=>u.id===data.sub);
    if (!user || (user.demo && !isDemo())) throw Error('missing');
    req.user = safeUser(user); next();
  } catch { res.status(401).json({error:'Sessão expirada. Faça login novamente.'}); }
}
export const requireRoles = (...roles) => (req,res,next) => roles.includes(req.user?.role) ? next() : res.status(403).json({error:'Você não tem permissão para esta operação.'});

export function register(req,res) {
  const {name,email,password} = req.body || {};
  const cleanName = typeof name==='string' ? name.trim().replace(/\s+/g,' ') : '';
  const cleanEmail = typeof email==='string' ? email.trim().toLowerCase() : '';
  const cleanPass = typeof password==='string' ? password : '';
  if (cleanName.length<2 || cleanName.length>90 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanEmail) || cleanPass.length<10 || cleanPass.length>128) {
    return res.status(400).json({error:'Preencha nome, e-mail institucional e senha de 10 a 128 caracteres.'});
  }
  const isStudent = cleanEmail.endsWith(STUDENT_DOMAIN);
  const isStaff = STAFF_DOMAINS.some(d=>cleanEmail.endsWith(d));
  if (!isStudent && !isStaff) return res.status(400).json({error:'Use seu e-mail institucional do IFPE. Estudante: @discente.ifpe.edu.br. Servidores: endereço institucional autorizado.'});
  if (communityStore.read().users.some(u=>u.email===cleanEmail)) return res.status(409).json({error:'Este e-mail já está cadastrado.'});
  const salt = crypto.randomBytes(16).toString('hex');
  const user = {id:crypto.randomUUID(),name:cleanName,email:cleanEmail,
    role:isStudent?'student':'pending', verified:false,
    salt, passwordHash:crypto.scryptSync(cleanPass,salt,64).toString('hex'),createdAt:new Date().toISOString()};
  communityStore.write(s=>s.users.push(user));
  res.status(201).json({user:safeUser(user),token:issueToken(user),notice:isStudent ? 'Conta estudantil de demonstração: endereço ainda não verificado.' : 'Cadastro recebido. Um administrador deve aprovar o perfil de servidor.'});
}

export function login(req,res) {
  const email = typeof req.body?.email==='string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password==='string' ? req.body.password : '';
  const ip=String(req.ip||'local');
  const attempt=failures.get(ip)||{count:0,until:0};
  if (attempt.until>Date.now() && attempt.count>=10) return res.status(429).json({error:'Muitas tentativas. Tente novamente em 15 minutos.'});
  if (Date.now()>attempt.until) {attempt.count=0;attempt.until=Date.now()+15*60*1000;}
  const user=communityStore.read().users.find(u=>u.email===email);
  const expected=user?.passwordHash ? Buffer.from(user.passwordHash,'hex'):crypto.randomBytes(64);
  const computed=crypto.scryptSync(password,user?.salt||'fallback-salt',64);
  if (!user || (user.demo && !isDemo()) || !crypto.timingSafeEqual(computed,expected)) {
    attempt.count++; failures.set(ip,attempt); return res.status(401).json({error:'E-mail ou senha incorretos.'});
  }
  failures.delete(ip);
  res.json({user:safeUser(user),token:issueToken(user)});
}

export function updateProfile(req,res) {
  const name=typeof req.body?.name==='string'?req.body.name.trim().replace(/\s+/g,' '):'';
  if (name.length<2||name.length>90) return res.status(400).json({error:'O nome precisa ter entre 2 e 90 caracteres.'});
  communityStore.write(s=>{const u=s.users.find(x=>x.id===req.user.id);if(u)u.name=name;for(const v of s.videos)if(v.authorId===req.user.id)v.author=name;});
  const updated=communityStore.read().users.find(u=>u.id===req.user.id);
  res.json({user:safeUser(updated)});
}
