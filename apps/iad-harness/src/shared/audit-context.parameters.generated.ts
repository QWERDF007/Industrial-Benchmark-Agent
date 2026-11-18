/* Generated from Python audit context models. */
export const auditDatasetParameters = {
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
  "section": {
    "type": "string",
    "enum": [
      "duplicates",
      "similar_candidates",
      "benchmark",
      "benchmark_leakage"
    ],
    "title": "Section",
    "required": true
  }
} as const;
export const auditMemoryParameters = {
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
  }
} as const;
export const auditDraftQueryParameters = {
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
  "field": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Field"
  }
} as const;
export const auditDefectProfileParameters = {
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
  "features": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "feature_id": {
          "type": "string",
          "title": "Feature Id",
          "required": true
        },
        "category": {
          "type": "string",
          "title": "Category",
          "required": true
        },
        "signature": {
          "type": "string",
          "description": "实际缺陷的可见形态、外观和位置关系。",
          "title": "Signature",
          "required": true
        },
        "normal_distinctions": {
          "type": "string",
          "description": "比较良品时应核对的可见差别，不能凭频次或普通纹理判断困难。",
          "title": "Normal Distinctions",
          "required": true
        },
        "references": {
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
          "title": "References",
          "required": true
        }
      },
      "title": "AuditDefectFeature"
    },
    "title": "Features",
    "required": true
  },
  "limitations": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Limitations"
  }
} as const;
export const auditReviewParameters = {
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
} as const;
export const auditObservationParameters = {
  "evidence_ids": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Evidence Ids",
    "required": true
  },
  "facts": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "已看清的简短视觉事实及关键差别。成功保存后释放已观察附件，需要复看时显式读图。",
    "title": "Facts",
    "required": true
  }
} as const;
export const auditReportDraftParameters = {
  "base_revision": {
    "type": "integer",
    "title": "Base Revision",
    "required": true
  },
  "fields": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "quality_assessment": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
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
      "discovery_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Discovery Ids"
      },
      "conclusion": {
        "type": "string",
        "description": "概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。",
        "title": "Conclusion"
      },
      "consistency_analysis": {
        "type": "string",
        "description": "用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。",
        "title": "Consistency Analysis"
      },
      "knowledge_analysis": {
        "type": "string",
        "description": "简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。",
        "title": "Knowledge Analysis"
      },
      "coverage_analysis": {
        "type": "string",
        "description": "概括实际可见形态、背景、结构关系及尚缺场景。",
        "title": "Coverage Analysis"
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
        "title": "Independence Analysis"
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
        "title": "Capabilities"
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
        "title": "Usability"
      },
      "review_priorities": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "本轮真实保留疑点的复看位置和动作；没有则为空。",
        "title": "Review Priorities"
      },
      "limitations": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。",
        "title": "Limitations"
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
    },
    "title": "AuditReportFields",
    "required": true
  }
} as const;
export const auditReportFinalizeParameters = {
  "commit_key": {
    "type": "string",
    "title": "Commit Key",
    "required": true
  },
  "draft_revision": {
    "type": "integer",
    "title": "Draft Revision",
    "required": true
  }
} as const;
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
} as const;
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
        "description": "画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。",
        "title": "Limitations",
        "required": true
      }
    },
    "title": "AuditFinal",
    "required": true
  }
} as const;
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
} as const;
