export class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  dataArray: Uint8Array | null = null;
  isPlaying = false;
  noiseBuffer: AudioBuffer | null = null;
  
  // Psytrance parameters
  bpm = 142;
  nextNoteTime = 0;
  current16thNote = 0;
  total16ths = 0;
  lookahead = 25.0; // ms
  scheduleAheadTime = 0.1; // s
  timerID: number | null = null;
  startTime = 0;

  // Acid synth parameters
  filterCutoff = 1000;
  filterSweepDir = 1;

  // Sound effects
  notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
  noteIndex = 0;

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error('AudioContext not supported');
        return;
      }
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Generate noise buffer for percussion
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      // Add some global delay/reverb for trippiness
      const delay = this.ctx.createDelay();
      delay.delayTime.value = (60 / this.bpm) * 0.75; // Dotted 8th delay
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.4;
      delay.connect(feedback);
      feedback.connect(delay);
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(delay);
      delay.connect(this.ctx.destination);
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize audio:', e);
    }
  }

  getFrequencyData() {
    if (!this.analyser || !this.dataArray || !this.isPlaying) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th note
    this.current16thNote++;
    this.total16ths++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  scheduleNote(beatNumber: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const bar = Math.floor(this.total16ths / 16);
    const section = Math.floor(bar / 8) % 4; // 8 bars per section, 4 sections total
    const barOfSection = bar % 8;

    let playKick = false;
    let playBass = false;
    let playSnare = false;
    let playClosedHat = false;
    let playOpenHat = false;
    let playAcid = false;
    let playArp = false;

    // 0: Intro/Groove, 1: Build, 2: Drop, 3: Breakdown
    if (section === 0) {
      if (beatNumber % 4 === 0) playKick = true;
      if (beatNumber % 4 !== 0) playBass = true;
      if (beatNumber % 2 === 0) playClosedHat = true;
      if (Math.random() > 0.8) playAcid = true;
    } else if (section === 1) {
      if (barOfSection < 4) {
        if (beatNumber % 4 === 0) { playKick = true; playSnare = true; }
        if (beatNumber % 4 !== 0) playBass = true;
      } else if (barOfSection < 6) {
        if (beatNumber % 2 === 0) { playKick = true; playSnare = true; }
      } else {
        playKick = true; playSnare = true; // Every 16th!
      }
      if (Math.random() > 0.5) playAcid = true;
    } else if (section === 2) {
      if (beatNumber % 4 === 0) playKick = true;
      if (beatNumber % 4 !== 0) playBass = true;
      if (beatNumber % 4 === 2) playOpenHat = true;
      else playClosedHat = true;
      if (beatNumber === 4 || beatNumber === 12) playSnare = true;
      if (Math.random() > 0.6) playAcid = true;
      if (beatNumber % 2 === 0) playArp = true;
    } else if (section === 3) {
      playArp = true;
      if (Math.random() > 0.4) playAcid = true;
      if (barOfSection === 7 && beatNumber % 4 === 0) playSnare = true; // Snare build at end of breakdown
    }

    if (playKick) this.playKick(time);
    if (playBass) this.playBass(time, section);
    if (playSnare) this.playSnare(time);
    if (playClosedHat) this.playHat(time, false);
    if (playOpenHat) this.playHat(time, true);
    if (playAcid) this.playAcid(time, beatNumber, section);
    if (playArp) this.playArp(time, beatNumber, bar);
  }

  playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  playBass(time: number, section: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.value = section === 2 ? 43.65 : 87.31; // F1 in drop, F2 otherwise
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playHat(time: number, isOpen: boolean) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.3 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (isOpen ? 0.15 : 0.05));
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.2);
  }

  playSnare(time: number) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.2);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(250, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  playAcid(time: number, beatNumber: number, section: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    const acidNotes = [174.61, 196.00, 233.08, 261.63, 311.13]; // F minor pentatonic
    osc.type = 'square';
    osc.frequency.value = acidNotes[beatNumber % acidNotes.length] * (section === 2 ? 4 : 2);
    
    this.filterCutoff += (section === 1 ? 100 : 50) * this.filterSweepDir;
    if (this.filterCutoff > 4000) this.filterSweepDir = -1;
    if (this.filterCutoff < 300) this.filterSweepDir = 1;
    
    filter.type = 'lowpass';
    filter.Q.value = 20;
    filter.frequency.setValueAtTime(this.filterCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);
    
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  playArp(time: number, beatNumber: number, bar: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const chords = [
      [174.61, 207.65, 261.63], // Fm
      [155.56, 196.00, 233.08], // D#
      [138.59, 164.81, 207.65], // C#
      [130.81, 164.81, 196.00]  // C
    ];
    const chord = chords[Math.floor(bar / 2) % 4];
    const note = chord[beatNumber % 3] * 2;

    osc.type = 'sawtooth';
    osc.frequency.value = note;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  playBgm() {
    if (!this.ctx) return;
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.startTime = this.ctx.currentTime;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.current16thNote = 0;
    this.total16ths = 0;
    this.scheduler();
  }

  getVisualState() {
    if (!this.isPlaying || !this.ctx) return { section: 0, intensity: 0.5, beat: 0, total16ths: 0 };
    
    const elapsedTime = this.ctx.currentTime - this.startTime;
    const secondsPerBeat = 60.0 / this.bpm;
    const total16ths = Math.floor(elapsedTime / (0.25 * secondsPerBeat));
    const beatNumber = total16ths % 16;
    const bar = Math.floor(total16ths / 16);
    const section = Math.floor(bar / 8) % 4;
    
    let intensity = 0.5;
    if (section === 0) intensity = 0.6;
    else if (section === 1) intensity = 0.6 + (bar % 8) * 0.05; // Builds up
    else if (section === 2) intensity = 1.0; // Drop
    else if (section === 3) intensity = 0.3; // Breakdown

    return { section, intensity, beat: beatNumber, total16ths };
  }

  stopBgm() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  playTapSound(isSpecial = false) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isSpecial) {
      // Special sound for ladybug
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    } else {
      // Normal tap
      const freq = this.notes[this.noteIndex % this.notes.length];
      this.noteIndex++;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playErrorSound() {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  setVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  getVolume(): number {
    return this.masterGain?.gain.value ?? 0.6;
  }

  mute(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  unmute(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = 0.6;
    }
  }

  isMuted(): boolean {
    return this.masterGain?.gain.value === 0;
  }
}

export const audio = new AudioEngine();
