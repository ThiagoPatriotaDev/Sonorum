import { authClient, userDb, dbError } from '../supabase/client.js';

export const safeUser = ({id,name,email,role,createdAt}) => ({id,name,email,role,createdAt});
export async function requireUser(req,res,next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({error:'Faça login para continuar.'});
  try {
    const token = match[1].trim();
    const {data:{user},error} = await authClient.auth.getUser(token);
    if (error || !user) return res.status(401).json({error:'Sessão inválida ou expirada. Entre novamente.'});
    const db = userDb(token);
    const [profile, role] = await Promise.all([
      db.from('profiles').select('id,display_name,created_at').eq('id',user.id).single(),
      db.from('user_roles').select('role').eq('user_id',user.id).single()
    ]);
    if (profile.error || role.error || !role.data || !profile.data) return dbError(res,profile.error || role.error,'Não foi possível carregar seu perfil.');
    req.db = db;
    req.user = safeUser({id:user.id,name:profile.data.display_name,email:user.email||'',role:role.data.role,createdAt:profile.data.created_at});
    next();
  } catch { return res.status(401).json({error:'Não foi possível validar a sessão.'}); }
}
export const requireRoles = (...roles) => (req,res,next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({error:'Sem permissão para esta operação.'});

export async function updateProfile(req,res){
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g,' ') : '';
  if(name.length<2 || name.length>90)return res.status(400).json({error:'Nome deve ter entre 2 e 90 caracteres.'});
  const {error} = await req.db.from('profiles').update({display_name:name}).eq('id',req.user.id);
  if(error)return dbError(res,error,'Não foi possível atualizar o perfil.');
  res.json({user:{...req.user,name}});
}
