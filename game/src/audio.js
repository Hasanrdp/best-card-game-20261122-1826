// Court of Embers: the sounds. Every effect is a small WebAudio phrase, made
// from oscillators, so the game ships no audio files and never fetches one.
// Sounds start only after the player presses a key or clicks, as browsers
// require, and M mutes everything.
let context = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audioContext() {
  if (context === null) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

// One note: a sine or triangle tone that rises or falls a little.
function tone(when, length, fromHz, toHz, kind, loudness) {
  const audio = audioContext();
  if (audio === null) return;
  const voice = audio.createOscillator();
  const gain = audio.createGain();
  voice.type = kind;
  voice.frequency.setValueAtTime(fromHz, when);
  voice.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), when + length);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(loudness, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  voice.connect(gain).connect(audio.destination);
  voice.start(when);
  voice.stop(when + length + 0.02);
}

function phrase(notes) {
  if (muted) return;
  const audio = audioContext();
  if (audio === null) return;
  const start = audio.currentTime + 0.01;
  for (const note of notes) tone(start + note.at, note.len, note.from, note.to, note.kind, note.loud);
}

export function soundDraw() {
  phrase([{ at: 0, len: 0.07, from: 660, to: 880, kind: 'triangle', loud: 0.05 }]);
}

export function soundPlay() {
  phrase([
    { at: 0, len: 0.08, from: 520, to: 420, kind: 'triangle', loud: 0.08 },
    { at: 0.06, len: 0.1, from: 780, to: 660, kind: 'triangle', loud: 0.06 },
  ]);
}

export function soundStrike() {
  phrase([
    { at: 0, len: 0.16, from: 220, to: 60, kind: 'sawtooth', loud: 0.12 },
    { at: 0.02, len: 0.1, from: 880, to: 440, kind: 'square', loud: 0.04 },
  ]);
}

export function soundWard() {
  phrase([{ at: 0, len: 0.18, from: 330, to: 495, kind: 'sine', loud: 0.08 }]);
}

export function soundMend() {
  phrase([
    { at: 0, len: 0.12, from: 523, to: 659, kind: 'sine', loud: 0.07 },
    { at: 0.1, len: 0.16, from: 659, to: 784, kind: 'sine', loud: 0.07 },
  ]);
}

export function soundWin() {
  phrase([
    { at: 0, len: 0.16, from: 523, to: 523, kind: 'triangle', loud: 0.09 },
    { at: 0.14, len: 0.16, from: 659, to: 659, kind: 'triangle', loud: 0.09 },
    { at: 0.28, len: 0.16, from: 784, to: 784, kind: 'triangle', loud: 0.09 },
    { at: 0.42, len: 0.34, from: 1047, to: 1047, kind: 'triangle', loud: 0.1 },
  ]);
}

export function soundLoss() {
  phrase([
    { at: 0, len: 0.22, from: 392, to: 370, kind: 'triangle', loud: 0.09 },
    { at: 0.2, len: 0.22, from: 330, to: 311, kind: 'triangle', loud: 0.09 },
    { at: 0.4, len: 0.44, from: 262, to: 233, kind: 'triangle', loud: 0.1 },
  ]);
}
