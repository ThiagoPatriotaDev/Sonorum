import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const file = path.join(root, 'community.json');
let state = {users:[],videos:[],news:[]};
try {
 if(fs.existsSync(file)) {
  const parsed=JSON.parse(fs.readFileSync(file,'utf8'));
  state={users:Array.isArray(parsed.users)?parsed.users:[],videos:Array.isArray(parsed.videos)?parsed.videos:[],news:Array.isArray(parsed.news)?parsed.news:[]};
  // Prevent previously self-selected teacher roles from carrying privileged capabilities.
  for(const u of state.users) if(u.role==='teacher' && !u.verified) u.role='pending';
 }
} catch(e) {console.error('[Sonorum] Falha ao carregar dados locais:',e.message);}
export const communityStore={
 read(){return state;},
 write(modify){modify(state);fs.mkdirSync(root,{recursive:true}); const temp=`${file}.${process.pid}.tmp`;fs.writeFileSync(temp,JSON.stringify(state,null,2),{mode:0o600});fs.renameSync(temp,file);}
};
