import React, { useState } from 'react';

const LINKS = [
  { id: 'inicio', label: 'Início' },
  { id: 'ensino', label: 'Explorar aulas' },
  { id: 'comunidade', label: 'Comunidade' },
  { id: 'partituras', label: 'Partituras' }
];

export default function Header({ activeTab, onChangeTab, savedCount, user, onOpenAuth, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleNavigate = (tab) => { onChangeTab(tab); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <header className="sonorum-header">
      <div className="header-container">
        <button className="brand" onClick={() => handleNavigate('inicio')} aria-label="Sonorum, voltar ao início">
          <span className="brand-icon" aria-hidden="true"><span>𝄞</span></span>
          <span className="brand-lockup"><strong>sonorum<span className="brand-dot">.</span></strong><small>música em movimento</small></span>
        </button>
        <button className="mobile-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✕' : '☰'}</button>
        <nav className={`nav-tabs ${menuOpen ? 'nav-open' : ''}`} aria-label="Navegação principal">
          {LINKS.map((link) => (
            <button key={link.id} className={`nav-tab ${activeTab === link.id ? 'active' : ''}`} onClick={() => handleNavigate(link.id)} aria-current={activeTab === link.id ? 'page' : undefined}>
              {link.label}{link.id === 'partituras' && savedCount > 0 && user && <span className="badge-count">{savedCount}</span>}
            </button>
          ))}
          <div className="mobile-account-link">
            {user ? <button className="nav-tab" onClick={onSignOut}>Sair da conta</button> : <button className="nav-tab" onClick={() => { setMenuOpen(false); onOpenAuth(); }}>Entrar / cadastrar</button>}
          </div>
        </nav>
        <div className="nav-account">
          {user ? (
            <div className="account-chip" title={`${user.name} · ${user.role === 'teacher' ? 'Professor' : 'Estudante'}`}>
              <span className="avatar-mini">{user.name.charAt(0).toUpperCase()}</span>
              <span className="account-name">{user.name.split(' ')[0]}</span>
              <button className="signout-button" onClick={onSignOut} title="Sair da conta" aria-label="Sair da conta">↗</button>
            </div>
          ) : <button className="login-button" onClick={onOpenAuth}>Entrar <span>↗</span></button>}
        </div>
      </div>
    </header>
  );
}
