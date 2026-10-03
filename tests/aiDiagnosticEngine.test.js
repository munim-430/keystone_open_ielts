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

test('AI Diagnostic Engine - safeJsonParse robustness against LLM formatting', () => {
  // Pure JSON
  assert.deepStrictEqual(aiDiagnosticEngine.safeJsonParse('{"bandScore": 7.5}'), { bandScore: 7.5 });

  // Markdown codeblock
  const markdownBlock = '```json\n{"bandScore": 8.0, "feedback": "Excellent task achievement"}\n```';
  assert.strictEqual(aiDiagnosticEngine.safeJsonParse(markdownBlock).bandScore, 8.0);

  // DeepSeek reasoning thoughts <think>...</think>
  const thoughtAndJson = '<think>\nThe candidate demonstrates extensive lexical flexibility...\n</think>\n```json\n{"bandScore": 7.0, "subScores": {"TR": 7.0}}\n```';
  const parsed = aiDiagnosticEngine.safeJsonParse(thoughtAndJson);
  assert.ok(parsed);
  assert.strictEqual(parsed.bandScore, 7.0);

  // Invalid JSON returns null without throwing
  assert.strictEqual(aiDiagnosticEngine.safeJsonParse('Not a valid json response'), null);
});

test('AI Diagnostic Engine - General Training Writing Task 1 (Letter) evaluation', () => {
  const gtExam = getExamById('general_test_1');
  const letterText = `Dear Mr. Robinson,

I am writing this letter to formally request information regarding part-time and full-time employment opportunities at the Royal City Public Library. Having recently completed my undergraduate degree in English Literature and Information Science, I am eager to contribute my skills to your institution.

My academic training has provided me with strong cataloging, archival management, and customer service skills. Additionally, during my final year of study, I served as a volunteer student library assistant, where I managed circulation desks, assisted patrons with bibliographic research, and organized community book clubs.

I am particularly interested in the Library Assistant position advertised on your municipal noticeboard. I am available to work up to thirty hours per week, including weekday evenings and weekends. 

Could you please provide information concerning the formal application process, necessary background check documentation, and the projected timeline for candidate interviews?

Thank you very much for your time and consideration. I look forward to hearing from you soon.

Yours sincerely,
Sarah Jenkins`;

  const essayText = `In recent decades, the relentless expansion of urbanization and vehicular transportation has precipitated severe air quality degradation across metropolitan areas worldwide. Consequently, some argue that municipal authorities should prohibit private motor vehicles in urban city centers, whereas others believe such draconian restrictions would harm commerce and personal mobility.

On the one hand, banning cars from central business districts yields undeniable environmental and public health dividends. Vehicular exhaust emissions, particularly nitrogen oxides and fine particulate matter, represent the primary driver of respiratory illnesses among city dwellers. By eliminating combustion engines from urban cores, atmospheric pollution declines dramatically. Furthermore, pedestrianizing city centers creates vibrant, quiet, and safe public spaces that foster physical exercise, reduce traffic accidents, and encourage foot traffic for local businesses. In many European capitals where pedestrian zones were introduced, retail revenues and cultural activities flourished significantly.

On the other hand, a blanket prohibition on private automobiles without sufficient alternative infrastructure can disrupt business operations and disproportionately affect commuters from rural or suburban areas poorly serviced by transit networks. Delivery logistics, emergency services, and individuals with disabilities rely heavily on direct vehicular access. Moreover, if public transit networks lack sufficient frequency, reliability, or affordability, commuters may encounter immense daily frustration and extended journey times. Therefore, urban planners must implement comprehensive mass transit enhancements, including park-and-ride facilities and subsidized rail tickets, before restricting private vehicle access.

In conclusion, although completely banning private vehicles may initially present transit challenges, investing in reliable electric mass transportation combined with strategically phased car-free central zones represents the most sustainable pathway for modern cities.`;

  const result = aiDiagnosticEngine.evaluateWritingHeuristically(letterText, essayText, gtExam.writing);
  assert.ok(result.bandScore >= 6.5);
  assert.ok(result.task1.meetsMinimum);
  assert.ok(result.task2.meetsMinimum);
  assert.strictEqual(result.task1.type, 'letter');
});

test('AI Diagnostic Engine - Speaking transcripts evaluation', () => {
  const exam = getExamById('academic_test_1');
  const speakingAnswersWithTranscripts = {
    notes: 'Leadership project notes',
    transcripts: {
      p1_q1: 'I currently live in a quiet residential neighborhood situated on the outskirts of Manchester.',
      p1_q2: 'What I appreciate most about my hometown is the extensive network of public parks and green spaces.',
      p2_cuecard: 'I would like to talk about a challenging engineering project I spearheaded during my final semester at university. We were tasked with designing an autonomous navigation system for an agricultural drone. Approximately forty-eight hours before our final demonstration, one of our key optical sensors malfunctioned. Rather than panicking, I immediately gathered the team and reassigned responsibilities to recalibrate the algorithmic filtering parameters. Through meticulous collaboration, we successfully demonstrated the prototype to the faculty board. This experience taught me invaluable lessons in crisis management and resilience under pressure.',
      p3_q1: 'In my view, effective leadership fundamentally requires emotional empathy and transparent communication rather than authoritarian command.'
    },
    recordings: [
      { part: 'p1_q1', filename: 'p1_q1.webm' },
      { part: 'p1_q2', filename: 'p1_q2.webm' },
      { part: 'p2_cuecard', filename: 'p2_cuecard.webm' },
      { part: 'p3_q1', filename: 'p3_q1.webm' }
    ]
  };

  const result = aiDiagnosticEngine.evaluateSpeakingHeuristically(speakingAnswersWithTranscripts, exam.speaking);
  assert.ok(result.bandScore >= 7.0, `Expected band >= 7.0 for rich transcript, got ${result.bandScore}`);
  assert.ok(result.subScores.lexicalResource >= 7.0);
  assert.ok(result.subScores.grammaticalRange >= 7.0);
});
