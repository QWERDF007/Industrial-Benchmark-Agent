/* Generated from Python analysis Agent models. */
export const explorationAgentStartParameters = {
  "submission_id": {
    "type": "string",
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
  "normal_images": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Normal Images"
  },
  "defect_images": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Defect Images"
  },
  "prompt": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "preset_id": {
        "oneOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ],
        "title": "Preset Id"
      },
      "preset_name": {
        "oneOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ],
        "title": "Preset Name"
      },
      "text": {
        "type": "string",
        "title": "Text",
        "required": true
      }
    },
    "title": "FrozenExplorationPrompt",
    "required": true
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
  }
} as const;
export const knowledgeAgentStartParameters = {
  "submission_id": {
    "type": "string",
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
  "mining_prompt": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "objective": {
        "type": "string",
        "title": "Objective",
        "required": true
      },
      "directions": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "direction_id": {
              "type": "string",
              "title": "Direction Id",
              "required": true
            },
            "title": {
              "type": "string",
              "title": "Title",
              "required": true
            },
            "instruction": {
              "type": "string",
              "title": "Instruction",
              "required": true
            },
            "enabled": {
              "type": "boolean",
              "title": "Enabled",
              "default": true
            },
            "origin": {
              "type": "string",
              "enum": [
                "preset",
                "dataset",
                "explored"
              ],
              "title": "Origin",
              "default": "dataset"
            },
            "source": {
              "oneOf": [
                {
                  "oneOf": [
                    {
                      "type": "object",
                      "additionalProperties": false,
                      "properties": {
                        "origin": {
                          "type": "string",
                          "enum": [
                            "preset"
                          ],
                          "title": "Origin",
                          "default": "preset"
                        },
                        "catalog_id": {
                          "type": "string",
                          "title": "Catalog Id",
                          "default": "knowledge-directions"
                        },
                        "direction_id": {
                          "type": "string",
                          "title": "Direction Id",
                          "required": true
                        },
                        "revision": {
                          "type": "string",
                          "title": "Revision",
                          "required": true
                        }
                      },
                      "title": "PresetDirectionSource"
                    },
                    {
                      "type": "object",
                      "additionalProperties": false,
                      "properties": {
                        "origin": {
                          "type": "string",
                          "enum": [
                            "explored"
                          ],
                          "title": "Origin",
                          "default": "explored"
                        },
                        "run_id": {
                          "type": "string",
                          "title": "Run Id",
                          "required": true
                        },
                        "version_id": {
                          "type": "string",
                          "title": "Version Id",
                          "required": true
                        },
                        "direction_id": {
                          "type": "string",
                          "title": "Direction Id",
                          "required": true
                        }
                      },
                      "title": "ExploredDirectionSource"
                    }
                  ]
                },
                {
                  "type": "null"
                }
              ],
              "title": "Source"
            }
          },
          "title": "MiningDirection"
        },
        "title": "Directions",
        "required": true
      },
      "instruction": {
        "type": "string",
        "title": "Instruction",
        "required": true
      },
      "exploration": {
        "oneOf": [
          {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "version_id": {
                "type": "string",
                "title": "Version Id",
                "required": true
              },
              "summary": {
                "type": "string",
                "title": "Summary",
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
            },
            "title": "MiningExploration"
          },
          {
            "type": "null"
          }
        ]
      }
    },
    "title": "SubmittedMiningPrompt",
    "required": true
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
  }
} as const;
export const analysisScopeParameters = {
  "dataset_ids": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Dataset Ids",
    "required": true
  }
} as const;
export const analysisCatalogParameters = {
  "section": {
    "type": "string",
    "enum": [
      "directions",
      "checks"
    ],
    "title": "Section",
    "required": true
  },
  "ids": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Ids"
  },
  "offset": {
    "type": "integer",
    "title": "Offset",
    "default": 0
  },
  "limit": {
    "type": "integer",
    "title": "Limit",
    "default": 20
  }
} as const;
export const analysisObservationParameters = {
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
  "direction_ref": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Direction Ref"
  },
  "round_id": {
    "oneOf": [
      {
        "type": "integer"
      },
      {
        "type": "null"
      }
    ],
    "title": "Round Id"
  },
  "page": {
    "type": "integer",
    "title": "Page",
    "default": 1
  },
  "page_size": {
    "type": "integer",
    "title": "Page Size",
    "default": 10
  }
} as const;
export const analysisMediaParameters = {
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
export const analysisCropParameters = {
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
  "bbox": {
    "type": "array",
    "items": {
      "type": "integer"
    },
    "title": "Bbox",
    "required": true
  }
} as const;
export const explorationCommitParameters = {
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
  "round_id": {
    "type": "integer",
    "title": "Round Id",
    "required": true
  },
  "observations": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "dataset_id": {
          "type": "string",
          "title": "Dataset Id",
          "required": true
        },
        "sample_id": {
          "type": "string",
          "title": "Sample Id",
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
          "title": "Evidence Ids",
          "required": true
        },
        "directions": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "direction_ref": {
                "type": "string",
                "title": "Direction Ref",
                "required": true
              },
              "status": {
                "type": "string",
                "enum": [
                  "applicable",
                  "not_applicable",
                  "uncertain"
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
            "title": "AnalysisDirectionObservation"
          },
          "title": "Directions"
        },
        "limitations": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Limitations"
        },
        "report_preparation_error": {
          "type": "boolean",
          "title": "Report Preparation Error",
          "default": false
        }
      },
      "title": "AnalysisSampleObservation"
    },
    "description": "本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。",
    "title": "Observations",
    "required": true
  },
  "summary": {
    "type": "string",
    "title": "Summary",
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
  "unresolved_questions": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Unresolved Questions",
    "required": true
  },
  "merges": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "target_id": {
          "type": "string",
          "title": "Target Id",
          "required": true
        },
        "source_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Source Ids",
          "required": true
        }
      },
      "title": "AnalysisCatalogMerge"
    },
    "title": "Merges"
  },
  "directions": {
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
        "instruction": {
          "type": "string",
          "title": "Instruction",
          "required": true
        },
        "applies_to": {
          "type": "string",
          "enum": [
            "normal",
            "defect",
            "both"
          ],
          "title": "Applies To",
          "required": true
        },
        "rationale": {
          "type": "string",
          "title": "Rationale",
          "required": true
        },
        "evidence_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Evidence Ids",
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
        "direction_id": {
          "type": "string",
          "title": "Direction Id",
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
        "counter_evidence_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Counter Evidence Ids"
        }
      },
      "title": "ProposedAnalysisDirection"
    },
    "description": "JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。条目仅引用关键代表原图，不累加全部已看图像。",
    "title": "Directions",
    "required": true
  }
} as const;
export const knowledgeCommitParameters = {
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
  "round_id": {
    "type": "integer",
    "title": "Round Id",
    "required": true
  },
  "observations": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "dataset_id": {
          "type": "string",
          "title": "Dataset Id",
          "required": true
        },
        "sample_id": {
          "type": "string",
          "title": "Sample Id",
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
          "title": "Evidence Ids",
          "required": true
        },
        "directions": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "direction_ref": {
                "type": "string",
                "title": "Direction Ref",
                "required": true
              },
              "status": {
                "type": "string",
                "enum": [
                  "applicable",
                  "not_applicable",
                  "uncertain"
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
            "title": "AnalysisDirectionObservation"
          },
          "title": "Directions"
        },
        "limitations": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Limitations"
        },
        "report_preparation_error": {
          "type": "boolean",
          "title": "Report Preparation Error",
          "default": false
        }
      },
      "title": "AnalysisSampleObservation"
    },
    "description": "本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。",
    "title": "Observations",
    "required": true
  },
  "summary": {
    "type": "string",
    "title": "Summary",
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
  "unresolved_questions": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Unresolved Questions",
    "required": true
  },
  "merges": {
    "type": "array",
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "target_id": {
          "type": "string",
          "title": "Target Id",
          "required": true
        },
        "source_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Source Ids",
          "required": true
        }
      },
      "title": "AnalysisCatalogMerge"
    },
    "title": "Merges"
  },
  "checks": {
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
        "subject": {
          "type": "string",
          "title": "Subject",
          "required": true
        },
        "location": {
          "type": "string",
          "title": "Location",
          "required": true
        },
        "criterion": {
          "type": "string",
          "title": "Criterion",
          "required": true
        },
        "allowed_variations": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Allowed Variations",
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
        "status": {
          "type": "string",
          "enum": [
            "supported",
            "provisional",
            "conflicted"
          ],
          "description": "supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值",
          "title": "Status",
          "required": true
        },
        "support_evidence_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Support Evidence Ids",
          "required": true
        },
        "counter_evidence_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Counter Evidence Ids",
          "required": true
        },
        "check_id": {
          "type": "string",
          "title": "Check Id",
          "required": true
        },
        "direction_refs": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "title": "Direction Refs",
          "required": true
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
      "title": "ProposedAnalysisCheck"
    },
    "description": "JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。条目仅引用关键代表原图，不累加全部已看图像。",
    "title": "Checks",
    "required": true
  }
} as const;
