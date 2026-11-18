import type {AuditRunReport,QualityScoreItem} from '../shared/domain.generated.js';
import {auditDistributionClassLabel,auditDistributionMetricLabels,auditMetadataLabels,auditMetadataValue} from './audit-report.js';
import {chartNumber} from './components/charts/options.js';
import type {ChartFormat} from './components/charts/types.js';

const intervalLabels:Record<string,readonly [string,string?,string?,ChartFormat?]>={
  image_dimensions:['图像宽','图像高','像素'],box_dimensions:['实例外接矩形宽','实例外接矩形高','像素'],
  relative_box_dimensions:['实例相对宽度','实例相对高度',undefined,'percent'],box_centers:['水平位置','垂直位置'],
  image_aspect_ratio:[auditDistributionMetricLabels.image_aspect_ratio],
  box_aspect_ratio:[auditDistributionMetricLabels.box_aspect_ratio],
  relative_area:[auditDistributionMetricLabels.relative_area,undefined,undefined,'percent'],
};

function scoreReadings(item:QualityScoreItem,maximum:string):string[] {
  return [item.label,`扣分：${chartNumber(item.deduction,'score')}/${maximum}`,
    ...(item.base_deduction!=null?[`基础扣分：${chartNumber(item.base_deduction,'score')}`]:[]),
    ...(item.impact_coefficient!=null?[`影响系数：${chartNumber(item.impact_coefficient,'decimal')}`]:[])];
}

export function consistencyScoreReading(item:QualityScoreItem):string {
  const count=item.charged_count??item.count;
  const readings=scoreReadings(item,item.dimension==='consistency'?'100':chartNumber(item.maximum,'score'));
  if(item.denominator>0){
    readings.push(`${item.charged_count!=null?'计分图像':'数量'}：${chartNumber(count)}/${chartNumber(item.denominator)}`);
  }
  if(item.pair_count!=null)readings.push(item.charged_count!=null?`问题图对：${chartNumber(item.pair_count)}`
    :`计分图对：${item.pair_count}/${item.compared_pairs}`);
  const ratio=item.charged_count!=null?(item.denominator?count/item.denominator:null):item.ratio;
  if(ratio!=null)readings.push(`百分比：${chartNumber(ratio,'percent')}`);
  return readings.join('\n');
}

export function distributionScoreReading(item:QualityScoreItem):string {
  return scoreReadings(item,chartNumber(item.maximum,'score')).join('\n');
}

export function distributionScoreDetails(item:QualityScoreItem,report:Pick<AuditRunReport,'dataset_names'|'data_distribution'>):string[] {
  const readings:string[]=[];
  for(const evidence of item.distribution_evidence??[]){
    const {metric,bucket,x_range,y_range,image_count,annotation_count,image_denominator,annotation_denominator}=evidence;
    let subject:string;
    if(x_range){
      const [x,y,unit,format='decimal']=intervalLabels[metric]??[metric];
      const range=([start,end]:readonly number[])=>`${chartNumber(start,format)}–${chartNumber(end,format)}${unit?' '+unit:''}`;
      subject=`${x} ${range(x_range)}${y_range&&y?`，${y} ${range(y_range)}`:''}`;
    }else if(bucket!=null){
      if(metric==='category')subject=auditDistributionClassLabel(bucket,report.data_distribution?.dataset_format==='folder_classification');
      else if(metric==='每图实例数')subject=`每图 ${bucket} 个实例`;
      else if(metric==='dataset_id')subject=`子数据集 ${report.dataset_names[bucket]||bucket}`;
      else subject=auditMetadataLabels[metric]?`${auditMetadataLabels[metric]} ${auditMetadataValue(metric,bucket)}`:bucket;
    }else continue;
    const quantities=[...(image_count!=null?[`图像 ${chartNumber(image_count)}${image_denominator
      ?`/${chartNumber(image_denominator)} 张（${chartNumber(image_count/image_denominator,'percent')}）`:' 张'}`]:[]),
      ...(annotation_count!=null?[`标注实例 ${chartNumber(annotation_count)}${annotation_denominator
      ?`/${chartNumber(annotation_denominator)} 个（${chartNumber(annotation_count/annotation_denominator,'percent')}）`:' 个'}`]:[])];
    if(evidence.deduction!=null)quantities.push(`扣分 ${chartNumber(evidence.deduction,'score')}`);
    if(quantities.length)readings.push(`${subject}：${quantities.join('，')}`);
  }
  return readings;
}
