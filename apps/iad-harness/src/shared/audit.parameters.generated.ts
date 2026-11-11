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
      "limitations": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Limitations",
        "required": true
      }
    },
    "title": "AuditFinal",
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
export const auditGroupParameters = {
  "commit_key": {
    "type": "string",
    "title": "Commit Key",
    "required": true
  },
  "groups": {
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
        "issue_refs": {
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
              "finding_id": {
                "type": "string",
                "title": "Finding Id",
                "required": true
              }
            },
            "title": "AuditIssueReference"
          },
          "title": "Issue Refs",
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
              "finding_id": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ],
                "title": "Finding Id"
              },
              "role": {
                "type": "string",
                "enum": [
                  "representative",
                  "counter"
                ],
                "description": "representative为典型疑点图；counter为已观察的判断边界对照图，不是人工确认的正常真值。",
                "title": "Role",
                "default": "representative"
              },
              "reason": {
                "type": "string",
                "title": "Reason",
                "required": true
              }
            },
            "title": "AuditRepresentative"
          },
          "title": "Representatives",
          "required": true
        },
        "normal_explanations": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Normal Explanations"
        },
        "limitations": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Limitations"
        }
      },
      "title": "AuditIssueGroup"
    },
    "title": "Groups"
  },
  "remove_group_ids": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Remove Group Ids"
  }
} as const;
export const auditReportParameters = {
  "commit_key": {
    "type": "string",
    "title": "Commit Key",
    "required": true
  },
  "scope_analysis": {
    "type": "string",
    "title": "Scope Analysis",
    "required": true
  },
  "issue_analysis": {
    "type": "string",
    "title": "Issue Analysis",
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
    "required": true
  },
  "boundary_analysis": {
    "type": "string",
    "description": "解释相似现象在已保存图级记录中的判断边界；不重判终稿，不假设类别语义、实例规范或采集工艺。没有实际对照时不编造。",
    "title": "Boundary Analysis",
    "default": ""
  },
  "conclusion": {
    "type": "string",
    "title": "Conclusion",
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
  "instruction": {
    "type": "string",
    "title": "Instruction",
    "default": "审核当前主图的标注质量。实际观察本次提供的完整原图、原始标注和全部必要局部，逐项核对本图数据一致性结果。\n\n对于上游存在的每项差异，分别判断“支持为疑点、不支持、证据不足”并说明当前主图的实际依据；若上游没有差异，则直接继续本图独立审核，不虚构差异。知识可以为空；如已选用知识，先确认适用性，再结合本图实际证据使用。\n\n重点检查当前可见内容与现有标注之间的遗漏嫌疑、额外标注、覆盖异常和实例组织等质量关系。不验证人工类别语义或真值，不假设有未提供的规范。只有具有可核查依据时才保存质量疑点；普通视觉变化不得自动认定为少标，必要时可保留简短待判别观察。\n\n保存图级结论、全部独立疑点、真实图像证据、上游及知识关联、必要的正常替代解释与实际限制。自然语言不要罗列内部 ID、文件路径或执行信息，不修改原始标注。"
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
  "report_instruction": {
    "type": "string",
    "title": "Report Instruction",
    "default": "根据本次作业全部已保存的图级审计终稿、冻结的数据一致性结果、实际选用的知识以及程序提供的准确统计，形成面向使用者的数据集质量审计报告。\n\n说明审计范围、完成情况、图级结论分布，区分疑点图像数、独立质量疑点次数与未完成图像；如记录待判别观察，则单独统计，不并入质量疑点。逐项统计口径以程序计算为准，不估算未提供的数量。\n\n归并主要质量问题主题，说明各主题涉及的不同图像数量、问题次数、具体视觉与原始标注关系及必要限制；对相似现象但审核结论不同的情况，分析当前记录体现的判断边界，不修改图级终稿。\n\n交叉分析上游数据一致性结果与图级审计结论，说明知识条目的实际作用；未选知识时不虚构知识贡献。每类主要主题只选择少量关键图像证据，必要时提供判断边界的对照图，保留真实结构化引用并由界面关联完整原图及原始标注。\n\n报告正文仅呈现用户关心的质量发现、统计、关键证据、整体结论和人工复核重点。不得输出作业、数据集、图像、标注、媒体或问题的内部 ID、完整文件名、工具参数、数据库字段、分页或执行日志。这些仅存于结构化关联字段。\n\n模型疑点率不等于人工确认错误率。不得验证人工类别真实语义，不推断不存在的标注规范，不修改标注，不生成建议类别、建议框或 Gold 结论。不凭历史对话猜数字，不重判或覆盖已保存图级结果。\n\n典型证据与判断边界对照仅引用完整原图，局部裁剪图不作为报告证据。"
  }
} as const;
