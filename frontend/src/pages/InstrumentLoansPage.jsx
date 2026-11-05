import React, { useEffect, useMemo, useState } from 'react';
import { CommunityApi } from '../services/communityApi.js';
import { assertSupabase } from '../services/supabaseClient.js';
import '../styles/assets.css';

const ZONE = 'America/Recife';
const OPERATORS = ['staff','coordinator','admin'];
const CONDITIONS = [
  ['excellent','Excelente'], ['good','Bom'], ['fair','Regular'], ['needs_repair','Precisa de reparo']
];
const CONDITIONS_LABEL = Object.fromEntries(CONDITIONS);
const STATUSES = { pending:'Aguardando',approved:'Aprovado',checked_out:'Retirado',returned:'Devolvido',rejected:'Recusado',cancelled:'Cancelado' };
const EMPTY = { asset_code:'',name:'',category:'',conservation:'good',photo_url:'',location:'',description:'',status:'available' };
const dateText = value => value ? new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : '—';
const datetimeText = value => value ? new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '—';
function todayRecife(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function statusLabel(status){return STATUSES[status]||status;}
function datePlusDays(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function isActiveLoan(status){return ['approved','checked_out'].includes(status);}
function Availability({asset,busy}){
  const available=asset.status==='available'&&!busy;
  return <span className={`assets-availability ${available?'is-available':'is-unavailable'}`}><i/> {asset.status==='maintenance'?'Em manutenção':asset.status==='inactive'?'Fora de uso':busy?'Em empréstimo':'Disponível'}</span>;
}
function AssetArt({asset}){
  return <div className="assets-photo">{asset.photo_url ? <img src={asset.photo_url} alt={`Foto de ${asset.name}`} loading="lazy" /> : <div className="assets-photo-empty" aria-hidden="true"><span>♩</span><small>SONORUM / ACERVO</small></div>}<span className="assets-art-number">{asset.asset_code}</span></div>;
}
function InfoBox({children,type='info',onClose}){
  return <div className={`assets-alert assets-alert-${type}`} role={type==='error'?'alert':'status'}><span>{children}</span>{onClose&&<button type="button" aria-label="Dispensar aviso" onClick={onClose}>×</button>}</div>;
}
export default function InstrumentLoansPage({user,onOpenAuth,onNavigate}){
  const operator=OPERATORS.includes(user?.role);
  const [tab,setTab]=useState('catalog');
  const [items,setItems]=useState([]);
  const [busyIds,setBusyIds]=useState([]);
  const [loans,setLoans]=useState([]);
  const [queueLoans,setQueueLoans]=useState([]);
  const [queueTotal,setQueueTotal]=useState(0);
  const [queuePage,setQueuePage]=useState(0);
  const [hasMoreQueue,setHasMoreQueue]=useState(false);
  const [loanPage,setLoanPage]=useState(0);
  const [hasMoreLoans,setHasMoreLoans]=useState(false);
  const [loadingMore,setLoadingMore]=useState(false);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [refreshIndex,setRefreshIndex]=useState(0);
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('all');
  const [availability,setAvailability]=useState('all');
  const [statusFilter,setStatusFilter]=useState('all');
  const [requested,setRequested]=useState(null);
  const [purpose,setPurpose]=useState('');
  const [requestedUntil,setRequestedUntil]=useState(todayRecife);
  const [editing,setEditing]=useState(null);
  const [assetDraft,setAssetDraft]=useState(EMPTY);
  const [photo,setPhoto]=useState(null);
  const [decision,setDecision]=useState(null);
  const [decisionDate,setDecisionDate]=useState(todayRecife);
  const [condition,setCondition]=useState('good');
  const [note,setNote]=useState('');
  const [focusedAsset,setFocusedAsset]=useState(null);
  const busySet=useMemo(()=>new Set(busyIds),[busyIds]);
  const byId=useMemo(()=>new Map(items.map(i=>[i.id,i])),[items]);
  const categories=useMemo(()=>[...new Set(items.map(i=>i.category))].sort((a,b)=>a.localeCompare(b,'pt-BR')),[items]);
  const isFree=item=>item.status==='available'&&!busySet.has(item.id);
  const filtered=items.filter(item=>{
    const term=search.trim().toLocaleLowerCase('pt-BR');
    return (!term||[item.name,item.asset_code,item.category,item.location].join(' ').toLocaleLowerCase('pt-BR').includes(term))
      && (category==='all'||item.category===category) && (availability==='all'||(availability==='free'?isFree(item):!isFree(item)));
  });
  const shownLoans=loans.filter(l=>statusFilter==='all'||l.status===statusFilter);
  const myActive=loans.filter(l=>['pending','approved','checked_out'].includes(l.status)).length;
  const queueCount=operator?queueTotal:0;
  const activeCount=busyIds.length;

  useEffect(()=>{if(!operator&&tab==='inventory')setTab('catalog');if(!operator&&tab==='queue')setTab('requests');},[operator,tab]);
  useEffect(()=>{
    if(!user){setItems([]);setLoans([]);setQueueLoans([]);setQueueTotal(0);setBusyIds([]);return;}
    let alive=true;
    setLoading(true);setError('');
    Promise.all([CommunityApi.getInstrumentAssets(),CommunityApi.getInstrumentLoans(0),CommunityApi.getInstrumentBusy(),operator?CommunityApi.getInstrumentLoans(0,'pending'):Promise.resolve(null)])
      .then(([assets,history,busy,queue])=>{if(!alive)return;setItems(assets);setLoans(history.loans);setLoanPage(0);setHasMoreLoans(history.has_more);setBusyIds(busy);setQueueLoans(queue?.loans||[]);setQueueTotal(queue?.total||0);setQueuePage(0);setHasMoreQueue(Boolean(queue?.has_more));})
      .catch(err=>{if(alive)setError(err.message||'Falha ao carregar o acervo.');})
      .finally(()=>alive&&setLoading(false));
    return()=>{alive=false;};
  },[user?.id,refreshIndex]);
  useEffect(()=>{
    const anyModal=Boolean(requested||editing||decision||focusedAsset);
    if(!anyModal)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const closeOnEscape=event=>{if(event.key==='Escape'){
      setRequested(null);setEditing(null);setDecision(null);setFocusedAsset(null);
    }};
    document.addEventListener('keydown',closeOnEscape);
    return()=>{document.removeEventListener('keydown',closeOnEscape);document.body.style.overflow=previous;};
  },[requested,editing,decision,focusedAsset]);
  const reload=()=>setRefreshIndex(i=>i+1);
  async function loadMore(){
    setLoadingMore(true);setError('');
    const isQueue=tab==='queue';
    try{const result=await CommunityApi.getInstrumentLoans(isQueue?queuePage+1:loanPage+1,isQueue?'pending':'');
      if(isQueue){setQueueLoans(previous=>[...previous,...result.loans]);setQueuePage(result.page);setHasMoreQueue(result.has_more);}
      else{setLoans(previous=>[...previous,...result.loans]);setLoanPage(result.page);setHasMoreLoans(result.has_more);}
    }catch(err){setError(err.message);}finally{setLoadingMore(false);}
  }
  const resetFeedback=()=>{setError('');setNotice('');};
  function requestAsset(item){resetFeedback();setPurpose('');setRequestedUntil(todayRecife());setRequested(item);}
  async function submitRequest(event){
    event.preventDefault();resetFeedback();
    if(purpose.trim().length<5){setError('Explique a finalidade do empréstimo (mínimo de cinco caracteres).');return;}
    setSaving(true);
    try {await CommunityApi.requestInstrumentLoan({instrument_id:requested.id,purpose:purpose.trim(),requested_until:requestedUntil});setRequested(null);setNotice('Pedido enviado. A equipe vai analisar sua solicitação.');setTab('requests');reload();}
    catch(e){setError(e.message);}finally{setSaving(false);}
  }
  function openEditor(asset=null){resetFeedback();setEditing(asset||'new');setAssetDraft(asset?{...asset}:{...EMPTY});setPhoto(null);}
  async function saveAsset(event){
    event.preventDefault();resetFeedback();
    if(!assetDraft.asset_code.trim()||!assetDraft.name.trim()||!assetDraft.category.trim()){setError('Preencha o patrimônio, nome e categoria.');return;}
    setSaving(true);
    try{
      let payload={...assetDraft};
      if(photo){
        if(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>2097152)throw Error('Escolha JPG, PNG ou WebP de até 2 MB.');
        const extension=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg';
        const name=`assets/${crypto.randomUUID()}.${extension}`;
        const client=assertSupabase();
        const upload=await client.storage.from('sonorum-instruments').upload(name,photo,{contentType:photo.type,upsert:false});
        if(upload.error)throw Error('Não foi possível enviar a foto. Confira a configuração do Storage no Supabase.');
        payload.photo_url=client.storage.from('sonorum-instruments').getPublicUrl(name).data.publicUrl;
      }
      if(editing==='new')await CommunityApi.createInstrumentAsset(payload);
      else await CommunityApi.updateInstrumentAsset(editing.id,payload);
      setEditing(null);setNotice(editing==='new'?'Instrumento cadastrado com sucesso.':'Cadastro patrimonial atualizado.');reload();
    }catch(e){setError(e.message);}finally{setSaving(false);}
  }
  function openDecision(loan,status){resetFeedback();setDecision({loan,status});setDecisionDate(loan.requested_until||todayRecife());setCondition(loan.checkout_condition||byId.get(loan.instrument_id)?.conservation||'good');setNote('');}
  async function confirmDecision(event){
    event.preventDefault();resetFeedback();setSaving(true);
    const {loan,status}=decision;
    try{
      const payload={status};
      if(status==='approved')payload.due_date=decisionDate;
      if(status==='rejected'||status==='cancelled')payload.reason=note.trim();
      if(status==='checked_out'||status==='returned'){payload.condition=condition;payload.note=note.trim();}
      await CommunityApi.changeInstrumentLoan(loan.id,payload);
      setDecision(null);
      setNotice({approved:'Pedido aprovado. A retirada precisa ser registrada.',rejected:'Pedido recusado com justificativa.',cancelled:'Solicitação cancelada.',checked_out:'Retirada e inspeção registradas.',returned:'Devolução e conferência registradas.'}[status]);
      reload();
    }catch(e){setError(e.message);}finally{setSaving(false);}
  }
  const navTabs=operator?[
    ['catalog','Catálogo'],['queue',`Fila de pedidos${queueCount?` (${queueCount})`:''}`],['requests','Histórico'],['inventory','Gestão do acervo']
  ]:[['catalog','Catálogo'],['requests',`Meus empréstimos${myActive?` (${myActive})`:''}`]];
  return <div className="assets-page">
    <section className="assets-hero">
      <div className="assets-hero-inner"><div className="assets-overline">SONORUM / ACERVO & EMPRÉSTIMOS <span>RF10—RF12</span></div>
      <div className="assets-hero-grid"><div><h1>O som tem história.<br/><em>O instrumento também.</em></h1><p>Conheça o acervo patrimonial do curso, solicite instrumentos para estudar e acompanhe cada movimentação com transparência.</p>
        <div className="assets-hero-actions"><button type="button" onClick={()=>document.getElementById('assets-content')?.scrollIntoView({behavior:'smooth'})}>Explorar acervo <span>↓</span></button><button type="button" className="assets-hero-link" onClick={()=>onNavigate('salas')}>Reservar uma sala ↗</button></div></div>
        <div className="assets-hero-art" aria-hidden="true"><div className="assets-hero-rings"><i/><i/><i/></div><strong>𝄞</strong><span>ACERVO<br/>MUSICAL</span><small>01 / UM EXEMPLAR, UM HISTÓRICO</small></div></div>
      </div>
    </section>
    <div className="assets-body" id="assets-content">
      {!user ? <div className="assets-guest"><span className="assets-overline">ÁREA DO CURSO</span><h2>O acervo está a um login de distância.</h2><p>Entre com sua conta para consultar instrumentos e acompanhar solicitações. A equipe autorizada também encontra aqui a gestão patrimonial.</p><button className="assets-btn" onClick={onOpenAuth}>Entrar no Sonorum ↗</button></div> : <>
        <div className="assets-metrics"><div><small>EXEMPLARES</small><strong>{items.length.toString().padStart(2,'0')}</strong><span>Patrimônio catalogado</span></div><div><small>DISPONÍVEIS</small><strong>{items.filter(isFree).length.toString().padStart(2,'0')}</strong><span>Prontos para solicitar</span></div><div><small>{operator?'SOLICITAÇÕES PENDENTES':'MEUS PEDIDOS ATIVOS'}</small><strong>{(operator?queueCount:myActive).toString().padStart(2,'0')}</strong><span>{operator?'Aguardando análise':'Incluindo pedidos pendentes'}</span></div><div><small>EM CIRCULAÇÃO</small><strong>{activeCount.toString().padStart(2,'0')}</strong><span>Aprovados ou retirados</span></div></div>
        <div className="assets-section-nav" role="tablist" aria-label="Navegação do acervo">{navTabs.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} className={tab===id?'is-selected':''} onClick={()=>{setTab(id);resetFeedback();}}>{label}</button>)}<button type="button" className="assets-refresh" onClick={reload} disabled={loading}>↻ <span>Atualizar</span></button></div>
        {notice&&<InfoBox onClose={()=>setNotice('')}>{notice}</InfoBox>}
        {error&&<InfoBox type="error" onClose={()=>setError('')}>{error}</InfoBox>}
        {loading&&<div className="assets-loading" role="status">Atualizando catálogo e movimentações…</div>}
        {tab==='catalog'&&<section className="assets-catalog"><div className="assets-section-title"><div><span className="assets-overline">COLEÇÃO DO CURSO</span><h2>Instrumentos e histórias.</h2><p>O patrimônio identifica o exemplar físico. A categoria indica o tipo de instrumento.</p></div><span>{filtered.length} {filtered.length===1?'exemplar':'exemplares'}</span></div>
          <div className="assets-filters"><label className="assets-search">Buscar no acervo<input aria-label="Buscar por instrumento, patrimônio ou local" placeholder="Busque pelo nome, patrimônio ou local..." value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>Disponibilidade<select value={availability} onChange={e=>setAvailability(e.target.value)}><option value="all">Todos os exemplares</option><option value="free">Disponíveis</option><option value="busy">Indisponíveis</option></select></label></div>
          {filtered.length?<div className="assets-grid">{filtered.map((asset,index)=><article className="assets-card" key={asset.id}><AssetArt asset={asset}/><div className="assets-card-body"><div className="assets-card-top"><span className="assets-card-category">{asset.category}</span><span className="assets-card-index">{String(index+1).padStart(2,'0')}</span></div><h3>{asset.name}</h3><p>{asset.location||'Local não informado'} <span>·</span> {CONDITIONS_LABEL[asset.conservation]}</p><Availability asset={asset} busy={busySet.has(asset.id)}/><div className="assets-card-actions"><button className="assets-card-more" onClick={()=>setFocusedAsset(asset)}>Detalhes ↗</button>{!operator&&<button className="assets-card-request" disabled={!isFree(asset)} onClick={()=>requestAsset(asset)}>{isFree(asset)?'Solicitar empréstimo':'Indisponível'}</button>}</div></div></article>)}</div>:<div className="assets-empty"><span>♩</span><h3>Nenhum instrumento encontrado.</h3><p>Experimente outros filtros ou solicite ao setor responsável o cadastro do acervo.</p></div>}
        </section>}
        {['requests','queue'].includes(tab)&&<section className="assets-history"><div className="assets-section-title"><div><span className="assets-overline">{operator?'MOVIMENTAÇÕES PATRIMONIAIS':'SEU HISTÓRICO PESSOAL'}</span><h2>{tab==='queue'?'Solicitações para análise.':operator?'Histórico de empréstimos.':'Meus empréstimos.'}</h2><p>{operator?'As etapas ficam registradas, sem exclusão de empréstimos concluídos.':'Acompanhe a análise do pedido e a condição registrada na retirada e devolução.'}</p></div></div>
          <div className="assets-filters"><label>Situação<select value={tab==='queue'?'pending':statusFilter} disabled={tab==='queue'} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Todas</option>{Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
          <div className="assets-loan-list">{(tab==='queue'?queueLoans:shownLoans).map(loan=>{
            const asset=byId.get(loan.instrument_id);
            return <article className="assets-loan" key={loan.id}><div className="assets-loan-head"><span className="assets-loan-code">{asset?.asset_code||'PATRIMÔNIO'}</span><span className={`assets-status assets-status-${loan.status}`}>{statusLabel(loan.status)}</span></div><div className="assets-loan-main"><div><h3>{asset?.name||'Instrumento cadastrado'}</h3><p>{operator?<><strong>{loan.student_name||'Estudante'}</strong> · </>:null}{loan.purpose}</p></div><span className="assets-loan-date">Solicitado {dateText(loan.created_at)}</span></div><div className="assets-loan-details"><span>Prazo solicitado <strong>{loan.requested_until?.split('-').reverse().join('/')||'—'}</strong></span><span>Prazo aprovado <strong>{datetimeText(loan.due_at)}</strong></span>{loan.checked_out_at&&<span>Retirada <strong>{datetimeText(loan.checked_out_at)}</strong></span>}{loan.returned_at&&<span>Devolução <strong>{datetimeText(loan.returned_at)}</strong></span>}{loan.checkout_condition&&<span>Estado na retirada <strong>{CONDITIONS_LABEL[loan.checkout_condition]}</strong></span>}{loan.return_condition&&<span>Estado na devolução <strong>{CONDITIONS_LABEL[loan.return_condition]}</strong></span>}</div>{loan.decision_note&&<p className="assets-decision-note">Justificativa: {loan.decision_note}</p>}{loan.checkout_note&&<p className="assets-decision-note">Inspeção na retirada: {loan.checkout_note}</p>}{loan.return_note&&<p className="assets-decision-note">Conferência na devolução: {loan.return_note}</p>}
              <div className="assets-loan-actions">{loan.status==='pending'&&operator&&<><button className="assets-btn" onClick={()=>openDecision(loan,'approved')}>Aprovar pedido</button><button className="assets-btn-secondary" onClick={()=>openDecision(loan,'rejected')}>Recusar</button></>}{loan.status==='pending'&&!operator&&<button className="assets-btn-secondary" onClick={()=>openDecision(loan,'cancelled')}>Cancelar pedido</button>}{loan.status==='approved'&&operator&&<button className="assets-btn" onClick={()=>openDecision(loan,'checked_out')}>Registrar retirada →</button>}{loan.status==='checked_out'&&operator&&<button className="assets-btn" onClick={()=>openDecision(loan,'returned')}>Conferir devolução →</button>}</div>
            </article>;
          })}{!(tab==='queue'?queueLoans.length:shownLoans.length)&&<div className="assets-empty"><span>♬</span><h3>Nenhum pedido por aqui.</h3><p>{tab==='queue'?'A fila está em dia. Novas solicitações aparecem aqui.':'Quando houver solicitações, você acompanhará todas as etapas neste espaço.'}</p></div>}</div>{(tab==='queue'?hasMoreQueue:hasMoreLoans)&&<button type="button" className="assets-load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore?'Carregando…':'Carregar movimentações anteriores ↓'}</button>}
        </section>}
        {tab==='inventory'&&operator&&<section className="assets-inventory"><div className="assets-section-title"><div><span className="assets-overline">ADMINISTRAÇÃO / CONTROLE PATRIMONIAL</span><h2>Um cadastro para cada peça.</h2><p>Registre a foto e o estado de conservação. Instrumentos em manutenção não recebem novos pedidos.</p></div><button className="assets-btn" onClick={()=>openEditor()}>＋ Cadastrar instrumento</button></div><div className="assets-inventory-list">{items.map(asset=><div key={asset.id}><strong>{asset.asset_code}</strong><div><b>{asset.name}</b><small>{asset.category} · {asset.location||'Local não informado'} · {CONDITIONS_LABEL[asset.conservation]}</small></div><Availability asset={asset} busy={busySet.has(asset.id)}/><button className="assets-btn-secondary" onClick={()=>openEditor(asset)}>Editar ↗</button></div>)}</div>{!items.length&&<div className="assets-empty">Seu acervo ainda não tem instrumentos. Cadastre o primeiro exemplar.</div>}</section>}
      </>}
    </div>
    {focusedAsset&&<div className="assets-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setFocusedAsset(null)}><section className="assets-dialog assets-detail" role="dialog" aria-modal="true" aria-labelledby="assets-detail-title"><button className="assets-close" onClick={()=>setFocusedAsset(null)} aria-label="Fechar detalhes">×</button><AssetArt asset={focusedAsset}/><span className="assets-overline">FICHA PATRIMONIAL / {focusedAsset.asset_code}</span><h2 id="assets-detail-title">{focusedAsset.name}</h2><dl><div><dt>Categoria</dt><dd>{focusedAsset.category}</dd></div><div><dt>Conservação</dt><dd>{CONDITIONS_LABEL[focusedAsset.conservation]}</dd></div><div><dt>Local</dt><dd>{focusedAsset.location||'A definir'}</dd></div></dl><p>{focusedAsset.description||'Sem observações adicionais sobre este exemplar.'}</p><Availability asset={focusedAsset} busy={busySet.has(focusedAsset.id)}/><div className="assets-dialog-buttons"><button className="assets-btn-secondary" onClick={()=>setFocusedAsset(null)}>Voltar</button>{!operator&&<button className="assets-btn" disabled={!isFree(focusedAsset)} onClick={()=>{const a=focusedAsset;setFocusedAsset(null);requestAsset(a);}}>{isFree(focusedAsset)?'Solicitar este exemplar':'Indisponível'}</button>}</div></section></div>}
    {requested&&<div className="assets-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setRequested(null)}><form onSubmit={submitRequest} className="assets-dialog" role="dialog" aria-modal="true" aria-labelledby="assets-request-title"><button className="assets-close" type="button" onClick={()=>setRequested(null)} aria-label="Fechar">×</button><span className="assets-overline">PEDIDO DE EMPRÉSTIMO</span><h2 id="assets-request-title">{requested.name}</h2>{error&&<InfoBox type="error">{error}</InfoBox>}<p>Patrimônio {requested.asset_code}. O pedido será analisado pela equipe antes da retirada.</p><label>Finalidade<textarea autoFocus required minLength={5} maxLength={500} rows={4} value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Ex.: estudo individual, ensaio ou atividade da disciplina"/></label><label>Data pretendida para devolução<input required type="date" value={requestedUntil} min={todayRecife()} max={datePlusDays(todayRecife(),180)} onChange={e=>setRequestedUntil(e.target.value)}/></label><div className="assets-dialog-buttons"><button type="button" className="assets-btn-secondary" onClick={()=>setRequested(null)}>Voltar</button><button type="submit" className="assets-btn" disabled={saving}>{saving?'Enviando...':'Enviar solicitação ↗'}</button></div></form></div>}
    {editing&&<div className="assets-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setEditing(null)}><form onSubmit={saveAsset} className="assets-dialog assets-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="assets-edit-title"><button type="button" className="assets-close" onClick={()=>setEditing(null)} aria-label="Fechar">×</button><span className="assets-overline">CONTROLE DE PATRIMÔNIO</span><h2 id="assets-edit-title">{editing==='new'?'Cadastrar exemplar.':'Editar exemplar.'}</h2>{error&&<InfoBox type="error">{error}</InfoBox>}<div className="assets-form-grid"><label>Código de patrimônio<input required minLength={3} maxLength={45} value={assetDraft.asset_code} onChange={e=>setAssetDraft({...assetDraft,asset_code:e.target.value})} placeholder="MUS-00042"/></label><label>Categoria<input required minLength={2} maxLength={75} list="assets-categories" value={assetDraft.category} onChange={e=>setAssetDraft({...assetDraft,category:e.target.value})} placeholder="Violão"/><datalist id="assets-categories">{['Violão','Piano','Teclado','Violino','Flauta','Saxofone','Bateria','Baixo','Microfone','Outros'].map(c=><option key={c} value={c}/>)}</datalist></label><label>Nome do exemplar<input required minLength={2} maxLength={120} value={assetDraft.name} onChange={e=>setAssetDraft({...assetDraft,name:e.target.value})} placeholder="Violão clássico de estudo"/></label><label>Localização<input maxLength={140} value={assetDraft.location} onChange={e=>setAssetDraft({...assetDraft,location:e.target.value})} placeholder="Sala de instrumentos / armário 02"/></label><label>Conservação<select value={assetDraft.conservation} onChange={e=>setAssetDraft({...assetDraft,conservation:e.target.value})}>{CONDITIONS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Situação<select value={assetDraft.status} onChange={e=>setAssetDraft({...assetDraft,status:e.target.value})}><option value="available">Disponível</option><option value="maintenance">Em manutenção</option><option value="inactive">Fora de uso</option></select></label></div><label>Observações<textarea rows={3} maxLength={700} value={assetDraft.description} onChange={e=>setAssetDraft({...assetDraft,description:e.target.value})}/></label><div className="assets-photo-editor"><label>Foto do instrumento (JPG, PNG, WebP; até 2 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label><label>Ou link HTTPS da foto<input type="url" placeholder="https://..." value={assetDraft.photo_url||''} onChange={e=>setAssetDraft({...assetDraft,photo_url:e.target.value})}/></label></div><div className="assets-dialog-buttons"><button type="button" className="assets-btn-secondary" onClick={()=>setEditing(null)}>Cancelar</button><button type="submit" className="assets-btn" disabled={saving}>{saving?'Salvando...':'Salvar no acervo ↗'}</button></div></form></div>}
    {decision&&<div className="assets-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setDecision(null)}><form onSubmit={confirmDecision} className="assets-dialog" role="dialog" aria-modal="true" aria-labelledby="assets-decision-title"><button type="button" className="assets-close" onClick={()=>setDecision(null)} aria-label="Fechar">×</button><span className="assets-overline">MOVIMENTAÇÃO PATRIMONIAL</span><h2 id="assets-decision-title">{{approved:'Aprovar empréstimo.',rejected:'Recusar solicitação.',cancelled:'Cancelar solicitação.',checked_out:'Registrar retirada.',returned:'Conferir devolução.'}[decision.status]}</h2>{error&&<InfoBox type="error">{error}</InfoBox>}<p>{byId.get(decision.loan.instrument_id)?.name||'Exemplar'} · Registro permanente no histórico da conta.</p>{decision.status==='approved'&&<label>Prazo autorizado de devolução<input required type="date" min={todayRecife()} max={datePlusDays(todayRecife(),179)} value={decisionDate} onChange={e=>setDecisionDate(e.target.value)}/></label>}{['checked_out','returned'].includes(decision.status)&&<label>Condição conferida<select value={condition} onChange={e=>setCondition(e.target.value)}>{CONDITIONS.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>}{['checked_out','returned','cancelled','rejected'].includes(decision.status)&&<label>{['rejected','cancelled'].includes(decision.status)?'Justificativa':'Observações da inspeção'}<textarea autoFocus rows={4} maxLength={700} required={decision.status==='rejected'||(decision.status==='cancelled'&&operator)} minLength={decision.status==='rejected'||(decision.status==='cancelled'&&operator)?5:undefined} placeholder="Registre o motivo ou detalhes verificados no instrumento." value={note} onChange={e=>setNote(e.target.value)}/></label>}<div className="assets-dialog-buttons"><button type="button" className="assets-btn-secondary" onClick={()=>setDecision(null)}>Voltar</button><button type="submit" className="assets-btn" disabled={saving}>{saving?'Registrando...':'Confirmar e registrar'}</button></div></form></div>}
    <footer className="assets-footer"><strong>sonorum.</strong><span>CONTROLE DE ACERVO · O SOM EM BOAS MÃOS</span><button onClick={()=>onNavigate('inicio')}>Voltar ao início ↗</button></footer>
  </div>;
}
