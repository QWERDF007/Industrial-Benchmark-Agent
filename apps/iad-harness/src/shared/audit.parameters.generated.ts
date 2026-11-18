/* Generated from Python AuditAgentStart by scripts/generate-contracts.js. */
export const auditQualityScoreParameters = {
  "cursor": {
    "type": "integer",
    "title": "Cursor",
    "default": 0
  },
  "page_size": {
    "type": "integer",
    "title": "Page Size",
    "default": 8
  },
  "max_chars": {
    "type": "integer",
    "title": "Max Chars",
    "default": 24000
  },
  "consistency_reviews": {
    "oneOf": [
      {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "scope_id": {
              "type": "string",
              "title": "Scope Id",
              "required": true
            },
            "code": {
              "type": "string",
              "enum": [
                "category_mismatch",
                "instance_count_mismatch",
                "coverage_mismatch"
              ],
              "title": "Code",
              "required": true
            },
            "coefficient": {
              "type": "number",
              "title": "Coefficient",
              "required": true
            },
            "analysis": {
              "type": "string",
              "title": "Analysis",
              "required": true
            },
            "evidence_refs": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "title": "Evidence Refs",
              "required": true
            }
          },
          "title": "ConsistencyImpactReview"
        }
      },
      {
        "type": "null"
      }
    ],
    "title": "Consistency Reviews"
  },
  "distribution_reviews": {
    "oneOf": [
      {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "scope_id": {
              "type": "string",
              "description": "统计范围的scope_id，整体为overall，子集为dataset_id。",
              "title": "Scope Id",
              "required": true
            },
            "axis": {
              "type": "string",
              "enum": [
                "class_balance",
                "image_geometry",
                "instance_geometry",
                "instance_count",
                "instance_position",
                "capture_source"
              ],
              "title": "Axis",
              "required": true
            },
            "status": {
              "oneOf": [
                {
                  "type": "string",
                  "enum": [
                    "normal",
                    "problem",
                    "not_applicable"
                  ]
                },
                {
                  "type": "null"
                }
              ],
              "title": "Status"
            },
            "coefficient": {
              "oneOf": [
                {
                  "type": "number"
                },
                {
                  "type": "null"
                }
              ],
              "title": "Coefficient"
            },
            "comparisons": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "metric": {
                    "type": "string",
                    "title": "Metric",
                    "required": true
                  },
                  "groups": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "additionalProperties": false,
                      "properties": {
                        "label": {
                          "type": "string",
                          "title": "Label",
                          "required": true
                        },
                        "members": {
                          "type": "array",
                          "items": {
                            "oneOf": [
                              {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                  "kind": {
                                    "type": "string",
                                    "enum": [
                                      "group"
                                    ],
                                    "title": "Kind",
                                    "required": true
                                  },
                                  "metric": {
                                    "type": "string",
                                    "title": "Metric",
                                    "required": true
                                  },
                                  "bucket": {
                                    "type": "string",
                                    "title": "Bucket",
                                    "required": true
                                  }
                                },
                                "title": "DistributionGroupReference"
                              },
                              {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                  "kind": {
                                    "type": "string",
                                    "enum": [
                                      "bins"
                                    ],
                                    "title": "Kind",
                                    "required": true
                                  },
                                  "metric": {
                                    "type": "string",
                                    "title": "Metric",
                                    "required": true
                                  },
                                  "x": {
                                    "type": "array",
                                    "items": {
                                      "type": "integer"
                                    },
                                    "description": "从 0 开始的首尾分箱下标，均包含在内。",
                                    "title": "X",
                                    "required": true
                                  },
                                  "y": {
                                    "oneOf": [
                                      {
                                        "type": "array",
                                        "items": {
                                          "type": "integer"
                                        }
                                      },
                                      {
                                        "type": "null"
                                      }
                                    ],
                                    "description": "仅二维热图填写，同样包含首尾分箱。",
                                    "title": "Y"
                                  }
                                },
                                "title": "DistributionBinsReference"
                              }
                            ]
                          },
                          "title": "Members",
                          "required": true
                        }
                      },
                      "title": "DistributionGroup"
                    },
                    "title": "Groups",
                    "required": true
                  }
                },
                "title": "DistributionMetricGrouping"
              },
              "title": "Comparisons"
            },
            "overlap_codes": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "仅完整范围：与本项确属同一实际原因的视觉评分代码；无重复原因时为空。",
              "title": "Overlap Codes"
            },
            "grouping": {
              "type": "string",
              "description": "合理范围或分组及其统计依据；单一合理范围和均衡多范围不扣分。",
              "title": "Grouping",
              "required": true
            },
            "evidence_refs": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "引用输入facts中真实的统计项ref，不编造数量或缺失类别。",
              "title": "Evidence Refs",
              "required": true
            },
            "analysis": {
              "type": "string",
              "description": "先说结论，再用日常中文说明实际质量影响，不写分类定义或内部流程。",
              "title": "Analysis",
              "required": true
            }
          },
          "title": "QualityDistributionReview"
        }
      },
      {
        "type": "null"
      }
    ],
    "title": "Distribution Reviews"
  },
  "aliases": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "axis": {
          "type": "string",
          "enum": [
            "morphology",
            "special_morphology",
            "appearance",
            "structural_region",
            "hard_type",
            "texture",
            "confusable"
          ],
          "title": "Axis",
          "required": true
        },
        "source": {
          "type": "string",
          "title": "Source",
          "required": true
        },
        "canonical": {
          "type": "string",
          "description": "同一实际场景使用同一名称；不同原因不得为去重而合并。",
          "title": "Canonical",
          "required": true
        }
      },
      "title": "QualitySceneAlias"
    },
    "title": "Aliases"
  },
  "redundancy_reviewed": {
    "type": "boolean",
    "description": "已实际对照冻结相似候选及已识别相似组的原图，完成低信息增量判断。",
    "title": "Redundancy Reviewed",
    "required": true
  },
  "redundant_groups": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "members": {
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
          "title": "Members",
          "required": true
        },
        "reason": {
          "type": "string",
          "description": "依据实际对照的原图解释为何只增加很少信息，候选相似度不是依据。",
          "title": "Reason",
          "required": true
        }
      },
      "title": "QualityRedundantGroup"
    },
    "title": "Redundant Groups"
  },
  "preview_id": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "description": "audit_quality_score返回的预览标识；正式报告原样提交，不自行生成。",
    "title": "Preview Id"
  },
  "item_code": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Item Code"
  },
  "dataset_id": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Dataset Id"
  }
} as const;
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
} as const;
export const auditGlobalParameters = {
  "commit_key": {
    "type": "string",
    "title": "Commit Key",
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
} as const;
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
      "quality_observation": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "complete": {
            "type": "boolean",
            "description": "是否有充分原图证据完成场景归类；缺证时填false，不猜测。",
            "title": "Complete",
            "required": true
          },
          "defects": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "annotation_id": {
                  "oneOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "title": "Annotation Id",
                  "required": true
                },
                "basis": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "本图可见依据，先解释为何符合相应形态、尺寸、位置和对比度场景，不引用出现频次。",
                  "title": "Basis"
                },
                "morphology": {
                  "type": "string",
                  "title": "Morphology",
                  "required": true
                },
                "special_morphology": {
                  "oneOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "title": "Special Morphology"
                },
                "appearance": {
                  "type": "string",
                  "title": "Appearance",
                  "required": true
                },
                "size": {
                  "type": "string",
                  "enum": [
                    "tiny",
                    "small",
                    "medium",
                    "large"
                  ],
                  "title": "Size",
                  "required": true
                },
                "location": {
                  "type": "string",
                  "enum": [
                    "center",
                    "edge",
                    "corner"
                  ],
                  "title": "Location",
                  "required": true
                },
                "structural_region": {
                  "oneOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "title": "Structural Region"
                },
                "contrast": {
                  "type": "string",
                  "enum": [
                    "low",
                    "medium",
                    "high"
                  ],
                  "title": "Contrast",
                  "required": true
                }
              },
              "title": "QualityDefectScene"
            },
            "title": "Defects"
          },
          "normal": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "hard": {
                "type": "boolean",
                "title": "Hard",
                "required": true
              },
              "hard_type": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ],
                "title": "Hard Type"
              },
              "confusable": {
                "type": "boolean",
                "title": "Confusable",
                "default": false
              },
              "texture": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ],
                "title": "Texture"
              },
              "texture_reason": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ],
                "title": "Texture Reason"
              },
              "profile_revision": {
                "oneOf": [
                  {
                    "type": "integer"
                  },
                  {
                    "type": "null"
                  }
                ],
                "title": "Profile Revision"
              },
              "qualification": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "feature_id": {
                    "type": "string",
                    "title": "Feature Id",
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
                  "similar_features": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "title": "Similar Features",
                    "required": true
                  },
                  "normal_reason": {
                    "type": "string",
                    "title": "Normal Reason",
                    "required": true
                  },
                  "difficulty_reason": {
                    "type": "string",
                    "title": "Difficulty Reason",
                    "required": true
                  }
                },
                "title": "HardNormalQualification"
              }
            },
            "title": "QualityNormalScene"
          },
          "limitation": {
            "type": "string",
            "title": "Limitation",
            "default": ""
          }
        },
        "title": "QualityObservation",
        "description": "本图实际观察的评分场景，新作业须填写；程序读取原始类别计数和评分，不在此填写分数。"
      },
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
            "coverage_effect": {
              "oneOf": [
                {
                  "type": "string",
                  "enum": [
                    "unchanged",
                    "material_change",
                    "unverified"
                  ]
                },
                {
                  "type": "null"
                }
              ],
              "description": "内容问题必须确认明显的大范围覆盖增减material_change；覆盖基本相同的边界或轮廓偏移属于位置差异。",
              "title": "Coverage Effect"
            },
            "coverage_reason": {
              "oneOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ],
              "description": "指出明显漏盖或多盖了哪一大块实际内容；不能仅说坐标、面积或外接框不同。",
              "title": "Coverage Reason"
            },
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
                "missing_content",
                "extra_content",
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
              "description": "引用当前主图真实annotation_id；类别、多标实例、内容差异和合并至少1个，拆分至少2个，少标实例或图像级可以为空。",
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
} as const;
export const auditRecordParameters = {
  "scope": {
    "type": "string",
    "enum": [
      "all",
      "defects",
      "normals"
    ],
    "title": "Scope",
    "default": "all"
  },
  "representation": {
    "type": "string",
    "enum": [
      "facts",
      "detail"
    ],
    "title": "Representation",
    "default": "facts"
  },
  "unread_only": {
    "type": "boolean",
    "title": "Unread Only",
    "default": true
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
  "max_chars": {
    "type": "integer",
    "title": "Max Chars",
    "default": 24000
  },
  "result_revision": {
    "oneOf": [
      {
        "type": "integer"
      },
      {
        "type": "null"
      }
    ],
    "title": "Result Revision"
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
} as const;
export const auditReportParameters = {
  "distribution_analysis": {
    "type": "string",
    "description": "先说分布结论，再说明主要失衡及影响，正常的集中分布也应明确说明。",
    "title": "Distribution Analysis",
    "default": ""
  },
  "quality_assessment": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "consistency_reviews": {
        "oneOf": [
          {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "scope_id": {
                  "type": "string",
                  "title": "Scope Id",
                  "required": true
                },
                "code": {
                  "type": "string",
                  "enum": [
                    "category_mismatch",
                    "instance_count_mismatch",
                    "coverage_mismatch"
                  ],
                  "title": "Code",
                  "required": true
                },
                "coefficient": {
                  "type": "number",
                  "title": "Coefficient",
                  "required": true
                },
                "analysis": {
                  "type": "string",
                  "title": "Analysis",
                  "required": true
                },
                "evidence_refs": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "title": "Evidence Refs",
                  "required": true
                }
              },
              "title": "ConsistencyImpactReview"
            }
          },
          {
            "type": "null"
          }
        ],
        "title": "Consistency Reviews"
      },
      "distribution_reviews": {
        "oneOf": [
          {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "scope_id": {
                  "type": "string",
                  "description": "统计范围的scope_id，整体为overall，子集为dataset_id。",
                  "title": "Scope Id",
                  "required": true
                },
                "axis": {
                  "type": "string",
                  "enum": [
                    "class_balance",
                    "image_geometry",
                    "instance_geometry",
                    "instance_count",
                    "instance_position",
                    "capture_source"
                  ],
                  "title": "Axis",
                  "required": true
                },
                "status": {
                  "oneOf": [
                    {
                      "type": "string",
                      "enum": [
                        "normal",
                        "problem",
                        "not_applicable"
                      ]
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "title": "Status"
                },
                "coefficient": {
                  "oneOf": [
                    {
                      "type": "number"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "title": "Coefficient"
                },
                "comparisons": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "metric": {
                        "type": "string",
                        "title": "Metric",
                        "required": true
                      },
                      "groups": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "additionalProperties": false,
                          "properties": {
                            "label": {
                              "type": "string",
                              "title": "Label",
                              "required": true
                            },
                            "members": {
                              "type": "array",
                              "items": {
                                "oneOf": [
                                  {
                                    "type": "object",
                                    "additionalProperties": false,
                                    "properties": {
                                      "kind": {
                                        "type": "string",
                                        "enum": [
                                          "group"
                                        ],
                                        "title": "Kind",
                                        "required": true
                                      },
                                      "metric": {
                                        "type": "string",
                                        "title": "Metric",
                                        "required": true
                                      },
                                      "bucket": {
                                        "type": "string",
                                        "title": "Bucket",
                                        "required": true
                                      }
                                    },
                                    "title": "DistributionGroupReference"
                                  },
                                  {
                                    "type": "object",
                                    "additionalProperties": false,
                                    "properties": {
                                      "kind": {
                                        "type": "string",
                                        "enum": [
                                          "bins"
                                        ],
                                        "title": "Kind",
                                        "required": true
                                      },
                                      "metric": {
                                        "type": "string",
                                        "title": "Metric",
                                        "required": true
                                      },
                                      "x": {
                                        "type": "array",
                                        "items": {
                                          "type": "integer"
                                        },
                                        "description": "从 0 开始的首尾分箱下标，均包含在内。",
                                        "title": "X",
                                        "required": true
                                      },
                                      "y": {
                                        "oneOf": [
                                          {
                                            "type": "array",
                                            "items": {
                                              "type": "integer"
                                            }
                                          },
                                          {
                                            "type": "null"
                                          }
                                        ],
                                        "description": "仅二维热图填写，同样包含首尾分箱。",
                                        "title": "Y"
                                      }
                                    },
                                    "title": "DistributionBinsReference"
                                  }
                                ]
                              },
                              "title": "Members",
                              "required": true
                            }
                          },
                          "title": "DistributionGroup"
                        },
                        "title": "Groups",
                        "required": true
                      }
                    },
                    "title": "DistributionMetricGrouping"
                  },
                  "title": "Comparisons"
                },
                "overlap_codes": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "仅完整范围：与本项确属同一实际原因的视觉评分代码；无重复原因时为空。",
                  "title": "Overlap Codes"
                },
                "grouping": {
                  "type": "string",
                  "description": "合理范围或分组及其统计依据；单一合理范围和均衡多范围不扣分。",
                  "title": "Grouping",
                  "required": true
                },
                "evidence_refs": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "引用输入facts中真实的统计项ref，不编造数量或缺失类别。",
                  "title": "Evidence Refs",
                  "required": true
                },
                "analysis": {
                  "type": "string",
                  "description": "先说结论，再用日常中文说明实际质量影响，不写分类定义或内部流程。",
                  "title": "Analysis",
                  "required": true
                }
              },
              "title": "QualityDistributionReview"
            }
          },
          {
            "type": "null"
          }
        ],
        "title": "Distribution Reviews"
      },
      "aliases": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "axis": {
              "type": "string",
              "enum": [
                "morphology",
                "special_morphology",
                "appearance",
                "structural_region",
                "hard_type",
                "texture",
                "confusable"
              ],
              "title": "Axis",
              "required": true
            },
            "source": {
              "type": "string",
              "title": "Source",
              "required": true
            },
            "canonical": {
              "type": "string",
              "description": "同一实际场景使用同一名称；不同原因不得为去重而合并。",
              "title": "Canonical",
              "required": true
            }
          },
          "title": "QualitySceneAlias"
        },
        "title": "Aliases"
      },
      "redundancy_reviewed": {
        "type": "boolean",
        "description": "已实际对照冻结相似候选及已识别相似组的原图，完成低信息增量判断。",
        "title": "Redundancy Reviewed",
        "required": true
      },
      "redundant_groups": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "members": {
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
              "title": "Members",
              "required": true
            },
            "reason": {
              "type": "string",
              "description": "依据实际对照的原图解释为何只增加很少信息，候选相似度不是依据。",
              "title": "Reason",
              "required": true
            }
          },
          "title": "QualityRedundantGroup"
        },
        "title": "Redundant Groups"
      },
      "preview_id": {
        "oneOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ],
        "description": "audit_quality_score返回的预览标识；正式报告原样提交，不自行生成。",
        "title": "Preview Id"
      }
    },
    "title": "QualityAssessment"
  },
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
    "description": "总体结论用两三句日常中文说清这批数据的主要发现。有问题时说明实际影响和应优先处理的事项。不复述数量、占比或分数，统计留在图表和明细中。概括当前可开展的用途。",
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
          "description": "精选5至10张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。",
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
          "description": "精选5至10张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。",
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
            "missing_content",
            "extra_content",
            "split",
            "merge",
            "position_difference"
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
            "PROGRAM_REVIEWED:EQUIVALENT",
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
          "description": "从该范围精选5至10张主Agent已实际查看的完整原图；用于比较的图指定counter。",
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
} as const;
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
} as const;
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
} as const;
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
    "default": "综合全部有效图级结果、全局发现、程序统计、来源信息和选用的评测成果，形成面向非项目人员的质量与评测能力报告，按工具合同提交。\n\n结论只概括当前用途和主要视觉发现，数量由页面统计展示。随后回答自洽性、标注复核重点、视觉覆盖、独立性与代表性、模型能力和使用条件。\n\n自洽性开头用一两句话回答：在内容相同、可以对照的图像中，标注是否一致；程序标出的差异经过模型看图后，哪些仍然成立。两套统计由程序计算并在页面展示，按主图计数，同一张图在同一类只记一次。随后按实际类型解释程序发现和模型复核的差别，直接说两侧标注哪里不同、为何保留或排除，配5至10张相关完整原图。\n\n无候选、无有效候选、标注一致等非空范围各自说明对照图的情况和跨图比较结果，精选5至10张属于该范围的完整原图。范围由记录中的consistency.source_status确定。单张图是否漏标、圈多了或把一个目标分成几个，放在标注质量章节；形态、亮度和纹理变化放在视觉覆盖或模型能力章节。章节概述聚焦标注是否一致，具体图像细节在对应小节说明。\n\n覆盖按实际形态、方向、尺度感受、可见度、背景和结构关系形成主题。独立性说清哪些图片重复、哪些可能拍自同一件物品；缺少登记时，直接列出需要补记的物品、批次或采集来源，以及完成后可以怎样分组。\n\n能力专题从真实视觉困难形成。每个小点说明观察、跨图共性与差别、可能检验的模型表现，并引用有完整原图的案例。单图特殊现象按个例解释，尚缺的能力场景集中列出。固定标签供内部统计，正文专题按证据组织。\n\n每条所选知识分别说明检查动作、适用情况、实际图像观察与对照，以及对本次判断的作用。精选主 Agent 已查看的完整原图解释应用。标题及知识状态来自冻结条目，逐图核对数量来自程序统计。知识章节使用标题、描述、图像证据和结构化分析；知识为空时列表为空。\n\n每个分析点直接讲图里有什么、标注有没有圈对、两图哪里相同或不同，以及可以据此检查模型的什么表现。正文自成一段完整说明，相关原图通过关联字段在该处展示。每张图的说明指出应看哪里、具体形态或差别。分析和图证关联当前有效图级版本。\n\n分别评价视觉探索、训练实验、内部调试、图像级评测、矩形框定位评测、像素区域评测及正式评测基准。各项说明可开展的工作和实际条件。共同缺项集中在用途章节，各主题只补充特有条件。\n\n先写结论，再用具体事实解释原因和影响。一句话只讲一个要点，主语是图中的部位、已有标注或要做的检查。提交前逐段按普通读者的视角重读：读者能否指着图片找到你说的地方，能否直接知道你的判断或下一步动作；读不顺的句子用日常用语重写。整体统计由页面交代，技术明细保留在结构化记录中。\n\n报告帮助读者看懂这批图像、标注和后续工作，回答自洽性、标注质量、视觉覆盖、独立性与代表性、模型能力和数据用途六个问题。开头直接说现在能用来做什么、主要发现什么。\n\n每段围绕一个要点，通常用两三句话讲清楚：图里哪里值得看，标注或两张图有什么相同和不同，这对使用数据有什么影响。直接下有依据的判断。需要读者复看时，说清看哪个部位、要确认什么。\n\n正文使用日常动词，少用抽象名词串。说“这两张图拍的是同一处”“几个框圈住同一条边”“补充其他批次的图片”，把判断过程讲成具体的图像事实和动作。不要照搬工具输出的判定术语，或用一串限制声明代替结果。任务规则、系统状态和保存过程留在配置与记录里。\n\n标题只写主题，层级编号由页面统一添加，数量在正文统计或图表中单独展示。\n\n数量和来源状态由页面统计展示，正文解释具体事实。新作业具有quality_score_version时，最终报告前调用audit_quality_score。主Agent归并同义场景（aliases），只有同一种实际原因才使用相同canonical；尺寸与位置是独立原因。低信息增量组逐图引用当前有效版本，实际打开dataset_profile.near_candidate_members中的候选原图后再确认redundancy_reviewed；候选相似度不等于冗余。没有低信息增量组时提交空组，不编造组。复核主要扣分场景的原图，读取程序计算结果解释分数，quality_assessment原样采用工具返回的assessment。数据一致性计分只采用冻结的上游数据一致性作业分类；图级审计独立发现和待确认疑点不作为一致性扣分，不将无候选或无有效候选描述为完成有效对照。综合分及三项分数由第一章图表展示，第二章用图表展示具体扣分、数量、占比与影响系数；冲突图证放在自洽性章节。数据分布由程序从冻结原始图像和标注计算，按需通过audit_distribution读取；分布图表由页面展示，正文引用数字直接采用工具结果。共同缺少的材料集中写成下一步：补哪类图片、确认哪些参考标注、登记哪些来源，再开展什么工作。各主题只补充自己特有的准备事项，不在每段重复同一条件。\n\n完成一组图像的比较后立即用audit_observation保存简短事实及引用，再读取下一组；该工具会释放已经观察的图片。当前可用图片直接联合比较，不反复读取。能直接提交图级结果时使用audit_commit，无需额外保存观察。\n\n报告用audit_report_section逐章保存，base_revision采用当前草稿版本，省略已经保存且没有变化的字段。先保存report_cases及其引用，再保存对应分析和用途。定稿仅提交commit_key和draft_revision；验证失败只修正指出的字段，不重发整份报告。\n\n主 Agent 综合全部有效图级事实和发现，各小点独立说明并关联5至10张相关原图，读者在当前小节就能对照图片读懂。案例及图像编号只填关联字段，由页面在正文旁展示图片。案例保存可复用的图像依据；知识描述说清教我们看哪里、这次看到了什么。\n\n正式图证使用主 Agent 实际查看的完整原图及原始标注。局部视图用于核查，正文图库使用完整原图。每处需要图证的分析精选5至10张能够共同说明问题的原图，说明各图的现象或关键差别。标注冲突由程序从上游实际比较记录中选择5至10对原图，主图在左、实际对比图在右；不足5对按实际数量展示。其他图证尽量选5至10张，不足5张保留实际数量。证据不足时继续查图或收拢主题。\n\n视觉覆盖围绕形态、方向、可见度、背景、结构关系和正常变化组织。用途说清这些场景可以检查模型的什么表现，以及具体需要做的准备。\n\n总体结论用两三句日常中文说清这批数据的主要发现。有问题时说明实际影响和应优先处理的事项。不复述数量、占比或分数，统计留在图表和明细中。\n正文使用自然、简洁、语义明确的日常中文。先说结论，再解释主要原因和影响。每个章节直接说明对应章节的发现，不逐项罗列分类定义。章节开头概括主要情况，不逐张列举现象；具体问题放在对应小节分析。正文不出现图像文件名、路径、样本ID或缩写编号，不以罗列图像名称代替分析；文件名只保留在图像查看信息中。内部优先级、执行流程、判断权限和自我免责说明不写进正文。\n\n一致性与分布评分由程序执行统一公式，你只判断实际影响并给出系数。不得自行填写分数、计数或改写上游分类。\n完整范围先读取audit_statistics中的consistency_scoring、audit_distribution(scoring=true)中的scopes；轻量范围使用输入中的consistency_scoring、distribution_facts。\n\nconsistency_reviews恰好覆盖consistency_scoring各scope_id中列出的扣分项，每项填写scope_id、code、coefficient、analysis、evidence_refs。evidence_refs只填该项ref；没有扣分项的范围不返回一致性系数。系数范围由Schema规定：1表示按基础扣分处理，低于1须说明已有证据表明实际影响较小，高于1须说明识别、训练或评估会如何受影响。数量、比例和稀缺程度已进入基础扣分，不能再仅因数量少或比例低重复加重系数；一致配对的数量不能成为减轻系数的理由。分析直接说明实际影响，不写图像名称、路径、流程或免责文字。\n\n标注一致性按全部冻结图像作分母，反向图对归并后，每张图只进入其最高优先级的计分项：类别不一致、少标/多标实例、少标/多标内容。拆分、合并和位置差异不扣分。\n\ndistribution_reviews恰好覆盖每个scope_id的六个axis。每项填写scope_id、axis、status、coefficient、comparisons、grouping、evidence_refs、analysis、overlap_codes。status使用normal、problem、not_applicable。只有problem填写有效coefficient，其他状态为null。evidence_refs只填本方向ref。\n类别方向按程序提供的base_deduction判断：大于0必须problem并给系数，否则normal；无统计为not_applicable。类别comparisons为空，由程序比较全部实际类别的图像数和实例数，取较严重口径一次计分，不自选少数类别代替整体，不推断未出现类别。\n\n其他方向先判断统计是否属于一个合理范围；统一规格、连续变化、普通峰谷及固定检测位置不属于覆盖不足。多个有意义的范围且数量均衡也正常。只有确需可比覆盖的多个范围失衡，才标problem并填写comparisons。正常或不适用时comparisons为空；没有统计的方向必须not_applicable。\ncomparisons每个metric至多一次，引用本方向实际统计名。每个比较包含groups，每组有label和members。分类分组members用{kind:\"group\",metric:统计名,bucket:counts中的键}；分箱用{kind:\"bins\",metric:统计名,x:[首箱,末箱],y:[首箱,末箱]}，下标从0开始且包含首尾，一维统计不填写y。组内可合并多个引用，各组不得重叠，必须覆盖该统计全部有效数据，至少两个非空组，不编造空场景。分组依据写入grouping。程序分别比较实例数与涉及图像数、不同口径，取最大基础扣分，不重复累加。\n图像尺寸与比例、实例尺寸与比例面积分别联合判断，不能把每个直方图的低频区间都当成独立场景。无标注图不等于漏标，单实例多于多实例不自动成为问题。采集来源仅使用已登记的批次、相机、站点、来源，不把训练/测试集划分当作来源失衡，不推测未登记信息。\n\n影响系数须依据本范围、本方向的实际后果并说明依据，不能用其他数据集的情况代替。分布扣分对象及数量由程序生成，不手写affected或level。distribution_analysis概括实际分布是否合理、主要问题及影响，不机械罗列分类。完整范围同一实际原因同时进入视觉和分布评分时，overlap_codes可引用对应视觉代码：实例几何B1/B2、位置B3/B4、每图实例数C3/C4；其他情况为空。\n"
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
} as const;
