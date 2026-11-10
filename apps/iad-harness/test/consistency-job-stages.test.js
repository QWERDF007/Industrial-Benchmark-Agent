import test from 'node:test';
import assert from 'node:assert/strict';
import {jobWorkflow} from '../lib/shared/job-display.js';

const job={job_type:'ANALYSIS_WORKFLOW',analysis_kind:'consistency',status:'RUNNING',phase:'AGENT_REVIEWING',
  phase_timings:[],phase_started_at:'2026-11-10T00:00:00Z',started_at:'2026-11-10T00:00:00Z'};

test('consistency uses three job stages and keeps all concurrent per-image steps in processing',()=>{
  const prep=jobWorkflow({...job,phase:'PREPARING_SHARED_INDEX'});
  assert.deepEqual(prep.stages.map(stage=>stage.title),['准备检查','逐图检查','汇总结果']);
  assert.equal(prep.index,0);
  for(const phase of ['RETRIEVING_ANCHOR','VERIFYING_CONTENT','AGENT_REVIEWING','OBSERVING_ANCHOR',
    'AWAITING_SUBMISSION','RETRIEVING_ANCHOR','AGENT_REVIEWING'])
    assert.equal(jobWorkflow({...job,phase}).index,1,phase);
  assert.equal(jobWorkflow({...job,phase:'SUMMARIZING_CONSISTENCY_RESULTS'}).index,2);
});

test('processing duration includes retrieval and each image submission, not job summary',()=>{
  const phases=['ENCODING','RETRIEVING_ANCHOR','AGENT_REVIEWING','AWAITING_SUBMISSION','RETRIEVING_ANCHOR','SUMMARIZING_CONSISTENCY_RESULTS'];
  const phase_timings=phases.map((phase,index)=>({phase,started_at:new Date(index*1000).toISOString(),finished_at:new Date((index+1)*1000).toISOString()}));
  const result=jobWorkflow({...job,phase:'SUMMARIZING_CONSISTENCY_RESULTS',phase_timings});
  assert.deepEqual(result.stages.map(stage=>stage.elapsedSeconds),[1,4,1]);
});

test('historical completed checks show completion without inventing summary timing or changing snapshots',()=>{
  const saved={...job,status:'COMPLETED',finished_at:'2026-11-10T00:00:30Z',
    phase_timings:[{phase:'AGENT_REVIEWING',started_at:'2026-11-10T00:00:00Z',finished_at:'2026-11-10T00:00:30Z'}]};
  const original=structuredClone(saved), result=jobWorkflow(saved);
  assert.equal(result.index,2);
  assert.equal(result.stages[1].elapsedSeconds,30);
  assert.equal(result.stages[2].elapsedSeconds,null);
  assert.deepEqual(saved,original);
  assert.equal(jobWorkflow({...saved,status:'PARTIAL'}).index,1);
});
