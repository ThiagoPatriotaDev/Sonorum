import { INITIAL_INSTRUMENTS } from '../data/seedData.js';

let instrumentsStore = structuredClone(INITIAL_INSTRUMENTS);

export const InstrumentsRepository = {
  findAll() {
    return instrumentsStore;
  },

  findById(id) {
    return instrumentsStore.find((inst) => inst.id === id) || null;
  }
};
