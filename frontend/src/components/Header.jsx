import React, { useEffect, useRef, useState } from 'react';
import { PUBLIC_SECTIONS } from '../data/publicCourse.js';

const LINKS = [
  { id: 'ensino', label: 'Explorar aulas' },
  { id: 'partituras', label: 'Partituras' }
];

export default function Header({ activeTab, activePublicSection, onChangeTab, onOpenPublicSection, savedCount, user, onOpenAuth, onSignOut, onOpenAccount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [publicOpen, setPublicOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communityPreview, setCommunityPreview] = useState('videos');
  const [publicPreview, setPublicPreview] = useState('curso');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const publicRef = useRef(null);
  const publicToggleRef = useRef(null);
  const communityRef = useRef(null);
  const communityToggleRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const preview = PUBLIC_SECTIONS.find(s => s.id === publicPreview) || PUBLIC_SECTIONS[0];
  const communityEntries = [
    { id: 'videos', number: '01', label: 'Mural musical', short: 'Videoaulas e experiências compartilhadas', symbol: '♫', kicker: 'Vozes da comunidade', tab: 'comunidade' },
    { id: 'eventos', number: '02', label: 'Agenda de eventos', short: 'Apresentações, projetos e encontros', symbol: '♬', kicker: 'Programação do curso', tab: 'eventos' }
  ];
  const communityFeatured = communityEntries.find(item => item.id === communityPreview) || communityEntries[0];
  const closeMenus = () => { cancelHoverClose(); setPublicOpen(false); setCommunityOpen(false); setAccountOpen(false); };
  const handleNavigate = (tab) => { closeMenus(); onChangeTab(tab); setMenuOpen(false); };
  const goPublic = section => { closeMenus(); onOpenPublicSection(section); setMenuOpen(false); };
  const goAccount = section => { closeMenus(); onOpenAccount(section); setMenuOpen(false); };
  const canHover = () => window.innerWidth > 960 && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const cancelHoverClose = () => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };
  const hoverMenu = (menu) => {
    if (!canHover()) return;
    cancelHoverClose();
    setAccountOpen(false);
    setPublicOpen(menu === 'public');
    setCommunityOpen(menu === 'community');
  };
  const scheduleHoverClose = (menu) => {
    if (!canHover()) return;
    cancelHoverClose();
    // Crossing the narrow gap between trigger and panel never closes it instantly.
    hoverCloseTimerRef.current = window.setTimeout(() => {
      if (menu === 'public') setPublicOpen(false);
      if (menu === 'community') setCommunityOpen(false);
      hoverCloseTimerRef.current = null;
    }, 320);
  };
  useEffect(() => () => {
    if (hoverCloseTimerRef.current !== null) window.clearTimeout(hoverCloseTimerRef.current);
  }, []);
  useEffect(() => {
    if (!accountOpen && !publicOpen && !communityOpen) return;
    const close = event => {
      if (event.type === 'keydown' && event.key === 'Escape') {
        cancelHoverClose();
        if (communityOpen) communityToggleRef.current?.focus();
        else if (publicOpen) publicToggleRef.current?.focus();
        closeMenus(); return;
      }
      if (event.type === 'pointerdown') {
        if (accountOpen && !accountRef.current?.contains(event.target)) setAccountOpen(false);
        if (publicOpen && !publicRef.current?.contains(event.target)) { cancelHoverClose(); setPublicOpen(false); }
        if (communityOpen && !communityRef.current?.contains(event.target)) { cancelHoverClose(); setCommunityOpen(false); }
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [accountOpen, publicOpen, communityOpen]);

  return <header className="sonorum-header"><div className="header-container">
    <button className="brand" onClick={() => handleNavigate('inicio')} aria-label="Sonorum, voltar ao início"><span className="brand-icon" aria-hidden="true"><span>𝄞</span></span><span className="brand-lockup"><strong>sonorum<span className="brand-dot">.</span></strong><small>música em movimento</small></span></button>
    <button className="mobile-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="sonorum-primary-nav" onClick={() => { setMenuOpen(!menuOpen); closeMenus(); }}>{menuOpen ? '✕' : '☰'}</button>
    <nav id="sonorum-primary-nav" className={`nav-tabs ${menuOpen ? 'nav-open' : ''}`} aria-label="Navegação principal">
      <div className={`public-nav-group ${publicOpen ? 'is-open' : ''}`} ref={publicRef}
        onMouseEnter={() => hoverMenu('public')}
        onMouseLeave={() => scheduleHoverClose('public')}
        onFocusCapture={cancelHoverClose}
        onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { cancelHoverClose(); setPublicOpen(false); } }}>
        <div className="public-home-trigger">
          <button className={`nav-tab nav-tab-home ${['inicio', 'institucional'].includes(activeTab) ? 'active' : ''}`} onClick={()=>{cancelHoverClose();setAccountOpen(false);setCommunityOpen(false);setPublicOpen(true);}} aria-expanded={publicOpen} aria-controls="sonorum-public-menu" aria-current={activeTab==='inicio' ? 'page' : undefined} onFocus={() => hoverMenu('public')}>Início</button>
          <button ref={publicToggleRef} className="nav-discover-toggle" aria-label="Conhecer as seções do curso" aria-expanded={publicOpen} aria-controls="sonorum-public-menu" onClick={() => {cancelHoverClose();setAccountOpen(false);setCommunityOpen(false);setPublicOpen(o=>!o);}}><span className="nav-discover-icon" aria-hidden="true"><svg viewBox="0 0 28 28" focusable="false"><path d="M5.2 6h17.6c2.2 0 3.5 2.4 2.4 4.2L16.3 24c-1.1 1.7-3.5 1.7-4.6 0L2.8 10.2C1.7 8.4 3 6 5.2 6Z"/></svg></span></button>
        </div>
        {publicOpen && <div id="sonorum-public-menu" className="public-mega" role="region" aria-label="Explore o curso de Música" onMouseEnter={cancelHoverClose}>
          <div className="public-mega-intro"><span className="public-mega-eyebrow">SONORUM · O CURSO</span><h2>Explore o que move <em>a música.</em></h2><p>Descubra a formação, as pessoas e os espaços por trás de cada experiência musical.</p><button onClick={()=>handleNavigate('inicio')} className="public-mega-home-link">⌂ <span>Página inicial</span></button><button onClick={()=>goPublic('curso')} className="public-mega-main-cta">Conhecer o curso <span>↗</span></button><button onClick={()=>handleNavigate('noticias')} className="public-mega-home-link">✦ <span>Notícias do curso</span></button></div>
          <div className="public-mega-links" aria-label="Seções do curso">{PUBLIC_SECTIONS.map(section=><button key={section.id} className={`public-mega-link ${publicPreview===section.id ? 'is-previewed' : ''} ${activeTab==='institucional' && activePublicSection===section.id?'is-current':''}`} onPointerEnter={()=>setPublicPreview(section.id)} onFocus={()=>setPublicPreview(section.id)} onClick={()=>goPublic(section.id)}><span className="public-mega-num">{section.number}</span><span className="public-mega-link-copy"><strong>{section.label}</strong><small>{section.short}</small></span><span className="public-mega-link-arrow" aria-hidden="true">↗</span></button>)}</div>
          <div className="public-mega-preview" aria-hidden="true"><div className="public-preview-halo"/><span className="public-preview-index">{preview.number} / 04</span><span className="public-preview-symbol" key={preview.id}>{preview.symbol}</span><span className="public-preview-title">{preview.label}</span><span className="public-preview-subtitle">{preview.kicker}</span><svg viewBox="0 0 180 30" className="public-preview-wave" fill="none"><path d="M0 14C16 -2 26 26 42 13S72 0 88 14 118 28 132 13 158 0 180 14" stroke="#e3b28f" strokeWidth="1.2"/></svg></div>
        </div>}
      </div>
      {LINKS.filter(link => link.id === 'ensino').map(link => <button key={link.id} className={`nav-tab ${activeTab === link.id ? 'active' : ''}`} onClick={() => handleNavigate(link.id)} aria-current={activeTab === link.id ? 'page' : undefined}>{link.label}</button>)}
      <div className={`public-nav-group community-nav-group ${communityOpen ? 'is-open' : ''}`} ref={communityRef}
        onMouseEnter={() => hoverMenu('community')}
        onMouseLeave={() => scheduleHoverClose('community')}
        onFocusCapture={cancelHoverClose}
        onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { cancelHoverClose(); setCommunityOpen(false); } }}>
        <div className="public-home-trigger community-home-trigger">
          <button className={`nav-tab nav-tab-home ${['comunidade','eventos'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => handleNavigate('comunidade')}
            aria-current={activeTab === 'comunidade' ? 'page' : undefined}>Comunidade</button>
          <button ref={communityToggleRef} className="nav-discover-toggle" aria-label="Abrir seções da comunidade"
            aria-expanded={communityOpen} aria-controls="sonorum-community-menu"
            onClick={() => { cancelHoverClose(); setPublicOpen(false); setAccountOpen(false); setCommunityOpen(open => !open); }}>
            <span className="nav-discover-icon" aria-hidden="true"><svg viewBox="0 0 28 28" focusable="false"><path d="M5.2 6h17.6c2.2 0 3.5 2.4 2.4 4.2L16.3 24c-1.1 1.7-3.5 1.7-4.6 0L2.8 10.2C1.7 8.4 3 6 5.2 6Z"/></svg></span>
          </button>
        </div>
        {communityOpen && <div id="sonorum-community-menu" className="public-mega community-mega" role="region" aria-label="Descubra a comunidade"
          onMouseEnter={cancelHoverClose}>
          <div className="public-mega-intro">
            <span className="public-mega-eyebrow">SONORUM · EM COMUNIDADE</span>
            <h2>O som ganha vida <em>quando circula.</em></h2>
            <p>Aprenda com outras pessoas, encontre apresentações e descubra as atividades que movimentam o curso.</p>
            <button className="public-mega-main-cta" onClick={() => handleNavigate('eventos')}>Explorar a agenda <span>↗</span></button>
          </div>
          <div className="public-mega-links" aria-label="Áreas da comunidade">
            {communityEntries.map(item => <button key={item.id}
              className={`public-mega-link ${communityPreview === item.id ? 'is-previewed' : ''} ${activeTab === item.tab ? 'is-current' : ''}`}
              onPointerEnter={() => setCommunityPreview(item.id)} onFocus={() => setCommunityPreview(item.id)}
              onClick={() => handleNavigate(item.tab)}>
              <span className="public-mega-num">{item.number}</span>
              <span className="public-mega-link-copy"><strong>{item.label}</strong><small>{item.short}</small></span>
              <span className="public-mega-link-arrow" aria-hidden="true">↗</span>
            </button>)}
            <div className="community-future"><span className="public-mega-num">03</span><span><strong>Portfólio artístico</strong><small>Espaço reservado para a próxima etapa</small></span><span className="community-future-label">EM BREVE</span></div>
          </div>
          <div className="public-mega-preview" aria-hidden="true">
            <div className="public-preview-halo"/><span className="public-preview-index">SONORUM / COMUNIDADE</span>
            <span className="public-preview-symbol" key={communityFeatured.id}>{communityFeatured.symbol}</span>
            <span className="public-preview-title">{communityFeatured.label}</span>
            <span className="public-preview-subtitle">{communityFeatured.kicker}</span>
            <svg viewBox="0 0 180 30" className="public-preview-wave" fill="none"><path d="M0 14C16 -2 26 26 42 13S72 0 88 14 118 28 132 13 158 0 180 14" stroke="#e3b28f" strokeWidth="1.2"/></svg>
          </div>
        </div>}
      </div>
      {LINKS.filter(link => link.id === 'partituras').map(link => <button key={link.id} className={`nav-tab ${activeTab === link.id ? 'active' : ''}`} onClick={() => handleNavigate(link.id)} aria-current={activeTab === link.id ? 'page' : undefined}>{link.label}{savedCount > 0 && user && <span className="badge-count">{savedCount}</span>}</button>)}
      <div className="mobile-account-link">{user ? <><button className="nav-tab" onClick={() => goAccount('perfil')}>Meu perfil</button><button className="nav-tab" onClick={() => goAccount('configuracoes')}>Configurações</button>{['admin','coordinator','teacher'].includes(user.role)&&<button className="nav-tab" onClick={() => goAccount('admin')}>Painel editorial</button>}<button className="nav-tab" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sair da conta</button></> : <button className="nav-tab" onClick={() => {setMenuOpen(false);onOpenAuth();}}>Entrar / cadastrar</button>}</div>
    </nav>
    <div className="nav-account">{user ? <div className="account-menu-wrap" ref={accountRef}>
      <button type="button" className="account-chip" onClick={()=>{setPublicOpen(false);setCommunityOpen(false);setAccountOpen(o=>!o);}} aria-haspopup="menu" aria-expanded={accountOpen} aria-label="Abrir menu do perfil"><span className="avatar-mini">{user.name.charAt(0).toUpperCase()}</span><span className="account-name">{user.name.split(' ')[0]}</span><span className="account-chevron nav-discover-icon" aria-hidden="true"><svg viewBox="0 0 28 28" focusable="false"><path d="M5.2 6h17.6c2.2 0 3.5 2.4 2.4 4.2L16.3 24c-1.1 1.7-3.5 1.7-4.6 0L2.8 10.2C1.7 8.4 3 6 5.2 6Z"/></svg></span></button>
      {accountOpen && <div className="account-dropdown" role="menu"><div className="account-dropdown-heading"><strong>{user.name}</strong><small>{user.email}</small></div><button role="menuitem" onClick={()=>goAccount('perfil')}>◉ <span>Meu perfil</span></button><button role="menuitem" onClick={()=>goAccount('configuracoes')}>⚙ <span>Configurações</span></button>{['admin','coordinator','teacher'].includes(user.role)&&<button role="menuitem" onClick={()=>goAccount('admin')}>▤ <span>Painel editorial</span></button>}<button role="menuitem" className="account-dropdown-exit" onClick={()=>{setAccountOpen(false);onSignOut();}}>↪ <span>Sair da conta</span></button></div>}
    </div> : <button className="login-button" onClick={onOpenAuth}>Entrar <span>↗</span></button>}</div>
  </div></header>;
}
