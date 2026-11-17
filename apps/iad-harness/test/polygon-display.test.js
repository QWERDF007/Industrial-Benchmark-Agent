import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {queryClient} from '../lib/client/query-client.js';
import {AnnotatedImageStage} from '../lib/client/components/AnnotatedImageStage.js';
import {FullscreenViewer} from '../lib/client/components/FullscreenViewer.js';
import {ConsistencyView} from '../lib/client/consistency-view.js';

const sample={sample_id:'polygon:sample.png',width:4096,height:3072,quality_status:'UNCERTAIN'};
const polygon={annotation_id:'polygon:1',annotation_type:'polygon',raw_label:'划痕',geometry_status:'VALID',
  bbox:[1000,1200,3000,2500],polygon:[[1000,1200],[3000,1500],[2400,2500]]};
const key=['iad','resource','/sample/'+encodeURIComponent(sample.sample_id)];
const render=element=>renderToStaticMarkup(element);

test('preview and large viewer read source polygons when comparison evidence is absent',()=>{
  queryClient.setQueryData(key,{sample,annotations:[polygon]});
  try {
    const preview=render(React.createElement(AnnotatedImageStage,{src:'/source.png',sampleId:sample.sample_id}));
    const full=render(React.createElement(FullscreenViewer,{open:true,onClose(){},item:{id:'sample',title:'样本',
      imageUrl:'/source.png',sampleId:sample.sample_id}}));
    for(const html of [preview,full]) {
      assert.match(html,/<polygon points="1000,1200 3000,1500 2400,2500"/);
      assert.match(html,/viewBox="0 0 4096 3072"/);
    }
  } finally {queryClient.removeQueries({queryKey:key,exact:true});}
});

test('frozen annotation source takes precedence and explicit empty layers stay empty',()=>{
  queryClient.setQueryData(key,{sample,annotations:[polygon]});
  try {
    const annotationLayer={kind:'boxes',width:4096,height:3072,annotations:[{...polygon,polygon:[[10,20],[30,40],[50,60]]}]};
    const frozen=render(React.createElement(AnnotatedImageStage,{src:'/frozen.png',sampleId:sample.sample_id,annotationLayer}));
    assert.match(frozen,/<polygon points="10,20 30,40 50,60"/);
    assert.doesNotMatch(frozen,/1000,1200 3000,1500/);
    const empty=render(React.createElement(AnnotatedImageStage,{src:'/normal.png',sampleId:sample.sample_id,annotationLayer:null}));
    assert.doesNotMatch(empty,/<polygon/);
  } finally {queryClient.removeQueries({queryKey:key,exact:true});}
});

test('consistency cards retain source sample identity without frozen image evidence',()=>{
  const [card]=ConsistencyView.imageCards('check:1',[{sample,summary:{program_conclusion:'无候选',reason:'NO_CANDIDATES'},
    review_state:'PENDING',model_filter:'',agreement:null}]);
  assert.equal(card.sampleId,sample.sample_id);
});
