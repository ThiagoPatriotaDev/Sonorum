import { ScoresService } from '../services/scores.service.js';

export const ScoresController = {
  getAll(req, res) {
    const { instrument, search } = req.query;
    const scores = ScoresService.listScores({ instrument, search });
    res.json(scores);
  },

  getById(req, res) {
    try {
      const score = ScoresService.getScore(req.params.id);
      res.json(score);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const created = ScoresService.createScore(req.body);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const updated = ScoresService.updateScore(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  remove(req, res) {
    try {
      const result = ScoresService.deleteScore(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
};
