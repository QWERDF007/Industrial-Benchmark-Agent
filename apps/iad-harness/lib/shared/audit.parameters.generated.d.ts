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
        readonly description: "本次图级终稿的幂等键，仅同内容重传复用。";
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
                readonly description: "normal表示现有标注与可见图像相符，包括已正确标注的缺陷；suspect表示可见标注问题需复核；insufficient表示证据不足以判断标注是否正确。";
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
                readonly description: "本场实际打开并观察的完整原图ID，原始标注及全部局部视图属于该原图，不单独引用裁图或掩膜。";
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
                readonly description: "恰好覆盖全部已选check_id，各有观察原因；未选择知识时为空数组。";
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
                readonly description: "本图全部需要复核的标注问题，无疑点时为空数组，不按数量截断。";
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