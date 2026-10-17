import React, { useState } from 'react';
import Header from './components/Header.jsx';
import InstrumentsPage from './pages/InstrumentsPage.jsx';
import ScoreEditorPage from './pages/ScoreEditorPage.jsx';
import MyScoresPage from './pages/MyScoresPage.jsx';
import { StorageService } from './services/storageService.js';
import { INITIAL_INSTRUMENTS } from '../../backend/src/data/seedData.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('ensino');
  const [scores, setScores] = useState(() => StorageService.getScores());
  const [completedLessons, setCompletedLessons] = useState(() => StorageService.getProgress());
  const [editingScore, setEditingScore] = useState(null);

  const handleToggleLesson = (lessonId) => {
    const updated = StorageService.toggleLessonProgress(lessonId);
    setCompletedLessons({ ...updated });
  };

  const handlePracticeInEditor = (instrument, lesson) => {
    setEditingScore({
      id: null,
      title: `Exercício — ${lesson.title}`,
      author: 'Prática de Aula',
      instrument: instrument.scoreInstrument,
      tempo: 96,
      meter: '4/4',
      annotations: lesson.annotations || '',
      notes: structuredClone(lesson.practiceNotes)
    });
    setActiveTab('editor');
  };

  const handleSaveScore = (scorePayload) => {
    const updated = StorageService.saveScore(scorePayload);
    setScores([...updated]);
    setActiveTab('minhas');
  };

  const handleDeleteScore = (id) => {
    const updated = StorageService.deleteScore(id);
    setScores([...updated]);
  };

  return (
    <div>
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        savedCount={scores.length}
      />
      <main className="main-container">
        {activeTab === 'ensino' && (
          <InstrumentsPage
            instruments={INITIAL_INSTRUMENTS}
            completedLessons={completedLessons}
            onToggleLesson={handleToggleLesson}
            onPracticeInEditor={handlePracticeInEditor}
          />
        )}
        {activeTab === 'editor' && (
          <ScoreEditorPage
            key={editingScore?.id || editingScore?.title || 'new'}
            initialScore={editingScore}
            onSaveScore={handleSaveScore}
            onResetNew={() => setEditingScore({ id: null, title: '', author: '', notes: [] })}
          />
        )}
        {activeTab === 'minhas' && (
          <MyScoresPage
            scores={scores}
            onEditScore={(score) => {
              setEditingScore(score);
              setActiveTab('editor');
            }}
            onDeleteScore={handleDeleteScore}
            onNewScore={() => {
              setEditingScore(null);
              setActiveTab('editor');
            }}
          />
        )}
      </main>
    </div>
  );
}
