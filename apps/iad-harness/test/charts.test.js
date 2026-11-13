import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Chart} from '../lib/client/components/charts/Chart.js';

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
  const box=renderToStaticMarkup(React.createElement(Chart,{title:'框面积占比',spec:{type:'boxplot',format:'percent',rows:[{
    id:'edge',label:'边缘',statistics:{minimum:.005,q25:.01,median:.02,q75:.03,maximum:.9,
      lower_whisker:.005,upper_whisker:.04,count:10,outliers:[[.9,1]]}}]}}));
  assert.match(box,/data-chart-type="boxplot"/);
  assert.match(box,/aria-label="[^"]*中位数：2%/);
  assert.match(box,/离群/);
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
