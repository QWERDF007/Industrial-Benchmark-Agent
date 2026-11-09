export declare const auditEvidenceParameters: {
    readonly run_id: {
        readonly type: "string";
        readonly title: "Run Id";
    };
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
    };
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
    readonly suggestion_id: {
        readonly type: "string";
        readonly title: "Suggestion Id";
    };
};
export declare const auditCommitParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly final: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly state: {
                readonly type: "string";
                readonly enum: readonly ["normal", "suspect", "insufficient"];
                readonly title: "State";
                readonly required: true;
            };
            readonly analysis: {
                readonly type: "string";
                readonly title: "Analysis";
                readonly required: true;
            };
            readonly conclusion: {
                readonly type: "string";
                readonly title: "Conclusion";
                readonly required: true;
            };
            readonly basis: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Basis";
                readonly required: true;
            };
            readonly evidence_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Evidence Ids";
                readonly required: true;
            };
            readonly check_assessments: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly check_id: {
                            readonly type: "string";
                            readonly title: "Check Id";
                            readonly required: true;
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: readonly ["consistent", "deviates", "unobservable", "not_applicable"];
                            readonly title: "Status";
                            readonly required: true;
                        };
                        readonly description: {
                            readonly type: "string";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly evidence_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                    };
                    readonly title: "AuditCheckAssessment";
                };
                readonly title: "Check Assessments";
                readonly required: true;
            };
            readonly findings: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly finding_id: {
                            readonly type: "string";
                            readonly title: "Finding Id";
                            readonly required: true;
                        };
                        readonly description: {
                            readonly type: "string";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly location: {
                            readonly type: "string";
                            readonly title: "Location";
                            readonly required: true;
                        };
                        readonly check_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Check Ids";
                        };
                        readonly evidence_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                        readonly normal_explanation: {
                            readonly type: "string";
                            readonly title: "Normal Explanation";
                            readonly required: true;
                        };
                        readonly limitations: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Limitations";
                            readonly required: true;
                        };
                    };
                    readonly title: "AuditFinding";
                };
                readonly title: "Findings";
                readonly required: true;
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Limitations";
                readonly required: true;
            };
        };
        readonly title: "AuditFinal";
        readonly required: true;
    };
};
export declare const auditCropParameters: {
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
    readonly offset: {
        readonly type: "integer";
        readonly title: "Offset";
        readonly default: 0;
    };
    readonly limit: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Limit";
    };
    readonly bbox: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly title: "Bbox";
        readonly required: true;
    };
};
export declare const auditStartParameters: {
    readonly submission_id: {
        readonly type: "string";
        readonly title: "Submission Id";
        readonly required: true;
    };
    readonly subset_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Subset Ids";
        readonly required: true;
    };
    readonly consistency_job_id: {
        readonly type: "string";
        readonly title: "Consistency Job Id";
        readonly required: true;
    };
    readonly knowledge: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly job_id: {
                    readonly type: "string";
                    readonly title: "Job Id";
                    readonly required: true;
                };
                readonly version_id: {
                    readonly type: "string";
                    readonly title: "Version Id";
                    readonly required: true;
                };
                readonly entry_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Entry Ids";
                    readonly required: true;
                };
            };
            readonly title: "AuditKnowledgeSelection";
        }, {
            readonly type: "null";
        }];
    };
    readonly instruction: {
        readonly type: "string";
        readonly title: "Instruction";
        readonly default: "逐图分析原图、人工标注区域、所选知识和一致性结果，给出本图的分析、结论及需要复核的现象。";
    };
    readonly system_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "System Prompt";
    };
};
//# sourceMappingURL=audit.parameters.generated.d.ts.map