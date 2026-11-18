import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDistribution} from '../lib/client/distribution-selection.js';
import {chartOptions} from '../lib/client/components/charts/options.js';

const summary={minimum:.01,q25:.02,median:.03,q75:.04,maximum:.05,lower_whisker:.01,upper_whisker:.05,count:2,outliers:[]};
function slice(id,images,boxes){return {dataset_id:id,category:null,image_count:images,annotation_count:boxes,
  geometry_types:boxes===null?{}:{bbox:boxes},invalid_annotation_count:0,unannotated_images:0,classes:[{category:'edge',image_count:images,annotation_count:boxes}],
  instance_counts:{1:images},datasets:{[id]:images},quality:{FAIL:images},metadata:{station:{[id]:images}},
  heatmaps:{image_dimensions:{x_edges:[0,100,200],y_edges:[0,100,200],cells:[[0,1,images]]}},
  histograms:{relative_area:{edges:[0,.05,.1],counts:[boxes,0],density:[[0,.1],[.05,.2]]}},
  summaries:{relative_area:summary},area_by_category:[{category:'edge',statistics:{...summary,count:boxes}}]};}

test('selected subsets pool each category into one box and one distribution',()=>{
  const data={dataset_format:'labelme',datasets:['a','b','c'],categories:['edge'],
    slices:[slice(null,14,17),slice('a',2,3),{...slice('a',2,3),category:'edge'},slice('b',4,5),slice('c',8,9)],
    category_area_samples:{a:{edge:[.03,.01,.02]},b:{edge:[.04,.05,.06,.07,.08]},c:{edge:[.9,.8,.7,.6,.5,.4,.3,.2,.1]}}};
  data.slices.at(-1).histograms.relative_area.counts=[0,9];
  const before=JSON.stringify(data);
  const view=selectDistribution(data,['a','c'],{a:'甲',b:'乙',c:'丙'});
  assert.equal(view.image_count,10);assert.equal(view.annotation_count,12);assert.deepEqual(view.geometry_types,{bbox:12});
  assert.deepEqual(view.classes,[{category:'edge',image_count:10,annotation_count:12}]);
  assert.deepEqual(view.heatmaps.image_dimensions.cells,[[0,1,10]]);
  assert.deepEqual(view.distributions.relative_area.map(item=>item.label),['所选子数据集']);
  assert.deepEqual(view.distributions.relative_area.map(item=>item.data.counts),[[3,9]]);
  assert.deepEqual(view.distributions.relative_area[0].data.edges,[0,.05,.1]);
  assert.equal(JSON.stringify(view.distributions).includes('density'),false);
  assert.equal(view.area_by_category.length,1,'所选数据集的同一类别只能有一个箱图系列');
  assert.deepEqual(view.area_by_category[0].rows.map(row=>[row.label,row.statistics.count]),[['edge',12]]);
  const box=view.area_by_category[0].rows[0].statistics;
  assert.ok(Math.abs(box.q25-.0825)<1e-12);assert.ok(Math.abs(box.median-.35)<1e-12);
  assert.ok(Math.abs(box.q75-.625)<1e-12);
  assert.equal(box.lower_whisker,.01);assert.equal(box.upper_whisker,.9);assert.deepEqual(box.outliers,[]);
  const singleton=selectDistribution(data,['a'],{}).area_by_category[0].rows[0].statistics;
  assert.equal(singleton.count,3);assert.equal(singleton.median,.02);
  const all=selectDistribution(data,['a','b','c'],{}).area_by_category[0].rows[0].statistics;
  assert.equal(all.count,17);assert.equal(all.median,.1);
  const theme={ink:'#172338',muted:'#536174',grid:'#e2e8f0',surface:'#fff',font:'sans-serif',
    palette:['#285ed6'],tones:{primary:'#285ed6'},reducedMotion:true};
  const chart=chartOptions({type:'boxplot',format:'percent',series:view.area_by_category},theme);
  assert.deepEqual(chart.xAxis.data,['edge']);
  assert.equal(chart.series.filter(series=>series.type==='boxplot').length,1);
  assert.equal(chart.series[0].data.length,1);
  assert.doesNotMatch(chart.tooltip.formatter({seriesIndex:0,dataIndex:0}),/甲|丙/);
  assert.equal(JSON.stringify(data),before);
  assert.equal(selectDistribution(data,[],{}),null);
  assert.equal(selectDistribution(data,['b'],{}).image_count,4);
});

test('folder subsets retain image labels and bin counts without box statistics',()=>{
  const a={...slice('a',2,null),classes:[{category:'PASS',image_count:2,annotation_count:null}],instance_counts:{},
    heatmaps:{},histograms:{image_aspect_ratio:{edges:[1,2],counts:[2],density:[]}},summaries:{},area_by_category:[]};
  const data={dataset_format:'folder_classification',datasets:['a'],categories:['PASS'],slices:[a],category_area_samples:{}};
  const view=selectDistribution(data,['a'],{});
  assert.equal(view.annotation_count,null);
  assert.deepEqual(view.classes,[{category:'PASS',image_count:2,annotation_count:null}]);
  assert.deepEqual(view.distributions.image_aspect_ratio[0].data.counts,[2]);
  assert.deepEqual(view.area_by_category,[]);
});

test('pooled category boxes recompute whiskers and outliers across unequal subsets',()=>{
  const data={dataset_format:'labelme',datasets:['a','b'],categories:['edge','hole'],slices:[slice('a',4,4),slice('b',2,3)],
    category_area_samples:{a:{edge:[.01,.02,.03,.04]},b:{edge:[.9],hole:[.2,.2]}}};
  const view=selectDistribution(data,['a','b'],{a:'甲',b:'乙'});
  assert.equal(view.area_by_category.length,1);
  assert.equal(view.area_by_category[0].rows.length,2);
  const edge=view.area_by_category[0].rows.find(row=>row.id==='edge').statistics;
  assert.deepEqual(edge,{minimum:.01,maximum:.9,q25:.02,median:.03,q75:.04,
    lower_whisker:.01,upper_whisker:.04,count:5,outliers:[[.9,1]]});
  const hole=view.area_by_category[0].rows.find(row=>row.id==='hole').statistics;
  assert.deepEqual(hole,{minimum:.2,maximum:.2,q25:.2,median:.2,q75:.2,
    lower_whisker:.2,upper_whisker:.2,count:2,outliers:[]});
  assert.equal(selectDistribution(data,['a'],{}).area_by_category[0].rows.length,1);
});
