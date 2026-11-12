import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import {ConsistencyView} from '../lib/client/consistency-view.js';

const image=(filename,summary={},review_state='pending')=>({
  sample:{sample_id:`dataset:${filename}`,task_id:'dataset'},image:null,review_state,
  summary:{program_conclusion:'未完成',model_conclusion:null,verdict:null,reason:'PENDING',...summary},
});
const reviewed=(program,model,verdict='MATERIAL')=>({
  reason:'MODEL_REVIEWED',program_conclusion:program,model_conclusion:model,verdict,
});
const filters={search:'',model:'all',agreement:'all',review:'all'};

test('all-image filters combine filename, model, agreement and review without treating unreviewed images as consistent',()=>{
  const cards=ConsistencyView.imageCards('job',[
    image('Case-A.PNG',reviewed('一致','无冲突','EQUIVALENT'),'confirmed'),
    image('Case-B.png',reviewed('位置差异','无冲突','EQUIVALENT'),'rejected'),
    image('Case-C.png',reviewed('多类别','多类别')),
    image('No-candidate.png',{reason:'NO_CANDIDATES',verdict:'EQUIVALENT',program_conclusion:'无候选'}),
    image('Pending.png'),
  ]);
  const ids=value=>ConsistencyView.filter(cards,{...filters,...value}).map(card=>card.filename);
  assert.deepEqual(ids({}),['Case-A.PNG','Case-B.png','Case-C.png','No-candidate.png','Pending.png']);
  assert.deepEqual(ids({model:'EQUIVALENT'}),['Case-A.PNG','Case-B.png']);
  assert.deepEqual(ids({agreement:'same'}),['Case-A.PNG','Case-C.png']);
  assert.deepEqual(ids({agreement:'different'}),['Case-B.png']);
  assert.deepEqual(ids({search:' CASE-',model:'EQUIVALENT',agreement:'different',review:'rejected'}),['Case-B.png']);
  assert.deepEqual(ids({review:'pending'}),['Case-C.png','No-candidate.png','Pending.png']);
  assert.deepEqual(ids({search:'missing.png'}),[]);
});

test('all-image loading includes matches beyond the first API page before filtering and display pagination',async()=>{
  const originals=Array.from({length:201},(_,index)=>image(index===200?'target-last.png':`sample-${index}.png`));
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    const page=Number(url.searchParams.get('page')),size=Number(url.searchParams.get('page_size'));
    assert.equal(url.pathname,'/api/iad/consistency/checks/job/images');
    assert.ok(size>=18&&size<=1000);
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify({job_id:'job',total:201,items:originals.slice((page-1)*size,page*size)}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const nativeFetch=globalThis.fetch;
  globalThis.fetch=(url,options)=>nativeFetch(new URL(url,`http://127.0.0.1:${server.address().port}`),options);
  try {
    const cards=await ConsistencyView.loadImages('job',new AbortController().signal);
    assert.equal(cards.length,201);
    assert.equal(new Set(cards.map(card=>card.id)).size,201);
    assert.deepEqual(ConsistencyView.filter(cards,{...filters,search:'target-last'}).map(card=>card.filename),['target-last.png']);
  }finally{
    globalThis.fetch=nativeFetch;
    await new Promise(resolve=>server.close(resolve));
  }
});


test('no-candidate tabs select persisted reasons and share image filters without including failures or pending images',()=>{
  const cards=ConsistencyView.imageCards('job',[
    image('none-A.png',{reason:'NO_CANDIDATES',program_conclusion:'无候选',verdict:'EQUIVALENT'}),
    image('rejected-B.png',{reason:'NO_ELIGIBLE_CANDIDATES',program_conclusion:'无有效候选',verdict:'EQUIVALENT'}),
    image('failed.png',{reason:'FAILED',program_conclusion:'无候选'}),image('pending.png'),
    image('reviewed.png',reviewed('一致',null,'EQUIVALENT')),
  ]);
  assert.deepEqual(ConsistencyView.filter(cards,filters,'NO_CANDIDATES').map(card=>card.filename),['none-A.png']);
  assert.deepEqual(ConsistencyView.filter(cards,filters,'NO_ELIGIBLE_CANDIDATES').map(card=>card.filename),['rejected-B.png']);
  assert.deepEqual(ConsistencyView.filter(cards,{...filters,search:'rejected'},'NO_CANDIDATES'),[]);
  assert.deepEqual(ConsistencyView.filter(cards,{...filters,model:'EQUIVALENT'},'NO_CANDIDATES'),[]);
  assert.deepEqual(ConsistencyView.filter(cards,{...filters,review:'confirmed'},'NO_ELIGIBLE_CANDIDATES'),[]);
});

test('the consistent tab uses the program conclusion while preserving independent model and review filters',()=>{
  const cards=ConsistencyView.imageCards('job',[
    image('confirmed.png',reviewed('一致','无冲突','EQUIVALENT'),'confirmed'),
    image('uncertain.png',reviewed('一致',null,'UNCERTAIN')),
    image('disagreed.png',reviewed('一致','位置差异'),'rejected'),
    image('program-conflict.png',reviewed('位置差异','无冲突','EQUIVALENT')),
    image('none.png',{reason:'NO_CANDIDATES',program_conclusion:'无候选',verdict:'EQUIVALENT'}),
    image('no-eligible.png',{reason:'NO_ELIGIBLE_CANDIDATES',program_conclusion:'无有效候选',verdict:'EQUIVALENT'}),
    image('failed.png',{reason:'EXECUTION_ERROR'}),image('pending.png'),
  ]);
  const filenames=values=>ConsistencyView.filter(cards,{...filters,...values},'PROGRAM_CONSISTENT').map(card=>card.filename);
  assert.deepEqual(filenames({}),['confirmed.png','uncertain.png','disagreed.png']);
  assert.deepEqual(filenames({model:'EQUIVALENT'}),['confirmed.png']);
  assert.deepEqual(filenames({agreement:'different'}),['disagreed.png']);
  assert.deepEqual(filenames({search:'uncertain',review:'pending'}),['uncertain.png']);
  assert.deepEqual(filenames({review:'confirmed'}),['confirmed.png']);
});
