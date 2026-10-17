const STORAGE_KEYS = {
  SCORES: 'melodialab_saved_scores_v1',
  PROGRESS: 'melodialab_lesson_progress_v1'
};

const DEFAULT_SCORES = [
  {
    id: 'score-demo-1',
    title: 'Ode à Alegria (Tema de Beethoven)',
    author: 'L. van Beethoven',
    instrument: 'Violino',
    tempo: 108,
    meter: '4/4',
    updatedAt: '13/10/2026',
    annotations: 'Tocar na 1ª posição (cordas Ré e Lá) com arcadas longas e destacadas.',
    notes: [
      { pitch: 'F#4', dur: 1 }, { pitch: 'F#4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'A4', dur: 1 },
      { pitch: 'A4', dur: 1 }, { pitch: 'G4', dur: 1 }, { pitch: 'F#4', dur: 1 }, { pitch: 'E4', dur: 1 },
      { pitch: 'D4', dur: 1 }, { pitch: 'D4', dur: 1 }, { pitch: 'E4', dur: 1 }, { pitch: 'F#4', dur: 1 },
      { pitch: 'F#4', dur: 2 }, { pitch: 'E4', dur: 2 }
    ]
  },
  {
    id: 'score-demo-2',
    title: 'Arpejo Clássico em Dó Maior',
    author: 'Estudo de Violão',
    instrument: 'Violão',
    tempo: 92,
    meter: '4/4',
    updatedAt: '13/10/2026',
    annotations: 'Dedilhado mão direita: P - I - M - A | Acordes: C - Am - G7 - C',
    notes: [
      { pitch: 'C4', dur: 0.5 }, { pitch: 'E4', dur: 0.5 }, { pitch: 'G4', dur: 0.5 }, { pitch: 'C5', dur: 0.5 },
      { pitch: 'G4', dur: 0.5 }, { pitch: 'E4', dur: 0.5 }, { pitch: 'C4', dur: 1 },
      { pitch: 'D4', dur: 1 }, { pitch: 'F4', dur: 1 }, { pitch: 'B4', dur: 1 }, { pitch: 'C5', dur: 2 }
    ]
  }
];

export const StorageService = {
  getScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCORES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(DEFAULT_SCORES));
        return DEFAULT_SCORES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SCORES;
    }
  },

  saveScore(scorePayload) {
    const scores = this.getScores();
    const nowStr = new Date().toLocaleDateString('pt-BR');

    if (scorePayload.id) {
      const idx = scores.findIndex((s) => s.id === scorePayload.id);
      if (idx !== -1) {
        scores[idx] = { ...scores[idx], ...scorePayload, updatedAt: nowStr };
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
        return scores;
      }
    }

    const newScore = {
      ...scorePayload,
      id: `score-${Date.now()}`,
      updatedAt: nowStr
    };
    const updated = [newScore, ...scores];
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));
    return updated;
  },

  deleteScore(id) {
    const updated = this.getScores().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));
    return updated;
  },

  getProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  toggleLessonProgress(lessonId) {
    const progress = this.getProgress();
    progress[lessonId] = !progress[lessonId];
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    return progress;
  }
};
