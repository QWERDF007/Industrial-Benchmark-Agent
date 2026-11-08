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
        readonly default: "逐张比较主图与候选图的图像和原始标注，分析主图相对于当前候选图的标注差异。实例标注比较类别、数量、位置和覆盖范围；图像级标注直接比较两侧图像标签。类别不同为类别不一致；主图比候选图多标为多类别，少标为少类别；标注位置或范围不同为位置差异；主图把候选图的一个对象标成多个实例为拆分，反过来为合并；没有差异为一致。位置与范围差异按原始坐标说明，框宽为x_max-x_min，框高为y_max-y_min，明确主图相对于候选图的方向。给出主要结论，并在分析中说明对应的对象、区域及实际差异。通过工具执行审核时，先读取本场图像和标注，按冻结页观察并逐候选保存评估，最后引用全部评估记录提交结果。收到图像输入时，逐候选返回JSON观察结果，格式为{\"observations\":[{\"candidate_id\":\"候选ID\",\"description\":\"图像与标注的分析\",\"media_ids\":[\"实际图像ID\"],\"limitations\":[]}]}。";
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
        readonly title: "Fingerprint";
        readonly required: true;
    };
    readonly candidate_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
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
        readonly title: "Fingerprint";
        readonly required: true;
    };
    readonly observation_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
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
                readonly enum: readonly ["EQUIVALENT", "MATERIAL"];
                readonly description: "当前候选的标注比对结论：MATERIAL表示存在差异，EQUIVALENT表示一致";
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
            readonly categories: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["类别不一致", "位置差异", "多类别", "少类别", "拆分", "合并"];
                };
                readonly description: "MATERIAL提供唯一主要冲突分类；EQUIVALENT为空数组。其他发现保留在分析中。";
                readonly title: "Categories";
                readonly required: true;
            };
        };
        readonly title: "AnchorAssessmentDecision";
        readonly required: true;
    };
};
export declare const anchorReviewSubmissionParameters: {
    readonly fingerprint: {
        readonly type: "string";
        readonly title: "Fingerprint";
        readonly required: true;
    };
    readonly assessment_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly title: "Assessment Ids";
        readonly required: true;
    };
};
//# sourceMappingURL=consistency-agent.parameters.generated.d.ts.map