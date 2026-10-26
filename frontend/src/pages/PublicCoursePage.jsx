import React, { useEffect } from 'react';
import { PUBLIC_CONTENT, PUBLIC_SECTIONS } from '../data/publicCourse.js';

function MusicalArt({ variant = 'hero' }) {
  const lines = Array.from({ length: 14 }, (_, i) => i);
  return <div className={`public-musical-art public-musical-art-${variant}`} aria-hidden="true">
    <div className="public-art-halo" />
    <div className="public-art-initial">S</div>
    <svg viewBox="0 0 480 350" preserveAspectRatio="xMidYMid meet" className="public-staves">
      {lines.map(i => <path key={i} d={`M -30 ${110 + i * 8} C 95 ${8 + i * 3}, 205 ${315 - i * 9}, 510 ${85 + i * 9}`} fill="none" stroke={i % 4 === 0 ? '#f6ca9e' : '#d1a4af'} strokeWidth={i % 3 === 0 ? '1.5' : '.8'} opacity={.40 + i * .023} />)}
    </svg>
    <span className="public-art-sound">♪</span>
  </div>;
}

function Pending({ title, description }) {
  return <div className="public-pending" role="note"><span className="public-pending-mark" aria-hidden="true">✳</span><div><strong>{title}</strong><p>{description}</p></div></div>;
}

function AboutCourse({ onNavigate, onSelectSection }) {
  return <div className="public-content-stack">
    <div className="public-two-col"><div>
      <span className="public-small-label">APRESENTAÇÃO</span>
      <h2>Conhecer o curso é o primeiro <em>acorde.</em></h2>
      <p className="public-lead">Este espaço reúne as informações públicas sobre o Curso de Música do IFPE Campus Belo Jardim. A proposta do Sonorum é aproximar estudantes, professores e comunidade em uma experiência clara e acessível.</p>
      <Pending title="Dados institucionais em validação" description="Modalidade, duração, formas de ingresso, matriz homologada e demais informações oficiais serão inseridas após confirmação com a coordenação." />
    </div><div className="public-study-notes"><span className="public-small-label">O QUE VOCÊ ENCONTRA NO PORTAL</span>{PUBLIC_CONTENT.courseFacts.map((fact, i) => <div className="public-study-row" key={fact.name}><span>0{i+1}</span><div><strong>{fact.name}</strong><p>{fact.detail}</p></div></div>)}</div></div>
    <div className="public-bottom-feature"><span className="public-small-label">SUA PRÓXIMA DESCOBERTA</span><h3>Explore uma nova forma de <em>aprender música.</em></h3><div><button className="public-action-button" onClick={() => onNavigate('ensino')}>Explorar aulas <span>↗</span></button><button className="public-link-button" onClick={() => onSelectSection('matriz')}>Conhecer a matriz <span>→</span></button></div></div>
  </div>;
}

function Curriculum({ onSelectSection }) {
  const curricula = PUBLIC_CONTENT.curriculum;
  return <div className="public-content-stack">
    <div className="public-section-head"><div><span className="public-small-label">COMPONENTES & ORGANIZAÇÃO</span><h2>Uma formação que se <em>constrói.</em></h2></div><p>A matriz curricular oficial será apresentada por período, componente e carga horária. Abaixo estão apenas áreas musicais ilustrativas, não disciplinas oficiais.</p></div>
    {curricula.length ? <div className="public-curriculum-periods">{curricula.map((period, i) => <section key={i} className="public-period"><h3>{period.period}</h3><div className="public-period-list">{period.disciplines.map((discipline, n) => <div key={n}><strong>{discipline.name}</strong><span>{discipline.hours} h</span></div>)}</div></section>)}</div> : <Pending title="Matriz curricular oficial ainda não cadastrada" description="Para publicar dados reais, preencha PUBLIC_CONTENT.curriculum com os componentes, períodos e respectivas cargas horárias aprovados pelo curso." />}
    <div className="public-axes"><div className="public-axes-heading"><span className="public-small-label">CAMPOS DE EXPLORAÇÃO · ILUSTRATIVOS</span><span>Um mapa conceitual da aprendizagem musical</span></div><div className="public-axes-grid">{PUBLIC_CONTENT.illustrativeAxes.map((axis, i) => <div className="public-axis" key={axis.label}><span className="public-axis-index">0{i+1}</span><span className="public-axis-wave" aria-hidden="true">〰</span><strong>{axis.label}</strong><p>{axis.detail}</p></div>)}</div></div>
    <button className="public-inline-link" onClick={()=>onSelectSection('docentes')}>Conheça as pessoas por trás da formação <span>↗</span></button>
  </div>;
}

function Faculty({ onSelectSection }) {
  const faculty = PUBLIC_CONTENT.faculty;
  return <div className="public-content-stack"><div className="public-two-col"><div><span className="public-small-label">CORPO DOCENTE</span><h2>Um encontro entre <em>experiências.</em></h2><p className="public-lead">Aqui serão apresentados os docentes vinculados ao curso, com formação, áreas de atuação e informações institucionais confirmadas.</p><Pending title="Listagem de docentes aguardando validação" description="O documento de requisitos prevê a exibição do corpo docente, mas não fornece nomes, titulações ou fotografias autorizadas." /></div><div className="public-faculty-art"><div className="public-faculty-ring public-faculty-ring-one"/><div className="public-faculty-ring public-faculty-ring-two"/><span>𝄞</span><small>A MÚSICA É UMA CONSTRUÇÃO COLETIVA</small></div></div>
    {faculty.length ? <div className="public-faculty-grid">{faculty.map(person => <article key={person.id} className="public-faculty-person">{person.image && <img src={person.image} alt=""/>}<h3>{person.name}</h3><p>{person.qualification}</p><small>{person.teachingAreas}</small></article>)}</div> : <div className="public-profile-fields"><strong>O que cada perfil vai apresentar</strong>{['Nome e foto autorizada', 'Formação acadêmica', 'Áreas de atuação', 'Contato institucional'].map((field, i) => <div key={field}><span>0{i+1}</span>{field}</div>)}</div>}
    <button className="public-inline-link" onClick={()=>onSelectSection('infraestrutura')}>Conheça os espaços e recursos <span>↗</span></button>
  </div>;
}

function Infrastructure({ onNavigate }) {
  const spaces = PUBLIC_CONTENT.spaces;
  return <div className="public-content-stack"><div className="public-section-head"><div><span className="public-small-label">CAMPUS & EXPERIÊNCIA</span><h2>Um lugar para <em>experimentar.</em></h2></div><p>Salas de estudo e acervo de instrumentos são recursos centrais no planejamento do portal. A descrição oficial de cada espaço dependerá do levantamento físico da instituição.</p></div>
    <div className="public-infra-grid"><div className="public-infra-art"><span className="public-plan-label">PLANTA CONCEITUAL · NÃO REPRESENTA O CAMPUS</span><svg viewBox="0 0 520 340" fill="none" aria-hidden="true"><rect x="38" y="42" width="444" height="255" stroke="#dfc2ab" strokeWidth="2"/><path d="M38 116 H482 M190 42 V297 M330 116 V297 M190 200 H482 M330 42 V116" stroke="#c59990" strokeWidth="2"/><path d="M86 116V133M180 190H190M320 200H330M330 252V270" stroke="#2d2130" strokeWidth="6"/><circle cx="120" cy="77" r="22" stroke="#f4c89c"/><circle cx="382" cy="156" r="28" stroke="#f4c89c"/><path d="M62 225Q110 175 154 225T245 225" stroke="#efb78a" strokeWidth="3"/><text x="67" y="167" fill="#eed1bf" fontSize="11" letterSpacing="3">ESTUDO</text><text x="367" y="260" fill="#eed1bf" fontSize="11" letterSpacing="3">ACERVO</text></svg><span className="public-plan-foot">Espaços ilustrados para orientar o futuro catálogo.</span></div><div className="public-spaces-list">{(spaces.length ? spaces.map((s,i)=>({...s,number:String(i+1).padStart(2,'0'),title:s.name,detail:s.description})) : PUBLIC_CONTENT.plannedSpaceTypes).map(space => <div className="public-space-row" key={space.number}><span>{space.number}</span><div><strong>{space.title}</strong><p>{space.detail}</p></div><span aria-hidden="true">↗</span></div>)}</div></div>
    <Pending title="Inventário e galeria pendentes de confirmação" description="Fotos, localização, capacidade e equipamentos disponíveis serão exibidos após o curso autorizar e fornecer os dados." />
    <div className="public-bottom-feature"><span className="public-small-label">PRÓXIMA ETAPA DO SONORUM</span><h3>Da descoberta à <em>prática.</em></h3><button className="public-action-button" onClick={()=>onNavigate('ensino')}>Explorar instrumentos <span>↗</span></button></div>
  </div>;
}

export default function PublicCoursePage({ activeSection = 'curso', onSelectSection, onNavigate }) {
  const section = PUBLIC_SECTIONS.find(s => s.id === activeSection) || PUBLIC_SECTIONS[0];
  useEffect(() => { document.title = `${section.label} | Sonorum · IFPE Belo Jardim`; return () => { document.title = 'Sonorum'; }; }, [section]);
  return <div className="public-page" id="public-top">
    <section className="public-hero"><div className="public-hero-main"><div className="public-breadcrumb"><button onClick={()=>onNavigate('inicio')}>Início</button><span>/</span><span>{section.label}</span></div><div className="public-kicker"><span className="public-kicker-dot"/> {section.kicker} <span className="public-kicker-counter">{section.number} / 04</span></div><h1 key={section.id}>{section.title}</h1><p>{section.short}</p><span className="public-institution">{PUBLIC_CONTENT.institution}</span></div><MusicalArt/></section>
    <div className="public-tab-bar" aria-label="Seções sobre o curso">{PUBLIC_SECTIONS.map(s => <button key={s.id} onClick={()=>onSelectSection(s.id)} className={`public-section-tab ${activeSection === s.id ? 'is-selected' : ''}`} aria-current={activeSection === s.id ? 'page' : undefined}><span>{s.number}</span> {s.label} <span className="public-tab-arrow" aria-hidden="true">↗</span></button>)}</div>
    <div className="public-page-body" key={section.id}>
      {section.id === 'curso' && <AboutCourse onNavigate={onNavigate} onSelectSection={onSelectSection}/>}
      {section.id === 'matriz' && <Curriculum onSelectSection={onSelectSection}/>}
      {section.id === 'docentes' && <Faculty onSelectSection={onSelectSection}/>}
      {section.id === 'infraestrutura' && <Infrastructure onNavigate={onNavigate}/>}
    </div>
    <footer className="public-footer"><span>sonorum<span>.</span></span><p>Curso de Música · IFPE Campus Belo Jardim</p><button onClick={()=>onNavigate('inicio')}>Voltar ao início ↑</button></footer>
  </div>;
}
