/* Generated from Python AuditStart by scripts/generate-contracts.js. */
export const auditStartParameters = {
    "dataset_id": {
        "type": "string",
        "title": "Dataset Id",
        "required": true
    },
    "normal_version_id": {
        "type": "string",
        "title": "Normal Version Id",
        "required": true
    },
    "defect_version_id": {
        "type": "string",
        "title": "Defect Version Id"
    },
    "sample_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Sample Ids"
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
    },
    "consistency_mode": {
        "type": "string",
        "enum": [
            "exact",
            "visual",
            "combined"
        ],
        "title": "Consistency Mode",
        "default": "exact"
    },
    "consistency_profile_id": {
        "type": "string",
        "title": "Consistency Profile Id"
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
    }
};
