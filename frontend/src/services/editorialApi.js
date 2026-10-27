import { CommunityApi } from './communityApi.js';
async function call(path,{method='GET',body,auth=false}={}){
 let response;
 try{response=await fetch(`/api${path}`,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:`Bearer ${CommunityApi.getToken()}`}:{})},...(body?{body:JSON.stringify(body)}:{})});}
 catch{throw Error('Servidor offline. Execute o backend na porta 3333.');}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'Não foi possível concluir a solicitação.');
 return data;
}
export const EditorialApi={
 published:()=>call('/news').then(r=>r.news),
 article:slug=>call(`/news/${encodeURIComponent(slug)}`).then(r=>r.news),
 adminNews:()=>call('/admin/news',{auth:true}).then(r=>r.news),
 save:(value,id)=>call(id?`/admin/news/${encodeURIComponent(id)}`:'/admin/news',{method:id?'PATCH':'POST',body:value,auth:true}).then(r=>r.news),
 users:()=>call('/admin/users',{auth:true}).then(r=>r.users),
 changeRole:(id,role)=>call(`/admin/users/${encodeURIComponent(id)}/role`,{method:'PATCH',body:{role},auth:true}).then(r=>r.user)
};
