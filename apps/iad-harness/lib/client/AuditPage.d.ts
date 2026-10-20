import React from "react";
export interface TaskSummary {
    task_id: string;
    task_name: string;
    product: string;
    total_samples: number;
    feature_coverage_pct: number;
    total_decisions: number;
    total_suggestions: number;
    latest_build_id?: string;
}
export interface SampleItem {
    sample_id: string;
    task_id: string;
    batch_id?: string;
    data_origin: string;
    quality_status: string;
    has_vlm_observation: boolean;
    visual_suspicion_score?: number;
    technical_quality_score?: number;
    reviewed: boolean;
    review_decision?: string;
    suggestion?: {
        suggested_label: string;
        reason_category?: string;
        model_name?: string;
        notes?: string;
    };
}
export interface SampleAnnotation {
    annotation_id: string;
    sample_id: string;
    annotation_type: string;
    raw_label: string;
    phenomenon: string;
    bbox?: [number, number, number, number];
    source_width?: number;
    source_height?: number;
}
export interface TechnicalIssue {
    task_id: string;
    sample_id?: string;
    issue_type: string;
    severity: string;
    message: string;
}
export interface SampleDetailResponse {
    sample: {
        sample_id: string;
        task_id: string;
        dataset_id: string;
        image_path: string;
        relative_path?: string;
        quality_status: string;
        width?: number;
        height?: number;
        batch_id?: string;
        station?: string;
        camera?: string;
    };
    image_verified_path?: string;
    suggestion?: {
        suggestion_id?: string;
        suggested_label: string;
        reason_category?: string;
        model_name?: string;
        confidence?: number;
        notes?: string;
        created_at?: string;
    };
    visual_suspicion_score?: number;
    technical_quality_score?: number;
    annotations: SampleAnnotation[];
    technical_issues: TechnicalIssue[];
    review_decision?: {
        decision: string;
        reason?: string;
        reviewer?: string;
        reviewed_at?: string;
    };
}
export interface ReportSummary {
    task_id: string;
    task_name: string;
    product: string;
    total_samples: number;
    vlm_audited_count: number;
    vlm_coverage_pct: number;
    vlm_anomalies_count: number;
    technical_quality_issues: number;
    human_reviewed_count: number;
    human_pass_count: number;
    human_fail_count: number;
    human_uncertain_count: number;
    categories: Record<string, number>;
    batches: Record<string, number>;
    model_name: string;
    generated_at: string;
}
export declare function AuditPage(): React.JSX.Element;
//# sourceMappingURL=AuditPage.d.ts.map