import React, { useState } from 'react';
import StaffCanvas from '../components/StaffCanvas.jsx';
import MusicXmlPreview from '../components/MusicXmlPreview.jsx';
import { downloadMusicXml } from '../utils/musicXml.js';
import { PITCH_CATALOG, DURATION_OPTIONS } from '../constants/musicCatalog.js';
import { AudioEngine } from '../services/audioEngine.js';

export default function ScoreEditorPage({ initialScore, onSaveScore, onResetNew }) {
  const [title, setTitle] = useState(initialScore?.title || 'Estudo Melódico nº 1');
  const [author, setAuthor] = useState(initialScore?.author || 'Estudante de Música');
  const [instrument, setInstrument] = useState(initialScore?.instrument || 'Violão');
  const [tempo, setTempo] = useState(initialScore?.tempo || 100);
  const [meter, setMeter] = useState(initialScore?.meter || '4/4');
  const [annotations, setAnnotations] = useState(initialScore?.annotations || '');
  const [notes, setNotes] = useState(
    initialScore?.notes || [
      { pitch: 'C4', dur: 1 },
      { pitch: 'D4', dur: 1 },
      { pitch: 'E4', dur: 1 },
      { pitch: 'F4', dur: 1 },
      { pitch: 'G4', dur: 2 },
      { pitch: 'C5', dur: 2 }
    ]
  );

  const [currentDuration, setCurrentDuration] = useState(1);
  const [isSharp, setIsSharp] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [viewMode, setViewMode] = useState('edit');

  const handleAddPitch = (basePitchId) => {
    if (currentDuration === 'rest') {
      setNotes((prev) => [...prev, { pitch: 'REST', dur: 1 }]);
      return;
    }
    const finalPitch = isSharp ? basePitchId.replace(/^([A-G])/, '$1#') : basePitchId;
    const durNum = Number(currentDuration);
    setNotes((prev) => [...prev, { pitch: finalPitch, dur: durNum }]);
    AudioEngine.playNote(finalPitch, durNum, instrument, Number(tempo) || 100);
  };

  const handleRemoveNote = (index) => {
    setNotes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePlay = () => {
    AudioEngine.playSequence(notes, {
      instrument,
      bpm: Number(tempo) || 100,
      onStep: (idx) => setHighlightIndex(idx)
    });
  };

  const handleSave = () => {
    if (notes.length === 0) return;
    onSaveScore({
      id: initialScore?.id || null,
      title,
      author,
      instrument,
      tempo: Number(tempo) || 100,
      meter,
      annotations,
      notes
    });
  };

  const scoreForExport = { title, author, instrument, tempo, meter, notes };

  return (
    <section className="editor-page">
      <div className="editor-masthead"><span className="section-index">SONORUM / ESTÚDIO DE CRIAÇÃO</span><span className="studio-flourish">♪ COMPOSIÇÃO LIVRE</span></div>
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {initialScore?.id ? `Editando: ${initialScore.title}` : 'Dê forma ao seu som.'}
          </h1>
          <p className="section-subtitle">
            Clique nas linhas/espaços da pauta ou nos botões rápidos para compor sua partitura.
          </p>
        </div>
        <div className="editor-top-actions">
          <button className="btn btn-secondary" onClick={onResetNew}>+ Nova partitura</button>
          <button className="btn btn-secondary" onClick={() => downloadMusicXml(scoreForExport)}>↓ Exportar MusicXML</button>
          <button className="btn btn-primary" onClick={handleSave}>Salvar composição ↗</button>
        </div>
      </div>

      <div className="editor-panel" style={{ marginBottom: '1.25rem' }}>
        <div className="form-row">
          <div>
            <label>Título da Partitura</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label>Autor / Estudante</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div>
            <label>Instrumento</label>
            <select value={instrument} onChange={(e) => setInstrument(e.target.value)}>
              <option value="Violino">🎻 Violino</option>
              <option value="Violão">🎸 Violão</option>
              <option value="Teclado">🎹 Teclado / Piano</option>
              <option value="Flauta">🪈 Flauta Doce</option>
            </select>
          </div>
          <div>
            <label>Andamento (BPM)</label>
            <input type="number" value={tempo} onChange={(e) => setTempo(e.target.value)} />
          </div>
          <div>
            <label>Compasso</label>
            <select value={meter} onChange={(e) => setMeter(e.target.value)}>
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="2/4">2/4</option>
            </select>
          </div>
        </div>

        <div className="toolbar-row">
          <div className="tool-group">
            <label>1. Figura Rítmica</label>
            <div className="btn-group">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`dur-btn ${currentDuration === opt.value ? 'active' : ''}`}
                  onClick={() => setCurrentDuration(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-group">
            <label>2. Acidente</label>
            <button
              type="button"
              className={`dur-btn ${isSharp ? 'active' : ''}`}
              onClick={() => setIsSharp(!isSharp)}
            >
              ♯ Sustenido {isSharp ? '(Ativo)' : '(Inativo)'}
            </button>
          </div>

          <div className="tool-group">
            <label>3. Inserção Rápida de Notas</label>
            <div className="btn-group">
              {PITCH_CATALOG.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="pitch-btn"
                  onClick={() => handleAddPitch(p.id)}
                >
                  {p.solfege}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="editor-panel">
        <div className="staff-hint">
          <span>Clique na pauta para inserir notas ou sobre uma nota existente para apagá-la.</span>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button className="btn btn-success btn-sm" onClick={handlePlay}>▶ Ouvir Partitura</button>
            <button className="btn btn-secondary btn-sm" onClick={() => AudioEngine.stop()}>⏹ Parar</button>
            <button className="btn btn-danger btn-sm" onClick={() => setNotes([])}>🗑 Limpar</button>
          </div>
        </div>

        <div className="editor-view-switch"><button className={viewMode === 'edit' ? 'active' : ''} onClick={() => setViewMode('edit')}>Editar notas</button><button className={viewMode === 'preview' ? 'active' : ''} onClick={() => setViewMode('preview')}>Visualização profissional ✳</button></div>
        {viewMode === 'edit' ? <div className="staff-container">
          <StaffCanvas
            notes={notes}
            meter={meter}
            interactive={true}
            highlightIndex={highlightIndex}
            onAddPitch={handleAddPitch}
            onRemoveNote={handleRemoveNote}
          />
        </div> : <MusicXmlPreview score={scoreForExport} />}

        <div style={{ marginTop: '1rem' }}>
          <label>Anotações de Estudo / Cifras</label>
          <textarea
            rows="3"
            value={annotations}
            onChange={(e) => setAnnotations(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
