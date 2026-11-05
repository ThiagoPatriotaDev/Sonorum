import { apiRequest } from './communityApi.js';
const auth={auth:true};
export const InstitutionalApi={
  publicPages:()=>apiRequest('/course/pages').then(r=>r.pages),
  publicEvents:()=>apiRequest('/course/events').then(r=>r.events),
  publicGallery:()=>apiRequest('/course/gallery').then(r=>r.gallery),
  pages:()=>apiRequest('/admin/course/pages',auth),
  savePage:(section,data)=>apiRequest(`/admin/course/pages/${encodeURIComponent(section)}`,{...auth,method:'PUT',body:data}).then(r=>r.page),
  reviewPage:(section,data)=>apiRequest(`/admin/course/pages/${encodeURIComponent(section)}/review`,{...auth,method:'POST',body:data}),
  setPageStatus:(section,status)=>apiRequest(`/admin/course/pages/${encodeURIComponent(section)}/status`,{...auth,method:'PATCH',body:{status}}).then(r=>r.page),
  events:()=>apiRequest('/admin/course/events',auth),
  reviewEvent:(id,data)=>apiRequest(`/admin/course/events/${encodeURIComponent(id)}/review`,{...auth,method:'POST',body:data}),
  saveEvent:(data,id)=>apiRequest(id?`/admin/course/events/${encodeURIComponent(id)}`:'/admin/course/events',{...auth,method:id?'PUT':'POST',body:data}).then(r=>r.event),
  setEventStatus:(id,status)=>apiRequest(`/admin/course/events/${encodeURIComponent(id)}/status`,{...auth,method:'PATCH',body:{status}}).then(r=>r.event),
  gallery:()=>apiRequest('/admin/course/gallery',auth),
  saveGallery:(data,id)=>apiRequest(id?`/admin/course/gallery/${encodeURIComponent(id)}`:'/admin/course/gallery',{...auth,method:id?'PUT':'POST',body:data}).then(r=>r.item),
  reviewGallery:(id,data)=>apiRequest(`/admin/course/gallery/${encodeURIComponent(id)}/review`,{...auth,method:'POST',body:data}),
  setGalleryStatus:(id,status)=>apiRequest(`/admin/course/gallery/${encodeURIComponent(id)}/status`,{...auth,method:'PATCH',body:{status}}).then(r=>r.item)
};
