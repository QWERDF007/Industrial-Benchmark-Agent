import type {Annotation,Sample} from '../shared/domain.generated.js';
import type {Dataset} from '../shared/contracts.js';
import type {AnnotationLayerSource} from './components/AnnotationLayer.js';

export type ImageQualityLabel='OK'|'NG';
export interface DatasetImageAnnotations {annotationLayer?:AnnotationLayerSource|null;qualityLabel?:ImageQualityLabel}

export function datasetImageAnnotations(format:Dataset['format']|undefined,sample:Pick<Sample,'width'|'height'|'quality_status'>,
  annotations:Annotation[]):DatasetImageAnnotations {
  if(format==='folder_classification')return {annotationLayer:null,qualityLabel:sample.quality_status==='PASS'?'OK':sample.quality_status==='FAIL'?'NG':undefined};
  if(format!=='labelme')return {};
  return {annotationLayer:{kind:'boxes',width:sample.width,height:sample.height,
    annotations:annotations.filter(annotation=>annotation.geometry_status!=='INVALID'&&(annotation.bbox||annotation.polygon))}};
}
