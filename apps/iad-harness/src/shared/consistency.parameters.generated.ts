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
} as const;
export const conflictCategories = [
  "类别不一致",
  "位置差异",
  "多类别",
  "少类别",
  "拆分",
  "合并",
  "对应关系差异"
] as const;
export const modelAssessmentLabels = {
  "NOT_ANALYZED": "未分析",
  "RUNNING": "分析中",
  "FAILED": "分析失败",
  "EQUIVALENT": "未发现实质标注差异",
  "MATERIAL": "存在实质差异",
  "UNCERTAIN": "证据不足"
} as const;
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
} as const;
export const groupAnalysisStartParameters = {
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
  },
  "request_id": {
    "type": "string",
    "title": "Request Id",
    "required": true
  },
  "batch_size": {
    "type": "integer",
    "title": "Batch Size",
    "default": 12
  },
  "instruction": {
    "type": "string",
    "title": "Instruction",
    "default": "根据运行上下文执行图组分析或批次汇总，正文不写具体文件名或图像ID，证据通过结构化引用字段绑定。\n\n比较方向：anchor始终是主图，candidate是参考图。所有差异以主图相对于当前参考图为准。conclusion和overall.text的冲突结论只能精确单选：类别不一致、位置差异、多类别、少类别、拆分、合并。不添加主图、标注、视觉、基本、可能、疑似等前后缀，不加标点，不使用或、斜线、顿号等连接多个结论。主图0个标注而参考图1个标注，结论只能为少类别；反过来只能为多类别。主图同一对象多个框、参考图一个框为拆分，反过来为合并；同一对象类别值不同为类别不一致；位置或覆盖范围不同为位置差异。已确认多种差异时选择最主要的一种作为唯一结论，其他实际差异完整写在explanation、findings及conclusions。MATERIAL的categories必须是仅包含conclusion同名分类的单元素数组。类别、数量、位置和范围全部对应时，verdict为EQUIVALENT，conclusion和overall.text精确写一致，categories为空数组。只有确实缺失图片、标注或可比较内容时才可UNCERTAIN，conclusion及overall.text为null，categories为空，分析写明具体缺失内容；不能编造六类冲突。空标注数组是已知的0个标注，不是缺失标注文件或缺失证据；已读取主图0个标注、参考图有标注时必须判为少类别。不裁决哪一侧标注正确，不能因为无法判断漏标还是另一侧多标而拒绝给出主图相对参考图的增减方向。explanation、findings及所有正文只用主图、参考图等自然语言称呼，不能附带@c0、@c1、文件名或具体引用；这些引用仅用于结构化引用字段。\n\n图组分析：\n分析整个冻结图组，必须联合查看完整原图、原始标注数据和无叠加的局部原始像素裁剪。不限于工具已报出的差异：独立检查主图相对每张参考图的类别、数量、位置、覆盖范围及实例划分，具体依据写在分析中。每条分析引用真实candidate_id；引用比较证据时填写comparison对象，result_id和evidence_id完整复制上下文中的配对引用，difference_id可选；无直接比较依据时comparison为null。像素/几何事实、模型视觉解释、标注规范和人工质量裁决必须区分；相似度不能证明缺陷，不能写Gold或人工裁决。标注匹配工具提供比较观察；必须逐项核对对应关系，不能把位置微移、范围变化或实例划分误判为标注增减。本任务检查标注一致性，不裁决哪一侧标注正确。对已确认同像素的图像，对应标注的原始类别值不同就是标注类别不同；例如15变为18或图像级OK与NG不同，均属于类别不一致。不得预设类别映射或语义相近；视觉相近可以写入详细分析，但不能否定类别差异。缺少类别映射、语义定义未知不能抹除已读取的类别差异。对于非同像素的相似图，联合观察原图、局部及标注，建立实际对象对应；相似度高不证明同一实物或缺陷真值。位置使用各自原图尺寸归一化后的坐标。RELATIVE_IMAGE表示相对标注布局的比较，不是图像配准。没有提供容差标准时不得自定合理浮动范围忽略已观察到的标注位置或范围差异；细微坐标变化同样属于位置数据差异，分析指出坐标、偏移及覆盖范围变化。不能仅因没有精确配准就拒绝视觉核对，也不能猜测几何变换、工业公差或缺陷真值。representation=raw的附件是完整原图或原始裁剪，没有绘制框、文字或颜色，标注坐标在JSON中。annotation_mask附件只表达人工mask的二值定位形状，不能把掩膜或标注颜色当产品特征。assessments对每个candidate_id恰好给出一次核对，通过candidate_id绑定固定主图的直接比较证据，不重复输出comparison。没有固定主图直接比较证据的成员只能UNCERTAIN，不能编造引用。overall.verdict按逐候选汇总：存在MATERIAL则为MATERIAL，否则存在UNCERTAIN则为UNCERTAIN，其余为EQUIVALENT。overall.text只从实际逐候选结果中选择主要冲突类型，不得发明新类型；详细分析保留在conclusions。所有具体区域、数量、对象对应、其他实际发现及证据限制写在explanation、findings、conclusions与limitations。\n\n批次汇总：\n根据已保存的逐批视觉分析汇总图组结论，没有新的图像附件，不能新增视觉事实或替代逐批分析。overall.verdict使用给定expected_verdict，存在已确认差异时不能因其他成员未知否定该差异。overall.text从已保存的主要冲突分类中单选，不并列、不改写、不增加描述；全部具体差异及证据限制完整保留在conclusions与limitations。引用只从输入已有references中复制，不发明类别映射、公差、工业标准或未观察的图像事实。\n\n若运行上下文提供输出校验结果，依据其中的Schema错误修正上次输出，重新返回一个完整结果。输出以下结构对应的一个完整JSON对象，不输出Markdown代码块、不复述格式定义，也不重复整个结果。根JSON对象闭合后立即结束生成，不继续输出右括号或其他内容。下面的格式变量在运行时替换为当前分析阶段的实际JSON Schema：\n{{response_schema}}\n"
  }
} as const;
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
} as const;
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
    "type": "string",
    "title": "Profile Id"
  },
  "request_id": {
    "type": "string",
    "title": "Request Id",
    "required": true
  },
  "model_analysis_prompt": {
    "type": "string",
    "title": "Model Analysis Prompt"
  },
  "prompt": {
    "type": "string",
    "title": "Prompt"
  }
} as const;
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
    "type": "string",
    "title": "Profile Id"
  },
  "top_k": {
    "type": "integer",
    "title": "Top K",
    "default": 50
  },
  "min_similarity": {
    "type": "number",
    "title": "Min Similarity"
  },
  "cursor": {
    "type": "string",
    "title": "Cursor"
  }
} as const;
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
    "type": "string",
    "title": "Profile Id"
  },
  "request_id": {
    "type": "string",
    "title": "Request Id",
    "required": true
  }
} as const;
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
} as const;
export const consistencyEvidenceParameters = {
  "evidence_id": {
    "type": "string",
    "title": "Evidence Id",
    "required": true
  }
} as const;
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
            "type": "string",
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
    "type": "string",
    "enum": [
      "EXACT",
      "NEAR_CANDIDATE",
      "VISUAL_REFERENCE",
      "DIFFERENT",
      "UNCHECKED"
    ],
    "title": "Relation"
  },
  "confirmed_conflict": {
    "type": "boolean",
    "title": "Confirmed Conflict"
  },
  "difference_type": {
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
    ],
    "title": "Difference Type"
  },
  "review_state": {
    "type": "string",
    "enum": [
      "OPEN",
      "NEEDS_CONTEXT",
      "RESOLVED"
    ],
    "title": "Review State"
  },
  "correction_state": {
    "type": "string",
    "enum": [
      "NOT_REQUIRED",
      "PROPOSED",
      "AWAITING_RESCAN",
      "VERIFIED"
    ],
    "title": "Correction State"
  },
  "cursor": {
    "type": "string",
    "title": "Cursor"
  },
  "page_size": {
    "type": "integer",
    "title": "Page Size",
    "default": 50
  }
} as const;
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
} as const;
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
} as const;
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
        "type": "string",
        "enum": [
          "conflicts",
          "search",
          "groups",
          "jobs"
        ],
        "title": "Tab"
      },
      "scope": {
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
        "title": "Scope"
      },
      "query": {
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
      "batchId": {
        "type": "string",
        "title": "Batchid"
      },
      "resultId": {
        "type": "string",
        "title": "Resultid"
      },
      "evidenceId": {
        "type": "string",
        "title": "Evidenceid"
      },
      "facts": {
        "type": "string",
        "enum": [
          "CURRENT",
          "HISTORICAL",
          "UNKNOWN"
        ],
        "title": "Facts"
      },
      "groupId": {
        "type": "string",
        "title": "Groupid"
      },
      "memberId": {
        "type": "string",
        "title": "Memberid"
      },
      "differenceId": {
        "type": "string",
        "title": "Differenceid"
      },
      "returnPage": {
        "type": "string",
        "title": "Returnpage"
      },
      "sessionId": {
        "type": "string",
        "title": "Sessionid"
      },
      "queryId": {
        "type": "string",
        "title": "Queryid"
      },
      "gallerySearch": {
        "type": "string",
        "title": "Gallerysearch"
      },
      "galleryOrder": {
        "type": "string",
        "enum": [
          "recent",
          "members"
        ],
        "title": "Galleryorder"
      },
      "differenceFilter": {
        "type": "string",
        "enum": [
          "all",
          "category",
          "geometry",
          "presence",
          "instances",
          "multiple"
        ],
        "title": "Differencefilter"
      },
      "modelFilter": {
        "type": "string",
        "enum": [
          "all",
          "NOT_ANALYZED",
          "RUNNING",
          "FAILED",
          "EQUIVALENT",
          "MATERIAL",
          "UNCERTAIN"
        ],
        "title": "Modelfilter"
      },
      "galleryPage": {
        "type": "integer",
        "title": "Gallerypage"
      },
      "detailTab": {
        "type": "string",
        "enum": [
          "summary",
          "evidence",
          "review"
        ],
        "title": "Detailtab"
      },
      "subjectId": {
        "type": "string",
        "title": "Subjectid"
      },
      "reviewFilter": {
        "type": "string",
        "enum": [
          "OPEN",
          "NEEDS_CONTEXT",
          "RESOLVED"
        ],
        "title": "Reviewfilter"
      },
      "groupPage": {
        "type": "integer",
        "title": "Grouppage"
      },
      "memberPage": {
        "type": "integer",
        "title": "Memberpage"
      }
    },
    "title": "ConsistencyReturnLocation"
  },
  "cursor": {
    "type": "string",
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
} as const;
export const consistencyBatchParameters = {
  "batch_id": {
    "type": "string",
    "title": "Batch Id",
    "required": true
  }
} as const;
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
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Sample Ids"
  }
} as const;
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
} as const;
export const temporaryImageLimits = {
  "max_source_bytes": 134217728,
  "max_bytes": 268435456,
  "max_images": 128,
  "max_vector_bytes": 8388608,
  "ttl_seconds": 1800
} as const;
