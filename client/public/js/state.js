/**
 * IELTS CD Mock Test Platform - Global State Store
 */

const State = {
  sessionId: null,
  candidate: null,
  terminal: null,
  status: 'idle', // 'login' | 'sound_check' | 'listening' | 'reading' | 'writing' | 'speaking' | 'completed'
  currentModule: 'login',
  currentQuestionIndex: 0,
  timeRemainingSeconds: 0,
  timerInterval: null,
  heartbeatInterval: null,
  autoSaveInterval: null,
  
  exam: null,
  answers: {
    listening: {},
    reading: {},
    writing: { task1: '', task2: '' },
    speaking: { notes: '', recordings: [] }
  },
  flaggedQuestions: new Set(),
  highlighterNotes: [],

  // Preferences
  fontSize: 'standard', // 'standard' | 'large' | 'xlarge'
  contrast: 'standard', // 'standard' | 'bw' | 'wb' | 'yb'
  volume: 0.8
};

window.IELTS_STATE = State;
