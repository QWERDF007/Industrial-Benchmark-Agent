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
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Instruction"
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
  "identity_prompts": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "gate_system": {
        "type": "string",
        "title": "Gate System",
        "required": true
      },
      "gate_user": {
        "type": "string",
        "title": "Gate User",
        "required": true
      },
      "gate_examples": {
        "type": "string",
        "title": "Gate Examples",
        "required": true
      }
    },
    "title": "IdentityPrompts"
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
} as const;
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
} as const;
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
} as const;
export const consistencyCheckReferenceParameters = {
  "run_id": {
    "type": "string",
    "title": "Run Id",
    "required": true
  }
} as const;
export const anchorToolParameters = {
  "anomaly_detection": {
    "context": {
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
    },
    "observe": {
      "phase": {
        "type": "string",
        "enum": [
          "gate"
        ],
        "title": "Phase",
        "required": true
      },
      "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
      },
      "fingerprint": {
        "type": "string",
        "title": "Fingerprint",
        "required": true
      },
      "candidate_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Candidate Ids",
        "required": true
      },
      "gate_revisions": {
        "type": "object",
        "additionalProperties": true,
        "properties": {},
        "title": "Gate Revisions",
        "required": true
      }
    },
    "assess": {
      "phase": {
        "type": "string",
        "enum": [
          "gate",
          "audit"
        ],
        "title": "Phase",
        "required": true
      },
      "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
      },
      "fingerprint": {
        "type": "string",
        "title": "Fingerprint",
        "required": true
      },
      "candidate_id": {
        "type": "string",
        "title": "Candidate Id",
        "required": true
      },
      "expected_revision": {
        "type": "integer",
        "title": "Expected Revision",
        "required": true
      },
      "action": {
        "type": "string",
        "enum": [
          "commit",
          "recheck"
        ],
        "title": "Action",
        "default": "commit"
      },
      "observation_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Observation Ids"
      }
    },
    "submit": {
      "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
      },
      "fingerprint": {
        "type": "string",
        "title": "Fingerprint",
        "required": true
      },
      "assessment_ids": {
        "type": "array",
        "items": {
          "type": "integer"
        },
        "title": "Assessment Ids"
      }
    }
  },
  "bbox_defect": {
    "context": {
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
    },
    "observe": {
      "phase": {
        "type": "string",
        "enum": [
          "gate",
          "audit"
        ],
        "title": "Phase",
        "required": true
      },
      "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
      },
      "fingerprint": {
        "type": "string",
        "title": "Fingerprint",
        "required": true
      },
      "candidate_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Candidate Ids",
        "required": true
      },
      "gate_revisions": {
        "type": "object",
        "additionalProperties": true,
        "properties": {},
        "title": "Gate Revisions",
        "required": true
      },
      "question": {
        "oneOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ],
        "title": "Question"
      }
    },
    "assess": {
      "phase": {
        "type": "string",
        "enum": [
          "gate",
          "audit"
        ],
        "title": "Phase",
        "required": true
      },
      "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
      },
      "fingerprint": {
        "type": "string",
        "title": "Fingerprint",
        "required": true
      },
      "candidate_id": {
        "type": "string",
        "title": "Candidate Id",
        "required": true
      },
      "expected_revision": {
        "type": "integer",
        "title": "Expected Revision",
        "required": true
      },
      "action": {
        "type": "string",
        "enum": [
          "commit",
          "recheck"
        ],
        "title": "Action",
        "default": "commit"
      },
      "observation_ids": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Observation Ids"
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
          "limitations": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "独立保存未能确认的部分；已确认差异仍保留在issues，不因局部不确定而丢失。",
            "title": "Limitations"
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
                },
                "region_pair_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "支持本问题的已核实区域对ID；像素一致的程序捷径可为空。",
                  "title": "Region Pair Ids"
                },
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
                  "description": "位置问题必须确认实际缺陷覆盖存在material_change；不能仅因坐标、中心或尺寸数值不同报告问题。",
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
                  "description": "位置问题说明实际缺陷的漏盖、偏离或范围实质变化，不自行制定像素阈值。",
                  "title": "Coverage Reason"
                },
                "same_main_object_as": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "candidate_id": {
                        "type": "string",
                        "title": "Candidate Id",
                        "required": true
                      },
                      "annotation_ids": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        },
                        "title": "Annotation Ids",
                        "required": true
                      }
                    },
                    "title": "CandidateObjectReference"
                  },
                  "description": "仅用于主图少标：实际共同观察且确认是同一主图对象的其他候选原始框引用；没有确认则留空。程序验证真实映射区域与唯一对应，不能按文字或重叠猜测。",
                  "title": "Same Main Object As"
                }
              },
              "title": "BboxAnnotationIssue"
            },
            "description": "MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。",
            "title": "Issues"
          }
        },
        "title": "AnchorAssessmentDecision",
        "description": "仅phase=audit提交当前候选的标注审核。phase=gate必须省略或传null，只用observation_ids引用已保存的身份观察，由程序保存资格结论，不提交标注问题。"
      }
    },
    "submit": {
      "request_id": {
        "type": "string",
        "title": "Request Id",
        "required": true
      },
      "fingerprint": {
        "type": "string",
        "title": "Fingerprint",
        "required": true
      },
      "assessment_ids": {
        "type": "array",
        "items": {
          "type": "integer"
        },
        "title": "Assessment Ids"
      }
    }
  }
} as const;
