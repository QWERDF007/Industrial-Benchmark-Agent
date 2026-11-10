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
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Instruction";
    };
    readonly system_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "System Prompt";
    };
    readonly identity_prompts: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly gate_system: {
                readonly type: "string";
                readonly title: "Gate System";
                readonly required: true;
            };
            readonly gate_user: {
                readonly type: "string";
                readonly title: "Gate User";
                readonly required: true;
            };
            readonly gate_examples: {
                readonly type: "string";
                readonly title: "Gate Examples";
                readonly required: true;
            };
        };
        readonly title: "IdentityPrompts";
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
export declare const anchorToolParameters: {
    readonly anomaly_detection: {
        readonly context: {
            readonly candidate_id: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "Candidate Id";
            };
        };
        readonly observe: {
            readonly phase: {
                readonly type: "string";
                readonly enum: readonly ["gate"];
                readonly title: "Phase";
                readonly required: true;
            };
            readonly request_id: {
                readonly type: "string";
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
            readonly gate_revisions: {
                readonly type: "object";
                readonly additionalProperties: true;
                readonly properties: {};
                readonly title: "Gate Revisions";
                readonly required: true;
            };
        };
        readonly assess: {
            readonly phase: {
                readonly type: "string";
                readonly enum: readonly ["gate", "audit"];
                readonly title: "Phase";
                readonly required: true;
            };
            readonly request_id: {
                readonly type: "string";
                readonly title: "Request Id";
                readonly required: true;
            };
            readonly fingerprint: {
                readonly type: "string";
                readonly title: "Fingerprint";
                readonly required: true;
            };
            readonly candidate_id: {
                readonly type: "string";
                readonly title: "Candidate Id";
                readonly required: true;
            };
            readonly expected_revision: {
                readonly type: "integer";
                readonly title: "Expected Revision";
                readonly required: true;
            };
            readonly action: {
                readonly type: "string";
                readonly enum: readonly ["commit", "recheck"];
                readonly title: "Action";
                readonly default: "commit";
            };
            readonly observation_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Observation Ids";
            };
        };
        readonly submit: {
            readonly request_id: {
                readonly type: "string";
                readonly title: "Request Id";
                readonly required: true;
            };
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
            };
        };
    };
    readonly bbox_defect: {
        readonly context: {
            readonly candidate_id: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "Candidate Id";
            };
        };
        readonly observe: {
            readonly phase: {
                readonly type: "string";
                readonly enum: readonly ["gate", "audit"];
                readonly title: "Phase";
                readonly required: true;
            };
            readonly request_id: {
                readonly type: "string";
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
            readonly gate_revisions: {
                readonly type: "object";
                readonly additionalProperties: true;
                readonly properties: {};
                readonly title: "Gate Revisions";
                readonly required: true;
            };
            readonly question: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "Question";
            };
        };
        readonly assess: {
            readonly phase: {
                readonly type: "string";
                readonly enum: readonly ["gate", "audit"];
                readonly title: "Phase";
                readonly required: true;
            };
            readonly request_id: {
                readonly type: "string";
                readonly title: "Request Id";
                readonly required: true;
            };
            readonly fingerprint: {
                readonly type: "string";
                readonly title: "Fingerprint";
                readonly required: true;
            };
            readonly candidate_id: {
                readonly type: "string";
                readonly title: "Candidate Id";
                readonly required: true;
            };
            readonly expected_revision: {
                readonly type: "integer";
                readonly title: "Expected Revision";
                readonly required: true;
            };
            readonly action: {
                readonly type: "string";
                readonly enum: readonly ["commit", "recheck"];
                readonly title: "Action";
                readonly default: "commit";
            };
            readonly observation_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Observation Ids";
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
                    readonly limitations: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "独立保存未能确认的部分；已确认差异仍保留在issues，不因局部不确定而丢失。";
                        readonly title: "Limitations";
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
                                readonly region_pair_ids: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                    readonly description: "支持本问题的已核实区域对ID；像素一致的程序捷径可为空。";
                                    readonly title: "Region Pair Ids";
                                };
                                readonly coverage_effect: {
                                    readonly oneOf: readonly [{
                                        readonly type: "string";
                                        readonly enum: readonly ["unchanged", "material_change", "unverified"];
                                    }, {
                                        readonly type: "null";
                                    }];
                                    readonly description: "位置问题必须确认实际缺陷覆盖存在material_change；不能仅因坐标、中心或尺寸数值不同报告问题。";
                                    readonly title: "Coverage Effect";
                                };
                                readonly coverage_reason: {
                                    readonly oneOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                    readonly description: "位置问题说明实际缺陷的漏盖、偏离或范围实质变化，不自行制定像素阈值。";
                                    readonly title: "Coverage Reason";
                                };
                                readonly same_main_object_as: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly additionalProperties: false;
                                        readonly properties: {
                                            readonly candidate_id: {
                                                readonly type: "string";
                                                readonly title: "Candidate Id";
                                                readonly required: true;
                                            };
                                            readonly annotation_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly title: "Annotation Ids";
                                                readonly required: true;
                                            };
                                        };
                                        readonly title: "CandidateObjectReference";
                                    };
                                    readonly description: "仅用于主图少标：实际共同观察且确认是同一主图对象的其他候选原始框引用；没有确认则留空。程序验证真实映射区域与唯一对应，不能按文字或重叠猜测。";
                                    readonly title: "Same Main Object As";
                                };
                            };
                            readonly title: "BboxAnnotationIssue";
                        };
                        readonly description: "MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。";
                        readonly title: "Issues";
                    };
                };
                readonly title: "AnchorAssessmentDecision";
                readonly description: "仅phase=audit提交当前候选的标注审核。phase=gate必须省略或传null，只用observation_ids引用已保存的身份观察，由程序保存资格结论，不提交标注问题。";
            };
        };
        readonly submit: {
            readonly request_id: {
                readonly type: "string";
                readonly title: "Request Id";
                readonly required: true;
            };
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
            };
        };
    };
};
//# sourceMappingURL=consistency-agent.parameters.generated.d.ts.map