import type { AnalysisAgentContext, AnalysisCatalog, AnalysisRegistration, AnalysisWorkerMaterials, AnalysisWorkflowSnapshot, AnalysisFinalizationContext, FrozenAnalysisDirection } from '../../shared/domain.generated.js';
export declare class AnalysisPromptContext {
    readonly onDemand: boolean;
    constructor(snapshot: AnalysisWorkflowSnapshot);
    catalog(catalog: AnalysisCatalog): {
        summary: import("../../shared/domain.generated.js").Summary6;
        limitations: import("../../shared/domain.generated.js").Limitations30;
        unresolved_questions: import("../../shared/domain.generated.js").UnresolvedQuestions;
        directions: {
            change_reason: import("../../shared/domain.generated.js").ChangeReason1;
            key_evidence: import("../../shared/domain.generated.js").KeyEvidence1;
            title: import("../../shared/domain.generated.js").Title24;
            instruction: import("../../shared/domain.generated.js").Instruction11;
            applies_to: import("../../shared/domain.generated.js").AppliesTo1;
            rationale: import("../../shared/domain.generated.js").Rationale1;
            limitations: import("../../shared/domain.generated.js").Limitations29;
            direction_id: import("../../shared/domain.generated.js").DirectionId7;
            dataset_ids: import("../../shared/domain.generated.js").DatasetIds9;
            predecessor_direction_ids: import("../../shared/domain.generated.js").PredecessorDirectionIds;
            evidence_counts: {
                support: number;
                counter: number;
            };
        }[];
        checks: {
            status: import("../../shared/domain.generated.js").Status23;
            independent_source_count: import("../../shared/domain.generated.js").IndependentSourceCount;
            suggested_status: import("../../shared/domain.generated.js").SuggestedStatus;
            support_limitations: import("../../shared/domain.generated.js").SupportLimitations2;
            assessment_reason: import("../../shared/domain.generated.js").AssessmentReason;
            change_reason: import("../../shared/domain.generated.js").ChangeReason;
            key_evidence: import("../../shared/domain.generated.js").KeyEvidence;
            title: import("../../shared/domain.generated.js").Title12;
            subject: import("../../shared/domain.generated.js").Subject3;
            location: import("../../shared/domain.generated.js").Location7;
            criterion: import("../../shared/domain.generated.js").Criterion3;
            allowed_variations: import("../../shared/domain.generated.js").AllowedVariations3;
            limitations: import("../../shared/domain.generated.js").Limitations23;
            check_id: import("../../shared/domain.generated.js").CheckId11;
            direction_refs: import("../../shared/domain.generated.js").DirectionRefs;
            dataset_ids: import("../../shared/domain.generated.js").DatasetIds8;
            predecessor_check_ids: import("../../shared/domain.generated.js").PredecessorCheckIds1;
            evidence_counts: {
                support: number;
                counter: number;
            };
        }[];
    };
    registrations(records: AnalysisRegistration[]): {
        sample: {
            sample_id: string;
            dataset_id: string | undefined;
            relative_path: string;
        };
        sampling_group: import("../../shared/domain.generated.js").SamplingGroup;
        dataset_format: import("../../shared/domain.generated.js").DatasetFormat3;
    }[];
    selectedDirections(directions: FrozenAnalysisDirection[]): {
        ref: import("../../shared/domain.generated.js").Ref;
        source: import("../../shared/domain.generated.js").Source2;
        source_title: import("../../shared/domain.generated.js").SourceTitle;
        source_instruction: import("../../shared/domain.generated.js").SourceInstruction;
        title: import("../../shared/domain.generated.js").Title3;
        instruction: import("../../shared/domain.generated.js").Instruction2;
        source_summary: import("../../shared/domain.generated.js").SourceSummary;
        source_limitations: import("../../shared/domain.generated.js").SourceLimitations;
        source_dataset_ids: import("../../shared/domain.generated.js").SourceDatasetIds;
        source_evidence_counts: {
            support: number;
            counter: number;
        };
    }[];
    context<T extends AnalysisAgentContext>(context: T): T | (Omit<T, "accepted_observations" | "completed_sample_ids" | "failed_sample_ids" | "media_progress"> & {
        context_policy: string;
        catalog: {
            summary: import("../../shared/domain.generated.js").Summary6;
            limitations: import("../../shared/domain.generated.js").Limitations30;
            unresolved_questions: import("../../shared/domain.generated.js").UnresolvedQuestions;
            directions: {
                change_reason: import("../../shared/domain.generated.js").ChangeReason1;
                key_evidence: import("../../shared/domain.generated.js").KeyEvidence1;
                title: import("../../shared/domain.generated.js").Title24;
                instruction: import("../../shared/domain.generated.js").Instruction11;
                applies_to: import("../../shared/domain.generated.js").AppliesTo1;
                rationale: import("../../shared/domain.generated.js").Rationale1;
                limitations: import("../../shared/domain.generated.js").Limitations29;
                direction_id: import("../../shared/domain.generated.js").DirectionId7;
                dataset_ids: import("../../shared/domain.generated.js").DatasetIds9;
                predecessor_direction_ids: import("../../shared/domain.generated.js").PredecessorDirectionIds;
                evidence_counts: {
                    support: number;
                    counter: number;
                };
            }[];
            checks: {
                status: import("../../shared/domain.generated.js").Status23;
                independent_source_count: import("../../shared/domain.generated.js").IndependentSourceCount;
                suggested_status: import("../../shared/domain.generated.js").SuggestedStatus;
                support_limitations: import("../../shared/domain.generated.js").SupportLimitations2;
                assessment_reason: import("../../shared/domain.generated.js").AssessmentReason;
                change_reason: import("../../shared/domain.generated.js").ChangeReason;
                key_evidence: import("../../shared/domain.generated.js").KeyEvidence;
                title: import("../../shared/domain.generated.js").Title12;
                subject: import("../../shared/domain.generated.js").Subject3;
                location: import("../../shared/domain.generated.js").Location7;
                criterion: import("../../shared/domain.generated.js").Criterion3;
                allowed_variations: import("../../shared/domain.generated.js").AllowedVariations3;
                limitations: import("../../shared/domain.generated.js").Limitations23;
                check_id: import("../../shared/domain.generated.js").CheckId11;
                direction_refs: import("../../shared/domain.generated.js").DirectionRefs;
                dataset_ids: import("../../shared/domain.generated.js").DatasetIds8;
                predecessor_check_ids: import("../../shared/domain.generated.js").PredecessorCheckIds1;
                evidence_counts: {
                    support: number;
                    counter: number;
                };
            }[];
        };
        registrations: {
            sample: {
                sample_id: string;
                dataset_id: string | undefined;
                relative_path: string;
            };
            sampling_group: import("../../shared/domain.generated.js").SamplingGroup;
            dataset_format: import("../../shared/domain.generated.js").DatasetFormat3;
        }[];
        selected_directions: {
            ref: import("../../shared/domain.generated.js").Ref;
            source: import("../../shared/domain.generated.js").Source2;
            source_title: import("../../shared/domain.generated.js").SourceTitle;
            source_instruction: import("../../shared/domain.generated.js").SourceInstruction;
            title: import("../../shared/domain.generated.js").Title3;
            instruction: import("../../shared/domain.generated.js").Instruction2;
            source_summary: import("../../shared/domain.generated.js").SourceSummary;
            source_limitations: import("../../shared/domain.generated.js").SourceLimitations;
            source_dataset_ids: import("../../shared/domain.generated.js").SourceDatasetIds;
            source_evidence_counts: {
                support: number;
                counter: number;
            };
        }[];
        progress: {
            completed: number;
            failed: number;
        };
        current_observations: import("../../shared/domain.generated.js").AcceptedObservations;
        media_progress: {
            sample_id: string;
            evidence_id: import("../../shared/domain.generated.js").EvidenceId16;
            state: import("../../shared/domain.generated.js").State11;
            source_error: import("../../shared/domain.generated.js").SourceError;
        }[];
    });
    worker(materials: AnalysisWorkerMaterials): AnalysisWorkerMaterials | {
        role: import("../../shared/domain.generated.js").Role13;
        job_id: import("../../shared/domain.generated.js").JobId5;
        registrations: import("../../shared/domain.generated.js").Registrations;
        context_policy: string;
        task: {
            round: import("../../shared/domain.generated.js").AnalysisRound;
            wave_id: import("../../shared/domain.generated.js").WaveId1;
            session_id: import("../../shared/domain.generated.js").SessionId4;
            catalog_revision: import("../../shared/domain.generated.js").CatalogRevision;
            report: import("../../shared/domain.generated.js").Report;
            reviewed: import("../../shared/domain.generated.js").Reviewed;
            catalog: {
                summary: import("../../shared/domain.generated.js").Summary6;
                limitations: import("../../shared/domain.generated.js").Limitations30;
                unresolved_questions: import("../../shared/domain.generated.js").UnresolvedQuestions;
                directions: {
                    change_reason: import("../../shared/domain.generated.js").ChangeReason1;
                    key_evidence: import("../../shared/domain.generated.js").KeyEvidence1;
                    title: import("../../shared/domain.generated.js").Title24;
                    instruction: import("../../shared/domain.generated.js").Instruction11;
                    applies_to: import("../../shared/domain.generated.js").AppliesTo1;
                    rationale: import("../../shared/domain.generated.js").Rationale1;
                    limitations: import("../../shared/domain.generated.js").Limitations29;
                    direction_id: import("../../shared/domain.generated.js").DirectionId7;
                    dataset_ids: import("../../shared/domain.generated.js").DatasetIds9;
                    predecessor_direction_ids: import("../../shared/domain.generated.js").PredecessorDirectionIds;
                    evidence_counts: {
                        support: number;
                        counter: number;
                    };
                }[];
                checks: {
                    status: import("../../shared/domain.generated.js").Status23;
                    independent_source_count: import("../../shared/domain.generated.js").IndependentSourceCount;
                    suggested_status: import("../../shared/domain.generated.js").SuggestedStatus;
                    support_limitations: import("../../shared/domain.generated.js").SupportLimitations2;
                    assessment_reason: import("../../shared/domain.generated.js").AssessmentReason;
                    change_reason: import("../../shared/domain.generated.js").ChangeReason;
                    key_evidence: import("../../shared/domain.generated.js").KeyEvidence;
                    title: import("../../shared/domain.generated.js").Title12;
                    subject: import("../../shared/domain.generated.js").Subject3;
                    location: import("../../shared/domain.generated.js").Location7;
                    criterion: import("../../shared/domain.generated.js").Criterion3;
                    allowed_variations: import("../../shared/domain.generated.js").AllowedVariations3;
                    limitations: import("../../shared/domain.generated.js").Limitations23;
                    check_id: import("../../shared/domain.generated.js").CheckId11;
                    direction_refs: import("../../shared/domain.generated.js").DirectionRefs;
                    dataset_ids: import("../../shared/domain.generated.js").DatasetIds8;
                    predecessor_check_ids: import("../../shared/domain.generated.js").PredecessorCheckIds1;
                    evidence_counts: {
                        support: number;
                        counter: number;
                    };
                }[];
            };
        };
        selected_directions: {
            ref: import("../../shared/domain.generated.js").Ref;
            source: import("../../shared/domain.generated.js").Source2;
            source_title: import("../../shared/domain.generated.js").SourceTitle;
            source_instruction: import("../../shared/domain.generated.js").SourceInstruction;
            title: import("../../shared/domain.generated.js").Title3;
            instruction: import("../../shared/domain.generated.js").Instruction2;
            source_summary: import("../../shared/domain.generated.js").SourceSummary;
            source_limitations: import("../../shared/domain.generated.js").SourceLimitations;
            source_dataset_ids: import("../../shared/domain.generated.js").SourceDatasetIds;
            source_evidence_counts: {
                support: number;
                counter: number;
            };
        }[];
        sources: {
            sample: {
                sample_id: string;
                dataset_id: string | undefined;
                relative_path: string;
            };
            sampling_group: import("../../shared/domain.generated.js").SamplingGroup;
            dataset_format: import("../../shared/domain.generated.js").DatasetFormat3;
        }[];
    };
    finalization(context: AnalysisFinalizationContext): AnalysisFinalizationContext | {
        base_revision: import("../../shared/domain.generated.js").BaseRevision8;
        reviewed_entry_ids: import("../../shared/domain.generated.js").ReviewedEntryIds;
        pending_entry_ids: import("../../shared/domain.generated.js").PendingEntryIds;
        direction_reviews: import("../../shared/domain.generated.js").DirectionReviews2;
        complete: import("../../shared/domain.generated.js").Complete5;
        version_id: import("../../shared/domain.generated.js").VersionId21;
        phase: import("../../shared/domain.generated.js").Phase6;
        job_id: import("../../shared/domain.generated.js").JobId7;
        session_id: import("../../shared/domain.generated.js").SessionId6;
        revision: import("../../shared/domain.generated.js").Revision9;
        coverage: import("../../shared/domain.generated.js").AnalysisCoverageSummary;
        entries: import("../../shared/domain.generated.js").Entries2;
        directions: import("../../shared/domain.generated.js").Directions14;
        summary: import("../../shared/domain.generated.js").Summary13;
        limitations: import("../../shared/domain.generated.js").Limitations55;
        unresolved_questions: import("../../shared/domain.generated.js").UnresolvedQuestions15;
        selected_directions: {
            ref: import("../../shared/domain.generated.js").Ref;
            source: import("../../shared/domain.generated.js").Source2;
            source_title: import("../../shared/domain.generated.js").SourceTitle;
            source_instruction: import("../../shared/domain.generated.js").SourceInstruction;
            title: import("../../shared/domain.generated.js").Title3;
            instruction: import("../../shared/domain.generated.js").Instruction2;
            source_summary: import("../../shared/domain.generated.js").SourceSummary;
            source_limitations: import("../../shared/domain.generated.js").SourceLimitations;
            source_dataset_ids: import("../../shared/domain.generated.js").SourceDatasetIds;
            source_evidence_counts: {
                support: number;
                counter: number;
            };
        }[];
    };
    review<T extends AnalysisAgentContext & {
        observation_catalog?: AnalysisCatalog;
    }>(context: T): T | (Omit<T, "accepted_observations" | "completed_sample_ids" | "failed_sample_ids" | "media_progress"> & {
        context_policy: string;
        catalog: {
            summary: import("../../shared/domain.generated.js").Summary6;
            limitations: import("../../shared/domain.generated.js").Limitations30;
            unresolved_questions: import("../../shared/domain.generated.js").UnresolvedQuestions;
            directions: {
                change_reason: import("../../shared/domain.generated.js").ChangeReason1;
                key_evidence: import("../../shared/domain.generated.js").KeyEvidence1;
                title: import("../../shared/domain.generated.js").Title24;
                instruction: import("../../shared/domain.generated.js").Instruction11;
                applies_to: import("../../shared/domain.generated.js").AppliesTo1;
                rationale: import("../../shared/domain.generated.js").Rationale1;
                limitations: import("../../shared/domain.generated.js").Limitations29;
                direction_id: import("../../shared/domain.generated.js").DirectionId7;
                dataset_ids: import("../../shared/domain.generated.js").DatasetIds9;
                predecessor_direction_ids: import("../../shared/domain.generated.js").PredecessorDirectionIds;
                evidence_counts: {
                    support: number;
                    counter: number;
                };
            }[];
            checks: {
                status: import("../../shared/domain.generated.js").Status23;
                independent_source_count: import("../../shared/domain.generated.js").IndependentSourceCount;
                suggested_status: import("../../shared/domain.generated.js").SuggestedStatus;
                support_limitations: import("../../shared/domain.generated.js").SupportLimitations2;
                assessment_reason: import("../../shared/domain.generated.js").AssessmentReason;
                change_reason: import("../../shared/domain.generated.js").ChangeReason;
                key_evidence: import("../../shared/domain.generated.js").KeyEvidence;
                title: import("../../shared/domain.generated.js").Title12;
                subject: import("../../shared/domain.generated.js").Subject3;
                location: import("../../shared/domain.generated.js").Location7;
                criterion: import("../../shared/domain.generated.js").Criterion3;
                allowed_variations: import("../../shared/domain.generated.js").AllowedVariations3;
                limitations: import("../../shared/domain.generated.js").Limitations23;
                check_id: import("../../shared/domain.generated.js").CheckId11;
                direction_refs: import("../../shared/domain.generated.js").DirectionRefs;
                dataset_ids: import("../../shared/domain.generated.js").DatasetIds8;
                predecessor_check_ids: import("../../shared/domain.generated.js").PredecessorCheckIds1;
                evidence_counts: {
                    support: number;
                    counter: number;
                };
            }[];
        };
        registrations: {
            sample: {
                sample_id: string;
                dataset_id: string | undefined;
                relative_path: string;
            };
            sampling_group: import("../../shared/domain.generated.js").SamplingGroup;
            dataset_format: import("../../shared/domain.generated.js").DatasetFormat3;
        }[];
        selected_directions: {
            ref: import("../../shared/domain.generated.js").Ref;
            source: import("../../shared/domain.generated.js").Source2;
            source_title: import("../../shared/domain.generated.js").SourceTitle;
            source_instruction: import("../../shared/domain.generated.js").SourceInstruction;
            title: import("../../shared/domain.generated.js").Title3;
            instruction: import("../../shared/domain.generated.js").Instruction2;
            source_summary: import("../../shared/domain.generated.js").SourceSummary;
            source_limitations: import("../../shared/domain.generated.js").SourceLimitations;
            source_dataset_ids: import("../../shared/domain.generated.js").SourceDatasetIds;
            source_evidence_counts: {
                support: number;
                counter: number;
            };
        }[];
        progress: {
            completed: number;
            failed: number;
        };
        current_observations: import("../../shared/domain.generated.js").AcceptedObservations;
        media_progress: {
            sample_id: string;
            evidence_id: import("../../shared/domain.generated.js").EvidenceId16;
            state: import("../../shared/domain.generated.js").State11;
            source_error: import("../../shared/domain.generated.js").SourceError;
        }[];
        observation_catalog?: {
            summary: import("../../shared/domain.generated.js").Summary6;
            limitations: import("../../shared/domain.generated.js").Limitations30;
            unresolved_questions: import("../../shared/domain.generated.js").UnresolvedQuestions;
            directions: {
                change_reason: import("../../shared/domain.generated.js").ChangeReason1;
                key_evidence: import("../../shared/domain.generated.js").KeyEvidence1;
                title: import("../../shared/domain.generated.js").Title24;
                instruction: import("../../shared/domain.generated.js").Instruction11;
                applies_to: import("../../shared/domain.generated.js").AppliesTo1;
                rationale: import("../../shared/domain.generated.js").Rationale1;
                limitations: import("../../shared/domain.generated.js").Limitations29;
                direction_id: import("../../shared/domain.generated.js").DirectionId7;
                dataset_ids: import("../../shared/domain.generated.js").DatasetIds9;
                predecessor_direction_ids: import("../../shared/domain.generated.js").PredecessorDirectionIds;
                evidence_counts: {
                    support: number;
                    counter: number;
                };
            }[];
            checks: {
                status: import("../../shared/domain.generated.js").Status23;
                independent_source_count: import("../../shared/domain.generated.js").IndependentSourceCount;
                suggested_status: import("../../shared/domain.generated.js").SuggestedStatus;
                support_limitations: import("../../shared/domain.generated.js").SupportLimitations2;
                assessment_reason: import("../../shared/domain.generated.js").AssessmentReason;
                change_reason: import("../../shared/domain.generated.js").ChangeReason;
                key_evidence: import("../../shared/domain.generated.js").KeyEvidence;
                title: import("../../shared/domain.generated.js").Title12;
                subject: import("../../shared/domain.generated.js").Subject3;
                location: import("../../shared/domain.generated.js").Location7;
                criterion: import("../../shared/domain.generated.js").Criterion3;
                allowed_variations: import("../../shared/domain.generated.js").AllowedVariations3;
                limitations: import("../../shared/domain.generated.js").Limitations23;
                check_id: import("../../shared/domain.generated.js").CheckId11;
                direction_refs: import("../../shared/domain.generated.js").DirectionRefs;
                dataset_ids: import("../../shared/domain.generated.js").DatasetIds8;
                predecessor_check_ids: import("../../shared/domain.generated.js").PredecessorCheckIds1;
                evidence_counts: {
                    support: number;
                    counter: number;
                };
            }[];
        } | undefined;
    });
}
//# sourceMappingURL=context.d.ts.map