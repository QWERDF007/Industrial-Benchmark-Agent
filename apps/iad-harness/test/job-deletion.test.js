import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {useJobs} from '../lib/client/useJobs.js';
import {queryClient} from '../lib/client/query-client.js';

for(const kind of ['consistency','audit']) {
  test(`a deleted selected ${kind} job resolves as absent`,async t=>{
    const fetch=globalThis.fetch;
    t.after(()=>{globalThis.fetch=fetch;queryClient.clear();});
    const scope=JSON.stringify(['dataset']),runId='removed-job';
    queryClient.setQueryData(['iad','jobs',kind,scope],{jobs:[],pendingCount:0});
    globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'NOT_FOUND',message:'Job not found'}}),{status:404});
    function Probe(){useJobs(kind,['dataset'],()=>{},runId,0);return null;}
    renderToString(createElement(Probe));
    const query=queryClient.getQueryCache().find({queryKey:['iad','selected-job',kind,scope,runId],exact:true});
    assert.ok(query);
    assert.equal(await query.fetch(),null);
  });
}

test('selected job server errors remain visible',async t=>{
  const fetch=globalThis.fetch;
  t.after(()=>{globalThis.fetch=fetch;queryClient.clear();});
  const scope=JSON.stringify(['dataset']),runId='unavailable-job';
  queryClient.setQueryData(['iad','jobs','consistency',scope],{jobs:[],pendingCount:0});
  globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'数据库读取失败'}}),{status:500});
  function Probe(){useJobs('consistency',['dataset'],()=>{},runId,0);return null;}
  renderToString(createElement(Probe));
  const query=queryClient.getQueryCache().find({queryKey:['iad','selected-job','consistency',scope,runId],exact:true});
  await assert.rejects(()=>query.fetch(),error=>error.status===500&&error.message==='数据库读取失败');
});
