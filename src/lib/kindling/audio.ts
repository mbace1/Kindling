let ctx: AudioContext | null = null;
let fireNodes: { stop: () => void } | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  audio();
}

export function playTick() {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.value = 280;
  g.gain.value = 0.05;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
  o.stop(c.currentTime + 0.1);
}

export function playHit() {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 90;
  g.gain.value = 0.04;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14);
  o.stop(c.currentTime + 0.15);
}

export function startFireLoop() {
  const c = audio();
  if (!c || fireNodes) return;
  const bufferSize = 2 * c.sampleRate;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  const g = c.createGain();
  g.gain.value = 0.035;
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
  fireNodes = {
    stop: () => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      fireNodes = null;
    },
  };
}

export function stopFireLoop() {
  fireNodes?.stop();
  fireNodes = null;
}
