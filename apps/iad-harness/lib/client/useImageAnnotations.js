import { useResource } from './useResource.js';
export function useImageAnnotations(sampleId, source, qualityLabel) {
    const sample = useResource(sampleId && source === undefined && !qualityLabel
        ? '/sample/' + encodeURIComponent(sampleId) : null);
    return source === null ? undefined : source || (sample.data
        ? { kind: 'sample', sample: sample.data.sample, annotations: sample.data.annotations } : undefined);
}
