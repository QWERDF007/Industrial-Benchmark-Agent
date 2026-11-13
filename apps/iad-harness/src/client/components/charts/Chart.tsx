import React,{useEffect,useRef} from 'react';
import {init,use} from 'echarts/core';
import {BarChart,BoxplotChart,HeatmapChart,LineChart,PieChart,ScatterChart} from 'echarts/charts';
import {AriaComponent,GraphicComponent,GridComponent,LegendComponent,TooltipComponent,VisualMapComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import {chartOptions,chartReadings} from './options.js';
import type {ChartSpec,ChartTheme,ChartTone} from './types.js';

use([BarChart,BoxplotChart,HeatmapChart,LineChart,PieChart,ScatterChart,AriaComponent,
  GraphicComponent,GridComponent,LegendComponent,TooltipComponent,VisualMapComponent,SVGRenderer]);

export function Chart({id,title,spec,onSelect,description,controls}:{id?:string;title:string;spec:ChartSpec|null;
  onSelect?(id:string):void;description?:string;controls?:React.ReactNode}) {
  const host=useRef<HTMLDivElement>(null);
  const chartType=useRef(spec?.type);
  if(spec)chartType.current=spec.type;
  const current=useRef({spec,onSelect});current.current={spec,onSelect};
  const draw=useRef<()=>void>(()=>{});
  const hasData=spec!==null;
  const summary=[title,...(spec?chartReadings(spec):[])].join('；').replaceAll('\n','，');
  useEffect(()=>{
    if(!hasData)return;
    const element=host.current!;
    const chart=init(element,undefined,{renderer:'svg'});
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const render=()=>{
      const style=getComputedStyle(element);
      const color=(name:string)=>style.getPropertyValue(`--iad-chart-${name}`).trim();
      const tones=Object.fromEntries((['primary','success','warning','danger','muted'] as ChartTone[]).map(name=>[name,color(name)])) as ChartTheme['tones'];
      const theme:ChartTheme={ink:color('ink'),muted:color('muted'),grid:color('grid'),surface:color('surface'),
        font:style.fontFamily,tones,palette:[tones.primary,tones.success,tones.warning,tones.danger,color('secondary'),tones.muted],reducedMotion:motion.matches};
      if(current.current.spec)chart.setOption(chartOptions(current.current.spec,theme),{notMerge:true});
    };
    draw.current=render;render();
    chart.on('click',(event:unknown)=>{
      if(event&&typeof event==='object'&&'data' in event&&event.data&&typeof event.data==='object'&&'id' in event.data&&typeof event.data.id==='string')
        current.current.onSelect?.(event.data.id);
    });
    const resize=new ResizeObserver(()=>chart.resize());resize.observe(element);
    const themeChanges=new MutationObserver(render);
    for(let parent=element.parentElement;parent;parent=parent.parentElement)
      themeChanges.observe(parent,{attributes:true,attributeFilter:['class','style','data-ds-dark-theme']});
    motion.addEventListener('change',render);
    return()=>{resize.disconnect();themeChanges.disconnect();motion.removeEventListener('change',render);
      draw.current=()=>{};chart.dispose();};
  },[hasData]);
  useEffect(()=>draw.current(),[spec]);
  return <figure className="iad-chart" data-chart={id||chartType.current} data-chart-type={chartType.current}>
    <figcaption>{title}{controls&&<div className="iad-chart-controls">{controls}</div>}</figcaption>
    {description&&<p className="iad-chart-description">{description}</p>}
    {spec?<div className="iad-chart-plot" ref={host} role="img" aria-label={summary}/>:<p className="iad-chart-empty" role="status">请选择子数据集</p>}
  </figure>;
}
