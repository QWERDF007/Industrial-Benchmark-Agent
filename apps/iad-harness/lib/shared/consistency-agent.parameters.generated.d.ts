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
        readonly default: "逐主图核对全部入选候选的标注一致性，查看两侧原图、原始标注及适用原像素局部。区分标注数据差异、可见现象与实物本身的状态差异；相似度不证明同一实物或缺陷真值。不同实物先建立可比现象，真实外观变化可以解释标注差异。位置差异须有同图像素证据或可靠配准，归一化标注布局不能代替配准。类别仅按明确映射比较，不以出现频数裁定哪侧正确。比较方向：anchor始终是主图，candidate是参考图。所有差异以主图相对于当前参考图为准。conclusion和overall.text的冲突结论只能精确单选：类别不一致、位置差异、多类别、少类别、拆分、合并。不添加主图、标注、视觉、基本、可能、疑似等前后缀，不加标点，不使用或、斜线、顿号等连接多个结论。在有效、穷尽且非忽略的可比域内，主图0个标注而参考图1个标注为少类别；反过来为多类别。主图同一对象多个框、参考图一个框为拆分，反过来为合并；同一对象类别值不同为类别不一致；位置或覆盖范围不同为位置差异。已确认多种差异时选择最主要的一种作为唯一结论，其他实际差异完整写在explanation、findings及conclusions。MATERIAL的categories必须是仅包含conclusion同名分类的单元素数组。类别、数量、位置和范围全部对应时，verdict为EQUIVALENT，conclusion和overall.text精确写一致，categories为空数组。缺少关键标注来源、覆盖或可比内容时用UNCERTAIN，conclusion及overall.text为null，categories为空，分析写明具体限制。annotation_availability区分有效空标、未提供、读取失败和未知；只有有效空标才是已知0个标注。annotation_applicability记录覆盖与共同可比域限制；PARTIAL、UNKNOWN或ignore不能支持所限制区域的缺标推断，原始数量差异仍保留。不裁决哪一侧标注正确，不能因为无法判断漏标还是另一侧多标而拒绝给出主图相对参考图的增减方向。explanation、findings及所有正文只用主图、参考图等自然语言称呼，不能附带@c0、@c1、文件名或具体引用；这些引用仅用于结构化引用字段。逐候选覆盖完整并保留具体证据、限制与其他发现。存在MATERIAL时整场为MATERIAL，否则有关键领域证据不足则为UNCERTAIN，其余EQUIVALENT。原始程序事实与模型结论、人审分别保存，不修改原标注、人审或Gold。";
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
                readonly enum: readonly ["EQUIVALENT", "MATERIAL", "UNCERTAIN"];
                readonly description: "当前候选的标注一致性判定：MATERIAL为实质冲突，EQUIVALENT为一致，UNCERTAIN为关键证据缺失";
                readonly title: "Verdict";
                readonly required: true;
            };
            readonly explanation: {
                readonly type: "string";
                readonly description: "当前图对的分析依据，具体说明差异发生在哪一侧、哪个对象或区域，位置、类别、数量及拆分合并等实际变化，解释判定及主分类；无差异时说明各项对应。不得用基本一致、可能、疑似、待核对等话术替代判断。真实缺失证据须指明缺失内容及其阻断的判断";
                readonly title: "Explanation";
                readonly required: true;
            };
            readonly findings: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "自由描述实际发现的问题，不受程序差异分类限制；未发现差异时可为空";
                readonly title: "Findings";
            };
            readonly categories: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["类别不一致", "位置差异", "多类别", "少类别", "拆分", "合并"];
                };
                readonly description: "MATERIAL提供唯一主要冲突分类；EQUIVALENT和UNCERTAIN为空数组。其他发现保留在分析中。";
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
    readonly overall: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly assessment_id: {
                readonly type: "integer";
                readonly description: "本场最新已保存评估的整数ID";
                readonly title: "Assessment Id";
                readonly required: true;
            };
        };
        readonly title: "AnchorAssessmentSelection";
        readonly required: true;
    };
    readonly conclusions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Conclusions";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Limitations";
    };
};
//# sourceMappingURL=consistency-agent.parameters.generated.d.ts.map