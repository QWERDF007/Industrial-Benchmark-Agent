export declare const auditDatasetParameters: {
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
    readonly section: {
        readonly type: "string";
        readonly enum: readonly ["duplicates", "similar_candidates", "benchmark", "benchmark_leakage"];
        readonly title: "Section";
        readonly required: true;
    };
};
export declare const auditMemoryParameters: {
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
};
export declare const auditDraftQueryParameters: {
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
    readonly field: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Field";
    };
};
export declare const auditDefectProfileParameters: {
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
    readonly features: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly feature_id: {
                    readonly type: "string";
                    readonly title: "Feature Id";
                    readonly required: true;
                };
                readonly category: {
                    readonly type: "string";
                    readonly title: "Category";
                    readonly required: true;
                };
                readonly signature: {
                    readonly type: "string";
                    readonly description: "实际缺陷的可见形态、外观和位置关系。";
                    readonly title: "Signature";
                    readonly required: true;
                };
                readonly normal_distinctions: {
                    readonly type: "string";
                    readonly description: "比较良品时应核对的可见差别，不能凭频次或普通纹理判断困难。";
                    readonly title: "Normal Distinctions";
                    readonly required: true;
                };
                readonly references: {
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
                    readonly title: "References";
                    readonly required: true;
                };
            };
            readonly title: "AuditDefectFeature";
        };
        readonly title: "Features";
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
export declare const auditReviewParameters: {
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
export declare const auditObservationParameters: {
    readonly evidence_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Evidence Ids";
        readonly required: true;
    };
    readonly facts: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "已看清的简短视觉事实及关键差别。成功保存后释放已观察附件，需要复看时显式读图。";
        readonly title: "Facts";
        readonly required: true;
    };
};
export declare const auditReportDraftParameters: {
    readonly base_revision: {
        readonly type: "integer";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly fields: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly quality_assessment: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
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
            readonly discovery_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Discovery Ids";
            };
            readonly conclusion: {
                readonly type: "string";
                readonly description: "概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。";
                readonly title: "Conclusion";
            };
            readonly consistency_analysis: {
                readonly type: "string";
                readonly description: "用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。";
                readonly title: "Consistency Analysis";
            };
            readonly knowledge_analysis: {
                readonly type: "string";
                readonly description: "简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。";
                readonly title: "Knowledge Analysis";
            };
            readonly coverage_analysis: {
                readonly type: "string";
                readonly description: "概括实际可见形态、背景、结构关系及尚缺场景。";
                readonly title: "Coverage Analysis";
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
            };
            readonly review_priorities: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "本轮真实保留疑点的复看位置和动作；没有则为空。";
                readonly title: "Review Priorities";
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。";
                readonly title: "Limitations";
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
        readonly title: "AuditReportFields";
        readonly required: true;
    };
};
export declare const auditReportFinalizeParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly draft_revision: {
        readonly type: "integer";
        readonly title: "Draft Revision";
        readonly required: true;
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