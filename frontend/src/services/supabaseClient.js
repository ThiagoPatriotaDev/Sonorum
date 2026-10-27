import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key && !url.includes('SEU_PROJECT_REF') && !key.includes('COLE_SUA_KEY'));
export const supabase = configured ? createClient(url,key,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'sonorum-supabase-auth'}
}) : null;
export function assertSupabase(){
 if(!supabase)throw new Error('Supabase não configurado. Preencha frontend/.env e backend/.env e reinicie os servidores.');
 return supabase;
}
