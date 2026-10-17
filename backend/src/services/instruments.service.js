import { InstrumentsRepository } from '../repositories/instruments.repository.js';

export const InstrumentsService = {
  listAllInstruments() {
    return InstrumentsRepository.findAll();
  },

  getInstrumentById(id) {
    const instrument = InstrumentsRepository.findById(id);
    if (!instrument) {
      throw new Error(`Instrumento '${id}' não encontrado.`);
    }
    return instrument;
  }
};
