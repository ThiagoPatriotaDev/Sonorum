import React,{useEffect,useRef,useState} from 'react';
import {PUBLIC_SECTIONS} from '../data/publicCourse.js';

const ICON=<span className="nav-discover-icon" aria-hidden="true"><svg viewBox="0 0 28 28" focusable="false"><path d="M5.2 6h17.6c2.2 0 3.5 2.4 2.4 4.2L16.3 24c-1.1 1.7-3.5 1.7-4.6 0L2.8 10.2C1.7 8.4 3 6 5.2 6Z"/></svg></span>;
const COMMUNITY=[
 {id:'eventos',number:'01',label:'Agenda de eventos',short:'Apresentações, projetos e encontros',symbol:'♬',kicker:'PROGRAMAÇÃO',tab:'eventos'},
 {id:'salas',number:'02',label:'Reserva de salas',short:'Salas, solicitações e calendário',symbol:'⌂',kicker:'ESPAÇOS DE ESTUDO',tab:'salas'},
 {id:'acervo',number:'03',label:'Acervo de instrumentos',short:'Patrimônio, empréstimos e devoluções',symbol:'𝄞',kicker:'ACERVO MUSICAL',tab:'acervo'}
];
const STUDENT=[
 {id:'ensino',number:'01',label:'Explorar aulas',short:'Trilhas práticas e fundamentos musicais',symbol:'♩',kicker:'APRENDIZAGEM',tab:'ensino'},
 {id:'mural',number:'02',label:'Mural musical',short:'Videoaulas e compartilhamentos',symbol:'♫',kicker:'PUBLICAÇÕES DA TURMA',tab:'comunidade'},
 {id:'partituras',number:'03',label:'Partituras',short:'Biblioteca e estúdio de edição',symbol:'♬',kicker:'CRIAÇÃO MUSICAL',tab:'partituras'}
];
export default function Header({activeTab,activePublicSection,onChangeTab,onOpenPublicSection,savedCount,user,onOpenAuth,onSignOut,onOpenAccount}){
 const [menuOpen,setMenuOpen]=useState(false),[opened,setOpened]=useState(null),[preview,setPreview]=useState({public:'curso',community:'eventos',student:'ensino'}),[accountOpen,setAccountOpen]=useState(false);
 const refs={public:useRef(null),community:useRef(null),student:useRef(null)};
 const toggleRefs={public:useRef(null),community:useRef(null),student:useRef(null)};
 const accountRef=useRef(null),timer=useRef(null);
 const canHover=()=>window.innerWidth>960&&window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
 const cancelClose=()=>{if(timer.current){window.clearTimeout(timer.current);timer.current=null;}};
 const closeAll=()=>{cancelClose();setOpened(null);setAccountOpen(false)};
 const navigate=tab=>{closeAll();setMenuOpen(false);onChangeTab(tab)};
 const publicNav=id=>{closeAll();setMenuOpen(false);onOpenPublicSection(id)};
 const account=id=>{closeAll();setMenuOpen(false);onOpenAccount(id)};
 const hover=id=>{if(canHover()){cancelClose();setOpened(id);setAccountOpen(false)}};
 const leave=id=>{if(canHover()){cancelClose();timer.current=window.setTimeout(()=>{setOpened(current=>current===id?null:current);timer.current=null},320)}};
 useEffect(()=>()=>cancelClose(),[]);
 useEffect(()=>{
  if(!opened&&!accountOpen)return;
  const handler=e=>{
   if(e.type==='keydown'&&e.key==='Escape'){if(opened)toggleRefs[opened].current?.focus();closeAll();return;}
   if(e.type==='pointerdown'){
    if(opened&&!refs[opened].current?.contains(e.target)){cancelClose();setOpened(null)}
    if(accountOpen&&!accountRef.current?.contains(e.target))setAccountOpen(false);
   }
  };
  document.addEventListener('pointerdown',handler);document.addEventListener('keydown',handler);
  return()=>{document.removeEventListener('pointerdown',handler);document.removeEventListener('keydown',handler)};
 },[opened,accountOpen]);
 const menus=[
  {id:'public',label:'Início',active:['inicio','institucional','noticias','noticia'].includes(activeTab),tab:'inicio',entries:PUBLIC_SECTIONS.map(s=>({...s,tab:'institucional'})),cta:'Conhecer o curso',kicker:'SONORUM · O CURSO',title:<>Explore o que move <em>a música.</em></>,desc:'Apresentação, formação, pessoas e espaços. Informações oficiais publicadas pela coordenação.'},
  {id:'community',label:'Comunidade',active:['eventos','salas','acervo'].includes(activeTab),tab:'eventos',entries:COMMUNITY,cta:'Consultar agenda',kicker:'SONORUM · EM COMUNIDADE',title:<>O som ocupa <em>novos espaços.</em></>,desc:'Acompanhe eventos, reserve salas e conheça o acervo patrimonial do curso.'},
  {id:'student',label:'Área do aluno',active:['ensino','comunidade','partituras'].includes(activeTab),tab:'ensino',entries:STUDENT,cta:'Explorar aulas',kicker:'SONORUM · SUA JORNADA',title:<>Seu próximo <em>acorde.</em></>,desc:'Aprenda, compartilhe suas experiências e crie suas próprias partituras.'}
 ];
 return <header className="sonorum-header"><div className="header-container"><button className="brand" onClick={()=>navigate('inicio')} aria-label="Sonorum, voltar ao início"><span className="brand-icon" aria-hidden="true"><span>𝄞</span></span><span className="brand-lockup"><strong>sonorum<span className="brand-dot">.</span></strong><small>música em movimento</small></span></button><button className="mobile-menu-button" aria-label={menuOpen?'Fechar menu':'Abrir menu'} aria-expanded={menuOpen} aria-controls="sonorum-primary-nav" onClick={()=>{setMenuOpen(m=>!m);closeAll()}}>{menuOpen?'✕':'☰'}</button>
 <nav id="sonorum-primary-nav" className={`nav-tabs ${menuOpen?'nav-open':''}`} aria-label="Navegação principal">{menus.map(m=>{
  const current=m.entries.find(e=>e.id===preview[m.id])||m.entries[0];
  return <div key={m.id} ref={refs[m.id]} className={`public-nav-group ${m.id==='community'?'community-nav-group':''} ${opened===m.id?'is-open':''}`} onMouseEnter={()=>hover(m.id)} onMouseLeave={()=>leave(m.id)} onFocusCapture={cancelClose} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget)){cancelClose();setOpened(o=>o===m.id?null:o)}}}>
   <div className="public-home-trigger community-home-trigger"><button className={`nav-tab nav-tab-home ${m.active?'active':''}`} onClick={()=>navigate(m.tab)} aria-current={activeTab===m.tab?'page':undefined}>{m.label}</button><button className="nav-discover-toggle" ref={toggleRefs[m.id]} aria-label={`Abrir seções de ${m.label}`} aria-expanded={opened===m.id} aria-controls={`sonorum-${m.id}-menu`} onClick={()=>{cancelClose();setAccountOpen(false);setOpened(o=>o===m.id?null:m.id)}}>{ICON}</button></div>
   {opened===m.id&&<div id={`sonorum-${m.id}-menu`} className={`public-mega ${m.id!=='public'?'community-mega':''}`} role="region" aria-label={`Explore ${m.label}`} onMouseEnter={cancelClose}>
    <div className="public-mega-intro"><span className="public-mega-eyebrow">{m.kicker}</span><h2>{m.title}</h2><p>{m.desc}</p><button className="public-mega-main-cta" onClick={()=>m.id==='public'?publicNav('curso'):navigate(m.tab)}>{m.cta} <span>↗</span></button>{m.id==='public'&&<button className="public-mega-home-link" onClick={()=>navigate('noticias')}>✦ Notícias do curso</button>}</div>
    <div className="public-mega-links" aria-label={`Seções de ${m.label}`}>{m.entries.map(e=><button key={e.id} className={`public-mega-link ${preview[m.id]===e.id?'is-previewed':''} ${(m.id==='public'&&activeTab==='institucional'&&activePublicSection===e.id||m.id!=='public'&&activeTab===e.tab)?'is-current':''}`} onPointerEnter={()=>setPreview(p=>({...p,[m.id]:e.id}))} onFocus={()=>setPreview(p=>({...p,[m.id]:e.id}))} onClick={()=>m.id==='public'?publicNav(e.id):navigate(e.tab)}><span className="public-mega-num">{e.number}</span><span className="public-mega-link-copy"><strong>{e.label}</strong><small>{e.short}</small></span><span className="public-mega-link-arrow" aria-hidden="true">↗</span></button>)}{m.id==='student'&&<div className="community-future"><span className="public-mega-num">04</span><span><strong>Portfólio artístico</strong><small>Em desenvolvimento · ainda não disponível</small></span><span className="community-future-label">EM BREVE</span></div>}</div>
    <div className="public-mega-preview" aria-hidden="true"><div className="public-preview-halo"/><span className="public-preview-index">{m.kicker}</span><span className="public-preview-symbol" key={current.id}>{current.symbol}</span><span className="public-preview-title">{current.label}</span><span className="public-preview-subtitle">{current.kicker}</span><svg viewBox="0 0 180 30" className="public-preview-wave" fill="none"><path d="M0 14C16 -2 26 26 42 13S72 0 88 14 118 28 132 13 158 0 180 14" stroke="#e3b28f" strokeWidth="1.2"/></svg></div>
   </div>}
  </div>
 })}
 <div className="mobile-account-link">{user?<><button className="nav-tab" onClick={()=>account('perfil')}>Meu perfil</button><button className="nav-tab" onClick={()=>account('configuracoes')}>Configurações</button>{['admin','coordinator','teacher'].includes(user.role)&&<button className="nav-tab" onClick={()=>account('admin')}>Painel editorial</button>}<button className="nav-tab" onClick={()=>{setMenuOpen(false);onSignOut()}}>Sair da conta</button></>:<button className="nav-tab" onClick={()=>{setMenuOpen(false);onOpenAuth()}}>Entrar / cadastrar</button>}</div></nav>
 <div className="nav-account">{user?<div className="account-menu-wrap" ref={accountRef}><button className="account-chip" type="button" onClick={()=>{setOpened(null);setAccountOpen(o=>!o)}} aria-haspopup="menu" aria-expanded={accountOpen} aria-label="Abrir menu do perfil"><span className="avatar-mini">{user.name.charAt(0).toUpperCase()}</span><span className="account-name">{user.name.split(' ')[0]}</span><span className="account-chevron nav-discover-icon" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M5.2 6h17.6c2.2 0 3.5 2.4 2.4 4.2L16.3 24c-1.1 1.7-3.5 1.7-4.6 0L2.8 10.2C1.7 8.4 3 6 5.2 6Z"/></svg></span></button>{accountOpen&&<div className="account-dropdown" role="menu"><div className="account-dropdown-heading"><strong>{user.name}</strong><small>{user.email}</small></div><button role="menuitem" onClick={()=>account('perfil')}>◉ Meu perfil</button><button role="menuitem" onClick={()=>account('configuracoes')}>⚙ Configurações</button>{['admin','coordinator','teacher'].includes(user.role)&&<button role="menuitem" onClick={()=>account('admin')}>▤ Painel editorial</button>}<button role="menuitem" className="account-dropdown-exit" onClick={()=>{closeAll();onSignOut()}}>↪ Sair da conta</button></div>}</div>:<button className="login-button" onClick={onOpenAuth}>Entrar <span>↗</span></button>}</div>
 </div></header>;
}
