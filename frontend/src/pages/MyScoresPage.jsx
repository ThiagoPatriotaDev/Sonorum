import React, { useState } from 'react';
import StaffCanvas from '../components/StaffCanvas.jsx';
import { AudioEngine } from '../services/audioEngine.js';
import { exportScoreAsJSON } from '../utils/exportUtils.js';
import { downloadMusicXml } from '../utils/musicXml.js';

export default function MyScoresPage({ scores, onEditScore, onDeleteScore, onNewScore }) {
  const [search, setSearch] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('TODOS');

  const filtered = scores.filter((s) => {
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author.toLowerCase().includes(search.toLowerCase());
    const matchesInst = instrumentFilter === 'TODOS' || s.instrument === instrumentFilter;
    return matchesSearch && matchesInst;
  });

  return (
    <section className="library-page">
      <div className="editor-masthead"><span className="section-index">SONORUM / MINHA BIBLIOTECA</span><span className="studio-flourish">ARQUIVO PESSOAL</span></div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Minhas Partituras Salvas</h1>
          <p className="section-subtitle">
            Edite, ouça, baixe em JSON, imprima ou exclua suas partituras salvas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNewScore}>+ Nova Partitura</button>
      </div>

      <div className="filter-bar">
        <div style={{ flex: 2 }}>
          <label>Buscar por título ou autor</label>
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Filtrar por instrumento</label>
          <select value={instrumentFilter} onChange={(e) => setInstrumentFilter(e.target.value)}>
            <option value="TODOS">Todos os instrumentos</option>
            <option value="Violino">🎻 Violino</option>
            <option value="Violão">🎸 Violão</option>
            <option value="Teclado">🎹 Teclado / Piano</option>
            <option value="Flauta">🪈 Flauta Doce</option>
          </select>
        </div>
      </div>

      <div className="scores-grid">
        {filtered.length === 0 && <div className="library-empty"><span>♫</span><h3>{scores.length ? 'Nenhuma composição encontrada.' : 'Uma biblioteca inteira para começar.'}</h3><p>{scores.length ? 'Tente outro termo ou instrumento.' : 'Suas partituras salvas neste navegador aparecerão aqui.'}</p><button className="btn btn-primary" onClick={onNewScore}>Criar minha primeira partitura ↗</button></div>}
        {filtered.map((score) => (
          <article key={score.id} className="score-card">
            <div className="score-card-header">
              <div>
                <h3 className="score-title">{score.title}</h3>
                <div className="score-meta">Por {score.author} • {score.updatedAt}</div>
              </div>
              <span className="level-pill">{score.instrument}</span>
            </div>

            <div className="score-preview-box">
              <StaffCanvas notes={score.notes.slice(0, 9)} meter={score.meter} compact={true} />
            </div>

            <div className="score-actions">
              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  AudioEngine.playSequence(score.notes, {
                    instrument: score.instrument,
                    bpm: score.tempo
                  })
                }
              >
                ▶ Ouvir
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onEditScore(score)}>
                ✏️ Editar
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => downloadMusicXml(score)}>↓ MusicXML</button>
              <button className="btn btn-secondary btn-sm" onClick={() => exportScoreAsJSON(score)}>↓ JSON</button>
              <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                🖨 Imprimir
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onDeleteScore(score.id)}>
                🗑 Apagar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
