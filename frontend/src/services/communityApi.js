import {supabase,assertSupabase} from './supabaseClient.js';
const BASE='/api';
export async function currentAccessToken(){
 const client=assertSupabase();
 const {data:{session},error}=await client.auth.getSession();
 if(error)throw new Error('Não foi possível verificar a sessão.');
 return session?.access_token||'';
}
export async function apiRequest(path,{method='GET',body,auth=false}={}){
 const token=auth?await currentAccessToken():'';
 if(auth&&!token)throw Error('Faça login para continuar.');
 let response;
 try {response=await fetch(BASE+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});}
 catch {throw Error('Não foi possível conectar à API. Verifique o backend na porta 3333.');}
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(json.error||'Não foi possível concluir a operação.');
 return json;
}
function genericError(error){
 // Apenas em desenvolvimento: código e status ajudam a diagnosticar sem expor tokens ou senhas.
 if(import.meta.env.DEV){
  console.warn('[Sonorum/Auth] Supabase:', {code:error?.code||'não informado',status:error?.status||'não informado'});
  if(error?.code==='email_not_confirmed')return new Error('Conta com e-mail pendente no Supabase. Para testar sem confirmação, desative Confirm Email em Authentication > Sign In / Providers > Email e verifique a conta em Users.');
  if(error?.code==='email_provider_disabled')return new Error('O login por e-mail está desativado no Supabase. Ative o provedor Email.');
 }
 if(error?.code==='invalid_credentials')return new Error('E-mail ou senha incorretos.');
 if(error?.status===429)return new Error('Muitas tentativas. Tente novamente mais tarde.');
 return new Error('Não foi possível autenticar. Confira seus dados e tente novamente.');
}
export const CommunityApi={
 getToken:currentAccessToken,
 me:()=>apiRequest('/auth/me',{auth:true}),
 updateMe:data=>apiRequest('/auth/me',{method:'PATCH',body:data,auth:true}),
 login:async({email,password})=>{
  const {data,error}=await assertSupabase().auth.signInWithPassword({email:email.trim().toLowerCase(),password});
  if(error)throw genericError(error);
  if(!data.session)throw new Error('Sessão não iniciada. Verifique a configuração do Supabase.');
  return {user:(await apiRequest('/auth/me',{auth:true})).user};
 },
 register:async({name,email,password})=>{
  if(String(name||'').trim().length<2||String(password||'').length<10)throw Error('Preencha nome e senha com pelo menos 10 caracteres.');
  const {data,error}=await assertSupabase().auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{name:name.trim()}}});
  if(error)throw genericError(error);
  if(!data.session)throw Error('Cadastro iniciado, mas sem sessão. Para esta fase, desative Confirm Email no Supabase.');
  return {user:(await apiRequest('/auth/me',{auth:true})).user};
 },
 signOut:async()=>{const {error}=await assertSupabase().auth.signOut({scope:'global'});if(error)throw Error('Não foi possível finalizar a sessão.');},
 recover:async({email})=>{
  const {error}=await assertSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${window.location.origin}${window.location.pathname}#/redefinir-senha`});
  if(error && import.meta.env.DEV)console.warn('[Sonorum/Auth]',error.code);
  // Mensagem genérica para não revelar existência de contas.
  return {notice:'Se o endereço estiver cadastrado e o envio estiver configurado, você receberá instruções de recuperação.'};
 },
 changePassword:async({password})=>{
  if(String(password||'').length<10)throw Error('A nova senha deve ter pelo menos 10 caracteres.');
  const {error}=await assertSupabase().auth.updateUser({password});
  if(error)throw Error('Não foi possível atualizar a senha. Solicite um novo link e tente novamente.');
  return {notice:'Senha alterada com sucesso. Faça login novamente.'};
 },
 videos:(instrumentId='')=>apiRequest(`/videos${instrumentId?`?instrument=${encodeURIComponent(instrumentId)}`:''}`),
 publish:data=>apiRequest('/videos',{method:'POST',body:data,auth:true}),
 remove:id=>apiRequest(`/videos/${encodeURIComponent(id)}`,{method:'DELETE',auth:true}),
 getScores:()=>apiRequest('/my/scores',{auth:true}).then(r=>r.scores),
 saveScore:data=>apiRequest('/my/scores',{method:'POST',body:data,auth:true}).then(r=>r.score),
 deleteScore:id=>apiRequest(`/my/scores/${encodeURIComponent(id)}`,{method:'DELETE',auth:true}),
 getProgress:()=>apiRequest('/my/progress',{auth:true}).then(r=>r.progress),
 saveProgress:(id,completed)=>apiRequest(`/my/progress/${encodeURIComponent(id)}`,{method:'PUT',body:{completed},auth:true})
};
