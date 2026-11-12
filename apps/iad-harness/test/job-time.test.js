import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {formatJobElapsed,jobWorkflow} from '../lib/shared/job-display.js';

test('completed audit duration sums recorded execution phases and excludes idle time between execution phases',()=>{
 const job={job_type:'MODEL_AUDIT',analysis_kind:'audit',status:'COMPLETED',
  started_at:'2026-11-11T00:00:00Z',finished_at:'2026-11-11T03:00:00Z',
  phase_timings:[
   {phase:'AUDITING',started_at:'2026-11-11T00:00:00Z',finished_at:'2026-11-11T00:20:00Z'},
   {phase:'AUDITING',started_at:'2026-11-11T00:30:00Z',finished_at:null},
   {phase:'GENERATING_AUDIT_REPORT',started_at:'2026-11-11T02:55:00Z',finished_at:'2026-11-11T03:00:00Z'}]};
 const saved=structuredClone(job);
 assert.equal(formatJobElapsed(job,Date.parse('2026-11-11T04:00:00Z')),'25:00');
 assert.equal(formatJobElapsed(job,Date.parse('2026-11-12T04:00:00Z')),'25:00');
 assert.deepEqual(jobWorkflow(job).stages.map(stage=>stage.elapsedSeconds),[null,1200,300]);
 assert.deepEqual(job,saved);
});

for(const [zone,expected] of [['UTC','2026/11/5 18:04:03'],['Asia/Shanghai','2026/11/6 02:04:03'],['America/New_York','2026/11/5 13:04:03']]){
 test(`job timestamps use the browser/runtime local timezone in ${zone}`,()=>{
  const module=new URL('../lib/shared/job-display.js',import.meta.url).href;
  const values=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',
   `import {formatJobTime} from ${JSON.stringify(module)};console.log(JSON.stringify(['2026-11-05T18:04:03Z','2026-11-06T02:04:03+08:00'].map(formatJobTime)));`],
   {env:{...process.env,TZ:zone},encoding:'utf8'}));
  assert.deepEqual(values,[expected,expected]);
 });
}
