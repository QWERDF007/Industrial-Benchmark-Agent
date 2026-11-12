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
} as const;
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
      "limitations": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Limitations",
        "required": true
      }
    },
    "title": "AuditLegacyFinal",
    "required": true
  }
} as const;
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
} as const;
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
    "title": "Conclusion",
    "required": true
  },
  "consistency_analysis": {
    "type": "string",
    "title": "Consistency Analysis",
    "required": true
  },
  "knowledge_analysis": {
    "type": "string",
    "title": "Knowledge Analysis",
    "default": ""
  },
  "coverage_analysis": {
    "type": "string",
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
          "description": "主Agent已实际观察的精选完整原图，数量按信息价值决定，不强行凑图。",
          "title": "Representatives"
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
          "description": "主Agent已实际观察的精选完整原图，数量按信息价值决定，不强行凑图。",
          "title": "Representatives"
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
        }
      },
      "title": "AuditConsistencyAnalysis"
    },
    "description": "本格式每个适用差异类型各一项；零疑点也如实分析，不将无候选、无有效候选、一致作为类型。",
    "title": "Consistency Analyses"
  },
  "independence_analysis": {
    "type": "string",
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
          "title": "Representatives"
        },
        "missing_conditions": {
          "type": "array",
          "items": {
            "type": "string"
          },
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
    "title": "Review Priorities",
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
    "default": "全部主图已有完成、未完成或失败记录。基于当前有效图级版本、已保存全局发现、真实程序统计及实际取得的元数据和 Benchmark 成果，提交整个冻结范围的质量与可评测能力报告。\n\n先回答可用于哪些用途，再选择有证据的共性质量问题、视觉规律与判断边界。归纳视觉现象的形态、位置、尺寸、对比可见度、结构和实例覆盖；依据真实来源评价独立性与代表性。能力覆盖或候选与正式就绪分开，按探索、训练实验、内部调试、图级、框级、像素级及正式基准分别判断。没有 Gold、划分或来源则保持未评价，bbox不能充当像素 mask，疑点率不是错误率。\n\ncoverage_analysis简要概括覆盖情况；coverage_topics按本作业实际观察形成主题，分别提交具体标题、综合analysis、当前有效evidence_refs及已实际观察的精选representatives。主题和数量不预设，不照搬其他作业的微小目标、低对比或端部示例。没有图证的主题不强造。关键发现直接选择真实发现账本，不另写一套固定发现。\n\nconsistency_analysis概括一致性判断；consistency_analyses按现有差异类型分别提交综合analysis、有效evidence_refs及必要representatives。labelme采用category_mismatch、extra_annotation、missing_annotation、position_difference、split、merge；folder_classification采用image_label_mismatch。多标和少标、拆分和合并各自独立，不加入无候选、无有效候选、一致等状态主题。没有相关材料时引用可为空，明确区分未保留该类疑点和缺少判断依据，不能把零疑点说成人工确认无误。统计数字由程序计算。标题不加序号或数量，正文不按图片逐一讲解。同组证据优先放在最能说明结论的主题中，避免在多个板块反复选取。\n\n零疑点也正常提供覆盖、能力与用途分析。所有内部引用只进入结构化字段，不进入自然语言正文。\n\n报告是对整个冻结范围的综合分析，以现象、跨图规律、关键发现和总结组织正文，说明共性、差异、适用范围与判断边界，不拼接逐图详情或批次过程。\n\n正文只包含业务分析，不叙述重新汇总、版本保留、工具调用、Session或是否登记复审等执行过程。执行约束应遵守，不复述到报告中。\n\n覆盖画像的综述与各主题只分析实际观察到的视觉场景、形态变化、结构关系、可见度及代表性。不写标注数量、有框或空标注图像数量、单框或多框分布，以及框面积、宽高比、位置坐标的范围和分位数等标注统计，不用标注统计代替视觉覆盖分析。\n\n由主 Agent 根据解释结论所需的信息自主决定典型原图及必要对照的数量。每张图须补充有意义的视觉差异或证据，不为凑数量选图，不全量罗列或重复堆图，不强造反例。只选主 Agent 已实际观察的真实完整原图，保留原始人工标注，不使用局部裁剪、拼接图或模型新增标注。图像仅作为综合结论的证据，图库不附逐图图注或详细分析。"
  },
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
