import React,{useId,useMemo,useState} from 'react';
import type {AuditDataDistribution,AuditRunReport} from '../../shared/domain.generated.js';
import {auditMetadataLabels,auditMetadataValue} from '../audit-report.js';
import {selectDistribution,type DistributionSelection} from '../distribution-selection.js';
import {Chart} from './charts/Chart.js';
import type {ChartSpec} from './charts/types.js';
import {AuditReportSection} from './AuditReportSection.js';
import {MultiSelect} from './Select.js';

const qualityNames:Record<string,string>={PASS:'良品',FAIL:'异常',UNCERTAIN:'未确定'};

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
  const className=(name:string)=>data?.dataset_format==='folder_classification'?qualityNames[name]||name:name||'空标签';
  const sources=Object.entries(overall?.metadata||{}).filter(([,values])=>Object.keys(values).some(value=>value&&value!=='UNKNOWN'));
  const unregistered=Object.entries(overall?.metadata||{}).filter(([,values])=>
    !Object.keys(values).some(value=>value&&value!=='UNKNOWN')).map(([key])=>auditMetadataLabels[key]||key);
  const scope=data?{data,names:report.dataset_names}:null;
  return <AuditReportSection section="distribution">
    {!data||!overall||!scope?<p>本作业尚无数据分布统计。</p>:<>
      <div className="iad-distribution-summary"><span>图像 {overall.image_count.toLocaleString('zh-CN')} 张</span>
        {overall.box_count!==null&&<><span>原始标注框 {overall.box_count.toLocaleString('zh-CN')} 个</span><span>无框图像 {overall.unannotated_images.toLocaleString('zh-CN')} 张</span>
          {!!overall.invalid_box_count&&<span>无效几何 {overall.invalid_box_count} 个</span>}</>}
      </div>
      {!!unregistered.length&&<p>未登记：{unregistered.join('、')}。</p>}
      <div className="iad-chart-grid">
        <DistributionPlot {...scope} id="class-distribution" title="类别分布" spec={view=>view.box_count===null&&view.classes.length<=5?{
          type:'donut',unit:'张',rows:view.classes.map(row=>({id:row.category,label:className(row.category),value:row.image_count})),
        }:{type:'bar',series:[{label:'图像',unit:'张'},...(view.box_count===null?[]:[{label:'标注框',unit:'个'}])],
          rows:view.classes.map(row=>({id:row.category,label:className(row.category),values:row.box_count===null?[row.image_count]:[row.image_count,row.box_count]}))}}/>
        <DistributionPlot {...scope} id="image-dimensions" title="图像宽高分布" spec={view=>({type:'heatmap',
          data:view.heatmaps.image_dimensions,xLabel:'图像宽度（像素）',yLabel:'图像高度（像素）'})}/>
        {overall.box_count!==null&&<DistributionPlot {...scope} id="box-dimensions" title="框宽高分布" spec={view=>({
          type:'heatmap',data:view.heatmaps.box_dimensions,xLabel:'框宽（像素）',yLabel:'框高（像素）'})}/>}
        {(['image_aspect_ratio','box_aspect_ratio','relative_area'] as const).filter(key=>overall.histograms[key]).map(key=>{
          const title={image_aspect_ratio:'图像长宽比',box_aspect_ratio:'框长宽比',relative_area:'框面积占比'}[key];
          return <DistributionPlot {...scope} key={key} id={key.replaceAll('_','-')} title={title} spec={view=>({
            type:'distribution',series:view.distributions[key],xLabel:title,unit:key==='image_aspect_ratio'?'张':'个',
            format:key==='relative_area'?'percent':'decimal'})}/>;
        })}
        {overall.box_count!==null&&<>
          <DistributionPlot {...scope} id="instance-counts" title="每图标注框数量" spec={view=>({type:'bar',series:[{label:'图像',unit:'张'}],
            rows:Object.entries(view.instance_counts).map(([count,value])=>({id:count,label:`${count} 个框`,values:[value]}))})}/>
          <DistributionPlot {...scope} id="box-centers" title="框中心位置分布" spec={view=>({type:'heatmap',
            data:view.heatmaps.box_centers,xLabel:'水平位置',yLabel:'垂直位置',format:'decimal',reverseY:true})}/>
          <DistributionPlot {...scope} id="category-area" title="各类别框面积占比" spec={view=>({type:'boxplot',format:'percent',rows:view.area_by_category})}/>
        </>}
        {['datasets',...sources.map(([key])=>key)].map(key=><DistributionPlot {...scope} key={key} id={`source-${key}`}
          title={`${key==='datasets'?'子数据集':auditMetadataLabels[key]||key}分布`} spec={view=>{
            const rows=Object.entries(key==='datasets'?view.datasets:view.metadata[key]).map(([name,value])=>({id:name,
              label:key==='datasets'?report.dataset_names[name]||name:auditMetadataValue(key,name),value}));
            return rows.length<=5?{type:'donut',unit:'张',rows}:{type:'bar',series:[{label:'图像',unit:'张'}],
              rows:rows.map(row=>({id:row.id,label:row.label,values:[row.value]}))};
          }}/>) }
      </div>
    </>}
  </AuditReportSection>;
}
