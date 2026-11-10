import { workbenchJsonOutput } from '../tool-output.js';
export const analysisJobOutput = {
    ...workbenchJsonOutput,
    render(_args, value) {
        const job = value;
        return [{ type: 'text', text: JSON.stringify({ run_id: job.run_id, dataset_ids: job.dataset_ids,
                    analysis_kind: job.analysis_kind, status: job.status, model_name: job.model_name, phase: job.phase,
                    total_samples: job.total_samples, completed: job.completed, failed: job.failed, unprocessed: job.unprocessed,
                    analysis_version_id: job.analysis_version_id, execution_error: job.execution_error,
                    error_count: job.errors.length, errors: job.errors.slice(0, 3) }) }];
    },
};
