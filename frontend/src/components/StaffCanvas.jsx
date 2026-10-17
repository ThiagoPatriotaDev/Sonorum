import React from 'react';
import { PITCH_CATALOG, getPitchInfo } from '../constants/musicCatalog.js';

export default function StaffCanvas({
  notes = [],
  meter = '4/4',
  interactive = false,
  highlightIndex = -1,
  compact = false,
  onAddPitch = null,
  onRemoveNote = null
}) {
  const beatsPerMeasure = parseInt(meter.split('/')[0], 10) || 4;
  const startX = 115;
  const stepX = compact ? 44 : 56;
  const totalWidth = Math.max(compact ? 520 : 920, startX + (notes.length + 2) * stepX);
  const staffLinesY = [86, 102, 118, 134, 150];
  const [num, den] = meter.split('/');

  const handleSvgClick = (e) => {
    if (!interactive || !onAddPitch) return;
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    const clickY = ((e.clientY - rect.top) / rect.height) * 230;

    let closest = PITCH_CATALOG[0];
    let minDiff = Math.abs(clickY - closest.y);
    for (const p of PITCH_CATALOG) {
      const diff = Math.abs(clickY - p.y);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    if (minDiff <= 28) {
      onAddPitch(closest.id);
    }
  };

  let beatAccumulator = 0;

  return (
    <svg
      className="staff-svg"
      viewBox={`0 0 ${totalWidth} ${compact ? 185 : 230}`}
      style={{ minWidth: compact ? '100%' : `${totalWidth}px` }}
      onClick={handleSvgClick}
    >
      {staffLinesY.map((y) => (
        <line key={y} x1="25" y1={y} x2={totalWidth - 25} y2={y} stroke="#334155" strokeWidth="1.4" />
      ))}

      <line x1="25" y1="86" x2="25" y2="150" stroke="#0f172a" strokeWidth="3" />
      <text x="36" y="142" fontSize="64" fontFamily="serif" fill="#0f172a">𝄞</text>
      <text x="82" y="114" fontSize="24" fontWeight="800" fontFamily="serif" fill="#0f172a">{num}</text>
      <text x="82" y="144" fontSize="24" fontWeight="800" fontFamily="serif" fill="#0f172a">{den}</text>

      {notes.map((n, idx) => {
        const x = startX + idx * stepX;
        const dur = n.dur === 'rest' ? 1 : Number(n.dur || 1);
        const isHighlighted = idx === highlightIndex;
        const color = isHighlighted ? '#4f46e5' : '#0f172a';

        beatAccumulator += dur;
        const drawBarLine = beatAccumulator >= beatsPerMeasure;
        if (drawBarLine) {
          beatAccumulator = beatAccumulator % beatsPerMeasure;
        }

        if (n.pitch === 'REST' || n.dur === 'rest') {
          return (
            <g
              key={idx}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              onClick={(e) => {
                e.stopPropagation();
                if (interactive && onRemoveNote) onRemoveNote(idx);
              }}
            >
              {isHighlighted && (
                <rect x={x - 18} y="62" width="36" height="125" rx="6" fill="rgba(79, 70, 229, 0.12)" />
              )}
              <text x={x - 8} y="126" fontSize="28" fill={color}>𝄽</text>
              {!compact && <text x={x} y="196" fontSize="11" textAnchor="middle" fill="#64748b">Pausa</text>}
              {drawBarLine && (
                <line x1={x + stepX / 2} y1="86" x2={x + stepX / 2} y2="150" stroke="#475569" strokeWidth="1.5" />
              )}
            </g>
          );
        }

        const info = getPitchInfo(n.pitch);
        const y = info.y;
        const isOpenHead = dur >= 2;
        const stemUp = y >= 118;

        return (
          <g
            key={idx}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive && onRemoveNote) onRemoveNote(idx);
            }}
          >
            {isHighlighted && (
              <rect x={x - 18} y="62" width="36" height="125" rx="6" fill="rgba(79, 70, 229, 0.12)" />
            )}
            {info.ledger && (
              <line x1={x - 14} y1="166" x2={x + 14} y2="166" stroke={color} strokeWidth="1.8" />
            )}
            {info.isSharp && (
              <text x={x - 22} y={y + 5} fontSize="16" fontWeight="700" fill={color}>♯</text>
            )}
            <ellipse
              cx={x}
              cy={y}
              rx="7.5"
              ry="5.5"
              transform={`rotate(-18 ${x} ${y})`}
              fill={isOpenHead ? '#ffffff' : color}
              stroke={color}
              strokeWidth="2"
            />
            {dur < 4 && (
              stemUp ? (
                <line x1={x + 6.5} y1={y} x2={x + 6.5} y2={y - 34} stroke={color} strokeWidth="1.8" />
              ) : (
                <line x1={x - 6.5} y1={y} x2={x - 6.5} y2={y + 34} stroke={color} strokeWidth="1.8" />
              )
            )}
            {!compact && (
              <text x={x} y="198" fontSize="11" fontWeight="600" textAnchor="middle" fill={color}>
                {info.displayLabel}
              </text>
            )}
            {drawBarLine && (
              <line x1={x + stepX / 2} y1="86" x2={x + stepX / 2} y2="150" stroke="#475569" strokeWidth="1.5" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
