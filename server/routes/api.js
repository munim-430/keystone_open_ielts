/**
 * IELTS CD Mock Test Platform - Candidate API Routes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const sessionManager = require('../sessionManager');
const examBank = require('../examBank');
const aiDiagnosticEngine = require('../aiDiagnosticEngine');

// Setup memory storage for multer audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max
});

/**
 * Helper to get clean client IP (handles LAN and proxies)
 */
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1')
    .replace('::ffff:', '')
    .replace('::1', '127.0.0.1');
}

/**
 * POST /api/sessions/login
 * Creates candidate session and physical directory: YYYYMMDD_HHMM_[PASSPORT]_[NAME]
 */
router.post('/login', (req, res) => {
  const { name, passport, targetBand, examType, testSetId, terminalId, forceNew } = req.body;

  if (!name || !passport) {
    return res.status(400).json({ error: 'Candidate Name and Passport / NID are required.' });
  }

  const clientIp = getClientIp(req);

  // Check if an existing in-progress session exists for this candidate
  if (!forceNew) {
    const existingSession = sessionManager.findActiveSession(passport);
    if (existingSession) {
      // Update terminal info
      existingSession.terminal.ip = clientIp;
      if (terminalId) existingSession.terminal.terminalId = terminalId;
      existingSession.terminal.lastHeartbeat = new Date().toISOString();
      sessionManager.saveSessionMetadata(existingSession.sessionId, existingSession);

      if (req.app.get('broadcastToInvigilators')) {
        req.app.get('broadcastToInvigilators')({
          type: 'CANDIDATE_RECONNECTED',
          session: existingSession
        });
      }

      return res.json({
        success: true,
        sessionId: existingSession.sessionId,
        candidate: existingSession.candidate,
        terminal: existingSession.terminal,
        status: existingSession.status,
        currentModule: existingSession.currentModule,
        resumed: true,
        session: existingSession
      });
    }
  }

  const cleanExamType = examType === 'General' ? 'General' : 'Academic';
  const defaultTestSet = cleanExamType === 'General' ? 'general_test_1' : 'academic_test_1';

  const session = sessionManager.createSession({
    name,
    passport,
    targetBand: targetBand || 7.0,
    examType: cleanExamType,
    testSetId: testSetId || defaultTestSet,
    clientIp,
    terminalId: terminalId || `PC-${clientIp.split('.').pop() || '01'}`
  });

  // Notify invigilator via WebSocket if server broadcaster available
  if (req.app.get('broadcastToInvigilators')) {
    req.app.get('broadcastToInvigilators')({
      type: 'CANDIDATE_LOGGED_IN',
      session
    });
  }

  res.json({
    success: true,
    sessionId: session.sessionId,
    candidate: session.candidate,
    terminal: session.terminal,
    status: session.status,
    resumed: false
  });
});

/**
 * GET /api/sessions/:sessionId
 * Retrieves current candidate session state
 */
router.get('/:sessionId', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  res.json({ success: true, session });
});

/**
 * GET /api/sessions/:sessionId/exam
 * Retrieves test content (passages, questions, audio cues, writing prompts)
 */
router.get('/:sessionId/exam', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const exam = examBank.getExamById(session.candidate.testSetId);
  // Strip out answer keys before sending to candidate client to prevent inspection
  const sanitizedExam = JSON.parse(JSON.stringify(exam));

  if (sanitizedExam.listening && sanitizedExam.listening.parts) {
    for (const part of sanitizedExam.listening.parts) {
      for (const q of part.questions) {
        delete q.answer;
      }
    }
  }

  if (sanitizedExam.reading && sanitizedExam.reading.passages) {
    for (const passage of sanitizedExam.reading.passages) {
      for (const q of passage.questions) {
        delete q.answer;
        delete q.explanation;
      }
    }
  }

  res.json({ success: true, exam: sanitizedExam });
});

/**
 * POST /api/sessions/:sessionId/heartbeat
 * Real-time ping from candidate terminal
 */
router.post('/:sessionId/heartbeat', (req, res) => {
  const { currentModule, currentQuestionIndex, timeRemainingSeconds, terminalId } = req.body;
  const clientIp = getClientIp(req);

  const updatedSession = sessionManager.updateHeartbeat(req.params.sessionId, {
    currentModule,
    currentQuestionIndex,
    timeRemainingSeconds,
    clientIp,
    terminalId
  });

  if (!updatedSession) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (req.app.get('broadcastToInvigilators')) {
    req.app.get('broadcastToInvigilators')({
      type: 'CANDIDATE_HEARTBEAT',
      sessionId: updatedSession.sessionId,
      candidate: updatedSession.candidate,
      terminal: updatedSession.terminal,
      currentModule: updatedSession.currentModule,
      timeRemainingSeconds: updatedSession.timeRemainingSeconds,
      status: updatedSession.status,
      moduleProgress: updatedSession.moduleProgress
    });
  }

  res.json({ success: true, status: updatedSession.status });
});

/**
 * POST /api/sessions/:sessionId/save-answers
 * Auto-saves module answers to disk in candidate session folder
 */
router.post('/:sessionId/save-answers', (req, res) => {
  const { moduleName, answers } = req.body;
  if (!moduleName || !answers) {
    return res.status(400).json({ error: 'moduleName and answers are required' });
  }

  const session = sessionManager.saveAnswers(req.params.sessionId, moduleName, answers);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ success: true, updatedAt: session.updatedAt });
});

/**
 * POST /api/sessions/:sessionId/upload-audio
 * Accepts audio recording from candidate microphone for Speaking parts
 */
router.post('/:sessionId/upload-audio', upload.single('audio'), (req, res) => {
  const { partName, transcript } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  try {
    const saved = sessionManager.saveAudioRecording(
      req.params.sessionId,
      partName || 'part',
      req.file.buffer,
      req.file.mimetype || 'audio/webm',
      transcript || ''
    );
    res.json({ success: true, file: saved });
  } catch (err) {
    console.error('Audio save error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sessions/:sessionId/submit-module
 * Marks a module as submitted or completes test and triggers AI diagnostic evaluation
 */
router.post('/:sessionId/submit-module', async (req, res) => {
  const { moduleName, isFinalSubmission } = req.body;
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const exam = examBank.getExamById(session.candidate.testSetId);

  if (moduleName && session.moduleProgress[moduleName]) {
    session.moduleProgress[moduleName].status = 'submitted';
  }

  if (isFinalSubmission || moduleName === 'speaking') {
    // Candidate completed entire 4-module test! Run AI diagnostic evaluation
    try {
      const diagnosticReport = await aiDiagnosticEngine.evaluateSession(session, exam);
      sessionManager.saveDiagnosticReport(session.sessionId, diagnosticReport);

      if (req.app.get('broadcastToInvigilators')) {
        req.app.get('broadcastToInvigilators')({
          type: 'CANDIDATE_COMPLETED',
          sessionId: session.sessionId,
          candidate: session.candidate,
          overallBandScore: diagnosticReport.overallBandScore
        });
      }

      return res.json({
        success: true,
        completed: true,
        report: diagnosticReport
      });
    } catch (err) {
      console.error('Diagnostic evaluation error:', err);
      return res.status(500).json({ error: 'Evaluation failed: ' + err.message });
    }
  }

  sessionManager.saveSessionMetadata(session.sessionId, session);
  res.json({ success: true, session });
});

/**
 * GET /api/sessions/:sessionId/scorecard
 * Retrieves generated diagnostic scorecard and recommendations
 */
router.get('/:sessionId/scorecard', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const reportPath = require('path').join(sessionManager.getSessionPath(session.sessionId), 'diagnostic_report.json');
  if (!require('fs').existsSync(reportPath)) {
    return res.status(404).json({ error: 'Diagnostic report not yet generated' });
  }

  const report = JSON.parse(require('fs').readFileSync(reportPath, 'utf-8'));
  res.json({ success: true, report });
});

module.exports = router;
