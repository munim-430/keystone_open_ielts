const test = require('node:test');
const assert = require('node:assert');
const aiDiagnosticEngine = require('../server/aiDiagnosticEngine');
const { getExamById } = require('../server/examBank');

test('AI Diagnostic Engine - Heuristic Writing Evaluation', () => {
  const exam = getExamById('academic_test_1');
  const task1Text = `The provided bar chart illustrates the proportion of total electricity generated from renewable energy sources across four European nations, namely Denmark, Germany, Spain, and the United Kingdom, between the years 2010 and 2024.

Overall, it is readily noticeable that all four surveyed nations experienced substantial upward growth in renewable electricity generation over the fourteen-year timeline. Denmark consistently registered the highest overall share and demonstrated the most rapid absolute expansion, whereas the United Kingdom underwent the most dramatic proportional rise, climbing from the lowest starting point in 2010 to approximately half of its total grid supply by 2024.

In 2010, Denmark led the group with 32% of its electricity derived from sustainable sources, followed closely by Spain at 35% and Germany at 17%, while the United Kingdom trailed significantly at merely 7%. By 2015, Denmark surged to 56%, whereas Germany almost doubled its generation to 30%. Spain experienced modest growth to 37%, and the United Kingdom increased more than threefold to 24%.

Between 2020 and 2024, renewable adoption accelerated further. By the end of the period, Denmark achieved an extraordinary 82% renewable penetration. Germany reached 54%, marginally surpassing Spain at 51%. The United Kingdom completed its rapid transformation, finishing at 49%.`;

  const task2Text = `With the rapid advancement and pervasive integration of artificial intelligence in higher education, passionate debate has emerged regarding whether algorithmic instructional systems will eventually render human educators obsolete, or whether the emotional empathy, bespoke mentorship, and moral guidance provided by human teachers remain fundamentally irreplaceable.

On the one hand, staunch proponents of automated learning argue that artificial intelligence algorithms can deliver bespoke, highly personalized instruction at an unprecedented scale. Advanced machine learning models can continuously monitor individual student trajectories with mathematical precision, immediately detecting specific conceptual bottlenecks and providing tailored remedial exercises. Furthermore, intelligent automated platforms are accessible round the clock without geographical constraints, thereby democratizing elite educational resources for disadvantaged students across developing regions. In subjects requiring empirical drill, such as mathematics and syntax, software can evaluate responses instantaneously and objectively.

On the other hand, traditionalists convincingly maintain that genuine pedagogy extends far beyond rote knowledge transfer and automated feedback. Cultivating intellectual curiosity, critical thinking, and ethical responsibility requires profound human connection. A compassionate teacher possesses the emotional intelligence to perceive unspoken distress, anxiety, or lack of confidence in a struggling student—subtle psychological cues that synthetic algorithms cannot register. During moments of academic crisis, a dedicated human mentor acts as a powerful catalyst for resilience and personal maturity. Moreover, teachers model collaborative civic virtues and civil discourse, which are crucial for holistic social development.

In conclusion, although artificial intelligence will undoubtedly automate administrative grading and routine instructional drills, human educators are fundamentally irreplaceable for instilling moral integrity, empathy, and creative imagination.`;

  const result = aiDiagnosticEngine.evaluateWritingHeuristically(task1Text, task2Text, exam.writing);
  
  assert.ok(result.bandScore >= 6.5, `Expected band score >= 6.5, got ${result.bandScore}`);
  assert.ok(result.task1.meetsMinimum, 'Task 1 should meet 150 words');
  assert.ok(result.task2.meetsMinimum, 'Task 2 should meet 250 words');
  assert.ok(result.subScores.taskAchievement >= 6.5);
  assert.ok(result.subScores.coherenceCohesion >= 6.5);
  assert.ok(result.subScores.lexicalResource >= 6.5);
  assert.strictEqual(result.evaluatorMode, 'heuristic');
});

test('AI Diagnostic Engine - Heuristic Speaking Evaluation', () => {
  const exam = getExamById('academic_test_1');
  const speakingAnswers = {
    notes: 'Challenge: leading university robotics project. Obstacle: sensor failure 48 hrs before showcase. Resolution: recalibrated algorithmic filters. Learned: resilience and contingency planning under stress.',
    recordings: [
      { part: 's_p1_q1', filename: 'rec1.webm' },
      { part: 's_p1_q2', filename: 'rec2.webm' },
      { part: 's_p1_q3', filename: 'rec3.webm' },
      { part: 's_p1_q4', filename: 'rec4.webm' },
      { part: 's_p2_cuecard', filename: 'rec5.webm' },
      { part: 's_p3_q1', filename: 'rec6.webm' }
    ]
  };

  const result = aiDiagnosticEngine.evaluateSpeakingHeuristically(speakingAnswers, exam.speaking);
  assert.ok(result.bandScore >= 6.5);
  assert.strictEqual(result.recordingsCaptured, 6);
  assert.ok(result.subScores.fluencyCoherence >= 6.5);
  assert.ok(result.diagnosticPoints.length > 0);
});

test('AI Diagnostic Engine - CEFR Mapping and Diagnostic Summary Generation', () => {
  assert.strictEqual(aiDiagnosticEngine.bandToCEFR(9.0), 'C2 - Mastery / Proficient');
  assert.strictEqual(aiDiagnosticEngine.bandToCEFR(7.5), 'C1 - Effective Operational Proficiency');
  assert.strictEqual(aiDiagnosticEngine.bandToCEFR(6.0), 'B2 - Independent Vantage');
  assert.strictEqual(aiDiagnosticEngine.bandToCEFR(4.5), 'B1 - Independent Threshold');

  const summary = aiDiagnosticEngine.generateDiagnosticSummary({
    candidate: { name: 'Sarah Connor', targetBand: 7.5 },
    listening: { bandScore: 7.0, rawScore: 31, accuracyPercentage: 78 },
    reading: {
      bandScore: 6.5,
      rawScore: 28,
      accuracyPercentage: 70,
      tfngConfusion: { falseInsteadOfNotGiven: 3, notGivenInsteadOfFalse: 1 },
      questionTypeStats: { matching_headings: { total: 5, correct: 2 } }
    },
    writing: {
      bandScore: 6.5,
      task1: { wordCount: 160 },
      task2: { wordCount: 260 }
    },
    speaking: {
      bandScore: 7.0
    },
    overallBand: 7.0,
    cefr: 'C1 - Effective Operational Proficiency'
  });

  assert.strictEqual(summary.achievedBand, 7.0);
  assert.strictEqual(summary.bandDifference, '-0.5');
  assert.ok(summary.criticalWeaknesses.some(w => w.includes('True/False/Not Given Confusion')));
  assert.ok(summary.highYieldPrescriptions.some(p => p.includes('Golden Rule for TFNG')));
  assert.strictEqual(summary.studyPlan.length, 5);
});
