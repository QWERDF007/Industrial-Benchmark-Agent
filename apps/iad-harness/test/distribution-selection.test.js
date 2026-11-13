import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDistribution} from '../lib/client/distribution-selection.js';

const summary={minimum:.01,q25:.02,median:.03,q75:.04,maximum:.05,lower_whisker:.01,upper_whisker:.05,count:2,outliers:[]};
function slice(id,images,boxes){return {dataset_id:id,category:null,image_count:images,box_count:boxes,
  invalid_box_count:0,unannotated_images:0,classes:[{category:'edge',image_count:images,box_count:boxes}],
  instance_counts:{1:images},datasets:{[id]:images},quality:{FAIL:images},metadata:{station:{[id]:images}},
  heatmaps:{image_dimensions:{x_edges:[0,100,200],y_edges:[0,100,200],cells:[[0,1,images]]}},
  histograms:{relative_area:{edges:[0,.05,.1],counts:[boxes,0],density:[[0,.1],[.05,.2]]}},
  summaries:{relative_area:summary},area_by_category:[{category:'edge',statistics:{...summary,count:boxes}}]};}

test('multiple subsets combine counts while retaining each subset histogram and box statistics',()=>{
  const data={dataset_format:'labelme',datasets:['a','b','c'],categories:['edge'],
    slices:[slice(null,14,17),slice('a',2,3),{...slice('a',2,3),category:'edge'},slice('b',4,5),slice('c',8,9)]};
  const before=JSON.stringify(data);
  const view=selectDistribution(data,['a','c'],{a:'甲',b:'乙',c:'丙'});
  assert.equal(view.image_count,10);assert.equal(view.box_count,12);
  assert.deepEqual(view.classes,[{category:'edge',image_count:10,box_count:12}]);
  assert.deepEqual(view.heatmaps.image_dimensions.cells,[[0,1,10]]);
  assert.deepEqual(view.distributions.relative_area.map(item=>item.label),['甲','丙']);
  assert.deepEqual(view.distributions.relative_area.map(item=>item.data.counts),[[3,0],[9,0]]);
  assert.deepEqual(view.distributions.relative_area[0].data.edges,[0,.05,.1]);
  assert.equal(JSON.stringify(view.distributions).includes('density'),false);
  assert.deepEqual(view.area_by_category.map(item=>[item.label,item.statistics.count]),[['edge / 甲',3],['edge / 丙',9]]);
  assert.equal(JSON.stringify(data),before);
  assert.equal(selectDistribution(data,[],{}),null);
  assert.equal(selectDistribution(data,['b'],{}).image_count,4);
});

test('folder subsets retain image labels and bin counts without box statistics',()=>{
  const a={...slice('a',2,null),classes:[{category:'PASS',image_count:2,box_count:null}],instance_counts:{},
    heatmaps:{},histograms:{image_aspect_ratio:{edges:[1,2],counts:[2],density:[]}},summaries:{},area_by_category:[]};
  const data={dataset_format:'folder_classification',datasets:['a'],categories:['PASS'],slices:[a]};
  const view=selectDistribution(data,['a'],{});
  assert.equal(view.box_count,null);
  assert.deepEqual(view.classes,[{category:'PASS',image_count:2,box_count:null}]);
  assert.deepEqual(view.distributions.image_aspect_ratio[0].data.counts,[2]);
  assert.deepEqual(view.area_by_category,[]);
});
