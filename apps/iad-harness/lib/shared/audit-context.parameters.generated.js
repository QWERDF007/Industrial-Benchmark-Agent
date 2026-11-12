/* Generated from Python audit context models. */
export const auditBatchDeltaParameters = {
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
                    "title": "Unresolved Question",
                    "default": ""
                },
                "next_batch_focus": {
                    "type": "string",
                    "title": "Next Batch Focus",
                    "default": ""
                }
            },
            "title": "AuditDiscoveryBody"
        },
        "description": "只提交新增或正文变化的完整发现。未变传[]；支持、反例和精选分别提交。",
        "title": "Discoveries",
        "required": true
    },
    "evidence_changes": {
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
                "action": {
                    "type": "string",
                    "enum": [
                        "add",
                        "remove",
                        "keep"
                    ],
                    "title": "Action",
                    "required": true
                },
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "counter"
                    ],
                    "title": "Role",
                    "required": true
                },
                "reference": {
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
                    "title": "AuditResultReference",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AuditEvidenceChange"
        },
        "description": "只提交引用变化。改变主张或范围时，以keep、remove或角色迁移逐项复核全部旧引用并说明理由。",
        "title": "Evidence Changes"
    },
    "representative_changes": {
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
                                "description": "representative为典型证据原图；counter为已观察的判断边界对照原图，不代表人工确认的正常真值。",
                                "title": "Role",
                                "default": "representative"
                            },
                            "reason": {
                                "type": "string",
                                "description": "用一句话说明该原图对发现或规律的证据作用，不写逐图详情分析。",
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
            "title": "AuditRepresentativeChange"
        },
        "description": "仅提交精选变化的条目，省略保留既有选择。数量按信息价值决定，不重复堆图。",
        "title": "Representative Changes"
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
export const auditDiscoveryParameters = {
    "group_id": {
        "type": "string",
        "title": "Group Id",
        "required": true
    },
    "revision": {
        "oneOf": [
            {
                "type": "integer"
            },
            {
                "type": "null"
            }
        ],
        "title": "Revision"
    },
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
    "role": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "support",
                    "counter"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Role"
    }
};
export const auditEvidenceCommitParameters = {
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
                "description": "有理解价值但不足以形成质量疑点的简短观察，不计入疑点，也不改变业务结论；不因缺少类别语义或假设规范而填写。",
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
            "selected_evidence": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "evidence_id": {
                            "type": "string",
                            "title": "Evidence Id",
                            "required": true
                        },
                        "reason": {
                            "type": "string",
                            "title": "Reason",
                            "required": true
                        }
                    },
                    "title": "AnalysisEvidenceCandidate"
                },
                "description": "推荐供主Agent复看的少数完整原图及选择理由，可为空；不自动成为正式精选，不重复另一份精选ID列表。",
                "title": "Selected Evidence"
            },
            "limitations": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "title": "Limitations",
                "required": true
            }
        },
        "title": "AuditFinal",
        "required": true
    }
};
export const auditMediaParameters = {
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
    },
    "view": {
        "type": "string",
        "enum": [
            "whole",
            "annotation_rois",
            "all"
        ],
        "description": "whole仅完整原图和标注元数据；annotation_rois为全部标注局部；all显式读取整图及全部必需局部。",
        "title": "View",
        "default": "whole"
    }
};
