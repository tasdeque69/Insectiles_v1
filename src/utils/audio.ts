export class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  bpm = 128;
  isPlaying = false;
  current16thNote = 0;
  nextNoteTime = 0.0;
  scheduleAheadTime = 0.1;
  lookahead = 25.0;
  timerID: number | null = null;
  startTime = 0;
  filterCutoff = 1000;
  filterSweepDir = 1;
  noiseBuffer: AudioBuffer | null = null;
  notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  noteIndex = 0;
  muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.5;
    }
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.5;
    const bufferSize = 2 * this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  scheduleNote(beatNumber: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bar = Math.floor(this.current16thNote / 16);
    const barOfSection = bar % 8;
    const section = Math.floor(bar / 8) % 4;
    let playKick = false, playBass = false, playSnare = false, playClosedHat = false, playOpenHat = false, playAcid = false, playArp = false;
    if (section === 0) {
      if (beatNumber % 4 === 0) playKick = true;
      if (beatNumber % 4 !== 0) playBass = true;
      if (beatNumber % 2 === 0) playClosedHat = true;
      if (Math.random() > 0.8) playAcid = true;
    } else if (section === 1) {
      if (barOfSection < 4) { if (beatNumber % 4 === 0) { playKick = true; playSnare = true; } if (beatNumber % 4 !== 0) playBass = true; }
      else if (barOfSection < 6) { if (beatNumber % 2 === 0) { playKick = true; playSnare = true; } }
      else { playKick = true; playSnare = true; }
      if (Math.random() > 0.5) playAcid = true;
    } else if (section === 2) {
      if (beatNumber % 4 === 0) playKick = true;
      if (beatNumber % 4 !== 0) playBass = true;
      if (beatNumber % 4 === 2) playOpenHat = true; else playClosedHat = true;
      if (beatNumber === 4 || beatNumber === 12) playSnare = true;
      if (Math.random() > 0.6) playAcid = true;
      if (beatNumber % 2 === 0) playArp = true;
    } else if (section === 3) {
      playArp = true;
      if (Math.random() > 0.4) playAcid = true;
      if (barOfSection === 7 && beatNumber % 4 === 0) playSnare = true;
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
    osc.connect(gain); gain.connect(this.masterGain);
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.start(time); osc.stop(time + 0.5);
  }

  playBass(time: number, section: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.value = section === 2 ? 43.65 : 87.31;
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    osc.start(time); osc.stop(time + 0.15);
  }

  playHat(time: number, isOpen: boolean) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 6000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.3 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (isOpen ? 0.15 : 0.05));
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start(time); noise.stop(time + 0.2);
  }

  playSnare(time: number) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 2000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(this.masterGain);
    noise.start(time); noise.stop(time + 0.2);
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle'; const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(250, time); osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    oscGain.gain.setValueAtTime(0.4, time); oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain); oscGain.connect(this.masterGain); osc.start(time); osc.stop(time + 0.2);
  }

  playAcid(time: number, beatNumber: number, section: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const acidNotes = [174.61, 196.00, 233.08, 261.63, 311.13];
    const acidNote = acidNotes[beatNumber % acidNotes.length] ?? 261.63;
    osc.type = 'square'; osc.frequency.value = acidNote * (section === 2 ? 4 : 2);
    this.filterCutoff += (section === 1 ? 100 : 50) * this.filterSweepDir;
    if (this.filterCutoff > 4000) this.filterSweepDir = -1;
    if (this.filterCutoff < 300) this.filterSweepDir = 1;
    filter.type = 'lowpass'; filter.Q.value = 20;
    filter.frequency.setValueAtTime(this.filterCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    osc.start(time); osc.stop(time + 0.2);
  }

  playArp(time: number, beatNumber: number, bar: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const chords = [[174.61, 207.65, 261.63], [155.56, 196.00, 233.08], [138.59, 164.81, 207.65], [130.81, 164.81, 196.00]];
    const chord = chords[Math.floor(bar / 2) % 4];
    if (!chord) return;
    const note = (chord[beatNumber % 3] ?? 261.63) * 2;
    osc.type = 'sawtooth'; osc.frequency.value = note;
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(2500, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    osc.start(time); osc.stop(time + 0.2);
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
    if (this.muted) return;
    if (!this.ctx) return;
    if (this.isPlaying) return;
    this.isPlaying = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.startTime = this.ctx.currentTime;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.current16thNote = 0;
    this.scheduler();
  }

  stopBgm() {
    this.isPlaying = false;
    if (this.timerID !== null) { window.clearTimeout(this.timerID); this.timerID = null; }
  }

  playTapSound(isFever = false) {
    if (this.muted) return;
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (isFever) {
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    } else {
      const freq = this.notes[this.noteIndex % this.notes.length] ?? 261.63;
      this.noteIndex++; osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    }
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }

  playFeverActivation() {
    if (this.muted) return;
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.5);
  }

  playErrorSound() {
    if (this.muted) return;
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }
}
export const audio = new AudioEngine();
