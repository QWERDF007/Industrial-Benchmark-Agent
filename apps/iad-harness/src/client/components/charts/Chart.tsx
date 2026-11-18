import React,{useEffect,useRef} from 'react';
import {init,use} from 'echarts/core';
import {BarChart,BoxplotChart,HeatmapChart,LineChart,PieChart,ScatterChart} from 'echarts/charts';
import {AriaComponent,GraphicComponent,GridComponent,LegendComponent,TooltipComponent,VisualMapComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import {chartOptions,chartReadings} from './options.js';
import type {ChartSpec,ChartTheme,ChartTone} from './types.js';

use([BarChart,BoxplotChart,HeatmapChart,LineChart,PieChart,ScatterChart,AriaComponent,
  GraphicComponent,GridComponent,LegendComponent,TooltipComponent,VisualMapComponent,SVGRenderer]);

export interface ChartPanel {label:string;spec:ChartSpec}

export function Chart({id,title,spec,panels,onSelect,description,controls}:{id?:string;title:string;spec:ChartSpec|null;
  panels?:readonly ChartPanel[];onSelect?(id:string):void;description?:string;controls?:React.ReactNode}) {
  const type=spec?.type??panels?.[0]?.spec.type;
  const chartType=useRef(type);
  if(type)chartType.current=type;
  return <figure className="iad-chart" data-chart={id||chartType.current} data-chart-type={chartType.current}>
    <figcaption>{title}{controls&&<div className="iad-chart-controls">{controls}</div>}</figcaption>
    {description&&<p className="iad-chart-description">{description}</p>}
    {panels?.length?<div className="iad-chart-panels">{panels.map(panel=><section key={panel.label}>
      <p className="iad-chart-panel-label">{panel.label}</p><ChartPlot title={panel.label} spec={panel.spec} onSelect={onSelect}/>
    </section>)}</div>:spec?<ChartPlot title={title} spec={spec} onSelect={onSelect}/>
      :<p className="iad-chart-empty" role="status">请选择子数据集</p>}
  </figure>;
}

function ChartPlot({title,spec,onSelect}:{title:string;spec:ChartSpec;onSelect?(id:string):void}) {
  const host=useRef<HTMLDivElement>(null);
  const current=useRef({spec,onSelect});current.current={spec,onSelect};
  const draw=useRef<()=>void>(()=>{});
  const summary=[title,...chartReadings(spec)].join('；').replaceAll('\n','，');
  useEffect(()=>{
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
  },[]);
  useEffect(()=>draw.current(),[spec]);
  return <div className="iad-chart-plot" ref={host} role="img" aria-label={summary}/>;
}
