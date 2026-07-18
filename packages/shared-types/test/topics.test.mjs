// Unit tests for getDailyTopics — determinism, slot coverage, and weekly rotation.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDailyTopics, DAY_CONDITION, SLOT_PUBLISH_TIMES } from '../dist/index.js';

test('getDailyTopics returns exactly 5 topics', () => {
  const topics = getDailyTopics(new Date('2025-01-06')); // Monday
  assert.equal(topics.length, 5);
});

test('each topic has a unique slot 1-5', () => {
  const topics = getDailyTopics(new Date('2025-01-06'));
  const slots = topics.map((t) => t.slot);
  assert.deepEqual(slots.sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test('Monday topics use artritis_reumatoide condition', () => {
  const topics = getDailyTopics(new Date('2025-01-06')); // Monday
  assert.ok(topics.every((t) => t.condition === 'artritis_reumatoide'));
});

test('Tuesday topics use lupus condition', () => {
  const topics = getDailyTopics(new Date('2025-01-07')); // Tuesday
  assert.ok(topics.every((t) => t.condition === 'lupus'));
});

test('Wednesday topics use osteoartritis condition', () => {
  const topics = getDailyTopics(new Date('2025-01-08')); // Wednesday
  assert.ok(topics.every((t) => t.condition === 'osteoartritis'));
});

test('Thursday topics use espondilitis condition', () => {
  const topics = getDailyTopics(new Date('2025-01-09')); // Thursday
  assert.ok(topics.every((t) => t.condition === 'espondilitis'));
});

test('Friday topics use bienestar condition', () => {
  const topics = getDailyTopics(new Date('2025-01-10')); // Friday
  assert.ok(topics.every((t) => t.condition === 'bienestar'));
});

test('getDailyTopics is deterministic for the same date', () => {
  const d = new Date('2025-03-17');
  const a = getDailyTopics(d);
  const b = getDailyTopics(d);
  assert.deepEqual(
    a.map((t) => t.topic),
    b.map((t) => t.topic),
  );
});

test('consecutive weeks produce different topics for the same day of week', () => {
  // Two Mondays, 7 days apart, different ISO weeks
  const week1 = getDailyTopics(new Date('2025-01-06')); // week 2
  const week2 = getDailyTopics(new Date('2025-01-13')); // week 3
  const topics1 = week1.map((t) => t.topic);
  const topics2 = week2.map((t) => t.topic);
  assert.notDeepEqual(topics1, topics2, 'Topic set must rotate week-over-week');
});

test('all topics have non-empty topic strings and valid content types', () => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2025-01-06');
    d.setDate(d.getDate() + i);
    return d;
  });
  const validTypes = ['post', 'carousel', 'reel', 'ad_creative'];
  for (const day of days) {
    const topics = getDailyTopics(day);
    for (const t of topics) {
      assert.ok(t.topic.length > 10, `Topic too short: "${t.topic}"`);
      assert.ok(validTypes.includes(t.type), `Invalid type: ${t.type}`);
    }
  }
});

test('SLOT_PUBLISH_TIMES has entries for slots 1-5 with labels', () => {
  for (const slot of [1, 2, 3, 4, 5]) {
    const entry = SLOT_PUBLISH_TIMES[slot];
    assert.ok(entry, `Missing slot ${slot}`);
    assert.ok(entry.label.length > 0, `Empty label for slot ${slot}`);
    assert.ok(typeof entry.offsetHours === 'number', `Missing offsetHours for slot ${slot}`);
  }
});

test('DAY_CONDITION covers all 7 days of week', () => {
  for (let d = 0; d <= 6; d++) {
    assert.ok(DAY_CONDITION[d], `Missing DAY_CONDITION for day ${d}`);
  }
});

console.log('topics tests passed');
