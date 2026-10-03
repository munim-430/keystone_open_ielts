/**
 * IELTS CD Mock Test Platform - Session & Directory Management
 * Automatically establishes standardized session directories:
 * YYYYMMDD_HHMM_[PASSPORT]_[SANITIZED_NAME]
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

class SessionManager {
  constructor(baseDir = config.SESSIONS_DIR) {
    this.baseDir = baseDir;
    this.ensureDirectory(this.baseDir);
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Sanitizes a name to be filesystem-safe (alphanumeric and underscores only)
   * Example: "Dr. John A. O'Connor-Smith" -> "John_A_OConnorSmith"
   */
  sanitizeName(name) {
    if (!name) return 'CANDIDATE';
    return name
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-zA-Z0-9\s]/g, '')                   // remove special chars
      .replace(/\s+/g, '_')                              // spaces to underscores
      .slice(0, 30);                                     // safe length
  }

  /**
   * Sanitizes a Passport/NID string
   */
  sanitizePassport(passport) {
    if (!passport) return 'NOPASSPORT';
    return passport
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 20);
  }

  /**
   * Generates timestamp formatted as YYYYMMDD_HHMM
   */
  generateTimestamp(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}${mm}${dd}_${hh}${min}`;
  }

  /**
   * Generates directory name formatted as:
   * YYYYMMDD_HHMM_[PASSPORT]_[SANITIZED_NAME]
   */
  generateSessionId(passport, name, date = new Date()) {
    const ts = this.generateTimestamp(date);
    const cleanPassport = this.sanitizePassport(passport);
    const cleanName = this.sanitizeName(name);
    return `${ts}_${cleanPassport}_${cleanName}`;
  }

  /**
   * Creates a new candidate test session and physical directory on host
   */
  createSession({ name, passport, targetBand = 7.0, examType = 'Academic', testSetId = 'academic_test_1', clientIp = '127.0.0.1', terminalId = '' }) {
    const sessionId = this.generateSessionId(passport, name);
    const sessionPath = path.join(this.baseDir, sessionId);
    
    // Create base session directory and speaking_audio subfolder
    this.ensureDirectory(sessionPath);
    this.ensureDirectory(path.join(sessionPath, 'speaking_audio'));

    const initialSession = {
      sessionId,
      sessionPath,
      candidate: {
        name: name.trim(),
        sanitizedName: this.sanitizeName(name),
        passport: passport.trim().toUpperCase(),
        sanitizedPassport: this.sanitizePassport(passport),
        targetBand: parseFloat(targetBand) || 7.0,
        examType: examType === 'General' ? 'General' : 'Academic',
        testSetId
      },
      terminal: {
        ip: clientIp,
        terminalId: terminalId || `PC-${clientIp.split('.').pop() || '01'}`,
        lastHeartbeat: new Date().toISOString()
      },
      status: 'active', // 'active' | 'in_progress' | 'paused' | 'submitted' | 'completed'
      currentModule: 'login', // 'login' | 'sound_check' | 'listening' | 'reading' | 'writing' | 'speaking' | 'completed'
      currentQuestionIndex: 0,
      timeRemainingSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      moduleProgress: {
        listening: { status: 'not_started', rawScore: null, bandScore: null, timeSpentSeconds: 0 },
        reading: { status: 'not_started', rawScore: null, bandScore: null, timeSpentSeconds: 0 },
        writing: { status: 'not_started', task1Words: 0, task2Words: 0, bandScore: null, timeSpentSeconds: 0 },
        speaking: { status: 'not_started', bandScore: null, recordingsCount: 0, timeSpentSeconds: 0 }
      },
      overallBandScore: null,
      answers: {
        listening: {},
        reading: {},
        writing: {
          task1: '',
          task2: ''
        },
        speaking: {
          notes: '',
          transcripts: {},
          recordings: []
        }
      }
    };

    this.saveSessionMetadata(sessionId, initialSession);
    return initialSession;
  }

  /**
   * Finds an active or in-progress session by candidate passport
   * Allows reconnecting terminals after accidental refresh or PC reboot
   */
  findActiveSession(passport) {
    if (!passport) return null;
    const cleanPassport = this.sanitizePassport(passport);
    const sessions = this.listAllSessions();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return sessions.find(s => {
      const matchPassport = s.candidate && s.candidate.sanitizedPassport === cleanPassport;
      const isRecent = (now - new Date(s.createdAt).getTime()) < twentyFourHours;
      const notFinished = s.status !== 'completed';
      return matchPassport && isRecent && notFinished;
    }) || null;
  }

  getSessionPath(sessionId) {
    return path.join(this.baseDir, sessionId);
  }

  saveSessionMetadata(sessionId, data) {
    const sessionPath = this.getSessionPath(sessionId);
    this.ensureDirectory(sessionPath);
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(path.join(sessionPath, 'session.json'), JSON.stringify(data, null, 2), 'utf-8');
  }

  getSession(sessionId) {
    const sessionPath = this.getSessionPath(sessionId);
    const metaFile = path.join(sessionPath, 'session.json');
    if (!fs.existsSync(metaFile)) {
      return null;
    }
    try {
      const content = fs.readFileSync(metaFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Error reading session ${sessionId}:`, err);
      return null;
    }
  }

  listAllSessions() {
    this.ensureDirectory(this.baseDir);
    const entries = fs.readdirSync(this.baseDir, { withFileTypes: true });
    const sessions = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const session = this.getSession(entry.name);
        if (session) {
          sessions.push(session);
        }
      }
    }

    // Sort newest first
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sessions;
  }

  updateHeartbeat(sessionId, { currentModule, currentQuestionIndex, timeRemainingSeconds, clientIp, terminalId }) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.terminal.lastHeartbeat = new Date().toISOString();
    if (clientIp) session.terminal.ip = clientIp;
    if (terminalId) session.terminal.terminalId = terminalId;
    if (currentModule) session.currentModule = currentModule;
    if (typeof currentQuestionIndex === 'number') session.currentQuestionIndex = currentQuestionIndex;
    if (typeof timeRemainingSeconds === 'number') session.timeRemainingSeconds = timeRemainingSeconds;

    this.saveSessionMetadata(sessionId, session);
    return session;
  }

  saveAnswers(sessionId, moduleName, answers) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    if (!session.answers[moduleName]) {
      session.answers[moduleName] = {};
    }

    if (moduleName === 'writing') {
      session.answers.writing.task1 = answers.task1 ?? session.answers.writing.task1;
      session.answers.writing.task2 = answers.task2 ?? session.answers.writing.task2;
      session.moduleProgress.writing.task1Words = (session.answers.writing.task1 || '').trim().split(/\s+/).filter(Boolean).length;
      session.moduleProgress.writing.task2Words = (session.answers.writing.task2 || '').trim().split(/\s+/).filter(Boolean).length;
    } else if (moduleName === 'speaking') {
      if (answers.notes !== undefined) session.answers.speaking.notes = answers.notes;
      if (answers.transcripts !== undefined) {
        session.answers.speaking.transcripts = {
          ...(session.answers.speaking.transcripts || {}),
          ...answers.transcripts
        };
      }
    } else {
      session.answers[moduleName] = { ...session.answers[moduleName], ...answers };
    }

    // Also persist specific module answers to dedicated JSON file
    const sessionPath = this.getSessionPath(sessionId);
    fs.writeFileSync(
      path.join(sessionPath, `${moduleName}_answers.json`),
      JSON.stringify(session.answers[moduleName], null, 2),
      'utf-8'
    );

    this.saveSessionMetadata(sessionId, session);
    return session;
  }

  saveAudioRecording(sessionId, partName, fileBuffer, mimeType = 'audio/webm', transcript = '') {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const audioDir = path.join(this.getSessionPath(sessionId), 'speaking_audio');
    this.ensureDirectory(audioDir);

    const ext = mimeType.includes('wav') ? 'wav' : 'webm';
    const filename = `${partName}_${Date.now()}.${ext}`;
    const filepath = path.join(audioDir, filename);

    fs.writeFileSync(filepath, fileBuffer);

    // Track recording in session
    session.answers.speaking.recordings.push({
      part: partName,
      filename,
      filepath,
      mimeType,
      transcript: transcript || '',
      uploadedAt: new Date().toISOString(),
      bytes: fileBuffer.length
    });

    if (transcript) {
      if (!session.answers.speaking.transcripts) {
        session.answers.speaking.transcripts = {};
      }
      session.answers.speaking.transcripts[partName] = transcript;
    }

    session.moduleProgress.speaking.recordingsCount = session.answers.speaking.recordings.length;

    this.saveSessionMetadata(sessionId, session);
    return { filename, filepath, part: partName, transcript };
  }

  saveDiagnosticReport(sessionId, diagnosticData) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const sessionPath = this.getSessionPath(sessionId);
    fs.writeFileSync(
      path.join(sessionPath, 'diagnostic_report.json'),
      JSON.stringify(diagnosticData, null, 2),
      'utf-8'
    );

    // Update overall scores in session metadata
    if (diagnosticData.moduleScores) {
      if (diagnosticData.moduleScores.listening) {
        session.moduleProgress.listening.rawScore = diagnosticData.moduleScores.listening.raw;
        session.moduleProgress.listening.bandScore = diagnosticData.moduleScores.listening.band;
      }
      if (diagnosticData.moduleScores.reading) {
        session.moduleProgress.reading.rawScore = diagnosticData.moduleScores.reading.raw;
        session.moduleProgress.reading.bandScore = diagnosticData.moduleScores.reading.band;
      }
      if (diagnosticData.moduleScores.writing) {
        session.moduleProgress.writing.bandScore = diagnosticData.moduleScores.writing.band;
      }
      if (diagnosticData.moduleScores.speaking) {
        session.moduleProgress.speaking.bandScore = diagnosticData.moduleScores.speaking.band;
      }
    }
    session.overallBandScore = diagnosticData.overallBandScore;
    session.status = 'completed';
    session.currentModule = 'completed';

    this.saveSessionMetadata(sessionId, session);
    return session;
  }
}

module.exports = new SessionManager();
