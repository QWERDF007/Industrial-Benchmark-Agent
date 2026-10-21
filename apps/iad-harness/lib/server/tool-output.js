import { toolPresentation } from "../shared/tool-presentation.js";
export const workbenchJsonOutput = {
    schema: { type: "json" },
    presentationMeta(_args, value) { return toolPresentation(value); },
    render(_args, value) {
        return [{ type: "text", text: JSON.stringify(value, (key, item) => ["mining_steps", "verification_steps", "joint_steps", "model_calls", "request", "input_sources", "generation_signature"].includes(key) ? undefined : item) }];
    },
};
export const datasetDiscoveryOutput = {
    ...workbenchJsonOutput,
    render(args, value) {
        if (!value || typeof value !== "object" || Array.isArray(value))
            throw new Error("Expected dataset metadata");
        const records = Array.isArray(value.datasets) ? value.datasets : [value];
        const summaries = records.map(record => {
            if (!record || typeof record !== "object" || Array.isArray(record))
                throw new Error("Expected dataset metadata");
            const { dataset_id, task_id, name, format, total_samples, annotation_count, image_dir, annotation_dir, reference_mode, reference_sample_ids } = record;
            return { dataset_id, task_id, name, format, total_samples, annotation_count, image_dir, annotation_dir,
                reference_mode, reference_source_count: Array.isArray(reference_sample_ids) ? reference_sample_ids.length : 0 };
        });
        return workbenchJsonOutput.render(args, Array.isArray(value.datasets) ? { datasets: summaries } : summaries[0]);
    },
};
