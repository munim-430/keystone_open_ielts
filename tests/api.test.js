const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('../server/index');
const sessionManager = require('../server/sessionManager');

// Helper to start ephemeral server for testing
function startTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

test('API Integration - Full candidate lifecycle and invigilator monitoring', async (t) => {
  const { server, baseUrl } = await startTestServer();
  let createdSessionId = null;

  t.after(() => {
    server.close();
    if (createdSessionId) {
      const dir = sessionManager.getSessionPath(createdSessionId);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // 1. Candidate Login
  const loginRes = await fetch(`${baseUrl}/api/sessions/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'David Beckham',
      passport: 'B9012345',
      targetBand: 7.5,
      examType: 'Academic',
      terminalId: 'PC-12'
    })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.success);
  assert.ok(loginData.sessionId.includes('B9012345'));
  assert.ok(loginData.sessionId.includes('David_Beckham'));
  createdSessionId = loginData.sessionId;

  // Verify physical directory was established
  const sessionDir = sessionManager.getSessionPath(createdSessionId);
  assert.ok(fs.existsSync(sessionDir), 'Physical directory must exist on disk');

  // 2. Fetch Exam Content (Answer keys must be stripped)
  const examRes = await fetch(`${baseUrl}/api/sessions/${createdSessionId}/exam`);
  assert.strictEqual(examRes.status, 200);
  const examData = await examRes.json();
  assert.ok(examData.success);
  assert.ok(examData.exam.listening.parts.length === 4);
  assert.strictEqual(examData.exam.listening.parts[0].questions[0].answer, undefined, 'Answers must be stripped');

  // 3. Heartbeat
  const pingRes = await fetch(`${baseUrl}/api/sessions/${createdSessionId}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentModule: 'listening',
      currentQuestionIndex: 5,
      timeRemainingSeconds: 1650,
      terminalId: 'PC-12'
    })
  });
  assert.strictEqual(pingRes.status, 200);

  // 4. Save Listening & Reading Answers
  await fetch(`${baseUrl}/api/sessions/${createdSessionId}/save-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleName: 'listening',
      answers: { 1: 'henderson', 2: '84920', 3: 'data' }
    })
  });

  await fetch(`${baseUrl}/api/sessions/${createdSessionId}/save-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleName: 'reading',
      answers: { 1: 'FALSE', 2: 'TRUE', 3: 'FALSE', 4: 'NOT GIVEN' }
    })
  });

  // 5. Save Writing Answers
  await fetch(`${baseUrl}/api/sessions/${createdSessionId}/save-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleName: 'writing',
      answers: {
        task1: 'The chart illustrates the trends in renewable electricity between 2010 and 2024. Overall, all four countries experienced substantial upward growth.',
        task2: 'In conclusion, artificial intelligence has fundamentally transformed modern education.'
      }
    })
  });

  // 6. Upload Speaking Audio
  const formData = new FormData();
  const blob = new Blob(['mock audio binary stream'], { type: 'audio/webm' });
  formData.append('audio', blob, 'sample.webm');
  formData.append('partName', 'part1_q1');

  const audioRes = await fetch(`${baseUrl}/api/sessions/${createdSessionId}/upload-audio`, {
    method: 'POST',
    body: formData
  });
  assert.strictEqual(audioRes.status, 200);
  const audioData = await audioRes.json();
  assert.ok(audioData.success);

  // 7. Submit Exam & Trigger AI Diagnostics
  const submitRes = await fetch(`${baseUrl}/api/sessions/${createdSessionId}/submit-module`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleName: 'speaking',
      isFinalSubmission: true
    })
  });
  assert.strictEqual(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.ok(submitData.success);
  assert.ok(submitData.completed);
  assert.ok(submitData.report.overallBandScore >= 1.0);

  // 8. Fetch Scorecard
  const scoreRes = await fetch(`${baseUrl}/api/sessions/${createdSessionId}/scorecard`);
  assert.strictEqual(scoreRes.status, 200);
  const scoreData = await scoreRes.json();
  assert.ok(scoreData.success);
  assert.strictEqual(scoreData.report.candidate.name, 'David Beckham');

  // 9. Invigilator Terminals Status
  const termRes = await fetch(`${baseUrl}/api/invigilator/terminals`);
  assert.strictEqual(termRes.status, 200);
  const termData = await termRes.json();
  assert.ok(termData.success);
  assert.ok(termData.count >= 1);

  // 10. Invigilator Command Broadcast
  const cmdRes = await fetch(`${baseUrl}/api/invigilator/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'PAUSE_EXAM',
      targetSessionId: createdSessionId
    })
  });
  assert.strictEqual(cmdRes.status, 200);

  // 11. Export CSV
  const csvRes = await fetch(`${baseUrl}/api/invigilator/export-csv`);
  assert.strictEqual(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('David Beckham'));
  assert.ok(csvText.includes('B9012345'));
});

test('API Integration - In-flight session resumption and audio transcript handling', async (t) => {
  const { server, baseUrl } = await startTestServer();
  const createdSessions = [];

  t.after(() => {
    server.close();
    for (const sid of createdSessions) {
      const dir = sessionManager.getSessionPath(sid);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // 1. Initial Login
  const loginRes = await fetch(`${baseUrl}/api/sessions/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Emma Watson',
      passport: 'EW887766',
      targetBand: 8.0,
      examType: 'General',
      terminalId: 'PC-09'
    })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.success);
  assert.strictEqual(loginData.resumed, false);
  createdSessions.push(loginData.sessionId);

  // 2. Candidate saves reading answers
  await fetch(`${baseUrl}/api/sessions/${loginData.sessionId}/save-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleName: 'reading',
      answers: { 1: 'TRUE', 2: 'FALSE' }
    })
  });

  // 3. Candidate PC accidentally refreshes / reconnects with same passport
  const reconnectRes = await fetch(`${baseUrl}/api/sessions/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Emma Watson',
      passport: 'EW887766',
      targetBand: 8.0,
      examType: 'General',
      terminalId: 'PC-09'
    })
  });
  assert.strictEqual(reconnectRes.status, 200);
  const reconnectData = await reconnectRes.json();
  assert.ok(reconnectData.success);
  assert.strictEqual(reconnectData.resumed, true);
  assert.strictEqual(reconnectData.sessionId, loginData.sessionId);
  assert.strictEqual(reconnectData.session.answers.reading['1'], 'TRUE');

  // 4. Upload Speaking audio with speech transcript
  const formData = new FormData();
  const blob = new Blob(['speech audio test stream'], { type: 'audio/webm' });
  formData.append('audio', blob, 'p1_q1.webm');
  formData.append('partName', 'p1_q1');
  formData.append('transcript', 'I live in central London and enjoy reading historical literature.');

  const audioRes = await fetch(`${baseUrl}/api/sessions/${loginData.sessionId}/upload-audio`, {
    method: 'POST',
    body: formData
  });
  assert.strictEqual(audioRes.status, 200);
  const audioData = await audioRes.json();
  assert.ok(audioData.success);
  assert.strictEqual(audioData.file.transcript, 'I live in central London and enjoy reading historical literature.');

  // Verify session on disk retained the transcript
  const sessionOnDisk = sessionManager.getSession(loginData.sessionId);
  assert.strictEqual(sessionOnDisk.answers.speaking.transcripts.p1_q1, 'I live in central London and enjoy reading historical literature.');
});
