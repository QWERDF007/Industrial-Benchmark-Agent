import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Chart} from '../lib/client/components/charts/Chart.js';
import {chartOptions} from '../lib/client/components/charts/options.js';
import {init} from 'echarts/core';
import {conflictCategories,conflictCategoryLabels,modelConclusionLabels} from '../lib/shared/consistency.parameters.generated.js';

test('conflict statistics render every current category and full label inside the statistics drawer',()=>{
  const theme={ink:'#172338',muted:'#536174',grid:'#e2e8f0',surface:'#fff',font:'sans-serif',
    palette:['#285ed6'],tones:{primary:'#285ed6'},reducedMotion:true};
  for(const labels of [conflictCategories.map(category=>conflictCategoryLabels[category]),Object.values(modelConclusionLabels)]){
    const spec={type:'bar',rows:labels.map((label,index)=>({id:label,label,values:[index+1]})),
      series:[{label:'图组',unit:'组'}],maximum:20,labelRotation:45};
    const chart=init(null,undefined,{renderer:'svg',ssr:true,width:510,height:480});
    try {
      const options=chartOptions(spec,theme);
      chart.setOption(options);
      const svg=chart.renderToSVGString();
      for(const label of labels)assert.ok(svg.includes('>'+label+'</text>'),label+'应在横轴完整显示');
      assert.doesNotMatch(svg,/…|\.\.\./);
      assert.equal(options.xAxis.axisLabel.interval,0);
      assert.equal(options.xAxis.axisLabel.rotate,45);
    } finally {chart.dispose();}
  }
});

test('shared charts expose counts accessibly without duplicating the chart as a table',()=>{
  const html=renderToStaticMarkup(React.createElement(Chart,{title:'类别分布',spec:{type:'bar',
    series:[{label:'图像',unit:'张'},{label:'框',unit:'个'}],
    rows:[{id:'edge',label:'边缘',values:[2,3]},{id:'hole',label:'孔',values:[1,1]}]}}));
  assert.match(html,/<figcaption[^>]*>类别分布<\/figcaption>/);
  assert.match(html,/data-chart-type="bar"/);
  assert.match(html,/图像（张）/);
  assert.match(html,/框（个）/);
  assert.match(html,/边缘/);
  assert.doesNotMatch(html,/<table|<details|<summary/,'图表不应自动附带重复表格或折叠区域');
  assert.match(html,/aria-label="[^"]*边缘[^"]*图像（张）：2[^"]*框（个）：3/);
  assert.doesNotMatch(html,/iad-audit-chart-bars|dc-vchart-bar|height:.*%/);
});

test('shared charts preserve zero results and expose box statistics without fabricated curves',()=>{
  const empty=renderToStaticMarkup(React.createElement(Chart,{title:'结论一致性',spec:{type:'donut',unit:'组',
    rows:[{id:'same',label:'一致',value:0},{id:'different',label:'不一致',value:0}]}}));
  assert.match(empty,/data-chart-type="donut"/);
  assert.match(empty,/aria-label="[^"]*一致[^"]*0[^"]*不一致[^"]*0/);
  assert.doesNotMatch(empty,/<table/);
  const box=renderToStaticMarkup(React.createElement(Chart,{title:'框面积占比',spec:{type:'boxplot',format:'percent',series:[{id:'a',label:'甲',rows:[{
    id:'edge',label:'边缘',statistics:{minimum:.005,q25:.01,median:.02,q75:.03,maximum:.9,
      lower_whisker:.005,upper_whisker:.04,count:10,outliers:[[.9,1]]}}]}]}}));
  assert.match(box,/data-chart-type="boxplot"/);
  assert.match(box,/aria-label="[^"]*中位数：2%/);
  assert.match(box,/离群/);
});

test('area box plots render one pooled box per category without dataset grouping',()=>{
  const theme={ink:'#172338',muted:'#536174',grid:'#e2e8f0',surface:'#fff',font:'sans-serif',
    palette:['#285ed6','#166344'],tones:{primary:'#285ed6',warning:'#d39c33'},reducedMotion:true};
  const statistics={minimum:.005,q25:.01,median:.02,q75:.03,maximum:.9,
    lower_whisker:.005,upper_whisker:.04,count:10,outliers:[[.9,1]]};
  const spec={type:'boxplot',format:'percent',series:[
    {id:'category-area',label:'实例面积占比',rows:[{id:'edge',label:'边缘',statistics:{...statistics,count:20,median:.025}},
      {id:'hole',label:'孔洞',statistics}]},
  ]};
  const chart=init(null,undefined,{renderer:'svg',ssr:true,width:640,height:320});
  try {
    const options=chartOptions(spec,theme);
    chart.setOption(options);
    const svg=chart.renderToSVGString();
    assert.equal([...svg.matchAll(/>边缘<\/text>/g)].length,1);
    assert.match(svg,/>孔洞<\/text>/);
    assert.doesNotMatch(svg,/>[^<]*子集[甲乙][^<]*<\/text>/);
    assert.match(svg,/stroke="#285ed6"/);
    assert.doesNotMatch(svg,/stroke="#166344"/);
    assert.equal(options.series.filter(series=>series.type==='boxplot').length,1);
    assert.equal(options.series[0].data.length,2);
    assert.match(options.tooltip.formatter({seriesIndex:0,dataIndex:0}),/边缘\n[^]*中位数：2\.5%[^]*样本数：20/);
  } finally {chart.dispose();}
});

test('donuts render composite centers and decimal contributions while preserving count percentages',()=>{
  const theme={ink:'#172338',muted:'#536174',grid:'#e2e8f0',surface:'#fff',font:'sans-serif',
    palette:['#285ed6','#166344'],tones:{muted:'#536174'},reducedMotion:true};
  const spec={type:'donut',unit:'分',format:'score',center:{label:'综合得分',value:89.19744333660238},rows:[
    {id:'consistency',label:'数据一致性',value:80,details:'100.0 × 0.8 = 80.0 分'},
    {id:'diversity',label:'数据多样性',value:4.534943336602376,details:'30.2 × 0.15 = 4.5 分'},
    {id:'redundancy',label:'数据冗余度',value:4.6625},{id:'unearned',label:'未得分',value:10.80255666339762,tone:'muted'}]};
  const chart=init(null,undefined,{renderer:'svg',ssr:true,width:640,height:320});
  try {
    const options=chartOptions(spec,theme);chart.setOption(options);
    assert.match(chart.renderToSVGString(),/>89\.2<\/text>/);
    assert.doesNotMatch(chart.renderToSVGString(),/>80\.0 分<\/text>|>4\.5 分<\/text>|>4\.7 分<\/text>|<polyline/,'只保留圆环、圆心和图例，计算明细通过悬浮提示展示');
    assert.match(options.tooltip.formatter({dataIndex:1}),/得分（分）：4\.5/);
    assert.match(options.tooltip.formatter({dataIndex:1}),/30\.2 × 0\.15 = 4\.5 分/);
    assert.match(options.tooltip.formatter({dataIndex:0,percent:80}),/占比：80%/);
    const counts=chartOptions({type:'donut',unit:'张',rows:[{id:'normal',label:'正常',value:3},{id:'suspect',label:'疑点',value:1}]},theme);
    assert.match(counts.tooltip.formatter({dataIndex:1,percent:25}),/25%/);
    chart.setOption(chartOptions({...spec,center:{label:'综合得分',value:null},rows:[]},theme),{notMerge:true});
    assert.match(chart.renderToSVGString(),/>证据不足<\/text>/);
    chart.setOption(chartOptions({...spec,center:{label:'综合得分',value:0},rows:[]},theme),{notMerge:true});
    assert.match(chart.renderToSVGString(),/>0\.0<\/text>/);
  } finally {chart.dispose();}
});

test('distribution curves expose actual bin counts and per-subset percentages including constant samples',()=>{
  const html=renderToStaticMarkup(React.createElement(Chart,{title:'框面积占比',spec:{type:'distribution',
    xLabel:'框面积占比',unit:'个',format:'percent',series:[
      {id:'a',label:'甲',data:{edges:[0,.1,.2,.3],counts:[1,2,1]}},
      {id:'b',label:'乙',data:{edges:[0,.1,.2,.3],counts:[50,50,0]}},
    ]}}));
  assert.match(html,/data-chart-type="distribution"/);
  assert.match(html,/甲，框面积占比 0%–10%，数量（个）：1，占比：25%/);
  assert.match(html,/甲，框面积占比 10%–20%，数量（个）：2，占比：50%/);
  assert.match(html,/乙，框面积占比 0%–10%，数量（个）：50，占比：50%/);
  assert.doesNotMatch(html,/概率密度|<table/);
  const constant=renderToStaticMarkup(React.createElement(Chart,{title:'图像长宽比',spec:{type:'distribution',
    xLabel:'图像长宽比',unit:'张',series:[{id:'a',label:'甲',data:{edges:[1,2],counts:[2]}}]}}));
  assert.match(constant,/数量（张）：2，占比：100%/);
  const empty=renderToStaticMarkup(React.createElement(Chart,{title:'框面积占比',spec:{type:'distribution',
    xLabel:'框面积占比',unit:'个',series:[{id:'a',label:'甲',data:{edges:[0,1],counts:[0]}}]}}));
  assert.match(empty,/暂无统计数据/);
});


test('shared chart panels compare actual subset scores within one chart header',()=>{
  const panel=(label,value)=>({label,spec:{type:'donut',unit:'分',format:'score',
    center:{label:'综合得分',value},rows:[{id:'earned',label:'数据一致性',value},{id:'unearned',label:'未得分',value:100-value}]}});
  const html=renderToStaticMarkup(React.createElement(Chart,{title:'综合得分',spec:null,panels:[panel('训练集',92),panel('测试集',80)],controls:'范围选择'}));
  assert.equal((html.match(/<figcaption/g)||[]).length,1);
  assert.equal((html.match(/role="img"/g)||[]).length,2);
  assert.match(html,/aria-label="训练集；综合得分 92\.0 分/);
  assert.match(html,/aria-label="测试集；综合得分 80\.0 分/);
  assert.doesNotMatch(html,/请选择子数据集/);
});


test('bar tooltip uses the supplied lines for both hover and accessible readings',()=>{
  const tooltip='类别不一致\n扣分：0.1/100\n数量：2/2176\n百分比：0.09191%';
  const spec={type:'bar',series:[{label:'扣分',unit:'分'}],
    rows:[{id:'category',label:'类别不一致',values:[.0919117647],tooltip}]};
  const theme={ink:'#172338',muted:'#536174',grid:'#e2e8f0',surface:'#fff',font:'sans-serif',
    palette:['#285ed6'],tones:{},reducedMotion:true};
  const options=chartOptions(spec,theme);
  assert.equal(options.tooltip.formatter([{dataIndex:0}]),tooltip);
  assert.equal(options.tooltip.formatter({dataIndex:0}),tooltip);
  const html=renderToStaticMarkup(React.createElement(Chart,{title:'标注一致性扣分',spec}));
  assert.match(html,/类别不一致，扣分：0\.1\/100，数量：2\/2176，百分比：0\.09191%/);
});
