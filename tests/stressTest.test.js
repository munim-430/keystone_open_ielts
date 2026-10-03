/**
 * IELTS CD Mock Test Platform - Rigorous Multi-Terminal Stress Test
 * Simulates concurrent classroom terminals operating on LAN simultaneously
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('../server/index');
const sessionManager = require('../server/sessionManager');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

test('Classroom Concurrent Terminals Stress Test', async (t) => {
  const { server, baseUrl } = await startServer();
  const createdSessions = [];

  t.after(() => {
    server.close();
    for (const sid of createdSessions) {
      const p = sessionManager.getSessionPath(sid);
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
    }
  });

  const candidates = [
    { name: 'Arthur Pendelton', passport: 'P11223344', targetBand: 7.0, terminalId: 'PC-01' },
    { name: 'Beatrix Potter', passport: 'P22334455', targetBand: 7.5, terminalId: 'PC-02' },
    { name: 'Charles Darwin', passport: 'P33445566', targetBand: 8.0, terminalId: 'PC-03' },
    { name: 'Dorothy Hodgkin', passport: 'P44556677', targetBand: 8.5, terminalId: 'PC-04' }
  ];

  // 1. Simulate simultaneous candidate logins
  const loginPromises = candidates.map(c => 
    fetch(`${baseUrl}/api/sessions/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: c.name,
        passport: c.passport,
        targetBand: c.targetBand,
        examType: 'Academic',
        terminalId: c.terminalId
      })
    }).then(res => res.json())
  );

  const loginResults = await Promise.all(loginPromises);

  for (let i = 0; i < candidates.length; i++) {
    const res = loginResults[i];
    assert.ok(res.success, `Login for candidate ${candidates[i].name} must succeed`);
    assert.ok(res.sessionId.includes(candidates[i].passport));
    createdSessions.push(res.sessionId);

    // Verify session directory exists
    const sessionDir = sessionManager.getSessionPath(res.sessionId);
    assert.ok(fs.existsSync(sessionDir), 'Session directory must exist');
    assert.ok(fs.existsSync(path.join(sessionDir, 'session.json')));
    assert.ok(fs.existsSync(path.join(sessionDir, 'speaking_audio')));
  }

  // 2. Simulate concurrent answer submissions for Listening & Reading
  const answerPromises = createdSessions.map((sessionId, idx) => {
    return Promise.all([
      fetch(`${baseUrl}/api/sessions/${sessionId}/save-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: 'listening',
          answers: { 1: 'henderson', 2: '84920', 3: 'data', 4: 'self-catered' }
        })
      }),
      fetch(`${baseUrl}/api/sessions/${sessionId}/save-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: 'reading',
          answers: { 1: 'FALSE', 2: 'TRUE', 3: 'FALSE', 4: 'NOT GIVEN', 5: 'TRUE' }
        })
      }),
      fetch(`${baseUrl}/api/sessions/${sessionId}/save-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: 'writing',
          answers: {
            task1: 'The chart illustrates the renewable electricity trends across four European nations between 2010 and 2024. Overall, all four countries experienced substantial upward growth.',
            task2: 'In conclusion, artificial intelligence has fundamentally transformed modern education.'
          }
        })
      })
    ]);
  });

  await Promise.all(answerPromises);

  // 3. Concurrent audio upload simulation
  const audioPromises = createdSessions.map(sessionId => {
    const formData = new FormData();
    const fakeAudio = new Blob(['simulated candidate audio bytes chunk'], { type: 'audio/webm' });
    formData.append('audio', fakeAudio, 'part1.webm');
    formData.append('partName', 'part1_q1');
    formData.append('transcript', 'This is simulated candidate speech transcript for stress testing.');

    return fetch(`${baseUrl}/api/sessions/${sessionId}/upload-audio`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  });

  const audioResults = await Promise.all(audioPromises);
  for (const aRes of audioResults) {
    assert.ok(aRes.success);
    assert.ok(fs.existsSync(aRes.file.filepath));
  }

  // 4. Concurrent exam completion & AI diagnostic evaluation
  const submitPromises = createdSessions.map(sessionId => 
    fetch(`${baseUrl}/api/sessions/${sessionId}/submit-module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleName: 'speaking', isFinalSubmission: true })
    }).then(r => r.json())
  );

  const submitResults = await Promise.all(submitPromises);
  for (const sRes of submitResults) {
    assert.ok(sRes.success);
    assert.ok(sRes.completed);
    assert.ok(typeof sRes.report.overallBandScore === 'number');
    assert.ok(sRes.report.diagnosticSummary.studyPlan.length === 5);
  }

  // 5. Verify Invigilator Terminal grid reflects all completed sessions
  const termRes = await fetch(`${baseUrl}/api/invigilator/terminals`);
  const termData = await termRes.json();
  assert.ok(termData.success);
  assert.ok(termData.terminals.length >= 4);

  // 6. Verify Batch Print View endpoint
  const reportRes = await fetch(`${baseUrl}/report?mode=batch`);
  assert.strictEqual(reportRes.status, 200);

  // 7. Verify CSV Export
  const csvRes = await fetch(`${baseUrl}/api/invigilator/export-csv`);
  assert.strictEqual(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Arthur Pendelton'));
  assert.ok(csvText.includes('Beatrix Potter'));
  assert.ok(csvText.includes('Charles Darwin'));
  assert.ok(csvText.includes('Dorothy Hodgkin'));
});
