import type {DistributionHeatmap} from '../../../shared/domain.generated.js';
import type {ChartSpec} from './types.js';

export function imageDimensionsChart(data:DistributionHeatmap):ChartSpec {
  return {type:'heatmap',data,xLabel:'图像宽度（像素）',yLabel:'图像高度（像素）'};
}
