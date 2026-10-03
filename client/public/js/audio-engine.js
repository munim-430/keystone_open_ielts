/**
 * IELTS CD Mock Test Platform - Real-Time Audio Engine
 * Supports Web Audio API synthesis, Web Speech API AI Examiner, and MediaRecorder capture
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.currentVolume = 1.0;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.analyser = null;
    this.micStream = null;
    this.visualizerAnimationId = null;
    this.synth = window.speechSynthesis;
    this.examinerVoice = null;
    this.recognition = null;
    this.currentTranscript = '';
    this.isRecognizing = false;

    this.initVoices();
    this.initSpeechRecognition();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.initVoices();
    }
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (!this.masterGain && this.audioCtx) {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolume(level) {
    const clamped = Math.max(0, Math.min(1, parseFloat(level) || 0));
    this.currentVolume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
    return clamped;
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const piece = event.results[i][0].transcript.trim();
            if (piece) {
              this.currentTranscript = (this.currentTranscript + ' ' + piece).trim();
            }
          }
        }
      };

      this.recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
      };

      this.recognition.onend = () => {
        if (this.isRecognizing) {
          try { this.recognition.start(); } catch (err) {}
        }
      };
    } catch (e) {
      console.warn('Speech recognition init error:', e);
    }
  }

  initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer British English or clear English voice
    this.examinerVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('British') || v.name.includes('UK'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0] || null;
  }

  /**
   * Plays official IELTS exam chimes using pure Web Audio oscillator synthesis
   */
  playChime(type = 'start') {
    try {
      this.ensureAudioContext();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.masterGain || this.audioCtx.destination);

      if (type === 'start') {
        // High melodic two-tone chime
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'warning') {
        // Warning chime
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'end') {
        // End chime
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  /**
   * AI Examiner Voice Synthesizer
   */
  speakPrompt(text, onStart, onEnd) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel(); // cancel any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.examinerVoice) {
      utterance.voice = this.examinerVoice;
    }
    utterance.rate = 0.95; // Slightly measured, formal IELTS examiner pacing
    utterance.pitch = 1.0;

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = (err) => {
      console.warn('Speech synthesis error:', err);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Initializes microphone capture and connects to AnalyserNode
   */
  async requestMicPermission() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.ensureAudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return false;
    }
  }

  /**
   * Starts candidate voice recording with continuous STT transcript capture
   */
  startRecording(canvasElement = null) {
    if (!this.micStream) {
      throw new Error('Microphone stream not initialized');
    }

    this.recordedChunks = [];
    this.currentTranscript = '';
    this.isRecognizing = true;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {}
    }

    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm';
    }

    this.mediaRecorder = new MediaRecorder(this.micStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Record in 250ms time slices

    if (canvasElement && this.analyser) {
      this.startVisualizer(canvasElement);
    }
  }

  /**
   * Stops voice recording and returns Blob + captured transcript
   */
  stopRecording() {
    this.isRecognizing = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }

    return new Promise((resolve) => {
      if (this.visualizerAnimationId) {
        cancelAnimationFrame(this.visualizerAnimationId);
      }

      const transcript = this.currentTranscript.trim();

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve({ blob, transcript });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve({ blob, transcript });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Live Real-Time Waveform / VU Visualizer on HTML5 Canvas
   */
  startVisualizer(canvas) {
    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.visualizerAnimationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#1f2428';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = dataArray[i] > 180 ? '#f85149' : (dataArray[i] > 80 ? '#388bfd' : '#2ea44f');
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();
  }
}

window.audioEngine = new AudioEngine();
