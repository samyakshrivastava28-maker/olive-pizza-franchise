/**
 * SoundAlertEngine.ts
 *
 * Audio Alert System for Olive Pizza Franchise Management.
 * Provides chimes and alarms for critical operations, stock alerts, and branch notifications.
 */

export type SoundType =
  | 'new_order'
  | 'system_alert'
  | 'success'
  | 'test';

interface SoundSettings {
  muted: boolean;
  volume: number;
}

const SETTINGS_KEY = 'olive_franchise_sound_settings_v1';

export class SoundAlertEngine {
  private static audioCtx: AudioContext | null = null;

  static getSettings(): SoundSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { muted: false, volume: 0.75 };
  }

  static saveSettings(settings: Partial<SoundSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
  }

  static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx!;
  }

  static unlockAudio(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}
  }

  private static playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    volumeMultiplier = 0.5,
    delaySec = 0
  ) {
    const settings = this.getSettings();
    if (settings.muted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delaySec);

      const targetVol = Math.max(0.01, Math.min(1.0, settings.volume * volumeMultiplier));
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delaySec);
      gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + delaySec + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delaySec + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delaySec);
      osc.stop(ctx.currentTime + delaySec + durationSec + 0.02);
    } catch (err) {
      console.warn('[Franchise SoundAlertEngine] Audio error:', err);
    }
  }

  static playSound(type: SoundType): void {
    this.unlockAudio();
    switch (type) {
      case 'new_order':
        this.playTone(659, 0.18, 'sine', 0.6, 0);
        this.playTone(784, 0.18, 'sine', 0.65, 0.12);
        this.playTone(1046, 0.35, 'triangle', 0.8, 0.24);
        break;

      case 'system_alert':
        this.playTone(440, 0.2, 'square', 0.5, 0);
        this.playTone(330, 0.3, 'square', 0.5, 0.2);
        break;

      case 'success':
        this.playTone(523, 0.15, 'sine', 0.5, 0);
        this.playTone(659, 0.15, 'sine', 0.5, 0.1);
        this.playTone(784, 0.25, 'sine', 0.6, 0.2);
        break;

      case 'test':
        this.playTone(784, 0.2, 'sine', 0.6, 0);
        this.playTone(1046, 0.3, 'sine', 0.7, 0.15);
        break;
    }
  }
}

if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'keydown', 'pointerdown'];
  const handleInteraction = () => {
    SoundAlertEngine.unlockAudio();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, handleInteraction));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, handleInteraction, { passive: true }));
}
