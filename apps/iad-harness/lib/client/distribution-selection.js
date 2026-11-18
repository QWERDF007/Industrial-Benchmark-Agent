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
        datasets: sumCounts(slices.map(slice => slice.datasets)), quality: sumCounts(slices.map(slice => slice.quality)),
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
        area_by_category: slices.flatMap(slice => slice.area_by_category.map(row => ({ id: JSON.stringify([slice.dataset_id, row.category]),
            label: slices.length === 1 ? row.category : `${row.category} / ${names[slice.dataset_id] || slice.dataset_id}`,
            statistics: row.statistics }))),
    };
}
