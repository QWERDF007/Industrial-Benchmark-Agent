export declare const consistencyAgentStartParameters: {
    readonly mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "combined"];
        readonly title: "Mode";
        readonly default: "combined";
    };
    readonly min_similarity: {
        readonly type: "number";
        readonly title: "Min Similarity";
        readonly default: 0.98;
    };
    readonly max_exact_candidates: {
        readonly type: "integer";
        readonly title: "Max Exact Candidates";
        readonly default: 5;
    };
    readonly max_similar_candidates: {
        readonly type: "integer";
        readonly title: "Max Similar Candidates";
        readonly default: 10;
    };
    readonly submission_id: {
        readonly type: "string";
        readonly description: "本次新建检查的稳定提交ID；重传使用同一ID，主动新建使用新ID";
        readonly title: "Submission Id";
        readonly required: true;
    };
    readonly dataset_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Dataset Ids";
        readonly required: true;
    };
    readonly analysis_kind: {
        readonly type: "string";
        readonly enum: readonly ["consistency"];
        readonly title: "Analysis Kind";
        readonly default: "consistency";
    };
    readonly instruction: {
        readonly type: "string";
        readonly title: "Instruction";
        readonly default: "执行数据一致性审核。仅以通过同内容验证的候选比较原始标注，保留主图相对于候选图的全部独立差异、实际证据与限制，不裁决哪侧标注正确。";
    };
    readonly system_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "System Prompt";
    };
    readonly subjects: {
        readonly oneOf: readonly [{
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["all_registered"];
                        readonly title: "Kind";
                        readonly default: "all_registered";
                    };
                };
                readonly title: "AllRegisteredScope";
            }, {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["datasets"];
                        readonly title: "Kind";
                        readonly default: "datasets";
                    };
                    readonly dataset_ids: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly title: "Dataset Ids";
                        readonly required: true;
                    };
                };
                readonly title: "DatasetScope";
            }, {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["samples"];
                        readonly title: "Kind";
                        readonly default: "samples";
                    };
                    readonly sample_ids: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly title: "Sample Ids";
                        readonly required: true;
                    };
                };
                readonly title: "SampleScope";
            }, {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["filtered"];
                        readonly title: "Kind";
                        readonly default: "filtered";
                    };
                    readonly dataset_id: {
                        readonly type: "string";
                        readonly title: "Dataset Id";
                        readonly required: true;
                    };
                    readonly filters: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly raw_label_filters: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                    readonly enum: readonly ["PASS", "FAIL", "UNCERTAIN"];
                                };
                                readonly title: "Raw Label Filters";
                            };
                            readonly annotation_filters: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly title: "Annotation Filters";
                            };
                            readonly model_status: {
                                readonly type: "string";
                                readonly enum: readonly ["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"];
                                readonly title: "Model Status";
                                readonly default: "all";
                            };
                            readonly review_status: {
                                readonly type: "string";
                                readonly enum: readonly ["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"];
                                readonly title: "Review Status";
                                readonly default: "all";
                            };
                            readonly technical: {
                                readonly type: "string";
                                readonly enum: readonly ["all", "issues"];
                                readonly title: "Technical";
                                readonly default: "all";
                            };
                            readonly reference_status: {
                                readonly type: "string";
                                readonly enum: readonly ["all", "candidate", "excluded"];
                                readonly title: "Reference Status";
                                readonly default: "all";
                            };
                            readonly search: {
                                readonly type: "string";
                                readonly title: "Search";
                                readonly default: "";
                            };
                            readonly sort_by: {
                                readonly type: "string";
                                readonly enum: readonly ["default", "risk", "tech"];
                                readonly title: "Sort By";
                                readonly default: "default";
                            };
                        };
                        readonly title: "SampleFilters";
                    };
                };
                readonly title: "FilteredScope";
            }];
        }, {
            readonly type: "null";
        }];
        readonly title: "Subjects";
    };
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["all_registered"];
                        readonly title: "Kind";
                        readonly default: "all_registered";
                    };
                };
                readonly title: "AllRegisteredScope";
            }, {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["datasets"];
                        readonly title: "Kind";
                        readonly default: "datasets";
                    };
                    readonly dataset_ids: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly title: "Dataset Ids";
                        readonly required: true;
                    };
                };
                readonly title: "DatasetScope";
            }];
        }, {
            readonly type: "null";
        }];
        readonly title: "Corpus Scope";
    };
};
export declare const consistencyAnchorReferenceParameters: {
    readonly run_id: {
        readonly type: "string";
        readonly title: "Run Id";
        readonly required: true;
    };
    readonly anchor_id: {
        readonly type: "string";
        readonly title: "Anchor Id";
        readonly required: true;
    };
};
export declare const consistencyCheckResultsQueryParameters: {
    readonly run_id: {
        readonly type: "string";
        readonly title: "Run Id";
        readonly required: true;
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
        readonly required: true;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 18;
        readonly required: true;
    };
};
export declare const consistencyCheckReferenceParameters: {
    readonly run_id: {
        readonly type: "string";
        readonly title: "Run Id";
        readonly required: true;
    };
};
export declare const anchorVisualStartParameters: {
    readonly request_id: {
        readonly type: "string";
        readonly description: "request_id标识完整的视觉请求；复用已保存观察须保持原始参数，改变question、candidate_ids或windows时须使用新的request_id。";
        readonly title: "Request Id";
        readonly required: true;
    };
    readonly fingerprint: {
        readonly type: "string";
        readonly description: "上下文提供的当前冻结清单指纹。";
        readonly title: "Fingerprint";
        readonly required: true;
    };
    readonly candidate_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "完整使用上下文中一个冻结页的候选集合，不拆页、不跨页拼接。";
        readonly title: "Candidate Ids";
        readonly required: true;
    };
    readonly question: {
        readonly type: "string";
        readonly title: "Question";
        readonly required: true;
    };
    readonly windows: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly sample_id: {
                    readonly type: "string";
                    readonly title: "Sample Id";
                    readonly required: true;
                };
                readonly bbox: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "integer";
                    };
                    readonly description: "原图像素半开窗口[x0,y0,x1,y1)";
                    readonly title: "Bbox";
                    readonly required: true;
                };
                readonly padding: {
                    readonly type: "integer";
                    readonly description: "四侧扩边的像素数，实际窗口裁至原图画布";
                    readonly title: "Padding";
                    readonly default: 0;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "VisualWindow";
        };
        readonly title: "Windows";
    };
};
export declare const anchorContextQueryParameters: {
    readonly candidate_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Candidate Id";
    };
};
export declare const anchorAssessmentInputParameters: {
    readonly fingerprint: {
        readonly type: "string";
        readonly description: "当前冻结清单指纹。";
        readonly title: "Fingerprint";
        readonly required: true;
    };
    readonly observation_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "本场已保存且实际包含当前候选的视觉观察回执。";
        readonly title: "Observation Ids";
        readonly required: true;
    };
    readonly assessment: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly candidate_id: {
                readonly type: "string";
                readonly title: "Candidate Id";
                readonly required: true;
            };
            readonly verdict: {
                readonly type: "string";
                readonly enum: readonly ["EQUIVALENT", "MATERIAL", "UNCERTAIN"];
                readonly description: "MATERIAL存在差异；EQUIVALENT一致；UNCERTAIN为合格候选的标注审核证据不足。";
                readonly title: "Verdict";
                readonly required: true;
            };
            readonly explanation: {
                readonly type: "string";
                readonly description: "当前候选的标注比对分析";
                readonly title: "Explanation";
                readonly required: true;
            };
            readonly findings: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "当前候选的具体发现";
                readonly title: "Findings";
            };
            readonly issues: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly description: {
                            readonly type: "string";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly media_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "实际观察的两侧原图身份各一次。";
                            readonly title: "Media Ids";
                            readonly required: true;
                        };
                        readonly limitations: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Limitations";
                        };
                        readonly review_suggestion: {
                            readonly type: "string";
                            readonly title: "Review Suggestion";
                            readonly default: "人工核对两侧原始标注及标注规范。";
                        };
                        readonly type: {
                            readonly type: "string";
                            readonly enum: readonly ["category_mismatch", "extra_annotation", "missing_annotation", "position_difference", "split", "merge"];
                            readonly title: "Type";
                            readonly required: true;
                        };
                        readonly main_annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Main Annotation Ids";
                        };
                        readonly candidate_annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Candidate Annotation Ids";
                        };
                    };
                    readonly title: "BboxAnnotationIssue";
                };
                readonly description: "MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。";
                readonly title: "Issues";
            };
        };
        readonly title: "AnchorAssessmentDecision";
        readonly required: true;
    };
};
export declare const anchorReviewSubmissionParameters: {
    readonly fingerprint: {
        readonly type: "string";
        readonly description: "当前冻结清单指纹。";
        readonly title: "Fingerprint";
        readonly required: true;
    };
    readonly assessment_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly description: "恰好包含全部冻结候选的最新评估回执ID，不引用旧版本或其他主图评估。";
        readonly title: "Assessment Ids";
        readonly required: true;
    };
};
//# sourceMappingURL=consistency-agent.parameters.generated.d.ts.map