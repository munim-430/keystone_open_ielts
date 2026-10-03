/**
 * IELTS CD Mock Test Platform - AI Diagnostic Evaluation Engine
 * Multi-Provider Architecture:
 * 1. DeepSeek (Official DeepSeek-V3 / DeepSeek-R1 API)
 * 2. Groq (Llama 3.3 70B & Whisper Large v3)
 * 3. OpenRouter (DeepSeek-R1 / V3 / Llama 3)
 * 4. Offline Heuristic Local Rule Engine (100% offline, zero-cost, high reliability)
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const scoringEngine = require('./scoringEngine');

// Academic Word List (AWL) & High-Band IELTS Collocations for Lexical Resource Analysis
const C1_C2_VOCABULARY = new Set([
  'furthermore', 'consequently', 'notwithstanding', 'predominantly', 'dismantle',
  'inevitable', 'paradigm', 'catalyst', 'substantial', 'exponential',
  'adversity', 'resilience', 'mitigate', 'disseminate', 'ubiquitous',
  'unprecedented', 'phenomenon', 'corroborate', 'detrimental', 'salutary',
  'hydrodynamic', 'synthetic', 'propensity', 'imperative', 'deluge',
  'intractable', 'recalibrated', 'autonomous', 'biomimicry', 'counterpart',
  'discrepancy', 'exemplify', 'fluctuate', 'hierarchy', 'infrastructure',
  'intrinsic', 'manifest', 'plausible', 'qualitative', 'quantitative',
  'reinforce', 'subsequent', 'sustainable', 'tangible', 'underlying'
]);

const WEAK_WORDS_MAP = {
  'good': ['beneficial', 'advantageous', 'salutary', 'favorable'],
  'bad': ['detrimental', 'adverse', 'deleterious', 'unfavorable'],
  'big': ['substantial', 'colossal', 'monumental', 'extensive'],
  'small': ['negligible', 'marginal', 'minute', 'diminutive'],
  'a lot': ['a substantial proportion', 'an abundance', 'a multitude'],
  'many': ['numerous', 'a myriad of', 'copious', 'diverse'],
  'think': ['posit', 'contend', 'maintain', 'argue'],
  'show': ['illustrate', 'delineate', 'exemplify', 'demonstrate'],
  'get': ['acquire', 'obtain', 'attain', 'derive'],
  'make': ['fabricate', 'construct', 'synthesize', 'generate']
};

class AIDiagnosticEngine {
  constructor() {
    this.provider = config.AI_PROVIDER || 'deepseek';
    this.deepSeekApiKey = config.DEEPSEEK_API_KEY;
    this.groqApiKey = config.GROQ_API_KEY;
    this.openRouterApiKey = config.OPENROUTER_API_KEY;
  }

  setProvider(provider, apiKey = '') {
    this.provider = provider;
    if (provider === 'deepseek') this.deepSeekApiKey = apiKey;
    if (provider === 'groq') this.groqApiKey = apiKey;
    if (provider === 'openrouter') this.openRouterApiKey = apiKey;
  }

  /**
   * Main entry point to evaluate a full exam session
   */
  async evaluateSession(session, examBank) {
    const listeningResults = scoringEngine.evaluateListening(session.answers.listening || {}, examBank.listening);
    const readingResults = scoringEngine.evaluateReading(session.answers.reading || {}, examBank.reading, session.candidate.examType);
    
    // Evaluate Writing (Task 1 & Task 2)
    const writingResults = await this.evaluateWriting(session.answers.writing || {}, examBank.writing);

    // Evaluate Speaking
    const speakingResults = await this.evaluateSpeaking(session.answers.speaking || {}, examBank.speaking);

    // Calculate Overall Band using official rounding
    const overallBand = scoringEngine.calculateOverallBand({
      listening: listeningResults.bandScore,
      reading: readingResults.bandScore,
      writing: writingResults.bandScore,
      speaking: speakingResults.bandScore
    });

    // Derive CEFR Level
    const cefr = this.bandToCEFR(overallBand);

    // Generate Comprehensive Actionable Prescription
    const diagnosticSummary = this.generateDiagnosticSummary({
      candidate: session.candidate,
      listening: listeningResults,
      reading: readingResults,
      writing: writingResults,
      speaking: speakingResults,
      overallBand,
      cefr
    });

    const report = {
      sessionId: session.sessionId,
      evaluatedAt: new Date().toISOString(),
      candidate: session.candidate,
      overallBandScore: overallBand,
      cefrLevel: cefr,
      targetBand: session.candidate.targetBand,
      targetDifference: (overallBand - session.candidate.targetBand).toFixed(1),
      moduleScores: {
        listening: { raw: listeningResults.rawScore, band: listeningResults.bandScore, accuracy: listeningResults.accuracyPercentage },
        reading: { raw: readingResults.rawScore, band: readingResults.bandScore, accuracy: readingResults.accuracyPercentage },
        writing: { band: writingResults.bandScore, subScores: writingResults.subScores },
        speaking: { band: speakingResults.bandScore, subScores: speakingResults.subScores }
      },
      listeningEvaluation: listeningResults,
      readingEvaluation: readingResults,
      writingEvaluation: writingResults,
      speakingEvaluation: speakingResults,
      diagnosticSummary
    };

    return report;
  }

  bandToCEFR(band) {
    if (band >= 8.5) return 'C2 - Mastery / Proficient';
    if (band >= 7.0) return 'C1 - Effective Operational Proficiency';
    if (band >= 5.5) return 'B2 - Independent Vantage';
    if (band >= 4.0) return 'B1 - Independent Threshold';
    return 'A2 - Waystage / Basic';
  }

  /**
   * Evaluates candidate's Writing responses
   */
  async evaluateWriting(writingAnswers, writingExam) {
    const task1Text = (writingAnswers.task1 || '').trim();
    const task2Text = (writingAnswers.task2 || '').trim();

    // Check if DeepSeek API configured
    if ((this.provider === 'deepseek' || !this.provider) && this.deepSeekApiKey) {
      try {
        const result = await this.evaluateWritingWithDeepSeek(task1Text, task2Text, writingExam);
        if (result && result.bandScore) return result;
      } catch (err) {
        console.warn('DeepSeek Writing evaluation failed, trying fallback:', err.message);
      }
    }

    // Check Groq
    if (this.provider === 'groq' && this.groqApiKey) {
      try {
        return await this.evaluateWritingWithGroq(task1Text, task2Text, writingExam);
      } catch (err) {
        console.warn('Groq Writing evaluation failed, falling back to heuristic engine:', err.message);
      }
    }

    // Check OpenRouter
    if (this.provider === 'openrouter' && this.openRouterApiKey) {
      try {
        return await this.evaluateWritingWithOpenRouter(task1Text, task2Text, writingExam);
      } catch (err) {
        console.warn('OpenRouter Writing evaluation failed, falling back to heuristic engine:', err.message);
      }
    }

    // Default: High-fidelity Offline Heuristic Engine
    return this.evaluateWritingHeuristically(task1Text, task2Text, writingExam);
  }

  /**
   * DeepSeek API caller for Writing evaluation
   */
  async evaluateWritingWithDeepSeek(task1, task2, exam) {
    const prompt = `You are a certified Cambridge/IDP IELTS Senior Examiner.
Evaluate the following candidate submissions for IELTS Academic Writing according to the official IELTS Band Descriptors:
1. Task Achievement / Task Response (TR/TA)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

---
TASK 1 PROMPT:
${exam.tasks[0].prompt}

CANDIDATE TASK 1 SUBMISSION:
"""
${task1 || '(No Task 1 text submitted)'}
"""

---
TASK 2 PROMPT:
${exam.tasks[1].prompt}

CANDIDATE TASK 2 SUBMISSION:
"""
${task2 || '(No Task 2 text submitted)'}
"""

Calculate overall Writing Band Score (Task 2 has double weight: (Task 1 + Task 2*2)/3 rounded to nearest 0.5 band).
Provide specific vocabulary upgrades and grammatical points.

Output ONLY a single valid JSON object strictly matching this schema:
{
  "bandScore": 6.5,
  "task1": {
    "bandScore": 6.5,
    "wordCount": 165,
    "criteria": { "taskAchievement": 6.5, "coherenceCohesion": 6.5, "lexicalResource": 6.5, "grammaticalRange": 6.0 }
  },
  "task2": {
    "bandScore": 6.5,
    "wordCount": 275,
    "criteria": { "taskResponse": 6.5, "coherenceCohesion": 7.0, "lexicalResource": 6.5, "grammaticalRange": 6.5 }
  },
  "subScores": {
    "taskAchievement": 6.5,
    "coherenceCohesion": 6.8,
    "lexicalResource": 6.5,
    "grammaticalRange": 6.3
  },
  "suggestedUpgrades": [
    { "current": "shows that", "recommended": ["illustrates that", "delineates that"], "impact": "Enhances Lexical Resource to Band 7.5+" }
  ],
  "identifiedGrammarCheckpoints": [
    "Specific error or improvement note 1",
    "Specific error or improvement note 2"
  ],
  "evaluatorMode": "deepseek-chat"
}`;

    const res = await fetch(`${config.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.deepSeekApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an official Cambridge IELTS Writing Examiner. You evaluate essays with rigorous adherence to official band descriptors and return strictly JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!res.ok) {
      throw new Error(`DeepSeek API returned status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    parsed.evaluatorMode = 'deepseek-' + (config.DEEPSEEK_MODEL || 'chat');
    return parsed;
  }

  /**
   * Evaluates candidate's Speaking module
   */
  async evaluateSpeaking(speakingAnswers, speakingExam) {
    const recordings = speakingAnswers.recordings || [];
    const notes = speakingAnswers.notes || '';

    // If DeepSeek available and notes/transcripts present
    if ((this.provider === 'deepseek' || !this.provider) && this.deepSeekApiKey && (notes || recordings.length > 0)) {
      try {
        const result = await this.evaluateSpeakingWithDeepSeek(notes, recordings, speakingExam);
        if (result && result.bandScore) return result;
      } catch (err) {
        console.warn('DeepSeek Speaking evaluation failed, falling back to heuristic:', err.message);
      }
    }

    return this.evaluateSpeakingHeuristically(speakingAnswers, speakingExam);
  }

  /**
   * DeepSeek API caller for Speaking evaluation
   */
  async evaluateSpeakingWithDeepSeek(notes, recordings, exam) {
    const prompt = `You are a certified Cambridge/IDP IELTS Speaking Examiner.
Evaluate candidate speaking performance across Parts 1, 2, and 3.
Candidate completed ${recordings.length} audio response parts.
Candidate's Part 2 preparation notepad content:
"""
${notes || '(No notes entered)'}
"""

Evaluate across the four official criteria:
1. Fluency and Coherence (FC)
2. Lexical Resource (LR)
3. Grammatical Range and Accuracy (GRA)
4. Pronunciation (PR)

Output ONLY a valid JSON object matching this schema:
{
  "bandScore": 6.5,
  "recordingsCaptured": ${recordings.length},
  "subScores": {
    "fluencyCoherence": 6.5,
    "lexicalResource": 6.5,
    "grammaticalRange": 6.5,
    "pronunciation": 6.5
  },
  "diagnosticPoints": [
    "Observation 1 regarding fluency and turn-taking",
    "Observation 2 regarding topical vocabulary and prep notes"
  ],
  "fluencyTips": [
    "Actionable tip 1",
    "Actionable tip 2"
  ],
  "evaluatorMode": "deepseek-chat"
}`;

    const res = await fetch(`${config.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.deepSeekApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an official Cambridge IELTS Speaking Examiner returning structured diagnostic evaluations in JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!res.ok) {
      throw new Error(`DeepSeek API returned status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    parsed.evaluatorMode = 'deepseek-' + (config.DEEPSEEK_MODEL || 'chat');
    return parsed;
  }

  /**
   * Offline Local Heuristic Evaluation for Writing
   */
  evaluateWritingHeuristically(task1Text, task2Text, writingExam) {
    const t1Words = task1Text ? task1Text.split(/\s+/).filter(Boolean) : [];
    const t2Words = task2Text ? task2Text.split(/\s+/).filter(Boolean) : [];

    const t1Count = t1Words.length;
    const t2Count = t2Words.length;

    // --- Task 1 Analysis (Academic Report) ---
    let t1TA = 6.0;
    if (t1Count < 100) t1TA = 4.0;
    else if (t1Count < 140) t1TA = 5.0;
    else if (t1Count >= 150) {
      const hasOverview = /(overall|in summary|it is noticeable that|broadly speaking)/i.test(task1Text);
      const hasNumbers = /\b\d+(\.\d+)?%?\b/.test(task1Text);
      if (hasOverview && hasNumbers && t1Count >= 160) t1TA = 7.5;
      else if (hasOverview || hasNumbers) t1TA = 6.5;
    }

    const t1Paragraphs = task1Text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let t1CC = t1Paragraphs.length >= 3 ? 6.5 : (t1Paragraphs.length === 2 ? 5.5 : 4.5);

    const t1AWLMatches = t1Words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => C1_C2_VOCABULARY.has(w));
    let t1LR = t1AWLMatches.length >= 6 ? 7.5 : (t1AWLMatches.length >= 3 ? 6.5 : 5.5);

    const t1ComplexStructures = (task1Text.match(/\b(while|whereas|although|compared to|in comparison|as opposed to|experienced a significant)\b/gi) || []).length;
    let t1GRA = t1ComplexStructures >= 3 ? 7.0 : (t1ComplexStructures >= 1 ? 6.0 : 5.0);

    const task1Band = Math.round(((t1TA + t1CC + t1LR + t1GRA) / 4) * 2) / 2;

    // --- Task 2 Analysis (Academic Essay) ---
    let t2TR = 6.0;
    if (t2Count < 180) t2TR = 4.5;
    else if (t2Count < 230) t2TR = 5.5;
    else if (t2Count >= 250) {
      const hasBothViews = /(on the one hand|some argue|critics claim|conversely|on the other hand|proponents suggest)/i.test(task2Text);
      const hasOpinion = /(in my opinion|i firmly believe|i contend that|from my perspective|i maintain that)/i.test(task2Text);
      if (hasBothViews && hasOpinion && t2Count >= 270) t2TR = 7.5;
      else if (hasBothViews || hasOpinion) t2TR = 6.5;
    }

    const t2Paragraphs = task2Text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let t2CC = t2Paragraphs.length >= 4 ? 7.0 : (t2Paragraphs.length === 3 ? 6.0 : 5.0);

    const t2AWLMatches = t2Words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => C1_C2_VOCABULARY.has(w));
    let t2LR = t2AWLMatches.length >= 10 ? 8.0 : (t2AWLMatches.length >= 5 ? 7.0 : (t2AWLMatches.length >= 2 ? 6.0 : 5.0));

    const t2ComplexStructures = (task2Text.match(/\b(although|even though|not only|furthermore|if.*then|by doing so|which implies|leading to)\b/gi) || []).length;
    let t2GRA = t2ComplexStructures >= 4 ? 7.5 : (t2ComplexStructures >= 2 ? 6.5 : 5.5);

    const task2Band = Math.round(((t2TR + t2CC + t2LR + t2GRA) / 4) * 2) / 2;

    // Official IELTS Writing formula: Task 2 has double weight
    const combinedWritingScore = (task1Band + task2Band * 2) / 3;
    const writingBand = Math.round(combinedWritingScore * 2) / 2;

    // Detect vocabulary upgrades and grammar suggestions
    const suggestedUpgrades = [];
    const allWords = [...t1Words, ...t2Words].map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
    for (const [weakWord, betterAlternatives] of Object.entries(WEAK_WORDS_MAP)) {
      if (allWords.includes(weakWord) && suggestedUpgrades.length < 5) {
        suggestedUpgrades.push({
          current: weakWord,
          recommended: betterAlternatives.slice(0, 3),
          impact: 'Enhances Lexical Resource to Band 7.5+'
        });
      }
    }

    const identifiedGrammarCheckpoints = [];
    if (t1Count > 0 && t1Count < 150) {
      identifiedGrammarCheckpoints.push(`Task 1 word count (${t1Count} words) is below the required 150-word threshold; this automatically caps Task Achievement.`);
    }
    if (t2Count > 0 && t2Count < 250) {
      identifiedGrammarCheckpoints.push(`Task 2 word count (${t2Count} words) is below the official 250-word minimum; this incurs a direct penalty on Task Response.`);
    }
    if (t1Paragraphs.length < 3) {
      identifiedGrammarCheckpoints.push('Task 1 should be clearly partitioned into 3 or 4 paragraphs: Introduction, Overview, and 1-2 Detailed Body paragraphs.');
    }
    if (t2Paragraphs.length < 4) {
      identifiedGrammarCheckpoints.push('Task 2 essay requires a 4-paragraph structure: Introduction (with Thesis), Body 1 (View A), Body 2 (View B/Own View), and Conclusion.');
    }

    return {
      bandScore: writingBand,
      task1: {
        wordCount: t1Count,
        meetsMinimum: t1Count >= 150,
        bandScore: task1Band,
        criteria: {
          taskAchievement: t1TA,
          coherenceCohesion: t1CC,
          lexicalResource: t1LR,
          grammaticalRange: t1GRA
        }
      },
      task2: {
        wordCount: t2Count,
        meetsMinimum: t2Count >= 250,
        bandScore: task2Band,
        criteria: {
          taskResponse: t2TR,
          coherenceCohesion: t2CC,
          lexicalResource: t2LR,
          grammaticalRange: t2GRA
        }
      },
      subScores: {
        taskAchievement: Math.round(((t1TA + t2TR * 2) / 3) * 10) / 10,
        coherenceCohesion: Math.round(((t1CC + t2CC * 2) / 3) * 10) / 10,
        lexicalResource: Math.round(((t1LR + t2LR * 2) / 3) * 10) / 10,
        grammaticalRange: Math.round(((t1GRA + t2GRA * 2) / 3) * 10) / 10
      },
      suggestedUpgrades,
      identifiedGrammarCheckpoints,
      evaluatorMode: 'heuristic'
    };
  }

  evaluateSpeakingHeuristically(speakingAnswers, speakingExam) {
    const recordings = speakingAnswers.recordings || [];
    const notes = speakingAnswers.notes || '';

    const totalRecordings = recordings.length;
    const notesLength = notes.trim().length;

    let fc = 6.0;
    if (totalRecordings >= 6) fc = 7.0;
    else if (totalRecordings >= 3) fc = 6.0;
    else if (totalRecordings >= 1) fc = 5.0;
    else fc = 4.0;

    let lr = 6.0;
    if (notesLength > 100) lr = 7.0;
    else if (notesLength > 30) lr = 6.5;

    let gra = 6.0;
    if (totalRecordings >= 5) gra = 6.5;

    let pr = 6.5;

    const speakingBand = Math.round(((fc + lr + gra + pr) / 4) * 2) / 2;

    return {
      bandScore: speakingBand,
      recordingsCaptured: totalRecordings,
      subScores: {
        fluencyCoherence: fc,
        lexicalResource: lr,
        grammaticalRange: gra,
        pronunciation: pr
      },
      diagnosticPoints: [
        totalRecordings >= 6 
          ? 'Comprehensive responses submitted across Parts 1, 2, and 3 demonstrate consistent communicative stamina.'
          : 'Incomplete recording parts detected; aim to deliver a continuous 2-minute response for Part 2 Long Turn.',
        notesLength > 40
          ? 'Effective use of the 1-minute Part 2 preparation notepad, reflecting solid pre-speech outlining.'
          : 'Underutilization of the 1-minute Part 2 preparation timer; jotting down key vocabulary connectors beforehand prevents hesitation.'
      ],
      fluencyTips: [
        'Use signposting transitions when moving between ideas (e.g. "From an economic perspective...", "Another dimension to consider is...").',
        'Avoid prolonged mid-clause silence; bridge brief pauses with natural discourse fillers like "Well, that is an intriguing angle..."'
      ],
      evaluatorMode: 'heuristic'
    };
  }

  /**
   * Synthesizes all module data into an actionable diagnostic prescription
   */
  generateDiagnosticSummary({ candidate, listening, reading, writing, speaking, overallBand, cefr }) {
    const criticalWeaknesses = [];
    const standoutStrengths = [];
    const highYieldPrescriptions = [];

    // Listening Diagnostics
    if (listening.bandScore >= 7.5) {
      standoutStrengths.push('Exceptional auditory decoding in academic lectures and multi-speaker discussions.');
    } else if (listening.bandScore < 6.0) {
      criticalWeaknesses.push('Difficulty tracking rapid spelling of names/numbers in Part 1 and identifying distractors in Part 3.');
      highYieldPrescriptions.push('Practice listening to British, Australian, and North American accented podcasts at 1.25x speed, transcribing proper nouns.');
    }

    // Reading Diagnostics (TFNG specific insight)
    if (reading.tfngConfusion && (reading.tfngConfusion.falseInsteadOfNotGiven > 0 || reading.tfngConfusion.notGivenInsteadOfFalse > 0)) {
      criticalWeaknesses.push(
        `True/False/Not Given Confusion: Marked ${reading.tfngConfusion.falseInsteadOfNotGiven} question(s) as FALSE when the text never stated the information (NOT GIVEN).`
      );
      highYieldPrescriptions.push(
        'Master the Golden Rule for TFNG: FALSE requires a direct factual contradiction in the passage. If the author simply made no statement on the matter, the answer MUST be NOT GIVEN.'
      );
    }

    if (reading.questionTypeStats && reading.questionTypeStats.matching_headings) {
      const mh = reading.questionTypeStats.matching_headings;
      if (mh.correct / mh.total < 0.6) {
        criticalWeaknesses.push(`Heading Matching Accuracy is low (${mh.correct}/${mh.total}).`);
        highYieldPrescriptions.push(
          'Read the first two and last sentences of each paragraph to capture the main macro-theme before inspecting the heading list to avoid falling for keyword distractors.'
        );
      }
    }

    // Writing Diagnostics
    if (writing.task1.wordCount < 150) {
      criticalWeaknesses.push(`Writing Task 1 is underlength (${writing.task1.wordCount}/150 words), directly capping the Task Achievement criterion.`);
      highYieldPrescriptions.push('Ensure Task 1 contains a clear two-sentence overview highlighting overall trends, peaks, and troughs without detailed figures, followed by comparative figures in body paragraphs.');
    }
    if (writing.task2.wordCount < 250) {
      criticalWeaknesses.push(`Writing Task 2 is underlength (${writing.task2.wordCount}/250 words), which limits Task Response depth.`);
      highYieldPrescriptions.push('Use the PEEL paragraph structure (Point, Explanation, Evidence/Example, Link) for each Task 2 body paragraph to guarantee at least 270 words.');
    }
    if (writing.task2.wordCount >= 250 && writing.bandScore >= 7.0) {
      standoutStrengths.push('Well-developed essay argumentation with appropriate paragraph cohesion and discourse markers.');
    }

    // 14-Day Study Plan
    const studyPlan = [
      { dayRange: 'Days 1 - 3', focus: 'TFNG & Question Strategy', action: 'Complete 5 reading passages focusing exclusively on distinguishing FALSE from NOT GIVEN statements. Review passage evidence sentences.' },
      { dayRange: 'Days 4 - 7', focus: 'Writing Task 1 & 2 Structure', action: 'Write 4 Task 1 reports strictly within 20 minutes ensuring a distinct Overview paragraph. Memorize 15 C1 academic collocations.' },
      { dayRange: 'Days 8 - 10', focus: 'Listening Distractor Identification', action: 'Analyze Part 2 maps and Part 3 student discussions. Mark where speakers self-correct or dispute statements.' },
      { dayRange: 'Days 11 - 12', focus: 'Speaking Part 2 Long Turn Fluency', action: 'Record 5 cue cards with exactly 1 minute preparation time. Speak continuously for 1 minute 50 seconds without stopping.' },
      { dayRange: 'Days 13 - 14', focus: 'Full CD-IELTS Mock Simulation', action: 'Take a complete 4-module mock exam under exact time constraints to calibrate endurance and time allocation.' }
    ];

    return {
      candidateName: candidate.name,
      targetBand: candidate.targetBand,
      achievedBand: overallBand,
      bandDifference: (overallBand - candidate.targetBand).toFixed(1),
      cefrLevel: cefr,
      standoutStrengths: standoutStrengths.length > 0 ? standoutStrengths : ['Demonstrated steady pacing and active attempt across all exam modules.'],
      criticalWeaknesses: criticalWeaknesses.length > 0 ? criticalWeaknesses : ['Fine-tuning precision on high-level C1/C2 collocations is required for an 8.0+ score.'],
      highYieldPrescriptions: highYieldPrescriptions.length > 0 ? highYieldPrescriptions : ['Continue practicing timed full-length tests to build cognitive stamina.'],
      studyPlan
    };
  }

  async evaluateWritingWithGroq(task1, task2, exam) {
    const prompt = `You are an official Cambridge/IDP IELTS Writing Examiner.
Evaluate candidate submissions for IELTS Academic Writing according to official Band Descriptors.
Task 1 Prompt: ${exam.tasks[0].prompt}
Task 1 Text: ${task1}
Task 2 Prompt: ${exam.tasks[1].prompt}
Task 2 Text: ${task2}

Return ONLY valid JSON matching schema:
{
  "bandScore": 7.0,
  "task1": { "bandScore": 7.0, "wordCount": 160, "criteria": { "taskAchievement": 7.0, "coherenceCohesion": 7.0, "lexicalResource": 7.0, "grammaticalRange": 7.0 } },
  "task2": { "bandScore": 7.0, "wordCount": 280, "criteria": { "taskResponse": 7.0, "coherenceCohesion": 7.0, "lexicalResource": 7.0, "grammaticalRange": 7.0 } },
  "subScores": { "taskAchievement": 7.0, "coherenceCohesion": 7.0, "lexicalResource": 7.0, "grammaticalRange": 7.0 },
  "suggestedUpgrades": [ { "current": "word", "recommended": ["word1", "word2"], "impact": "explanation" } ],
  "identifiedGrammarCheckpoints": [ "checkpoint 1" ],
  "evaluatorMode": "groq-llama-3.3-70b"
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.GROQ_CHAT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!res.ok) throw new Error(`Groq API error ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async evaluateWritingWithOpenRouter(task1, task2, exam) {
    const prompt = `Evaluate IELTS Academic Writing. Task 1: ${task1}. Task 2: ${task2}. Return valid JSON only.`;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });

    if (!res.ok) throw new Error(`OpenRouter API error ${res.status}`);
    const data = await res.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in OpenRouter response');
    const parsed = JSON.parse(jsonMatch[0]);
    parsed.evaluatorMode = 'openrouter-' + config.OPENROUTER_MODEL;
    return parsed;
  }
}

module.exports = new AIDiagnosticEngine();
