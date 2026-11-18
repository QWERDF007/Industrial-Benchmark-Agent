export declare const auditQualityScoreParameters: {
    readonly cursor: {
        readonly type: "integer";
        readonly title: "Cursor";
        readonly default: 0;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 8;
    };
    readonly max_chars: {
        readonly type: "integer";
        readonly title: "Max Chars";
        readonly default: 24000;
    };
    readonly consistency_reviews: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly scope_id: {
                        readonly type: "string";
                        readonly title: "Scope Id";
                        readonly required: true;
                    };
                    readonly code: {
                        readonly type: "string";
                        readonly enum: readonly ["category_mismatch", "instance_count_mismatch", "coverage_mismatch"];
                        readonly title: "Code";
                        readonly required: true;
                    };
                    readonly coefficient: {
                        readonly type: "number";
                        readonly title: "Coefficient";
                        readonly required: true;
                    };
                    readonly analysis: {
                        readonly type: "string";
                        readonly title: "Analysis";
                        readonly required: true;
                    };
                    readonly evidence_refs: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly title: "Evidence Refs";
                        readonly required: true;
                    };
                };
                readonly title: "ConsistencyImpactReview";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Consistency Reviews";
    };
    readonly distribution_reviews: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly scope_id: {
                        readonly type: "string";
                        readonly description: "统计范围的scope_id，整体为overall，子集为dataset_id。";
                        readonly title: "Scope Id";
                        readonly required: true;
                    };
                    readonly axis: {
                        readonly type: "string";
                        readonly enum: readonly ["class_balance", "image_geometry", "instance_geometry", "instance_count", "instance_position", "capture_source"];
                        readonly title: "Axis";
                        readonly required: true;
                    };
                    readonly status: {
                        readonly oneOf: readonly [{
                            readonly type: "string";
                            readonly enum: readonly ["normal", "problem", "not_applicable"];
                        }, {
                            readonly type: "null";
                        }];
                        readonly title: "Status";
                    };
                    readonly coefficient: {
                        readonly oneOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly type: "null";
                        }];
                        readonly title: "Coefficient";
                    };
                    readonly comparisons: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly properties: {
                                readonly metric: {
                                    readonly type: "string";
                                    readonly title: "Metric";
                                    readonly required: true;
                                };
                                readonly groups: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly additionalProperties: false;
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                                readonly title: "Label";
                                                readonly required: true;
                                            };
                                            readonly members: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly oneOf: readonly [{
                                                        readonly type: "object";
                                                        readonly additionalProperties: false;
                                                        readonly properties: {
                                                            readonly kind: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["group"];
                                                                readonly title: "Kind";
                                                                readonly required: true;
                                                            };
                                                            readonly metric: {
                                                                readonly type: "string";
                                                                readonly title: "Metric";
                                                                readonly required: true;
                                                            };
                                                            readonly bucket: {
                                                                readonly type: "string";
                                                                readonly title: "Bucket";
                                                                readonly required: true;
                                                            };
                                                        };
                                                        readonly title: "DistributionGroupReference";
                                                    }, {
                                                        readonly type: "object";
                                                        readonly additionalProperties: false;
                                                        readonly properties: {
                                                            readonly kind: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["bins"];
                                                                readonly title: "Kind";
                                                                readonly required: true;
                                                            };
                                                            readonly metric: {
                                                                readonly type: "string";
                                                                readonly title: "Metric";
                                                                readonly required: true;
                                                            };
                                                            readonly x: {
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "integer";
                                                                };
                                                                readonly description: "从 0 开始的首尾分箱下标，均包含在内。";
                                                                readonly title: "X";
                                                                readonly required: true;
                                                            };
                                                            readonly y: {
                                                                readonly oneOf: readonly [{
                                                                    readonly type: "array";
                                                                    readonly items: {
                                                                        readonly type: "integer";
                                                                    };
                                                                }, {
                                                                    readonly type: "null";
                                                                }];
                                                                readonly description: "仅二维热图填写，同样包含首尾分箱。";
                                                                readonly title: "Y";
                                                            };
                                                        };
                                                        readonly title: "DistributionBinsReference";
                                                    }];
                                                };
                                                readonly title: "Members";
                                                readonly required: true;
                                            };
                                        };
                                        readonly title: "DistributionGroup";
                                    };
                                    readonly title: "Groups";
                                    readonly required: true;
                                };
                            };
                            readonly title: "DistributionMetricGrouping";
                        };
                        readonly title: "Comparisons";
                    };
                    readonly overlap_codes: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "仅完整范围：与本项确属同一实际原因的视觉评分代码；无重复原因时为空。";
                        readonly title: "Overlap Codes";
                    };
                    readonly grouping: {
                        readonly type: "string";
                        readonly description: "合理范围或分组及其统计依据；单一合理范围和均衡多范围不扣分。";
                        readonly title: "Grouping";
                        readonly required: true;
                    };
                    readonly evidence_refs: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "引用输入facts中真实的统计项ref，不编造数量或缺失类别。";
                        readonly title: "Evidence Refs";
                        readonly required: true;
                    };
                    readonly analysis: {
                        readonly type: "string";
                        readonly description: "先说结论，再用日常中文说明实际质量影响，不写分类定义或内部流程。";
                        readonly title: "Analysis";
                        readonly required: true;
                    };
                };
                readonly title: "QualityDistributionReview";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Distribution Reviews";
    };
    readonly aliases: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly axis: {
                    readonly type: "string";
                    readonly enum: readonly ["morphology", "special_morphology", "appearance", "structural_region", "hard_type", "texture", "confusable"];
                    readonly title: "Axis";
                    readonly required: true;
                };
                readonly source: {
                    readonly type: "string";
                    readonly title: "Source";
                    readonly required: true;
                };
                readonly canonical: {
                    readonly type: "string";
                    readonly description: "同一实际场景使用同一名称；不同原因不得为去重而合并。";
                    readonly title: "Canonical";
                    readonly required: true;
                };
            };
            readonly title: "QualitySceneAlias";
        };
        readonly title: "Aliases";
    };
    readonly redundancy_reviewed: {
        readonly type: "boolean";
        readonly description: "已实际对照冻结相似候选及已识别相似组的原图，完成低信息增量判断。";
        readonly title: "Redundancy Reviewed";
        readonly required: true;
    };
    readonly redundant_groups: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly members: {
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
                    readonly title: "Members";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "依据实际对照的原图解释为何只增加很少信息，候选相似度不是依据。";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "QualityRedundantGroup";
        };
        readonly title: "Redundant Groups";
    };
    readonly preview_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly description: "audit_quality_score返回的预览标识；正式报告原样提交，不自行生成。";
        readonly title: "Preview Id";
    };
    readonly item_code: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Item Code";
    };
    readonly dataset_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Dataset Id";
    };
};
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
export declare const auditGlobalParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
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
            readonly quality_observation: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly complete: {
                        readonly type: "boolean";
                        readonly description: "是否有充分原图证据完成场景归类；缺证时填false，不猜测。";
                        readonly title: "Complete";
                        readonly required: true;
                    };
                    readonly defects: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly properties: {
                                readonly annotation_id: {
                                    readonly oneOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                    readonly title: "Annotation Id";
                                    readonly required: true;
                                };
                                readonly basis: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                    readonly description: "本图可见依据，先解释为何符合相应形态、尺寸、位置和对比度场景，不引用出现频次。";
                                    readonly title: "Basis";
                                };
                                readonly morphology: {
                                    readonly type: "string";
                                    readonly title: "Morphology";
                                    readonly required: true;
                                };
                                readonly special_morphology: {
                                    readonly oneOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                    readonly title: "Special Morphology";
                                };
                                readonly appearance: {
                                    readonly type: "string";
                                    readonly title: "Appearance";
                                    readonly required: true;
                                };
                                readonly size: {
                                    readonly type: "string";
                                    readonly enum: readonly ["tiny", "small", "medium", "large"];
                                    readonly title: "Size";
                                    readonly required: true;
                                };
                                readonly location: {
                                    readonly type: "string";
                                    readonly enum: readonly ["center", "edge", "corner"];
                                    readonly title: "Location";
                                    readonly required: true;
                                };
                                readonly structural_region: {
                                    readonly oneOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                    readonly title: "Structural Region";
                                };
                                readonly contrast: {
                                    readonly type: "string";
                                    readonly enum: readonly ["low", "medium", "high"];
                                    readonly title: "Contrast";
                                    readonly required: true;
                                };
                            };
                            readonly title: "QualityDefectScene";
                        };
                        readonly title: "Defects";
                    };
                    readonly normal: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly hard: {
                                readonly type: "boolean";
                                readonly title: "Hard";
                                readonly required: true;
                            };
                            readonly hard_type: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Hard Type";
                            };
                            readonly confusable: {
                                readonly type: "boolean";
                                readonly title: "Confusable";
                                readonly default: false;
                            };
                            readonly texture: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Texture";
                            };
                            readonly texture_reason: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Texture Reason";
                            };
                            readonly profile_revision: {
                                readonly oneOf: readonly [{
                                    readonly type: "integer";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Profile Revision";
                            };
                            readonly qualification: {
                                readonly type: "object";
                                readonly additionalProperties: false;
                                readonly properties: {
                                    readonly feature_id: {
                                        readonly type: "string";
                                        readonly title: "Feature Id";
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
                                    readonly similar_features: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                        readonly title: "Similar Features";
                                        readonly required: true;
                                    };
                                    readonly normal_reason: {
                                        readonly type: "string";
                                        readonly title: "Normal Reason";
                                        readonly required: true;
                                    };
                                    readonly difficulty_reason: {
                                        readonly type: "string";
                                        readonly title: "Difficulty Reason";
                                        readonly required: true;
                                    };
                                };
                                readonly title: "HardNormalQualification";
                            };
                        };
                        readonly title: "QualityNormalScene";
                    };
                    readonly limitation: {
                        readonly type: "string";
                        readonly title: "Limitation";
                        readonly default: "";
                    };
                };
                readonly title: "QualityObservation";
                readonly description: "本图实际观察的评分场景，新作业须填写；程序读取原始类别计数和评分，不在此填写分数。";
            };
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
                        readonly coverage_effect: {
                            readonly oneOf: readonly [{
                                readonly type: "string";
                                readonly enum: readonly ["unchanged", "material_change", "unverified"];
                            }, {
                                readonly type: "null";
                            }];
                            readonly description: "内容问题必须确认明显的大范围覆盖增减material_change；覆盖基本相同的边界或轮廓偏移属于位置差异。";
                            readonly title: "Coverage Effect";
                        };
                        readonly coverage_reason: {
                            readonly oneOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                            readonly description: "指出明显漏盖或多盖了哪一大块实际内容；不能仅说坐标、面积或外接框不同。";
                            readonly title: "Coverage Reason";
                        };
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
                            readonly enum: readonly ["image_label_mismatch", "category_mismatch", "extra_annotation", "missing_annotation", "position_difference", "missing_content", "extra_content", "split", "merge"];
                            readonly description: "按可见问题分类；类别差异指有效同内容对照中同一对象的原始分组差异。";
                            readonly title: "Type";
                            readonly required: true;
                        };
                        readonly annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "引用当前主图真实annotation_id；类别、多标实例、内容差异和合并至少1个，拆分至少2个，少标实例或图像级可以为空。";
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
    readonly scope: {
        readonly type: "string";
        readonly enum: readonly ["all", "defects", "normals"];
        readonly title: "Scope";
        readonly default: "all";
    };
    readonly representation: {
        readonly type: "string";
        readonly enum: readonly ["facts", "detail"];
        readonly title: "Representation";
        readonly default: "facts";
    };
    readonly unread_only: {
        readonly type: "boolean";
        readonly title: "Unread Only";
        readonly default: true;
    };
    readonly cursor: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Cursor";
    };
    readonly max_chars: {
        readonly type: "integer";
        readonly title: "Max Chars";
        readonly default: 24000;
    };
    readonly result_revision: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Result Revision";
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
    readonly distribution_analysis: {
        readonly type: "string";
        readonly description: "先说分布结论，再说明主要失衡及影响，正常的集中分布也应明确说明。";
        readonly title: "Distribution Analysis";
        readonly default: "";
    };
    readonly quality_assessment: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly consistency_reviews: {
                readonly oneOf: readonly [{
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly scope_id: {
                                readonly type: "string";
                                readonly title: "Scope Id";
                                readonly required: true;
                            };
                            readonly code: {
                                readonly type: "string";
                                readonly enum: readonly ["category_mismatch", "instance_count_mismatch", "coverage_mismatch"];
                                readonly title: "Code";
                                readonly required: true;
                            };
                            readonly coefficient: {
                                readonly type: "number";
                                readonly title: "Coefficient";
                                readonly required: true;
                            };
                            readonly analysis: {
                                readonly type: "string";
                                readonly title: "Analysis";
                                readonly required: true;
                            };
                            readonly evidence_refs: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly title: "Evidence Refs";
                                readonly required: true;
                            };
                        };
                        readonly title: "ConsistencyImpactReview";
                    };
                }, {
                    readonly type: "null";
                }];
                readonly title: "Consistency Reviews";
            };
            readonly distribution_reviews: {
                readonly oneOf: readonly [{
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly scope_id: {
                                readonly type: "string";
                                readonly description: "统计范围的scope_id，整体为overall，子集为dataset_id。";
                                readonly title: "Scope Id";
                                readonly required: true;
                            };
                            readonly axis: {
                                readonly type: "string";
                                readonly enum: readonly ["class_balance", "image_geometry", "instance_geometry", "instance_count", "instance_position", "capture_source"];
                                readonly title: "Axis";
                                readonly required: true;
                            };
                            readonly status: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                    readonly enum: readonly ["normal", "problem", "not_applicable"];
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Status";
                            };
                            readonly coefficient: {
                                readonly oneOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Coefficient";
                            };
                            readonly comparisons: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly additionalProperties: false;
                                    readonly properties: {
                                        readonly metric: {
                                            readonly type: "string";
                                            readonly title: "Metric";
                                            readonly required: true;
                                        };
                                        readonly groups: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly additionalProperties: false;
                                                readonly properties: {
                                                    readonly label: {
                                                        readonly type: "string";
                                                        readonly title: "Label";
                                                        readonly required: true;
                                                    };
                                                    readonly members: {
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly oneOf: readonly [{
                                                                readonly type: "object";
                                                                readonly additionalProperties: false;
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["group"];
                                                                        readonly title: "Kind";
                                                                        readonly required: true;
                                                                    };
                                                                    readonly metric: {
                                                                        readonly type: "string";
                                                                        readonly title: "Metric";
                                                                        readonly required: true;
                                                                    };
                                                                    readonly bucket: {
                                                                        readonly type: "string";
                                                                        readonly title: "Bucket";
                                                                        readonly required: true;
                                                                    };
                                                                };
                                                                readonly title: "DistributionGroupReference";
                                                            }, {
                                                                readonly type: "object";
                                                                readonly additionalProperties: false;
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["bins"];
                                                                        readonly title: "Kind";
                                                                        readonly required: true;
                                                                    };
                                                                    readonly metric: {
                                                                        readonly type: "string";
                                                                        readonly title: "Metric";
                                                                        readonly required: true;
                                                                    };
                                                                    readonly x: {
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "integer";
                                                                        };
                                                                        readonly description: "从 0 开始的首尾分箱下标，均包含在内。";
                                                                        readonly title: "X";
                                                                        readonly required: true;
                                                                    };
                                                                    readonly y: {
                                                                        readonly oneOf: readonly [{
                                                                            readonly type: "array";
                                                                            readonly items: {
                                                                                readonly type: "integer";
                                                                            };
                                                                        }, {
                                                                            readonly type: "null";
                                                                        }];
                                                                        readonly description: "仅二维热图填写，同样包含首尾分箱。";
                                                                        readonly title: "Y";
                                                                    };
                                                                };
                                                                readonly title: "DistributionBinsReference";
                                                            }];
                                                        };
                                                        readonly title: "Members";
                                                        readonly required: true;
                                                    };
                                                };
                                                readonly title: "DistributionGroup";
                                            };
                                            readonly title: "Groups";
                                            readonly required: true;
                                        };
                                    };
                                    readonly title: "DistributionMetricGrouping";
                                };
                                readonly title: "Comparisons";
                            };
                            readonly overlap_codes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly description: "仅完整范围：与本项确属同一实际原因的视觉评分代码；无重复原因时为空。";
                                readonly title: "Overlap Codes";
                            };
                            readonly grouping: {
                                readonly type: "string";
                                readonly description: "合理范围或分组及其统计依据；单一合理范围和均衡多范围不扣分。";
                                readonly title: "Grouping";
                                readonly required: true;
                            };
                            readonly evidence_refs: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly description: "引用输入facts中真实的统计项ref，不编造数量或缺失类别。";
                                readonly title: "Evidence Refs";
                                readonly required: true;
                            };
                            readonly analysis: {
                                readonly type: "string";
                                readonly description: "先说结论，再用日常中文说明实际质量影响，不写分类定义或内部流程。";
                                readonly title: "Analysis";
                                readonly required: true;
                            };
                        };
                        readonly title: "QualityDistributionReview";
                    };
                }, {
                    readonly type: "null";
                }];
                readonly title: "Distribution Reviews";
            };
            readonly aliases: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly axis: {
                            readonly type: "string";
                            readonly enum: readonly ["morphology", "special_morphology", "appearance", "structural_region", "hard_type", "texture", "confusable"];
                            readonly title: "Axis";
                            readonly required: true;
                        };
                        readonly source: {
                            readonly type: "string";
                            readonly title: "Source";
                            readonly required: true;
                        };
                        readonly canonical: {
                            readonly type: "string";
                            readonly description: "同一实际场景使用同一名称；不同原因不得为去重而合并。";
                            readonly title: "Canonical";
                            readonly required: true;
                        };
                    };
                    readonly title: "QualitySceneAlias";
                };
                readonly title: "Aliases";
            };
            readonly redundancy_reviewed: {
                readonly type: "boolean";
                readonly description: "已实际对照冻结相似候选及已识别相似组的原图，完成低信息增量判断。";
                readonly title: "Redundancy Reviewed";
                readonly required: true;
            };
            readonly redundant_groups: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly members: {
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
                            readonly title: "Members";
                            readonly required: true;
                        };
                        readonly reason: {
                            readonly type: "string";
                            readonly description: "依据实际对照的原图解释为何只增加很少信息，候选相似度不是依据。";
                            readonly title: "Reason";
                            readonly required: true;
                        };
                    };
                    readonly title: "QualityRedundantGroup";
                };
                readonly title: "Redundant Groups";
            };
            readonly preview_id: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly description: "audit_quality_score返回的预览标识；正式报告原样提交，不自行生成。";
                readonly title: "Preview Id";
            };
        };
        readonly title: "QualityAssessment";
    };
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
        readonly description: "总体结论用两三句日常中文说清这批数据的主要发现。有问题时说明实际影响和应优先处理的事项。不复述数量、占比或分数，统计留在图表和明细中。概括当前可开展的用途。";
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
                    readonly description: "精选5至10张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。";
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
                    readonly description: "精选5至10张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。";
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
                    readonly enum: readonly ["image_label_mismatch", "category_mismatch", "extra_annotation", "missing_annotation", "missing_content", "extra_content", "split", "merge", "position_difference"];
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
                    readonly enum: readonly ["NO_CANDIDATES", "NO_ELIGIBLE_CANDIDATES", "PROGRAM_REVIEWED:EQUIVALENT", "MODEL_REVIEWED:EQUIVALENT", "MODEL_REVIEWED:MATERIAL", "MODEL_REVIEWED:UNCERTAIN"];
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
                    readonly description: "从该范围精选5至10张主Agent已实际查看的完整原图；用于比较的图指定counter。";
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
        readonly default: "综合全部有效图级结果、全局发现、程序统计、来源信息和选用的评测成果，形成面向非项目人员的质量与评测能力报告，按工具合同提交。\n\n结论只概括当前用途和主要视觉发现，数量由页面统计展示。随后回答自洽性、标注复核重点、视觉覆盖、独立性与代表性、模型能力和使用条件。\n\n自洽性开头用一两句话回答：在内容相同、可以对照的图像中，标注是否一致；程序标出的差异经过模型看图后，哪些仍然成立。两套统计由程序计算并在页面展示，按主图计数，同一张图在同一类只记一次。随后按实际类型解释程序发现和模型复核的差别，直接说两侧标注哪里不同、为何保留或排除，配5至10张相关完整原图。\n\n无候选、无有效候选、标注一致等非空范围各自说明对照图的情况和跨图比较结果，精选5至10张属于该范围的完整原图。范围由记录中的consistency.source_status确定。单张图是否漏标、圈多了或把一个目标分成几个，放在标注质量章节；形态、亮度和纹理变化放在视觉覆盖或模型能力章节。章节概述聚焦标注是否一致，具体图像细节在对应小节说明。\n\n覆盖按实际形态、方向、尺度感受、可见度、背景和结构关系形成主题。独立性说清哪些图片重复、哪些可能拍自同一件物品；缺少登记时，直接列出需要补记的物品、批次或采集来源，以及完成后可以怎样分组。\n\n能力专题从真实视觉困难形成。每个小点说明观察、跨图共性与差别、可能检验的模型表现，并引用有完整原图的案例。单图特殊现象按个例解释，尚缺的能力场景集中列出。固定标签供内部统计，正文专题按证据组织。\n\n每条所选知识分别说明检查动作、适用情况、实际图像观察与对照，以及对本次判断的作用。精选主 Agent 已查看的完整原图解释应用。标题及知识状态来自冻结条目，逐图核对数量来自程序统计。知识章节使用标题、描述、图像证据和结构化分析；知识为空时列表为空。\n\n每个分析点直接讲图里有什么、标注有没有圈对、两图哪里相同或不同，以及可以据此检查模型的什么表现。正文自成一段完整说明，相关原图通过关联字段在该处展示。每张图的说明指出应看哪里、具体形态或差别。分析和图证关联当前有效图级版本。\n\n分别评价视觉探索、训练实验、内部调试、图像级评测、矩形框定位评测、像素区域评测及正式评测基准。各项说明可开展的工作和实际条件。共同缺项集中在用途章节，各主题只补充特有条件。\n\n先写结论，再用具体事实解释原因和影响。一句话只讲一个要点，主语是图中的部位、已有标注或要做的检查。提交前逐段按普通读者的视角重读：读者能否指着图片找到你说的地方，能否直接知道你的判断或下一步动作；读不顺的句子用日常用语重写。整体统计由页面交代，技术明细保留在结构化记录中。\n\n报告帮助读者看懂这批图像、标注和后续工作，回答自洽性、标注质量、视觉覆盖、独立性与代表性、模型能力和数据用途六个问题。开头直接说现在能用来做什么、主要发现什么。\n\n每段围绕一个要点，通常用两三句话讲清楚：图里哪里值得看，标注或两张图有什么相同和不同，这对使用数据有什么影响。直接下有依据的判断。需要读者复看时，说清看哪个部位、要确认什么。\n\n正文使用日常动词，少用抽象名词串。说“这两张图拍的是同一处”“几个框圈住同一条边”“补充其他批次的图片”，把判断过程讲成具体的图像事实和动作。不要照搬工具输出的判定术语，或用一串限制声明代替结果。任务规则、系统状态和保存过程留在配置与记录里。\n\n标题只写主题，层级编号由页面统一添加，数量在正文统计或图表中单独展示。\n\n数量和来源状态由页面统计展示，正文解释具体事实。新作业具有quality_score_version时，最终报告前调用audit_quality_score。主Agent归并同义场景（aliases），只有同一种实际原因才使用相同canonical；尺寸与位置是独立原因。低信息增量组逐图引用当前有效版本，实际打开dataset_profile.near_candidate_members中的候选原图后再确认redundancy_reviewed；候选相似度不等于冗余。没有低信息增量组时提交空组，不编造组。复核主要扣分场景的原图，读取程序计算结果解释分数，quality_assessment原样采用工具返回的assessment。数据一致性计分只采用冻结的上游数据一致性作业分类；图级审计独立发现和待确认疑点不作为一致性扣分，不将无候选或无有效候选描述为完成有效对照。综合分及三项分数由第一章图表展示，第二章用图表展示具体扣分、数量、占比与影响系数；冲突图证放在自洽性章节。数据分布由程序从冻结原始图像和标注计算，按需通过audit_distribution读取；分布图表由页面展示，正文引用数字直接采用工具结果。共同缺少的材料集中写成下一步：补哪类图片、确认哪些参考标注、登记哪些来源，再开展什么工作。各主题只补充自己特有的准备事项，不在每段重复同一条件。\n\n完成一组图像的比较后立即用audit_observation保存简短事实及引用，再读取下一组；该工具会释放已经观察的图片。当前可用图片直接联合比较，不反复读取。能直接提交图级结果时使用audit_commit，无需额外保存观察。\n\n报告用audit_report_section逐章保存，base_revision采用当前草稿版本，省略已经保存且没有变化的字段。先保存report_cases及其引用，再保存对应分析和用途。定稿仅提交commit_key和draft_revision；验证失败只修正指出的字段，不重发整份报告。\n\n主 Agent 综合全部有效图级事实和发现，各小点独立说明并关联5至10张相关原图，读者在当前小节就能对照图片读懂。案例及图像编号只填关联字段，由页面在正文旁展示图片。案例保存可复用的图像依据；知识描述说清教我们看哪里、这次看到了什么。\n\n正式图证使用主 Agent 实际查看的完整原图及原始标注。局部视图用于核查，正文图库使用完整原图。每处需要图证的分析精选5至10张能够共同说明问题的原图，说明各图的现象或关键差别。标注冲突由程序从上游实际比较记录中选择5至10对原图，主图在左、实际对比图在右；不足5对按实际数量展示。其他图证尽量选5至10张，不足5张保留实际数量。证据不足时继续查图或收拢主题。\n\n视觉覆盖围绕形态、方向、可见度、背景、结构关系和正常变化组织。用途说清这些场景可以检查模型的什么表现，以及具体需要做的准备。\n\n总体结论用两三句日常中文说清这批数据的主要发现。有问题时说明实际影响和应优先处理的事项。不复述数量、占比或分数，统计留在图表和明细中。\n正文使用自然、简洁、语义明确的日常中文。先说结论，再解释主要原因和影响。每个章节直接说明对应章节的发现，不逐项罗列分类定义。章节开头概括主要情况，不逐张列举现象；具体问题放在对应小节分析。正文不出现图像文件名、路径、样本ID或缩写编号，不以罗列图像名称代替分析；文件名只保留在图像查看信息中。内部优先级、执行流程、判断权限和自我免责说明不写进正文。\n\n一致性与分布评分由程序执行统一公式，你只判断实际影响并给出系数。不得自行填写分数、计数或改写上游分类。\n完整范围先读取audit_statistics中的consistency_scoring、audit_distribution(scoring=true)中的scopes；轻量范围使用输入中的consistency_scoring、distribution_facts。\n\nconsistency_reviews恰好覆盖consistency_scoring各scope_id中列出的扣分项，每项填写scope_id、code、coefficient、analysis、evidence_refs。evidence_refs只填该项ref；没有扣分项的范围不返回一致性系数。系数范围由Schema规定：1表示按基础扣分处理，低于1须说明已有证据表明实际影响较小，高于1须说明识别、训练或评估会如何受影响。数量、比例和稀缺程度已进入基础扣分，不能再仅因数量少或比例低重复加重系数；一致配对的数量不能成为减轻系数的理由。分析直接说明实际影响，不写图像名称、路径、流程或免责文字。\n\n标注一致性按全部冻结图像作分母，反向图对归并后，每张图只进入其最高优先级的计分项：类别不一致、少标/多标实例、少标/多标内容。拆分、合并和位置差异不扣分。\n\ndistribution_reviews恰好覆盖每个scope_id的六个axis。每项填写scope_id、axis、status、coefficient、comparisons、grouping、evidence_refs、analysis、overlap_codes。status使用normal、problem、not_applicable。只有problem填写有效coefficient，其他状态为null。evidence_refs只填本方向ref。\n类别方向按程序提供的base_deduction判断：大于0必须problem并给系数，否则normal；无统计为not_applicable。类别comparisons为空，由程序比较全部实际类别的图像数和实例数，取较严重口径一次计分，不自选少数类别代替整体，不推断未出现类别。\n\n其他方向先判断统计是否属于一个合理范围；统一规格、连续变化、普通峰谷及固定检测位置不属于覆盖不足。多个有意义的范围且数量均衡也正常。只有确需可比覆盖的多个范围失衡，才标problem并填写comparisons。正常或不适用时comparisons为空；没有统计的方向必须not_applicable。\ncomparisons每个metric至多一次，引用本方向实际统计名。每个比较包含groups，每组有label和members。分类分组members用{kind:\"group\",metric:统计名,bucket:counts中的键}；分箱用{kind:\"bins\",metric:统计名,x:[首箱,末箱],y:[首箱,末箱]}，下标从0开始且包含首尾，一维统计不填写y。组内可合并多个引用，各组不得重叠，必须覆盖该统计全部有效数据，至少两个非空组，不编造空场景。分组依据写入grouping。程序分别比较实例数与涉及图像数、不同口径，取最大基础扣分，不重复累加。\n图像尺寸与比例、实例尺寸与比例面积分别联合判断，不能把每个直方图的低频区间都当成独立场景。无标注图不等于漏标，单实例多于多实例不自动成为问题。采集来源仅使用已登记的批次、相机、站点、来源，不把训练/测试集划分当作来源失衡，不推测未登记信息。\n\n影响系数须依据本范围、本方向的实际后果并说明依据，不能用其他数据集的情况代替。分布扣分对象及数量由程序生成，不手写affected或level。distribution_analysis概括实际分布是否合理、主要问题及影响，不机械罗列分类。完整范围同一实际原因同时进入视觉和分布评分时，overlap_codes可引用对应视觉代码：实例几何B1/B2、位置B3/B4、每图实例数C3/C4；其他情况为空。\n";
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