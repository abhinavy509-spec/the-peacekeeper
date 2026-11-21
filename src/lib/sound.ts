// Random cartoon click sounds, synthesized with WebAudio (no audio files to load).
let ctx: AudioContext | null = null;
const MUTE_KEY = "pk-muted";

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  c: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  dur: number,
  vol = 0.18,
  delay = 0,
) {
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const sounds: Array<(c: AudioContext) => void> = [
  // pop
  (c) => tone(c, "sine", 900, 300, 0.12, 0.25),
  // boing
  (c) => {
    const t = c.currentTime;
    const o = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.35);
    lfo.frequency.value = 22;
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain).connect(o.frequency);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g).connect(c.destination);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.4);
    lfo.stop(t + 0.4);
  },
  // blip-blip
  (c) => {
    tone(c, "square", 660, 660, 0.06, 0.08);
    tone(c, "square", 990, 990, 0.07, 0.08, 0.07);
  },
  // ding
  (c) => {
    tone(c, "triangle", 1320, 1300, 0.3, 0.2);
    tone(c, "triangle", 1760, 1740, 0.35, 0.12, 0.05);
  },
  // quack-ish
  (c) => tone(c, "sawtooth", 520, 260, 0.14, 0.1),
  // slide whistle up
  (c) => tone(c, "sine", 400, 1400, 0.22, 0.18),
  // tiny drum
  (c) => tone(c, "sine", 180, 50, 0.18, 0.35),
];

export function playRandomClick() {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const play = sounds[Math.floor(Math.random() * sounds.length)];
  play?.(c);
}
