import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import InstrumentsPage from './pages/InstrumentsPage.jsx';
import ScoreEditorPage from './pages/ScoreEditorPage.jsx';
import ScoreWorkspacePage from './pages/ScoreWorkspacePage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import AuthModal from './components/AuthModal.jsx';
import AccountPage from './pages/AccountPage.jsx';
import PublicCoursePage from './pages/PublicCoursePage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import AdminConsolePage from './pages/AdminConsolePage.jsx';
import './styles/editorial.css';
import { PUBLIC_SECTIONS } from './data/publicCourse.js';
import { StorageService } from './services/storageService.js';
import { CommunityApi } from './services/communityApi.js';
import {supabase} from './services/supabaseClient.js';
import { INITIAL_INSTRUMENTS } from './data/instruments.js';

export default function App() {
  const initialPublic = PUBLIC_SECTIONS.find(section => typeof window !== 'undefined' && window.location.hash === `#/${section.id}`);
  const initialHash = typeof window !== 'undefined' ? window.location.hash : '';
  const [activeTab, setActiveTab] = useState(initialPublic ? 'institucional' : initialHash === '#/eventos' ? 'eventos' : initialHash.startsWith('#/noticia/') ? 'noticia' : initialHash === '#/noticias' ? 'noticias' : 'inicio');
  const [publicSection, setPublicSection] = useState(initialPublic?.id || 'curso');
  const [scores, setScores] = useState(() => StorageService.getScores());
  const [completedLessons, setCompletedLessons] = useState(() => StorageService.getProgress());
  const [editingScore, setEditingScore] = useState(null);
  const [editorSession, setEditorSession] = useState(0);
  const [studioMode, setStudioMode] = useState('hub');
  const [studioUnsaved, setStudioUnsaved] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [user, setUser] = useState(null);
  const [authVisible, setAuthVisible] = useState(initialHash==='#/redefinir-senha');
  const [authMode, setAuthMode] = useState(initialHash==='#/redefinir-senha'?'reset':'login');
  const [authError, setAuthError] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoError, setVideoError] = useState('');
  const [accountSection, setAccountSection] = useState('perfil');
  const [articleSlug, setArticleSlug] = useState(() => initialHash.startsWith('#/noticia/') ? decodeURIComponent(initialHash.split('/')[2]||'') : '');

  useEffect(() => {
    // Descartar o JWT HMAC legado; nunca reutilizá-lo com Supabase.
    localStorage.removeItem('sonorum_access_token_v1');
    try {
      const preferences = JSON.parse(localStorage.getItem('sonorum_preferences_v4') || '{}');
      document.documentElement.classList.toggle('sonorum-less-motion', Boolean(preferences.reduceMotion));
      document.documentElement.classList.toggle('sonorum-compact-lessons', Boolean(preferences.compactLessons));
    } catch { /* preferências locais inválidas não devem interromper o portal */ }
  }, []);

  useEffect(() => {
    let mounted=true, revision=0;
    const sync=async()=>{
      const version=++revision;
      try {
        if (!supabase) {if(mounted){setUser(null);setScores(StorageService.getScores());}return;}
        const {data:{session}}=await supabase.auth.getSession();
        if(!session){if(mounted&&version===revision){setUser(null);setScores(StorageService.getScores());setCompletedLessons(StorageService.getProgress());setActiveTab(t=>['admin','conta'].includes(t)?'inicio':t);}return;}
        const [profile,remoteScores,progress]=await Promise.all([CommunityApi.me(),CommunityApi.getScores(),CommunityApi.getProgress()]);
        if(mounted&&version===revision){setUser(profile.user);setScores(remoteScores);setCompletedLessons(progress);}
      } catch { if(mounted&&version===revision){setUser(null);setScores(StorageService.getScores());setActiveTab(t=>['admin','conta'].includes(t)?'inicio':t);} }
    };
    sync();
    const subscription=supabase?.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY'){
        setAuthMode('reset');setAuthVisible(true);setAuthError('');
        return;
      }
      // Never await Supabase calls inside the onAuthStateChange callback.
      window.setTimeout(sync,0);
    });
    CommunityApi.videos().then(items=>{if(mounted){setVideos(items);setVideoError('');}}).catch(()=>{if(mounted)setVideoError('Servidor de videoaulas indisponível.');});
    return()=>{mounted=false;revision++;subscription?.data?.subscription?.unsubscribe();};
  }, []);

  useEffect(() => {
    const navigateHash = () => {
      const match = PUBLIC_SECTIONS.find(section => window.location.hash === `#/${section.id}`);
      if (match) { setPublicSection(match.id); setActiveTab('institucional'); window.scrollTo(0,0); }
      else if (window.location.hash === '#/eventos') { setActiveTab('eventos'); window.scrollTo(0,0); }
      else if (window.location.hash === '#/noticias') { setActiveTab('noticias'); window.scrollTo(0,0); }
      else if (window.location.hash.startsWith('#/noticia/')) {setArticleSlug(decodeURIComponent(window.location.hash.split('/')[2]||''));setActiveTab('noticia');window.scrollTo(0,0);}
    };
    window.addEventListener('hashchange', navigateHash);
    return () => window.removeEventListener('hashchange', navigateHash);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });
  const canLeaveStudio = () => activeTab !== 'partituras' || studioMode !== 'edit' || !studioUnsaved || window.confirm('Você tem alterações não salvas. Deseja sair do editor mesmo assim?');
  const openPublicSection = (section) => {
    if (!PUBLIC_SECTIONS.some(s => s.id === section) || !canLeaveStudio()) return;
    setStudioUnsaved(false);
    setPublicSection(section);
    setActiveTab('institucional');
    if (window.location.hash !== `#/${section}`) window.location.hash = `/${section}`;
    scrollToTop();
  };
  const changeTab = (tab) => {
    if (!canLeaveStudio()) return;
    setStudioUnsaved(false);
    if (tab === 'ensino') setSelectedInstrument(null);
    if (tab === 'partituras') setStudioMode('hub');
    setActiveTab(tab);
    if (tab === 'eventos') { if (window.location.hash !== '#/eventos') window.location.hash = '/eventos'; }
    else if (tab === 'noticias') { if(window.location.hash !== '#/noticias') window.location.hash='/noticias'; }
    else if (window.location.hash.startsWith('#/')) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    scrollToTop();
  };
  const openArticle = slug => {setArticleSlug(slug);setActiveTab('noticia');window.location.hash=`/noticia/${encodeURIComponent(slug)}`;scrollToTop();};
  const openAdmin = () => {if(['admin','coordinator','teacher'].includes(user?.role)){setActiveTab('admin');scrollToTop();}};
  const chooseInstrument = (id) => { setSelectedInstrument(id); setActiveTab('ensino'); scrollToTop(); };
  const openScore = (score = null) => {
    setStudioUnsaved(false);
    setEditingScore(score);
    setEditorSession(n => n + 1);
    setStudioMode('edit');
    setActiveTab('partituras');
    scrollToTop();
  };
  const handleToggleLesson = async lessonId => {
    const next=!completedLessons[lessonId];
    if(!user){setCompletedLessons(StorageService.toggleLessonProgress(lessonId));return;}
    try{await CommunityApi.saveProgress(lessonId,next);setCompletedLessons(previous=>({...previous,[lessonId]:next}));}
    catch{setVideoError('Não foi possível salvar o progresso. Tente novamente.');}
  };
  const handlePracticeInEditor = (instrument, lesson) => openScore({
    id: null,
    title: `Exercício: ${lesson.title.replace(/^\d+\.\s*/, '')}`,
    author: user?.name || '',
    instrument: instrument.scoreInstrument,
    tempo: 96,
    meter: '4/4',
    annotations: lesson.annotations || '',
    notes: structuredClone(lesson.practiceNotes)
  });
  const handleSaveScore = async scorePayload => {
    const stored=user ? await CommunityApi.saveScore(scorePayload) : StorageService.saveScore(scorePayload);
    setScores(previous=>[stored,...previous.filter(x=>x.id!==stored.id)]);
    return stored;
  };
  const handleDeleteScore = async id => {
    try {if(user)await CommunityApi.deleteScore(id); else StorageService.deleteScore(id);
      setScores(previous=>previous.filter(score=>score.id!==id));}
    catch {window.alert('Não foi possível excluir a partitura.');}
  };
  const handleAuth = async (mode, credentials) => {
    setAuthError('');
    try {
      if(mode==='recover'){return await CommunityApi.recover(credentials);}
      if(mode==='reset'){
        const answer=await CommunityApi.changePassword(credentials);
        await CommunityApi.signOut();
        setAuthMode('login');setAuthVisible(false);setUser(null);
        if(window.location.hash==='#/redefinir-senha')window.history.replaceState(null,'',window.location.pathname+window.location.search);
        return answer;
      }
      const result=mode==='login'?await CommunityApi.login(credentials):await CommunityApi.register(credentials);
      setUser(result.user);
      const [cloudScores,cloudProgress]=await Promise.all([CommunityApi.getScores(),CommunityApi.getProgress()]);
      setScores(cloudScores);setCompletedLessons(cloudProgress);
      setAuthVisible(false);setAuthError('');return result;
    } catch(error){setAuthError(error.message||'Não foi possível autenticar.');throw error;}
  };
  const handleOpenAccount = (section = 'perfil') => { if(section==='admin'){openAdmin();return;} setAccountSection(section); setActiveTab('conta'); scrollToTop(); };
  const handleUpdateProfile = async (name) => {
    const result = await CommunityApi.updateMe({ name });
    setUser(result.user);
    return result.user;
  };
  const handleSignOut = async () => {
    try{await CommunityApi.signOut();setUser(null);setScores(StorageService.getScores());setCompletedLessons(StorageService.getProgress());setAuthError('');changeTab('inicio');}
    catch{window.alert('Não foi possível encerrar a sessão. Tente novamente.');}
  };
  const handlePublish = async (input) => {
    try { setVideoError(''); const video = await CommunityApi.publish(input); setVideos(before => [video, ...before]); }
    catch (error) { setVideoError(error.message); throw error; }
  };
  const handleDeleteVideo = async (id) => {
    try { await CommunityApi.remove(id); setVideos(before => before.filter(item => item.id !== id)); }
    catch (error) { setVideoError(error.message); }
  };
  const openAuth = () => { setAuthMode('login');setAuthError('');setAuthVisible(true); };

  return <div className="site-root">
    <Header activeTab={activeTab} activePublicSection={publicSection} onOpenPublicSection={openPublicSection} onChangeTab={changeTab} savedCount={scores.length} user={user} onOpenAuth={openAuth} onSignOut={handleSignOut} onOpenAccount={handleOpenAccount} />
    <main className={['inicio','institucional','eventos','noticias','noticia','admin'].includes(activeTab) ? 'home-container' : `main-container ${activeTab === 'partituras' ? 'studio-host' : ''}`}>
      {activeTab === 'conta' && <AccountPage user={user} activeSection={accountSection} onUpdateProfile={handleUpdateProfile} onSignOut={handleSignOut} />}
      {activeTab === 'inicio' && <HomePage onNavigate={changeTab} onChooseInstrument={chooseInstrument} onOpenPublicSection={openPublicSection} onArticle={openArticle} />}
      {activeTab === 'institucional' && <PublicCoursePage activeSection={publicSection} onSelectSection={openPublicSection} onNavigate={changeTab} />}
      {activeTab === 'eventos' && <EventsPage onNavigate={changeTab} />}
      {activeTab === 'noticias' && <NewsPage onNavigate={changeTab} onArticle={openArticle} />}
      {activeTab === 'noticia' && <NewsPage slug={articleSlug} onNavigate={changeTab} onArticle={openArticle} />}
      {activeTab === 'admin' && <AdminConsolePage user={user} onExit={()=>changeTab('inicio')} onPublished={()=>changeTab('noticias')} />}
      {activeTab === 'ensino' && <InstrumentsPage instruments={INITIAL_INSTRUMENTS} selectedInstrument={selectedInstrument} onSelectedInstrumentChange={setSelectedInstrument} videos={videos} completedLessons={completedLessons} onToggleLesson={handleToggleLesson} onPracticeInEditor={handlePracticeInEditor} onVisitCommunity={()=>changeTab('comunidade')} />}
      {activeTab === 'comunidade' && <><CommunityPage videos={videos} user={user} onOpenAuth={openAuth} onPublish={handlePublish} onDelete={handleDeleteVideo} onNavigateEvents={()=>changeTab('eventos')} error={videoError} onClearError={()=>setVideoError('')} />{videoError && <p className="server-warning" role="status">{videoError}</p>}</>}
      {activeTab === 'partituras' && (studioMode === 'hub' ? <ScoreWorkspacePage scores={scores} user={user} onOpenScore={openScore} onNewScore={()=>openScore(null)} onDeleteScore={handleDeleteScore} /> : <ScoreEditorPage key={editorSession} initialScore={editingScore} onSaveScore={handleSaveScore} onDirtyChange={setStudioUnsaved} onBack={()=>{setStudioUnsaved(false);setStudioMode('hub');scrollToTop();}} onNewScore={()=>openScore(null)} />)}
    </main>
    {authVisible && <AuthModal initialMode={authMode} onClose={()=>setAuthVisible(false)} onSubmit={handleAuth} error={authError} onClearError={()=>setAuthError('')} />}
  </div>;
}
