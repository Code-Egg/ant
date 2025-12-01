
import { TowerType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterGain: GainNode | null = null;

  init() {
    if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
    }
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
        this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    return this.muted;
  }
  
  isMuted() { return this.muted; }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.5) {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime + startTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + duration);
  }

  private playNoise(duration: number, vol: number = 0.5) {
      if (!this.ctx || !this.masterGain) return;
      // Reuse buffer if possible in future optimization, but creating small buffers is cheap enough
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      noise.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
  }

  playShoot(type: TowerType) {
      if (!this.ctx || this.muted) return;
      
      switch (type) {
          case 'SNIPER':
              this.playTone(800, 'square', 0.1, 0, 0.1);
              this.playNoise(0.15, 0.3);
              break;
          case 'BLAST':
              this.playNoise(0.3, 0.4);
              this.playTone(100, 'sawtooth', 0.2, 0, 0.4);
              break;
          case 'RAPID':
              this.playTone(300 + Math.random() * 50, 'sawtooth', 0.05, 0, 0.1);
              break;
          case 'ICE':
               this.playTone(1500, 'sine', 0.15, 0, 0.1);
               this.playTone(1200, 'sine', 0.15, 0.05, 0.1);
               break;
          case 'FIRE':
               this.playNoise(0.25, 0.3);
               break;
          default: // BASIC
              this.playTone(600, 'triangle', 0.08, 0, 0.1);
      }
  }

  playBuild() {
      if (!this.ctx || this.muted) return;
      // Positive Arpeggio
      this.playTone(440, 'sine', 0.1, 0, 0.1);
      this.playTone(554, 'sine', 0.1, 0.08, 0.1);
      this.playTone(659, 'sine', 0.2, 0.16, 0.1);
  }

  playError() {
      if (!this.ctx || this.muted) return;
      this.playTone(150, 'sawtooth', 0.15, 0, 0.2);
      this.playTone(100, 'sawtooth', 0.15, 0.1, 0.2);
  }

  playMoney() {
      if (!this.ctx || this.muted) return;
      // High pitch ding
      this.playTone(1200, 'sine', 0.1, 0, 0.1);
      this.playTone(2000, 'sine', 0.2, 0.05, 0.05);
  }

  playWaveStart() {
      if (!this.ctx || this.muted) return;
      // Rising alert
      this.playTone(300, 'triangle', 0.3, 0, 0.2);
      this.playTone(450, 'triangle', 0.5, 0.15, 0.2);
  }
  
  playGameOver() {
      if (!this.ctx || this.muted) return;
      // Descending sad tones
      this.playTone(400, 'sawtooth', 0.4, 0, 0.3);
      this.playTone(300, 'sawtooth', 0.4, 0.3, 0.3);
      this.playTone(200, 'sawtooth', 0.8, 0.6, 0.3);
  }
  
  playExplosion() {
       if (!this.ctx || this.muted) return;
       this.playNoise(0.4, 0.5);
  }
  
  playSelect() {
      if (!this.ctx || this.muted) return;
      this.playTone(800, 'sine', 0.05, 0, 0.05);
  }
}

export const audioManager = new AudioService();
