/**
 * Module: Writing Exam Interface (Task 1 & Task 2)
 * Authentic Split-Pane View, Live Word Counter, SVG Chart Renderer, Auto-Save
 */

class WritingModule {
  constructor() {
    this.container = document.getElementById('writing-workspace');
    this.activeTask = 1; // 1 or 2
    this.autoSaveTimer = null;
  }

  init(examData, onModuleComplete) {
    this.exam = examData.writing;
    this.onModuleComplete = onModuleComplete;
    this.container.style.display = 'flex';

    this.renderWritingLayout();
    this.switchTask(1);
    this.startAutoSaver();
  }

  renderWritingLayout() {
    const task1Label = (this.exam && this.exam.tasks && this.exam.tasks[0] && this.exam.tasks[0].type === 'letter') 
      ? 'Task 1 (Letter)' 
      : 'Task 1 (Report)';

    this.container.innerHTML = `
      <div class="split-container" id="writing-split-container">
        <!-- Left: Prompt & Graphic Pane -->
        <div class="split-pane-left" id="writing-prompt-pane">
          <!-- Dynamically populated -->
        </div>

        <!-- Draggable Resizer Gutter -->
        <div class="split-gutter" id="writing-split-gutter"></div>

        <!-- Right: Textarea Workspace Pane -->
        <div class="split-pane-right" id="writing-input-pane">
          <!-- Task Switcher Tabs -->
          <div class="writing-task-tabs">
            <button class="writing-tab-btn active" id="tab-task1" onclick="window.writingModuleInstance.switchTask(1)">
              ${task1Label}
            </button>
            <button class="writing-tab-btn" id="tab-task2" onclick="window.writingModuleInstance.switchTask(2)">
              Task 2 (Essay)
            </button>
          </div>

          <!-- Edit Toolbar -->
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <button class="ctrl-btn" onclick="document.execCommand('cut')">Cut</button>
            <button class="ctrl-btn" onclick="document.execCommand('copy')">Copy</button>
            <button class="ctrl-btn" onclick="document.execCommand('paste')">Paste</button>
            <span id="writing-autosave-indicator" style="margin-left:auto; font-size:0.8rem; color:#6a737d;">Autosaved</span>
          </div>

          <!-- Writing Textarea -->
          <textarea id="writing-textarea" class="writing-textarea" 
            placeholder="Type your response here..." 
            oninput="handleWritingInput(this.value)" 
            spellcheck="false"></textarea>

          <!-- Word Count & Status Bar -->
          <div class="writing-meta-bar">
            <div>
              Word Count: <span id="current-word-count" class="word-count-badge">0</span>
              <span id="target-word-msg" style="color:#586069; margin-left:8px;">(Minimum recommended: 150 words)</span>
            </div>
            <div id="word-target-status" style="font-size:0.82rem; font-weight:600;"></div>
          </div>
        </div>
      </div>
    `;

    this.initSplitter();
  }

  switchTask(taskNum) {
    this.activeTask = taskNum;
    const task = this.exam.tasks[taskNum - 1];

    document.getElementById('tab-task1').classList.toggle('active', taskNum === 1);
    document.getElementById('tab-task2').classList.toggle('active', taskNum === 2);

    const promptPane = document.getElementById('writing-prompt-pane');
    const textarea = document.getElementById('writing-textarea');
    const targetMsg = document.getElementById('target-word-msg');

    targetMsg.textContent = `(Minimum recommended: ${task.minWords} words)`;

    // Populate Prompt Pane
    let promptHtml = `
      <div style="margin-bottom:16px;">
        <h2 style="font-size:1.3rem; color:#1f2428;">${task.title}</h2>
        <div style="background:#f6f8fa; border-left:4px solid #d9383a; padding:12px; margin-top:10px; font-size:0.95rem; line-height:1.6; white-space:pre-line;">
          ${task.prompt}
        </div>
      </div>
    `;

    // If Task 1 has chart graphic
    if (taskNum === 1 && task.graphicData) {
      promptHtml += this.renderTask1Chart(task.graphicData);
    }

    promptPane.innerHTML = promptHtml;

    // Load existing candidate text
    const textKey = taskNum === 1 ? 'task1' : 'task2';
    textarea.value = window.IELTS_STATE.answers.writing[textKey] || '';
    this.updateWordCount(textarea.value, task.minWords);
  }

  renderTask1Chart(data) {
    return `
      <div style="background:#ffffff; border:1px solid #d0d7de; border-radius:6px; padding:16px; margin-top:16px;">
        <h4 style="font-size:0.95rem; text-align:center; color:#24292e; margin-bottom:12px;">${data.title}</h4>
        
        <svg viewBox="0 0 540 260" style="width:100%; height:auto; font-family:sans-serif; font-size:11px;">
          <!-- Grid lines -->
          <line x1="60" y1="20" x2="520" y2="20" stroke="#eee" />
          <text x="50" y="24" text-anchor="end" fill="#666">100%</text>
          <line x1="60" y1="65" x2="520" y2="65" stroke="#eee" />
          <text x="50" y="69" text-anchor="end" fill="#666">75%</text>
          <line x1="60" y1="110" x2="520" y2="110" stroke="#eee" />
          <text x="50" y="114" text-anchor="end" fill="#666">50%</text>
          <line x1="60" y1="155" x2="520" y2="155" stroke="#eee" />
          <text x="50" y="159" text-anchor="end" fill="#666">25%</text>
          <line x1="60" y1="200" x2="520" y2="200" stroke="#333" stroke-width="1.5" />
          <text x="50" y="204" text-anchor="end" fill="#666">0%</text>

          <!-- Bars for 4 countries in 2010 vs 2024 -->
          <!-- Denmark -->
          <rect x="90" y="136" width="28" height="64" fill="#0969da" rx="2" />
          <text x="104" y="130" text-anchor="middle" font-size="10" font-weight="bold" fill="#0969da">32%</text>
          <rect x="122" y="36" width="28" height="164" fill="#1f6feb" rx="2" />
          <text x="136" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="#1f6feb">82%</text>
          <text x="120" y="220" text-anchor="middle" font-weight="bold" fill="#333">Denmark</text>

          <!-- Germany -->
          <rect x="195" y="166" width="28" height="34" fill="#2ea44f" rx="2" />
          <text x="209" y="160" text-anchor="middle" font-size="10" font-weight="bold" fill="#2ea44f">17%</text>
          <rect x="227" y="92" width="28" height="108" fill="#238636" rx="2" />
          <text x="241" y="86" text-anchor="middle" font-size="10" font-weight="bold" fill="#238636">54%</text>
          <text x="225" y="220" text-anchor="middle" font-weight="bold" fill="#333">Germany</text>

          <!-- Spain -->
          <rect x="300" y="130" width="28" height="70" fill="#d29922" rx="2" />
          <text x="314" y="124" text-anchor="middle" font-size="10" font-weight="bold" fill="#d29922">35%</text>
          <rect x="332" y="98" width="28" height="102" fill="#9e6a03" rx="2" />
          <text x="346" y="92" text-anchor="middle" font-size="10" font-weight="bold" fill="#9e6a03">51%</text>
          <text x="330" y="220" text-anchor="middle" font-weight="bold" fill="#333">Spain</text>

          <!-- UK -->
          <rect x="405" y="186" width="28" height="14" fill="#8250df" rx="2" />
          <text x="419" y="180" text-anchor="middle" font-size="10" font-weight="bold" fill="#8250df">7%</text>
          <rect x="437" y="102" width="28" height="98" fill="#6639ba" rx="2" />
          <text x="451" y="96" text-anchor="middle" font-size="10" font-weight="bold" fill="#6639ba">49%</text>
          <text x="435" y="220" text-anchor="middle" font-weight="bold" fill="#333">UK</text>

          <!-- Legend -->
          <rect x="180" y="240" width="12" height="12" fill="#0969da" />
          <text x="198" y="250" font-size="11" fill="#444">2010</text>
          <rect x="270" y="240" width="12" height="12" fill="#1f6feb" />
          <text x="288" y="250" font-size="11" fill="#444">2024</text>
        </svg>
      </div>
    `;
  }

  updateWordCount(text, minTarget) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    const countBadge = document.getElementById('current-word-count');
    const statusMsg = document.getElementById('word-target-status');

    if (countBadge) {
      countBadge.textContent = count;
      if (count >= minTarget) {
        countBadge.classList.add('sufficient');
        statusMsg.textContent = '✓ Word count target reached';
        statusMsg.style.color = '#28a745';
      } else {
        countBadge.classList.remove('sufficient');
        statusMsg.textContent = `${minTarget - count} words remaining`;
        statusMsg.style.color = '#d9383a';
      }
    }
  }

  startAutoSaver() {
    this.autoSaveTimer = setInterval(async () => {
      if (!window.IELTS_STATE.sessionId) return;
      const indicator = document.getElementById('writing-autosave-indicator');
      if (indicator) indicator.textContent = 'Saving...';

      await window.apiClient.saveAnswers(
        window.IELTS_STATE.sessionId,
        'writing',
        window.IELTS_STATE.answers.writing
      );

      if (indicator) {
        indicator.textContent = 'Saved to host';
        setTimeout(() => { if (indicator) indicator.textContent = 'Autosaved'; }, 2000);
      }
    }, 6000);
  }

  initSplitter() {
    const gutter = document.getElementById('writing-split-gutter');
    const container = document.getElementById('writing-split-container');
    const leftPane = document.getElementById('writing-prompt-pane');
    let dragging = false;

    gutter.onmousedown = () => { dragging = true; document.body.style.cursor = 'col-resize'; };
    window.onmousemove = (e) => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (pct > 20 && pct < 80) leftPane.style.width = `${pct}%`;
    };
    window.onmouseup = () => { dragging = false; document.body.style.cursor = 'default'; };
  }

  destroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.container.style.display = 'none';
  }
}

function handleWritingInput(text) {
  const mod = window.writingModuleInstance;
  if (!mod) return;
  const key = mod.activeTask === 1 ? 'task1' : 'task2';
  window.IELTS_STATE.answers.writing[key] = text;
  const minTarget = mod.activeTask === 1 ? 150 : 250;
  mod.updateWordCount(text, minTarget);
}

window.WritingModule = WritingModule;
window.handleWritingInput = handleWritingInput;
