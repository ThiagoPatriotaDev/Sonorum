import React, { useEffect, useRef, useState } from 'react';
import StaffCanvas from '../components/StaffCanvas.jsx';
import MusicXmlPreview from '../components/MusicXmlPreview.jsx';
import { downloadMusicXml } from '../utils/musicXml.js';
import { exportScoreAsJSON } from '../utils/exportUtils.js';
import { PITCH_CATALOG } from '../constants/musicCatalog.js';
import { AudioEngine } from '../services/audioEngine.js';

const DURATIONS = [
  { dur: 4, label: '𝅝', name: 'Semibreve' },
  { dur: 2, label: '𝅗𝅥', name: 'Mínima' },
  { dur: 1, label: '♩', name: 'Semínima' },
  { dur: .5, label: '♪', name: 'Colcheia' },
  { dur: .25, label: '♬', name: 'Semicolcheia' }
];
const INSTRUMENTS = ['Violão', 'Violino', 'Teclado', 'Flauta', 'Canto', 'Baixo', 'Saxofone', 'Bateria'];
const SOLFEGE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const WHITE_PIANO = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const BLACK_PIANO = [{ pitch:'C#4', after: 0 },{ pitch:'D#4',after:1 },{ pitch:'F#4',after:3 },{ pitch:'G#4',after:4 },{ pitch:'A#4',after:5 }];
const PITCH_PATTERN = /^(REST|[A-G][#b]?[0-8])$/;

export default function ScoreEditorPage({ initialScore, onSaveScore, onBack, onNewScore, onDirtyChange }) {
  const [id, setId] = useState(initialScore?.id || null);
  const [title, setTitle] = useState(initialScore?.title || 'Partitura sem título');
  const [author, setAuthor] = useState(initialScore?.author || '');
  const [instrument, setInstrument] = useState(initialScore?.instrument || 'Violão');
  const [meter, setMeter] = useState(initialScore?.meter || '4/4');
  const [tempo, setTempo] = useState(initialScore?.tempo || 100);
  const [annotations, setAnnotations] = useState(initialScore?.annotations || '');
  const [timeline, setTimeline] = useState({ past: [], present: initialScore?.notes || [], future: [] });
  const notes = timeline.present;
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [duration, setDuration] = useState(1);
  const [accidental, setAccidental] = useState('natural');
  const [toolTab, setToolTab] = useState('notas');
  const [viewMode, setViewMode] = useState('edit');
  const [zoom, setZoom] = useState(100);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [saved, setSaved] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showPiano, setShowPiano] = useState(true);
  const uploadRef = useRef(null);

  const changeMeta = (setter) => (event) => { setter(event.target.value); setSaved(false); };
  const editNotes = (update) => {
    setTimeline((old) => {
      const next = typeof update === 'function' ? update(old.present) : update;
      if (next === old.present) return old;
      return { past: [...old.past.slice(-49), old.present], present: next, future: [] };
    });
    setSaved(false);
    setFeedback('');
  };
  const insertNote = (basePitch, index = null) => {
    const actual = basePitch === 'REST' ? 'REST' : basePitch.replace(/^([A-G])([#b]?)([0-8])$/, (_all, letter, symbol, octave) => `${letter}${symbol || (accidental === 'sharp' ? '#' : accidental === 'flat' ? 'b' : '')}${octave}`);
    const destination = index == null ? (selectedIndex >= 0 ? selectedIndex + 1 : notes.length) : index;
    editNotes((before) => [...before.slice(0, destination), { pitch: actual, dur: duration }, ...before.slice(destination)]);
    setSelectedIndex(destination);
    if (actual !== 'REST') AudioEngine.playNote(actual, duration, instrument, Number(tempo) || 100);
  };
  const removeSelected = () => {
    if (selectedIndex < 0) return;
    editNotes((before) => before.filter((_, index) => index !== selectedIndex));
    setSelectedIndex(-1);
  };
  const modifySelected = (update) => {
    if (selectedIndex < 0 || selectedIndex >= notes.length) return;
    editNotes((before) => before.map((note, index) => index === selectedIndex ? update(note) : note));
  };
  const pickDuration = (next) => {
    setDuration(next);
    if (selectedIndex !== -1) modifySelected((note) => ({ ...note, dur: next }));
  };
  const pickAccidental = (next) => {
    setAccidental(next);
    if (selectedIndex >= 0) modifySelected((note) => note.pitch === 'REST' ? note : ({ ...note, pitch: note.pitch.replace(/^([A-G])[#b]?([0-8])$/, `$1${next === 'sharp' ? '#' : next === 'flat' ? 'b' : ''}$2`) }));
  };
  const changePitch = (direction) => {
    if (selectedIndex < 0) return;
    modifySelected((note) => {
      if (note.pitch === 'REST') return note;
      const basic = note.pitch.replace(/[#b]/g, '');
      const index = PITCH_CATALOG.findIndex((p) => p.id === basic);
      if (index < 0) return note;
      return { ...note, pitch: PITCH_CATALOG[Math.min(PITCH_CATALOG.length - 1, Math.max(0, index + direction))].id };
    });
  };
  const moveSelected = (direction) => {
    if (selectedIndex < 0 || selectedIndex + direction < 0 || selectedIndex + direction >= notes.length) return;
    editNotes((before) => {
      const next = [...before];
      [next[selectedIndex], next[selectedIndex + direction]] = [next[selectedIndex + direction], next[selectedIndex]];
      return next;
    });
    setSelectedIndex(selectedIndex + direction);
  };
  const undo = () => {
    setTimeline((old) => old.past.length ? { present: old.past.at(-1), past: old.past.slice(0,-1), future: [old.present,...old.future] } : old);
    setSelectedIndex(-1);
    setSaved(false);
  };
  const redo = () => {
    setTimeline((old) => old.future.length ? { present: old.future[0], past: [...old.past,old.present], future:old.future.slice(1) } : old);
    setSelectedIndex(-1);
    setSaved(false);
  };
  const score = { id, title: title.trim() || 'Partitura sem título', author, instrument, tempo: Number(tempo) || 100, meter, annotations, notes };
  const save = () => {
    try {
      const stored = onSaveScore(score);
      if (stored?.id) { setId(stored.id); setSaved(true); setFeedback('Partitura salva neste navegador.'); }
    } catch(error) { setFeedback(error.message || 'Não foi possível salvar.'); }
  };
  const guardedNavigation = (action) => {
    if (!saved && !window.confirm('Há alterações não salvas nesta partitura. Deseja sair sem salvar?')) return;
    AudioEngine.stop(); action();
  };
  const play = () => AudioEngine.playSequence(notes, { instrument, bpm:Number(tempo) || 100, onStep:setHighlightIndex, onFinish:()=>setHighlightIndex(-1) });
  const stop = () => { AudioEngine.stop(); setHighlightIndex(-1); };
  const importJSON = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('O arquivo é muito grande (limite de 1 MB).');
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.notes) || data.notes.length > 2000 || !data.notes.every(n => PITCH_PATTERN.test(n.pitch) && [4,2,1,.5,.25].includes(Number(n.dur)))) throw new Error('Formato de notas inválido. Importe um JSON exportado do Sonorum.');
      editNotes(data.notes.map(n=>({ pitch:n.pitch, dur:Number(n.dur) })));
      setSelectedIndex(-1); setId(null);
      setTitle(typeof data.title === 'string' ? data.title.slice(0,130) : 'Partitura importada');
      setAuthor(typeof data.author === 'string' ? data.author.slice(0,130) : '');
      setInstrument(INSTRUMENTS.includes(data.instrument) ? data.instrument : 'Violão');
      setMeter(['2/4','3/4','4/4','6/8'].includes(data.meter) ? data.meter : '4/4');
      setTempo(Math.max(30,Math.min(240,Number(data.tempo) || 100)));
      setAnnotations(typeof data.annotations === 'string' ? data.annotations.slice(0,1000) : '');
      setFeedback('Partitura importada. Salve para adicioná-la aos recentes.');
    } catch (error) { setFeedback(error.message || 'Falha ao importar JSON.'); }
  };

  useEffect(() => () => AudioEngine.stop(), []);
  useEffect(() => { onDirtyChange?.(!saved); }, [saved, onDirtyChange]);
  useEffect(() => {
    if (saved) return;
    const guard = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [saved]);
  useEffect(() => {
    const onKey = (event) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
      else if (modifier && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      else if (modifier && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
      else if (!modifier && (event.key === 'Delete' || event.key === 'Backspace') && selectedIndex >= 0) { event.preventDefault(); removeSelected(); }
      else if (!modifier && event.key === 'ArrowUp' && selectedIndex >= 0) { event.preventDefault(); changePitch(1); }
      else if (!modifier && event.key === 'ArrowDown' && selectedIndex >= 0) { event.preventDefault(); changePitch(-1); }
      else if (!modifier && /^[1-7]$/.test(event.key)) { event.preventDefault(); insertNote(SOLFEGE[Number(event.key)-1]); }
      else if (!modifier && event.key === 'Escape') setSelectedIndex(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <section className="studio-editor" aria-label="Editor de partituras Sonorum">
    <div className="studio-titlebar"><div className="studio-title-left"><button className="studio-back" onClick={()=>guardedNavigation(onBack)}>← <span>Partituras</span></button><span className="studio-title-separator"/><span className="studio-document-label">{title || 'Sem título'}</span><span className={`studio-save-state ${saved ? 'is-saved' : ''}`}>{saved ? '✓ Salvo' : '● Não salvo'}</span></div><div className="studio-title-actions"><button title="Desfazer (Ctrl+Z)" disabled={!timeline.past.length} onClick={undo}>↶</button><button title="Refazer (Ctrl+Y)" disabled={!timeline.future.length} onClick={redo}>↷</button><button onClick={()=>window.print()} title="Imprimir ou salvar em PDF">⎙ <span>Imprimir / PDF</span></button><button className="studio-save-button" onClick={save}>Salvar</button></div></div>
    <nav className="studio-ribbon-tabs" aria-label="Ferramentas da partitura">{[{id:'notas',label:'Notas'},{id:'compasso',label:'Compasso'},{id:'texto',label:'Detalhes'},{id:'arquivo',label:'Arquivo'},{id:'visualizar',label:'Visualizar'}].map(tab=><button key={tab.id} className={toolTab === tab.id ? 'active' : ''} onClick={()=>setToolTab(tab.id)} aria-pressed={toolTab === tab.id}>{tab.label}</button>)}</nav>
    <div className="studio-ribbon" aria-label="Barra de ferramentas">
      {toolTab === 'notas' && <><div className="ribbon-group"><div className="ribbon-tools">{DURATIONS.map(opt=><button key={opt.dur} className={`ribbon-symbol ${duration === opt.dur ? 'active' : ''}`} title={opt.name} onClick={()=>pickDuration(opt.dur)}>{opt.label}</button>)}<button className="ribbon-symbol" title="Adicionar pausa" onClick={()=>insertNote('REST')}>𝄽</button></div><small>Duração e pausas</small></div><div className="ribbon-group"><div className="ribbon-tools">{[{id:'natural',label:'♮',name:'Natural'},{id:'sharp',label:'♯',name:'Sustenido'},{id:'flat',label:'♭',name:'Bemol'}].map(o=><button key={o.id} className={`ribbon-symbol ${accidental === o.id ? 'active' : ''}`} title={o.name} onClick={()=>pickAccidental(o.id)}>{o.label}</button>)}</div><small>Acidentes</small></div><div className="ribbon-group"><div className="ribbon-tools">{PITCH_CATALOG.slice(0,8).map(p=><button className="ribbon-note" key={p.id} onClick={()=>insertNote(p.id)} title={`Inserir ${p.label}`}>{p.solfege}</button>)}</div><small>Inserir nota</small></div><div className="ribbon-group"><div className="ribbon-tools"><button onClick={()=>moveSelected(-1)} disabled={selectedIndex < 1}>← Mover</button><button onClick={()=>moveSelected(1)} disabled={selectedIndex < 0 || selectedIndex >= notes.length-1}>Mover →</button><button onClick={removeSelected} disabled={selectedIndex < 0}>Excluir</button></div><small>Nota selecionada</small></div></>}
      {toolTab === 'compasso' && <><div className="ribbon-group"><div className="ribbon-tools">{['2/4','3/4','4/4','6/8'].map(value=><button key={value} className={meter===value ? 'active' : ''} onClick={()=>{setMeter(value);setSaved(false);}}>{value}</button>)}</div><small>Fórmula de compasso</small></div><div className="ribbon-group"><div className="ribbon-tools"><label className="ribbon-input-label">Andamento <input type="number" min="30" max="240" value={tempo} onChange={changeMeta(setTempo)} /></label><span className="ribbon-inline-note">BPM</span></div><small>Velocidade</small></div><div className="ribbon-group"><div className="ribbon-tools"><select aria-label="Instrumento da partitura" value={instrument} onChange={changeMeta(setInstrument)}>{INSTRUMENTS.map(i=><option key={i}>{i}</option>)}</select></div><small>Instrumento</small></div></>}
      {toolTab === 'texto' && <><div className="ribbon-group ribbon-group-wide"><div className="ribbon-tools"><label className="ribbon-input-label">Título<input value={title} onChange={changeMeta(setTitle)} maxLength="130"/></label><label className="ribbon-input-label">Compositor<input value={author} onChange={changeMeta(setAuthor)} maxLength="130" placeholder="Seu nome" /></label></div><small>Informações da obra</small></div><div className="ribbon-group ribbon-group-wide"><div className="ribbon-tools"><label className="ribbon-input-label">Anotações<input value={annotations} onChange={changeMeta(setAnnotations)} maxLength="1000" placeholder="Notas de estudo, cifras..." /></label></div><small>Observações</small></div></>}
      {toolTab === 'arquivo' && <><div className="ribbon-group"><div className="ribbon-tools"><button onClick={()=>guardedNavigation(onNewScore)}>＋ Nova partitura</button><button onClick={save}>Salvar</button><button onClick={()=>uploadRef.current?.click()}>↑ Importar JSON</button></div><small>Documento</small></div><div className="ribbon-group"><div className="ribbon-tools"><button onClick={()=>downloadMusicXml(score)}>↓ MusicXML</button><button onClick={()=>exportScoreAsJSON(score)}>↓ JSON</button><button onClick={()=>window.print()}>⎙ PDF / Impressão</button></div><small>Exportar</small></div><div className="ribbon-group"><div className="ribbon-tools"><button onClick={()=>{ if(window.confirm('Apagar todas as notas desta partitura?')) { editNotes([]);setSelectedIndex(-1); } }} disabled={!notes.length}>Limpar pauta</button></div><small>Editar documento</small></div></>}
      {toolTab === 'visualizar' && <><div className="ribbon-group"><div className="ribbon-tools"><button className={viewMode==='edit'?'active':''} onClick={()=>setViewMode('edit')}>✎ Edição</button><button className={viewMode==='preview'?'active':''} onClick={()=>setViewMode('preview')}>𝄞 Partitura profissional</button></div><small>Modo de visualização</small></div><div className="ribbon-group"><div className="ribbon-tools"><button onClick={()=>setZoom(Math.max(70,zoom-10))}>−</button><span className="zoom-percent">{zoom}%</span><button onClick={()=>setZoom(Math.min(130,zoom+10))}>＋</button></div><small>Zoom</small></div><div className="ribbon-group"><div className="ribbon-tools"><button onClick={()=>setShowPiano(s=>!s)}>{showPiano?'Ocultar':'Mostrar'} piano</button></div><small>Teclado virtual</small></div></>}
    </div>
    <input ref={uploadRef} type="file" accept=".json,application/json" hidden onChange={importJSON} />
    <div className="studio-playing-bar"><div><button onClick={play} aria-label="Reproduzir partitura" title="Timbres sintetizados para estudo (não são gravações do instrumento)">▶ Reproduzir</button><button onClick={stop} aria-label="Parar reprodução">■ Parar</button><span className="studio-playing-info">{meter} &nbsp;·&nbsp; {tempo} BPM &nbsp;·&nbsp; {notes.length} elementos <span className="audio-status-label" title="Os sons são gerados localmente. Não são gravações de instrumentos reais."> · timbre sintetizado</span></span></div><div><button onClick={()=>setViewMode('edit')} className={viewMode==='edit'?'active':''}>Editar</button><button onClick={()=>setViewMode('preview')} className={viewMode==='preview'?'active':''}>Visualizar</button></div></div>
    <div className="studio-document-area"><div className="studio-document-zoom" style={{ zoom:`${zoom}%` }}><div className="studio-paper"><div className="studio-paper-title"><h1>{title || 'Partitura sem título'}</h1><p>{author || 'Compositor'} · {instrument}</p></div>{viewMode === 'edit' ? <div className="studio-paper-staff"><StaffCanvas notes={notes} meter={meter} interactive highlightIndex={highlightIndex} selectedIndex={selectedIndex} onSelectNote={setSelectedIndex} onInsertPitch={insertNote} /></div> : <MusicXmlPreview score={score} />}{annotations && <p className="studio-paper-annotation">{annotations}</p>}</div></div></div>
    {viewMode === 'edit' && <div className="studio-bottom-panel"><div className="studio-bottom-header"><span>PIANO VIRTUAL</span><span>{selectedIndex >= 0 ? `Selecionado: ${notes[selectedIndex]?.pitch} · ${notes[selectedIndex]?.dur} tempo(s)` : 'Clique em uma nota para selecionar · 1–7 para inserir · Del para excluir · Ctrl+Z para desfazer'}</span><button onClick={()=>setShowPiano(s=>!s)}>{showPiano?'Ocultar':'Mostrar'} piano {showPiano?'⌄':'⌃'}</button></div>{showPiano && <div className="studio-piano"><div className="studio-piano-keys">{WHITE_PIANO.map(pitch=><button key={pitch} className="piano-white-key" title={`Inserir ${pitch}`} onClick={()=>insertNote(pitch)}><span>{pitch}</span></button>)}{BLACK_PIANO.map(key=><button key={key.pitch} className="piano-black-key" style={{left:`${(key.after + 1) * 12.5}%`}} onClick={()=>insertNote(key.pitch)} title={`Inserir ${key.pitch}`} aria-label={`Inserir ${key.pitch}`} />)}</div><p>Toque as teclas para inserir notas após a seleção. Use ↑ ↓ para ajustar a altura de uma nota selecionada.</p></div>}</div>}
    {feedback && <p className="studio-feedback" role="status">{feedback}</p>}
  </section>;
}
