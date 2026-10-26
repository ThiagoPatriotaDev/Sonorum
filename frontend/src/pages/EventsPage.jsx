import React, { useMemo, useState } from 'react';
import { OFFICIAL_EVENTS, SAMPLE_EVENTS, EVENT_CATEGORIES, EVENT_LABELS, formatEventDate, eventIsValid } from '../data/events.js';

const month = value => formatEventDate(value, { month: 'short' }).replace('.', '').toUpperCase();
const dateDay = value => formatEventDate(value, { day: '2-digit' });
const prettyDate = value => formatEventDate(value, { weekday: 'long', day:'numeric', month:'long', year:'numeric' });
const prettyTime = value => formatEventDate(value, { hour:'2-digit', minute:'2-digit', hourCycle:'h23' });

export default function EventsPage({ onNavigate }) {
  const [preview, setPreview] = useState(false);
  const [category, setCategory] = useState('todos');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('proximos');
  const [openId, setOpenId] = useState(null);
  const events = preview ? SAMPLE_EVENTS : OFFICIAL_EVENTS;
  const validEvents = useMemo(() => events.filter(eventIsValid).sort((a,b) => new Date(a.startAt) - new Date(b.startAt)), [events]);
  const filtered = useMemo(() => validEvents.filter(item => {
    const after = new Date(item.startAt).getTime() >= Date.now();
    const validPeriod = period === 'todos' || (period === 'proximos' && after) || (period === 'anteriores' && !after);
    const haystack = `${item.title} ${item.location} ${item.description} ${EVENT_LABELS[item.category]}`.toLocaleLowerCase('pt-BR');
    return validPeriod && (category === 'todos' || category === item.category) && haystack.includes(search.trim().toLocaleLowerCase('pt-BR'));
  }), [validEvents, category, search, period]);
  const clearFilters = () => { setSearch(''); setCategory('todos'); setPeriod('proximos'); setOpenId(null); };
  const switchMode = checked => { setPreview(checked); clearFilters(); };

  return <div className="events-page">
    <section className="events-hero" aria-labelledby="events-page-heading">
      <div className="events-hero-content">
        <div className="events-breadcrumb"><button onClick={() => onNavigate('comunidade')}>Comunidade</button><span aria-hidden="true">/</span><span>Agenda de eventos</span></div>
        <span className="events-kicker">SONORUM / AGENDA CULTURAL <span className="events-kicker-line"/></span>
        <h1 id="events-page-heading">A música não<br/>acontece <em>sozinha.</em></h1>
        <p>Apresentações, encontros e projetos. Um lugar para acompanhar a programação do curso de Música e descobrir o que está por vir.</p>
        <button className="events-hero-action" onClick={() => document.getElementById('eventos-programacao')?.scrollIntoView({ behavior: 'smooth' })}>Explorar programação <span aria-hidden="true">↓</span></button>
      </div>
      <div className="events-hero-visual" aria-hidden="true">
        <div className="events-hero-rings"/>
        <div className="events-hero-date">S<small>O</small>N<small>O</small>R<small>U</small>M</div>
        <svg viewBox="0 0 570 310" className="events-hero-waves" fill="none" preserveAspectRatio="xMidYMid meet">
          {Array.from({length:17},(_,i)=><path key={i} d={`M0 ${170+i*3} C105 ${25+i*5}, 165 ${290-i*3}, 300 ${145+i*2} S480 ${15+i*5},570 ${155+i*2}`} stroke={i%3===0?'#f8bf91':'#b78baa'} strokeWidth={i%4===0?2:1.1} opacity={.30+i*.025}/>)}
        </svg>
        <span className="events-visual-caption">O SOM ENCONTRA PESSOAS.</span>
      </div>
    </section>
    <section className="events-content" id="eventos-programacao" aria-labelledby="events-section-heading">
      <div className="events-section-heading">
        <div><span className="events-section-index">01 / NOSSA PROGRAMAÇÃO</span><h2 id="events-section-heading">Agenda <em>em movimento.</em></h2><p>Datas, locais e informações sobre apresentações, projetos e atividades abertas.</p></div>
        <div className="events-source-switch" aria-label="Origem dos dados da agenda"><span>VISUALIZAÇÃO</span><div className="events-switch-row"><button className={!preview?'selected':''} aria-pressed={!preview} onClick={()=>switchMode(false)}>Agenda oficial</button><button className={preview?'selected':''} aria-pressed={preview} onClick={()=>switchMode(true)}>Demonstração</button></div></div>
      </div>
      {preview && <div className="events-demo-notice" role="status"><strong>Modo demonstração</strong><span>Os eventos abaixo são fictícios e servem somente para testar o layout, os filtros e os detalhes. Não representam a programação oficial do IFPE.</span></div>}
      <div className="events-filter-bar">
        <label className="events-search-label" htmlFor="events-search"><span>BUSCAR NA AGENDA</span><div><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.3" stroke="currentColor" strokeWidth="1.6"/><path d="m15.5 15.5 5.1 5.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><input id="events-search" placeholder="Evento, projeto ou local" value={search} onChange={e => setSearch(e.target.value)}/></div></label>
        <label htmlFor="events-category" className="events-filter-label"><span>TIPO DE ATIVIDADE</span><select id="events-category" value={category} onChange={e => setCategory(e.target.value)}>{EVENT_CATEGORIES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label htmlFor="events-period" className="events-filter-label"><span>PERÍODO</span><select id="events-period" value={period} onChange={e => setPeriod(e.target.value)}><option value="proximos">Próximos</option><option value="anteriores">Anteriores</option><option value="todos">Todos</option></select></label>
      </div>
      <div className="events-list-header"><span>{preview?'EXEMPLOS ILUSTRATIVOS':'PROGRAMAÇÃO CONFIRMADA'}</span><span aria-live="polite">{filtered.length} {filtered.length === 1 ? 'evento' : 'eventos'}</span></div>
      {filtered.length > 0 ? <div className="events-list" aria-label="Eventos encontrados">{filtered.map((event,i)=><article key={event.id} className={`events-row ${openId===event.id?'is-expanded':''}`}>
        <div className="events-date-tile"><span>{month(event.startAt)}</span><strong>{dateDay(event.startAt)}</strong><small>{formatEventDate(event.startAt,{year:'numeric'})}</small></div>
        <div className="events-event-info"><span className="events-category-tag">{EVENT_LABELS[event.category]}</span><h3>{event.title}</h3><p>{event.location}<span aria-hidden="true"> · </span>{prettyTime(event.startAt)}</p></div>
        <button className="events-expand-btn" onClick={()=>setOpenId(openId===event.id?null:event.id)} aria-expanded={openId===event.id} aria-controls={`event-detail-${event.id}`} aria-label={`${openId===event.id?'Ocultar':'Ver'} detalhes de ${event.title}`}><span aria-hidden="true">{openId===event.id?'−':'↗'}</span><small>{openId===event.id?'Recolher':'Detalhes'}</small></button>
        {openId===event.id && <div className="events-detail" id={`event-detail-${event.id}`}><div><span>DATA E HORÁRIO</span><strong>{prettyDate(event.startAt)} · {prettyTime(event.startAt)}{event.endAt?`–${prettyTime(event.endAt)}`:''}</strong></div><div><span>LOCAL</span><strong>{event.location}</strong></div>{event.audience&&<div><span>PÚBLICO</span><strong>{event.audience}</strong></div>}<p>{event.description}</p>{event.isDemo&&<small className="events-demo-disclaimer">Evento fictício para demonstração da interface.</small>}</div>}
      </article>)}</div> : <div className="events-empty" role="status">
        <div className="events-empty-visual"><span>♪</span><i/></div>
        <div><span className="events-empty-kicker">{preview?'NENHUM RESULTADO':'INFORMAÇÕES EM PREPARAÇÃO'}</span><h3>{preview?'Nenhum exemplo corresponde aos filtros.':'A programação oficial chega por aqui.'}</h3><p>{preview?'Tente outro período, tipo de atividade ou termo de busca.':'A agenda está pronta para receber apresentações e projetos confirmados pela coordenação do curso. Enquanto isso, você pode conhecer o funcionamento com dados demonstrativos, sem confundi-los com eventos reais.'}</p><div className="events-empty-actions">{(search||category!=='todos'||period!=='proximos')&&<button onClick={clearFilters}>Limpar filtros ↗</button>}{!preview&&<button className="events-demo-cta" onClick={()=>switchMode(true)}>Explorar demonstração ↗</button>}</div></div>
      </div>}
      <div className="events-bottom-callout"><div><span className="events-section-index">A COMUNIDADE FAZ A MÚSICA CIRCULAR</span><h2>Encontre outras <em>vozes.</em></h2><p>Além da agenda, conheça as videoaulas e experiências compartilhadas pela comunidade do Sonorum.</p></div><button onClick={()=>onNavigate('comunidade')}>Explorar comunidade <span>↗</span></button></div>
    </section>
    <footer className="events-footer"><strong>sonorum<span>.</span></strong><small>AGENDA CULTURAL · INFORMAÇÕES OFICIAIS A CONFIRMAR</small></footer>
  </div>;
}
