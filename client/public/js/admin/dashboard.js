/**
 * IELTS CD Mock Test Platform - Invigilator Dashboard Controller
 * Real-time monitoring of up to 22+ Core i3 candidate terminals over LAN
 */

let terminals = [];
let ws = null;

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

async function initDashboard() {
  await fetchTerminals();
  initWebSocket();

  // Polling fallback every 5s in case of any dropped packets
  setInterval(fetchTerminals, 5000);
}

async function fetchTerminals() {
  try {
    const res = await fetch('/api/invigilator/terminals');
    const data = await res.json();
    if (data.success) {
      terminals = data.terminals;
      renderTerminalGrid();
      updateStatistics();
    }
  } catch (err) {
    console.error('Error fetching terminals:', err);
  }
}

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws?role=invigilator`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CANDIDATE_LOGGED_IN' || msg.type === 'CANDIDATE_HEARTBEAT' || msg.type === 'CANDIDATE_COMPLETED') {
          fetchTerminals();
        }
      } catch (e) {}
    };

    ws.onclose = () => {
      setTimeout(initWebSocket, 3000);
    };
  } catch (e) {
    console.warn('Invigilator WebSocket error:', e);
  }
}

function renderTerminalGrid() {
  const grid = document.getElementById('terminal-grid');
  if (!grid) return;

  if (terminals.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; background:#fff; border-radius:8px; border:1px solid #d0d7de;">
        <h3 style="color:#1a1f2c; margin-bottom:8px;">Ready for Candidate Terminals</h3>
        <p style="color:#586069; max-width:500px; margin:0 auto; font-size:0.92rem;">
          No candidates have logged in yet. Launch Chrome in kiosk mode on the 22 classroom PCs to connect them to this server.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = terminals.map(term => {
    const cand = term.candidate || {};
    const mod = (term.currentModule || 'login').toLowerCase();
    
    // Module Pill styling
    let pillClass = 'pill-listening';
    if (mod === 'reading') pillClass = 'pill-reading';
    else if (mod === 'writing') pillClass = 'pill-writing';
    else if (mod === 'speaking') pillClass = 'pill-speaking';
    else if (mod === 'completed') pillClass = 'pill-completed';

    // Format remaining time
    const mins = Math.floor((term.timeRemainingSeconds || 0) / 60);
    const secs = (term.timeRemainingSeconds || 0) % 60;
    const timeDisplay = term.timeRemainingSeconds > 0 
      ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : (mod === 'completed' ? 'Completed' : '--:--');

    return `
      <div class="terminal-card">
        <div class="terminal-card-top">
          <div class="terminal-id-tag">
            <span class="pulse-indicator ${term.healthStatus}"></span>
            ${term.terminalId || 'PC'}
            <span style="font-weight:normal; font-size:0.75rem; color:#6e7781;">(${term.ip})</span>
          </div>
          <span style="font-size:0.75rem; color:#8c959f;">${term.lastSeenSecondsAgo}s ago</span>
        </div>

        <div>
          <div class="candidate-name-display">${escapeHtml(cand.name || 'Anonymous')}</div>
          <div class="candidate-passport-display">ID: ${escapeHtml(cand.passport || 'N/A')} | Target: Band ${cand.targetBand || 7.0}</div>
          <span class="progress-module-pill ${pillClass}">${term.currentModule}</span>
          <div class="terminal-timer-display">${timeDisplay}</div>
        </div>

        <div class="terminal-card-actions">
          <button class="term-action-btn" onclick="sendTerminalAction('EXTEND_TIME', '${term.sessionId}', { minutes: 5 })" title="Add 5 Minutes">
            +5m
          </button>
          <button class="term-action-btn" onclick="sendTerminalAction('PAUSE_EXAM', '${term.sessionId}')" title="Pause Session">
            Pause
          </button>
          <button class="term-action-btn" onclick="sendTerminalAction('FORCE_SUBMIT', '${term.sessionId}')" title="Force Submit">
            Submit
          </button>
          ${term.status === 'completed' ? `
            <a href="/report?session=${term.sessionId}" target="_blank" class="term-action-btn" style="background:#2ea44f; color:#fff; text-decoration:none; text-align:center;">
              Scorecard
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function updateStatistics() {
  const total = terminals.length;
  const active = terminals.filter(t => t.healthStatus === 'online' || t.healthStatus === 'idle').length;
  const completed = terminals.filter(t => t.status === 'completed').length;

  const completedWithScores = terminals.filter(t => typeof t.overallBandScore === 'number');
  const avg = completedWithScores.length > 0
    ? (completedWithScores.reduce((sum, t) => sum + t.overallBandScore, 0) / completedWithScores.length).toFixed(1)
    : '-';

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-avg-band').textContent = avg;
}

async function broadcastMasterCommand(action, payload = {}) {
  const confirmMsg = `Are you sure you want to broadcast ${action} to ALL candidate terminals?`;
  if (!confirm(confirmMsg)) return;

  try {
    await fetch('/api/invigilator/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetSessionId: 'ALL', payload })
    });
    fetchTerminals();
  } catch (e) {
    alert('Failed to send command: ' + e.message);
  }
}

async function sendTerminalAction(action, targetSessionId, payload = {}) {
  try {
    await fetch('/api/invigilator/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetSessionId, payload })
    });
    fetchTerminals();
  } catch (e) {
    alert('Failed to send action: ' + e.message);
  }
}

// ==========================================
// BATCH PRINT LOGIC
// ==========================================

function openBatchPrintModal() {
  const completedCount = terminals.filter(t => t.status === 'completed').length;
  const countEl = document.getElementById('batch-print-candidate-count');
  countEl.innerHTML = `Ready to print <strong>${completedCount}</strong> completed candidate scorecard(s).`;
  document.getElementById('modal-batch-print').style.display = 'flex';
}

function closeBatchPrintModal() {
  document.getElementById('modal-batch-print').style.display = 'none';
}

function executeBatchPrint() {
  closeBatchPrintModal();
  // Open batch print window
  window.open('/report?mode=batch', '_blank');
}

// ==========================================
// SETTINGS MODAL
// ==========================================

async function openSettingsModal() {
  try {
    const res = await fetch('/api/invigilator/settings');
    const data = await res.json();
    if (data.success) {
      document.getElementById('settings-provider-select').value = data.provider;
    }
  } catch (e) {}
  document.getElementById('modal-settings').style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('modal-settings').style.display = 'none';
}

async function saveSettings() {
  const provider = document.getElementById('settings-provider-select').value;
  const apiKey = document.getElementById('settings-api-key').value.trim();

  try {
    const res = await fetch('/api/invigilator/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey })
    });
    if (res.ok) {
      alert(`AI Diagnostic Provider updated to: ${provider.toUpperCase()}`);
      closeSettingsModal();
    }
  } catch (e) {
    alert('Failed to save settings: ' + e.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.broadcastMasterCommand = broadcastMasterCommand;
window.sendTerminalAction = sendTerminalAction;
window.openBatchPrintModal = openBatchPrintModal;
window.closeBatchPrintModal = closeBatchPrintModal;
window.executeBatchPrint = executeBatchPrint;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettings = saveSettings;
