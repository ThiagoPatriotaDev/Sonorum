export const PITCH_CATALOG = [
  { id: 'C4', label: 'Dó4',  solfege: 'Dó',   freq: 261.63, y: 166, ledger: true },
  { id: 'D4', label: 'Ré4',  solfege: 'Ré',   freq: 293.66, y: 158, ledger: false },
  { id: 'E4', label: 'Mi4',  solfege: 'Mi',   freq: 329.63, y: 150, ledger: false },
  { id: 'F4', label: 'Fá4',  solfege: 'Fá',   freq: 349.23, y: 142, ledger: false },
  { id: 'G4', label: 'Sol4', solfege: 'Sol',  freq: 392.00, y: 134, ledger: false },
  { id: 'A4', label: 'Lá4',  solfege: 'Lá',   freq: 440.00, y: 126, ledger: false },
  { id: 'B4', label: 'Si4',  solfege: 'Si',   freq: 493.88, y: 118, ledger: false },
  { id: 'C5', label: 'Dó5',  solfege: 'Dó5',  freq: 523.25, y: 110, ledger: false },
  { id: 'D5', label: 'Ré5',  solfege: 'Ré5',  freq: 587.33, y: 102, ledger: false },
  { id: 'E5', label: 'Mi5',  solfege: 'Mi5',  freq: 659.25, y: 94,  ledger: false },
  { id: 'F5', label: 'Fá5',  solfege: 'Fá5',  freq: 698.46, y: 86,  ledger: false },
  { id: 'G5', label: 'Sol5', solfege: 'Sol5', freq: 783.99, y: 78,  ledger: false }
];

export const DURATION_OPTIONS = [
  { value: 4, label: '𝅝 Semibreve (4t)' },
  { value: 2, label: '𝅗𝅥 Mínima (2t)' },
  { value: 1, label: '♩ Semínima (1t)' },
  { value: 0.5, label: '♪ Colcheia (½t)' },
  { value: 'rest', label: '𝄽 Pausa (1t)' }
];

export function getPitchInfo(pitchStr) {
  if (!pitchStr || pitchStr === 'REST') return null;
  const isSharp = pitchStr.includes('#');
  const isFlat = pitchStr.includes('b');
  const baseId = pitchStr.replace(/[#b]/g, '');
  const baseObj = PITCH_CATALOG.find((p) => p.id === baseId) || PITCH_CATALOG[0];
  const freq = baseObj.freq * Math.pow(2, (isSharp ? 1 : isFlat ? -1 : 0) / 12);
  return {
    ...baseObj,
    isSharp,
    isFlat,
    freq,
    displayLabel: (isSharp || isFlat) ? baseObj.solfege.replace(/(\d?)$/, `${isSharp ? '♯' : '♭'}$1`) : baseObj.solfege
  };
}
