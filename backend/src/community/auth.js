import crypto from 'node:crypto';
import { communityStore } from './store.js';

const SECRET = process.env.SONORUM_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
const safeUser = ({ id, name, email, role }) => ({ id, name, email, role });
const authFailures = new Map();

export function issueToken(user) {
  const content = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  return `${content}.${sign(content)}`;
}

export function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return res.status(401).json({ error: 'Faça login para continuar.' });
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (Date.now() > data.exp) throw new Error('expired');
    const user = communityStore.read().users.find((item) => item.id === data.sub);
    if (!user) throw new Error('missing');
    req.user = safeUser(user);
    next();
  } catch { res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' }); }
}

export function register(req, res) {
  const { name, email, password, role } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (cleanName.length < 2 || cleanName.length > 90 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || typeof password !== 'string' || password.length < 8 || password.length > 128 || !['student', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'Informe nome, e-mail válido, perfil e senha de pelo menos 8 caracteres.' });
  }
  if (communityStore.read().users.some((user) => user.email === cleanEmail)) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  const salt = crypto.randomBytes(16).toString('hex');
  const user = { id: crypto.randomUUID(), name: cleanName, email: cleanEmail, role, salt, passwordHash: crypto.scryptSync(password, salt, 64).toString('hex'), createdAt: new Date().toISOString() };
  communityStore.write((state) => state.users.push(user));
  res.status(201).json({ user: safeUser(user), token: issueToken(user) });
}

export function login(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const key = String(req.ip || 'unknown');
  const attempt = authFailures.get(key) || { count: 0, until: 0 };
  if (attempt.until > Date.now() && attempt.count >= 10) return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
  if (Date.now() > attempt.until) { attempt.count = 0; attempt.until = Date.now() + 15 * 60 * 1000; }
  const user = communityStore.read().users.find((item) => item.email === email);
  const expected = user?.passwordHash ? Buffer.from(user.passwordHash, 'hex') : crypto.randomBytes(64);
  const computed = crypto.scryptSync(password, user?.salt || 'demo-salt', 64);
  if (!user || !crypto.timingSafeEqual(computed, expected)) {
    attempt.count++;
    authFailures.set(key, attempt);
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  authFailures.delete(key);
  res.json({ user: safeUser(user), token: issueToken(user) });
}

export function updateProfile(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g,' ') : '';
  if (name.length < 2 || name.length > 90) return res.status(400).json({ error: 'O nome precisa ter entre 2 e 90 caracteres.' });
  communityStore.write(state => {
    const user = state.users.find(item => item.id === req.user.id);
    if (user) user.name = name;
    for (const video of state.videos) {
      if (video.authorId === req.user.id) video.author = name;
    }
  });
  const updated = communityStore.read().users.find(item=>item.id === req.user.id);
  if (!updated) return res.status(404).json({ error: 'Conta não encontrada.' });
  res.json({ user: safeUser(updated) });
}
