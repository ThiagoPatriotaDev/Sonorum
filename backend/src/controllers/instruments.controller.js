import { InstrumentsService } from '../services/instruments.service.js';

export const InstrumentsController = {
  getAll(req, res) {
    const data = InstrumentsService.listAllInstruments();
    res.json(data);
  },

  getById(req, res) {
    try {
      const data = InstrumentsService.getInstrumentById(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
};
