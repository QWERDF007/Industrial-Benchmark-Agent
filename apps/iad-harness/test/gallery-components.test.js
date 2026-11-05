import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {directionEvidence,ReferencedText} from '../lib/client/direction-evidence.js';
import {Pagination} from '../lib/client/components/Pagination.js';
import {explorationDirections} from '../lib/client/exploration-view.js';

test('current direction results exclude removals while retaining frozen provenance', () => {
  const snapshot={version_id:'version-one',dataset_id:'dataset-one',normal_sources:[],defect_sources:[],evidence:[],
    directions:['removed','retained'].map(id=>({direction_id:id,title:id,instruction:'比较结构',rationale:'可见差异',
      limitations:[],evidence_ids:[],applies_to:'both'}))};
  const current=explorationDirections([snapshot],['removed']);
  assert.deepEqual(current.map(direction=>direction.id),['retained']);
  assert.equal(current[0].versionId,'version-one');
  assert.equal(snapshot.directions.length,2);
});

test('direction references to crops and masks locate their original image once', () => {
  const snapshot = {dataset_id:'dataset',normal_sources:[{sample_id:'dataset:normal.png'}],defect_sources:[],
    evidence:[
      {sample_id:'dataset:normal.png',image:{evidence_id:'img_original',role:'overview',representation:'raw',original_size:[400,600],crop_bbox:[0,0,400,600]}},
      {sample_id:'dataset:normal.png',image:{evidence_id:'img_crop',role:'roi',representation:'raw',original_size:[400,600],crop_bbox:[10,20,100,120]}},
      {sample_id:'dataset:normal.png',image:{evidence_id:'img_mask',role:'roi',representation:'annotation_mask',original_size:[400,600],crop_bbox:[10,20,100,120]}},
    ]};
  const result=directionEvidence(snapshot,{instruction:'比较边缘',rationale:'img_crop 与 img_mask 的细节',limitations:[],evidence_ids:['img_crop','img_mask']});
  assert.deepEqual(result.entries.map(item=>item.id),['img_original']);
  assert.equal(result.references.get('img_crop').id,'img_original');
  assert.equal(result.references.get('img_mask').label,'良品 N1');
  assert.equal(result.references.get('normal.png').id,'img_original');
  assert.equal(snapshot.evidence.length,3,'展示投影不得删改送模证据');
});

test('consecutive references to the same original form one citation without altering separate statements', () => {
  const references=new Map([
    ['img_111111',{id:'first',label:'异常 A1'}],
    ['img_222222',{id:'first',label:'异常 A1'}],
    ['img_333333',{id:'second',label:'异常 A2'}],
  ]);
  const render=text=>renderToStaticMarkup(React.createElement(ReferencedText,{text,references,onReference(){},onPreview(){}}));
  const list=render('对比img_111111、img_222222、img_333333。');
  assert.equal((list.match(/data-evidence-ref=/g)||[]).length,2,'原图和裁剪在同一引用列表内不能重复显示');
  const range=render('观察img_111111至img_222222的标注区域。');
  assert.equal((range.match(/data-evidence-ref=/g)||[]).length,1,'同一原图不能显示为A1至A1');
  assert.doesNotMatch(range,/>至</);
  const statements=render('img_111111显示亮线，img_222222存在反光。');
  assert.equal((statements.match(/data-evidence-ref=/g)||[]).length,2,'两个独立描述应保留各自的定位引用');
  assert.match(statements,/显示亮线，/);
  assert.match(statements,/存在反光。/);
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
