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
    "default": "逐主图核对全部入选候选的标注一致性，查看两侧原图、原始标注及适用原像素局部。区分标注数据差异、可见现象与实物本身的状态差异；相似度不证明同一实物或缺陷真值。不同实物先建立可比现象，真实外观变化可以解释标注差异。位置差异须有同图像素证据或可靠配准，归一化标注布局不能代替配准。类别仅按明确映射比较，不以出现频数裁定哪侧正确。比较方向：anchor始终是主图，candidate是参考图。所有差异以主图相对于当前参考图为准。conclusion和overall.text的冲突结论只能精确单选：类别不一致、位置差异、多类别、少类别、拆分、合并。不添加主图、标注、视觉、基本、可能、疑似等前后缀，不加标点，不使用或、斜线、顿号等连接多个结论。在有效、穷尽且非忽略的可比域内，主图0个标注而参考图1个标注为少类别；反过来为多类别。主图同一对象多个框、参考图一个框为拆分，反过来为合并；同一对象类别值不同为类别不一致；位置或覆盖范围不同为位置差异。已确认多种差异时选择最主要的一种作为唯一结论，其他实际差异完整写在explanation、findings及conclusions。MATERIAL的categories必须是仅包含conclusion同名分类的单元素数组。类别、数量、位置和范围全部对应时，verdict为EQUIVALENT，conclusion和overall.text精确写一致，categories为空数组。缺少关键标注来源、覆盖或可比内容时用UNCERTAIN，conclusion及overall.text为null，categories为空，分析写明具体限制。annotation_availability区分有效空标、未提供、读取失败和未知；只有有效空标才是已知0个标注。annotation_applicability记录覆盖与共同可比域限制；PARTIAL、UNKNOWN或ignore不能支持所限制区域的缺标推断，原始数量差异仍保留。不裁决哪一侧标注正确，不能因为无法判断漏标还是另一侧多标而拒绝给出主图相对参考图的增减方向。explanation、findings及所有正文只用主图、参考图等自然语言称呼，不能附带@c0、@c1、文件名或具体引用；这些引用仅用于结构化引用字段。逐候选覆盖完整并保留具体证据、限制与其他发现。存在MATERIAL时整场为MATERIAL，否则有关键领域证据不足则为UNCERTAIN，其余EQUIVALENT。原始程序事实与模型结论、人审分别保存，不修改原标注、人审或Gold。"
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
          "MATERIAL",
          "UNCERTAIN"
        ],
        "description": "当前候选的标注一致性判定：MATERIAL为实质冲突，EQUIVALENT为一致，UNCERTAIN为关键证据缺失",
        "title": "Verdict",
        "required": true
      },
      "explanation": {
        "type": "string",
        "description": "当前图对的分析依据，具体说明差异发生在哪一侧、哪个对象或区域，位置、类别、数量及拆分合并等实际变化，解释判定及主分类；无差异时说明各项对应。不得用基本一致、可能、疑似、待核对等话术替代判断。真实缺失证据须指明缺失内容及其阻断的判断",
        "title": "Explanation",
        "required": true
      },
      "findings": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "自由描述实际发现的问题，不受程序差异分类限制；未发现差异时可为空",
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
        "description": "MATERIAL提供唯一主要冲突分类；EQUIVALENT和UNCERTAIN为空数组。其他发现保留在分析中。",
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
  },
  "overall": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "assessment_id": {
        "type": "integer",
        "description": "本场最新已保存评估的整数ID",
        "title": "Assessment Id",
        "required": true
      }
    },
    "title": "AnchorAssessmentSelection",
    "required": true
  },
  "conclusions": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Conclusions",
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
