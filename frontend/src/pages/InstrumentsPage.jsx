import React, { useState } from 'react';
import { AudioEngine } from '../services/audioEngine.js';

export default function InstrumentsPage({
  instruments,
  completedLessons,
  onToggleLesson,
  onPracticeInEditor
}) {
  const [selectedInstId, setSelectedInstId] = useState(instruments[0]?.id || 'violao');
  const currentInst = instruments.find((i) => i.id === selectedInstId) || instruments[0];
  const [selectedLessonId, setSelectedLessonId] = useState(currentInst.lessons[0]?.id);

  const currentLesson =
    currentInst.lessons.find((l) => l.id === selectedLessonId) || currentInst.lessons[0];

  const handleSelectInstrument = (inst) => {
    setSelectedInstId(inst.id);
    if (inst.lessons.length > 0) {
      setSelectedLessonId(inst.lessons[0].id);
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h1 className="section-title">Escolha seu Instrumento</h1>
          <p className="section-subtitle">
            Selecione um instrumento para acessar as aulas, ouvir demonstrações e praticar no editor.
          </p>
        </div>
      </div>

      <div className="instruments-grid">
        {instruments.map((inst) => {
          const total = inst.lessons.length;
          const done = inst.lessons.filter((l) => completedLessons[l.id]).length;
          const pct = Math.round((done / total) * 100);
          return (
            <div
              key={inst.id}
              className={`instrument-card ${inst.id === currentInst.id ? 'selected' : ''}`}
              onClick={() => handleSelectInstrument(inst)}
            >
              <div className="instrument-top">
                <div className="instrument-emoji">{inst.emoji}</div>
                <span className="instrument-tag">{inst.category}</span>
              </div>
              <div className="instrument-name">{inst.name}</div>
              <div className="instrument-desc">{inst.description}</div>
              <div className="progress-meta">
                <span>Progresso</span>
                <span>{done}/{total} ({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="learning-workspace">
        <aside className="lessons-sidebar">
          <div className="lessons-sidebar-title">
            <span>{currentInst.emoji} Aulas de {currentInst.name}</span>
          </div>
          <div className="lesson-list">
            {currentInst.lessons.map((lesson) => {
              const isDone = !!completedLessons[lesson.id];
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={`lesson-item ${lesson.id === currentLesson.id ? 'active' : ''}`}
                  onClick={() => setSelectedLessonId(lesson.id)}
                >
                  <div>
                    <div className="lesson-item-title">{lesson.title}</div>
                    <div className="lesson-item-meta">{lesson.level} • {lesson.duration}</div>
                  </div>
                  <div className={`lesson-check ${isDone ? 'done' : ''}`}>✓</div>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="lesson-content-card">
          <div className="lesson-badge-row">
            <span className="level-pill">{currentInst.emoji} {currentInst.name} — {currentLesson.level}</span>
            <span className="instrument-tag">⏱ {currentLesson.duration}</span>
          </div>
          <h2 className="lesson-main-title">{currentLesson.title}</h2>
          <p style={{ marginBottom: '1rem' }}>{currentLesson.summary}</p>
          <div className="lesson-box">
            <h4>Passo a Passo</h4>
            <ol style={{ paddingLeft: '1.2rem' }}>
              {currentLesson.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: '0.35rem' }}>{step}</li>
              ))}
            </ol>
          </div>
          <pre className="diagram-pre" style={{ marginTop: '1rem' }}>{currentLesson.diagram}</pre>

          <div className="lesson-actions">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  AudioEngine.playSequence(currentLesson.practiceNotes, {
                    instrument: currentInst.scoreInstrument,
                    bpm: 96
                  })
                }
              >
                🔊 Ouvir Exemplo da Aula
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onPracticeInEditor(currentInst, currentLesson)}
              >
                🎼 Praticar no Editor
              </button>
            </div>
            <button
              className="btn btn-success"
              onClick={() => onToggleLesson(currentLesson.id)}
            >
              {completedLessons[currentLesson.id] ? '✓ Concluída' : 'Marcar como Concluída'}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
