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
            "state": {
                "type": "string",
                "enum": [
                    "normal",
                    "suspect",
                    "insufficient"
                ],
                "description": "normal表示现有标注与可见图像相符，包括已正确标注的缺陷；suspect表示可见标注问题需复核；insufficient表示证据不足以判断标注是否正确。",
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
                "description": "本场实际打开并观察的完整原图ID，原始标注及全部局部视图属于该原图，不单独引用裁图或掩膜。",
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
                            "title": "Evidence Ids",
                            "required": true
                        }
                    },
                    "title": "AuditCheckAssessment"
                },
                "description": "恰好覆盖全部已选check_id，各有观察原因；未选择知识时为空数组。",
                "title": "Check Assessments",
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
                        }
                    },
                    "title": "AuditFinding"
                },
                "description": "本图全部需要复核的标注问题，无疑点时为空数组，不按数量截断。",
                "title": "Findings",
                "required": true
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
export const auditCropParameters = {
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
    "bbox": {
        "type": "array",
        "items": {
            "type": "integer"
        },
        "title": "Bbox",
        "required": true
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
    "instruction": {
        "type": "string",
        "title": "Instruction",
        "default": "逐图分析原图、人工标注区域、所选知识和一致性结果，给出本图的分析、结论及需要复核的现象。"
    },
    "system_prompt": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "System Prompt"
    }
};
