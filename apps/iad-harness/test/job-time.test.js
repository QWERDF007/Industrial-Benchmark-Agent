import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

for(const [zone,expected] of [['UTC','2026/11/5 18:04:03'],['Asia/Shanghai','2026/11/6 02:04:03'],['America/New_York','2026/11/5 13:04:03']]){
 test(`job timestamps use the browser/runtime local timezone in ${zone}`,()=>{
  const module=new URL('../lib/shared/job-display.js',import.meta.url).href;
  const values=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',
   `import {formatJobTime} from ${JSON.stringify(module)};console.log(JSON.stringify(['2026-11-05T18:04:03Z','2026-11-06T02:04:03+08:00'].map(formatJobTime)));`],
   {env:{...process.env,TZ:zone},encoding:'utf8'}));
  assert.deepEqual(values,[expected,expected]);
 });
}
