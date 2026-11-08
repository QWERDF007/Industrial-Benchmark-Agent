/* Generated from Python consistency models by scripts/generate-contracts.js. */
export const conflictCategoryDefaults = {
    "labelme": [
        "类别不一致",
        "位置差异",
        "多类别",
        "少类别",
        "拆分",
        "合并"
    ],
    "folder_classification": [
        "类别不一致"
    ]
};
export const conflictCategories = [
    "类别不一致",
    "位置差异",
    "多类别",
    "少类别",
    "拆分",
    "合并",
    "对应关系差异"
];
export const modelAssessmentLabels = {
    "NOT_ANALYZED": "未分析",
    "RUNNING": "分析中",
    "FAILED": "分析失败",
    "EQUIVALENT": "未发现实质标注差异",
    "MATERIAL": "存在实质差异",
    "UNCERTAIN": "证据不足"
};
export const consistencyRouteEnums = {
    "pageId": [
        "industrial-consistency"
    ],
    "tab": [
        "conflicts",
        "search",
        "groups",
        "jobs"
    ],
    "facts": [
        "CURRENT",
        "HISTORICAL",
        "UNKNOWN"
    ],
    "galleryOrder": [
        "recent",
        "members"
    ],
    "differenceFilter": [
        "all",
        "category",
        "geometry",
        "presence",
        "instances",
        "multiple"
    ],
    "modelFilter": [
        "all",
        "NOT_ANALYZED",
        "RUNNING",
        "FAILED",
        "EQUIVALENT",
        "MATERIAL",
        "UNCERTAIN"
    ],
    "detailTab": [
        "summary",
        "evidence",
        "review"
    ],
    "reviewFilter": [
        "OPEN",
        "NEEDS_CONTEXT",
        "RESOLVED"
    ]
};
export const galleryReferenceParameters = {
    "query_id": {
        "type": "string",
        "title": "Query Id",
        "required": true
    },
    "kind": {
        "type": "string",
        "enum": [
            "conflicts",
            "groups"
        ],
        "title": "Kind",
        "required": true
    },
    "group_id": {
        "type": "string",
        "title": "Group Id",
        "required": true
    },
    "facts_state": {
        "type": "string",
        "enum": [
            "CURRENT",
            "HISTORICAL",
            "UNKNOWN"
        ],
        "title": "Facts State",
        "default": "CURRENT"
    }
};
export const consistencyStartParameters = {
    "subjects": {
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
        ],
        "title": "Subjects",
        "required": true
    },
    "corpus_scope": {
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
        ],
        "title": "Corpus Scope"
    },
    "mode": {
        "type": "string",
        "enum": [
            "exact",
            "visual",
            "combined"
        ],
        "title": "Mode"
    },
    "min_similarity": {
        "type": "number",
        "title": "Min Similarity"
    },
    "profile_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Profile Id"
    },
    "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
    },
    "model_analysis_prompt": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Model Analysis Prompt"
    },
    "prompt": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Prompt"
    }
};
export const imageRetrieveParameters = {
    "query": {
        "oneOf": [
            {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "kind": {
                        "type": "string",
                        "enum": [
                            "sample"
                        ],
                        "title": "Kind",
                        "default": "sample"
                    },
                    "sample_id": {
                        "type": "string",
                        "title": "Sample Id",
                        "required": true
                    }
                },
                "title": "SampleImageQuery"
            },
            {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "kind": {
                        "type": "string",
                        "enum": [
                            "temporary"
                        ],
                        "title": "Kind",
                        "default": "temporary"
                    },
                    "image_ref": {
                        "type": "string",
                        "title": "Image Ref",
                        "required": true
                    }
                },
                "title": "TemporaryImageQuery"
            }
        ],
        "title": "Query",
        "required": true
    },
    "corpus_scope": {
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
        ],
        "title": "Corpus Scope"
    },
    "mode": {
        "type": "string",
        "enum": [
            "exact",
            "visual",
            "combined"
        ],
        "title": "Mode",
        "default": "combined"
    },
    "profile_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Profile Id"
    },
    "top_k": {
        "oneOf": [
            {
                "type": "integer"
            },
            {
                "type": "null"
            }
        ],
        "title": "Top K",
        "default": 50
    },
    "min_similarity": {
        "oneOf": [
            {
                "type": "number"
            },
            {
                "type": "null"
            }
        ],
        "title": "Min Similarity"
    },
    "cursor": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Cursor"
    }
};
export const imageIndexPrepareParameters = {
    "corpus_scope": {
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
        ],
        "title": "Corpus Scope"
    },
    "profile_id": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Profile Id"
    },
    "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
    }
};
export const consistencyCompareParameters = {
    "sample_a": {
        "type": "string",
        "title": "Sample A",
        "required": true
    },
    "sample_b": {
        "type": "string",
        "title": "Sample B",
        "required": true
    },
    "matching": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "minimum_iou": {
                "type": "number",
                "description": "Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review",
                "title": "Minimum Iou",
                "default": 0.5
            },
            "ambiguity_tolerance": {
                "type": "number",
                "title": "Ambiguity Tolerance",
                "default": 1e-9
            },
            "tiny_area": {
                "type": "number",
                "title": "Tiny Area",
                "default": 4
            },
            "split_coverage": {
                "type": "number",
                "title": "Split Coverage",
                "default": 0.9
            },
            "max_instances": {
                "type": "integer",
                "title": "Max Instances",
                "default": 500
            },
            "max_roi_pixels": {
                "type": "integer",
                "title": "Max Roi Pixels",
                "default": 16777216
            },
            "max_cached_pixels": {
                "type": "integer",
                "title": "Max Cached Pixels",
                "default": 67108864
            }
        },
        "title": "AnnotationMatchingConfig"
    },
    "near": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "target_size": {
                "type": "array",
                "items": {
                    "type": "integer"
                },
                "title": "Target Size"
            },
            "pixel_cosine_threshold": {
                "type": "number",
                "title": "Pixel Cosine Threshold",
                "default": 0.99
            },
            "ncc_threshold": {
                "type": "number",
                "title": "Ncc Threshold",
                "default": 0.98
            },
            "max_mean_abs_diff": {
                "type": "number",
                "title": "Max Mean Abs Diff",
                "default": 0.006
            },
            "max_high_diff_ratio": {
                "type": "number",
                "title": "Max High Diff Ratio",
                "default": 0.0015
            },
            "diff_pixel_threshold": {
                "type": "number",
                "title": "Diff Pixel Threshold",
                "default": 0.08
            },
            "enable_translation_search": {
                "type": "boolean",
                "title": "Enable Translation Search",
                "default": true
            }
        },
        "title": "NearComparisonConfig"
    }
};
export const consistencyEvidenceParameters = {
    "evidence_id": {
        "type": "string",
        "title": "Evidence Id",
        "required": true
    }
};
export const consistencyQueryParameters = {
    "selection": {
        "oneOf": [
            {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "kind": {
                        "type": "string",
                        "enum": [
                            "batch"
                        ],
                        "title": "Kind",
                        "default": "batch"
                    },
                    "batch_id": {
                        "type": "string",
                        "title": "Batch Id",
                        "required": true
                    }
                },
                "title": "BatchSelection"
            },
            {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "kind": {
                        "type": "string",
                        "enum": [
                            "scope"
                        ],
                        "title": "Kind",
                        "default": "scope"
                    },
                    "subjects": {
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
                        ],
                        "title": "Subjects",
                        "required": true
                    },
                    "corpus_scope": {
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
                        ],
                        "title": "Corpus Scope"
                    },
                    "facts": {
                        "type": "string",
                        "enum": [
                            "CURRENT",
                            "HISTORICAL",
                            "UNKNOWN"
                        ],
                        "title": "Facts",
                        "default": "CURRENT"
                    },
                    "mode": {
                        "type": "string",
                        "enum": [
                            "exact",
                            "visual",
                            "combined"
                        ],
                        "title": "Mode",
                        "default": "exact"
                    },
                    "profile_id": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Profile Id"
                    },
                    "min_similarity": {
                        "type": "number",
                        "title": "Min Similarity",
                        "default": 0.95
                    }
                },
                "title": "ScopeSelection"
            }
        ],
        "title": "Selection",
        "required": true
    },
    "annotation_differences_only": {
        "type": "boolean",
        "title": "Annotation Differences Only",
        "default": false
    },
    "relation": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "EXACT",
                    "NEAR_CANDIDATE",
                    "VISUAL_REFERENCE",
                    "DIFFERENT",
                    "UNCHECKED"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Relation"
    },
    "confirmed_conflict": {
        "oneOf": [
            {
                "type": "boolean"
            },
            {
                "type": "null"
            }
        ],
        "title": "Confirmed Conflict"
    },
    "difference_type": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "QUALITY_LABEL",
                    "CATEGORY",
                    "ANNOTATION_COUNT",
                    "ONE_SIDED_REGION",
                    "GEOMETRY",
                    "SPLIT_MERGE",
                    "AMBIGUOUS_MATCH",
                    "POLICY_UNCONFIRMED",
                    "ANNOTATION_UNREADABLE"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Difference Type"
    },
    "review_state": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "OPEN",
                    "NEEDS_CONTEXT",
                    "RESOLVED"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Review State"
    },
    "correction_state": {
        "oneOf": [
            {
                "type": "string",
                "enum": [
                    "NOT_REQUIRED",
                    "PROPOSED",
                    "AWAITING_RESCAN",
                    "VERIFIED"
                ]
            },
            {
                "type": "null"
            }
        ],
        "title": "Correction State"
    },
    "cursor": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Cursor"
    },
    "page_size": {
        "type": "integer",
        "title": "Page Size",
        "default": 50
    }
};
export const consistencyGroupParameters = {
    "query_id": {
        "type": "string",
        "title": "Query Id",
        "required": true
    },
    "page": {
        "type": "integer",
        "title": "Page",
        "default": 1
    },
    "page_size": {
        "type": "integer",
        "title": "Page Size",
        "default": 20
    }
};
export const consistencyGroupMemberParameters = {
    "query_id": {
        "type": "string",
        "title": "Query Id",
        "required": true
    },
    "page": {
        "type": "integer",
        "title": "Page",
        "default": 1
    },
    "page_size": {
        "type": "integer",
        "title": "Page Size",
        "default": 20
    },
    "group_id": {
        "type": "string",
        "title": "Group Id",
        "required": true
    },
    "facts_state": {
        "type": "string",
        "enum": [
            "CURRENT",
            "HISTORICAL",
            "UNKNOWN"
        ],
        "title": "Facts State",
        "default": "CURRENT"
    }
};
export const consistencyContextParameters = {
    "evidence_id": {
        "type": "string",
        "title": "Evidence Id",
        "required": true
    },
    "result_id": {
        "type": "string",
        "title": "Result Id",
        "required": true
    },
    "difference_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Difference Ids"
    },
    "return_location": {
        "oneOf": [
            {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "pageId": {
                        "type": "string",
                        "enum": [
                            "industrial-consistency"
                        ],
                        "title": "Pageid",
                        "default": "industrial-consistency"
                    },
                    "tab": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "conflicts",
                                    "search",
                                    "groups",
                                    "jobs"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Tab"
                    },
                    "scope": {
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
                        "title": "Scope"
                    },
                    "parentId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parentid"
                    },
                    "datasetIds": {
                        "oneOf": [
                            {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Datasetids"
                    },
                    "query": {
                        "oneOf": [
                            {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "kind": {
                                        "type": "string",
                                        "enum": [
                                            "sample"
                                        ],
                                        "title": "Kind",
                                        "default": "sample"
                                    },
                                    "sample_id": {
                                        "type": "string",
                                        "title": "Sample Id",
                                        "required": true
                                    }
                                },
                                "title": "SampleImageQuery"
                            },
                            {
                                "type": "null"
                            }
                        ]
                    },
                    "batchId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Batchid"
                    },
                    "resultId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Resultid"
                    },
                    "evidenceId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Evidenceid"
                    },
                    "facts": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "CURRENT",
                                    "HISTORICAL",
                                    "UNKNOWN"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Facts"
                    },
                    "groupId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Groupid"
                    },
                    "memberId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Memberid"
                    },
                    "differenceId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Differenceid"
                    },
                    "returnPage": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Returnpage"
                    },
                    "sessionId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Sessionid"
                    },
                    "queryId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Queryid"
                    },
                    "gallerySearch": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gallerysearch"
                    },
                    "galleryOrder": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "recent",
                                    "members"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Galleryorder"
                    },
                    "differenceFilter": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "all",
                                    "category",
                                    "geometry",
                                    "presence",
                                    "instances",
                                    "multiple"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Differencefilter"
                    },
                    "modelFilter": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "all",
                                    "NOT_ANALYZED",
                                    "RUNNING",
                                    "FAILED",
                                    "EQUIVALENT",
                                    "MATERIAL",
                                    "UNCERTAIN"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Modelfilter"
                    },
                    "galleryPage": {
                        "oneOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gallerypage"
                    },
                    "detailTab": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "summary",
                                    "evidence",
                                    "review"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Detailtab"
                    },
                    "subjectId": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Subjectid"
                    },
                    "reviewFilter": {
                        "oneOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "OPEN",
                                    "NEEDS_CONTEXT",
                                    "RESOLVED"
                                ]
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Reviewfilter"
                    },
                    "groupPage": {
                        "oneOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Grouppage"
                    },
                    "memberPage": {
                        "oneOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Memberpage"
                    }
                },
                "title": "ConsistencyReturnLocation"
            },
            {
                "type": "null"
            }
        ]
    },
    "cursor": {
        "oneOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "title": "Cursor"
    },
    "difference_page_size": {
        "type": "integer",
        "title": "Difference Page Size",
        "default": 3
    },
    "max_images": {
        "type": "integer",
        "title": "Max Images",
        "default": 8
    },
    "max_image_bytes": {
        "type": "integer",
        "title": "Max Image Bytes",
        "default": 12582912
    },
    "max_text_bytes": {
        "type": "integer",
        "title": "Max Text Bytes",
        "default": 32768
    }
};
export const consistencyBatchParameters = {
    "batch_id": {
        "type": "string",
        "title": "Batch Id",
        "required": true
    }
};
export const consistencyRetryParameters = {
    "batch_id": {
        "type": "string",
        "title": "Batch Id",
        "required": true
    },
    "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
    },
    "sample_ids": {
        "oneOf": [
            {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            {
                "type": "null"
            }
        ],
        "title": "Sample Ids"
    }
};
export const consistencyMediaParameters = {
    "evidence_id": {
        "type": "string",
        "title": "Evidence Id",
        "required": true
    },
    "media_id": {
        "type": "string",
        "title": "Media Id",
        "required": true
    },
    "max_side": {
        "type": "integer",
        "title": "Max Side",
        "default": 1280
    }
};
export const temporaryImageLimits = {
    "max_source_bytes": 134217728,
    "max_bytes": 268435456,
    "max_images": 128,
    "max_vector_bytes": 8388608,
    "ttl_seconds": 1800
};
