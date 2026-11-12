import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Pagination} from '../lib/client/components/Pagination.js';
import {explorationDirections,ExplorationNarrative} from '../lib/client/exploration-view.js';
import {DatasetKnowledge} from '../lib/client/components/DatasetKnowledge.js';
import {RuleAssessments} from '../lib/client/components/RuleAssessments.js';
import {ConsistencyView} from '../lib/client/consistency-view.js';
import {ConsistencyResultCard} from '../lib/client/components/ConsistencyResultCard.js';

test('consistency cards show 一致 only after an equivalent annotation review', () => {
  const items=['MODEL_REVIEWED','NO_CANDIDATES','NO_ELIGIBLE_CANDIDATES'].map(reason=>({
    sample:{sample_id:`dataset:${reason}.png`,task_id:'dataset'},image:null,
    summary:{program_conclusion:'位置差异',model_conclusion:'无冲突',verdict:'EQUIVALENT',reason},
  }));
  const cards=ConsistencyView.imageCards('job',items);
  const render=item=>renderToStaticMarkup(React.createElement(ConsistencyResultCard,{item,action:'job-image',onOpen(){}}));
  assert.equal(cards[0].model.modelType,'EQUIVALENT');
  assert.match(render(cards[0]),/title="模型结论：一致"/);
  for(const card of cards.slice(1)) {
    assert.equal(card.model.modelType,'');
    assert.match(render(card),/title="模型结论："/);
    assert.doesNotMatch(render(card),/模型结论：一致/);
  }
});

test('sample knowledge panels read the fixed native publication catalog', () => {
  const knowledge={version_id:'fixed-native-version',coverage:{completed:2,total:4},catalog:{summary:'固定发布总结',
    checks:[{check_id:'C1',title:'边缘判据',status:'supported',criterion:'比较边缘轮廓',subject:'部件',location:'顶部',allowed_variations:[],limitations:[]}]}};
  const html=renderToStaticMarkup(React.createElement(DatasetKnowledge,{knowledge}));
  assert.match(html,/固定发布总结/);assert.match(html,/fixed-native-version/);
  assert.match(html,/2\/4 张完成，1 项判据/);assert.match(html,/边缘判据/);
  const assessment=renderToStaticMarkup(React.createElement(RuleAssessments,{knowledge:[knowledge],
    analysis:{overview:{evidence_id:'overview'},regions:[],auxiliary_evidence:[],reference_evidence:[],
      check_assessments:[{check_id:'C1',status:'normal',description:'边缘连续',limitations:[],evidence_ids:[]}]},onEvidence(){}}));
  assert.match(assessment,/边缘判据/);assert.match(assessment,/边缘连续/);
});

test('current direction results exclude removals while retaining frozen provenance', () => {
  const snapshot={version_id:'version-one',removed_direction_ids:['removed'],evidence:[],catalog:{directions:['removed','retained'].map(id=>({direction_id:id,title:id,instruction:'比较结构',rationale:'可见差异',
      limitations:[],evidence_ids:[],counter_evidence_ids:[],dataset_ids:['dataset-one'],applies_to:'both'}))}};
  const current=explorationDirections(snapshot);
  assert.deepEqual(current.map(direction=>direction.id),['retained']);
  assert.deepEqual(current[0].source,{kind:'published',versionId:'version-one'});
  assert.deepEqual(explorationDirections(snapshot,'removed').map(direction=>direction.id),['removed','retained']);
  assert.equal(snapshot.catalog.directions.length,2);
});

test('native direction citations group key whole images by sample identity independently of support and counter roles', () => {
  const snapshot = {version_id:'fixed-version',removed_direction_ids:[],
    evidence:[
      ...['original','crop','mask'].map((id,index)=>({evidence_id:'img_'+id,sample_id:'dataset:normal.png',filename:'normal.png',
        sampling_group:'normal',candidate_role:null,image:{evidence_id:'img_'+id,role:index?'roi':'overview',representation:index===2?'annotation_mask':'raw',
          original_size:[400,600],crop_bbox:index?[10,20,100,120]:[0,0,400,600],source_sha256:'normal-source'}})),
      ...['defect','unknown','irrelevant'].map(id=>({evidence_id:'img_'+id,sample_id:'dataset:'+id+'.png',filename:id+'.png',
        sampling_group:id==='defect'?'abnormal':'unclassified',candidate_role:null,image:{evidence_id:'img_'+id,role:'overview',representation:'raw',
          original_size:[400,600],crop_bbox:[0,0,400,600],source_sha256:id+'-source'}})),
    ],catalog:{directions:[{direction_id:'D1',title:'边缘',instruction:'比较边缘',applies_to:'both',dataset_ids:['dataset'],
      rationale:'img_crop 与 img_mask 的细节，对照 defect.png。',limitations:[],
      evidence_ids:['img_crop','img_mask','img_defect','img_unknown'],counter_evidence_ids:['img_original']}]}};
  const before=JSON.stringify(snapshot);
  const direction=explorationDirections(snapshot)[0];
  assert.deepEqual(direction.evidences.map(item=>[item.evidenceId,item.kind]),[['img_original','normal'],['img_defect','defect'],['img_unknown','unknown']]);
  assert.ok(direction.evidences.every(item=>item.url.endsWith(item.evidenceId)));
  assert.equal(JSON.stringify(snapshot),before,'展示只取条目引用，不追加全部已观察图，也不删改局部和反例');
});

test('shared pagination keeps the image browser five-page window and boundary controls', () => {
  const html=renderToStaticMarkup(React.createElement(Pagination,{total:237,page:1,size:24,unit:'张图像',onPage(){}}));
  assert.match(html,/aria-label="分页"/);
  assert.match(html,/aria-current="page"/);
  assert.match(html,/>5<\/button>/);
  assert.match(html,/共 237 张图像/);
  assert.match(html,/<button[^>]*disabled=""[^>]*>上一页<\/button>/);
  const last=renderToStaticMarkup(React.createElement(Pagination,{total:237,page:10,size:24,unit:'张图像',onPage(){}}));
  assert.match(last,/>6<\/button>/);
  assert.match(last,/<button[^>]*disabled=""[^>]*>下一页<\/button>/);
});

test('semantic icon buttons render canonical icons and native accessible button behavior', async () => {
  const {IconButton}=await import('../lib/client/components/IconButton.js');
  const close=renderToStaticMarkup(React.createElement(IconButton,{icon:'close',label:'关闭详情',disabled:true}));
  assert.match(close,/data-icon="close"/);
  assert.match(close,/aria-label="关闭详情"/);
  assert.match(close,/disabled=""/);
  assert.match(close,/<svg/);
  assert.doesNotMatch(close,/×/);
  const deletion=renderToStaticMarkup(React.createElement(IconButton,{icon:'delete',label:'删除作业'}));
  assert.match(deletion,/data-icon="delete"/);
  assert.match(deletion,/type="button"/);
});

test('shared image card supplies one lazy image and a compact accessible caption', async () => {
  const {ThumbnailCard}=await import('../lib/client/components/ThumbnailCard.js');
  const html=renderToStaticMarkup(React.createElement(ThumbnailCard,{src:'/actual.png',label:'支持证据 1',onClick(){}}));
  assert.match(html,/class="iad-thumbnail-card/);
  assert.match(html,/alt="支持证据 1"/);
  assert.match(html,/loading="lazy"/);
  assert.match(html,/class="iad-thumbnail-caption"/);
});

test('detail previews use the same labeled annotation geometry as full images', async () => {
  const {AnnotatedImageStage}=await import('../lib/client/components/AnnotatedImageStage.js');
  const html=renderToStaticMarkup(React.createElement(AnnotatedImageStage,{src:'/sample.png',width:400,height:600,
    bboxes:[{raw_label:'划痕',bbox:[10,20,40,80]}]}));
  assert.match(html,/aria-label="Labelme 标注"/);
  assert.match(html,/viewBox="0 0 400 600"/);
  assert.match(html,/<rect[^>]*x="10"[^>]*y="20"[^>]*width="30"[^>]*height="60"/);
  assert.match(html,/>划痕<\/text>/);
});


test('exploration prose resolves real references without changing frozen IDs', () => {
  const snapshot={job_id:'analysis_job_1',version_id:'analysis_version_1',session_id:'exploration_session_1',
    evidence:[{evidence_id:'img_original',sample_id:'ds_1:part.png',dataset_id:'ds_1',filename:'part.png',image:{annotation_ids:['ann_1']}}],
    catalog:{directions:[{direction_id:'direction_1',title:'边缘连续性',dataset_ids:['ds_1']}]}};
  const before=JSON.stringify(snapshot);
  const prose=new ExplorationNarrative(snapshot,{ds_1:'Test'});
  assert.equal(prose.text('analysis_job_1 对 ds_1:part.png 的 img_original 和 ann_1 观察，ds_1 的 direction_1。'),
    '本次探索 对 图像 的 图像 和 原始标注 观察，Test 的 边缘连续性。');
  assert.equal(JSON.stringify(snapshot),before);
});

test('exploration prose renders descriptions without inline image identities or filename substitutions',()=>{
  const snapshot={job_id:'analysis_job',version_id:'version',session_id:'session',catalog:{directions:[]},evidence:[
    {evidence_id:'img_whole',sample_id:'ds:source_123.png',filename:'source_123.png',sampling_group:'abnormal',image:{annotation_ids:[]}},
  ]};
  const prose=new ExplorationNarrative(snapshot);
  const text=prose.text('异常图 [img_whole] 的右缘有亮线，source_123.png 的暗边连续。');
  assert.doesNotMatch(text,/img_whole|source_123|\.png/);
  assert.match(text,/右缘有亮线/);
  assert.match(text,/暗边连续/);
});
