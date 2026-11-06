export function datasetImageAnnotations(format, sample, annotations) {
    if (format === 'folder_classification')
        return { annotationLayer: null, qualityLabel: sample.quality_status === 'PASS' ? 'OK' : sample.quality_status === 'FAIL' ? 'NG' : undefined };
    if (format !== 'labelme')
        return {};
    return { annotationLayer: { kind: 'boxes', width: sample.width, height: sample.height,
            annotations: annotations.filter(annotation => annotation.bbox && annotation.geometry_status !== 'INVALID')
                .map(({ annotation_id, raw_label, bbox }) => ({ annotation_id, raw_label, bbox })) } };
}
