/**
 * IELTS CD Mock Test Platform - Invigilator & Admin Hub Routes
 * Manages live classroom monitoring for up to 22+ Core i3 client terminals
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sessionManager = require('../sessionManager');
const aiDiagnosticEngine = require('../aiDiagnosticEngine');
const config = require('../config');

/**
 * GET /api/invigilator/terminals
 * Returns status of all active terminals and completed sessions
 */
router.get('/terminals', (req, res) => {
  const allSessions = sessionManager.listAllSessions();
  const now = Date.now();

  const terminals = allSessions.map(session => {
    const lastPing = new Date(session.terminal.lastHeartbeat || session.updatedAt).getTime();
    const diffSeconds = Math.round((now - lastPing) / 1000);
    
    // Status classification:
    // Online if pinged within last 30s
    // Warning if 30s - 90s
    // Disconnected if > 90s
    let healthStatus = 'online';
    if (session.status === 'completed') {
      healthStatus = 'completed';
    } else if (diffSeconds > 90) {
      healthStatus = 'disconnected';
    } else if (diffSeconds > 30) {
      healthStatus = 'idle';
    }

    return {
      sessionId: session.sessionId,
      terminalId: session.terminal.terminalId,
      ip: session.terminal.ip,
      candidate: session.candidate,
      status: session.status,
      currentModule: session.currentModule,
      timeRemainingSeconds: session.timeRemainingSeconds,
      moduleProgress: session.moduleProgress,
      overallBandScore: session.overallBandScore,
      healthStatus,
      lastSeenSecondsAgo: diffSeconds,
      createdAt: session.createdAt
    };
  });

  res.json({ success: true, count: terminals.length, terminals });
});

/**
 * POST /api/invigilator/command
 * Broadcasts or targets invigilator commands to client PCs
 */
router.post('/command', (req, res) => {
  const { action, targetSessionId, payload } = req.body;
  // Supported actions: 'START_EXAM', 'PAUSE_EXAM', 'RESUME_EXAM', 'EXTEND_TIME', 'FORCE_SUBMIT'

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  const broadcastFn = req.app.get('broadcastToClients');
  if (broadcastFn) {
    broadcastFn({
      type: 'INVIGILATOR_COMMAND',
      action,
      targetSessionId: targetSessionId || 'ALL',
      payload: payload || {}
    });
  }

  // Update session status in sessionManager if targeting specific session
  if (targetSessionId && targetSessionId !== 'ALL') {
    const session = sessionManager.getSession(targetSessionId);
    if (session) {
      if (action === 'PAUSE_EXAM') session.status = 'paused';
      if (action === 'RESUME_EXAM') session.status = 'in_progress';
      sessionManager.saveSessionMetadata(targetSessionId, session);
    }
  }

  res.json({ success: true, action, targetSessionId: targetSessionId || 'ALL' });
});

/**
 * GET /api/invigilator/export-csv
 * Exports classroom results to standard CSV format
 */
router.get('/export-csv', (req, res) => {
  const allSessions = sessionManager.listAllSessions();

  const headers = [
    'Session ID', 'Terminal', 'Candidate Name', 'Passport / NID', 'Exam Type',
    'Target Band', 'Overall Band', 'CEFR Level',
    'Listening Raw', 'Listening Band',
    'Reading Raw', 'Reading Band',
    'Writing Task 1 Words', 'Writing Task 2 Words', 'Writing Band',
    'Speaking Band', 'Status', 'Date'
  ];

  const rows = allSessions.map(s => {
    let cefr = 'N/A';
    const reportPath = path.join(s.sessionPath, 'diagnostic_report.json');
    if (fs.existsSync(reportPath)) {
      try {
        const rep = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        cefr = rep.cefrLevel || 'N/A';
      } catch (e) {}
    }

    return [
      `"${s.sessionId}"`,
      `"${s.terminal.terminalId}"`,
      `"${s.candidate.name}"`,
      `"${s.candidate.passport}"`,
      `"${s.candidate.examType}"`,
      s.candidate.targetBand,
      s.overallBandScore !== null ? s.overallBandScore : 'In Progress',
      `"${cefr}"`,
      s.moduleProgress.listening.rawScore ?? '',
      s.moduleProgress.listening.bandScore ?? '',
      s.moduleProgress.reading.rawScore ?? '',
      s.moduleProgress.reading.bandScore ?? '',
      s.moduleProgress.writing.task1Words ?? 0,
      s.moduleProgress.writing.task2Words ?? 0,
      s.moduleProgress.writing.bandScore ?? '',
      s.moduleProgress.speaking.bandScore ?? '',
      s.status,
      `"${new Date(s.createdAt).toLocaleDateString()}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="IELTS_Classroom_Results_${Date.now()}.csv"`);
  res.send(csvContent);
});

/**
 * GET /api/invigilator/settings
 * Retrieves active AI configuration
 */
router.get('/settings', (req, res) => {
  res.json({
    success: true,
    provider: aiDiagnosticEngine.provider,
    deepseekConfigured: Boolean(config.DEEPSEEK_API_KEY),
    groqConfigured: Boolean(config.GROQ_API_KEY),
    openrouterConfigured: Boolean(config.OPENROUTER_API_KEY)
  });
});

/**
 * POST /api/invigilator/settings
 * Updates AI provider and credentials from invigilator dashboard
 */
router.post('/settings', (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider) return res.status(400).json({ error: 'Provider is required' });

  aiDiagnosticEngine.setProvider(provider, apiKey);
  res.json({ success: true, provider: aiDiagnosticEngine.provider });
});

module.exports = router;
