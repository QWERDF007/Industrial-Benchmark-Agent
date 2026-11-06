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
    "default": "根据本次运行上下文执行图组分析或批次汇总。结论与描述概括差异，不写具体文件名或图像ID；具体证据使用结构化引用字段。\n\n图组分析：\n分析整个冻结图组；每条结论引用真实candidate_id。引用比较证据时填写comparison对象，其中result_id和evidence_id必须完整复制上下文中的配对引用，difference_id可选；无直接比较依据时comparison为null。像素/几何事实、模型视觉解释、标注规范和人工质量裁决必须区分；相似度不能证明缺陷，不能写Gold或人工裁决。标注匹配工具输出是待核对的候选解释，不是漏标结论。必须联合查看完整原图、原始标注数据和无叠加的局部原始像素裁剪，逐项核对单侧标注是否其实对应另一侧位置微移、范围变化或拆分合并的标注；不得照抄工具分类作为视觉结论。本任务检查标注一致性，不裁决哪一侧标注正确。对已确认同像素的图像，对应标注的原始类别值不同就是标注类别不同，例如15变为18，或图像级OK与NG不同，均属于MATERIAL类别差异；不需要先确认类别语义或等价性。不得预设类别映射或语义相近，不得用缺少映射、类别定义未知或两图像素相同将已确认的类别差异降为EQUIVALENT或UNCERTAIN。同像素图中若独立查看原图和局部后发现两类所指对象视觉相近，视觉相近可以写入详细分析，但不能否定类别差异。对于非同像素的相似图，先联合观察原图、局部及标注，判断对象、缺陷和标注规则是否可比。相似度高不等于同一实物或同一缺陷，不能仅因OK/NG不同、原始类别值不同、标注数量不同或框位置不同就判MATERIAL。应区分真实产品外观差异带来的合理标签变化与同类可见现象被不一致标注：图像差异能解释标签变化且未发现实质标注规则差异时可判EQUIVALENT，说明真实差别；有具体视觉对应依据支持标注冲突时才判MATERIAL，说明对应对象、可见现象和冲突；无法建立可靠视觉对应或缺陷依据不足时判UNCERTAIN，写明实际缺失的依据。程序像素不兼容、几何未匹配只表示工具未建立对应，不能仅因没有精确配准就拒绝视觉核对；同样不能凭模型猜测几何变换、工业公差或缺陷真值。不限于工具已报出的差异，也不限于现有分类：独立检查完整原图与标注，主动发现漏检差异、标错对象、无关背景、忽略区域、边界约定及其他有图像依据的问题。细微坐标变化不能直接等同标注错误；核对标注是否对应、偏移或范围变化是否构成实际差异，未知公差不得自行编造。representation=raw的附件是完整原图或原始裁剪，没有绘制标注框、文字或颜色。标注坐标在JSON中；annotation_mask附件只表达人工mask标注的二值定位形状，不是真实产品像素，不能把掩膜黑白或标注颜色当产品特征。对完整图组联合分析后，overall.text只写一句简短的差异结论，仅概括差异类型，不写位置、数值、依据或建议。不要重复verdict，不加“整体结论为”等引导语，不写分析过程或理由。例如“标注类别不同”“标注位置偏移”“缺少标注”“多出标注”“标注拆分”“标注合并”“未发现标注差异”；多种差异用短语合并，其他实际发现据实概括，不局限于这些示例。详细依据、位置、数值、解释和限制写入conclusions与limitations。逐候选conclusion和overall.text必须由你根据图像与标注给出确定性的简短自然语言结论，只说明具体差异类型或明确无差异，不在最终结论中展开分析。保留类别、位置、数量、增加、减少、拆分、合并等所有实际差异，不限于这些类型，也不能压缩为一致/不一致标签。不得使用“基本一致”“大致相同”“可能”“疑似”“待核对”“待确认”等表述回避判断。分析写入逐候选explanation和conclusions，说明差异在哪里、哪一侧增加或减少、偏移及拆分合并的具体依据；没有差异时在分析中说明类别、数量、位置和覆盖范围的实际对应关系；不得把没有精确配准、类别语义未知或规范未确认直接当成证据不足。确实缺少图片、标注或可比较内容时，写明具体缺失的证据及其阻断的判断，不能编造事实或泛称待核对。assessments必须对每个candidate_id恰好给出一次核对：EQUIVALENT表示未发现实质标注一致性问题或仅轻微标注浮动，不要求不同实物的像素相同；MATERIAL表示同像素图已确认的类别差异或有视觉对应依据的实质标注冲突，UNCERTAIN表示比较证据不足；findings自由描述问题，不受工具分类限制。overall.verdict按逐成员结论汇总：存在MATERIAL则为MATERIAL；否则存在UNCERTAIN则为UNCERTAIN；其余为EQUIVALENT。assessments通过candidate_id绑定已提供的固定主图比较证据，不重复输出comparison；没有直接比较证据的候选只能UNCERTAIN。说明每个候选实际属于类别变化、位置/范围变化、实例划分、标注增减或具体缺失的比较依据，并引用对应差异证据。没有固定主图直接比较证据的成员只能保留未知。不得编造引用；仅记录实际影响差异判断的证据或覆盖限制，不要求裁决标注正误，不将缺少类别映射或语义定义列为已确认类别差异的判断限制。\n\n\n批次汇总：\n根据已保存的各批视觉分析汇总图组结论。这里没有新的图像附件，不能新增视觉事实或替代逐批分析。保留批次中的实质差异、未知项和限制。overall.verdict必须使用给定expected_verdict，不能因其他成员未知否定已确认差异。overall.text仍直接陈述具体结论，不用“基本一致”“可能”“疑似”“待核对”等模糊话术，不写分析过程；保留全部实际差异类型。conclusions写综合依据，引用只能从输入已有references中复制。不判断哪一侧标注正确，不发明类别映射、公差或工业标准；局部批次解释不能扩展为未观察的图像事实。\n\n若运行上下文提供输出校验结果，依据其中的Schema错误修正上次输出，重新返回一个完整结果。输出以下结构对应的一个完整JSON对象，不输出Markdown代码块、不复述格式定义，也不重复整个结果。根JSON对象闭合后立即结束生成，不继续输出右括号或其他内容。下面的格式变量在运行时替换为当前分析阶段的实际JSON Schema：\n{{response_schema}}\n"
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
