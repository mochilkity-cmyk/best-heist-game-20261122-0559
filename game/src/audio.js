// Sound: tiny synthesised bleeps through the Web Audio API — no audio
// files, no network. A soft blip for loot, a rising tick while spotted,
// a little fanfare for the getaway and a low thud for the catch.

export class SoundBoard {
  constructor() {
    this.context = null;
    this.muted = false;
    this.lastTickAt = 0;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(frequency, duration, type, gainValue, when = 0) {
    if (this.muted || !this.context) return;
    const start = this.context.currentTime + when;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  pickup() {
    this.tone(880, 0.12, 'sine', 0.12);
    this.tone(1318, 0.18, 'sine', 0.1, 0.07);
  }

  diamond() {
    this.tone(659, 0.14, 'triangle', 0.14);
    this.tone(988, 0.14, 'triangle', 0.12, 0.09);
    this.tone(1318, 0.3, 'triangle', 0.12, 0.18);
  }

  gadget() {
    this.tone(420, 0.1, 'square', 0.05);
    this.tone(300, 0.16, 'square', 0.05, 0.06);
  }

  coin() {
    this.tone(1568, 0.09, 'sine', 0.09);
    this.tone(2093, 0.12, 'sine', 0.07, 0.05);
  }

  spottedTick(now) {
    if (now - this.lastTickAt < 0.45) return;
    this.lastTickAt = now;
    this.tone(220, 0.08, 'square', 0.05);
  }

  win() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.tone(freq, 0.22, 'triangle', 0.13, index * 0.12);
    });
  }

  lose() {
    this.tone(196, 0.5, 'sawtooth', 0.09);
    this.tone(131, 0.7, 'sawtooth', 0.09, 0.18);
  }
}
