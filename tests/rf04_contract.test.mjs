import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const sql=file('../querys_supa/10_RF04_conteudo_institucional.sql');
const api=file('../backend/src/course/routes.js');
const header=file('../frontend/src/components/Header.jsx');
const events=file('../frontend/src/pages/EventsPage.jsx');
const publicPage=file('../frontend/src/pages/PublicCoursePage.jsx');
const admin=file('../frontend/src/pages/InstitutionalConsole.jsx');
test('navegação separa comunidade e área do aluno',()=>{
 for(const v of ['Comunidade','Área do aluno','Reserva de salas','Acervo de instrumentos','Mural musical','Explorar aulas','Portfólio artístico'])assert.ok(header.includes(v),v);
});
test('conteúdo público apenas publicado via Supabase e sem exemplos fictícios',()=>{
 for(const v of ['course_pages','course_events','course_gallery'])assert.ok(sql.includes(v));
 assert.ok(api.includes(".eq('status','published')"));
 assert.ok(!events.includes('SAMPLE_EVENTS')&&!events.includes('OFFICIAL_EVENTS'));
 assert.ok(publicPage.includes('InstitutionalApi.publicPages()')&&publicPage.includes('InstitutionalApi.publicGallery()'));
});
test('autoriza apenas coordenação e administração para gestão institucional',()=>{
 assert.ok(api.includes("requireRoles('admin','coordinator')"));
 assert.ok(sql.includes("private.sonorum_has_role(array['admin','coordinator'])"));
 assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
});
test('revisão obrigatória para páginas, eventos e imagens',()=>{
 for(const t of ['course_page_reviews','course_event_reviews','course_gallery_reviews'])assert.ok(sql.includes(t));
 for(const t of ['sonorum_guard_course_page','sonorum_guard_course_event','sonorum_guard_course_gallery'])assert.ok(sql.includes(t));
 assert.ok(admin.includes('Registrar revisão')&&admin.includes('Registrar comprovação'));
});
test('rascunhos privados e sem exclusão destrutiva',()=>{
 assert.ok(sql.includes("status='published'"));
 assert.ok(!sql.includes('DROP TABLE'));
 assert.ok(sql.includes('Sem DELETE para os clientes'));
 assert.ok(!api.includes('.delete('));
});
