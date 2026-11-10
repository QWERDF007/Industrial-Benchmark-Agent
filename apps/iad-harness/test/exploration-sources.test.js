import test from 'node:test';
import assert from 'node:assert/strict';
import {explorationSources} from './fixtures/exploration-sources.js';

test('source HTTP catalog derives picker roles and raw categories without dropping unknown registrations',async t=>{
  const {read,datasets}=await explorationSources(t);
  const {items}=await read('analysis/sources?'+new URLSearchParams({dataset_ids:JSON.stringify(datasets.map(item=>item.dataset_id))}));
  assert.equal(items.length,38);
  const source=(dataset,name)=>items.find(item=>item.dataset_id===datasets[dataset].dataset_id&&item.relative_path===name);
  assert.equal(source(0,'normal-00.png').candidate_role,'normal');
  assert.equal(source(0,'scratch.png').candidate_role,'defect');
  assert.deepEqual(source(0,'scratch.png').annotation_categories,['类别 10','类别 2']);
  assert.deepEqual(source(1,'dent.png').annotation_categories,['凹陷']);
  assert.equal(source(2,'OK/ok.png').candidate_role,'normal');
  assert.equal(source(2,'NG/ng.png').candidate_role,'defect');
  assert.deepEqual(source(2,'NG/ng.png').annotation_categories,[]);
  assert.equal(source(3,'convention-normal.png').candidate_role,'normal');
  for(const index of [0,1])for(const filename of ['missing.png','unreadable.png']){
    assert.equal(source(index,filename).candidate_role,null,filename+' must not become a good sample');
    assert.deepEqual(source(index,filename).annotation_categories,[]);
  }
  assert.equal(source(2,'unknown/unknown.png').candidate_role,null);
  const selected=await read('analysis/sources?'+new URLSearchParams({dataset_ids:JSON.stringify([datasets[1].dataset_id])}));
  assert.equal(selected.items.length,5);
  assert.ok(selected.items.every(item=>item.dataset_id===datasets[1].dataset_id));
});
