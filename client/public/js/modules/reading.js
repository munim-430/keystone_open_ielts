/**
 * Module: Reading Exam Interface (40 Questions)
 * Authentic Split-Pane View, Highlighting Tool, Notes Popover, TFNG Pills
 */

class ReadingModule {
  constructor() {
    this.container = document.getElementById('reading-workspace');
    this.currentPassageIndex = 0;
    this.splitDragging = false;
  }

  init(examData, onModuleComplete) {
    this.exam = examData.reading;
    this.onModuleComplete = onModuleComplete;
    this.container.style.display = 'flex';

    this.renderReadingLayout();
    this.initSplitter();
    this.initTextHighlighter();
    this.loadPassage(0);
  }

  renderReadingLayout() {
    this.container.innerHTML = `
      <div class="split-container" id="reading-split-container">
        <!-- Left: Passage Pane -->
        <div class="split-pane-left" id="reading-passage-pane">
          <!-- Dynamically populated -->
        </div>

        <!-- Draggable Resizer Gutter -->
        <div class="split-gutter" id="reading-split-gutter"></div>

        <!-- Right: Questions Pane -->
        <div class="split-pane-right" id="reading-questions-pane">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Selection Toolbar for Highlighting & Notes -->
      <div class="selection-toolbar" id="text-selection-toolbar">
        <button class="hl-btn highlight-yellow" onclick="applyHighlight('yellow')" title="Yellow Highlight"></button>
        <button class="hl-btn highlight-green" onclick="applyHighlight('green')" title="Green Highlight"></button>
        <button class="hl-btn highlight-pink" onclick="applyHighlight('pink')" title="Pink Highlight"></button>
        <button class="hl-btn note-btn" onclick="addNotePrompt()">+ Note</button>
        <button class="hl-btn note-btn" onclick="clearHighlight()" style="color:#f85149;">Clear</button>
      </div>
    `;
  }

  loadPassage(passageIdx) {
    this.currentPassageIndex = passageIdx;
    const passage = this.exam.passages[passageIdx];
    const leftPane = document.getElementById('reading-passage-pane');
    const rightPane = document.getElementById('reading-questions-pane');

    // Passage Navigation Tabs
    const tabsHtml = `
      <div style="display:flex; gap:6px; margin-bottom:18px; border-bottom:1px solid #d0d7de; padding-bottom:6px;">
        ${this.exam.passages.map((p, idx) => `
          <button class="ctrl-btn ${idx === passageIdx ? 'active' : ''}" onclick="window.readingModuleInstance.loadPassage(${idx})">
            Passage ${p.passageNumber}
          </button>
        `).join('')}
      </div>
    `;

    // Render Left: Passage
    leftPane.innerHTML = `
      ${tabsHtml}
      <div class="reading-passage-header">
        <h1>Passage ${passage.passageNumber}: ${passage.title}</h1>
        <div class="passage-subtitle">${passage.subtitle || ''}</div>
      </div>
      <div class="reading-passage-body" id="passage-body-content">
        ${passage.text.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      </div>
    `;

    // Render Right: Questions
    let qHtml = `
      <div style="margin-bottom:16px;">
        <h3 style="font-size:1.15rem; color:#1f2428;">Questions for Passage ${passage.passageNumber}</h3>
        <p style="font-size:0.88rem; color:#586069;">Answer all questions based on the text on the left.</p>
      </div>
    `;

    for (const q of passage.questions) {
      const qVal = window.IELTS_STATE.answers.reading[q.id] || '';
      qHtml += `
        <div class="question-item-card" id="q-card-${q.id}">
          <div class="q-header">
            <span class="q-num-tag">Question ${q.id}</span>
            <label class="review-checkbox-wrapper">
              <input type="checkbox" onchange="toggleFlagQuestion(${q.id}, this.checked)" ${window.IELTS_STATE.flaggedQuestions.has(q.id) ? 'checked' : ''}>
              Review
            </label>
          </div>
      `;

      if (q.type === 'tfng') {
        qHtml += `
          <div class="q-prompt-text">${q.prompt}</div>
          <div class="tfng-pill-group">
            ${['TRUE', 'FALSE', 'NOT GIVEN'].map(choice => `
              <div class="tfng-pill ${qVal.toUpperCase() === choice ? 'selected' : ''}" 
                onclick="selectReadingTfng(${q.id}, '${choice}', this)">
                ${choice}
              </div>
            `).join('')}
          </div>
        `;
      } else if (q.type === 'matching_headings') {
        qHtml += `
          <div class="q-prompt-text">${q.prompt}</div>
          <select class="form-select" style="max-width:380px; margin-top:8px;" onchange="saveReadingAnswer(${q.id}, this.value)">
            <option value="">-- Select Heading --</option>
            ${q.options.map(opt => {
              const optVal = opt.split('.')[0].trim();
              return `<option value="${optVal}" ${qVal === optVal ? 'selected' : ''}>${opt}</option>`;
            }).join('')}
          </select>
        `;
      } else if (q.type === 'fill_blank') {
        const promptWithInput = q.prompt.replace(/______/g, `
          <input type="text" class="ielts-input-blank" 
            data-qid="${q.id}" 
            value="${escapeHtml(qVal)}" 
            oninput="saveReadingAnswer(${q.id}, this.value)" 
            autocomplete="off" spellcheck="false" />
        `);
        qHtml += `<div class="q-prompt-text">${promptWithInput}</div>`;
      } else if (q.type === 'multiple_choice') {
        qHtml += `<div class="q-prompt-text">${q.prompt}</div>`;
        qHtml += `<div class="mcq-options-container">`;
        for (const opt of q.options) {
          const optLetter = opt.charAt(0);
          const isSelected = qVal === optLetter;
          qHtml += `
            <label class="mcq-option-row ${isSelected ? 'selected' : ''}" onclick="selectReadingMcq(${q.id}, '${optLetter}', this)">
              <input type="radio" name="rq_${q.id}" value="${optLetter}" ${isSelected ? 'checked' : ''}>
              <span>${opt}</span>
            </label>
          `;
        }
        qHtml += `</div>`;
      }

      qHtml += `</div>`;
    }

    rightPane.innerHTML = qHtml;
  }

  initSplitter() {
    const gutter = document.getElementById('reading-split-gutter');
    const container = document.getElementById('reading-split-container');
    const leftPane = document.getElementById('reading-passage-pane');

    gutter.onmousedown = (e) => {
      this.splitDragging = true;
      document.body.style.cursor = 'col-resize';
    };

    window.onmousemove = (e) => {
      if (!this.splitDragging) return;
      const containerRect = container.getBoundingClientRect();
      const offset = e.clientX - containerRect.left;
      const pct = (offset / containerRect.width) * 100;
      if (pct > 20 && pct < 80) {
        leftPane.style.width = `${pct}%`;
      }
    };

    window.onmouseup = () => {
      if (this.splitDragging) {
        this.splitDragging = false;
        document.body.style.cursor = 'default';
      }
    };
  }

  initTextHighlighter() {
    const leftPane = document.getElementById('reading-passage-pane');
    const toolbar = document.getElementById('text-selection-toolbar');

    leftPane.onmouseup = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        toolbar.style.display = 'none';
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      toolbar.style.display = 'flex';
      toolbar.style.top = `${rect.top - 40}px`;
      toolbar.style.left = `${rect.left + rect.width / 2 - 80}px`;
    };
  }

  destroy() {
    this.container.style.display = 'none';
  }
}

function saveReadingAnswer(qId, val) {
  window.IELTS_STATE.answers.reading[qId] = val.trim();
  updateQuestionBadgeStatus(qId, val.trim().length > 0);
}

function selectReadingTfng(qId, choice, pillEl) {
  window.IELTS_STATE.answers.reading[qId] = choice;
  const parent = pillEl.parentElement;
  parent.querySelectorAll('.tfng-pill').forEach(p => p.classList.remove('selected'));
  pillEl.classList.add('selected');
  updateQuestionBadgeStatus(qId, true);
}

function selectReadingMcq(qId, choice, labelEl) {
  window.IELTS_STATE.answers.reading[qId] = choice;
  const parent = labelEl.parentElement;
  parent.querySelectorAll('.mcq-option-row').forEach(row => row.classList.remove('selected'));
  labelEl.classList.add('selected');
  updateQuestionBadgeStatus(qId, true);
}

function applyHighlight(color, noteText = '') {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.className = `highlight-${color}${noteText ? ' candidate-note-highlight' : ''}`;
  if (noteText) {
    span.title = `Note: ${noteText}`;
  }

  try {
    range.surroundContents(span);
  } catch (e) {
    // If selection crosses block elements
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  if (noteText) {
    const noteBadge = document.createElement('span');
    noteBadge.className = 'note-flag';
    noteBadge.textContent = ' 📝';
    noteBadge.title = `Note: ${noteText}`;
    span.appendChild(noteBadge);
  }

  document.getElementById('text-selection-toolbar').style.display = 'none';
  selection.removeAllRanges();
}

function addNotePrompt() {
  const note = prompt('Enter candidate note:');
  if (note && note.trim()) {
    applyHighlight('yellow', note.trim());
  } else {
    const tb = document.getElementById('text-selection-toolbar');
    if (tb) tb.style.display = 'none';
  }
}

function clearHighlight() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;

    // Check if the container itself is a highlight span
    const hlSpan = container.closest ? container.closest('[class*="highlight-"]') : null;
    if (hlSpan) {
      hlSpan.querySelectorAll('.note-flag').forEach(n => n.remove());
      const parent = hlSpan.parentNode;
      while (hlSpan.firstChild) {
        parent.insertBefore(hlSpan.firstChild, hlSpan);
      }
      parent.removeChild(hlSpan);
    } else {
      const body = document.getElementById('passage-body-content');
      if (body) {
        const spans = body.querySelectorAll('[class*="highlight-"]');
        spans.forEach(span => {
          if (selection.containsNode(span, true)) {
            span.querySelectorAll('.note-flag').forEach(n => n.remove());
            const parent = span.parentNode;
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
          }
        });
      }
    }
  }

  const tb = document.getElementById('text-selection-toolbar');
  if (tb) tb.style.display = 'none';
  if (selection) selection.removeAllRanges();
}

window.ReadingModule = ReadingModule;
window.saveReadingAnswer = saveReadingAnswer;
window.selectReadingTfng = selectReadingTfng;
window.selectReadingMcq = selectReadingMcq;
window.applyHighlight = applyHighlight;
window.addNotePrompt = addNotePrompt;
window.clearHighlight = clearHighlight;
