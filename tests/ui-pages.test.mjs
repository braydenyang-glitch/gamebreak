import test from 'node:test';
import assert from 'node:assert/strict';
import {planksFromLogs} from '../public/ui-page-data.js';

test('material converter accepts zero and bounded whole inputs without rounding or overflow',()=>{
 assert.equal(planksFromLogs(0),0);
 assert.equal(planksFromLogs(16),64);
 assert.equal(planksFromLogs(100000),400000);
 for(const invalid of [-1,1.5,NaN,Infinity,100001,'16',null])assert.throws(()=>planksFromLogs(invalid),RangeError);
});
