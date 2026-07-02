/**
 * A loud, attention-grabbing "cash register" alert played when a payment receipt arrives, so
 * staff who are looking away notice it. Uses the Web Audio API — no audio asset files, fully
 * controllable. The chime is a bright two-note bell that repeats 3 times. Browsers block audio
 * until a user gesture, so `primeAudio()` must be called once from a real interaction (a
 * click/tap) to unlock later programmatic playback.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    // A compressor keeps the louder signal from clipping into harsh distortion.
    const compressor = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(compressor).connect(ctx.destination);
  }
  return ctx;
}

/** Unlock the audio context on a user gesture so later alert sounds are allowed to play. */
export function primeAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

/** Plays the bright two-note bell, repeated 3 times so it's hard to miss. */
export function playCashSound(): void {
  const c = getCtx();
  const dest = master;
  if (!c || !dest) return;
  // A suspended context drops anything scheduled against it (e.g. right after the first user
  // gesture), so wait for the resume to land before scheduling — otherwise the chime is silent.
  if (c.state === "suspended") {
    void c.resume().then(() => ring(c, dest));
    return;
  }
  ring(c, dest);
}

/** Schedules the three "cha-ching" rings starting from the context's current time. */
function ring(c: AudioContext, dest: AudioNode): void {
  const now = c.currentTime;
  const REPEATS = 3;
  const GAP = 0.42; // seconds between each "cha-ching"

  for (let r = 0; r < REPEATS; r++) {
    const start = now + r * GAP;
    // Two ascending notes per ring (the classic register "cha-ching").
    bell(c, dest, start, 1175); // D6
    bell(c, dest, start + 0.1, 1568); // G6
  }
}

/** One bell note: a bright triangle+sine blend with a quick attack and a ringing decay. */
function bell(c: AudioContext, dest: AudioNode, start: number, freq: number): void {
  const gain = c.createGain();
  gain.connect(dest);
  // Loud attack, then a smooth ring-out.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.7, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

  // Fundamental (triangle = brighter than sine) plus an octave shimmer for the "ching".
  const fundamental = c.createOscillator();
  fundamental.type = "triangle";
  fundamental.frequency.value = freq;
  fundamental.connect(gain);
  fundamental.start(start);
  fundamental.stop(start + 0.5);

  const shimmer = c.createOscillator();
  const shimmerGain = c.createGain();
  shimmerGain.gain.value = 0.35;
  shimmer.type = "sine";
  shimmer.frequency.value = freq * 2;
  shimmer.connect(shimmerGain).connect(gain);
  shimmer.start(start);
  shimmer.stop(start + 0.5);
}
