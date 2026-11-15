import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const mode=process.argv[2]||'pilot';
assert.ok(['pilot','full'].includes(mode));
const root=process.argv[3]||(await fs.readFile('.scratch/consistency-optimization-root','utf8')).trim();
const base=process.env.IAD_BENCHMARK_URL||'http://127.0.0.1:8000/api/iad';
let cookie='';
if(process.env.IAD_BENCHMARK_AUTH_FILE){
  const authUrl=(await fs.readFile(process.env.IAD_BENCHMARK_AUTH_FILE,'utf8')).trim();
  assert.equal(new URL(authUrl).origin,new URL(base).origin);
  const login=await fetch(authUrl,{redirect:'manual'});
  assert.ok(login.ok||(login.status>=300&&login.status<400),'当前服务认证失败');
  cookie=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
  assert.ok(cookie,'当前服务未返回认证会话');
}
async function read(route,body){
  const response=await fetch(base+route,{signal:AbortSignal.timeout(120000),headers:{...(cookie?{Cookie:cookie}:{}),
    ...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
  if(!response.ok)throw new Error(`${response.status}: ${(await response.text()).slice(0,1000)}`);
  return response.json();
}
async function save(name,value){await fs.writeFile(path.join(root,`${mode}-${name}.json`),JSON.stringify(value,null,2));}
let job,submitted;
try{job=JSON.parse(await fs.readFile(path.join(root,`${mode}-start.json`),'utf8'));submitted=JSON.parse(await fs.readFile(path.join(root,`${mode}-submission.json`),'utf8'));}
catch(error){
  if(error.code!=='ENOENT')throw error;
  const request=JSON.parse(await fs.readFile(path.join(root,`${mode}-request.json`),'utf8'));
  submitted={started_at:new Date().toISOString(),submission_id:request.submission_id};await save('submission',submitted);
  job=await read('/analysis/start',request);await save('start',job);
}
const snapshot=await read(`/consistency/checks/${job.run_id}/config`);await save('snapshot',snapshot);
assert.equal(snapshot.concurrency,4);assert.equal(snapshot.roles.vision.profile.provider_id,'pinai');
assert.equal(snapshot.roles.vision.profile.model_id,'gpt-6.1-sol');assert.equal(snapshot.roles.vision.profile.reasoning_effort,'low');
assert.equal(snapshot.scopes.corpus.sample_count,5074);
if(mode==='full')assert.equal(snapshot.scopes.subjects.sample_count,5074);
console.log(JSON.stringify({event:'started',mode,run_id:job.run_id,subjects:snapshot.scopes.subjects.sample_count,model:snapshot.roles.vision.profile.model_id,reasoning:'low',concurrency:4}));
let milestone=false;
while(true){
  const status=await read(`/analysis/status/${job.run_id}?summary=true`);
  const elapsed=(Date.now()-Date.parse(submitted.started_at))/1000;
  await save('latest',{...status,elapsed_seconds:elapsed});
  console.log(JSON.stringify({event:'status',mode,run_id:job.run_id,status:status.status,phase:status.phase,completed:status.completed,failed:status.failed,total:status.total_samples,elapsed_seconds:Math.round(elapsed)}));
  if(status.completed>=1288&&!milestone){
    milestone=true;const report=await read(`/consistency/checks/${job.run_id}/report`);
    await save('1288',{elapsed_seconds:elapsed,report});
  }
  if(!['PENDING','RUNNING'].includes(status.status)){
    const detail=await read(`/analysis/status/${job.run_id}`),calls=detail.model_calls.filter(call=>call.operation==='generate');
    const events=calls.flatMap(call=>[{at:Date.parse(call.started_at),delta:1},{at:Date.parse(call.finished_at),delta:-1}]).filter(event=>Number.isFinite(event.at)).sort((a,b)=>a.at-b.at||a.delta-b.delta);
    let active=0,peak=0;for(const event of events){active+=event.delta;peak=Math.max(peak,active);}
    const schemas={};
    for(const call of calls){
      const group=schemas[call.schema_name]??={count:0,total_seconds:0,output_tokens:0,errors:0};
      group.count++;group.total_seconds+=(call.elapsed_ms||0)/1000;
      group.output_tokens+=call.usage?.output_tokens??call.usage?.completion_tokens??0;group.errors+=Number(!!call.error);
    }
    const report=await read(`/consistency/checks/${job.run_id}/report`);
    const elapsedSeconds=(Date.parse(status.finished_at)-Date.parse(submitted.started_at))/1000;
    const proof={run_id:job.run_id,status:status.status,completed:status.completed,failed:status.failed,total:status.total_samples,
      elapsed_seconds:elapsedSeconds,max_active_requests:peak,schemas,report,
      within_three_hours:mode==='full'&&status.status==='COMPLETED'&&status.failed===0&&status.completed===status.total_samples?elapsedSeconds<=10800:null};
    await save('proof',proof);console.log(JSON.stringify({event:'finished',mode,...proof}));
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.failed,0);assert.equal(status.completed,status.total_samples);assert.ok(peak<=4);
    break;
  }
  await new Promise(resolve=>setTimeout(resolve,15000));
}
