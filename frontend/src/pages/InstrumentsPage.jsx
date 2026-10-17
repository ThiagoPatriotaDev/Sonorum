import React, { useEffect, useMemo, useState } from 'react';
import { AudioEngine } from '../services/audioEngine.js';

function cleanTitle(value = '') { return value.replace(/^\d+\.\s*/, ''); }

function LessonRow({ lesson, index, selected, completed, onClick }) {
  return <button type="button" className={`lesson-item ${selected ? 'active' : ''}`} onClick={onClick} aria-current={selected ? 'step' : undefined}>
    <span className={`lesson-number ${completed ? 'is-complete' : ''}`}>{completed ? '✓' : String(index + 1).padStart(2, '0')}</span>
    <span className="lesson-row-copy"><strong className="lesson-item-title">{cleanTitle(lesson.title)}</strong><span className="lesson-item-meta">{lesson.duration} · {lesson.level}</span></span>
    <span className="lesson-arrow" aria-hidden="true">↗</span>
  </button>;
}

export default function InstrumentsPage({ instruments, selectedInstrument, onSelectedInstrumentChange, videos, completedLessons, onToggleLesson, onPracticeInEditor, onVisitCommunity }) {
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [detailTab, setDetailTab] = useState('trilha');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [query, setQuery] = useState('');
  const activeInstrument = instruments.find(item => item.id === selectedInstrument);
  const lessons = activeInstrument?.lessons || [];
  const currentLesson = lessons.find(l => l.id === selectedLessonId) || lessons[0];
  const videoList = videos.filter(v => v.instrumentId === selectedInstrument);
  const completedCount = lessons.filter(l => completedLessons[l.id]).length;
  const percent = lessons.length ? Math.round(completedCount / lessons.length * 100) : 0;
  const visibleInstruments = useMemo(() => instruments.filter(inst => `${inst.name} ${inst.category} ${inst.description}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim())), [instruments, query]);
  useEffect(() => { setSelectedLessonId(''); setDetailTab('trilha'); setActiveVideoId(null); AudioEngine.stop(); }, [selectedInstrument]);
  useEffect(() => () => AudioEngine.stop(), []);
  const openInstrument = (id) => { onSelectedInstrumentChange(id); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const goToVideos = () => { setDetailTab('videos'); setActiveVideoId(null); };
  const currentIndex = lessons.indexOf(currentLesson);

  if (!activeInstrument) return <section className="learn-overview">
    <div className="learn-overview-top"><div className="learn-overview-heading"><span className="section-kicker">EXPLORAR AULAS</span><h1>Encontre seu som.</h1><p>Escolha um instrumento para começar uma trilha de aprendizagem com exercícios de verdade.</p></div><label className="learn-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar instrumento" aria-label="Buscar instrumento" /></label></div>
    <div className="instruments-grid learn-instrument-grid">{visibleInstruments.map((inst,index) => {
      const done = inst.lessons.filter(l => completedLessons[l.id]).length;
      const pct = Math.round(done / inst.lessons.length * 100);
      return <button type="button" key={inst.id} className="instrument-card instrument-photo-card" onClick={() => openInstrument(inst.id)} aria-label={`Abrir ${inst.lessons.length} aulas de ${inst.name}`}>
        <img className="instrument-card-image" src={inst.image} alt="" loading="lazy" />
        <div className="instrument-card-shade" aria-hidden="true" />
        <div className="instrument-card-top"><span>{inst.category}</span><span>{String(inst.lessons.length).padStart(2,'0')} aulas</span></div>
        <div className="instrument-card-bottom"><span className="instrument-card-name">{inst.name}</span><span className="instrument-card-launch" aria-hidden="true">↗</span><span className="instrument-card-description">{inst.description}</span><div className="instrument-card-progress"><span>{done} de {inst.lessons.length} concluídas</span><span>{pct}%</span></div><div className="instrument-card-meter"><i style={{width: `${pct}%`}} /></div></div>
      </button>;
    })}</div>{!visibleInstruments.length && <p className="learn-no-results" role="status">Nenhum instrumento encontrado. Tente outro termo.</p>}
  </section>;

  return <section className="learn-detail">
    <button type="button" className="learn-back" onClick={() => openInstrument(null)}>← Todos os instrumentos</button>
    <div className="learn-detail-hero">
      <img className="learn-detail-cover" src={activeInstrument.image} alt="" />
      <div className="learn-detail-copy"><span className="section-kicker">SALA DE ENSAIO / {activeInstrument.category.toUpperCase()}</span><h1>{activeInstrument.name}</h1><p>{activeInstrument.description}</p><div className="learn-detail-hero-meta"><span>{lessons.length} aulas guiadas</span><span>{completedCount} concluídas</span><span>{percent}% da trilha</span></div>
        <div className="learn-hero-actions"><button type="button" className="learn-hero-video" onClick={goToVideos}>▷ Ver videoaulas <span>{videoList.length > 0 ? `(${videoList.length})` : '↗'}</span></button><button type="button" className="learn-hero-continue" onClick={() => { setDetailTab('trilha'); document.getElementById('trilha-conteudo')?.scrollIntoView({behavior:'smooth',block:'start'}); }}>Continuar aprendendo ↓</button></div>
      </div>
    </div>
    <div className="learn-detail-tabs" role="tablist" aria-label="Conteúdo de aprendizagem">
      <button type="button" role="tab" aria-selected={detailTab === 'trilha'} className={detailTab === 'trilha' ? 'active' : ''} onClick={() => setDetailTab('trilha')}>Trilha de aprendizagem <span>{lessons.length}</span></button>
      <button type="button" role="tab" aria-selected={detailTab === 'videos'} className={detailTab === 'videos' ? 'active' : ''} onClick={goToVideos}>▶ Videoaulas da comunidade <span>{videoList.length}</span></button>
    </div>
    {detailTab === 'trilha' && <div className="learning-workspace learn-detail-workspace" id="trilha-conteudo">
      <aside className="lessons-sidebar"><div className="lessons-sidebar-title"><span>SEU CAMINHO</span><strong>{completedCount} de {lessons.length} aulas concluídas</strong><div className="lesson-progress-rail"><div style={{width:`${percent}%`}} /></div></div>
        <div className="lesson-list">{lessons.map((lesson,index) => {
          const showHeading = index === 0 || lesson.unit !== lessons[index - 1].unit;
          return <React.Fragment key={lesson.id}>{showHeading && <div className="lesson-unit-heading"><span>{lesson.unit || 'Prática'}</span></div>}<LessonRow lesson={lesson} index={index} selected={currentLesson?.id === lesson.id} completed={Boolean(completedLessons[lesson.id])} onClick={() => { setSelectedLessonId(lesson.id); AudioEngine.stop(); }} /></React.Fragment>;
        })}</div>
        <button type="button" className="learn-community-shortcut" onClick={goToVideos}>▷ Videoaulas deste instrumento <span>↗</span></button>
      </aside>
      {currentLesson && <article className="lesson-content-card">
        <div className="lesson-cover-strip"><img src={activeInstrument.image} alt="" loading="lazy" /><div><span>AULA {String(currentIndex+1).padStart(2,'0')} DE {String(lessons.length).padStart(2,'0')}</span><strong>{currentLesson.unit || 'Prática musical'}</strong></div></div>
        <div className="lesson-badge-row"><span className="level-pill">{currentLesson.level}</span><span className="lesson-duration">◷ {currentLesson.duration}</span><span className="lesson-duration">{activeInstrument.name}</span></div>
        <h2 className="lesson-main-title">{cleanTitle(currentLesson.title)}</h2><p className="lesson-summary">{currentLesson.summary}</p>
        <div className="lesson-objective"><span>OBJETIVO DESTA AULA</span><p>{currentLesson.objective || 'Pratique os movimentos descritos abaixo lentamente, confira o som de referência e repita com consistência.'}</p></div>
        <div className="lesson-box"><h4>PASSO A PASSO</h4><ol>{currentLesson.steps.map((step,index) => <li key={index}>{step}</li>)}</ol></div>
        {currentLesson.diagram && <div className="lesson-practice-reference"><span>REFERÊNCIA MUSICAL</span><pre className="diagram-pre">{currentLesson.diagram}</pre></div>}
        <div className="lesson-actions"><div className="lesson-action-pair"><button className="btn btn-primary" onClick={() => AudioEngine.playSequence(currentLesson.practiceNotes,{instrument:activeInstrument.scoreInstrument,bpm:96})}>▶ Ouvir exercício</button><button className="btn btn-secondary" onClick={() => onPracticeInEditor(activeInstrument,currentLesson)}>↗ Praticar no estúdio</button><button className="btn btn-outline" onClick={() => AudioEngine.stop()}>■ Parar som</button></div><button className={`btn ${completedLessons[currentLesson.id] ? 'btn-success' : 'btn-outline'}`} onClick={() => onToggleLesson(currentLesson.id)}>{completedLessons[currentLesson.id] ? '✓ Concluída' : 'Marcar como concluída'}</button></div>
        <p className="lesson-sound-disclaimer">Áudio com timbres sintetizados para referência de notas e ritmo. Para desenvolver técnica e sonoridade reais, pratique também com seu instrumento e orientação de um professor.</p>
        <div className="learn-next-lesson"><span>Aula {currentIndex + 1} de {lessons.length}</span>{currentIndex > 0 && <button onClick={() => setSelectedLessonId(lessons[currentIndex - 1].id)}>← Anterior</button>}{currentIndex < lessons.length - 1 && <button className="next-primary" onClick={() => setSelectedLessonId(lessons[currentIndex + 1].id)}>Próxima aula →</button>}</div>
      </article>}
    </div>}
    {detailTab === 'videos' && <section className="learn-videos-panel"><div className="learn-videos-heading"><div><h2>Videoaulas de {activeInstrument.name}</h2><p>Publicadas pelos estudantes e professores da comunidade.</p></div><button className="btn btn-secondary" onClick={onVisitCommunity}>＋ Publicar videoaula</button></div>{videoList.length ? <div className="video-grid">{videoList.map(video => <article className="video-card" key={video.id}>{activeVideoId === video.id ? <div className="video-player"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div> : <button className="video-thumb" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(23,18,30,.35)),url(https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg)`}} onClick={() => setActiveVideoId(video.id)} aria-label={`Assistir ${video.title}`}><span>▶</span></button>}<div className="video-meta"><span>{video.authorRole === 'teacher' ? 'PROFESSOR' : 'ESTUDANTE'} · {video.author}</span><h3>{video.title}</h3><p>{video.description}</p></div></article>)}</div> : <div className="learn-video-empty"><span>▷</span><h3>Ainda não há videoaulas de {activeInstrument.name}.</h3><p>Assim que alguém publicar uma aula de {activeInstrument.name}, ela aparecerá nesta área. Você pode compartilhar a primeira.</p><button className="btn btn-primary" onClick={onVisitCommunity}>Publicar uma videoaula</button></div>}</section>}
  </section>;
}
