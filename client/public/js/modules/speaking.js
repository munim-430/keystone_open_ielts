/**
 * Module: Speaking Exam Interface (100% AI Automated Examiner)
 * Parts 1, 2, and 3 with Voice Synthesis, Mic Recording, Cue Card Scratchpad, and Waveform Visualizer
 */

class SpeakingModule {
  constructor() {
    this.container = document.getElementById('speaking-workspace');
    this.currentPart = 1;
    this.currentQuestionIdx = 0;
    this.timerInterval = null;
    this.isRecording = false;
  }

  init(examData, onModuleComplete) {
    this.exam = examData.speaking;
    this.onModuleComplete = onModuleComplete;
    this.container.style.display = 'flex';

    this.renderSpeakingLayout();
    this.startPart1();
  }

  renderSpeakingLayout() {
    this.container.innerHTML = `
      <div class="speaking-workspace">
        <!-- Examiner Visual Avatar -->
        <div class="examiner-avatar-box" id="examiner-avatar">
          <div class="examiner-speaking-pulse" id="examiner-pulse" style="display:none;"></div>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="#0366d6">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        <!-- Section / Question Phase Badge -->
        <div id="speaking-phase-tag" style="font-weight:700; font-size:0.88rem; color:#586069; text-transform:uppercase; margin-bottom:8px;">
          Part 1: Introduction & Interview
        </div>

        <!-- Prompt Display Card -->
        <div class="speaking-prompt-box">
          <h3 id="speaking-prompt-text">Connecting to AI Examiner...</h3>
        </div>

        <!-- Cue Card Container (Hidden initially, shown in Part 2) -->
        <div id="cue-card-container" style="display:none; width:100%;">
          <!-- Cue Card Content & Scratchpad -->
        </div>

        <!-- Waveform Audio Visualizer Canvas -->
        <canvas id="speaking-visualizer-canvas" class="audio-visualizer-canvas" width="600" height="60"></canvas>

        <!-- Dynamic Timer & Status Display -->
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:8px;">
          <div id="speaking-status-box" class="recording-status-indicator" style="display:none;">
            <div class="recording-dot"></div>
            <span id="recording-status-text">Recording Candidate Audio...</span>
          </div>

          <div id="speaking-countdown-display" style="font-weight:800; font-size:1.4rem; color:#1f2428;">
            00:00
          </div>
        </div>

        <!-- Actions -->
        <div style="margin-top:20px; display:flex; gap:12px;">
          <button id="btn-speaking-next" class="nav-action-btn primary" style="padding:10px 24px; font-size:1rem;" disabled>
            Next Question ▶
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-speaking-next').onclick = () => this.handleNextClicked();
  }

  // ==========================================
  // PART 1 FLOW
  // ==========================================
  startPart1() {
    this.currentPart = 1;
    this.currentQuestionIdx = 0;
    document.getElementById('speaking-phase-tag').textContent = 'Part 1: Introduction & Interview';
    this.deliverPart1Question();
  }

  deliverPart1Question() {
    const qList = this.exam.parts[0].questions;
    if (this.currentQuestionIdx >= qList.length) {
      this.startPart2();
      return;
    }

    const q = qList[this.currentQuestionIdx];
    this.setPrompt(q.examinerPrompt);
    this.disableNextBtn();

    this.speakExaminer(q.examinerPrompt, () => {
      // Examiner finished speaking -> start candidate recording
      this.startCandidateTurn(q.speakingSeconds, `p1_q${this.currentQuestionIdx + 1}`);
    });
  }

  // ==========================================
  // PART 2 FLOW (CUE CARD)
  // ==========================================
  startPart2() {
    this.currentPart = 2;
    document.getElementById('speaking-phase-tag').textContent = 'Part 2: Long Turn (Individual Candidate Response)';
    
    const part2 = this.exam.parts[1];
    const cue = part2.cueCard;

    const cueCardEl = document.getElementById('cue-card-container');
    cueCardEl.style.display = 'block';
    cueCardEl.innerHTML = `
      <div class="cue-card-card">
        <h4>${cue.topic}</h4>
        <p style="margin-bottom:8px; font-size:0.9rem; color:#586069;">You should say:</p>
        <ul>
          ${cue.bulletPoints.map(pt => `<li>${pt}</li>`).join('')}
        </ul>
        <div style="margin-top:14px;">
          <label style="font-weight:600; font-size:0.85rem; color:#24292e;">
            Candidate Scratchpad (Notes during 1-min prep):
          </label>
          <textarea id="part2-scratchpad" class="scratchpad-textarea" 
            placeholder="Jot down keywords, outline bullet points, or high-level vocabulary here..."></textarea>
        </div>
      </div>
    `;

    this.setPrompt('You have 1 minute to read the topic and prepare notes. Your talk will begin automatically after the tone.');
    this.disableNextBtn();

    // 1-minute preparation countdown
    window.audioEngine.playChime('start');
    this.startCountdown(part2.preparationSeconds || 60, () => {
      // 1-min prep finished! Save candidate notes
      const notes = document.getElementById('part2-scratchpad').value;
      window.IELTS_STATE.answers.speaking.notes = notes;
      window.apiClient.saveAnswers(window.IELTS_STATE.sessionId, 'speaking', { notes });

      // Signal start of 2-minute talk with tone
      window.audioEngine.playChime('warning');
      this.setPrompt('Please start speaking now. You have up to 2 minutes on your topic.');
      this.startCandidateTurn(part2.speakingSeconds || 120, 'p2_cuecard', () => {
        this.startPart3();
      });
    });
  }

  // ==========================================
  // PART 3 FLOW (DISCUSSION)
  // ==========================================
  startPart3() {
    this.currentPart = 3;
    this.currentQuestionIdx = 0;
    document.getElementById('cue-card-container').style.display = 'none';
    document.getElementById('speaking-phase-tag').textContent = 'Part 3: Two-Way Abstract Discussion';
    this.deliverPart3Question();
  }

  deliverPart3Question() {
    const qList = this.exam.parts[2].questions;
    if (this.currentQuestionIdx >= qList.length) {
      this.finalizeSpeaking();
      return;
    }

    const q = qList[this.currentQuestionIdx];
    this.setPrompt(q.examinerPrompt);
    this.disableNextBtn();

    this.speakExaminer(q.examinerPrompt, () => {
      this.startCandidateTurn(q.speakingSeconds, `p3_q${this.currentQuestionIdx + 1}`);
    });
  }

  // Helpers
  speakExaminer(text, onFinished) {
    const pulse = document.getElementById('examiner-pulse');
    if (pulse) pulse.style.display = 'block';

    window.audioEngine.speakPrompt(
      text,
      () => {},
      () => {
        if (pulse) pulse.style.display = 'none';
        if (onFinished) onFinished();
      }
    );
  }

  startCandidateTurn(seconds, partName, onComplete) {
    const statusBox = document.getElementById('speaking-status-box');
    const canvas = document.getElementById('speaking-visualizer-canvas');
    statusBox.style.display = 'flex';
    this.isRecording = true;
    this.currentPartName = partName;
    this.onTurnCompleteCallback = onComplete;

    window.audioEngine.startRecording(canvas);
    this.enableNextBtn();

    this.startCountdown(seconds, async () => {
      await this.stopTurnAndUpload();
      if (onComplete) onComplete();
      else this.advanceQuestion();
    });
  }

  async stopTurnAndUpload() {
    if (!this.isRecording) return;
    this.isRecording = false;

    const statusBox = document.getElementById('speaking-status-box');
    if (statusBox) statusBox.style.display = 'none';

    try {
      const audioBlob = await window.audioEngine.stopRecording();
      if (audioBlob && audioBlob.size > 0 && window.IELTS_STATE.sessionId) {
        window.apiClient.uploadAudio(window.IELTS_STATE.sessionId, this.currentPartName, audioBlob);
      }
    } catch (e) {
      console.warn('Audio upload warning:', e);
    }
  }

  async handleNextClicked() {
    this.stopCountdown();
    await this.stopTurnAndUpload();

    if (this.onTurnCompleteCallback) {
      const cb = this.onTurnCompleteCallback;
      this.onTurnCompleteCallback = null;
      cb();
    } else {
      this.advanceQuestion();
    }
  }

  advanceQuestion() {
    this.currentQuestionIdx++;
    if (this.currentPart === 1) this.deliverPart1Question();
    else if (this.currentPart === 3) this.deliverPart3Question();
  }

  startCountdown(seconds, onExpire) {
    this.stopCountdown();
    let left = seconds;
    this.updateTimerDisplay(left);

    this.timerInterval = setInterval(() => {
      left--;
      this.updateTimerDisplay(left);
      if (left <= 0) {
        this.stopCountdown();
        if (onExpire) onExpire();
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay(seconds) {
    const el = document.getElementById('speaking-countdown-display');
    if (!el) return;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
  }

  setPrompt(txt) {
    const el = document.getElementById('speaking-prompt-text');
    if (el) el.textContent = txt;
  }

  enableNextBtn() {
    const btn = document.getElementById('btn-speaking-next');
    if (btn) btn.disabled = false;
  }

  disableNextBtn() {
    const btn = document.getElementById('btn-speaking-next');
    if (btn) btn.disabled = true;
  }

  async finalizeSpeaking() {
    this.setPrompt('Speaking test completed! Submitting recordings and running AI Diagnostic Evaluation...');
    document.getElementById('btn-speaking-next').style.display = 'none';

    window.audioEngine.playChime('end');

    if (this.onModuleComplete) {
      this.onModuleComplete();
    }
  }

  destroy() {
    this.stopCountdown();
    window.audioEngine.stopSpeaking();
    this.container.style.display = 'none';
  }
}

window.SpeakingModule = SpeakingModule;
