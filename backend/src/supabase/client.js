import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !publishable) {
  throw Error('Configure backend/.env: SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY. Veja README_SUPABASE.md.');
}
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
// A mesma chave pública da API; o servidor NÃO necessita de service_role/secret.
export const authClient = createClient(url, publishable, options);
export const publicDb = createClient(url, publishable, options);
export const userDb = token => createClient(url, publishable, {
  ...options, global: { headers: { Authorization: `Bearer ${token}` } }
});
export const dbError = (res, error, fallback='Não foi possível concluir a operação.') => {
  if (process.env.NODE_ENV !== 'production') console.error('[Sonorum/Supabase]', error?.code, error?.message);
  return res.status(500).json({error:fallback});
};
