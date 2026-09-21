import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEnterToAdvance } from '../utils/enterToAdvance.js';

function fixture() {
  let clicks = 0;
  const button = {
    disabled: false, parentElement: null,
    closest: () => null, getAttribute: () => null,
    getBoundingClientRect: () => ({ width: 44, height: 44, top: 10, bottom: 54, left: 10, right: 54 }),
    click: () => clicks++,
  };
  const document = {
    activeElement: null,
    defaultView: { innerWidth: 400, innerHeight: 800, getComputedStyle: () => ({ display: 'flex', visibility: 'visible', opacity: '1' }) },
    querySelectorAll: selector => selector.includes('data-enter') ? [button] : [],
  };
  const event = { key: 'Enter', target: null, preventDefault() { this.defaultPrevented = true; } };
  return { button, document, event, clicks: () => clicks };
}

test('Enter activates exactly one visible forward action once', () => {
  const f = fixture();
  handleEnterToAdvance(f.event, f.document);
  assert.equal(f.clicks(), 1);
  assert.equal(f.event.defaultPrevented, true);
  handleEnterToAdvance(f.event, f.document);
  assert.equal(f.clicks(), 1);
});
test('typing, focused controls, composition, repeat and modifiers retain normal behavior', () => {
  for (const flag of ['repeat', 'isComposing', 'defaultPrevented', 'ctrlKey', 'altKey', 'metaKey', 'shiftKey']) {
    const f = fixture();
    handleEnterToAdvance({ ...f.event, [flag]: true }, f.document);
    assert.equal(f.clicks(), 0, flag);
  }
  for (const location of ['target', 'activeElement']) {
    const f = fixture();
    (location === 'target' ? f.event : f.document)[location] = { closest: () => ({}) };
    handleEnterToAdvance(f.event, f.document);
    assert.equal(f.clicks(), 0, location);
  }
});
test('disabled, invisible, offscreen, multiple actions and open menus do not advance', () => {
  const mutations = [
    f => { f.button.disabled = true; },
    f => { f.button.getAttribute = () => 'true'; },
    f => { f.button.closest = () => ({}); },
    f => { f.document.defaultView.getComputedStyle = () => ({ opacity: '0' }); },
    f => { f.button.getBoundingClientRect = () => ({ width: 44, height: 44, top: 900 }); },
    f => { f.document.querySelectorAll = selector => selector.includes('data-enter') ? [f.button, f.button] : []; },
    f => { f.document.querySelectorAll = () => [f.button]; },
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f);
    handleEnterToAdvance(f.event, f.document);
    assert.equal(f.clicks(), 0);
  }
});
