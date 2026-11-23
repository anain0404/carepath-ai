import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBrief, retrieve, nextQuestion, example } from '../src/logic.js';

const chat = (...turns) => [
  { role: 'assistant', text: 'What would you like to discuss?' },
  ...turns.map((text, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', text })),
];

test('brief contains main concern and questions', () => {
  const brief = prepareBrief(example);
  assert.match(brief.main, /tired/);
  assert.ok(brief.questions.length >= 4);
  assert.ok(brief.sources.every(source => source.url.startsWith('https://medlineplus.gov/')));
});

test('retrieval prefers lab information for blood testing', () => {
  const results = retrieve('I want to discuss blood test results');
  assert.ok(results.some(result => result.id === 'tests'));
});

test('asks about onset if user did not mention timing', () => {
  assert.match(nextQuestion(chat('I have headaches')), /when did you first notice/i);
});

test('responds to a specific topic when onset is already given', () => {
  assert.match(nextQuestion(chat('I have headaches for two weeks')), /headaches/i);
  assert.match(nextQuestion(chat('I have trouble sleeping since last month')), /sleep/i);
  assert.match(nextQuestion(chat('I got blood test results yesterday')), /test or report/i);
});

test('does not repeat questions already asked', () => {
  const m = chat('I have headaches for two weeks', 'You mentioned headaches. How often are they happening, and how are they affecting your usual activities?', 'They happen every day.');
  assert.doesNotMatch(nextQuestion(m), /You mentioned headaches/);
});

test('gives crisis referral rather than normal intake for suicide language', () => {
  assert.match(nextQuestion(chat('I want to end my life')), /988/);
});
