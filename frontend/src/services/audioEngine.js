import { getPitchInfo } from '../constants/musicCatalog.js';

// Síntese local com envelopes, harmônicos e ruído de ataque.
// Não são samples acústicos: os timbres aproximam cada família instrumental.
let audioCtx = null;
let master = null;
const playbackTimers = new Set();
const activeSounds = new Set();

function ensureContext() {
  if (!audioCtx) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error('Seu navegador não oferece Web Audio.');
    audioCtx = new Context();
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 18;
    limiter.ratio.value = 3;
    limiter.attack.value = .003;
    limiter.release.value = .2;
    const volume = audioCtx.createGain(); volume.gain.value = .56;
    volume.connect(limiter); limiter.connect(audioCtx.destination);
    master = volume;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function envelope(gain, now, attack, decay, sustain, end, release) {
  const g = gain.gain;
  const total = Math.max(.08, end-now);
  const attackEnd = now + Math.max(.002, Math.min(attack, total*.22));
  const decayEnd = attackEnd + Math.min(decay, total*.34);
  const releaseStart = Math.max(decayEnd + .003, end - Math.min(release,total*.34));
  g.cancelScheduledValues(now);
  g.setValueAtTime(.0001, now);
  g.linearRampToValueAtTime(1, attackEnd);
  g.exponentialRampToValueAtTime(Math.max(.001, sustain), decayEnd);
  if (releaseStart < end) g.setValueAtTime(Math.max(.001, sustain), releaseStart);
  g.exponentialRampToValueAtTime(.0001, end);
}

function makeVoice(ctx, now, freq, dur, instrument) {
  const total = Math.max(.14, dur);
  const end = now + total;
  const output = ctx.createGain();
  output.gain.setValueAtTime(.0001, now);
  output.connect(master);
  const nodes = [];
  const osc = (multiple, volume, type = 'sine', detune = 0) => {
    const source = ctx.createOscillator();
    source.type = type;
    source.frequency.value = freq * multiple;
    source.detune.value = detune;
    const component = ctx.createGain(); component.gain.value = volume;
    source.connect(component); component.connect(output);
    source.start(now); source.stop(end + .045); nodes.push(source);
    return source;
  };
  const key = instrument.toLowerCase();
  if (key.includes('violino')) {
    [0, .47, .31, .17, .11, .06].forEach((amp, index) => { if (index) osc(index + 1, amp, index <= 3 ? 'sine' : 'triangle'); });
    const fundamental = osc(1, .48, 'sawtooth');
    const vibrato = ctx.createOscillator(); const depth = ctx.createGain();
    vibrato.frequency.value = 5.25; depth.gain.value = 7.8;
    vibrato.connect(depth); depth.connect(fundamental.detune);
    vibrato.start(now); vibrato.stop(end + .045); nodes.push(vibrato);
    envelope(output, now, .095, .13, .27, end, Math.min(.13, total*.28));
  } else if (key.includes('flauta')) {
    osc(1, .8); osc(2,.055); osc(3,.018);
    envelope(output, now, .055, .14, .27, end, Math.min(.16,total*.3));
  } else if (key.includes('saxofone')) {
    osc(1, .29, 'sawtooth'); osc(2, .18); osc(3, .11); osc(4, .052);
    envelope(output, now, .065, .15, .24, end, Math.min(.15,total*.28));
  } else if (key.includes('canto') || key.includes('voz')) {
    osc(1, .53); osc(2,.22); osc(3,.12); osc(4,.045);
    envelope(output, now, .09, .12, .25, end, Math.min(.18,total*.34));
  } else if (key.includes('teclado') || key.includes('piano')) {
    osc(1, .57); osc(2,.22,'sine',.6); osc(3,.08,'sine',1.8); osc(4,.03,'sine',2.2);
    envelope(output, now, .006, .24, .065, end, Math.min(.19,total*.32));
  } else {
    // Cordas dedilhadas: fundamental e parciais com decaimento rápido.
    osc(1, key.includes('baixo') ? .58 : .49, 'triangle');
    osc(2,.19); osc(3,.09); osc(4,.036);
    envelope(output, now, .006, key.includes('baixo') ? .24 : .2, .032, end, Math.min(.14,total*.3));
  }
  return {output, nodes, end};
}

function playPercussion(ctx, now, dur, pitch) {
  const end = now + Math.min(.43, Math.max(.16,dur));
  const output = ctx.createGain(); output.connect(master);
  const nodes = [];
  const snare = pitch?.startsWith('G');
  const kick = pitch?.startsWith('C');
  if (kick) {
    const source=ctx.createOscillator(); source.type='sine'; source.frequency.setValueAtTime(135,now);
    source.frequency.exponentialRampToValueAtTime(47,now+.18);
    source.connect(output); source.start(now); source.stop(end); nodes.push(source);
    envelope(output,now,.002,.085,.15,end,.13);
  } else {
    const size=Math.ceil(ctx.sampleRate*.22); const buffer=ctx.createBuffer(1,size,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for (let i=0;i<size;i++) data[i]=Math.random()*2-1;
    const source=ctx.createBufferSource();source.buffer=buffer;
    const filter=ctx.createBiquadFilter(); filter.type=snare?'bandpass':'highpass';filter.frequency.value=snare?1800:6200;
    source.connect(filter); filter.connect(output);source.start(now); nodes.push(source);
    envelope(output,now,.002,.05,.016,end,Math.min(.13,dur*.65));
    if (snare) { const tone=ctx.createOscillator(); tone.frequency.value=184;const gain=ctx.createGain();gain.gain.value=.14;tone.connect(gain);gain.connect(output);tone.start(now);tone.stop(end);nodes.push(tone); }
  }
  return {output,nodes,end};
}

function makeTrackedSound(pitchStr, durBeats, instrument, bpm) {
  if (!pitchStr || pitchStr === 'REST') return;
  const ctx = ensureContext();
  const info = getPitchInfo(pitchStr);
  if (!info) return;
  const start = ctx.currentTime + .002;
  const seconds = Math.max(.18, (60 / Math.max(30,bpm)) * durBeats * .91);
  const sound = instrument.toLowerCase().includes('bateria')
    ? playPercussion(ctx, start, seconds, pitchStr)
    : makeVoice(ctx, start, info.freq, seconds, instrument);
  const handle = {
    ...sound,
    stop() {
      const t = ctx.currentTime;
      this.output.gain.cancelScheduledValues(t);
      this.output.gain.setValueAtTime(Math.max(this.output.gain.value, .0001), t);
      this.output.gain.linearRampToValueAtTime(.0001, t + .027);
      this.nodes.forEach(node => { try { node.stop(t + .04); } catch {} });
    }
  };
  activeSounds.add(handle);
  const last = sound.nodes[0];
  if (last) last.onended = () => { activeSounds.delete(handle); try { sound.output.disconnect(); } catch {} };
}

export const AudioEngine = {
  playNote(pitchStr, durBeats = 1, instrument = 'Violão', bpm = 100) {
    try { makeTrackedSound(pitchStr, Number(durBeats) || 1, instrument, Number(bpm) || 100); }
    catch (error) { console.warn('A reprodução de áudio não pôde iniciar:', error); }
  },
  stop() {
    playbackTimers.forEach(timer => clearTimeout(timer));
    playbackTimers.clear();
    activeSounds.forEach(sound => sound.stop());
    activeSounds.clear();
  },
  playSequence(notes, { instrument = 'Violão', bpm = 100, onStep = null, onFinish = null } = {}) {
    this.stop();
    if (!Array.isArray(notes) || !notes.length) return;
    let elapsedMs = 0;
    const beatMs = (60 / Math.max(30,Number(bpm) || 100)) * 1000;
    notes.forEach((note, index) => {
      const beats = note.dur === 'rest' ? 1 : Math.max(.25, Number(note.dur) || 1);
      const timer = setTimeout(() => {
        playbackTimers.delete(timer);
        if (onStep) onStep(index);
        if (note.pitch !== 'REST' && note.dur !== 'rest') this.playNote(note.pitch, beats, instrument, bpm);
      }, elapsedMs);
      playbackTimers.add(timer);
      elapsedMs += beats * beatMs;
    });
    const endTimer = setTimeout(() => {
      playbackTimers.delete(endTimer);
      if (onStep) onStep(-1);
      if (onFinish) onFinish();
    }, elapsedMs + 50);
    playbackTimers.add(endTimer);
  }
};
