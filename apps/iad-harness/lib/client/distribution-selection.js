import { auditDistributionMetricLabels } from './audit-report.js';
import prepareBoxplotData from 'echarts/extension/dataTool/prepareBoxplotData.js';
function sumCounts(items) {
    const counts = {};
    for (const item of items)
        for (const [key, count] of Object.entries(item))
            counts[key] = (counts[key] || 0) + count;
    return counts;
}
export function selectDistribution(data, selected, names) {
    const slices = data.slices.filter(slice => slice.category === null && slice.dataset_id !== null && selected.includes(slice.dataset_id));
    if (!slices.length)
        return null;
    const first = slices[0];
    const areas = new Map();
    for (const slice of slices)
        for (const [category, values] of Object.entries(data.category_area_samples[slice.dataset_id] ?? {})) {
            const combined = areas.get(category) ?? [];
            for (const value of values)
                combined.push(value);
            areas.set(category, combined);
        }
    const categories = [...areas].filter(([, values]) => values.length > 0);
    const { boxData } = prepareBoxplotData(categories.map(([, values]) => values));
    const areaRows = categories.map(([category, values], index) => {
        const [low, q25, median, q75, high] = boxData[index];
        let minimum = Infinity, maximum = -Infinity, lower_whisker = Infinity, upper_whisker = -Infinity;
        const outliers = new Map();
        for (const value of values) {
            minimum = Math.min(minimum, value);
            maximum = Math.max(maximum, value);
            if (value < low || value > high)
                outliers.set(value, (outliers.get(value) ?? 0) + 1);
            else {
                lower_whisker = Math.min(lower_whisker, value);
                upper_whisker = Math.max(upper_whisker, value);
            }
        }
        return { id: category, label: category || '空标签', statistics: { minimum, maximum, q25, median, q75,
                lower_whisker, upper_whisker, count: values.length, outliers: [...outliers].sort(([a], [b]) => a - b) } };
    });
    const classes = new Map();
    for (const slice of slices)
        for (const row of slice.classes) {
            const previous = classes.get(row.category);
            classes.set(row.category, { category: row.category, image_count: (previous?.image_count || 0) + row.image_count,
                annotation_count: row.annotation_count === null ? null : (previous?.annotation_count || 0) + row.annotation_count });
        }
    return {
        image_count: slices.reduce((count, slice) => count + slice.image_count, 0),
        annotation_count: first.annotation_count === null ? null : slices.reduce((count, slice) => count + slice.annotation_count, 0),
        geometry_types: sumCounts(slices.map(slice => slice.geometry_types)),
        invalid_annotation_count: slices.reduce((count, slice) => count + slice.invalid_annotation_count, 0),
        unannotated_images: slices.reduce((count, slice) => count + slice.unannotated_images, 0),
        classes: [...classes.values()], instance_counts: sumCounts(slices.map(slice => slice.instance_counts)),
        quality: sumCounts(slices.map(slice => slice.quality)),
        metadata: Object.fromEntries(Object.keys(first.metadata).map(key => [key, sumCounts(slices.map(slice => slice.metadata[key]))])),
        heatmaps: Object.fromEntries(Object.entries(first.heatmaps).map(([key, heatmap]) => {
            const cells = new Map();
            for (const slice of slices)
                for (const [x, y, count] of slice.heatmaps[key].cells) {
                    const id = `${x},${y}`;
                    cells.set(id, [x, y, (cells.get(id)?.[2] || 0) + count]);
                }
            return [key, { x_edges: heatmap.x_edges, y_edges: heatmap.y_edges, cells: [...cells.values()] }];
        })),
        distributions: Object.fromEntries(Object.entries(first.histograms).map(([key, histogram]) => [key, [{
                    id: key, label: slices.length === 1 ? (names[first.dataset_id] || first.dataset_id) : '所选子数据集',
                    data: { edges: histogram.edges, counts: histogram.counts.map((_, index) => slices.reduce((sum, slice) => sum + slice.histograms[key].counts[index], 0)) },
                }]])),
        area_by_category: areaRows.length ? [{ id: 'category-area', label: auditDistributionMetricLabels.relative_area, rows: areaRows }] : [],
    };
}
