import React,{useId,useMemo,useState} from 'react';
import type {AuditDataDistribution,AuditRunReport} from '../../shared/domain.generated.js';
import {auditDistributionClassLabel,auditDistributionMetricLabels,auditMetadataLabels,auditMetadataValue} from '../audit-report.js';
import {selectDistribution,type DistributionSelection} from '../distribution-selection.js';
import {Chart} from './charts/Chart.js';
import {imageDimensionsChart} from './charts/image-dimensions.js';
import type {ChartSpec} from './charts/types.js';
import {AuditReportSection} from './AuditReportSection.js';
import {MultiSelect} from './Select.js';

function DistributionPlot({id,title,data,names,spec}:{id:string;title:string;data:AuditDataDistribution;
  names:AuditRunReport['dataset_names'];spec(view:DistributionSelection):ChartSpec}) {
  const selectorId=useId();
  const [selected,setSelected]=useState<readonly string[]>(data.datasets);
  const view=useMemo(()=>selectDistribution(data,selected,names),[data,selected,names]);
  return <Chart id={id} title={title} spec={view?spec(view):null} controls={<MultiSelect id={selectorId} label="子数据集"
    options={data.datasets.map(value=>({value,label:names[value]||value}))} selected={selected}
    onToggle={value=>setSelected(current=>current.includes(value)?current.filter(id=>id!==value):[...current,value])}/>}/>;
}

export function AuditReportDistribution({report}:{report:AuditRunReport}) {
  const data=report.data_distribution;
  const overall=data?.slices.find(item=>item.dataset_id===null&&item.category===null);
  const className=(name:string)=>auditDistributionClassLabel(name,data?.dataset_format==='folder_classification');
  const sources=Object.entries(overall?.metadata||{}).filter(([,values])=>Object.keys(values).some(value=>value&&value!=='UNKNOWN'));
  const scope=data?{data,names:report.dataset_names}:null;
  return <AuditReportSection section="distribution">
    {!!report.distribution_analysis&&<p>{report.distribution_analysis}</p>}
    {!data||!overall||!scope?<p>本作业尚无数据分布统计。</p>:<>
      <div className="iad-chart-pair">
        <DistributionPlot {...scope} id="image-counts" title={overall.annotation_count===null?'图像总数':'有标注与无标注图像数量'} spec={view=>({type:'donut',unit:'张',
          center:{label:'图像总数',value:view.image_count},rows:view.annotation_count===null
            ?[{id:'total',label:'全部图像',value:view.image_count}]:[
              {id:'annotated',label:'有标注',value:view.image_count-view.unannotated_images},
              {id:'unannotated',label:'无标注',value:view.unannotated_images,tone:'muted'},
            ]})}/>
        {overall.annotation_count!==null&&<Chart id="annotation-counts" title="各数据集标注实例数量" spec={{type:'bar',
          series:[{label:'标注实例',unit:'个'}],rows:data.slices.flatMap(slice=>
            slice.category===null&&slice.dataset_id!==null&&slice.annotation_count!==null
              ?[{id:slice.dataset_id,label:scope.names[slice.dataset_id]||slice.dataset_id,values:[slice.annotation_count]}]:[])}}/>}
      </div>
      <div className="iad-chart-grid">
        <DistributionPlot {...scope} id="class-distribution" title="类别分布" spec={view=>view.annotation_count===null&&view.classes.length<=5?{
          type:'donut',unit:'张',rows:view.classes.map(row=>({id:row.category,label:className(row.category),value:row.image_count})),
        }:{type:'bar',series:[{label:'图像',unit:'张'},...(view.annotation_count===null?[]:[{label:'标注实例',unit:'个'}])],
          rows:view.classes.map(row=>({id:row.category,label:className(row.category),values:row.annotation_count===null?[row.image_count]:[row.image_count,row.annotation_count]}))}}/>
        <DistributionPlot {...scope} id="image-dimensions" title="图像宽高分布" spec={view=>imageDimensionsChart(view.heatmaps.image_dimensions)}/>
        {overall.annotation_count!==null&&<DistributionPlot {...scope} id="box-dimensions" title="实例外接矩形宽高分布" spec={view=>({
          type:'heatmap',data:view.heatmaps.box_dimensions,xLabel:'外接矩形宽（像素）',yLabel:'外接矩形高（像素）'})}/>}
        {(['image_aspect_ratio','box_aspect_ratio','relative_area'] as const).filter(key=>overall.histograms[key]).map(key=>{
          const label=auditDistributionMetricLabels[key];
          return <DistributionPlot {...scope} key={key} id={key.replaceAll('_','-')} title={`${label}分布`} spec={view=>({
            type:'distribution',series:view.distributions[key],xLabel:label,unit:key==='image_aspect_ratio'?'张':'个',
            format:key==='relative_area'?'percent':'decimal'})}/>;
        })}
        {overall.annotation_count!==null&&<>
          <DistributionPlot {...scope} id="instance-counts" title="每张图像的标注实例数分布" spec={view=>({type:'bar',series:[{label:'图像',unit:'张'}],
            rows:Object.entries(view.instance_counts).map(([count,value])=>({id:count,label:`${count} 个实例`,values:[value]}))})}/>
          <DistributionPlot {...scope} id="box-centers" title="实例中心位置分布" spec={view=>({type:'heatmap',
            data:view.heatmaps.box_centers,xLabel:'水平位置',yLabel:'垂直位置',format:'decimal',reverseY:true})}/>
          <DistributionPlot {...scope} id="category-area" title="各类别实例面积占图像比例分布" spec={view=>({type:'boxplot',format:'percent',series:view.area_by_category})}/>
        </>}
        {sources.map(([key])=><DistributionPlot {...scope} key={key} id={`source-${key}`}
          title={`${auditMetadataLabels[key]||key}分布`} spec={view=>{
            const rows=Object.entries(view.metadata[key]).map(([name,value])=>({id:name,label:auditMetadataValue(key,name),value}));
            return rows.length<=5?{type:'donut',unit:'张',rows}:{type:'bar',series:[{label:'图像',unit:'张'}],
              rows:rows.map(row=>({id:row.id,label:row.label,values:[row.value]}))};
          }}/>) }
      </div>
    </>}
  </AuditReportSection>;
}
