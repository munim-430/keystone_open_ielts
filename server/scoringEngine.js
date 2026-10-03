/**
 * IELTS CD Mock Test Platform - Standard Scoring & Band Calculation Engine
 * Implements official Cambridge / IDP band conversion tables and rounding rules
 */

class ScoringEngine {
  /**
   * Normalizes candidate text input for fuzzy string comparison
   */
  normalizeText(input) {
    if (input === null || input === undefined) return '';
    return String(input)
      .trim()
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ') // replace punctuation with spaces
      .replace(/\s+/g, ' ')                      // collapse multiple spaces
      .trim();
  }

  /**
   * Evaluates candidate's answer against acceptable answers
   */
  isAnswerCorrect(candidateAnswer, acceptedAnswers, questionType) {
    if (candidateAnswer === null || candidateAnswer === undefined || candidateAnswer === '') {
      return false;
    }

    const normCandidate = this.normalizeText(candidateAnswer);

    // Specific handling for True/False/Not Given and Yes/No/Not Given
    if (questionType === 'true_false_not_given' || questionType === 'tfng') {
      const canonCand = normCandidate.replace(/\s+/g, '');
      const canonAns = this.normalizeText(acceptedAnswers).replace(/\s+/g, '');
      
      const tfMap = {
        't': 'true', 'true': 'true',
        'f': 'false', 'false': 'false',
        'ng': 'notgiven', 'notgiven': 'notgiven', 'not_given': 'notgiven'
      };

      return (tfMap[canonCand] || canonCand) === (tfMap[canonAns] || canonAns);
    }

    // Specific handling for Matching Headings (Roman Numerals)
    if (questionType === 'matching_headings') {
      return normCandidate === this.normalizeText(acceptedAnswers);
    }

    // Specific handling for Multiple Choice (A, B, C, D)
    if (questionType === 'multiple_choice') {
      // Could be 'A' or 'A) Some text'
      const candFirstLetter = normCandidate.charAt(0);
      const targetFirstLetter = this.normalizeText(acceptedAnswers).charAt(0);
      if (candFirstLetter && candFirstLetter === targetFirstLetter) return true;
      return normCandidate === this.normalizeText(acceptedAnswers);
    }

    // Standard text answer comparison against array or single string
    const targetList = Array.isArray(acceptedAnswers) ? acceptedAnswers : [acceptedAnswers];

    for (const target of targetList) {
      const normTarget = this.normalizeText(target);
      if (normCandidate === normTarget) return true;

      // Allow candidate to omit leading articles "a", "an", "the"
      const stripArticle = (s) => s.replace(/^(a|an|the)\s+/, '');
      if (stripArticle(normCandidate) === stripArticle(normTarget)) return true;

      // Allow currency symbol equivalence (£180 vs 180)
      const candNoCurrency = normCandidate.replace(/[£$€]/g, '').trim();
      const targetNoCurrency = normTarget.replace(/[£$€]/g, '').trim();
      if (candNoCurrency === targetNoCurrency) return true;
    }

    return false;
  }

  /**
   * Converts Listening raw score (0-40) to official IELTS Band (1.0-9.0)
   */
  rawToListeningBand(raw) {
    const r = Math.max(0, Math.min(40, Math.round(raw)));
    if (r >= 39) return 9.0;
    if (r >= 37) return 8.5;
    if (r >= 35) return 8.0;
    if (r >= 32) return 7.5;
    if (r >= 30) return 7.0;
    if (r >= 26) return 6.5;
    if (r >= 23) return 6.0;
    if (r >= 18) return 5.5;
    if (r >= 16) return 5.0;
    if (r >= 13) return 4.5;
    if (r >= 10) return 4.0;
    if (r >= 8)  return 3.5;
    if (r >= 6)  return 3.0;
    if (r >= 4)  return 2.5;
    if (r >= 2)  return 2.0;
    if (r >= 1)  return 1.5;
    return 1.0;
  }

  /**
   * Converts Reading raw score (0-40) to official IELTS Band
   */
  rawToReadingBand(raw, examType = 'Academic') {
    const r = Math.max(0, Math.min(40, Math.round(raw)));
    
    if (examType === 'General') {
      if (r >= 40) return 9.0;
      if (r >= 39) return 8.5;
      if (r >= 37) return 8.0;
      if (r >= 36) return 7.5;
      if (r >= 34) return 7.0;
      if (r >= 32) return 6.5;
      if (r >= 30) return 6.0;
      if (r >= 27) return 5.5;
      if (r >= 23) return 5.0;
      if (r >= 19) return 4.5;
      if (r >= 15) return 4.0;
      if (r >= 12) return 3.5;
      if (r >= 9)  return 3.0;
      if (r >= 6)  return 2.5;
      if (r >= 3)  return 2.0;
      return 1.0;
    }

    // Default Academic Reading
    if (r >= 39) return 9.0;
    if (r >= 37) return 8.5;
    if (r >= 35) return 8.0;
    if (r >= 33) return 7.5;
    if (r >= 30) return 7.0;
    if (r >= 27) return 6.5;
    if (r >= 23) return 6.0;
    if (r >= 19) return 5.5;
    if (r >= 15) return 5.0;
    if (r >= 13) return 4.5;
    if (r >= 10) return 4.0;
    if (r >= 8)  return 3.5;
    if (r >= 6)  return 3.0;
    if (r >= 4)  return 2.5;
    if (r >= 2)  return 2.0;
    if (r >= 1)  return 1.5;
    return 1.0;
  }

  /**
   * Applies official IELTS overall band rounding algorithm
   * Example: 6.25 -> 6.5, 6.75 -> 7.0, 6.125 -> 6.0, 6.625 -> 6.5
   */
  calculateOverallBand(scores) {
    const validScores = [scores.listening, scores.reading, scores.writing, scores.speaking].filter(s => typeof s === 'number' && !isNaN(s));
    if (validScores.length === 0) return 0;

    const avg = validScores.reduce((sum, val) => sum + val, 0) / validScores.length;
    const decimal = avg - Math.floor(avg);

    let rounded;
    if (decimal < 0.25) {
      rounded = Math.floor(avg);
    } else if (decimal < 0.75) {
      rounded = Math.floor(avg) + 0.5;
    } else {
      rounded = Math.ceil(avg);
    }

    return Math.min(9.0, Math.max(1.0, rounded));
  }

  /**
   * Evaluates Listening module answers against exam bank
   */
  evaluateListening(candidateAnswers = {}, listeningExam) {
    let rawScore = 0;
    const details = [];
    const questionTypeStats = {};

    for (const part of listeningExam.parts) {
      for (const q of part.questions) {
        const candidateAns = candidateAnswers[q.id];
        const isCorrect = this.isAnswerCorrect(candidateAns, q.answer, q.questionType);
        
        if (isCorrect) rawScore++;

        const qType = q.questionType || 'general';
        if (!questionTypeStats[qType]) {
          questionTypeStats[qType] = { total: 0, correct: 0 };
        }
        questionTypeStats[qType].total++;
        if (isCorrect) questionTypeStats[qType].correct++;

        details.push({
          questionId: q.id,
          partNumber: part.partNumber,
          questionType: qType,
          prompt: q.prompt,
          candidateAnswer: candidateAns || '(No Answer)',
          acceptedAnswers: q.answer,
          isCorrect
        });
      }
    }

    const bandScore = this.rawToListeningBand(rawScore);

    return {
      module: 'listening',
      totalQuestions: details.length,
      rawScore,
      bandScore,
      accuracyPercentage: Math.round((rawScore / (details.length || 1)) * 100),
      questionTypeStats,
      details
    };
  }

  /**
   * Evaluates Reading module answers against exam bank
   */
  evaluateReading(candidateAnswers = {}, readingExam, examType = 'Academic') {
    let rawScore = 0;
    const details = [];
    const questionTypeStats = {};
    let tfngConfusion = { falseInsteadOfNotGiven: 0, notGivenInsteadOfFalse: 0, trueInsteadOfFalse: 0 };

    for (const passage of readingExam.passages) {
      for (const q of passage.questions) {
        const candidateAns = candidateAnswers[q.id];
        const isCorrect = this.isAnswerCorrect(candidateAns, q.answer, q.questionType);

        if (isCorrect) rawScore++;

        const qType = q.questionType || 'general';
        if (!questionTypeStats[qType]) {
          questionTypeStats[qType] = { total: 0, correct: 0 };
        }
        questionTypeStats[qType].total++;
        if (isCorrect) questionTypeStats[qType].correct++;

        // Track specific True/False/Not Given confusion patterns
        if (qType === 'true_false_not_given' && !isCorrect && candidateAns) {
          const candNorm = String(candidateAns).trim().toUpperCase();
          const ansNorm = String(q.answer).trim().toUpperCase();
          if (candNorm === 'FALSE' && ansNorm === 'NOT GIVEN') tfngConfusion.falseInsteadOfNotGiven++;
          if (candNorm === 'NOT GIVEN' && ansNorm === 'FALSE') tfngConfusion.notGivenInsteadOfFalse++;
          if (candNorm === 'TRUE' && ansNorm === 'FALSE') tfngConfusion.trueInsteadOfFalse++;
        }

        details.push({
          questionId: q.id,
          passageNumber: passage.passageNumber,
          questionType: qType,
          prompt: q.prompt,
          candidateAnswer: candidateAns || '(No Answer)',
          acceptedAnswer: q.answer,
          isCorrect,
          explanation: q.explanation || null
        });
      }
    }

    const bandScore = this.rawToReadingBand(rawScore, examType);

    return {
      module: 'reading',
      totalQuestions: details.length,
      rawScore,
      bandScore,
      accuracyPercentage: Math.round((rawScore / (details.length || 1)) * 100),
      questionTypeStats,
      tfngConfusion,
      details
    };
  }
}

module.exports = new ScoringEngine();
