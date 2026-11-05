/** Verificações estáticas de integração; NÃO são testes reais de Postgres/RLS concorrente. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path,base),'utf8');
const sql=read('querys_supa/08_RF10_RF12_acervo_emprestimos.sql');
const api=read('backend/src/instrumentLoans/routes.js');
const service=read('frontend/src/services/communityApi.js');
const nav=read('frontend/src/components/Header.jsx');
const app=read('frontend/src/App.jsx');

test('Índice único parcial protege APROVADO e RETIRADO por exemplar físico',()=>{
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS instrument_loans_one_active_per_asset[\s\S]+?ON public\.instrument_loans \(instrument_id\) WHERE status IN \('approved','checked_out'\)/);
});
test('RLS separa solicitação pessoal e acesso de equipe',()=>{
 assert.match(sql,/ALTER TABLE public\.instrument_loans ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/student_id=\(SELECT auth\.uid\(\)\)/);
 assert.match(sql,/private\.sonorum_has_role\(ARRAY\['staff','coordinator','admin'\]\)/);
 assert.match(sql,/REVOKE ALL ON public\.instruments, public\.instrument_loans FROM anon, authenticated/);
 assert.doesNotMatch(sql,/GRANT DELETE[\s\S]{0,100}instrument_loans/i);
});
test('Trânsito formal e inspeções guardados em trigger',()=>{
 for(const pattern of ["OLD.status='pending' AND NEW.status='approved'","OLD.status='approved' AND NEW.status='checked_out'","OLD.status='checked_out' AND NEW.status='returned'","OLD.status='pending' AND NEW.status='rejected'","OLD.status='pending' AND NEW.status='cancelled'"]){
  assert.ok(sql.includes(pattern),`Transição ausente: ${pattern}`);
 }
 assert.match(sql,/NEW\.checked_out_by:=actor/);
 assert.match(sql,/NEW\.returned_by:=actor/);
});
test('API utiliza req.user.id e trata conflito 23505 sem aceitar ID do navegador',()=>{
 assert.match(api,/student_id:req\.user\.id/);
 assert.match(api,/error\?\.code === '23505'/);
 assert.doesNotMatch(api,/req\.body\?\.student_id/);
 assert.doesNotMatch(api,/api\.delete\(/);
});
test('Métodos do serviço e rota do React existem',()=>{
 for(const method of ['getInstrumentAssets','getInstrumentBusy','getInstrumentLoans','createInstrumentAsset','updateInstrumentAsset','requestInstrumentLoan','changeInstrumentLoan'])assert.match(service,new RegExp(method+':'));
 for(const label of ['Acervo e empréstimos','Reserva de salas','Explorar aulas'])assert.ok(nav.includes(label));
 assert.match(app,/activeTab === 'acervo'/);
});
