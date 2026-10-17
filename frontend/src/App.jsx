import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import InstrumentsPage from './pages/InstrumentsPage.jsx';
import ScoreEditorPage from './pages/ScoreEditorPage.jsx';
import ScoreWorkspacePage from './pages/ScoreWorkspacePage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import AuthModal from './components/AuthModal.jsx';
import AccountPage from './pages/AccountPage.jsx';
import { StorageService } from './services/storageService.js';
import { CommunityApi } from './services/communityApi.js';
import { INITIAL_INSTRUMENTS } from './data/instruments.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [scores, setScores] = useState(() => StorageService.getScores());
  const [completedLessons, setCompletedLessons] = useState(() => StorageService.getProgress());
  const [editingScore, setEditingScore] = useState(null);
  const [editorSession, setEditorSession] = useState(0);
  const [studioMode, setStudioMode] = useState('hub');
  const [studioUnsaved, setStudioUnsaved] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [user, setUser] = useState(null);
  const [authVisible, setAuthVisible] = useState(false);
  const [authError, setAuthError] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoError, setVideoError] = useState('');
  const [accountSection, setAccountSection] = useState('perfil');

  useEffect(() => {
    try {
      const preferences = JSON.parse(localStorage.getItem('sonorum_preferences_v4') || '{}');
      document.documentElement.classList.toggle('sonorum-less-motion', Boolean(preferences.reduceMotion));
      document.documentElement.classList.toggle('sonorum-compact-lessons', Boolean(preferences.compactLessons));
    } catch { /* preferências locais inválidas não devem interromper o portal */ }
  }, []);

  useEffect(() => {
    let mounted = true;
    const token = CommunityApi.getToken();
    if (token) CommunityApi.me(token).then(({ user: current }) => {
      if (mounted) { setUser(current); setScores(StorageService.getScores(current.id)); }
    }).catch(() => { CommunityApi.clearToken(); });
    CommunityApi.videos().then((items) => {
      if (mounted) { setVideos(items); setVideoError(''); }
    }).catch(() => {
      if (mounted) setVideoError('O servidor está offline. As publicações ficam disponíveis quando o backend estiver ativo.');
    });
    return () => { mounted = false; };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });
  const changeTab = (tab) => {
    if (activeTab === 'partituras' && studioMode === 'edit' && studioUnsaved && !window.confirm('Você tem alterações não salvas. Deseja sair do editor mesmo assim?')) return;
    setStudioUnsaved(false);
    if (tab === 'ensino') setSelectedInstrument(null);
    if (tab === 'partituras') setStudioMode('hub');
    setActiveTab(tab);
    scrollToTop();
  };
  const chooseInstrument = (id) => { setSelectedInstrument(id); setActiveTab('ensino'); scrollToTop(); };
  const openScore = (score = null) => {
    setStudioUnsaved(false);
    setEditingScore(score);
    setEditorSession(n => n + 1);
    setStudioMode('edit');
    setActiveTab('partituras');
    scrollToTop();
  };
  const handleToggleLesson = (lessonId) => setCompletedLessons({ ...StorageService.toggleLessonProgress(lessonId) });
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
  const handleSaveScore = (scorePayload) => {
    const updated = StorageService.saveScore(scorePayload, user?.id || null);
    setScores([...updated]);
    return updated.find(score => score.id === scorePayload.id) || updated[0];
  };
  const handleDeleteScore = (id) => setScores([...StorageService.deleteScore(id, user?.id || null)]);
  const handleAuth = async (mode, credentials) => {
    try {
      const result = mode === 'login' ? await CommunityApi.login(credentials) : await CommunityApi.register(credentials);
      CommunityApi.saveToken(result.token);
      setUser(result.user);
      setScores(StorageService.getScores(result.user.id));
      setAuthVisible(false);
      setAuthError('');
    } catch (error) { setAuthError(error.message); throw error; }
  };
  const handleOpenAccount = (section = 'perfil') => { setAccountSection(section); setActiveTab('conta'); scrollToTop(); };
  const handleUpdateProfile = async (name) => {
    const result = await CommunityApi.updateMe({ name }, CommunityApi.getToken());
    setUser(result.user);
    return result.user;
  };
  const handleSignOut = () => {
    CommunityApi.clearToken(); setUser(null); setScores(StorageService.getScores()); setAuthError(''); changeTab('inicio');
  };
  const handlePublish = async (input) => {
    try { setVideoError(''); const video = await CommunityApi.publish(input, CommunityApi.getToken()); setVideos(before => [video, ...before]); }
    catch (error) { setVideoError(error.message); throw error; }
  };
  const handleDeleteVideo = async (id) => {
    try { await CommunityApi.remove(id, CommunityApi.getToken()); setVideos(before => before.filter(item => item.id !== id)); }
    catch (error) { setVideoError(error.message); }
  };
  const openAuth = () => { setAuthError(''); setAuthVisible(true); };

  return <div className="site-root">
    <Header activeTab={activeTab} onChangeTab={changeTab} savedCount={scores.length} user={user} onOpenAuth={openAuth} onSignOut={handleSignOut} onOpenAccount={handleOpenAccount} />
    <main className={activeTab === 'inicio' ? 'home-container' : `main-container ${activeTab === 'partituras' ? 'studio-host' : ''}`}>
      {activeTab === 'conta' && <AccountPage user={user} activeSection={accountSection} onUpdateProfile={handleUpdateProfile} onSignOut={handleSignOut} />}
      {activeTab === 'inicio' && <HomePage onNavigate={changeTab} onChooseInstrument={chooseInstrument} />}
      {activeTab === 'ensino' && <InstrumentsPage instruments={INITIAL_INSTRUMENTS} selectedInstrument={selectedInstrument} onSelectedInstrumentChange={setSelectedInstrument} videos={videos} completedLessons={completedLessons} onToggleLesson={handleToggleLesson} onPracticeInEditor={handlePracticeInEditor} onVisitCommunity={()=>changeTab('comunidade')} />}
      {activeTab === 'comunidade' && <><CommunityPage videos={videos} user={user} onOpenAuth={openAuth} onPublish={handlePublish} onDelete={handleDeleteVideo} error={videoError} onClearError={()=>setVideoError('')} />{videoError && <p className="server-warning" role="status">{videoError}</p>}</>}
      {activeTab === 'partituras' && (studioMode === 'hub' ? <ScoreWorkspacePage scores={scores} user={user} onOpenScore={openScore} onNewScore={()=>openScore(null)} onDeleteScore={handleDeleteScore} /> : <ScoreEditorPage key={editorSession} initialScore={editingScore} onSaveScore={handleSaveScore} onDirtyChange={setStudioUnsaved} onBack={()=>{setStudioUnsaved(false);setStudioMode('hub');scrollToTop();}} onNewScore={()=>openScore(null)} />)}
    </main>
    {authVisible && <AuthModal onClose={()=>setAuthVisible(false)} onSubmit={handleAuth} error={authError} onClearError={()=>setAuthError('')} />}
  </div>;
}
