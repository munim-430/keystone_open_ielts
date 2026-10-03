const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const sessionManager = require('../server/sessionManager');

test('SessionManager directory naming and sanitization', () => {
  const cleanName = sessionManager.sanitizeName("Mr. Md. John A. O'Connor-Smith Jr.");
  assert.strictEqual(cleanName, 'Mr_Md_John_A_OConnorSmith_Jr');

  const cleanPassport = sessionManager.sanitizePassport('a 123-456-78b ');
  assert.strictEqual(cleanPassport, 'A12345678B');

  const fixedDate = new Date(2026, 9, 3, 14, 5); // 2026-10-03 14:05
  const sessionId = sessionManager.generateSessionId('A12345678B', 'John Doe', fixedDate);
  assert.strictEqual(sessionId, '20261003_1405_A12345678B_John_Doe');

  // Verify format matches regex
  const regex = /^\d{8}_\d{4}_[A-Z0-9]+_[A-Za-z0-9_]+$/;
  assert.ok(regex.test(sessionId), `Session ID ${sessionId} must match required format`);
});

test('Session creation, file structure and updates', () => {
  const testCandidate = {
    name: 'Emily Watson',
    passport: 'E98765432',
    targetBand: 7.5,
    examType: 'Academic',
    testSetId: 'academic_test_1',
    clientIp: '192.168.1.105',
    terminalId: 'PC-05'
  };

  const session = sessionManager.createSession(testCandidate);
  assert.ok(session);
  assert.strictEqual(session.candidate.name, 'Emily Watson');
  assert.strictEqual(session.candidate.passport, 'E98765432');
  assert.strictEqual(session.candidate.targetBand, 7.5);
  assert.strictEqual(session.terminal.terminalId, 'PC-05');

  // Check physical directory exists
  const sessionDir = sessionManager.getSessionPath(session.sessionId);
  assert.ok(fs.existsSync(sessionDir), 'Session directory must exist on disk');
  assert.ok(fs.existsSync(path.join(sessionDir, 'session.json')), 'session.json must exist');
  assert.ok(fs.existsSync(path.join(sessionDir, 'speaking_audio')), 'speaking_audio directory must exist');

  // Check save answers
  sessionManager.saveAnswers(session.sessionId, 'listening', { 1: 'university', 2: 'central library' });
  const updatedSession = sessionManager.getSession(session.sessionId);
  assert.strictEqual(updatedSession.answers.listening['1'], 'university');
  assert.ok(fs.existsSync(path.join(sessionDir, 'listening_answers.json')));

  // Check writing answers and word count
  sessionManager.saveAnswers(session.sessionId, 'writing', {
    task1: 'The chart illustrates the trends in renewable energy.',
    task2: 'In conclusion, artificial intelligence has fundamentally transformed modern education.'
  });
  const writeSession = sessionManager.getSession(session.sessionId);
  assert.strictEqual(writeSession.moduleProgress.writing.task1Words, 8);
  assert.strictEqual(writeSession.moduleProgress.writing.task2Words, 9);

  // Check audio recording save
  const fakeAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....');
  const audioResult = sessionManager.saveAudioRecording(session.sessionId, 'part1_q1', fakeAudioBuffer, 'audio/webm');
  assert.ok(fs.existsSync(audioResult.filepath));
  assert.strictEqual(audioResult.part, 'part1_q1');

  // Clean up test session folder
  fs.rmSync(sessionDir, { recursive: true, force: true });
});
