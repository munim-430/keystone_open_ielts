/**
 * Module: Candidate Login Controller
 */

function initLoginModule(onLoginSuccess) {
  const container = document.getElementById('login-screen');
  const form = document.getElementById('candidate-login-form');
  const errorAlert = document.getElementById('login-error-msg');

  if (!form) return;

  // Auto-fill or read terminal ID from query param or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const terminalParam = urlParams.get('pc') || localStorage.getItem('ielts_terminal_id') || `PC-${Math.floor(Math.random() * 22) + 1}`;
  const termInput = document.getElementById('terminal-id-input');
  if (termInput) termInput.value = terminalParam;

  const examTypeSelect = document.getElementById('cand-exam-type');
  const testSetSelect = document.getElementById('cand-test-set');
  if (examTypeSelect && testSetSelect) {
    examTypeSelect.onchange = () => {
      if (examTypeSelect.value === 'General') {
        testSetSelect.value = 'general_test_1';
      } else {
        testSetSelect.value = 'academic_test_1';
      }
    };
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';

    const name = document.getElementById('cand-name').value.trim();
    const passport = document.getElementById('cand-passport').value.trim();
    const targetBand = parseFloat(document.getElementById('cand-target-band').value) || 7.0;
    const examType = document.getElementById('cand-exam-type').value;
    const testSetId = document.getElementById('cand-test-set').value;
    const terminalId = termInput ? termInput.value.trim() : terminalParam;

    if (!name || !passport) {
      errorAlert.textContent = 'Please enter both Candidate Name and Passport / NID.';
      errorAlert.style.display = 'block';
      return;
    }

    try {
      const submitBtn = document.getElementById('btn-submit-login');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Initializing Session...';

      const res = await window.apiClient.login({
        name,
        passport,
        targetBand,
        examType,
        testSetId,
        terminalId
      });

      localStorage.setItem('ielts_terminal_id', terminalId);
      localStorage.setItem('ielts_session_id', res.sessionId);

      window.IELTS_STATE.sessionId = res.sessionId;
      window.IELTS_STATE.candidate = res.candidate;
      window.IELTS_STATE.terminal = res.terminal;
      window.IELTS_STATE.status = 'sound_check';

      // Update Header with candidate details
      document.getElementById('header-candidate-name').textContent = res.candidate.name;
      document.getElementById('header-candidate-id').textContent = res.candidate.passport;

      container.style.display = 'none';
      if (onLoginSuccess) onLoginSuccess(res);
    } catch (err) {
      errorAlert.textContent = err.message || 'Unable to connect to host server. Check LAN connection.';
      errorAlert.style.display = 'block';
      const submitBtn = document.getElementById('btn-submit-login');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Start Mock Exam';
    }
  };
}

window.initLoginModule = initLoginModule;
