const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const typeByUnits = { 64: 'whole', 32: 'half', 16: 'quarter', 8: 'eighth', 4: '16th', 2: '32nd', 1: '64th' };
const units = [64, 32, 16, 8, 4, 2, 1];

function noteXml(note, count, first, last, continued) {
  const pitch = /^([A-G])(#?)([0-8])$/.exec(note.pitch || '');
  const isRest = note.pitch === 'REST' || !pitch;
  const pitchXml = isRest ? '<rest />' : `<pitch><step>${pitch[1]}</step>${pitch[2] ? '<alter>1</alter>' : ''}<octave>${pitch[3]}</octave></pitch>`;
  const accidentalXml = !isRest && pitch[2] && first ? '<accidental>sharp</accidental>' : '';
  const tieIn = continued && !first ? '<tie type="stop"/>' : '';
  const tieOut = continued && !last ? '<tie type="start"/>' : '';
  const notation = continued && !isRest ? `<notations>${!first ? '<tied type="stop"/>' : ''}${!last ? '<tied type="start"/>' : ''}</notations>` : '';
  return `<note>${pitchXml}<duration>${count}</duration><type>${typeByUnits[count] || 'quarter'}</type>${accidentalXml}${isRest ? '' : tieIn + tieOut}${notation}</note>`;
}

export function toMusicXml({ title, author, meter = '4/4', tempo = 100, instrument = 'Instrumento', notes = [] }) {
  const [beats, beatType] = String(meter).split('/').map(Number);
  const measureUnits = Math.max(16, Math.round((beats || 4) * 16 * 4 / (beatType || 4)));
  const measures = [];
  let items = [];
  let used = 0;
  const closeMeasure = () => { measures.push(items); items = []; used = 0; };

  for (const original of notes) {
    const note = original.pitch === 'REST' ? { ...original, dur: original.dur || 1 } : original;
    let remaining = Math.max(1, Math.round((Number(note.dur) || 1) * 16));
    const chunks = [];
    while (remaining > 0) {
      if (used >= measureUnits) closeMeasure();
      const available = measureUnits - used;
      const unit = units.find((x) => x <= Math.min(remaining, available)) || 1;
      chunks.push({ unit, measure: measures.length });
      remaining -= unit;
      used += unit;
      if (used === measureUnits && remaining) closeMeasure();
    }
    chunks.forEach(({ unit, measure }, index) => {
      const xml = noteXml(note, unit, index === 0, index === chunks.length - 1, chunks.length > 1);
      if (measure === measures.length) items.push(xml);
      else measures[measure].push(xml);
    });
    if (used === measureUnits) closeMeasure();
  }
  if (items.length || measures.length === 0) closeMeasure();
  const rendered = measures.map((notesInMeasure, index) => `<measure number="${index + 1}">${index === 0 ? `<attributes><divisions>16</divisions><key><fifths>0</fifths></key><time><beats>${beats || 4}</beats><beat-type>${beatType || 4}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${Math.max(30, Math.min(250, Number(tempo) || 100))}</per-minute></metronome></direction-type><sound tempo="${Math.max(30, Math.min(250, Number(tempo) || 100))}"/></direction>` : ''}${notesInMeasure.join('')}</measure>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE score-partwise  PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="4.0"><work><work-title>${esc(title || 'Sem título')}</work-title></work><movement-title>${esc(title || 'Sem título')}</movement-title><identification><creator type="composer">${esc(author || 'Estudante')}</creator></identification><defaults><scaling><millimeters>7</millimeters><tenths>40</tenths></scaling></defaults><part-list><score-part id="P1"><part-name>${esc(instrument)}</part-name><part-abbreviation>Inst.</part-abbreviation><score-instrument id="I1"><instrument-name>Piano</instrument-name></score-instrument></score-part></part-list><part id="P1">${rendered}</part></score-partwise>`;
}

export function downloadMusicXml(score) {
  const xml = toMusicXml(score);
  const blob = new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `${String(score.title || 'sonorum-partitura').normalize('NFKD').replace(/[^\w\d-]+/g, '-').toLowerCase()}.musicxml`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
