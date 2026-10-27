import React, { useEffect, useMemo, useState } from 'react';
import { CommunityApi } from '../services/communityApi.js';
import { recifeLocalToUtc as localToUtc, intervalsOverlap as intersects, isValidReservationInterval } from '../utils/roomTime.js';
import '../styles/rooms.css';

const ZONE = 'America/Recife';
const canOperate = role => ['staff','coordinator','admin'].includes(role);
const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,weekday:'short',day:'2-digit',month:'short'});
const FULL_FORMAT = new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,day:'2-digit',month:'long',year:'numeric'});
const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function todayRecife(){
  const items=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const parts=Object.fromEntries(items.map(({type,value})=>[type,value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function shiftDate(value,n){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
// America/Recife is UTC-03 year-round for the future scheduling window (no DST in Brazil).
// All values sent to the API are UTC ISO timestamps; all user-facing dates are Recife-local.
function fmtDate(iso){return FULL_FORMAT.format(new Date(iso));}
function fmtTime(iso){return TIME_FORMAT.format(new Date(iso));}
function statusLabel(value){return {pending:'Aguardando',approved:'Confirmada',rejected:'Recusada',cancelled:'Cancelada',completed:'Concluída'}[value]||value;}
function WeekStrip({day,onPick}){
  const dates=Array.from({length:7},(_,index)=>shiftDate(day,index-3));
  const min=todayRecife();
  return <div className="rooms-week-strip" aria-label="Escolher dia da reserva">{dates.map(date=><button key={date} type="button" disabled={date<min} className={day===date?'selected':''} onClick={()=>onPick(date)} aria-pressed={day===date}>
      <span>{new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,weekday:'short'}).format(new Date(date+'T12:00:00Z')).replace('.','').toUpperCase()}</span><strong>{date.slice(-2)}</strong>
    </button>)}</div>;
}
function MonthCalendar({day,onPick,booked=[]}){
  const [anchor,setAnchor]=useState(day.slice(0,7));
  useEffect(()=>setAnchor(day.slice(0,7)),[day]);
  const [year,month]=anchor.split('-').map(Number);
  const first=new Date(Date.UTC(year,month-1,1,12));
  const offset=(first.getUTCDay()+6)%7;
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const min=todayRecife(),max=shiftDate(min,120);
  const cells=Array.from({length:offset+days},(_,i)=>{
    const d=i-offset+1;
    return d>0?`${anchor}-${String(d).padStart(2,'0')}`:null;
  });
  const nextMonth=n=>{const dt=new Date(Date.UTC(year,month-1+n,1,12));const candidate=dt.toISOString().slice(0,10);setAnchor(candidate.slice(0,7));if(candidate>=min&&candidate<=max)onPick(candidate);};
  return <div className="rooms-month" aria-label="Calendário mensal de disponibilidade">
    <div className="rooms-month-head"><button type="button" onClick={()=>nextMonth(-1)} aria-label="Mês anterior">←</button><strong>{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:ZONE}).format(first)}</strong><button type="button" onClick={()=>nextMonth(1)} aria-label="Próximo mês">→</button></div>
    <div className="rooms-month-grid">{['S','T','Q','Q','S','S','D'].map((v,i)=><small key={i}>{v}</small>)}{cells.map((date,i)=>date?<button key={date} type="button" disabled={date<min||date>max} onClick={()=>onPick(date)} className={day===date?'selected':''} aria-pressed={day===date}><span>{Number(date.slice(-2))}</span>{booked.some(slot=>Date.parse(slot.starts_at)<Date.parse(localToUtc(shiftDate(date,1),'00:00'))&&Date.parse(slot.ends_at)>Date.parse(localToUtc(date,'00:00')))&&<i title="Horário ocupado"/>}</button>:<span key={'empty'+i}/> )}</div>
    <p><i/> Dias com algum horário aprovado. Clique em uma data para ver os intervalos.</p>
  </div>;
}
function RoomGlyph(){return <svg viewBox="0 0 88 88" fill="none" aria-hidden="true"><rect x="13" y="17" width="61" height="51" rx="5" stroke="currentColor" strokeWidth="1.5"/><path d="M32 68V33a4 4 0 014-4h17a4 4 0 014 4v35M18 78h52" stroke="currentColor" strokeWidth="1.5"/><circle cx="48" cy="50" r="2" fill="currentColor"/><path d="M16 43h14m29 0h12" stroke="currentColor" strokeWidth="1.5"/></svg>}
const emptyRoom={code:'',name:'',capacity:12,location:'',equipment:'',active:true};

export default function RoomReservationsPage({user,onOpenAuth,onNavigate}){
  const operator=canOperate(user?.role);
  const [tab,setTab]=useState('agenda');
  const [rooms,setRooms]=useState([]);
  const [reservations,setReservations]=useState([]);
  const [occupied,setOccupied]=useState([]);
  const [monthSlots,setMonthSlots]=useState([]);
  const [showMonth,setShowMonth]=useState(false);
  const [roomId,setRoomId]=useState('');
  const [day,setDay]=useState(todayRecife);
  const [fromTime,setFromTime]=useState('14:00');
  const [toTime,setToTime]=useState('15:00');
  const [purpose,setPurpose]=useState('');
  const [statusFilter,setStatusFilter]=useState('all');
  const [roomFilter,setRoomFilter]=useState('all');
  const [formRoom,setFormRoom]=useState(null);
  const [reasonFor,setReasonFor]=useState(null);
  const [reason,setReason]=useState('');
  const [pending,setPending]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [revision,setRevision]=useState(0);
  const selectedRoom=rooms.find(room=>room.id===roomId);

  useEffect(()=>{
    if(!user){setRooms([]);setReservations([]);setOccupied([]);return;}
    let valid=true;
    setLoading(true);setError('');
    Promise.all([CommunityApi.getRooms(),CommunityApi.roomReservations()]).then(([rs,res])=>{
      if(!valid)return;setRooms(rs);setReservations(res);
      setRoomId(id=>rs.some(x=>x.id===id)?id:(rs.find(x=>x.active)?.id||rs[0]?.id||''));
    }).catch(err=>valid&&setError(err.message)).finally(()=>valid&&setLoading(false));
    return()=>{valid=false;};
  },[user?.id,revision]);

  useEffect(()=>{
    if(!user||!roomId){setOccupied([]);return;}
    let valid=true;
    const min=localToUtc(day,'00:00'),max=localToUtc(shiftDate(day,1),'00:00');
    CommunityApi.roomBusySlots(roomId,min,max).then(slots=>valid&&setOccupied(slots)).catch(err=>valid&&setError(err.message));
    return()=>{valid=false;};
  },[user?.id,roomId,day,revision]);
  useEffect(()=>{
    if(!user||!roomId||!showMonth){setMonthSlots([]);return;}
    let valid=true;
    const from=localToUtc(`${day.slice(0,7)}-01`,'00:00');
    const to=localToUtc(shiftDate(`${day.slice(0,7)}-01`,32).slice(0,7)+'-01','00:00');
    CommunityApi.roomBusySlots(roomId,from,to).then(data=>valid&&setMonthSlots(data)).catch(err=>valid&&setError(err.message));
    return()=>{valid=false;};
  },[user?.id,roomId,day.slice(0,7),showMonth,revision]);
  const requestedSlot=useMemo(()=>{
    try {const a=localToUtc(day,fromTime),b=localToUtc(day,toTime);return {starts_at:a,ends_at:b};}catch{return null;}
  },[day,fromTime,toTime]);
  const overlapping=Boolean(requestedSlot&&occupied.some(slot=>intersects(slot,requestedSlot)));
  const invalidWindow=!isValidReservationInterval(requestedSlot);
  const busyToday=occupied.filter(slot=>new Date(slot.ends_at)>new Date(localToUtc(day,'00:00')));
  const displayed=reservations.filter(r=>(statusFilter==='all'||r.status===statusFilter)&&(roomFilter==='all'||r.room_id===roomFilter));
  const ordered=[...displayed].sort((a,b)=>statusFilter==='all'&&a.status==='pending'&&b.status!=='pending'?-1:statusFilter==='all'&&b.status==='pending'&&a.status!=='pending'?1:Date.parse(b.starts_at)-Date.parse(a.starts_at));
  const counts={pending:reservations.filter(r=>r.status==='pending').length,approved:reservations.filter(r=>r.status==='approved').length};
  const refresh=()=>setRevision(n=>n+1);
  async function submitReservation(e){
    e.preventDefault();setError('');setNotice('');
    if(!user){onOpenAuth();return;}
    if(invalidWindow||overlapping){setError('Escolha um horário futuro e livre, entre 30 minutos e 8 horas.');return;}
    if(purpose.trim().length<3){setError('Informe a finalidade da reserva.');return;}
    setPending(true);
    try {await CommunityApi.requestRoom({room_id:roomId,...requestedSlot,purpose:purpose.trim()});setPurpose('');setNotice('Solicitação enviada! A reserva ficará aguardando aprovação do servidor.');setTab('pedidos');refresh();}
    catch(err){setError(err.message);}
    finally{setPending(false);}
  }
  function beginDecision(item,status){
    if(status==='approved' || status==='completed')return applyDecision(item,status,'');
    setReasonFor({id:item.id,status});setReason('');setError('');setNotice('');
  }
  async function applyDecision(item,status,justification){
    setPending(true);setError('');setNotice('');
    try{await CommunityApi.decideRoom(item.id,status,justification);setNotice(`Solicitação ${statusLabel(status).toLowerCase()} com sucesso.`);setReasonFor(null);setReason('');refresh();}
    catch(err){setError(err.message);}
    finally{setPending(false);}
  }
  async function saveRoom(e){
    e.preventDefault();setPending(true);setError('');setNotice('');
    try{
      const room=formRoom.id?await CommunityApi.updateRoom(formRoom.id,formRoom):await CommunityApi.createRoom(formRoom);
      setRoomId(room.id);setFormRoom(null);setNotice('Sala salva e disponível no catálogo.');refresh();
    }catch(err){setError(err.message);}finally{setPending(false);}
  }
  return <div className="rooms-page">
    <section className="rooms-hero">
      <div className="rooms-hero-inner"><div className="rooms-eyebrow">SONORUM <span>/</span> ESPAÇOS DE ESTUDO</div>
        <h1>Um espaço para<br/><em>o seu próximo som.</em></h1>
        <p>Encontre a sala certa, escolha um horário e acompanhe sua solicitação. O estudo começa com organização.</p>
        <div className="rooms-hero-pills"><span>01 · ESCOLHA</span><span>02 · SOLICITE</span><span>03 · ACOMPANHE</span></div>
      </div><div className="rooms-hero-art"><span className="rooms-hero-orbit"/><RoomGlyph/><span className="rooms-hero-art-label">ESPAÇOS / SONORUM</span></div>
    </section>
    <div className="rooms-body">
      <header className="rooms-section-bar"><div><span className="rooms-overline">GESTÃO DE SALAS · RF05—RF09</span><h2>Agenda <em>inteligente.</em></h2><p>Horários apresentados em Recife (UTC−03). Disponibilidade e aprovações validadas pelo banco.</p></div>
        {user&&<div className="rooms-summary"><div><strong>{rooms.filter(r=>r.active).length.toString().padStart(2,'0')}</strong><span>SALAS ATIVAS</span></div><div><strong>{counts.pending.toString().padStart(2,'0')}</strong><span>{operator?'PARA ANALISAR':'AGUARDANDO'}</span></div></div>}
      </header>
      {!user?<div className="rooms-login-wall"><span>♬</span><div><h3>Entre para encontrar sua sala.</h3><p>A agenda e suas solicitações são protegidas pelo login institucional do Sonorum.</p><button onClick={onOpenAuth}>Entrar ou criar conta <b>↗</b></button></div></div>:<>
        <div className="rooms-tabs" role="tablist" aria-label="Seções das salas">
          <button role="tab" aria-selected={tab==='agenda'} className={tab==='agenda'?'active':''} onClick={()=>setTab('agenda')}>Explorar salas</button>
          <button role="tab" aria-selected={tab==='pedidos'} className={tab==='pedidos'?'active':''} onClick={()=>setTab('pedidos')}>{operator?'Solicitações':'Minhas reservas'} {counts.pending>0&&<span>{counts.pending}</span>}</button>
          {operator&&<button role="tab" aria-selected={tab==='gestao'} className={tab==='gestao'?'active':''} onClick={()=>setTab('gestao')}>Gerenciar espaços</button>}
        </div>
        {error&&<div className="rooms-alert error" role="alert"><span>!</span>{error}<button onClick={()=>setError('')} aria-label="Dispensar mensagem">×</button></div>}
        {notice&&<div className="rooms-alert success" role="status"><span>✓</span>{notice}<button onClick={()=>setNotice('')} aria-label="Dispensar mensagem">×</button></div>}
        {loading&&<div className="rooms-progress" role="status">Carregando informações do Supabase...</div>}
        {tab==='agenda'&&<div className="rooms-layout">
          <div className="rooms-selection"><div className="rooms-step-head"><span>01 / ENCONTRE SEU ESPAÇO</span><strong>{rooms.filter(r=>r.active).length} disponíveis</strong></div>
            {rooms.filter(r=>r.active).length===0?<div className="rooms-no-result"><RoomGlyph/><h3>Nenhuma sala cadastrada</h3><p>A coordenação ainda não adicionou salas. {operator?'Use a aba Gerenciar espaços para começar.':'Volte quando a administração cadastrar os espaços.'}</p></div>:<div className="rooms-cards">{rooms.filter(r=>r.active).map(room=><button key={room.id} type="button" className={`rooms-space-card ${roomId===room.id?'selected':''}`} aria-pressed={roomId===room.id} onClick={()=>setRoomId(room.id)}><span className="rooms-space-symbol"><RoomGlyph/></span><span className="rooms-space-details"><small>{room.code} · {room.location||'Local a confirmar'}</small><strong>{room.name}</strong><span>{room.capacity} lugares {room.equipment?' · '+room.equipment:''}</span></span><span className="rooms-space-check">{roomId===room.id?'✓':'↗'}</span></button>)}</div>}
          </div>
          <div className="rooms-scheduling"><div className="rooms-step-head"><span>02 / ESCOLHA A DATA</span><strong>Fuso: America/Recife</strong></div>
            <WeekStrip day={day} onPick={setDay}/>
            <div className="rooms-calendar-toggle"><button type="button" aria-expanded={showMonth} onClick={()=>setShowMonth(v=>!v)}>{showMonth?'Ocultar calendário mensal':'Ver calendário do mês'} <span>{showMonth?'↑':'↗'}</span></button></div>
            {showMonth&&<MonthCalendar day={day} onPick={setDay} booked={monthSlots}/>}
            <div className="rooms-date-tools"><label>Outra data<input type="date" min={todayRecife()} max={shiftDate(todayRecife(),120)} value={day} onChange={e=>e.target.value&&setDay(e.target.value)}/></label><span>{new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,weekday:'long',day:'numeric',month:'long'}).format(new Date(day+'T12:00:00Z'))}</span></div>
            <div className="rooms-booked"><div className="rooms-booked-header"><strong>Ocupação confirmada</strong><small>Horários reservados não podem ser aprovados novamente.</small></div>
              {busyToday.length?<div className="rooms-booked-list">{busyToday.map((slot,i)=><div className="rooms-occupied" key={`${slot.starts_at}-${i}`}><span className="rooms-occupied-dot"/><strong>{fmtTime(slot.starts_at)} — {fmtTime(slot.ends_at)}</strong><small>Indisponível</small></div>)}</div>:<div className="rooms-available"><span>✧</span><strong>Sem bloqueios neste dia.</strong><p>Não há reservas aprovadas para esta sala na data selecionada.</p></div>}
            </div>
            <form className="rooms-request-form" onSubmit={submitReservation}><div className="rooms-step-head"><span>03 / SOLICITE O HORÁRIO</span><strong>{selectedRoom?.code||'Selecione uma sala'}</strong></div>
              <div className="rooms-form-duo"><label>Início<input type="time" step="900" value={fromTime} onChange={e=>setFromTime(e.target.value)}/></label><label>Término<input type="time" step="900" value={toTime} onChange={e=>setToTime(e.target.value)}/></label></div>
              <label>Para que você precisa da sala?<textarea maxLength={500} rows={3} value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Ex.: ensaio de violão para apresentação da disciplina..." /></label>
              {overlapping&&<p className="rooms-conflict" role="alert">Este horário se sobrepõe a uma reserva aprovada. Experimente outro intervalo.</p>}
              {invalidWindow&&<p className="rooms-conflict">Escolha um horário futuro de 30 minutos a 8 horas, sem ultrapassar o dia.</p>}
              {operator?<div className="rooms-operator-hint">Seu perfil é de operador. A solicitação é destinada aos estudantes; use a aba Solicitações para atender os pedidos.</div>:
                <button disabled={pending||!selectedRoom||invalidWindow||overlapping||purpose.trim().length<3} className="rooms-primary" type="submit">{pending?'Enviando...':'Solicitar reserva'}<span>↗</span></button>}
              <small>O pedido entra como <b>aguardando aprovação</b>. A disponibilidade pode mudar até o servidor confirmar.</small>
            </form>
          </div>
        </div>}
        {tab==='pedidos'&&<section className="rooms-requests"><header className="rooms-requests-header"><div><span className="rooms-overline">{operator?'CENTRAL DE APROVAÇÃO':'ACOMPANHAMENTO'}</span><h2>{operator?'Pedidos em análise.':'Suas solicitações.'}</h2><p>{operator?'Analise a finalidade e registre sua decisão.':'Confira o status, os horários e o histórico de cada pedido.'}</p></div><button onClick={refresh} className="rooms-outline">Atualizar ↻</button></header>
          <div className="rooms-filters"><label>Situação<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>{[['all','Todas'],['pending','Aguardando'],['approved','Confirmadas'],['rejected','Recusadas'],['cancelled','Canceladas'],['completed','Concluídas']].map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label><label>Sala<select value={roomFilter} onChange={e=>setRoomFilter(e.target.value)}><option value="all">Todas as salas</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}</select></label><span>{ordered.length} registro(s)</span></div>
          {!ordered.length?<div className="rooms-no-result"><span className="rooms-empty-note">♩</span><h3>Nenhuma solicitação por aqui.</h3><p>Quando houver pedidos, eles aparecerão nesta seção.</p></div>:<div className="rooms-reservation-list">{ordered.map(item=>{
            const room=rooms.find(r=>r.id===item.room_id);
            const canCancel=['pending','approved'].includes(item.status) && (operator|| (item.student_id===user.id&&(item.status==='pending'||Date.parse(item.starts_at)>Date.now())));
            return <article className="rooms-request-item" key={item.id}><div className="rooms-request-item-top"><span className={`rooms-status ${item.status}`}>{statusLabel(item.status)}</span><small>{room?.code||'Sala'} · {fmtDate(item.starts_at)}</small></div><div className="rooms-request-item-body"><div><h3>{room?.name||'Sala de estudo'}</h3><p>{fmtTime(item.starts_at)} às {fmtTime(item.ends_at)} · {item.purpose}</p>{operator&&<small>Solicitante: {item.student_name||'Estudante'}</small>}{item.decision_note&&<small>Observação: {item.decision_note}</small>}{item.processed_by&&<small>Decisão registrada por: {item.processed_by.slice(0,8)}…</small>}</div><div className="rooms-request-actions">{operator&&item.status==='pending'&&<><button disabled={pending} className="rooms-approve" onClick={()=>beginDecision(item,'approved')}>Aprovar</button><button disabled={pending} onClick={()=>beginDecision(item,'rejected')}>Recusar</button></>}{operator&&item.status==='approved'&&Date.parse(item.ends_at)<=Date.now()&&<button disabled={pending} onClick={()=>beginDecision(item,'completed')}>Concluir</button>}{canCancel&&<button disabled={pending} onClick={()=>beginDecision(item,'cancelled')}>Cancelar</button>}</div></div></article>;
          })}</div>}
        </section>}
        {tab==='gestao'&&operator&&<section className="rooms-management"><header className="rooms-requests-header"><div><span className="rooms-overline">ADMINISTRAÇÃO DE ESPAÇOS</span><h2>Catálogo de salas.</h2><p>Cadastre capacidade, localização, equipamentos e disponibilidade para os estudantes.</p></div><button className="rooms-primary" onClick={()=>setFormRoom({...emptyRoom})}>＋ Cadastrar sala</button></header>
          <div className="rooms-management-list">{rooms.map(room=><div key={room.id}><span>{room.code}</span><div><strong>{room.name}</strong><small>{room.capacity} lugares · {room.location||'Local não informado'} · {room.active?'Ativa':'Desativada'}</small></div><button className="rooms-outline" onClick={()=>setFormRoom({...room})}>Editar ↗</button></div>)}</div>
        </section>}
        {reasonFor&&<div className="rooms-dialog-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setReasonFor(null)}><div className="rooms-dialog" role="dialog" aria-modal="true" aria-labelledby="rooms-decision-title"><button className="rooms-dialog-close" onClick={()=>setReasonFor(null)} aria-label="Fechar">×</button><span className="rooms-overline">DECISÃO SOBRE A RESERVA</span><h2 id="rooms-decision-title">{reasonFor.status==='rejected'?'Justifique a recusa.':'Cancelar reserva?'}</h2><p>Esta decisão ficará registrada no histórico. {reasonFor.status==='rejected'||operator?'A justificativa deve ter pelo menos cinco caracteres.':'Você pode informar o motivo do cancelamento.'}</p><label>Motivo<textarea autoFocus rows={4} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explique o motivo da decisão"/></label><div className="rooms-dialog-actions"><button onClick={()=>setReasonFor(null)}>Voltar</button><button className="rooms-primary" disabled={pending||((operator||reasonFor.status==='rejected')&&reason.trim().length<5)} onClick={()=>applyDecision(reasonFor,reasonFor.status,reason)}>{pending?'Registrando...':'Confirmar decisão'}</button></div></div></div>}
        {formRoom&&<div className="rooms-dialog-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setFormRoom(null)}><form onSubmit={saveRoom} className="rooms-dialog" role="dialog" aria-modal="true" aria-labelledby="rooms-form-title"><button type="button" className="rooms-dialog-close" onClick={()=>setFormRoom(null)} aria-label="Fechar">×</button><span className="rooms-overline">CATÁLOGO INSTITUCIONAL</span><h2 id="rooms-form-title">{formRoom.id?'Editar sala':'Nova sala'}</h2><div className="rooms-form-duo"><label>Código<input required maxLength={25} value={formRoom.code} onChange={e=>setFormRoom({...formRoom,code:e.target.value})} placeholder="MUS-01"/></label><label>Capacidade<input required min="1" max="200" type="number" value={formRoom.capacity} onChange={e=>setFormRoom({...formRoom,capacity:Number(e.target.value)})}/></label></div><label>Nome<input required maxLength={100} value={formRoom.name} onChange={e=>setFormRoom({...formRoom,name:e.target.value})} placeholder="Sala de prática coletiva"/></label><label>Localização<input maxLength={150} value={formRoom.location} onChange={e=>setFormRoom({...formRoom,location:e.target.value})} placeholder="Bloco, andar ou sala"/></label><label>Equipamentos disponíveis<textarea rows={3} maxLength={600} value={formRoom.equipment} onChange={e=>setFormRoom({...formRoom,equipment:e.target.value})} placeholder="Ex.: piano, 4 estantes, amplificador"/></label><label className="rooms-checkbox"><input type="checkbox" checked={formRoom.active} onChange={e=>setFormRoom({...formRoom,active:e.target.checked})}/>Sala ativa e disponível para solicitações</label><div className="rooms-dialog-actions"><button type="button" onClick={()=>setFormRoom(null)}>Cancelar</button><button type="submit" className="rooms-primary" disabled={pending}>{pending?'Salvando...':'Salvar sala'}</button></div></form></div>}
      </>}
      <footer className="rooms-footer"><span>sonorum.</span><small>GESTÃO DE SALAS · REGISTRO E CONTROLE DIGITAL</small><button onClick={()=>onNavigate('inicio')}>Voltar ao início ↗</button></footer>
    </div>
  </div>;
}
