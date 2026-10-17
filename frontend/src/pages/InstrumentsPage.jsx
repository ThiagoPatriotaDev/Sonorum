import React, { useEffect, useState } from 'react';
import { AudioEngine } from '../services/audioEngine.js';

const ILLUSTRATIONS = { violao: '♬', violino: '𝄞', teclado: '♩', flauta: '♫' };

export default function InstrumentsPage({ instruments, selectedInstrument, onSelectedInstrumentChange, videos, completedLessons, onToggleLesson, onPracticeInEditor, onVisitCommunity }) {
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const currentInst = instruments.find((item) => item.id === selectedInstrument) || instruments[0];
  const currentLesson = currentInst?.lessons.find((lesson) => lesson.id === selectedLessonId) || currentInst?.lessons[0];
  const instrumentVideos = videos.filter((video) => video.instrumentId === currentInst?.id);

  useEffect(() => { setSelectedLessonId(''); setActiveVideoId(null); }, [selectedInstrument]);

  return (
    <section className="learning-page page-shell">
      <div className="page-masthead"><div><span className="section-index">SONORUM / SALA DE ENSAIO</span><h1>Encontre seu <em>ritmo.</em></h1><p>Uma coleção de caminhos para explorar, ouvir e praticar. Escolha um instrumento e deixe a música acontecer.</p></div><span className="page-ornament" aria-hidden="true">𝄞</span></div>
      <div className="section-header instrument-section-title"><div><span className="section-kicker">ESCOLHA SEU INSTRUMENTO</span><h2 className="section-title">Por onde vamos começar?</h2></div><span className="micro-caption">4 CAMINHOS PARA EXPLORAR</span></div>
      <div className="instruments-grid">
        {instruments.map((inst, index) => {
          const total = inst.lessons.length;
          const done = inst.lessons.filter((l) => completedLessons[l.id]).length;
          const pct = total ? Math.round(done / total * 100) : 0;
          return <button type="button" key={inst.id} className={`instrument-card theme-${inst.id} ${inst.id === currentInst?.id ? 'selected' : ''}`} onClick={() => onSelectedInstrumentChange(inst.id)} aria-pressed={inst.id === currentInst?.id}>
            <div className="instrument-top"><span className="instrument-no">0{index + 1} / 04</span><span className="instrument-tag">{inst.category}</span></div>
            <div className="instrument-illustration"><span className="instrument-emoji">{inst.emoji}</span><span className="instrument-echo" aria-hidden="true">{ILLUSTRATIONS[inst.id]}</span></div>
            <div className="instrument-bottom"><div className="instrument-name">{inst.name}</div><span className="instrument-go">↗</span></div>
            <div className="instrument-desc">{inst.description}</div>
            <div className="progress-meta">
              <span>{done ? `${done} aula${done > 1 ? 's' : ''} concluída${done > 1 ? 's' : ''}` : 'Sua jornada começa aqui'}</span>
              <span>{pct}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={`Progresso em ${inst.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </button>;
        })}
      </div>
      {currentLesson && <div className="learning-workspace" id="trilha-aulas">
        <aside className="lessons-sidebar"><div className="lessons-sidebar-title"><span>TRILHA DE APRENDIZAGEM</span><strong>{currentInst.emoji} {currentInst.name}</strong></div><div className="lesson-list">{currentInst.lessons.map((lesson, index) => <button key={lesson.id} className={`lesson-item ${lesson.id === currentLesson.id ? 'active' : ''}`} onClick={() => setSelectedLessonId(lesson.id)}><span className="lesson-number">{String(index+1).padStart(2,'0')}</span><div><div className="lesson-item-title">{lesson.title.replace(/^\d+\.\s*/, '')}</div><div className="lesson-item-meta">{lesson.level} · {lesson.duration}</div></div><span className={`lesson-check ${completedLessons[lesson.id] ? 'done' : ''}`}>✓</span></button>)}</div><div className="lessons-note">✳ <span>Aprender música é praticar aos poucos, todos os dias.</span></div></aside>
        <article className="lesson-content-card"><div className="lesson-badge-row"><span className="level-pill">{currentLesson.level}</span><span className="lesson-duration">◷ {currentLesson.duration} de leitura e prática</span></div><h2 className="lesson-main-title">{currentLesson.title.replace(/^\d+\.\s*/, '')}</h2><p className="lesson-summary">{currentLesson.summary}</p><div className="lesson-box"><h4>NA PRÁTICA</h4><ol>{currentLesson.steps.map((step,i) => <li key={i}>{step}</li>)}</ol></div><pre className="diagram-pre">{currentLesson.diagram}</pre><div className="lesson-actions"><div className="lesson-action-pair"><button className="btn btn-primary" onClick={() => AudioEngine.playSequence(currentLesson.practiceNotes, { instrument: currentInst.scoreInstrument, bpm: 96 })}>♪ Ouvir exercício</button><button className="btn btn-secondary" onClick={() => onPracticeInEditor(currentInst,currentLesson)}>↗ Praticar no estúdio</button></div><button className={`btn ${completedLessons[currentLesson.id] ? 'btn-success' : 'btn-outline'}`} onClick={() => onToggleLesson(currentLesson.id)}>{completedLessons[currentLesson.id] ? '✓ Concluída' : 'Marcar como concluída'}</button></div></article>
      </div>}
      <section className="instrument-videos"><div className="video-heading"><div><span className="section-index">APRENDA COM A COMUNIDADE</span><h2>Videoaulas de <em>{currentInst?.name}</em></h2></div><button className="text-link" onClick={onVisitCommunity}>Compartilhar uma aula ↗</button></div>{instrumentVideos.length === 0 ? <div className="videos-empty"><div className="empty-vinyl" aria-hidden="true">▶</div><div><h3>Esse palco ainda está esperando o primeiro vídeo.</h3><p>Estudantes e professores podem compartilhar aulas do YouTube com a comunidade. Seja a primeira pessoa a contribuir!</p><button className="btn btn-primary" onClick={onVisitCommunity}>Publicar uma videoaula ↗</button></div></div> : <div className="video-grid">{instrumentVideos.map((video) => <article className="video-card" key={video.id}>{activeVideoId === video.id ? <div className="video-player"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div> : <button className="video-thumb" onClick={() => setActiveVideoId(video.id)} aria-label={`Assistir ${video.title}`} style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(23,18,30,.35)),url(https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg)` }}><span>▶</span></button>}<div className="video-meta"><span>{video.authorRole === 'teacher' ? 'PROFESSOR' : 'ESTUDANTE'} · {video.author}</span><h3>{video.title}</h3><p>{video.description}</p></div></article>)}</div>}</section>
    </section>
  );
}
