import { INITIAL_SCORES } from '../data/seedData.js';

let scoresStore = structuredClone(INITIAL_SCORES);

export const ScoresRepository = {
  findAll() {
    return scoresStore;
  },

  findById(id) {
    return scoresStore.find((score) => score.id === id) || null;
  },

  create(scoreData) {
    const newScore = {
      ...scoreData,
      id: scoreData.id || `score-${Date.now()}`,
      updatedAt: new Date().toLocaleDateString('pt-BR')
    };
    scoresStore.unshift(newScore);
    return newScore;
  },

  update(id, scoreData) {
    const index = scoresStore.findIndex((score) => score.id === id);
    if (index === -1) return null;

    scoresStore[index] = {
      ...scoresStore[index],
      ...scoreData,
      id,
      updatedAt: new Date().toLocaleDateString('pt-BR')
    };
    return scoresStore[index];
  },

  delete(id) {
    const exists = scoresStore.some((score) => score.id === id);
    if (!exists) return false;
    scoresStore = scoresStore.filter((score) => score.id !== id);
    return true;
  }
};
