/**
 * Module: Listening Exam Interface (40 Questions)
 */

class ListeningModule {
  constructor() {
    this.container = document.getElementById('listening-workspace');
    this.currentPartIndex = 0;
    this.audioElement = null;
    this.audioInterval = null;
  }

  init(examData, onModuleComplete) {
    this.exam = examData.listening;
    this.onModuleComplete = onModuleComplete;
    this.container.style.display = 'flex';

    this.renderListeningLayout();
    this.loadPart(0);
    this.startAudioSimulation();
  }

  renderListeningLayout() {
    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; width:100%; height:100%;">
        <!-- Audio Status & Control Bar -->
        <div class="listening-audio-controller">
          <div style="display:flex; align-items:center; gap:12px;">
            <button id="btn-audio-toggle" class="ctrl-btn" style="background:#0366d6;">▶ Play Audio</button>
            <span id="audio-part-label" style="font-weight:600; font-size:0.9rem;">Part 1 - Recording</span>
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin:0 10px;">
            <span style="font-size:1rem;" title="Volume">🔊</span>
            <input type="range" id="listening-volume-slider" min="0" max="1" step="0.05" value="1" style="width:80px; cursor:pointer;" title="Adjust Volume" />
          </div>

          <div class="audio-progress-track">
            <div id="audio-progress-bar" class="audio-progress-fill"></div>
          </div>
          <div style="font-size:0.85rem; color:#8c959f; min-width:85px; text-align:right;" id="audio-time-label">00:00 / 30:00</div>

          <!-- Part Navigation Tabs -->
          <div class="listening-part-tabs" style="display:flex; gap:6px; margin-left:14px;">
            <button class="listening-part-tab-btn active" data-part="0">Part 1</button>
            <button class="listening-part-tab-btn" data-part="1">Part 2</button>
            <button class="listening-part-tab-btn" data-part="2">Part 3</button>
            <button class="listening-part-tab-btn" data-part="3">Part 4</button>
          </div>
        </div>

        <!-- Listening Content Pane -->
        <div id="listening-content-pane" style="flex:1; overflow-y:auto; padding:24px 36px; background:#fff;">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    const toggleBtn = document.getElementById('btn-audio-toggle');
    toggleBtn.onclick = () => this.toggleAudio();

    const volSlider = document.getElementById('listening-volume-slider');
    if (volSlider) {
      volSlider.oninput = (e) => {
        if (window.audioEngine && window.audioEngine.setVolume) {
          window.audioEngine.setVolume(parseFloat(e.target.value));
        }
      };
    }

    const tabBtns = this.container.querySelectorAll('.listening-part-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        const pIdx = parseInt(btn.dataset.part, 10);
        this.loadPart(pIdx);
      };
    });
  }

  loadPart(partIdx) {
    this.currentPartIndex = partIdx;
    const part = this.exam.parts[partIdx];
    const pane = document.getElementById('listening-content-pane');
    const label = document.getElementById('audio-part-label');
    if (label) label.textContent = `${part.title}`;

    const tabBtns = this.container.querySelectorAll('.listening-part-tab-btn');
    tabBtns.forEach(btn => {
      const idx = parseInt(btn.dataset.part, 10);
      btn.classList.toggle('active', idx === partIdx);
    });

    let html = `
      <div style="max-width:900px; margin:0 auto;">
        <div style="margin-bottom:20px; border-bottom:2px solid #e1e4e8; padding-bottom:12px;">
          <h2 style="font-size:1.3rem; color:#1f2428;">${part.title}</h2>
          <p style="color:#586069; font-size:0.95rem; margin-top:4px;">${part.context}</p>
          <div style="background:#f6f8fa; border-left:4px solid #0366d6; padding:8px 12px; margin-top:10px; font-weight:600; font-size:0.88rem;">
            ${part.instructions}
          </div>
        </div>

        <div class="questions-list">
    `;

    for (const q of part.questions) {
      const qVal = window.IELTS_STATE.answers.listening[q.id] || '';
      html += `
        <div class="question-item-card" id="q-card-${q.id}">
          <div class="q-header">
            <span class="q-num-tag">Question ${q.id}</span>
            <label class="review-checkbox-wrapper">
              <input type="checkbox" onchange="toggleFlagQuestion(${q.id}, this.checked)" ${window.IELTS_STATE.flaggedQuestions.has(q.id) ? 'checked' : ''}>
              Review
            </label>
          </div>
      `;

      if (q.type === 'fill_blank') {
        const promptWithInput = q.prompt.replace(/______/g, `
          <input type="text" class="ielts-input-blank" 
            data-qid="${q.id}" 
            value="${escapeHtml(qVal)}" 
            oninput="saveListeningAnswer(${q.id}, this.value)" 
            autocomplete="off" spellcheck="false" />
        `);
        html += `<div class="q-prompt-text">${promptWithInput}</div>`;
      } else if (q.type === 'multiple_choice') {
        html += `<div class="q-prompt-text">${q.prompt}</div>`;
        html += `<div class="mcq-options-container">`;
        for (const opt of q.options) {
          const optLetter = opt.charAt(0);
          const isSelected = qVal === optLetter;
          html += `
            <label class="mcq-option-row ${isSelected ? 'selected' : ''}" onclick="selectListeningMcq(${q.id}, '${optLetter}', this)">
              <input type="radio" name="q_${q.id}" value="${optLetter}" ${isSelected ? 'checked' : ''}>
              <span>${opt}</span>
            </label>
          `;
        }
        html += `</div>`;
      }

      html += `</div>`;
    }

    html += `</div></div>`;
    pane.innerHTML = html;
  }

  toggleAudio() {
    const btn = document.getElementById('btn-audio-toggle');
    if (!this.isPlaying) {
      this.isPlaying = true;
      btn.textContent = '⏸ Pause';
      window.audioEngine.playChime('start');
    } else {
      this.isPlaying = false;
      btn.textContent = '▶ Play Audio';
    }
  }

  startAudioSimulation() {
    this.isPlaying = true;
    let secondsElapsed = 0;
    const totalDuration = this.exam.audioDurationSeconds || 1800;
    const progressBar = document.getElementById('audio-progress-bar');
    const timeLabel = document.getElementById('audio-time-label');

    this.audioInterval = setInterval(() => {
      if (!this.isPlaying) return;
      secondsElapsed++;

      const pct = Math.min(100, (secondsElapsed / totalDuration) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;

      const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
      const s = String(secondsElapsed % 60).padStart(2, '0');
      if (timeLabel) timeLabel.textContent = `${m}:${s} / 30:00`;

      // Automatically switch part based on timestamp
      if (secondsElapsed === 360 && this.currentPartIndex === 0) this.loadPart(1);
      if (secondsElapsed === 720 && this.currentPartIndex === 1) this.loadPart(2);
      if (secondsElapsed === 1100 && this.currentPartIndex === 2) this.loadPart(3);

      if (secondsElapsed >= totalDuration) {
        clearInterval(this.audioInterval);
        window.audioEngine.playChime('warning');
        alert('Listening audio has finished. You have 2 minutes to review your answers.');
      }
    }, 1000);
  }

  jumpToQuestion(qNum) {
    if (!this.exam || !this.exam.parts) return;
    const partIdx = this.exam.parts.findIndex(p => p.questions && p.questions.some(q => q.id === qNum));
    if (partIdx !== -1 && partIdx !== this.currentPartIndex) {
      this.loadPart(partIdx);
    }
    setTimeout(() => {
      const el = document.getElementById(`q-card-${qNum}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }

  destroy() {
    if (this.audioInterval) clearInterval(this.audioInterval);
    this.container.style.display = 'none';
  }
}

function saveListeningAnswer(qId, val) {
  window.IELTS_STATE.answers.listening[qId] = val.trim();
  updateQuestionBadgeStatus(qId, val.trim().length > 0);
}

function selectListeningMcq(qId, val, labelEl) {
  window.IELTS_STATE.answers.listening[qId] = val;
  const parent = labelEl.parentElement;
  parent.querySelectorAll('.mcq-option-row').forEach(row => row.classList.remove('selected'));
  labelEl.classList.add('selected');
  updateQuestionBadgeStatus(qId, true);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.ListeningModule = ListeningModule;
window.saveListeningAnswer = saveListeningAnswer;
window.selectListeningMcq = selectListeningMcq;
