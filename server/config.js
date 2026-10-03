/**
 * IELTS CD Mock Test Platform - Server Configuration
 */
const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0', // Listen on all network interfaces for LAN access
  SESSIONS_DIR: path.resolve(process.env.SESSIONS_DIR || path.join(__dirname, '..', 'sessions')),
  DATA_DIR: path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data')),
  
  // AI Diagnostics Configuration ('deepseek', 'groq', 'openrouter', 'heuristic')
  AI_PROVIDER: process.env.AI_PROVIDER || (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'heuristic'),
  
  // DeepSeek Official API
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',

  // Groq API (High speed Llama 3.3 70B & Whisper Large v3)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_CHAT_MODEL: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
  GROQ_WHISPER_MODEL: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
  
  // OpenRouter API
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1:free',
  
  // Test timing defaults (in minutes) - matches official CD IELTS
  TIMINGS: {
    LISTENING: 30, // 30 mins listening + 2 mins check
    READING: 60,   // 60 mins
    WRITING: 60,   // 60 mins (Task 1: 20 mins, Task 2: 40 mins)
    SPEAKING: 15   // 11-14 mins
  },

  // Invigilator Secret / Classroom Code
  INVIGILATOR_PASSCODE: process.env.INVIGILATOR_PASSCODE || 'ielts2026',
  
  // Max upload size for candidate speaking audio recordings
  MAX_AUDIO_SIZE_MB: 25
};
