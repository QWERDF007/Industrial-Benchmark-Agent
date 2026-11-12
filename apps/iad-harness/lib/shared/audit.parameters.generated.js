/* Generated from Python AuditAgentStart by scripts/generate-contracts.js. */
export const auditEvidenceParameters = {
    "run_id": {
        "type": "string",
        "title": "Run Id"
    },
    "sample_id": {
        "type": "string",
        "title": "Sample Id"
    },
    "evidence_id": {
        "type": "string",
        "title": "Evidence Id",
        "required": true
    },
    "suggestion_id": {
        "type": "string",
        "title": "Suggestion Id"
    }
};
export const auditBatchParameters = {
    "commit_key": {
        "type": "string",
        "title": "Commit Key",
        "required": true
    },
    "batch_number": {
        "type": "integer",
        "title": "Batch Number",
        "required": true
    },
    "base_revision": {
        "type": "integer",
        "title": "Base Revision",
        "required": true
    },
    "discoveries": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "group_id": {
                    "type": "string",
                    "title": "Group Id",
                    "required": true
                },
                "kind": {
                    "type": "string",
                    "enum": [
                        "quality_issue",
                        "visual_pattern",
                        "judgment_boundary"
                    ],
                    "title": "Kind",
                    "required": true
                },
                "dimension": {
                    "type": "string",
                    "enum": [
                        "annotation_quality",
                        "visual_coverage",
                        "evaluation_difficulty"
                    ],
                    "title": "Dimension",
                    "required": true
                },
                "status": {
                    "type": "string",
                    "enum": [
                        "pending",
                        "supported",
                        "disputed",
                        "withdrawn"
                    ],
                    "title": "Status",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "title": "Title",
                    "required": true
                },
                "description": {
                    "type": "string",
                    "title": "Description",
                    "required": true
                },
                "visual_signature": {
                    "type": "string",
                    "title": "Visual Signature",
                    "required": true
                },
                "annotation_relation": {
                    "type": "string",
                    "title": "Annotation Relation",
                    "required": true
                },
                "scope": {
                    "type": "string",
                    "title": "Scope",
                    "required": true
                },
                "key_difference": {
                    "type": "string",
                    "title": "Key Difference",
                    "default": ""
                },
                "unresolved_question": {
                    "type": "string",
                    "description": "需要新图像或对照才能回答的具体问题；没有则为空字符串。",
                    "title": "Unresolved Question",
                    "default": ""
                },
                "next_batch_focus": {
                    "type": "string",
                    "title": "Next Batch Focus",
                    "default": ""
                },
                "support_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "title": "Support Refs",
                    "required": true
                },
                "counter_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "title": "Counter Refs"
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "title": "Representatives"
                }
            },
            "title": "AuditDiscovery"
        },
        "title": "Discoveries",
        "required": true
    },
    "review_requests": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "sample_id": {
                    "type": "string",
                    "title": "Sample Id",
                    "required": true
                },
                "result_revision": {
                    "type": "integer",
                    "title": "Result Revision",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                },
                "conflict_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "title": "Conflict Refs",
                    "required": true
                }
            },
            "title": "AuditReviewRequest"
        },
        "title": "Review Requests"
    }
};
export const auditCommitParameters = {
    "commit_key": {
        "type": "string",
        "description": "本次图级终稿的幂等键，仅同内容重传复用。",
        "title": "Commit Key",
        "required": true
    },
    "final": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "execution_status": {
                "type": "string",
                "enum": [
                    "completed",
                    "incomplete",
                    "failed"
                ],
                "title": "Execution Status",
                "required": true
            },
            "state": {
                "oneOf": [
                    {
                        "type": "string",
                        "enum": [
                            "normal",
                            "suspect"
                        ]
                    },
                    {
                        "type": "null"
                    }
                ],
                "title": "State",
                "required": true
            },
            "analysis": {
                "type": "string",
                "description": "只概括本图可见形态及标注覆盖、定位、实例关系。上游与知识评估分别填写对应字段。",
                "title": "Analysis",
                "required": true
            },
            "conclusion": {
                "type": "string",
                "title": "Conclusion",
                "required": true
            },
            "basis": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "支持本图判断的具体图像事实。",
                "title": "Basis",
                "required": true
            },
            "evidence_ids": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。",
                "title": "Evidence Ids",
                "required": true
            },
            "check_assessments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "check_id": {
                            "type": "string",
                            "description": "必须来自本场knowledge.entries[].check.check_id；不是标注ID、上游差异ID或自拟图像检查项。",
                            "title": "Check Id",
                            "required": true
                        },
                        "status": {
                            "type": "string",
                            "enum": [
                                "consistent",
                                "deviates",
                                "unobservable",
                                "not_applicable"
                            ],
                            "title": "Status",
                            "required": true
                        },
                        "description": {
                            "type": "string",
                            "description": "说明本图可见现象与该知识检查动作的具体对应和适用理由。",
                            "title": "Description",
                            "required": true
                        },
                        "evidence_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "本次实际观察的完整原图身份；局部图仅用于观察，不单独引用。",
                            "title": "Evidence Ids",
                            "required": true
                        }
                    },
                    "title": "AuditCheckAssessment"
                },
                "description": "仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。",
                "title": "Check Assessments",
                "required": true
            },
            "consistency_review": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "source_issue_id": {
                            "type": "string",
                            "title": "Source Issue Id",
                            "required": true
                        },
                        "assessment": {
                            "type": "string",
                            "enum": [
                                "supported",
                                "unsupported",
                                "insufficient"
                            ],
                            "title": "Assessment",
                            "required": true
                        },
                        "reason": {
                            "type": "string",
                            "title": "Reason",
                            "required": true
                        },
                        "evidence_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Evidence Ids",
                            "required": true
                        }
                    },
                    "title": "AuditConsistencyAssessment"
                },
                "description": "恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。",
                "title": "Consistency Review",
                "required": true
            },
            "findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "finding_id": {
                            "type": "string",
                            "title": "Finding Id",
                            "required": true
                        },
                        "description": {
                            "type": "string",
                            "title": "Description",
                            "required": true
                        },
                        "location": {
                            "type": "string",
                            "title": "Location",
                            "required": true
                        },
                        "check_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。",
                            "title": "Check Ids"
                        },
                        "evidence_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Evidence Ids",
                            "required": true
                        },
                        "normal_explanation": {
                            "type": "string",
                            "title": "Normal Explanation",
                            "required": true
                        },
                        "limitations": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Limitations",
                            "required": true
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "image_label_mismatch",
                                "category_mismatch",
                                "extra_annotation",
                                "missing_annotation",
                                "position_difference",
                                "split",
                                "merge"
                            ],
                            "description": "按可见问题分类；类别差异指有效同内容对照中同一对象的原始分组差异。",
                            "title": "Type",
                            "required": true
                        },
                        "annotation_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "引用当前主图真实annotation_id；类别、多标、位置和合并至少1个，拆分至少2个，少标或图像级可以为空。",
                            "title": "Annotation Ids"
                        },
                        "consistency_issue_refs": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "只引用本图上游result.issues中的真实issue_id，独立发现且不采纳上游问题时为空。",
                            "title": "Consistency Issue Refs"
                        }
                    },
                    "title": "AuditFinding"
                },
                "title": "Findings",
                "required": true
            },
            "observations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "description": {
                            "type": "string",
                            "title": "Description",
                            "required": true
                        },
                        "annotation_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Annotation Ids"
                        },
                        "evidence_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "本次实际观察的完整原图身份，不单独引用局部图。",
                            "title": "Evidence Ids",
                            "required": true
                        }
                    },
                    "title": "AuditObservation"
                },
                "description": "记录有比较价值的可见现象，描述简短；普通观察不计入质量疑点。",
                "title": "Observations"
            },
            "hypothesis_assessments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "group_id": {
                            "type": "string",
                            "title": "Group Id",
                            "required": true
                        },
                        "assessment": {
                            "type": "string",
                            "enum": [
                                "supported",
                                "counter",
                                "unconfirmed",
                                "not_applicable"
                            ],
                            "title": "Assessment",
                            "required": true
                        },
                        "reason": {
                            "type": "string",
                            "title": "Reason",
                            "required": true
                        },
                        "evidence_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Evidence Ids",
                            "required": true
                        }
                    },
                    "title": "AuditHypothesisAssessment"
                },
                "title": "Hypothesis Assessments"
            },
            "visual_features": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "kind": {
                            "type": "string",
                            "enum": [
                                "morphology",
                                "location",
                                "size",
                                "contrast",
                                "structural_relation",
                                "instances",
                                "background"
                            ],
                            "title": "Kind",
                            "required": true
                        },
                        "description": {
                            "type": "string",
                            "title": "Description",
                            "required": true
                        },
                        "annotation_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Annotation Ids"
                        },
                        "evidence_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Evidence Ids",
                            "required": true
                        }
                    },
                    "title": "AuditVisualFeature"
                },
                "title": "Visual Features"
            },
            "limitations": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。",
                "title": "Limitations",
                "required": true
            }
        },
        "title": "AuditLegacyFinal",
        "required": true
    }
};
export const auditRecordParameters = {
    "page": {
        "type": "integer",
        "title": "Page",
        "default": 1
    },
    "page_size": {
        "type": "integer",
        "title": "Page Size",
        "default": 30
    },
    "sample_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Sample Id"
    },
    "issue_type": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Issue Type"
    },
    "consistency_assessment": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "supported",
                    "unsupported",
                    "insufficient"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Consistency Assessment"
    },
    "knowledge_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Knowledge Id"
    },
    "state": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "normal",
                    "suspect",
                    "incomplete"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "State"
    }
};
export const auditReportParameters = {
    "commit_key": {
        "type": "string",
        "title": "Commit Key",
        "required": true
    },
    "discovery_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Discovery Ids",
        "required": true
    },
    "conclusion": {
        "type": "string",
        "description": "概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。",
        "title": "Conclusion",
        "required": true
    },
    "consistency_analysis": {
        "type": "string",
        "description": "用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。",
        "title": "Consistency Analysis",
        "required": true
    },
    "knowledge_analysis": {
        "type": "string",
        "description": "简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。",
        "title": "Knowledge Analysis",
        "default": ""
    },
    "coverage_analysis": {
        "type": "string",
        "description": "概括实际可见形态、背景、结构关系及尚缺场景。",
        "title": "Coverage Analysis",
        "required": true
    },
    "coverage_topics": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "analysis": {
                    "type": "string",
                    "description": "围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。",
                    "title": "Analysis",
                    "required": true
                },
                "evidence_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "title": "Evidence Refs",
                    "required": true
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "description": "精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。",
                    "title": "Representatives"
                },
                "related_case_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。",
                    "title": "Related Case Ids"
                },
                "title": {
                    "type": "string",
                    "description": "根据本作业实际观察命名，不加序号，不照搬固定的覆盖主题。",
                    "title": "Title",
                    "required": true
                }
            },
            "title": "AuditCoverageTopic"
        },
        "description": "本作业有真实图证的覆盖画像主题，标题、条数、正文及选图由实际作业决定。",
        "title": "Coverage Topics"
    },
    "consistency_analyses": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "analysis": {
                    "type": "string",
                    "description": "围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。",
                    "title": "Analysis",
                    "required": true
                },
                "evidence_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "description": "支撑本项分析的当前有效图级记录。没有相关材料时为空并在正文说明。",
                    "title": "Evidence Refs",
                    "required": true
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "description": "精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。",
                    "title": "Representatives"
                },
                "related_case_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。",
                    "title": "Related Case Ids"
                },
                "issue_type": {
                    "type": "string",
                    "enum": [
                        "image_label_mismatch",
                        "category_mismatch",
                        "extra_annotation",
                        "missing_annotation",
                        "position_difference",
                        "split",
                        "merge"
                    ],
                    "description": "沿用本数据格式的现有差异类型，每类单独分析，不合并多标少标或拆分合并。",
                    "title": "Issue Type",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "title": "Title",
                    "default": ""
                },
                "description": {
                    "type": "string",
                    "description": "简短说明该类冲突的实际可见现象。",
                    "title": "Description",
                    "default": ""
                },
                "audit_result": {
                    "type": "string",
                    "description": "结合当前图证说明本次保留或排除该疑点的具体理由。",
                    "title": "Audit Result",
                    "default": ""
                }
            },
            "title": "AuditConsistencyAnalysis"
        },
        "description": "按上下文applicable_issue_types的每个适用差异类型各一项；零疑点也如实分析，无候选、无有效候选、一致在范围分析中展开。",
        "title": "Consistency Analyses"
    },
    "consistency_scopes": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "source_status": {
                    "type": "string",
                    "enum": [
                        "NO_CANDIDATES",
                        "NO_ELIGIBLE_CANDIDATES",
                        "MODEL_REVIEWED:EQUIVALENT",
                        "MODEL_REVIEWED:MATERIAL",
                        "MODEL_REVIEWED:UNCERTAIN"
                    ],
                    "title": "Source Status",
                    "required": true
                },
                "analysis": {
                    "type": "string",
                    "description": "只讲这组能否找到可比较的图、相同内容的标注是否一致及具体差异；用日常语言说明。",
                    "title": "Analysis",
                    "required": true
                },
                "evidence_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "description": "每张精选原图都须关联其当前有效图级版本；通常kind为image，sample_id与representatives中的原图一致。",
                    "title": "Evidence Refs"
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "description": "从该范围精选3至8张主Agent已实际查看的完整原图；用于比较的图指定counter。",
                    "title": "Representatives"
                }
            },
            "title": "AuditConsistencyScope"
        },
        "description": "分别解释无候选、无有效候选、标注一致等来源范围。",
        "title": "Consistency Scopes"
    },
    "knowledge_analyses": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "check_id": {
                    "type": "string",
                    "title": "Check Id",
                    "required": true
                },
                "description": {
                    "type": "string",
                    "description": "用自然语言概括该知识关注的可见现象和检查动作。",
                    "title": "Description",
                    "required": true
                },
                "applicability": {
                    "type": "string",
                    "description": "说明本次哪些可见场景适用，哪些不适用。",
                    "title": "Applicability",
                    "required": true
                },
                "analysis": {
                    "type": "string",
                    "description": "依据本次实际图像说明观察、对照及与知识的关系。",
                    "title": "Analysis",
                    "required": true
                },
                "audit_impact": {
                    "type": "string",
                    "description": "该知识帮助辨认或区分的具体可见现象及其对本次判断的影响。",
                    "title": "Audit Impact",
                    "required": true
                },
                "evidence_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "title": "Evidence Refs",
                    "required": true
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "title": "Representatives"
                }
            },
            "title": "AuditKnowledgeAnalysis"
        },
        "description": "逐项覆盖全部所选知识，说明内容、适用性、图证对照及实际作用。",
        "title": "Knowledge Analyses"
    },
    "independence_analysis": {
        "type": "string",
        "description": "依据真实重复和来源登记说明样本结构，以及尚缺哪些具体登记。",
        "title": "Independence Analysis",
        "required": true
    },
    "capabilities": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "tag": {
                    "type": "string",
                    "enum": [
                        "representative_test_set",
                        "ordinary_normal",
                        "hard_normal",
                        "near_ok_ng_pair",
                        "tiny_defect",
                        "low_contrast_defect",
                        "structural_relation",
                        "missing_component",
                        "misalignment",
                        "multi_object",
                        "in_domain",
                        "unseen_batch",
                        "lighting_shift"
                    ],
                    "title": "Tag",
                    "required": true
                },
                "coverage_status": {
                    "type": "string",
                    "enum": [
                        "observed",
                        "candidate",
                        "not_observed",
                        "not_applicable"
                    ],
                    "title": "Coverage Status",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "description": "该能力实际出现的视觉困难，或尚缺的具体场景。",
                    "title": "Reason",
                    "required": true
                },
                "evidence_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "title": "Evidence Refs",
                    "required": true
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "title": "Representatives"
                },
                "missing_conditions": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "仅列该能力特有的使用条件，共同条件留在报告用途章节。",
                    "title": "Missing Conditions"
                }
            },
            "title": "AuditCapability"
        },
        "title": "Capabilities",
        "required": true
    },
    "usability": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "purpose": {
                    "type": "string",
                    "enum": [
                        "exploration",
                        "training_experiment",
                        "debug",
                        "image_evaluation",
                        "bbox_evaluation",
                        "pixel_evaluation",
                        "formal_benchmark"
                    ],
                    "title": "Purpose",
                    "required": true
                },
                "status": {
                    "type": "string",
                    "enum": [
                        "usable",
                        "candidate",
                        "not_ready",
                        "not_evaluated"
                    ],
                    "title": "Status",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "description": "本用途能开展的具体工作，或需先完成的具体准备，用一句话说明。",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AuditUsabilityAssessment"
        },
        "title": "Usability",
        "required": true
    },
    "review_priorities": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "本轮真实保留疑点的复看位置和动作；没有则为空。",
        "title": "Review Priorities",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。",
        "title": "Limitations",
        "required": true
    },
    "report_cases": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "case_id": {
                    "type": "string",
                    "title": "Case Id",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "title": "Title",
                    "required": true
                },
                "observation": {
                    "type": "string",
                    "description": "用日常用语指出图里看哪里、看到了什么、标注圈住了什么。",
                    "title": "Observation",
                    "required": true
                },
                "comparison": {
                    "type": "string",
                    "description": "直接说明图中哪些地方相同或不同，以及为什么这样判断。",
                    "title": "Comparison",
                    "default": ""
                },
                "significance": {
                    "type": "string",
                    "description": "这些图可以用来检查模型的什么表现，或接下来具体应做什么。",
                    "title": "Significance",
                    "required": true
                },
                "evidence_refs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "result_revision": {
                                "type": "integer",
                                "title": "Result Revision",
                                "required": true
                            },
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "finding",
                                    "observation",
                                    "feature",
                                    "image"
                                ],
                                "title": "Kind",
                                "required": true
                            },
                            "index": {
                                "oneOf": [
                                    {
                                        "type": "integer"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Index"
                            }
                        },
                        "title": "AuditResultReference"
                    },
                    "description": "引用具体标注疑点时使用finding及其索引；普通图像比较使用observation、feature或image。",
                    "title": "Evidence Refs",
                    "required": true
                },
                "representatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "sample_id": {
                                "type": "string",
                                "title": "Sample Id",
                                "required": true
                            },
                            "role": {
                                "type": "string",
                                "enum": [
                                    "representative",
                                    "counter"
                                ],
                                "description": "representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AuditRepresentative"
                    },
                    "title": "Representatives",
                    "required": true
                }
            },
            "title": "AuditReportCase"
        },
        "description": "各分析点关联的图像依据；相同案例供多个分析点复用，页面在对应正文旁直接展示精选原图。",
        "title": "Report Cases"
    },
    "capability_topics": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "title": {
                    "type": "string",
                    "title": "Title",
                    "required": true
                },
                "summary": {
                    "type": "string",
                    "title": "Summary",
                    "required": true
                },
                "capability_tags": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": [
                            "representative_test_set",
                            "ordinary_normal",
                            "hard_normal",
                            "near_ok_ng_pair",
                            "tiny_defect",
                            "low_contrast_defect",
                            "structural_relation",
                            "missing_component",
                            "misalignment",
                            "multi_object",
                            "in_domain",
                            "unseen_batch",
                            "lighting_shift"
                        ]
                    },
                    "title": "Capability Tags"
                },
                "points": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {
                                "type": "string",
                                "title": "Title",
                                "required": true
                            },
                            "observation_and_comparison": {
                                "type": "string",
                                "title": "Observation And Comparison",
                                "required": true
                            },
                            "evaluation_value": {
                                "type": "string",
                                "title": "Evaluation Value",
                                "required": true
                            },
                            "case_ids": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "支撑本能力小点的报告案例，须有主Agent实际观察的完整原图。",
                                "title": "Case Ids",
                                "required": true
                            }
                        },
                        "title": "AuditCapabilityPoint"
                    },
                    "title": "Points",
                    "required": true
                },
                "missing_conditions": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "title": "Missing Conditions"
                }
            },
            "title": "AuditCapabilityTopic"
        },
        "description": "由实际视觉困难形成的能力专题，每个小点引用有原图的案例；无图证项在缺口中说明。",
        "title": "Capability Topics"
    }
};
export const auditReportEvidenceParameters = {
    "sample_id": {
        "type": "string",
        "title": "Sample Id",
        "required": true
    },
    "evidence_id": {
        "type": "string",
        "title": "Evidence Id",
        "required": true
    }
};
export const auditCropParameters = {
    "bbox": {
        "type": "array",
        "items": {
            "type": "integer"
        },
        "title": "Bbox",
        "required": true
    },
    "sample_id": {
        "type": "string",
        "title": "Sample Id",
        "required": true
    },
    "offset": {
        "type": "integer",
        "title": "Offset",
        "default": 0
    },
    "limit": {
        "oneOf": [
            {
                "type": "integer"
            },
            {
                "type": "null"
            }
        ],
        "title": "Limit"
    }
};
export const auditStartParameters = {
    "submission_id": {
        "type": "string",
        "title": "Submission Id",
        "required": true
    },
    "subset_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Subset Ids",
        "required": true
    },
    "consistency_job_id": {
        "type": "string",
        "title": "Consistency Job Id",
        "required": true
    },
    "knowledge": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "job_id": {
                "type": "string",
                "title": "Job Id",
                "required": true
            },
            "version_id": {
                "type": "string",
                "title": "Version Id",
                "required": true
            },
            "entry_ids": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "title": "Entry Ids",
                "required": true
            }
        },
        "title": "AuditKnowledgeSelection"
    },
    "master_prompt": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "system_prompt": {
                "oneOf": [
                    {
                        "type": "string"
                    },
                    {
                        "type": "null"
                    }
                ],
                "title": "System Prompt",
                "required": true
            },
            "user_prompt": {
                "type": "string",
                "title": "User Prompt",
                "required": true
            }
        },
        "title": "AnalysisRolePrompts"
    },
    "report_instruction": {
        "type": "string",
        "title": "Report Instruction",
        "default": "综合全部有效图级结果、全局发现、程序统计、来源信息和选用的评测成果，形成面向非项目人员的质量与评测能力报告，按工具合同提交。\n\n结论只概括当前用途和主要视觉发现，数量由页面统计展示。随后回答自洽性、标注复核重点、视觉覆盖、独立性与代表性、模型能力和使用条件。\n\n自洽性开头用一两句话回答：在内容相同、可以对照的图像中，标注是否一致；程序标出的差异经过模型看图后，哪些仍然成立。两套统计由程序计算并在页面展示，按主图计数，同一张图在同一类只记一次。随后按实际类型解释程序发现和模型复核的差别，直接说两侧标注哪里不同、为何保留或排除，配3至8张相关完整原图。\n\n无候选、无有效候选、标注一致等非空范围各自说明对照图的情况和跨图比较结果，精选3至8张属于该范围的完整原图。范围由记录中的consistency.source_status确定。单张图是否漏标、圈多了或把一个目标分成几个，放在标注质量章节；形态、亮度和纹理变化放在视觉覆盖或模型能力章节。章节概述聚焦标注是否一致，具体图像细节在对应小节说明。\n\n覆盖按实际形态、方向、尺度感受、可见度、背景和结构关系形成主题。独立性说清哪些图片重复、哪些可能拍自同一件物品；缺少登记时，直接列出需要补记的物品、批次或采集来源，以及完成后可以怎样分组。\n\n能力专题从真实视觉困难形成。每个小点说明观察、跨图共性与差别、可能检验的模型表现，并引用有完整原图的案例。单图特殊现象按个例解释，尚缺的能力场景集中列出。固定标签供内部统计，正文专题按证据组织。\n\n每条所选知识分别说明检查动作、适用情况、实际图像观察与对照，以及对本次判断的作用。精选主 Agent 已查看的完整原图解释应用。标题及知识状态来自冻结条目，逐图核对数量来自程序统计。知识章节使用标题、描述、图像证据和结构化分析；知识为空时列表为空。\n\n每个分析点直接讲图里有什么、标注有没有圈对、两图哪里相同或不同，以及可以据此检查模型的什么表现。正文自成一段完整说明，相关原图通过关联字段在该处展示。每张图的说明指出应看哪里、具体形态或差别。分析和图证关联当前有效图级版本。\n\n分别评价视觉探索、训练实验、内部调试、图像级评测、矩形框定位评测、像素区域评测及正式评测基准。各项说明可开展的工作和实际条件。共同缺项集中在用途章节，各主题只补充特有条件。\n\n先写具体事实，再解释原因或下一步。一句话只讲一个要点，主语是图中的部位、已有标注或要做的检查。提交前逐段按普通读者的视角重读：读者能否指着图片找到你说的地方，能否直接知道你的判断或下一步动作；读不顺的句子用日常用语重写。整体统计由页面交代，技术明细保留在结构化记录中。\n\n报告帮助读者看懂这批图像、标注和后续工作，回答自洽性、标注质量、视觉覆盖、独立性与代表性、模型能力和数据用途六个问题。开头直接说现在能用来做什么、主要发现什么。\n\n每段围绕一个要点，通常用两三句话讲清楚：图里哪里值得看，标注或两张图有什么相同和不同，这对使用数据有什么影响。直接下有依据的判断。需要读者复看时，说清看哪个部位、要确认什么。\n\n正文使用日常动词，少用抽象名词串。说“这两张图拍的是同一处”“几个框圈住同一条边”“补充其他批次的图片”，把判断过程讲成具体的图像事实和动作。不要照搬工具输出的判定术语，或用一串限制声明代替结果。任务规则、系统状态和保存过程留在配置与记录里。\n\n标题只写主题，层级编号由页面统一添加，数量在正文统计或图表中单独展示。\n\n数量和来源状态由页面统计展示，正文解释具体事实。共同缺少的材料集中写成下一步：补哪类图片、确认哪些参考标注、登记哪些来源，再开展什么工作。各主题只补充自己特有的准备事项，不在每段重复同一条件。\n\n主 Agent 综合全部有效图级事实和发现，各小点独立说明并关联3至8张相关原图，读者在当前小节就能对照图片读懂。案例及图像编号只填关联字段，由页面在正文旁展示图片。案例保存可复用的图像依据；知识描述说清教我们看哪里、这次看到了什么。\n\n正式图证使用主 Agent 实际查看的完整原图及原始标注。局部视图用于核查，正文图库使用完整原图。每处需要图证的分析精选3至8张能够共同说明问题的原图，说明各图的现象或关键差别。有对照关系时将对照原图标为counter，界面以Tab组织当前图组和对照图组。证据不足时继续查图或收拢主题。\n\n视觉覆盖围绕形态、方向、可见度、背景、结构关系和正常变化组织。用途说清这些场景可以检查模型的什么表现，以及具体需要做的准备。"
    },
    "observer_prompt": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "system_prompt": {
                "oneOf": [
                    {
                        "type": "string"
                    },
                    {
                        "type": "null"
                    }
                ],
                "title": "System Prompt",
                "required": true
            },
            "user_prompt": {
                "type": "string",
                "title": "User Prompt",
                "required": true
            }
        },
        "title": "AnalysisRolePrompts"
    },
    "benchmark_build_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Benchmark Build Id"
    }
};
