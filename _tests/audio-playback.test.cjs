const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../_includes/scripts/scripts-common.js'), 'utf8');
const audioCode = source.slice(source.indexOf('// All controls follow the audio element'),
  source.indexOf('// audioStoppedAction'));

function element(id, className = '') {
  const attrs = new Map();
  const classes = new Set(className.split(' ').filter(Boolean));
  return {
    id, disabled: false, style: {}, label: { textContent: 'Play' },
    get className() { return [...classes].join(' '); },
    classList: {
      contains: value => classes.has(value),
      add: value => classes.add(value),
      remove: (...values) => values.forEach(value => classes.delete(value)),
    },
    setAttribute: (key, value) => attrs.set(key, String(value)),
    getAttribute: key => attrs.has(key) ? attrs.get(key) : null,
    hasAttribute: key => attrs.has(key),
    removeAttribute: key => attrs.delete(key),
    querySelector() { return this.label; },
  };
}

function setup() {
  const listeners = new Map();
  const audio = Object.assign(element('audio'), {
    paused: true, ended: false, error: null, currentTime: 0, playCalls: 0,
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) || []), listener]);
    },
    emit(type) { (listeners.get(type) || []).forEach(listener => listener()); },
    play() {
      this.playCalls++;
      this.paused = false;
      this.ended = false;
      this.emit('play');
      return Promise.resolve();
    },
    pause() { this.paused = true; this.emit('pause'); },
    load() { this.error = null; this.currentTime = 0; this.pause(); },
  });
  const top = element('work-play-toggle', 'work-view-toggle work-play-toggle');
  top.setAttribute('data-audio-id', 'Tin1001a');
  top.setAttribute('data-audio-title', 'Kyrie');
  const buttons = [top];
  const context = vm.createContext({
    AUDIO: audio, AUDIOjrpid: '', AUDIOid: '',
    document: {
      getElementById: id => id === 'audio' ? audio : buttons.find(button => button.id === id),
      querySelectorAll: () => buttons,
    },
    getJosquinDataUrl: id => `https://primary.example/${id}.mp3`,
    getJosquinDataFallbackUrl: id => `https://mirror.example/${id}.mp3`,
  });
  vm.runInContext(audioCode, context);
  return { context, audio, top, buttons };
}

test('native pause/resume and ended events update the top control', () => {
  const { context, audio, top } = setup();
  context.PlayAudioFile('Tin1001a', top);
  assert.equal(top.label.textContent, 'Pause');
  audio.currentTime = 12;
  audio.pause();
  assert.equal(top.label.textContent, 'Play');
  assert.equal(context.AUDIOplayRequested, false);
  context.PlayAudioFile('Tin1001a', top);
  assert.equal(audio.currentTime, 12, 'resume must not reload the track');
  assert.equal(top.label.textContent, 'Pause');
  audio.ended = true;
  audio.paused = true;
  audio.emit('ended');
  assert.equal(top.label.textContent, 'Play');
});

test('removing the original button does not prevent pause or resume', () => {
  const { context, audio, buttons } = setup();
  const old = element('audio_Tin1001a', 'play');
  buttons.push(old);
  context.PlayAudioFile('Tin1001a', old);
  buttons.pop();
  context.PlayAudioFile('Tin1001a', null);
  assert.equal(audio.paused, true);
  assert.equal(audio.hasAttribute('controls'), true, 'lower controls remain available');
  context.PlayAudioFile('Tin1001a', null);
  assert.equal(audio.paused, false);
});

test('late mirror fallback does not restart audio after native pause', () => {
  const { context, audio, top } = setup();
  context.PlayAudioFile('Tin1001a', top);
  audio.pause();
  audio.onerror();
  assert.equal(audio.src, 'https://mirror.example/Tin1001a.mp3');
  assert.equal(audio.paused, true);
  assert.equal(audio.playCalls, 1);
});

test('mirror fallback resumes only an active request and stops after one retry', () => {
  const { context, audio, top } = setup();
  context.PlayAudioFile('Tin1001a', top);
  audio.onerror();
  assert.equal(audio.paused, false);
  assert.equal(audio.playCalls, 2);
  audio.error = { code: 4 };
  audio.onerror();
  assert.equal(audio.playCalls, 2);
  assert.equal(context.AUDIOplayRequested, false);
  assert.equal(top.label.textContent, 'Play');
});

test('an obsolete error handler cannot replace a newly selected track', () => {
  const { context, audio, top } = setup();
  context.PlayAudioFile('Tin1001a', top);
  const oldError = audio.onerror;
  context.PlayAudioFile('Tin1001b', top);
  oldError();
  assert.equal(audio.src, 'https://primary.example/Tin1001b.mp3');
  assert.equal(audio.playCalls, 2);
});

test('a queued pause event from the previous track does not cancel current playback', () => {
  const { context, audio, top } = setup();
  context.PlayAudioFile('Tin1001a', top);
  context.PlayAudioFile('Tin1001b', top);
  audio.emit('pause');
  assert.equal(context.AUDIOplayRequested, true);
});

test('legacy repertoire buttons synchronize without losing unrelated CSS classes', () => {
  const { context, audio, buttons } = setup();
  const row = element('audio_Tin1001a', 'play custom-row');
  buttons.push(row);
  context.PlayAudioFile('Tin1001a', row);
  assert.equal(row.classList.contains('pause'), true);
  audio.pause();
  assert.equal(row.classList.contains('play'), true);
  assert.equal(row.classList.contains('custom-row'), true);
});
