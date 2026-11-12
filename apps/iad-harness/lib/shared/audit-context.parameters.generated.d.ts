export declare const auditBatchDeltaParameters: {
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
            };
            readonly title: "AuditDiscoveryBody";
        };
        readonly description: "只提交新增或正文变化的完整发现。未变传[]；支持、反例和精选分别提交。";
        readonly title: "Discoveries";
        readonly required: true;
    };
    readonly evidence_changes: {
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
                readonly action: {
                    readonly type: "string";
                    readonly enum: readonly ["add", "remove", "keep"];
                    readonly title: "Action";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "counter"];
                    readonly title: "Role";
                    readonly required: true;
                };
                readonly reference: {
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
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AuditEvidenceChange";
        };
        readonly description: "只提交引用变化。改变主张或范围时，以keep、remove或角色迁移逐项复核全部旧引用并说明理由。";
        readonly title: "Evidence Changes";
    };
    readonly representative_changes: {
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
            readonly title: "AuditRepresentativeChange";
        };
        readonly description: "仅提交精选变化的条目，省略保留既有选择。数量按信息价值决定，不重复堆图。";
        readonly title: "Representative Changes";
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
export declare const auditDiscoveryParameters: {
    readonly group_id: {
        readonly type: "string";
        readonly title: "Group Id";
        readonly required: true;
    };
    readonly revision: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Revision";
    };
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
    readonly role: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["support", "counter"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Role";
    };
};
export declare const auditEvidenceCommitParameters: {
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
            readonly selected_evidence: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly evidence_id: {
                            readonly type: "string";
                            readonly title: "Evidence Id";
                            readonly required: true;
                        };
                        readonly reason: {
                            readonly type: "string";
                            readonly title: "Reason";
                            readonly required: true;
                        };
                    };
                    readonly title: "AnalysisEvidenceCandidate";
                };
                readonly description: "推荐供主Agent复看的少数完整原图及选择理由，可为空；不自动成为正式精选，不重复另一份精选ID列表。";
                readonly title: "Selected Evidence";
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
        readonly title: "AuditFinal";
        readonly required: true;
    };
};
export declare const auditMediaParameters: {
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
    readonly view: {
        readonly type: "string";
        readonly enum: readonly ["whole", "annotation_rois", "all"];
        readonly description: "whole仅完整原图和标注元数据；annotation_rois为全部标注局部；all显式读取整图及全部必需局部。";
        readonly title: "View";
        readonly default: "whole";
    };
};
//# sourceMappingURL=audit-context.parameters.generated.d.ts.map