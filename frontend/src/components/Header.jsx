import React, { useEffect, useRef, useState } from 'react';

const LINKS = [
  { id: 'inicio', label: 'Início' },
  { id: 'ensino', label: 'Explorar aulas' },
  { id: 'comunidade', label: 'Comunidade' },
  { id: 'partituras', label: 'Partituras' }
];

export default function Header({ activeTab, onChangeTab, savedCount, user, onOpenAuth, onSignOut, onOpenAccount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const handleNavigate = (tab) => { onChangeTab(tab); setMenuOpen(false); setAccountOpen(false); };
  const goAccount = (section) => { onOpenAccount(section); setMenuOpen(false); setAccountOpen(false); };
  useEffect(() => {
    if (!accountOpen) return;
    const close = e => { if (e.type === 'keydown' && e.key === 'Escape') setAccountOpen(false); if (e.type === 'pointerdown' && !accountRef.current?.contains(e.target)) setAccountOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => {document.removeEventListener('pointerdown', close);document.removeEventListener('keydown', close);};
  }, [accountOpen]);
  return <header className="sonorum-header"><div className="header-container">
    <button className="brand" onClick={() => handleNavigate('inicio')} aria-label="Sonorum, voltar ao início"><span className="brand-icon" aria-hidden="true"><span>𝄞</span></span><span className="brand-lockup"><strong>sonorum<span className="brand-dot">.</span></strong><small>música em movimento</small></span></button>
    <button className="mobile-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✕' : '☰'}</button>
    <nav className={`nav-tabs ${menuOpen ? 'nav-open' : ''}`} aria-label="Navegação principal">{LINKS.map(link => <button key={link.id} className={`nav-tab ${activeTab === link.id ? 'active' : ''}`} onClick={() => handleNavigate(link.id)} aria-current={activeTab === link.id ? 'page' : undefined}>{link.label}{link.id === 'partituras' && savedCount > 0 && user && <span className="badge-count">{savedCount}</span>}</button>)}
      <div className="mobile-account-link">{user ? <><button className="nav-tab" onClick={() => goAccount('perfil')}>Meu perfil</button><button className="nav-tab" onClick={() => goAccount('configuracoes')}>Configurações</button><button className="nav-tab" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sair da conta</button></> : <button className="nav-tab" onClick={() => {setMenuOpen(false);onOpenAuth();}}>Entrar / cadastrar</button>}</div>
    </nav>
    <div className="nav-account">{user ? <div className="account-menu-wrap" ref={accountRef}>
      <button type="button" className="account-chip" onClick={()=>setAccountOpen(o=>!o)} aria-haspopup="menu" aria-expanded={accountOpen} aria-label="Abrir menu do perfil"><span className="avatar-mini">{user.name.charAt(0).toUpperCase()}</span><span className="account-name">{user.name.split(' ')[0]}</span><span className="account-chevron" aria-hidden="true">⌄</span></button>
      {accountOpen && <div className="account-dropdown" role="menu"><div className="account-dropdown-heading"><strong>{user.name}</strong><small>{user.email}</small></div><button role="menuitem" onClick={()=>goAccount('perfil')}>◉ <span>Meu perfil</span></button><button role="menuitem" onClick={()=>goAccount('configuracoes')}>⚙ <span>Configurações</span></button><button role="menuitem" className="account-dropdown-exit" onClick={()=>{setAccountOpen(false);onSignOut();}}>↪ <span>Sair da conta</span></button></div>}
    </div> : <button className="login-button" onClick={onOpenAuth}>Entrar <span>↗</span></button>}</div>
  </div></header>;
}
