/**
 * Plays a simple notification sound using the Web Audio API.
 * This avoids the need for external MP3 assets and works offline.
 */
export function playRestEndSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // A pleasant "ding-ding" sound
    osc.type = 'sine';

    // First note (E5)
    osc.frequency.setValueAtTime(659.25, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.15);

    // Second note (A5)
    osc.frequency.setValueAtTime(880, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.6);

    // Close context after playback to save resources
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 1000);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}
