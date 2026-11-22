// SHADOW VAULT — tiny WebAudio synth: no audio files, every sound is an
// oscillator blip made on the spot (footsteps, coin ting, relic chime,
// suspicion sting, caught alarm, door-open chord).
let ctx = null;
function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
function blip(freq, dur, type = 'sine', gain = 0.05, slide = 0) {
  try {
    const a = ac(), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(gain, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  } catch { /* audio is garnish; silence is fine */ }
}
export const sfx = {
  step() { blip(90 + Math.random() * 30, 0.05, 'triangle', 0.016); },
  coin() { blip(1560, 0.09, 'square', 0.03); setTimeout(() => blip(2090, 0.12, 'square', 0.025), 55); },
  relic() { blip(880, 0.1, 'sine', 0.05); setTimeout(() => blip(1318, 0.16, 'sine', 0.05), 70); },
  spotted() { blip(220, 0.22, 'sawtooth', 0.06, 220); },
  caught() { blip(160, 0.4, 'sawtooth', 0.08, -90); },
  door() { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.05), i * 90)); },
  click() { blip(660, 0.05, 'sine', 0.03); },
};
