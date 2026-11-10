import React,{useEffect,useRef,useMemo} from 'react';
import {init,use} from 'echarts/core';
import {BarChart,PieChart} from 'echarts/charts';
import {TooltipComponent,LegendComponent,GridComponent,AriaComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import type {AuditRunReport} from '../../shared/domain.generated.js';
import {auditReportCharts,type AuditReportChart} from '../audit-report-charts.js';

use([BarChart,PieChart,TooltipComponent,LegendComponent,GridComponent,AriaComponent,SVGRenderer]);

function Chart({chart}:{chart:AuditReportChart}) {
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const element=root.current!,view=init(element,undefined,{renderer:'svg',locale:'ZH'});
    view.setOption({...chart.option,aria:{enabled:true,label:{description:chart.summary}}});
    const resize=new ResizeObserver(()=>view.resize());resize.observe(element);
    return ()=>{resize.disconnect();view.dispose();};
  },[chart]);
  return <figure className="iad-audit-chart" data-chart={chart.key}><figcaption>{chart.title}</figcaption>
    <div ref={root} className="iad-audit-chart-canvas" role="img" aria-label={chart.summary}/></figure>;
}

export function AuditReportCharts({report,keys}:{report:AuditRunReport;keys:readonly string[]}) {
  const charts=useMemo(()=>auditReportCharts(report),[report]);
  return <div className="iad-audit-charts">{charts.filter(chart=>keys.includes(chart.key)).map(chart=><Chart key={chart.key} chart={chart}/>)}</div>;
}
