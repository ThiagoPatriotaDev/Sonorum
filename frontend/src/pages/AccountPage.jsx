import React, { useEffect, useState } from 'react';

const PREF_KEY = 'sonorum_preferences_v4';
const ROLE_LABEL={student:'Estudante',pending:'Aguardando aprovação',teacher:'Professor(a)',staff:'Servidor(a)',coordinator:'Coordenação',admin:'Administrador(a)'};
const initialPrefs = () => {
  try { return { reduceMotion: false, compactLessons: false, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; }
  catch { return { reduceMotion: false, compactLessons: false }; }
};

export default function AccountPage({ user, activeSection = 'perfil', onUpdateProfile, onSignOut }) {
  const [section, setSection] = useState(activeSection);
  const [name, setName] = useState(user?.name || '');
  const [prefs, setPrefs] = useState(initialPrefs);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setSection(activeSection); setMessage(''); }, [activeSection]);
  useEffect(() => { setName(user?.name || ''); }, [user?.name]);
  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    document.documentElement.classList.toggle('sonorum-less-motion', prefs.reduceMotion);
    document.documentElement.classList.toggle('sonorum-compact-lessons', prefs.compactLessons);
    return () => {};
  }, [prefs]);
  const updateName = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await onUpdateProfile(name.trim()); setMessage('Nome atualizado com sucesso.'); }
    catch (error) { setMessage(error.message || 'Não foi possível salvar o perfil.'); }
    finally { setBusy(false); }
  };
  if (!user) return null;
  return <section className="account-page page-shell">
    <div className="account-heading"><span className="section-kicker">SUA CONTA</span><h1>Um espaço que é <em>seu.</em></h1><p>Cuide do seu perfil e ajuste a maneira como você aprende.</p></div>
    <div className="account-layout">
      <aside className="account-side-nav" aria-label="Seções da conta">
        <div className="account-side-identity"><span className="account-avatar-large" aria-hidden="true">{user.name.slice(0,1).toUpperCase()}</span><strong>{user.name}</strong><small>{ROLE_LABEL[user.role]||'Usuário'}</small></div>
        <button className={section === 'perfil' ? 'selected' : ''} onClick={() => {setSection('perfil');setMessage('');}}>◉ <span>Meu perfil</span></button>
        <button className={section === 'configuracoes' ? 'selected' : ''} onClick={() => {setSection('configuracoes');setMessage('');}}>⚙ <span>Configurações</span></button>
        <button className="account-exit" onClick={onSignOut}>↪ <span>Sair da conta</span></button>
      </aside>
      <div className="account-content" key={section}>
        {section === 'perfil' ? <><span className="account-caption">PERFIL</span><h2>Suas informações</h2><p>Seu nome aparece nas videoaulas publicadas por você. O endereço de e-mail é utilizado para acessar a conta.</p><form className="account-form" onSubmit={updateName}><label htmlFor="account-name">Nome de exibição</label><input id="account-name" maxLength={90} minLength={2} required autoComplete="name" value={name} onChange={event => setName(event.target.value)} /><label htmlFor="account-email">E-mail</label><input id="account-email" type="email" value={user.email || ''} readOnly aria-describedby="account-email-note" /><small id="account-email-note">A alteração de e-mail ainda não está disponível nesta versão.</small><label htmlFor="account-role">Tipo de conta</label><input id="account-role" readOnly value={ROLE_LABEL[user.role]||'Usuário'} /><small>O perfil é determinado pelo tipo de conta e pelas autorizações concedidas por um administrador. A verificação do e-mail institucional ainda será integrada.</small><button className="btn btn-primary" disabled={busy || name.trim() === user.name}>{busy ? 'Salvando...' : 'Salvar alterações'}</button></form></> : <><span className="account-caption">PREFERÊNCIAS</span><h2>Seu jeito de estudar</h2><p>Escolha como prefere usar o Sonorum. Estas opções ficam salvas neste navegador.</p><div className="account-pref-row"><div><strong>Reduzir animações</strong><small>Diminuir movimentos decorativos e o efeito 3D, ideal para quem prefere menos movimento.</small></div><input type="checkbox" checked={prefs.reduceMotion} onChange={event=>setPrefs(p=>({...p,reduceMotion:event.target.checked}))} aria-label="Reduzir animações" /></div><div className="account-pref-row"><div><strong>Trilha mais compacta</strong><small>Reduzir o espaçamento da lista de aulas na página do instrumento.</small></div><input type="checkbox" checked={prefs.compactLessons} onChange={event=>setPrefs(p=>({...p,compactLessons:event.target.checked}))} aria-label="Trilha mais compacta" /></div><p className="account-local-note">Preferências aplicadas imediatamente. O Sonorum mantém o tema visual para preservar a identidade do portal.</p></>}
        {message && <p className="account-message" role="status">{message}</p>}
      </div>
    </div>
  </section>;
}
