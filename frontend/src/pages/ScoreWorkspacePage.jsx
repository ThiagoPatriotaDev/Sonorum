import React, { useMemo, useState } from 'react';
import StaffCanvas from '../components/StaffCanvas.jsx';
import { AudioEngine } from '../services/audioEngine.js';
import { downloadMusicXml } from '../utils/musicXml.js';
import { exportScoreAsJSON } from '../utils/exportUtils.js';

const INSTRUMENTS = ['Violão', 'Violino', 'Teclado', 'Flauta', 'Canto', 'Baixo', 'Saxofone', 'Bateria'];

export default function ScoreWorkspacePage({ scores, onOpenScore, onNewScore, onDeleteScore, user }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const list = useMemo(() => scores.filter((score) => {
    const needle = search.toLocaleLowerCase('pt-BR');
    return (filter === 'Todos' || score.instrument === filter) && `${score.title} ${score.author}`.toLocaleLowerCase('pt-BR').includes(needle);
  }), [scores, search, filter]);
  const recent = useMemo(() => [...list].sort((a, b) => {
    const timestamp = (score) => score.updatedAtISO ? new Date(score.updatedAtISO).getTime() : 0;
    return timestamp(b) - timestamp(a);
  }), [list]);

  return <section className="score-hub" aria-label="Biblioteca e estúdio de partituras">
    <div className="hub-heading"><div><span className="section-kicker">SONORUM STUDIO</span><h1>Suas partituras</h1><p>Comece uma composição ou continue de onde parou.</p></div><span className="hub-mark" aria-hidden="true">𝄞</span></div>
    <div className="hub-start-row">
      <button className="hub-create" onClick={onNewScore} type="button"><span className="hub-create-icon">＋</span><strong>Nova partitura</strong><small>Criar documento em branco</small><span className="hub-create-arrow">↗</span></button>
      <div className="hub-help"><span>COMECE A COMPOR</span><h2>Da primeira nota<br />à sua composição.</h2><p>Escreva diretamente na pauta, escolha instrumentos, ouça e exporte em MusicXML.</p><button className="text-link" onClick={onNewScore}>Abrir editor →</button></div>
    </div>
    <div className="hub-library-heading"><div><h2>Recentes</h2><p>{scores.length} {scores.length === 1 ? 'partitura salva' : 'partituras salvas'} na biblioteca{user ? ` · ${user.name.split(' ')[0]}` : ' · sessão temporária'}</p></div><div className="hub-filters"><input aria-label="Buscar partitura" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar partitura..."/><select aria-label="Filtrar por instrumento" value={filter} onChange={e => setFilter(e.target.value)}><option>Todos</option>{INSTRUMENTS.map(i=><option key={i}>{i}</option>)}</select></div></div>
    {recent.length ? <div className="hub-recent-grid">{recent.map(score => <article className="hub-document" key={score.id}><button className="hub-document-open" onClick={() => onOpenScore(score)} aria-label={`Abrir partitura ${score.title}`}><div className="hub-document-preview"><StaffCanvas notes={(score.notes || []).slice(0, 7)} meter={score.meter} compact /></div><div className="hub-document-copy"><strong>{score.title || 'Sem título'}</strong><span>{score.instrument} · {score.updatedAt || 'Sem data'}</span></div></button><div className="hub-document-actions"><button onClick={() => AudioEngine.playSequence(score.notes || [], { instrument:score.instrument, bpm:score.tempo })} title="Ouvir partitura" aria-label={`Ouvir ${score.title}`}>▶</button><button onClick={()=>downloadMusicXml(score)} title="Exportar MusicXML" aria-label={`Exportar ${score.title}`}>↓ XML</button><button onClick={()=>exportScoreAsJSON(score)} title="Baixar arquivo JSON" aria-label={`Baixar ${score.title} em JSON`}>↓ JSON</button><button onClick={()=>setConfirmDelete(score.id)} title="Excluir partitura" aria-label={`Excluir ${score.title}`}>✕</button></div>{confirmDelete === score.id && <div className="hub-delete-confirm" role="alertdialog" aria-label="Confirmar exclusão"><span>Excluir esta partitura?</span><button onClick={()=>setConfirmDelete(null)}>Cancelar</button><button onClick={()=>{ onDeleteScore(score.id); setConfirmDelete(null); }}>Excluir</button></div>}</article>)}</div> : <div className="hub-empty"><span>♫</span><h3>{scores.length ? 'Nenhuma partitura encontrada' : 'Sua biblioteca está pronta'}</h3><p>{scores.length ? 'Tente outra busca ou instrumento.' : 'Crie sua primeira partitura e ela aparecerá aqui.'}</p><button className="btn btn-primary" onClick={onNewScore}>Nova partitura</button></div>}
    <p className="hub-storage-note">Com login, suas partituras ficam no Supabase. Sem login, os documentos são temporários e desaparecem ao atualizar a página.</p>
  </section>;
}
