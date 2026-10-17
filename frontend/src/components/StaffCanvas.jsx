import React from 'react';
import { PITCH_CATALOG, getPitchInfo } from '../constants/musicCatalog.js';

const WIDTH = 940;
const STEP = 60;
const START = 166;
const PER_ROW = 12;
const ROW_HEIGHT = 176;
const STAFF_TOP = 61;
const PITCHES = PITCH_CATALOG;

export default function StaffCanvas({ notes = [], meter = '4/4', interactive = false, highlightIndex = -1, selectedIndex = -1, compact = false, onAddPitch, onInsertPitch, onSelectNote, onRemoveNote }) {
  const rows = compact ? 1 : Math.max(2, Math.ceil((notes.length + 1) / PER_ROW));
  const height = rows * ROW_HEIGHT + (compact ? 0 : 18);
  const [numerator, denominator] = String(meter || '4/4').split('/');
  const beats = (Number(numerator) || 4) * 4 / (Number(denominator) || 4);
  const normalY = (pitch, row) => getPitchInfo(pitch)?.y - 86 + STAFF_TOP + row * ROW_HEIGHT;

  function clickBlank(event) {
    if (!interactive || (!onInsertPitch && !onAddPitch)) return;
    const svg = event.currentTarget;
    const bounds = svg.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * WIDTH / bounds.width;
    const y = (event.clientY - bounds.top) * height / bounds.height;
    const row = Math.min(rows - 1, Math.floor(y / ROW_HEIGHT));
    const position = Math.min(notes.length, Math.max(0, row * PER_ROW + Math.round((x - START) / STEP)));
    const localY = y - row * ROW_HEIGHT + 86 - STAFF_TOP;
    const closest = PITCHES.reduce((best, candidate) => Math.abs(candidate.y - localY) < Math.abs(best.y - localY) ? candidate : best, PITCHES[0]);
    if (Math.abs(closest.y - localY) > 37) return;
    if (onInsertPitch) onInsertPitch(closest.id, position);
    else onAddPitch(closest.id);
  }

  let elapsed = 0;
  const bars = notes.map((note, index) => {
    elapsed += Number(note.dur) || 1;
    const atBar = elapsed >= beats - 0.001;
    if (atBar) elapsed %= beats;
    return atBar;
  });

  return <svg className={`staff-svg ${compact ? 'staff-svg-compact' : 'staff-svg-workspace'}`} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={`Partitura em ${meter} com ${notes.length} notas e pausas`} onClick={clickBlank}>
    {Array.from({ length: rows }, (_, row) => {
      const base = row * ROW_HEIGHT;
      return <g key={row}>
        {[0, 16, 32, 48, 64].map(offset => <line key={offset} x1="40" x2="899" y1={STAFF_TOP + base + offset} y2={STAFF_TOP + base + offset} stroke="#3b3b45" strokeWidth="1.15" />)}
        <line x1="40" y1={STAFF_TOP + base} x2="40" y2={STAFF_TOP + base + 64} stroke="#282631" strokeWidth="2" />
        <text x="53" y={base + STAFF_TOP + 55} fontSize="64" fontFamily="serif" fill="#2b2530">𝄞</text>
        {row === 0 && <g fontSize="23" fontFamily="Georgia, serif" fontWeight="bold" fill="#2b2530"><text x="113" y={base + STAFF_TOP + 26}>{numerator}</text><text x="113" y={base + STAFF_TOP + 53}>{denominator}</text></g>}
        {row > 0 && <line x1="899" y1={base + STAFF_TOP} x2="899" y2={base + STAFF_TOP + 64} stroke="#3b3b45" strokeWidth="1" />}
      </g>;
    })}
    {notes.map((note, index) => {
      const row = Math.floor(index / PER_ROW);
      if (row >= rows) return null;
      const x = START + (index % PER_ROW) * STEP;
      const y = note.pitch === 'REST' ? STAFF_TOP + row * ROW_HEIGHT + 32 : normalY(note.pitch, row);
      const active = selectedIndex === index;
      const playing = highlightIndex === index;
      const color = playing ? '#387b68' : active ? '#a34e44' : '#292634';
      const dur = Number(note.dur) || 1;
      const isRest = note.pitch === 'REST';
      const stemUp = isRest ? true : y >= STAFF_TOP + row * ROW_HEIGHT + 33;
      const yStem = stemUp ? y - 39 : y + 39;
      const stemX = stemUp ? x + 7 : x - 7;
      const selectNote = (event) => {
        event.stopPropagation();
        if (!interactive) return;
        if (onSelectNote) onSelectNote(index);
        else if (onRemoveNote) onRemoveNote(index);
      };
      return <g key={index} onClick={selectNote} tabIndex={interactive ? 0 : undefined} role={interactive ? 'button' : undefined} aria-label={interactive ? `Selecionar ${isRest ? 'pausa' : getPitchInfo(note.pitch)?.displayLabel} na posição ${index + 1}` : undefined} onKeyDown={interactive ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNote(event); } } : undefined} style={{ cursor: interactive ? 'pointer' : 'default' }}>
        {(active || playing) && <rect x={x - 24} y={row * ROW_HEIGHT + 31} width="47" height="126" rx="6" fill={playing ? 'rgba(66,153,129,.16)' : 'rgba(178,95,76,.13)'} />}
        <rect x={x - 24} y={row * ROW_HEIGHT + 28} width="46" height="138" fill="transparent" />
        {!isRest && y >= STAFF_TOP + row * ROW_HEIGHT + 80 && <line x1={x - 15} y1={row * ROW_HEIGHT + STAFF_TOP + 80} x2={x + 15} y2={row * ROW_HEIGHT + STAFF_TOP + 80} stroke={color} strokeWidth="1.5" />}
        {isRest ? <text x={x - 11} y={y + 11} fontSize="31" fontFamily="serif" fill={color}>𝄽</text> : <>
          {getPitchInfo(note.pitch)?.isSharp && <text x={x - 24} y={y + 6} fontFamily="serif" fontSize="22" fill={color}>♯</text>}
          {getPitchInfo(note.pitch)?.isFlat && <text x={x - 24} y={y + 6} fontFamily="serif" fontSize="22" fill={color}>♭</text>}
          <ellipse cx={x} cy={y} rx="8.5" ry="5.8" transform={`rotate(-20 ${x} ${y})`} fill={dur >= 2 ? '#fff' : color} stroke={color} strokeWidth="2" />
          {dur < 4 && <line x1={stemX} y1={y} x2={stemX} y2={yStem} stroke={color} strokeWidth="2" />}
          {dur < 1 && <path d={`M ${stemX} ${yStem} q ${stemUp ? 21 : -21} 7 ${stemUp ? 14 : -14} ${stemUp ? 23 : -23}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
          {dur <= .25 && <path d={`M ${stemX} ${yStem + (stemUp ? 10 : -10)} q ${stemUp ? 21 : -21} 7 ${stemUp ? 14 : -14} ${stemUp ? 23 : -23}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        </>}
        {!compact && <text x={x} y={row * ROW_HEIGHT + 163} fontFamily="DM Sans, sans-serif" fontSize="10" textAnchor="middle" fill={active ? '#a34e44' : '#aaa2a0'}>{isRest ? 'Pausa' : getPitchInfo(note.pitch)?.displayLabel}</text>}
        {bars[index] && <line x1={x + STEP / 2} y1={STAFF_TOP + row * ROW_HEIGHT} x2={x + STEP / 2} y2={STAFF_TOP + row * ROW_HEIGHT + 64} stroke="#59515e" strokeWidth="1.3" />}
      </g>;
    })}
    {interactive && notes.length === 0 && <text x="230" y="160" fontSize="13" fill="#aba6a7">Clique sobre a pauta para inserir sua primeira nota</text>}
  </svg>;
}
