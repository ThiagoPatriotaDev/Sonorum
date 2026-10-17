import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import InstrumentsPage from './pages/InstrumentsPage.jsx';
import ScoreEditorPage from './pages/ScoreEditorPage.jsx';
import MyScoresPage from './pages/MyScoresPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import AuthModal from './components/AuthModal.jsx';
import { StorageService } from './services/storageService.js';
import { CommunityApi } from './services/communityApi.js';
import { INITIAL_INSTRUMENTS } from './data/instruments.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [scores, setScores] = useState([]);
  const [completedLessons, setCompletedLessons] = useState(() => StorageService.getProgress());
  const [editingScore, setEditingScore] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState('violao');
  const [user, setUser] = useState(null);
  const [authVisible, setAuthVisible] = useState(false);
  const [authError, setAuthError] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    let mounted = true;
    const token = CommunityApi.getToken();
    if (token) CommunityApi.me(token).then(({ user: current }) => { if (mounted) { setUser(current); setScores(StorageService.getScores(current.id)); } }).catch(() => { CommunityApi.clearToken(); });
    CommunityApi.videos().then((items) => { if (mounted) { setVideos(items); setVideoError(''); } }).catch(() => { if (mounted) setVideoError('O servidor está offline. As publicações ficam disponíveis quando o backend estiver ativo.'); });
    return () => { mounted = false; };
  }, []);

  const changeTab = (tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleToggleLesson = (lessonId) => { const updated = StorageService.toggleLessonProgress(lessonId); setCompletedLessons({ ...updated }); };
  const handlePracticeInEditor = (instrument, lesson) => {
    setEditingScore({ id: null, title: `Exercício: ${lesson.title.replace(/^\d+\.\s*/, '')}`, author: user?.name || 'Estudante', instrument: instrument.scoreInstrument, tempo: 96, meter: '4/4', annotations: lesson.annotations || '', notes: structuredClone(lesson.practiceNotes) });
    changeTab('editor');
  };
  const handleSaveScore = (scorePayload) => {
    if (!user) { setAuthError('Entre ou cadastre-se para salvar suas partituras.'); setAuthVisible(true); return; }
    const updated = StorageService.saveScore(scorePayload, user.id);
    setScores([...updated]); changeTab('minhas');
  };
  const handleDeleteScore = (id) => { if (!user) return; setScores([...StorageService.deleteScore(id, user.id)]); };
  const handleAuth = async (mode, credentials) => {
    try {
      const result = mode === 'login' ? await CommunityApi.login(credentials) : await CommunityApi.register(credentials);
      CommunityApi.saveToken(result.token);
      setUser(result.user); setScores(StorageService.getScores(result.user.id)); setAuthVisible(false); setAuthError('');
    } catch (error) { setAuthError(error.message); throw error; }
  };
  const handleSignOut = () => { CommunityApi.clearToken(); setUser(null); setScores([]); setAuthError(''); changeTab('inicio'); };
  const handlePublish = async (input) => {
    try {
      setVideoError('');
      const published = await CommunityApi.publish(input, CommunityApi.getToken());
      setVideos((before) => [published, ...before]);
    } catch (error) { setVideoError(error.message); throw error; }
  };
  const handleDeleteVideo = async (id) => { try { await CommunityApi.remove(id, CommunityApi.getToken()); setVideos((before) => before.filter((item) => item.id !== id)); } catch (error) { setVideoError(error.message); } };
  const openAuth = () => { setAuthError(''); setAuthVisible(true); };
  const chooseInstrument = (id) => { setSelectedInstrument(id); changeTab('ensino'); };

  return <div className="site-root"><Header activeTab={activeTab} onChangeTab={changeTab} savedCount={scores.length} user={user} onOpenAuth={openAuth} onSignOut={handleSignOut} />
    <main className={activeTab === 'inicio' ? 'home-container' : 'main-container'}>
      {activeTab === 'inicio' && <HomePage onNavigate={changeTab} onChooseInstrument={chooseInstrument} />}
      {activeTab === 'ensino' && <InstrumentsPage instruments={INITIAL_INSTRUMENTS} selectedInstrument={selectedInstrument} onSelectedInstrumentChange={setSelectedInstrument} videos={videos} completedLessons={completedLessons} onToggleLesson={handleToggleLesson} onPracticeInEditor={handlePracticeInEditor} onVisitCommunity={() => changeTab('comunidade')} />}
      {activeTab === 'comunidade' && <><CommunityPage videos={videos} user={user} onOpenAuth={openAuth} onPublish={handlePublish} onDelete={handleDeleteVideo} error={videoError} onClearError={() => setVideoError('')} />{videoError && <p className="server-warning" role="status">{videoError}</p>}</>}
      {activeTab === 'editor' && <div className="page-shell"><ScoreEditorPage key={editingScore?.id || editingScore?.title || 'new'} initialScore={editingScore} onSaveScore={handleSaveScore} onResetNew={() => setEditingScore({ id: null, title: '', author: user?.name || '', notes: [] })} /></div>}
      {activeTab === 'minhas' && (user ? <div className="page-shell"><MyScoresPage scores={scores} onEditScore={(score) => { setEditingScore(score); changeTab('editor'); }} onDeleteScore={handleDeleteScore} onNewScore={() => { setEditingScore(null); changeTab('editor'); }} /></div> : <div className="protected-page page-shell"><span className="protected-glyph">𝄞</span><span className="section-kicker">ESPAÇO PESSOAL</span><h1>Seu acervo começa <em>aqui.</em></h1><p>Entre ou crie sua conta para guardar as partituras que você compõe no Sonorum.</p><button className="btn btn-primary" onClick={openAuth}>Entrar / criar conta ↗</button></div>)}
    </main>
    {authVisible && <AuthModal onClose={() => setAuthVisible(false)} onSubmit={handleAuth} error={authError} onClearError={() => setAuthError('')} />}
  </div>;
}
