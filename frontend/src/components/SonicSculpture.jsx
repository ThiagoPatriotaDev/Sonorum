import React, { useState } from 'react';

const WIDTH = 600;
const wave = (phase, amplitude, offset = 0) => Array.from({ length: 120 }, (_, i) => {
  const x = i * WIDTH / 119;
  const envelope = Math.pow(Math.sin(Math.PI * i / 119), 1.5);
  const y = 230 + offset + Math.sin(i * .135 + phase) * amplitude * envelope + Math.cos(i * .073 + phase) * 28 * envelope;
  return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
}).join(' ');

export default function SonicSculpture({ compact = false }) {
  const [move, setMove] = useState({ x: 0, y: 0 });
  return (
    <div className={`sculpture ${compact ? 'sculpture-compact' : ''}`}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const box = e.currentTarget.getBoundingClientRect();
        setMove({ x: ((e.clientX - box.left) / box.width - 0.5) * 9, y: ((e.clientY - box.top) / box.height - 0.5) * -9 });
      }}
      onPointerLeave={() => setMove({ x: 0, y: 0 })}
      role="img" aria-label="Escultura abstrata de ondas sonoras douradas e coral, com anéis tridimensionais">
      <div className="sculpture-glow" />
      <div className="sculpture-orbit sculpture-orbit-one" />
      <div className="sculpture-orbit sculpture-orbit-two" />
      <div className="sculpture-inner" style={{ '--mx': `${move.x}deg`, '--my': `${move.y}deg` }}>
        <div className="sculpture-disc"><span>SONORUM</span><small>001 / O som nos move</small><i>♫</i></div>
        <svg className="wave-art" viewBox="0 0 600 460" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="sonorum-gold" x1="0" y1="0" x2="600" y2="460" gradientUnits="userSpaceOnUse"><stop stopColor="#ffcd8a"/><stop offset=".5" stopColor="#e69a77"/><stop offset="1" stopColor="#eae0c6"/></linearGradient>
            <linearGradient id="sonorum-pink" x1="0" y1="100" x2="600" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="#e9b4ac"/><stop offset=".55" stopColor="#9b7894"/><stop offset="1" stopColor="#ffba72"/></linearGradient>
          </defs>
          {Array.from({ length: 17 }, (_, i) => <path key={i} d={wave(i * .14, 108 - i * 2.9, (i - 8) * 3.1)} stroke={i % 2 ? 'url(#sonorum-gold)' : 'url(#sonorum-pink)'} strokeWidth={i % 4 === 0 ? 2.5 : 1.35} opacity={.43 + i * .03} />)}
        </svg>
      </div>
      <span className="sculpture-corner top">FIG. 01 / FREQUÊNCIA</span><span className="sculpture-corner bottom">440 Hz / A4</span>
    </div>
  );
}
