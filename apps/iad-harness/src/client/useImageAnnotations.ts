import type {SampleDetail} from '../shared/contracts.js';
import type {AnnotationLayerSource} from './components/AnnotationLayer.js';
import type {ImageQualityLabel} from './dataset-image-annotations.js';
import {useResource} from './useResource.js';

export function useImageAnnotations(sampleId:string|undefined,source:AnnotationLayerSource|null|undefined,
  qualityLabel?:ImageQualityLabel):AnnotationLayerSource|undefined {
  const sample=useResource<SampleDetail>(sampleId && source===undefined && !qualityLabel
    ? '/sample/'+encodeURIComponent(sampleId) : null);
  return source===null?undefined:source || (sample.data
    ? {kind:'sample',sample:sample.data.sample,annotations:sample.data.annotations}:undefined);
}
