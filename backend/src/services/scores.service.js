import { ScoresRepository } from '../repositories/scores.repository.js';

export const ScoresService = {
  listScores({ instrument, search } = {}) {
    let list = ScoresRepository.findAll();
    if (instrument && instrument !== 'TODOS') {
      list = list.filter((s) => s.instrument === instrument);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q)
      );
    }
    return list;
  },

  getScore(id) {
    const score = ScoresRepository.findById(id);
    if (!score) {
      throw new Error('Partitura não encontrada.');
    }
    return score;
  },

  createScore(payload) {
    if (!payload.notes || !Array.isArray(payload.notes) || payload.notes.length === 0) {
      throw new Error('A partitura precisa conter pelo menos uma nota.');
    }
    return ScoresRepository.create({
      title: payload.title?.trim() || 'Partitura Sem Título',
      author: payload.author?.trim() || 'Anônimo',
      instrument: payload.instrument || 'Violão',
      tempo: Number(payload.tempo) || 100,
      meter: payload.meter || '4/4',
      annotations: payload.annotations || '',
      notes: payload.notes
    });
  },

  updateScore(id, payload) {
    const updated = ScoresRepository.update(id, payload);
    if (!updated) {
      throw new Error('Partitura não encontrada para atualização.');
    }
    return updated;
  },

  deleteScore(id) {
    const deleted = ScoresRepository.delete(id);
    if (!deleted) {
      throw new Error('Partitura não encontrada para exclusão.');
    }
    return { deleted: true, id };
  }
};
