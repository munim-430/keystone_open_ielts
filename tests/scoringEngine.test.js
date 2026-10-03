const test = require('node:test');
const assert = require('node:assert');
const scoringEngine = require('../server/scoringEngine');
const { getExamById } = require('../server/examBank');

test('ScoringEngine string normalization and answer evaluation', () => {
  assert.ok(scoringEngine.isAnswerCorrect('Henderson', ['henderson'], 'form_completion'));
  assert.ok(scoringEngine.isAnswerCorrect('  84920  ', ['84920'], 'form_completion'));
  assert.ok(scoringEngine.isAnswerCorrect('self catered', ['self-catered', 'self catered'], 'form_completion'));
  assert.ok(scoringEngine.isAnswerCorrect('the troposphere', ['troposphere'], 'summary_completion'));
  assert.ok(scoringEngine.isAnswerCorrect('£180', ['180', '180 pounds'], 'form_completion'));

  // True/False/Not Given
  assert.ok(scoringEngine.isAnswerCorrect('TRUE', 'TRUE', 'tfng'));
  assert.ok(scoringEngine.isAnswerCorrect('t', 'true', 'true_false_not_given'));
  assert.ok(scoringEngine.isAnswerCorrect('NOT GIVEN', 'NOT GIVEN', 'tfng'));
  assert.ok(scoringEngine.isAnswerCorrect('ng', 'NOT GIVEN', 'true_false_not_given'));
  assert.strictEqual(scoringEngine.isAnswerCorrect('FALSE', 'NOT GIVEN', 'tfng'), false);

  // Multiple choice
  assert.ok(scoringEngine.isAnswerCorrect('B', 'B', 'multiple_choice'));
  assert.ok(scoringEngine.isAnswerCorrect('b) An agricultural research station', 'B', 'multiple_choice'));
});

test('Official IELTS Band conversion tables', () => {
  // Listening
  assert.strictEqual(scoringEngine.rawToListeningBand(40), 9.0);
  assert.strictEqual(scoringEngine.rawToListeningBand(39), 9.0);
  assert.strictEqual(scoringEngine.rawToListeningBand(35), 8.0);
  assert.strictEqual(scoringEngine.rawToListeningBand(30), 7.0);
  assert.strictEqual(scoringEngine.rawToListeningBand(23), 6.0);
  assert.strictEqual(scoringEngine.rawToListeningBand(16), 5.0);

  // Reading Academic
  assert.strictEqual(scoringEngine.rawToReadingBand(39, 'Academic'), 9.0);
  assert.strictEqual(scoringEngine.rawToReadingBand(30, 'Academic'), 7.0);
  assert.strictEqual(scoringEngine.rawToReadingBand(23, 'Academic'), 6.0);
  assert.strictEqual(scoringEngine.rawToReadingBand(15, 'Academic'), 5.0);

  // Reading General Training
  assert.strictEqual(scoringEngine.rawToReadingBand(40, 'General'), 9.0);
  assert.strictEqual(scoringEngine.rawToReadingBand(34, 'General'), 7.0);
  assert.strictEqual(scoringEngine.rawToReadingBand(30, 'General'), 6.0);
});

test('Official IELTS Overall Band rounding rules', () => {
  // .25 rounds UP to .5
  assert.strictEqual(scoringEngine.calculateOverallBand({ listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.0 }), 6.5); // avg = 6.25 -> 6.5
  // .75 rounds UP to whole band
  assert.strictEqual(scoringEngine.calculateOverallBand({ listening: 7.0, reading: 7.0, writing: 6.5, speaking: 6.5 }), 7.0); // avg = 6.75 -> 7.0
  // .125 rounds DOWN to whole band
  assert.strictEqual(scoringEngine.calculateOverallBand({ listening: 6.0, reading: 6.5, writing: 6.0, speaking: 6.0 }), 6.0); // avg = 6.125 -> 6.0
  // .625 rounds to .5
  assert.strictEqual(scoringEngine.calculateOverallBand({ listening: 7.0, reading: 6.5, writing: 6.5, speaking: 6.5 }), 6.5); // avg = 6.625 -> 6.5
});

test('Full evaluation of Listening and Reading test modules', () => {
  const exam = getExamById('academic_test_1');
  assert.ok(exam);
  assert.strictEqual(exam.listening.parts.length, 4);
  assert.strictEqual(exam.reading.passages.length, 3);

  // Simulate perfect Listening candidate
  const perfectListeningAnswers = {
    1: 'henderson', 2: '84920', 3: 'data', 4: 'self-catered', 5: '180',
    6: 'asthma', 7: 'upper', 8: 'september', 9: 'north', 10: '250',
    11: 'B', 12: 'A', 13: 'B', 14: 'C', 15: 'B',
    16: 'half-hour', 17: 'conservatory', 18: 'great', 19: 'citrus', 20: '8:30',
    21: 'B', 22: 'C', 23: 'A', 24: 'B', 25: 'A',
    26: 'canopy', 27: 'composite', 28: 'infrared', 29: 'two', 30: 'five',
    31: 'tubercles', 32: 'vortices', 33: '32', 34: 'turbine', 35: 'denticles',
    36: 'riblets', 37: 'eddies', 38: '60', 39: 'cavitation', 40: '86'
  };

  const lResult = scoringEngine.evaluateListening(perfectListeningAnswers, exam.listening);
  assert.strictEqual(lResult.rawScore, 40);
  assert.strictEqual(lResult.bandScore, 9.0);
  assert.strictEqual(lResult.accuracyPercentage, 100);

  // Reading evaluation with partial answers
  const partialReading = {
    1: 'FALSE', 2: 'TRUE', 3: 'FALSE', 4: 'NOT GIVEN', 5: 'TRUE',
    6: 'TRUE', 7: 'FALSE', 8: 'troposphere', 9: 'pressurized', 10: 'metal fatigue',
    11: 'farnborough', 12: 'rounded', 13: 'straps'
  };
  const rResult = scoringEngine.evaluateReading(partialReading, exam.reading, 'Academic');
  assert.strictEqual(rResult.rawScore, 13);
  assert.strictEqual(rResult.bandScore, 4.5);
  assert.ok(rResult.details.length === 40);
});
