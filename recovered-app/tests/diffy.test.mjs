import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildGenerations, correctDifference, nextGeneration, checkAnswer} from '../game/diffy.js';

// Independent oracle: execute the preserved original game module with minimal
// React hooks, and inspect the generations its original start() writes.
const original = JSON.parse(fs.readFileSync(new URL('../../recovery/original-modules.json', import.meta.url)))[697];
function originalGame(corners) {
  const states=[]; let index=0;
  const react={useState(initial){const i=index++;states[i]=initial;return [initial, value => states[i]=typeof value==='function'?value(states[i]):value];},useCallback: fn=>fn};
  const exports={};
  const factory=vm.runInNewContext('('+original.factory+')');
  factory({}, id=>id===31?react:{TOTAL_DRAW_MS:2400},null,null,{exports},exports,original.deps);
  const hook=exports.useDiffySquares();hook.start(corners);
  return {generations:JSON.parse(JSON.stringify(states[1])),hook,states};
}

test('known sequence reaches zero after five steps',()=>{
  assert.deepEqual(buildGenerations([1,2,3,4]),[[1,2,3,4],[1,1,1,3],[0,0,2,2],[0,2,0,2],[2,2,2,2],[0,0,0,0]]);
});
test('zero, equal corners, and wrap-around differences',()=>{
  assert.deepEqual(buildGenerations([0,0,0,0]),[[0,0,0,0]]);
  assert.deepEqual(buildGenerations([9999,9999,9999,9999]),[[9999,9999,9999,9999],[0,0,0,0]]);
  assert.equal(correctDifference([7,0,4,2],3),5);
  assert.deepEqual(nextGeneration([7,0,4,2]),[7,4,2,5]);
});
test('1000 deterministic input sets match original bundle exactly',()=>{
  let seed=246813579;
  for(let sample=0;sample<1000;sample++) {
    const corners=Array.from({length:4},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%10000;});
    assert.deepEqual(buildGenerations(corners),originalGame(corners).generations);
  }
});
test('input checking matches original including partial and pasted answers',()=>{
  for(const expected of [0,1,12,9999])for(const text of ['', '0', '1','12','9999','0012','x1y2','-12','4']) {
    const game=originalGame([expected,0,0,0]);
    game.hook.setAnswer(0,text,[expected,0,0,0],0,['empty','empty','empty','empty']);
    assert.deepEqual(checkAnswer(text,expected),{value:game.states[3][0],state:game.states[4][0]});
  }
});
test('reject invalid starts and do not mutate caller input',()=>{
  for(const corners of [[1,2,3],[-1,0,0,0],[10000,0,0,0],[0.5,0,0,0],[NaN,0,0,0]])assert.throws(()=>buildGenerations(corners),RangeError);
  const corners=Object.freeze([1,2,3,4]);assert.deepEqual(buildGenerations(corners)[0],corners);
});
