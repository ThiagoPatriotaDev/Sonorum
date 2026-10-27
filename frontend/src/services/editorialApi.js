import {apiRequest} from './communityApi.js';
export const EditorialApi={
 published:()=>apiRequest('/news').then(r=>r.news),
 article:slug=>apiRequest(`/news/${encodeURIComponent(slug)}`).then(r=>r.news),
 adminNews:()=>apiRequest('/admin/news',{auth:true}).then(r=>r.news),
 save:(value,id)=>apiRequest(id?`/admin/news/${encodeURIComponent(id)}`:'/admin/news',{method:id?'PATCH':'POST',body:value,auth:true}).then(r=>r.news),
 users:()=>apiRequest('/admin/users',{auth:true}).then(r=>r.users),
 changeRole:(id,role)=>apiRequest(`/admin/users/${encodeURIComponent(id)}/role`,{method:'PATCH',body:{role},auth:true}).then(r=>r.user)
};
