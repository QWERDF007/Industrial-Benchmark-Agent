import assert from 'node:assert/strict';
import test from 'node:test';
import {runDependencies} from '../lib/server/jobs/concurrency.js';

test('local preparation progresses while every model slot is occupied', async()=>{
  const modelEntered=Promise.withResolvers(),localFinished=Promise.withResolvers(),release=Promise.withResolvers();
  const tasks=[
    {id:'model',resource:'model',dependencies:[],value:'model'},
    {id:'local',resource:'local',dependencies:[],value:'local'},
    {id:'audit',resource:'model',dependencies:['model','local'],value:'audit'},
  ];
  const running=runDependencies(tasks,{model:1,local:1},new AbortController().signal,async kind=>{
    if(kind==='model'){modelEntered.resolve();await release.promise;}
    if(kind==='local'){await modelEntered.promise;localFinished.resolve();}
  });
  try{
    await Promise.race([localFinished.promise,running.then(()=>{throw new Error('Local work never progressed');})]);
  }finally{release.resolve();await running;}
});

test('dependency execution shares model capacity across content and annotation requests', async()=>{
  const active={model:0,local:0},peak={model:0,local:0},seen=[];
  const tasks=Array.from({length:12},(_,index)=>[
    {id:'prepare'+index,resource:'local',dependencies:[],value:{resource:'local',index}},
    {id:'identity'+index,resource:'model',dependencies:['prepare'+index],value:{resource:'model',index}},
    {id:'audit'+index,resource:'model',priority:1,dependencies:['identity'+index],value:{resource:'model',index}},
  ]).flat();
  await runDependencies(tasks,{model:4,local:2},new AbortController().signal,async({resource,index})=>{
    peak[resource]=Math.max(peak[resource],++active[resource]);
    await new Promise(resolve=>setTimeout(resolve,1));seen.push(index);active[resource]--;
  });
  assert.deepEqual(peak,{model:4,local:2});assert.equal(seen.length,36);
});
