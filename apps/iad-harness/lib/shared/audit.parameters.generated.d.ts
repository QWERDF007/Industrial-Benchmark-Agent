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
export declare const auditBatchParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly batch_number: {
        readonly type: "integer";
        readonly title: "Batch Number";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly discoveries: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly group_id: {
                    readonly type: "string";
                    readonly title: "Group Id";
                    readonly required: true;
                };
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["quality_issue", "visual_pattern", "judgment_boundary"];
                    readonly title: "Kind";
                    readonly required: true;
                };
                readonly dimension: {
                    readonly type: "string";
                    readonly enum: readonly ["annotation_quality", "visual_coverage", "evaluation_difficulty"];
                    readonly title: "Dimension";
                    readonly required: true;
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["pending", "supported", "disputed", "withdrawn"];
                    readonly title: "Status";
                    readonly required: true;
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly description: {
                    readonly type: "string";
                    readonly title: "Description";
                    readonly required: true;
                };
                readonly visual_signature: {
                    readonly type: "string";
                    readonly title: "Visual Signature";
                    readonly required: true;
                };
                readonly annotation_relation: {
                    readonly type: "string";
                    readonly title: "Annotation Relation";
                    readonly required: true;
                };
                readonly scope: {
                    readonly type: "string";
                    readonly title: "Scope";
                    readonly required: true;
                };
                readonly key_difference: {
                    readonly type: "string";
                    readonly title: "Key Difference";
                    readonly default: "";
                };
                readonly unresolved_question: {
                    readonly type: "string";
                    readonly description: "需要新图像或对照才能回答的具体问题；没有则为空字符串。";
                    readonly title: "Unresolved Question";
                    readonly default: "";
                };
                readonly next_batch_focus: {
                    readonly type: "string";
                    readonly title: "Next Batch Focus";
                    readonly default: "";
                };
                readonly support_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly title: "Support Refs";
                    readonly required: true;
                };
                readonly counter_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly title: "Counter Refs";
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly title: "Representatives";
                };
            };
            readonly title: "AuditDiscovery";
        };
        readonly title: "Discoveries";
        readonly required: true;
    };
    readonly review_requests: {
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
                readonly result_revision: {
                    readonly type: "integer";
                    readonly title: "Result Revision";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
                readonly conflict_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly title: "Conflict Refs";
                    readonly required: true;
                };
            };
            readonly title: "AuditReviewRequest";
        };
        readonly title: "Review Requests";
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
            readonly execution_status: {
                readonly type: "string";
                readonly enum: readonly ["completed", "incomplete", "failed"];
                readonly title: "Execution Status";
                readonly required: true;
            };
            readonly state: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["normal", "suspect"];
                }, {
                    readonly type: "null";
                }];
                readonly title: "State";
                readonly required: true;
            };
            readonly analysis: {
                readonly type: "string";
                readonly description: "只概括本图可见形态及标注覆盖、定位、实例关系。上游与知识评估分别填写对应字段。";
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
                readonly description: "支持本图判断的具体图像事实。";
                readonly title: "Basis";
                readonly required: true;
            };
            readonly evidence_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。";
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
                            readonly description: "必须来自本场knowledge.entries[].check.check_id；不是标注ID、上游差异ID或自拟图像检查项。";
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
                            readonly description: "说明本图可见现象与该知识检查动作的具体对应和适用理由。";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly evidence_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "本次实际观察的完整原图身份；局部图仅用于观察，不单独引用。";
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                    };
                    readonly title: "AuditCheckAssessment";
                };
                readonly description: "仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。";
                readonly title: "Check Assessments";
                readonly required: true;
            };
            readonly consistency_review: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly source_issue_id: {
                            readonly type: "string";
                            readonly title: "Source Issue Id";
                            readonly required: true;
                        };
                        readonly assessment: {
                            readonly type: "string";
                            readonly enum: readonly ["supported", "unsupported", "insufficient"];
                            readonly title: "Assessment";
                            readonly required: true;
                        };
                        readonly reason: {
                            readonly type: "string";
                            readonly title: "Reason";
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
                    readonly title: "AuditConsistencyAssessment";
                };
                readonly description: "恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。";
                readonly title: "Consistency Review";
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
                            readonly description: "仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。";
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
                        readonly type: {
                            readonly type: "string";
                            readonly enum: readonly ["image_label_mismatch", "category_mismatch", "extra_annotation", "missing_annotation", "position_difference", "split", "merge"];
                            readonly description: "按可见问题分类；类别差异指有效同内容对照中同一对象的原始分组差异。";
                            readonly title: "Type";
                            readonly required: true;
                        };
                        readonly annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "引用当前主图真实annotation_id；类别、多标、位置和合并至少1个，拆分至少2个，少标或图像级可以为空。";
                            readonly title: "Annotation Ids";
                        };
                        readonly consistency_issue_refs: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "只引用本图上游result.issues中的真实issue_id，独立发现且不采纳上游问题时为空。";
                            readonly title: "Consistency Issue Refs";
                        };
                    };
                    readonly title: "AuditFinding";
                };
                readonly title: "Findings";
                readonly required: true;
            };
            readonly observations: {
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
                        readonly annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Annotation Ids";
                        };
                        readonly evidence_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "本次实际观察的完整原图身份，不单独引用局部图。";
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                    };
                    readonly title: "AuditObservation";
                };
                readonly description: "记录有比较价值的可见现象，描述简短；普通观察不计入质量疑点。";
                readonly title: "Observations";
            };
            readonly hypothesis_assessments: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly group_id: {
                            readonly type: "string";
                            readonly title: "Group Id";
                            readonly required: true;
                        };
                        readonly assessment: {
                            readonly type: "string";
                            readonly enum: readonly ["supported", "counter", "unconfirmed", "not_applicable"];
                            readonly title: "Assessment";
                            readonly required: true;
                        };
                        readonly reason: {
                            readonly type: "string";
                            readonly title: "Reason";
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
                    readonly title: "AuditHypothesisAssessment";
                };
                readonly title: "Hypothesis Assessments";
            };
            readonly visual_features: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly kind: {
                            readonly type: "string";
                            readonly enum: readonly ["morphology", "location", "size", "contrast", "structural_relation", "instances", "background"];
                            readonly title: "Kind";
                            readonly required: true;
                        };
                        readonly description: {
                            readonly type: "string";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Annotation Ids";
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
                    readonly title: "AuditVisualFeature";
                };
                readonly title: "Visual Features";
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。";
                readonly title: "Limitations";
                readonly required: true;
            };
        };
        readonly title: "AuditLegacyFinal";
        readonly required: true;
    };
};
export declare const auditRecordParameters: {
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 30;
    };
    readonly sample_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Sample Id";
    };
    readonly issue_type: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Issue Type";
    };
    readonly consistency_assessment: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["supported", "unsupported", "insufficient"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Consistency Assessment";
    };
    readonly knowledge_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Knowledge Id";
    };
    readonly state: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["normal", "suspect", "incomplete"];
        }, {
            readonly type: "null";
        }];
        readonly title: "State";
    };
};
export declare const auditReportParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly discovery_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Discovery Ids";
        readonly required: true;
    };
    readonly conclusion: {
        readonly type: "string";
        readonly description: "概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。";
        readonly title: "Conclusion";
        readonly required: true;
    };
    readonly consistency_analysis: {
        readonly type: "string";
        readonly description: "用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。";
        readonly title: "Consistency Analysis";
        readonly required: true;
    };
    readonly knowledge_analysis: {
        readonly type: "string";
        readonly description: "简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。";
        readonly title: "Knowledge Analysis";
        readonly default: "";
    };
    readonly coverage_analysis: {
        readonly type: "string";
        readonly description: "概括实际可见形态、背景、结构关系及尚缺场景。";
        readonly title: "Coverage Analysis";
        readonly required: true;
    };
    readonly coverage_topics: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly analysis: {
                    readonly type: "string";
                    readonly description: "围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。";
                    readonly title: "Analysis";
                    readonly required: true;
                };
                readonly evidence_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly title: "Evidence Refs";
                    readonly required: true;
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly description: "精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。";
                    readonly title: "Representatives";
                };
                readonly related_case_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。";
                    readonly title: "Related Case Ids";
                };
                readonly title: {
                    readonly type: "string";
                    readonly description: "根据本作业实际观察命名，不加序号，不照搬固定的覆盖主题。";
                    readonly title: "Title";
                    readonly required: true;
                };
            };
            readonly title: "AuditCoverageTopic";
        };
        readonly description: "本作业有真实图证的覆盖画像主题，标题、条数、正文及选图由实际作业决定。";
        readonly title: "Coverage Topics";
    };
    readonly consistency_analyses: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly analysis: {
                    readonly type: "string";
                    readonly description: "围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。";
                    readonly title: "Analysis";
                    readonly required: true;
                };
                readonly evidence_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly description: "支撑本项分析的当前有效图级记录。没有相关材料时为空并在正文说明。";
                    readonly title: "Evidence Refs";
                    readonly required: true;
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly description: "精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。";
                    readonly title: "Representatives";
                };
                readonly related_case_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。";
                    readonly title: "Related Case Ids";
                };
                readonly issue_type: {
                    readonly type: "string";
                    readonly enum: readonly ["image_label_mismatch", "category_mismatch", "extra_annotation", "missing_annotation", "position_difference", "split", "merge"];
                    readonly description: "沿用本数据格式的现有差异类型，每类单独分析，不合并多标少标或拆分合并。";
                    readonly title: "Issue Type";
                    readonly required: true;
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly default: "";
                };
                readonly description: {
                    readonly type: "string";
                    readonly description: "简短说明该类冲突的实际可见现象。";
                    readonly title: "Description";
                    readonly default: "";
                };
                readonly audit_result: {
                    readonly type: "string";
                    readonly description: "结合当前图证说明本次保留或排除该疑点的具体理由。";
                    readonly title: "Audit Result";
                    readonly default: "";
                };
            };
            readonly title: "AuditConsistencyAnalysis";
        };
        readonly description: "按上下文applicable_issue_types的每个适用差异类型各一项；零疑点也如实分析，无候选、无有效候选、一致在范围分析中展开。";
        readonly title: "Consistency Analyses";
    };
    readonly consistency_scopes: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly source_status: {
                    readonly type: "string";
                    readonly enum: readonly ["NO_CANDIDATES", "NO_ELIGIBLE_CANDIDATES", "MODEL_REVIEWED:EQUIVALENT", "MODEL_REVIEWED:MATERIAL", "MODEL_REVIEWED:UNCERTAIN"];
                    readonly title: "Source Status";
                    readonly required: true;
                };
                readonly analysis: {
                    readonly type: "string";
                    readonly description: "只讲这组能否找到可比较的图、相同内容的标注是否一致及具体差异；用日常语言说明。";
                    readonly title: "Analysis";
                    readonly required: true;
                };
                readonly evidence_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly description: "每张精选原图都须关联其当前有效图级版本；通常kind为image，sample_id与representatives中的原图一致。";
                    readonly title: "Evidence Refs";
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly description: "从该范围精选3至8张主Agent已实际查看的完整原图；用于比较的图指定counter。";
                    readonly title: "Representatives";
                };
            };
            readonly title: "AuditConsistencyScope";
        };
        readonly description: "分别解释无候选、无有效候选、标注一致等来源范围。";
        readonly title: "Consistency Scopes";
    };
    readonly knowledge_analyses: {
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
                readonly description: {
                    readonly type: "string";
                    readonly description: "用自然语言概括该知识关注的可见现象和检查动作。";
                    readonly title: "Description";
                    readonly required: true;
                };
                readonly applicability: {
                    readonly type: "string";
                    readonly description: "说明本次哪些可见场景适用，哪些不适用。";
                    readonly title: "Applicability";
                    readonly required: true;
                };
                readonly analysis: {
                    readonly type: "string";
                    readonly description: "依据本次实际图像说明观察、对照及与知识的关系。";
                    readonly title: "Analysis";
                    readonly required: true;
                };
                readonly audit_impact: {
                    readonly type: "string";
                    readonly description: "该知识帮助辨认或区分的具体可见现象及其对本次判断的影响。";
                    readonly title: "Audit Impact";
                    readonly required: true;
                };
                readonly evidence_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly title: "Evidence Refs";
                    readonly required: true;
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly title: "Representatives";
                };
            };
            readonly title: "AuditKnowledgeAnalysis";
        };
        readonly description: "逐项覆盖全部所选知识，说明内容、适用性、图证对照及实际作用。";
        readonly title: "Knowledge Analyses";
    };
    readonly independence_analysis: {
        readonly type: "string";
        readonly description: "依据真实重复和来源登记说明样本结构，以及尚缺哪些具体登记。";
        readonly title: "Independence Analysis";
        readonly required: true;
    };
    readonly capabilities: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly tag: {
                    readonly type: "string";
                    readonly enum: readonly ["representative_test_set", "ordinary_normal", "hard_normal", "near_ok_ng_pair", "tiny_defect", "low_contrast_defect", "structural_relation", "missing_component", "misalignment", "multi_object", "in_domain", "unseen_batch", "lighting_shift"];
                    readonly title: "Tag";
                    readonly required: true;
                };
                readonly coverage_status: {
                    readonly type: "string";
                    readonly enum: readonly ["observed", "candidate", "not_observed", "not_applicable"];
                    readonly title: "Coverage Status";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "该能力实际出现的视觉困难，或尚缺的具体场景。";
                    readonly title: "Reason";
                    readonly required: true;
                };
                readonly evidence_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly title: "Evidence Refs";
                    readonly required: true;
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly title: "Representatives";
                };
                readonly missing_conditions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "仅列该能力特有的使用条件，共同条件留在报告用途章节。";
                    readonly title: "Missing Conditions";
                };
            };
            readonly title: "AuditCapability";
        };
        readonly title: "Capabilities";
        readonly required: true;
    };
    readonly usability: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly purpose: {
                    readonly type: "string";
                    readonly enum: readonly ["exploration", "training_experiment", "debug", "image_evaluation", "bbox_evaluation", "pixel_evaluation", "formal_benchmark"];
                    readonly title: "Purpose";
                    readonly required: true;
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["usable", "candidate", "not_ready", "not_evaluated"];
                    readonly title: "Status";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "本用途能开展的具体工作，或需先完成的具体准备，用一句话说明。";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AuditUsabilityAssessment";
        };
        readonly title: "Usability";
        readonly required: true;
    };
    readonly review_priorities: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "本轮真实保留疑点的复看位置和动作；没有则为空。";
        readonly title: "Review Priorities";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。";
        readonly title: "Limitations";
        readonly required: true;
    };
    readonly report_cases: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly case_id: {
                    readonly type: "string";
                    readonly title: "Case Id";
                    readonly required: true;
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly observation: {
                    readonly type: "string";
                    readonly description: "用日常用语指出图里看哪里、看到了什么、标注圈住了什么。";
                    readonly title: "Observation";
                    readonly required: true;
                };
                readonly comparison: {
                    readonly type: "string";
                    readonly description: "直接说明图中哪些地方相同或不同，以及为什么这样判断。";
                    readonly title: "Comparison";
                    readonly default: "";
                };
                readonly significance: {
                    readonly type: "string";
                    readonly description: "这些图可以用来检查模型的什么表现，或接下来具体应做什么。";
                    readonly title: "Significance";
                    readonly required: true;
                };
                readonly evidence_refs: {
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
                            readonly result_revision: {
                                readonly type: "integer";
                                readonly title: "Result Revision";
                                readonly required: true;
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["finding", "observation", "feature", "image"];
                                readonly title: "Kind";
                                readonly required: true;
                            };
                            readonly index: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Index";
                            };
                        };
                        readonly title: "AuditResultReference";
                    };
                    readonly description: "引用具体标注疑点时使用finding及其索引；普通图像比较使用observation、feature或image。";
                    readonly title: "Evidence Refs";
                    readonly required: true;
                };
                readonly representatives: {
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
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly title: "Representatives";
                    readonly required: true;
                };
            };
            readonly title: "AuditReportCase";
        };
        readonly description: "各分析点关联的图像依据；相同案例供多个分析点复用，页面在对应正文旁直接展示精选原图。";
        readonly title: "Report Cases";
    };
    readonly capability_topics: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly summary: {
                    readonly type: "string";
                    readonly title: "Summary";
                    readonly required: true;
                };
                readonly capability_tags: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["representative_test_set", "ordinary_normal", "hard_normal", "near_ok_ng_pair", "tiny_defect", "low_contrast_defect", "structural_relation", "missing_component", "misalignment", "multi_object", "in_domain", "unseen_batch", "lighting_shift"];
                    };
                    readonly title: "Capability Tags";
                };
                readonly points: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly title: {
                                readonly type: "string";
                                readonly title: "Title";
                                readonly required: true;
                            };
                            readonly observation_and_comparison: {
                                readonly type: "string";
                                readonly title: "Observation And Comparison";
                                readonly required: true;
                            };
                            readonly evaluation_value: {
                                readonly type: "string";
                                readonly title: "Evaluation Value";
                                readonly required: true;
                            };
                            readonly case_ids: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly description: "支撑本能力小点的报告案例，须有主Agent实际观察的完整原图。";
                                readonly title: "Case Ids";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditCapabilityPoint";
                    };
                    readonly title: "Points";
                    readonly required: true;
                };
                readonly missing_conditions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Missing Conditions";
                };
            };
            readonly title: "AuditCapabilityTopic";
        };
        readonly description: "由实际视觉困难形成的能力专题，每个小点引用有原图的案例；无图证项在缺口中说明。";
        readonly title: "Capability Topics";
    };
};
export declare const auditReportEvidenceParameters: {
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
};
export declare const auditCropParameters: {
    readonly bbox: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly title: "Bbox";
        readonly required: true;
    };
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
    readonly master_prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly system_prompt: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "System Prompt";
                readonly required: true;
            };
            readonly user_prompt: {
                readonly type: "string";
                readonly title: "User Prompt";
                readonly required: true;
            };
        };
        readonly title: "AnalysisRolePrompts";
    };
    readonly report_instruction: {
        readonly type: "string";
        readonly title: "Report Instruction";
        readonly default: "综合全部有效图级结果、全局发现、程序统计、来源信息和选用的评测成果，形成面向非项目人员的质量与评测能力报告，按工具合同提交。\n\n结论只概括当前用途和主要视觉发现，数量由页面统计展示。随后回答自洽性、标注复核重点、视觉覆盖、独立性与代表性、模型能力和使用条件。\n\n自洽性开头用一两句话回答：在内容相同、可以对照的图像中，标注是否一致；程序标出的差异经过模型看图后，哪些仍然成立。两套统计由程序计算并在页面展示，按主图计数，同一张图在同一类只记一次。随后按实际类型解释程序发现和模型复核的差别，直接说两侧标注哪里不同、为何保留或排除，配3至8张相关完整原图。\n\n无候选、无有效候选、标注一致等非空范围各自说明对照图的情况和跨图比较结果，精选3至8张属于该范围的完整原图。范围由记录中的consistency.source_status确定。单张图是否漏标、圈多了或把一个目标分成几个，放在标注质量章节；形态、亮度和纹理变化放在视觉覆盖或模型能力章节。章节概述聚焦标注是否一致，具体图像细节在对应小节说明。\n\n覆盖按实际形态、方向、尺度感受、可见度、背景和结构关系形成主题。独立性说清哪些图片重复、哪些可能拍自同一件物品；缺少登记时，直接列出需要补记的物品、批次或采集来源，以及完成后可以怎样分组。\n\n能力专题从真实视觉困难形成。每个小点说明观察、跨图共性与差别、可能检验的模型表现，并引用有完整原图的案例。单图特殊现象按个例解释，尚缺的能力场景集中列出。固定标签供内部统计，正文专题按证据组织。\n\n每条所选知识分别说明检查动作、适用情况、实际图像观察与对照，以及对本次判断的作用。精选主 Agent 已查看的完整原图解释应用。标题及知识状态来自冻结条目，逐图核对数量来自程序统计。知识章节使用标题、描述、图像证据和结构化分析；知识为空时列表为空。\n\n每个分析点直接讲图里有什么、标注有没有圈对、两图哪里相同或不同，以及可以据此检查模型的什么表现。正文自成一段完整说明，相关原图通过关联字段在该处展示。每张图的说明指出应看哪里、具体形态或差别。分析和图证关联当前有效图级版本。\n\n分别评价视觉探索、训练实验、内部调试、图像级评测、矩形框定位评测、像素区域评测及正式评测基准。各项说明可开展的工作和实际条件。共同缺项集中在用途章节，各主题只补充特有条件。\n\n先写具体事实，再解释原因或下一步。一句话只讲一个要点，主语是图中的部位、已有标注或要做的检查。提交前逐段按普通读者的视角重读：读者能否指着图片找到你说的地方，能否直接知道你的判断或下一步动作；读不顺的句子用日常用语重写。整体统计由页面交代，技术明细保留在结构化记录中。\n\n报告帮助读者看懂这批图像、标注和后续工作，回答自洽性、标注质量、视觉覆盖、独立性与代表性、模型能力和数据用途六个问题。开头直接说现在能用来做什么、主要发现什么。\n\n每段围绕一个要点，通常用两三句话讲清楚：图里哪里值得看，标注或两张图有什么相同和不同，这对使用数据有什么影响。直接下有依据的判断。需要读者复看时，说清看哪个部位、要确认什么。\n\n正文使用日常动词，少用抽象名词串。说“这两张图拍的是同一处”“几个框圈住同一条边”“补充其他批次的图片”，把判断过程讲成具体的图像事实和动作。不要照搬工具输出的判定术语，或用一串限制声明代替结果。任务规则、系统状态和保存过程留在配置与记录里。\n\n标题只写主题，层级编号由页面统一添加，数量在正文统计或图表中单独展示。\n\n数量和来源状态由页面统计展示，正文解释具体事实。数据分布由程序从冻结原始图像和标注计算，按需通过audit_distribution读取；分布图表由页面展示，正文引用数字直接采用工具结果。共同缺少的材料集中写成下一步：补哪类图片、确认哪些参考标注、登记哪些来源，再开展什么工作。各主题只补充自己特有的准备事项，不在每段重复同一条件。\n\n主 Agent 综合全部有效图级事实和发现，各小点独立说明并关联3至8张相关原图，读者在当前小节就能对照图片读懂。案例及图像编号只填关联字段，由页面在正文旁展示图片。案例保存可复用的图像依据；知识描述说清教我们看哪里、这次看到了什么。\n\n正式图证使用主 Agent 实际查看的完整原图及原始标注。局部视图用于核查，正文图库使用完整原图。每处需要图证的分析精选3至8张能够共同说明问题的原图，说明各图的现象或关键差别。有对照关系时将对照原图标为counter，界面以Tab组织当前图组和对照图组。证据不足时继续查图或收拢主题。\n\n视觉覆盖围绕形态、方向、可见度、背景、结构关系和正常变化组织。用途说清这些场景可以检查模型的什么表现，以及具体需要做的准备。";
    };
    readonly observer_prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly system_prompt: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "System Prompt";
                readonly required: true;
            };
            readonly user_prompt: {
                readonly type: "string";
                readonly title: "User Prompt";
                readonly required: true;
            };
        };
        readonly title: "AnalysisRolePrompts";
    };
    readonly benchmark_build_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Benchmark Build Id";
    };
};
//# sourceMappingURL=audit.parameters.generated.d.ts.map