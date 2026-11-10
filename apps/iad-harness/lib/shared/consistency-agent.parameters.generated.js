/* Generated from Python anchor review models. */
export const consistencyAgentStartParameters = {
    "mode": {
        "type": "string",
        "enum": [
            "exact",
            "combined"
        ],
        "title": "Mode",
        "default": "combined"
    },
    "min_similarity": {
        "type": "number",
        "title": "Min Similarity",
        "default": 0.98
    },
    "max_exact_candidates": {
        "type": "integer",
        "title": "Max Exact Candidates",
        "default": 5
    },
    "max_similar_candidates": {
        "type": "integer",
        "title": "Max Similar Candidates",
        "default": 10
    },
    "submission_id": {
        "type": "string",
        "description": "本次新建检查的稳定提交ID；重传使用同一ID，主动新建使用新ID",
        "title": "Submission Id",
        "required": true
    },
    "dataset_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Dataset Ids",
        "required": true
    },
    "analysis_kind": {
        "type": "string",
        "enum": [
            "consistency"
        ],
        "title": "Analysis Kind",
        "default": "consistency"
    },
    "instruction": {
        "type": "string",
        "title": "Instruction",
        "default": "执行数据一致性审核。仅以通过同内容验证的候选比较原始标注，保留主图相对于候选图的全部独立差异、实际证据与限制，不裁决哪侧标注正确。"
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
    },
    "subjects": {
        "oneOf": [
            {
                "oneOf": [
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "all_registered"
                                ],
                                "title": "Kind",
                                "default": "all_registered"
                            }
                        },
                        "title": "AllRegisteredScope"
                    },
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "datasets"
                                ],
                                "title": "Kind",
                                "default": "datasets"
                            },
                            "dataset_ids": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "title": "Dataset Ids",
                                "required": true
                            }
                        },
                        "title": "DatasetScope"
                    },
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "samples"
                                ],
                                "title": "Kind",
                                "default": "samples"
                            },
                            "sample_ids": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "title": "Sample Ids",
                                "required": true
                            }
                        },
                        "title": "SampleScope"
                    },
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "filtered"
                                ],
                                "title": "Kind",
                                "default": "filtered"
                            },
                            "dataset_id": {
                                "type": "string",
                                "title": "Dataset Id",
                                "required": true
                            },
                            "filters": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "raw_label_filters": {
                                        "type": "array",
                                        "items": {
                                            "type": "string",
                                            "enum": [
                                                "PASS",
                                                "FAIL",
                                                "UNCERTAIN"
                                            ]
                                        },
                                        "title": "Raw Label Filters"
                                    },
                                    "annotation_filters": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        },
                                        "title": "Annotation Filters"
                                    },
                                    "model_status": {
                                        "type": "string",
                                        "enum": [
                                            "all",
                                            "pending",
                                            "audited",
                                            "risk",
                                            "PASS",
                                            "FAIL",
                                            "UNCERTAIN"
                                        ],
                                        "title": "Model Status",
                                        "default": "all"
                                    },
                                    "review_status": {
                                        "type": "string",
                                        "enum": [
                                            "all",
                                            "pending",
                                            "reviewed",
                                            "PASS",
                                            "HARD_NORMAL",
                                            "FAIL",
                                            "UNCERTAIN",
                                            "SKIP"
                                        ],
                                        "title": "Review Status",
                                        "default": "all"
                                    },
                                    "technical": {
                                        "type": "string",
                                        "enum": [
                                            "all",
                                            "issues"
                                        ],
                                        "title": "Technical",
                                        "default": "all"
                                    },
                                    "reference_status": {
                                        "type": "string",
                                        "enum": [
                                            "all",
                                            "candidate",
                                            "excluded"
                                        ],
                                        "title": "Reference Status",
                                        "default": "all"
                                    },
                                    "search": {
                                        "type": "string",
                                        "title": "Search",
                                        "default": ""
                                    },
                                    "sort_by": {
                                        "type": "string",
                                        "enum": [
                                            "default",
                                            "risk",
                                            "tech"
                                        ],
                                        "title": "Sort By",
                                        "default": "default"
                                    }
                                },
                                "title": "SampleFilters"
                            }
                        },
                        "title": "FilteredScope"
                    }
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Subjects"
    },
    "corpus_scope": {
        "oneOf": [
            {
                "oneOf": [
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "all_registered"
                                ],
                                "title": "Kind",
                                "default": "all_registered"
                            }
                        },
                        "title": "AllRegisteredScope"
                    },
                    {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "kind": {
                                "type": "string",
                                "enum": [
                                    "datasets"
                                ],
                                "title": "Kind",
                                "default": "datasets"
                            },
                            "dataset_ids": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "title": "Dataset Ids",
                                "required": true
                            }
                        },
                        "title": "DatasetScope"
                    }
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Corpus Scope"
    }
};
export const consistencyAnchorReferenceParameters = {
    "run_id": {
        "type": "string",
        "title": "Run Id",
        "required": true
    },
    "anchor_id": {
        "type": "string",
        "title": "Anchor Id",
        "required": true
    }
};
export const consistencyCheckResultsQueryParameters = {
    "run_id": {
        "type": "string",
        "title": "Run Id",
        "required": true
    },
    "page": {
        "type": "integer",
        "title": "Page",
        "default": 1,
        "required": true
    },
    "page_size": {
        "type": "integer",
        "title": "Page Size",
        "default": 18,
        "required": true
    }
};
export const consistencyCheckReferenceParameters = {
    "run_id": {
        "type": "string",
        "title": "Run Id",
        "required": true
    }
};
export const anchorVisualStartParameters = {
    "request_id": {
        "type": "string",
        "description": "request_id标识完整的视觉请求；复用已保存观察须保持原始参数，改变question、candidate_ids或windows时须使用新的request_id。",
        "title": "Request Id",
        "required": true
    },
    "fingerprint": {
        "type": "string",
        "description": "上下文提供的当前冻结清单指纹。",
        "title": "Fingerprint",
        "required": true
    },
    "candidate_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "完整使用上下文中一个冻结页的候选集合，不拆页、不跨页拼接。",
        "title": "Candidate Ids",
        "required": true
    },
    "question": {
        "type": "string",
        "title": "Question",
        "required": true
    },
    "windows": {
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
                "bbox": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    },
                    "description": "原图像素半开窗口[x0,y0,x1,y1)",
                    "title": "Bbox",
                    "required": true
                },
                "padding": {
                    "type": "integer",
                    "description": "四侧扩边的像素数，实际窗口裁至原图画布",
                    "title": "Padding",
                    "default": 0
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "VisualWindow"
        },
        "title": "Windows"
    }
};
export const anchorContextQueryParameters = {
    "candidate_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Candidate Id"
    }
};
export const anchorAssessmentInputParameters = {
    "fingerprint": {
        "type": "string",
        "description": "当前冻结清单指纹。",
        "title": "Fingerprint",
        "required": true
    },
    "observation_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "本场已保存且实际包含当前候选的视觉观察回执。",
        "title": "Observation Ids",
        "required": true
    },
    "assessment": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "candidate_id": {
                "type": "string",
                "title": "Candidate Id",
                "required": true
            },
            "verdict": {
                "type": "string",
                "enum": [
                    "EQUIVALENT",
                    "MATERIAL",
                    "UNCERTAIN"
                ],
                "description": "MATERIAL存在差异；EQUIVALENT一致；UNCERTAIN为合格候选的标注审核证据不足。",
                "title": "Verdict",
                "required": true
            },
            "explanation": {
                "type": "string",
                "description": "当前候选的标注比对分析",
                "title": "Explanation",
                "required": true
            },
            "findings": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "当前候选的具体发现",
                "title": "Findings"
            },
            "issues": {
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
                        "media_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "实际观察的两侧原图身份各一次。",
                            "title": "Media Ids",
                            "required": true
                        },
                        "limitations": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Limitations"
                        },
                        "review_suggestion": {
                            "type": "string",
                            "title": "Review Suggestion",
                            "default": "人工核对两侧原始标注及标注规范。"
                        },
                        "type": {
                            "type": "string",
                            "enum": [
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
                        "main_annotation_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Main Annotation Ids"
                        },
                        "candidate_annotation_ids": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "title": "Candidate Annotation Ids"
                        }
                    },
                    "title": "BboxAnnotationIssue"
                },
                "description": "MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。",
                "title": "Issues"
            }
        },
        "title": "AnchorAssessmentDecision",
        "required": true
    }
};
export const anchorReviewSubmissionParameters = {
    "fingerprint": {
        "type": "string",
        "description": "当前冻结清单指纹。",
        "title": "Fingerprint",
        "required": true
    },
    "assessment_ids": {
        "type": "array",
        "items": {
            "type": "integer"
        },
        "description": "恰好包含全部冻结候选的最新评估回执ID，不引用旧版本或其他主图评估。",
        "title": "Assessment Ids",
        "required": true
    }
};
