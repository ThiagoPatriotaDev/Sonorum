import { getPitchInfo } from '../constants/musicCatalog.js';

let audioCtx = null;
let playbackTimers = [];

function ensureContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export const AudioEngine = {
  playNote(pitchStr, durBeats = 1, instrument = 'Violão', bpm = 100) {
    if (!pitchStr || pitchStr === 'REST') return;
    ensureContext();
    const info = getPitchInfo(pitchStr);
    if (!info) return;

    const now = audioCtx.currentTime;
    const durationSec = Math.max(0.18, (60 / bpm) * durBeats * 0.92);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (instrument === 'Violino') {
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + Math.min(0.08, durationSec * 0.3));
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    } else if (instrument === 'Flauta') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    } else {
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.27, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    }

    osc.frequency.setValueAtTime(info.freq, now);
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  },

  stop() {
    playbackTimers.forEach((t) => clearTimeout(t));
    playbackTimers = [];
  },

  playSequence(notes, { instrument = 'Violão', bpm = 100, onStep = null, onFinish = null } = {}) {
    this.stop();
    if (!notes || notes.length === 0) return;

    let elapsedMs = 0;
    const beatMs = (60 / bpm) * 1000;

    notes.forEach((n, idx) => {
      const durBeats = n.dur === 'rest' ? 1 : Number(n.dur || 1);
      const timer = setTimeout(() => {
        if (onStep) onStep(idx);
        if (n.pitch !== 'REST' && n.dur !== 'rest') {
          this.playNote(n.pitch, durBeats, instrument, bpm);
        }
      }, elapsedMs);
      playbackTimers.push(timer);
      elapsedMs += durBeats * beatMs;
    });

    const endTimer = setTimeout(() => {
      if (onStep) onStep(-1);
      if (onFinish) onFinish();
    }, elapsedMs + 50);
    playbackTimers.push(endTimer);
  }
};
