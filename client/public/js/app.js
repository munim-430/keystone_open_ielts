/**
 * IELTS CD Mock Test Platform - Master Application Controller
 * Coordinates module state transitions, timers, question navigation, and WebSocket commands
 */

document.addEventListener('DOMContentLoaded', () => {
  initMasterApp();
});

let examData = null;
let currentModuleInstance = null;
let testTimerInterval = null;

async function initMasterApp() {
  initUIControls();

  // Initialize Login Screen
  window.initLoginModule(async (loginResponse) => {
    // Connect WebSocket for invigilator remote controls
    window.apiClient.initWebSocket(loginResponse.sessionId, handleInvigilatorCommand);

    // Fetch full exam content
    const examRes = await window.apiClient.getExam(loginResponse.sessionId);
    examData = examRes.exam;
    window.IELTS_STATE.exam = examData;

    // Start background heartbeat to Host
    startHeartbeatTimer();

    // Proceed to Sound Check
    window.initSoundCheckModule(() => {
      startListeningModule();
    });
  });
}

function initUIControls() {
  // Font Size Switcher
  const btnFont = document.getElementById('btn-font-toggle');
  if (btnFont) {
    const fontSizes = ['standard', 'font-large', 'font-xlarge'];
    let fIdx = 0;
    btnFont.onclick = () => {
      document.body.classList.remove(fontSizes[fIdx]);
      fIdx = (fIdx + 1) % fontSizes.length;
      if (fIdx > 0) document.body.classList.add(fontSizes[fIdx]);
      btnFont.textContent = fIdx === 0 ? 'Font: Normal' : (fIdx === 1 ? 'Font: Large' : 'Font: Extra');
    };
  }

  // Contrast Scheme Switcher
  const btnContrast = document.getElementById('btn-contrast-toggle');
  if (btnContrast) {
    const contrasts = ['standard', 'contrast-bw', 'contrast-wb', 'contrast-yb'];
    let cIdx = 0;
    btnContrast.onclick = () => {
      document.body.classList.remove(contrasts[cIdx]);
      cIdx = (cIdx + 1) % contrasts.length;
      if (cIdx > 0) document.body.classList.add(contrasts[cIdx]);
      btnContrast.textContent = cIdx === 0 ? 'Contrast: Standard' : (cIdx === 1 ? 'Contrast: B/W' : (cIdx === 2 ? 'Contrast: W/B' : 'Contrast: Yellow'));
    };
  }

  // Help Modal
  const btnHelp = document.getElementById('btn-help');
  const modalHelp = document.getElementById('modal-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  if (btnHelp && modalHelp) {
    btnHelp.onclick = () => modalHelp.style.display = 'flex';
    btnCloseHelp.onclick = () => modalHelp.style.display = 'none';
  }

  // Next / Back Buttons in bottom bar
  const btnNavBack = document.getElementById('btn-nav-back');
  const btnNavNext = document.getElementById('btn-nav-next');
  if (btnNavBack) btnNavBack.onclick = () => navigateQuestionRelative(-1);
  if (btnNavNext) btnNavNext.onclick = () => navigateQuestionRelative(1);

  // Submit Module Button in Header
  const btnSubmitModule = document.getElementById('btn-submit-module');
  if (btnSubmitModule) {
    btnSubmitModule.onclick = () => confirmModuleSubmission();
  }
}

// ==========================================
// TEST FLOW MODULE CONTROLLERS
// ==========================================

function startListeningModule() {
  window.IELTS_STATE.currentModule = 'listening';
  document.getElementById('header-module-title').textContent = 'LISTENING';
  document.getElementById('ielts-bottombar').style.display = 'flex';
  document.getElementById('bottom-module-tag').textContent = 'Listening (Part 1-4)';

  setupBottomQuestionNav(40);
  startModuleCountdown(30 * 60, () => {
    // Time expired
    confirmModuleSubmission();
  });

  window.listeningModuleInstance = new window.ListeningModule();
  currentModuleInstance = window.listeningModuleInstance;
  window.listeningModuleInstance.init(examData, () => {
    startReadingModule();
  });
}

function startReadingModule() {
  if (currentModuleInstance && currentModuleInstance.destroy) currentModuleInstance.destroy();

  window.IELTS_STATE.currentModule = 'reading';
  document.getElementById('header-module-title').textContent = 'READING';
  document.getElementById('ielts-bottombar').style.display = 'flex';
  document.getElementById('bottom-module-tag').textContent = 'Reading (Passage 1-3)';

  setupBottomQuestionNav(40);
  startModuleCountdown(60 * 60, () => {
    confirmModuleSubmission();
  });

  window.readingModuleInstance = new window.ReadingModule();
  currentModuleInstance = window.readingModuleInstance;
  window.readingModuleInstance.init(examData, () => {
    startWritingModule();
  });
}

function startWritingModule() {
  if (currentModuleInstance && currentModuleInstance.destroy) currentModuleInstance.destroy();

  window.IELTS_STATE.currentModule = 'writing';
  document.getElementById('header-module-title').textContent = 'WRITING';
  document.getElementById('ielts-bottombar').style.display = 'none'; // Writing has its own Task tabs

  startModuleCountdown(60 * 60, () => {
    confirmModuleSubmission();
  });

  window.writingModuleInstance = new window.WritingModule();
  currentModuleInstance = window.writingModuleInstance;
  window.writingModuleInstance.init(examData, () => {
    startSpeakingModule();
  });
}

function startSpeakingModule() {
  if (currentModuleInstance && currentModuleInstance.destroy) currentModuleInstance.destroy();

  window.IELTS_STATE.currentModule = 'speaking';
  document.getElementById('header-module-title').textContent = 'SPEAKING (AI EXAMINER)';
  document.getElementById('ielts-bottombar').style.display = 'none';

  startModuleCountdown(15 * 60, () => {});

  window.speakingModuleInstance = new window.SpeakingModule();
  currentModuleInstance = window.speakingModuleInstance;
  window.speakingModuleInstance.init(examData, async () => {
    // Speaking finished -> Submit test for AI diagnosis
    await finalizeCompleteExam();
  });
}

async function finalizeCompleteExam() {
  if (currentModuleInstance && currentModuleInstance.destroy) currentModuleInstance.destroy();
  if (testTimerInterval) clearInterval(testTimerInterval);

  window.IELTS_STATE.currentModule = 'completed';
  document.getElementById('header-module-title').textContent = 'DIAGNOSTIC SCORECARD';
  document.getElementById('header-timer-display').textContent = 'EXAM COMPLETED';
  document.getElementById('btn-submit-module').style.display = 'none';
  document.getElementById('ielts-bottombar').style.display = 'none';

  // Trigger submission on server
  await window.apiClient.submitModule(window.IELTS_STATE.sessionId, 'speaking', true);

  // Render Scorecard
  window.scorecardModuleInstance = new window.ScorecardModule();
  currentModuleInstance = window.scorecardModuleInstance;
  window.scorecardModuleInstance.render(window.IELTS_STATE.sessionId);
}

// ==========================================
// QUESTION NAVIGATION (1 to 40)
// ==========================================

function setupBottomQuestionNav(totalQuestions) {
  const container = document.getElementById('question-nav-container');
  container.innerHTML = '';

  for (let i = 1; i <= totalQuestions; i++) {
    const badge = document.createElement('div');
    badge.className = `q-badge ${i === 1 ? 'current' : ''}`;
    badge.id = `q-nav-badge-${i}`;
    badge.textContent = i;
    badge.onclick = () => jumpToQuestion(i);
    container.appendChild(badge);
  }
}

function jumpToQuestion(qNum) {
  window.IELTS_STATE.currentQuestionIndex = qNum;

  // Update current badge
  document.querySelectorAll('.q-badge').forEach(b => b.classList.remove('current'));
  const currentBadge = document.getElementById(`q-nav-badge-${qNum}`);
  if (currentBadge) {
    currentBadge.classList.add('current');
    currentBadge.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Scroll to question card in right pane
  const qCard = document.getElementById(`q-card-${qNum}`);
  if (qCard) {
    qCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (window.IELTS_STATE.currentModule === 'reading' && window.readingModuleInstance) {
    // If question is in another passage, switch passage
    if (qNum >= 1 && qNum <= 13 && window.readingModuleInstance.currentPassageIndex !== 0) {
      window.readingModuleInstance.loadPassage(0);
    } else if (qNum >= 14 && qNum <= 26 && window.readingModuleInstance.currentPassageIndex !== 1) {
      window.readingModuleInstance.loadPassage(1);
    } else if (qNum >= 27 && qNum <= 40 && window.readingModuleInstance.currentPassageIndex !== 2) {
      window.readingModuleInstance.loadPassage(2);
    }
    setTimeout(() => {
      const card = document.getElementById(`q-card-${qNum}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }
}

function navigateQuestionRelative(delta) {
  const nextQ = Math.max(1, Math.min(40, (window.IELTS_STATE.currentQuestionIndex || 1) + delta));
  jumpToQuestion(nextQ);
}

function updateQuestionBadgeStatus(qNum, isAnswered) {
  const badge = document.getElementById(`q-nav-badge-${qNum}`);
  if (!badge) return;
  badge.classList.toggle('answered', isAnswered);
}

function toggleFlagQuestion(qNum, isFlagged) {
  if (isFlagged) window.IELTS_STATE.flaggedQuestions.add(qNum);
  else window.IELTS_STATE.flaggedQuestions.delete(qNum);

  const badge = document.getElementById(`q-nav-badge-${qNum}`);
  if (badge) badge.classList.toggle('flagged', isFlagged);
}

// ==========================================
// COUNTDOWN TIMER & SUBMISSION
// ==========================================

function startModuleCountdown(durationSeconds, onExpire) {
  if (testTimerInterval) clearInterval(testTimerInterval);

  let remaining = durationSeconds;
  window.IELTS_STATE.timeRemainingSeconds = remaining;
  updateTimerUI(remaining);

  testTimerInterval = setInterval(() => {
    remaining--;
    window.IELTS_STATE.timeRemainingSeconds = remaining;
    updateTimerUI(remaining);

    // Flashing warning at 5 minutes
    const timerBox = document.getElementById('header-timer-box');
    if (remaining === 300) {
      window.audioEngine.playChime('warning');
      if (timerBox) timerBox.classList.add('warning');
    }

    if (remaining <= 0) {
      clearInterval(testTimerInterval);
      window.audioEngine.playChime('end');
      if (onExpire) onExpire();
    }
  }, 1000);
}

function updateTimerUI(seconds) {
  const el = document.getElementById('header-timer-display');
  if (!el) return;
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

async function confirmModuleSubmission() {
  const current = window.IELTS_STATE.currentModule;
  const proceed = confirm(`Are you sure you want to finish the ${current.toUpperCase()} module and move to the next section?`);
  if (!proceed) return;

  // Auto-save answers before transitioning
  await window.apiClient.saveAnswers(
    window.IELTS_STATE.sessionId,
    current,
    window.IELTS_STATE.answers[current]
  );
  await window.apiClient.submitModule(window.IELTS_STATE.sessionId, current, false);

  if (current === 'listening') startReadingModule();
  else if (current === 'reading') startWritingModule();
  else if (current === 'writing') startSpeakingModule();
}

// ==========================================
// HEARTBEAT TO HOST & REMOTE INVIGILATOR COMMANDS
// ==========================================

function startHeartbeatTimer() {
  setInterval(() => {
    if (!window.IELTS_STATE.sessionId) return;
    window.apiClient.sendHeartbeat(window.IELTS_STATE.sessionId, {
      currentModule: window.IELTS_STATE.currentModule,
      currentQuestionIndex: window.IELTS_STATE.currentQuestionIndex,
      timeRemainingSeconds: window.IELTS_STATE.timeRemainingSeconds,
      terminalId: window.IELTS_STATE.terminal ? window.IELTS_STATE.terminal.terminalId : ''
    });
  }, 10000);
}

function handleInvigilatorCommand(action, payload) {
  if (action === 'PAUSE_EXAM') {
    alert('The invigilator has paused the exam session.');
  } else if (action === 'RESUME_EXAM') {
    alert('The invigilator has resumed the exam session.');
  } else if (action === 'EXTEND_TIME') {
    const extraSeconds = (payload.minutes || 5) * 60;
    window.IELTS_STATE.timeRemainingSeconds += extraSeconds;
    alert(`The invigilator has granted an additional ${payload.minutes || 5} minutes.`);
  } else if (action === 'FORCE_SUBMIT') {
    alert('The invigilator has submitted your exam session.');
    finalizeCompleteExam();
  }
}

window.toggleFlagQuestion = toggleFlagQuestion;
window.updateQuestionBadgeStatus = updateQuestionBadgeStatus;
