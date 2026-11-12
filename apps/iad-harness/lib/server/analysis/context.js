export class AnalysisPromptContext {
    onDemand;
    constructor(snapshot) {
        this.onDemand = snapshot.context_policy === 'evidence-on-demand-v1';
    }
    catalog(catalog) {
        return { ...catalog,
            directions: catalog.directions.map(({ evidence_ids, counter_evidence_ids, ...body }) => ({ ...body,
                evidence_counts: { support: evidence_ids.length, counter: counter_evidence_ids.length } })),
            checks: catalog.checks.map(({ support_evidence_ids, counter_evidence_ids, ...body }) => ({ ...body,
                evidence_counts: { support: support_evidence_ids.length, counter: counter_evidence_ids.length } })) };
    }
    registrations(records) {
        return records.map(({ sample, sampling_group, dataset_format }) => ({ sample: {
                sample_id: sample.sample_id, dataset_id: sample.dataset_id, relative_path: sample.relative_path
            },
            sampling_group, dataset_format }));
    }
    selectedDirections(directions) {
        return directions.map(({ source_evidence_ids, source_counter_evidence_ids, ...direction }) => ({ ...direction,
            source_evidence_counts: { support: source_evidence_ids.length, counter: source_counter_evidence_ids.length } }));
    }
    context(context) {
        if (!this.onDemand)
            return context;
        const { completed_sample_ids, failed_sample_ids, accepted_observations, media_progress, ...current } = context;
        return { ...current, context_policy: 'evidence-on-demand-v1', catalog: this.catalog(context.catalog),
            registrations: this.registrations(context.registrations),
            selected_directions: this.selectedDirections(context.selected_directions),
            progress: { completed: completed_sample_ids.length, failed: failed_sample_ids.length },
            current_observations: accepted_observations,
            media_progress: media_progress.map(({ sample_id, evidence_id, state, source_error }) => ({ sample_id, evidence_id, state, source_error })) };
    }
    worker(materials) {
        if (!this.onDemand)
            return materials;
        return { ...materials, context_policy: 'evidence-on-demand-v1',
            task: { ...materials.task, catalog: this.catalog(materials.task.catalog) },
            selected_directions: this.selectedDirections(materials.selected_directions),
            sources: this.registrations(materials.sources) };
    }
    finalization(context) {
        return this.onDemand ? { ...context, selected_directions: this.selectedDirections(context.selected_directions) } : context;
    }
    review(context) {
        return this.onDemand ? { ...this.context(context),
            ...(context.observation_catalog ? { observation_catalog: this.catalog(context.observation_catalog) } : {}) } : context;
    }
}
