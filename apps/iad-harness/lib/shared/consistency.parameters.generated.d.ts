export declare const conflictCategoryDefaults: {
    readonly labelme: readonly ["类别不一致", "位置差异", "多类别", "少类别", "拆分", "合并"];
    readonly folder_classification: readonly ["类别不一致"];
};
export declare const conflictCategories: readonly ["类别不一致", "位置差异", "多类别", "少类别", "拆分", "合并", "对应关系差异"];
export declare const modelAssessmentLabels: {
    readonly NOT_ANALYZED: "未分析";
    readonly RUNNING: "分析中";
    readonly FAILED: "分析失败";
    readonly EQUIVALENT: "未发现实质标注差异";
    readonly MATERIAL: "存在实质差异";
    readonly UNCERTAIN: "证据不足";
};
export declare const consistencyRouteEnums: {
    readonly pageId: readonly ["industrial-consistency"];
    readonly tab: readonly ["conflicts", "search", "groups", "jobs"];
    readonly facts: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
    readonly galleryOrder: readonly ["recent", "members"];
    readonly differenceFilter: readonly ["all", "category", "geometry", "presence", "instances", "multiple"];
    readonly modelFilter: readonly ["all", "NOT_ANALYZED", "RUNNING", "FAILED", "EQUIVALENT", "MATERIAL", "UNCERTAIN"];
    readonly detailTab: readonly ["summary", "evidence", "review"];
    readonly reviewFilter: readonly ["OPEN", "NEEDS_CONTEXT", "RESOLVED"];
};
export declare const galleryReferenceParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly kind: {
        readonly type: "string";
        readonly enum: readonly ["conflicts", "groups"];
        readonly title: "Kind";
        readonly required: true;
    };
    readonly group_id: {
        readonly type: "string";
        readonly title: "Group Id";
        readonly required: true;
    };
    readonly facts_state: {
        readonly type: "string";
        readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
        readonly title: "Facts State";
        readonly default: "CURRENT";
    };
};
export declare const consistencyStartParameters: {
    readonly subjects: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "DatasetScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["samples"];
                    readonly title: "Kind";
                    readonly default: "samples";
                };
                readonly sample_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Sample Ids";
                    readonly required: true;
                };
            };
            readonly title: "SampleScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["filtered"];
                    readonly title: "Kind";
                    readonly default: "filtered";
                };
                readonly dataset_id: {
                    readonly type: "string";
                    readonly title: "Dataset Id";
                    readonly required: true;
                };
                readonly filters: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly raw_label_filters: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["PASS", "FAIL", "UNCERTAIN"];
                            };
                            readonly title: "Raw Label Filters";
                        };
                        readonly annotation_filters: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Annotation Filters";
                        };
                        readonly model_status: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"];
                            readonly title: "Model Status";
                            readonly default: "all";
                        };
                        readonly review_status: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"];
                            readonly title: "Review Status";
                            readonly default: "all";
                        };
                        readonly technical: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "issues"];
                            readonly title: "Technical";
                            readonly default: "all";
                        };
                        readonly reference_status: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "candidate", "excluded"];
                            readonly title: "Reference Status";
                            readonly default: "all";
                        };
                        readonly search: {
                            readonly type: "string";
                            readonly title: "Search";
                            readonly default: "";
                        };
                        readonly sort_by: {
                            readonly type: "string";
                            readonly enum: readonly ["default", "risk", "tech"];
                            readonly title: "Sort By";
                            readonly default: "default";
                        };
                    };
                    readonly title: "SampleFilters";
                };
            };
            readonly title: "FilteredScope";
        }];
        readonly title: "Subjects";
        readonly required: true;
    };
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
    readonly mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "visual", "combined"];
        readonly title: "Mode";
    };
    readonly min_similarity: {
        readonly type: "number";
        readonly title: "Min Similarity";
    };
    readonly profile_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Profile Id";
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
    readonly model_analysis_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Model Analysis Prompt";
    };
    readonly prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Prompt";
    };
};
export declare const imageRetrieveParameters: {
    readonly query: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["sample"];
                    readonly title: "Kind";
                    readonly default: "sample";
                };
                readonly sample_id: {
                    readonly type: "string";
                    readonly title: "Sample Id";
                    readonly required: true;
                };
            };
            readonly title: "SampleImageQuery";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["temporary"];
                    readonly title: "Kind";
                    readonly default: "temporary";
                };
                readonly image_ref: {
                    readonly type: "string";
                    readonly title: "Image Ref";
                    readonly required: true;
                };
            };
            readonly title: "TemporaryImageQuery";
        }];
        readonly title: "Query";
        readonly required: true;
    };
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
    readonly mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "visual", "combined"];
        readonly title: "Mode";
        readonly default: "combined";
    };
    readonly profile_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Profile Id";
    };
    readonly top_k: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Top K";
        readonly default: 50;
    };
    readonly min_similarity: {
        readonly oneOf: readonly [{
            readonly type: "number";
        }, {
            readonly type: "null";
        }];
        readonly title: "Min Similarity";
    };
    readonly cursor: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Cursor";
    };
};
export declare const imageIndexPrepareParameters: {
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
    readonly profile_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Profile Id";
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
};
export declare const consistencyCompareParameters: {
    readonly sample_a: {
        readonly type: "string";
        readonly title: "Sample A";
        readonly required: true;
    };
    readonly sample_b: {
        readonly type: "string";
        readonly title: "Sample B";
        readonly required: true;
    };
    readonly matching: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly minimum_iou: {
                readonly type: "number";
                readonly description: "Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review";
                readonly title: "Minimum Iou";
                readonly default: 0.5;
            };
            readonly ambiguity_tolerance: {
                readonly type: "number";
                readonly title: "Ambiguity Tolerance";
                readonly default: 1e-9;
            };
            readonly tiny_area: {
                readonly type: "number";
                readonly title: "Tiny Area";
                readonly default: 4;
            };
            readonly split_coverage: {
                readonly type: "number";
                readonly title: "Split Coverage";
                readonly default: 0.9;
            };
            readonly max_instances: {
                readonly type: "integer";
                readonly title: "Max Instances";
                readonly default: 500;
            };
            readonly max_roi_pixels: {
                readonly type: "integer";
                readonly title: "Max Roi Pixels";
                readonly default: 16777216;
            };
            readonly max_cached_pixels: {
                readonly type: "integer";
                readonly title: "Max Cached Pixels";
                readonly default: 67108864;
            };
        };
        readonly title: "AnnotationMatchingConfig";
    };
    readonly near: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly target_size: {
                readonly type: "array";
                readonly items: {
                    readonly type: "integer";
                };
                readonly title: "Target Size";
            };
            readonly pixel_cosine_threshold: {
                readonly type: "number";
                readonly title: "Pixel Cosine Threshold";
                readonly default: 0.99;
            };
            readonly ncc_threshold: {
                readonly type: "number";
                readonly title: "Ncc Threshold";
                readonly default: 0.98;
            };
            readonly max_mean_abs_diff: {
                readonly type: "number";
                readonly title: "Max Mean Abs Diff";
                readonly default: 0.006;
            };
            readonly max_high_diff_ratio: {
                readonly type: "number";
                readonly title: "Max High Diff Ratio";
                readonly default: 0.0015;
            };
            readonly diff_pixel_threshold: {
                readonly type: "number";
                readonly title: "Diff Pixel Threshold";
                readonly default: 0.08;
            };
            readonly enable_translation_search: {
                readonly type: "boolean";
                readonly title: "Enable Translation Search";
                readonly default: true;
            };
        };
        readonly title: "NearComparisonConfig";
    };
};
export declare const consistencyEvidenceParameters: {
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
};
export declare const consistencyQueryParameters: {
    readonly selection: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["batch"];
                    readonly title: "Kind";
                    readonly default: "batch";
                };
                readonly batch_id: {
                    readonly type: "string";
                    readonly title: "Batch Id";
                    readonly required: true;
                };
            };
            readonly title: "BatchSelection";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["scope"];
                    readonly title: "Kind";
                    readonly default: "scope";
                };
                readonly subjects: {
                    readonly oneOf: readonly [{
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["all_registered"];
                                readonly title: "Kind";
                                readonly default: "all_registered";
                            };
                        };
                        readonly title: "AllRegisteredScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["datasets"];
                                readonly title: "Kind";
                                readonly default: "datasets";
                            };
                            readonly dataset_ids: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly title: "Dataset Ids";
                                readonly required: true;
                            };
                        };
                        readonly title: "DatasetScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["samples"];
                                readonly title: "Kind";
                                readonly default: "samples";
                            };
                            readonly sample_ids: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly title: "Sample Ids";
                                readonly required: true;
                            };
                        };
                        readonly title: "SampleScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["filtered"];
                                readonly title: "Kind";
                                readonly default: "filtered";
                            };
                            readonly dataset_id: {
                                readonly type: "string";
                                readonly title: "Dataset Id";
                                readonly required: true;
                            };
                            readonly filters: {
                                readonly type: "object";
                                readonly additionalProperties: false;
                                readonly properties: {
                                    readonly raw_label_filters: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                            readonly enum: readonly ["PASS", "FAIL", "UNCERTAIN"];
                                        };
                                        readonly title: "Raw Label Filters";
                                    };
                                    readonly annotation_filters: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                        readonly title: "Annotation Filters";
                                    };
                                    readonly model_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"];
                                        readonly title: "Model Status";
                                        readonly default: "all";
                                    };
                                    readonly review_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"];
                                        readonly title: "Review Status";
                                        readonly default: "all";
                                    };
                                    readonly technical: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "issues"];
                                        readonly title: "Technical";
                                        readonly default: "all";
                                    };
                                    readonly reference_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "candidate", "excluded"];
                                        readonly title: "Reference Status";
                                        readonly default: "all";
                                    };
                                    readonly search: {
                                        readonly type: "string";
                                        readonly title: "Search";
                                        readonly default: "";
                                    };
                                    readonly sort_by: {
                                        readonly type: "string";
                                        readonly enum: readonly ["default", "risk", "tech"];
                                        readonly title: "Sort By";
                                        readonly default: "default";
                                    };
                                };
                                readonly title: "SampleFilters";
                            };
                        };
                        readonly title: "FilteredScope";
                    }];
                    readonly title: "Subjects";
                    readonly required: true;
                };
                readonly corpus_scope: {
                    readonly oneOf: readonly [{
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["all_registered"];
                                readonly title: "Kind";
                                readonly default: "all_registered";
                            };
                        };
                        readonly title: "AllRegisteredScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["datasets"];
                                readonly title: "Kind";
                                readonly default: "datasets";
                            };
                            readonly dataset_ids: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly title: "Dataset Ids";
                                readonly required: true;
                            };
                        };
                        readonly title: "DatasetScope";
                    }];
                    readonly title: "Corpus Scope";
                };
                readonly facts: {
                    readonly type: "string";
                    readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
                    readonly title: "Facts";
                    readonly default: "CURRENT";
                };
                readonly mode: {
                    readonly type: "string";
                    readonly enum: readonly ["exact", "visual", "combined"];
                    readonly title: "Mode";
                    readonly default: "exact";
                };
                readonly profile_id: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Profile Id";
                };
                readonly min_similarity: {
                    readonly type: "number";
                    readonly title: "Min Similarity";
                    readonly default: 0.95;
                };
            };
            readonly title: "ScopeSelection";
        }];
        readonly title: "Selection";
        readonly required: true;
    };
    readonly annotation_differences_only: {
        readonly type: "boolean";
        readonly title: "Annotation Differences Only";
        readonly default: false;
    };
    readonly relation: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["EXACT", "NEAR_CANDIDATE", "VISUAL_REFERENCE", "DIFFERENT", "UNCHECKED"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Relation";
    };
    readonly confirmed_conflict: {
        readonly oneOf: readonly [{
            readonly type: "boolean";
        }, {
            readonly type: "null";
        }];
        readonly title: "Confirmed Conflict";
    };
    readonly difference_type: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["QUALITY_LABEL", "CATEGORY", "ANNOTATION_COUNT", "ONE_SIDED_REGION", "GEOMETRY", "SPLIT_MERGE", "AMBIGUOUS_MATCH", "POLICY_UNCONFIRMED", "ANNOTATION_UNREADABLE"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Difference Type";
    };
    readonly review_state: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["OPEN", "NEEDS_CONTEXT", "RESOLVED"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Review State";
    };
    readonly correction_state: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["NOT_REQUIRED", "PROPOSED", "AWAITING_RESCAN", "VERIFIED"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Correction State";
    };
    readonly cursor: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Cursor";
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 50;
    };
};
export declare const consistencyGroupParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 20;
    };
};
export declare const consistencyGroupMemberParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 20;
    };
    readonly group_id: {
        readonly type: "string";
        readonly title: "Group Id";
        readonly required: true;
    };
    readonly facts_state: {
        readonly type: "string";
        readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
        readonly title: "Facts State";
        readonly default: "CURRENT";
    };
};
export declare const consistencyContextParameters: {
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
    readonly result_id: {
        readonly type: "string";
        readonly title: "Result Id";
        readonly required: true;
    };
    readonly difference_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Difference Ids";
    };
    readonly return_location: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly pageId: {
                    readonly type: "string";
                    readonly enum: readonly ["industrial-consistency"];
                    readonly title: "Pageid";
                    readonly default: "industrial-consistency";
                };
                readonly tab: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["conflicts", "search", "groups", "jobs"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Tab";
                };
                readonly scope: {
                    readonly oneOf: readonly [{
                        readonly oneOf: readonly [{
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly properties: {
                                readonly kind: {
                                    readonly type: "string";
                                    readonly enum: readonly ["all_registered"];
                                    readonly title: "Kind";
                                    readonly default: "all_registered";
                                };
                            };
                            readonly title: "AllRegisteredScope";
                        }, {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly properties: {
                                readonly kind: {
                                    readonly type: "string";
                                    readonly enum: readonly ["datasets"];
                                    readonly title: "Kind";
                                    readonly default: "datasets";
                                };
                                readonly dataset_ids: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                    readonly title: "Dataset Ids";
                                    readonly required: true;
                                };
                            };
                            readonly title: "DatasetScope";
                        }];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Scope";
                };
                readonly parentId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Parentid";
                };
                readonly datasetIds: {
                    readonly oneOf: readonly [{
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Datasetids";
                };
                readonly query: {
                    readonly oneOf: readonly [{
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["sample"];
                                readonly title: "Kind";
                                readonly default: "sample";
                            };
                            readonly sample_id: {
                                readonly type: "string";
                                readonly title: "Sample Id";
                                readonly required: true;
                            };
                        };
                        readonly title: "SampleImageQuery";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly batchId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Batchid";
                };
                readonly resultId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Resultid";
                };
                readonly evidenceId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Evidenceid";
                };
                readonly facts: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Facts";
                };
                readonly groupId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Groupid";
                };
                readonly memberId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Memberid";
                };
                readonly differenceId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Differenceid";
                };
                readonly returnPage: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Returnpage";
                };
                readonly sessionId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Sessionid";
                };
                readonly queryId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Queryid";
                };
                readonly gallerySearch: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Gallerysearch";
                };
                readonly galleryOrder: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["recent", "members"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Galleryorder";
                };
                readonly differenceFilter: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["all", "category", "geometry", "presence", "instances", "multiple"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Differencefilter";
                };
                readonly modelFilter: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["all", "NOT_ANALYZED", "RUNNING", "FAILED", "EQUIVALENT", "MATERIAL", "UNCERTAIN"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Modelfilter";
                };
                readonly galleryPage: {
                    readonly oneOf: readonly [{
                        readonly type: "integer";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Gallerypage";
                };
                readonly detailTab: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["summary", "evidence", "review"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Detailtab";
                };
                readonly subjectId: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Subjectid";
                };
                readonly reviewFilter: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["OPEN", "NEEDS_CONTEXT", "RESOLVED"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Reviewfilter";
                };
                readonly groupPage: {
                    readonly oneOf: readonly [{
                        readonly type: "integer";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Grouppage";
                };
                readonly memberPage: {
                    readonly oneOf: readonly [{
                        readonly type: "integer";
                    }, {
                        readonly type: "null";
                    }];
                    readonly title: "Memberpage";
                };
            };
            readonly title: "ConsistencyReturnLocation";
        }, {
            readonly type: "null";
        }];
    };
    readonly cursor: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Cursor";
    };
    readonly difference_page_size: {
        readonly type: "integer";
        readonly title: "Difference Page Size";
        readonly default: 3;
    };
    readonly max_images: {
        readonly type: "integer";
        readonly title: "Max Images";
        readonly default: 8;
    };
    readonly max_image_bytes: {
        readonly type: "integer";
        readonly title: "Max Image Bytes";
        readonly default: 12582912;
    };
    readonly max_text_bytes: {
        readonly type: "integer";
        readonly title: "Max Text Bytes";
        readonly default: 32768;
    };
};
export declare const consistencyBatchParameters: {
    readonly batch_id: {
        readonly type: "string";
        readonly title: "Batch Id";
        readonly required: true;
    };
};
export declare const consistencyRetryParameters: {
    readonly batch_id: {
        readonly type: "string";
        readonly title: "Batch Id";
        readonly required: true;
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
    readonly sample_ids: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Sample Ids";
    };
};
export declare const consistencyMediaParameters: {
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
    readonly media_id: {
        readonly type: "string";
        readonly title: "Media Id";
        readonly required: true;
    };
    readonly max_side: {
        readonly type: "integer";
        readonly title: "Max Side";
        readonly default: 1280;
    };
};
export declare const temporaryImageLimits: {
    readonly max_source_bytes: 134217728;
    readonly max_bytes: 268435456;
    readonly max_images: 128;
    readonly max_vector_bytes: 8388608;
    readonly ttl_seconds: 1800;
};
//# sourceMappingURL=consistency.parameters.generated.d.ts.map