import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ConsistencyResultCard} from '../lib/client/components/ConsistencyResultCard.js';
import {ConsistencyView} from '../lib/client/consistency-view.js';

const image=(filename,summary={},review_state='pending')=>({
  sample:{sample_id:`dataset:${filename}`,task_id:'dataset'},image:null,review_state,
  summary:{program_conclusion:'未完成',original_categories:[],model_conclusion:null,verdict:null,reason:'PENDING',...summary},
  model_filter:summary.reason==='MODEL_REVIEWED'?(summary.verdict==='EQUIVALENT'?'EQUIVALENT':summary.model_conclusion):null,
  agreement:summary.reason==='MODEL_REVIEWED'&&(summary.model_conclusion||summary.verdict==='EQUIVALENT')?
    summary.program_conclusion===(summary.verdict==='EQUIVALENT'?'一致':summary.model_conclusion)?'same':'different':null,
});
const reviewed=(program,model,verdict='MATERIAL')=>({
  reason:'MODEL_REVIEWED',program_conclusion:program,model_conclusion:model,verdict,
});
const filters={search:'',model:'all',agreement:'all',review:'all'};

test('cards keep workflow status out of model conclusions',()=>{
  for(const [reason,label] of [
    ['NO_CANDIDATES','无需标注审核'],['NO_ELIGIBLE_CANDIDATES','无需标注审核'],
    ['PROGRAM_REVIEWED','无需标注审核'],['PENDING','等待标注审核'],
    ['OBSERVING_ANCHOR','标注审核中'],['FAILED','审核失败'],['CANCELLED','已取消审核'],
  ]) {
    const [card]=ConsistencyView.imageCards('job',[image('sample.png',{
      reason,program_conclusion:'无有效候选',annotation_review_label:label,
    })]);
    const html=renderToStaticMarkup(React.createElement(ConsistencyResultCard,{item:card,action:'job-image',onOpen(){}}));
    assert.match(html,/无有效候选/);
    assert.ok(!html.includes(label));
    assert.equal(card.model.modelType,'');
  }
  const [card]=ConsistencyView.imageCards('job',[image('conflict.png',reviewed('位置差异','位置差异'))]);
  const html=renderToStaticMarkup(React.createElement(ConsistencyResultCard,{item:card,action:'job-image',onOpen(){}}));
  assert.match(html,/模型结论：位置差异/);
});

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

test('image pages send combined filters and return the current page without reading the entire job',async()=>{
  const originals=Array.from({length:201},(_,index)=>image(index===200?'target-last.png':`sample-${index}.png`));
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    const page=Number(url.searchParams.get('page')),size=Number(url.searchParams.get('page_size'));
    assert.equal(page,1);assert.equal(size,18);assert.equal(url.searchParams.get('search'),'target-last');
    assert.equal(url.pathname,'/api/iad/consistency/checks/job/images');
    assert.ok(size>=18&&size<=1000);
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify({job_id:'job',total:1,items:originals.filter(item=>item.sample.sample_id.includes('target-last'))}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const nativeFetch=globalThis.fetch;
  globalThis.fetch=(url,options)=>nativeFetch(new URL(url,`http://127.0.0.1:${server.address().port}`),options);
  try {
    const result=await ConsistencyView.loadImagePage('job',{...filters,search:'target-last',group:'images'},1,new AbortController().signal);
    const cards=result.items;
    assert.equal(cards.length,1);assert.equal(result.total,1);
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


test('program cards prioritize count and category differences over geometry while showing one conclusion',()=>{
  const cards=ConsistencyView.imageCards('job',[
    image('picture_1072.png',{...reviewed('位置差异','多类别'),original_categories:['位置差异','多类别']}),
    image('picture_1074.png',{...reviewed('位置差异','少类别'),original_categories:['位置差异','少类别']}),
  ]);
  for(const [index,label] of ['多标实例','少标实例'].entries()) {
    const html=renderToStaticMarkup(React.createElement(ConsistencyResultCard,{item:cards[index],action:'open-conflict',onOpen(){}}));
    assert.match(html,new RegExp('程序结论：'+label));
    assert.doesNotMatch(html,/程序结论：位置差异|位置差异、多标|位置差异、少标/);
    assert.match(html,new RegExp('模型结论：'+label));
    assert.equal(cards[index].type,label);
  }
  assert.equal(ConsistencyView.programConclusion(['位置差异','多类别'],'位置差异'),'多标实例');
  assert.equal(ConsistencyView.programConclusion(['位置差异','类别不一致'],'位置差异'),'类别不一致');
  assert.equal(ConsistencyView.programConclusion(['位置差异'],'位置差异'),'位置差异');
  assert.equal(ConsistencyView.programConclusion([],'无候选'),'无候选');
});


test('program conclusion uses category and count first and location split merge second',()=>{
  for(const [categories,expected] of [
    [['位置差异','多类别'],'多标实例'],
    [['合并','少类别'],'少标实例'],
    [['拆分','类别不一致'],'类别不一致'],
    [['对应关系差异','少标内容'],'少标内容'],
    [['对应关系差异','拆分'],'拆分'],
    [['对应关系差异','合并'],'合并'],
    [['拆分','合并'],'拆分'],
    [['拆分','多标内容'],'多标内容'],
    [['多标内容','少标内容'],'少标内容'],
    [['多标内容','多类别'],'多标实例'],
  ])assert.equal(ConsistencyView.programConclusion(categories,''),expected);
});


test('model identity rejection is attributed to the model without creating an annotation verdict',()=>{
  const [card]=ConsistencyView.imageCards('job',[image('picture_1289.png',{
    reason:'NO_ELIGIBLE_CANDIDATES',program_conclusion:'无有效候选',identity_model_reviewed:true,
  })]);
  const html=renderToStaticMarkup(React.createElement(ConsistencyResultCard,{item:card,action:'job-image',onOpen(){}}));
  assert.equal(card.model.modelType,'');
  assert.equal(card.model.identityConclusion,'无有效候选');
  assert.match(html,/模型结论：无有效候选/);
  assert.doesNotMatch(html,/程序结论：无有效候选/);
});
