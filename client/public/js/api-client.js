/**
 * IELTS CD Mock Test Platform - API Client & WebSocket Gateway
 */

class ApiClient {
  constructor() {
    this.ws = null;
    this.wsListeners = new Set();
  }

  async login(candidateData) {
    const res = await fetch('/api/sessions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return await res.json();
  }

  async getSession(sessionId) {
    const res = await fetch(`/api/sessions/${sessionId}`);
    return await res.json();
  }

  async getExam(sessionId) {
    const res = await fetch(`/api/sessions/${sessionId}/exam`);
    return await res.json();
  }

  async sendHeartbeat(sessionId, data) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.warn('Heartbeat offline ping:', e.message);
      return null;
    }
  }

  async saveAnswers(sessionId, moduleName, answers) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/save-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName, answers })
      });
      return await res.json();
    } catch (e) {
      console.error('Save answers error:', e);
      return null;
    }
  }

  async uploadAudio(sessionId, partName, audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, `${partName}.webm`);
    formData.append('partName', partName);

    const res = await fetch(`/api/sessions/${sessionId}/upload-audio`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  }

  async submitModule(sessionId, moduleName, isFinalSubmission = false) {
    const res = await fetch(`/api/sessions/${sessionId}/submit-module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleName, isFinalSubmission })
    });
    return await res.json();
  }

  async getScorecard(sessionId) {
    const res = await fetch(`/api/sessions/${sessionId}/scorecard`);
    return await res.json();
  }

  initWebSocket(sessionId, onCommandCallback) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?role=candidate&sessionId=${sessionId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INVIGILATOR_COMMAND' && onCommandCallback) {
            onCommandCallback(msg.action, msg.payload);
          }
        } catch (e) {}
      };

      this.ws.onclose = () => {
        // Auto-reconnect after 3s
        setTimeout(() => this.initWebSocket(sessionId, onCommandCallback), 3000);
      };
    } catch (e) {
      console.warn('WebSocket connection error:', e);
    }
  }
}

window.apiClient = new ApiClient();
