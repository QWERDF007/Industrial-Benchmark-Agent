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
    "default": "逐张比较主图与候选图的图像和原始标注，分析主图相对于当前候选图的标注差异。实例标注比较类别、数量、位置和覆盖范围；图像级标注直接比较两侧图像标签。类别不同为类别不一致；主图比候选图多标为多类别，少标为少类别；标注位置或范围不同为位置差异；主图把候选图的一个对象标成多个实例为拆分，反过来为合并；没有差异为一致。位置与范围差异按原始坐标说明，框宽为x_max-x_min，框高为y_max-y_min，明确主图相对于候选图的方向。给出主要结论，并在分析中说明对应的对象、区域及实际差异。"
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
export const anchorVisualStartParameters = {
  "request_id": {
    "type": "string",
    "description": "request_id标识完整的视觉请求；复用已保存观察须保持原始参数，改变question、candidate_ids或windows时须使用新的request_id。",
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
} as const;
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
} as const;
export const anchorAssessmentInputParameters = {
  "fingerprint": {
    "type": "string",
    "title": "Fingerprint",
    "required": true
  },
  "observation_ids": {
    "type": "array",
    "items": {
      "type": "string"
    },
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
          "MATERIAL"
        ],
        "description": "当前候选的标注比对结论：MATERIAL表示存在差异，EQUIVALENT表示一致",
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
      "categories": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "类别不一致",
            "位置差异",
            "多类别",
            "少类别",
            "拆分",
            "合并"
          ]
        },
        "description": "MATERIAL提供唯一主要冲突分类；EQUIVALENT为空数组。其他发现保留在分析中。",
        "title": "Categories",
        "required": true
      }
    },
    "title": "AnchorAssessmentDecision",
    "required": true
  }
} as const;
export const anchorReviewSubmissionParameters = {
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
    "title": "Assessment Ids",
    "required": true
  }
} as const;
