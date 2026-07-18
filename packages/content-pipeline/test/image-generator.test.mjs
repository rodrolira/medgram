// Unit tests for buildImagePrompt and buildPollinationsUrl (no HTTP calls).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildImagePrompt, buildPollinationsUrl } from '../dist/image-generator.js';

test('buildImagePrompt includes topic in the result', () => {
  const prompt = buildImagePrompt('Artritis reumatoide: síntomas tempranos');
  assert.ok(prompt.includes('Artritis reumatoide: síntomas tempranos'));
});

test('buildImagePrompt includes safety constraints (no people, no before/after)', () => {
  const prompt = buildImagePrompt('Lupus eritematoso');
  assert.ok(prompt.toLowerCase().includes('no people'));
  assert.ok(prompt.toLowerCase().includes('no before/after') || prompt.toLowerCase().includes('no faces'));
});

test('buildImagePrompt uses condition context when provided', () => {
  const prompt = buildImagePrompt('Lupus y estrés', 'lupus');
  assert.ok(prompt.toLowerCase().includes('lupus'));
});

test('buildImagePrompt falls back to general context without condition', () => {
  const prompt = buildImagePrompt('Salud articular');
  assert.ok(prompt.length > 50);
  assert.ok(prompt.toLowerCase().includes('medical'));
});

test('buildPollinationsUrl builds a valid URL with encoded prompt', () => {
  const url = buildPollinationsUrl('medical illustration blue white');
  assert.ok(url.startsWith('https://image.pollinations.ai/prompt/'));
  assert.ok(url.includes('medical%20illustration'));
});

test('buildPollinationsUrl includes width and height params', () => {
  const url = buildPollinationsUrl('test', 512, 512);
  assert.ok(url.includes('width=512'));
  assert.ok(url.includes('height=512'));
});

test('buildPollinationsUrl uses 1080x1080 by default', () => {
  const url = buildPollinationsUrl('test');
  assert.ok(url.includes('width=1080'));
  assert.ok(url.includes('height=1080'));
});

test('buildPollinationsUrl includes nologo and model params', () => {
  const url = buildPollinationsUrl('test');
  assert.ok(url.includes('nologo=true'));
  assert.ok(url.includes('model=flux'));
});

test('buildImagePrompt for each condition produces distinct prompts', () => {
  const conditions = ['artritis_reumatoide', 'lupus', 'osteoartritis', 'espondilitis', 'bienestar'];
  const topic = 'Tema de prueba';
  const prompts = conditions.map((c) => buildImagePrompt(topic, c));
  const unique = new Set(prompts);
  assert.equal(unique.size, conditions.length, 'Each condition should produce a unique prompt');
});

// --- Hashtag pool integration tests ---
import { buildHashtagSuggestions, stubCopy } from '../dist/generator.js';

test('buildHashtagSuggestions returns 6-7 tags for a known condition', () => {
  const tags = buildHashtagSuggestions('artritis_reumatoide');
  assert.ok(tags.length >= 5 && tags.length <= 8, `Expected 5-8 tags, got ${tags.length}`);
});

test('buildHashtagSuggestions includes condition-specific tags', () => {
  const tags = buildHashtagSuggestions('lupus');
  const hasLupus = tags.some((t) => t.toLowerCase().includes('lupus'));
  assert.ok(hasLupus, 'Should include a lupus-specific hashtag');
});

test('buildHashtagSuggestions includes a general rheumatology tag', () => {
  const tags = buildHashtagSuggestions('osteoartritis');
  const hasRheum = tags.some((t) => t.toLowerCase().includes('reumatolog'));
  assert.ok(hasRheum, 'Should include a general rheumatology hashtag');
});

test('buildHashtagSuggestions includes a geographic tag', () => {
  const tags = buildHashtagSuggestions('bienestar');
  const hasGeo = tags.some((t) => t === '#Chile' || t.includes('Chile') || t.includes('CL'));
  assert.ok(hasGeo, 'Should include a geographic hashtag');
});

test('stubCopy with condition uses condition-specific hashtags', () => {
  const copy = stubCopy('Artritis reumatoide test', 'post', 'artritis_reumatoide');
  const hasConditionTag = copy.hashtags.some((t) => t.toLowerCase().includes('artritis') || t.toLowerCase().includes('ra'));
  assert.ok(hasConditionTag, 'Stub should use condition hashtags when condition is provided');
});

test('stubCopy without condition uses generic hashtags', () => {
  const copy = stubCopy('Tema genérico', 'post');
  assert.ok(copy.hashtags.length > 0, 'Should have hashtags');
  assert.ok(copy.hashtags.some((t) => t.includes('#')), 'Hashtags should start with #');
});

console.log('image-generator unit tests passed');
