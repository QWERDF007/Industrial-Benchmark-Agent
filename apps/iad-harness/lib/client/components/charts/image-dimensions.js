export function imageDimensionsChart(data) {
    return { type: 'heatmap', data, xLabel: '图像宽度（像素）', yLabel: '图像高度（像素）' };
}
