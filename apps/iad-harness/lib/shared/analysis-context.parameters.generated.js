/* Generated from Python analysis context models. */
export const explorationEvidenceReportParameters = {
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
                    "description": "仅描述这张图实际观察的事实；局部定位使用原图坐标。",
                    "title": "Description",
                    "required": true
                },
                "evidence_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。",
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
                                "description": "逐图按所选方向要求判断：applicable表示所需结构和核对范围可见，足以回答该方向问题，未见所查现象也适用；not_applicable表示目标结构不存在或不属于该方向；uncertain表示遮挡、失焦或画面缺失使要求范围不能充分核对。只看清一部分不能把整个范围记为applicable，也不能将未看清当成允许变化或完整支持；可见部分事实可保留为context，不能静默缩小方向要求。",
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
                    "description": "仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。",
                    "title": "Report Preparation Error",
                    "default": false
                }
            },
            "title": "AnalysisSampleObservation"
        },
        "description": "可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。",
        "title": "Observations"
    },
    "assessments": {
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
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "normal_control",
                        "counter",
                        "not_comparable",
                        "uncertain",
                        "not_present"
                    ],
                    "title": "Role",
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
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "ExplorationAssessment"
        },
        "title": "Assessments",
        "required": true
    },
    "discoveries": {
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
                "limitations": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "title": "Limitations",
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
                "candidate_id": {
                    "type": "string",
                    "title": "Candidate Id",
                    "required": true
                }
            },
            "title": "ExplorationDiscovery"
        },
        "title": "Discoveries",
        "required": true
    },
    "discovery_summary": {
        "type": "string",
        "title": "Discovery Summary",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Limitations"
    },
    "unresolved_questions": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Unresolved Questions"
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
        "title": "Selected Evidence",
        "required": true
    }
};
export const knowledgeEvidenceReportParameters = {
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
                    "description": "仅描述这张图实际观察的事实；局部定位使用原图坐标。",
                    "title": "Description",
                    "required": true
                },
                "evidence_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。",
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
                                "description": "逐图按所选方向要求判断：applicable表示所需结构和核对范围可见，足以回答该方向问题，未见所查现象也适用；not_applicable表示目标结构不存在或不属于该方向；uncertain表示遮挡、失焦或画面缺失使要求范围不能充分核对。只看清一部分不能把整个范围记为applicable，也不能将未看清当成允许变化或完整支持；可见部分事实可保留为context，不能静默缩小方向要求。",
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
                    "description": "仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。",
                    "title": "Report Preparation Error",
                    "default": false
                }
            },
            "title": "AnalysisSampleObservation"
        },
        "title": "Observations",
        "required": true
    },
    "assessments": {
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
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "counter",
                        "allowed_variation",
                        "context",
                        "normal_control",
                        "not_comparable",
                        "uncertain",
                        "not_present"
                    ],
                    "title": "Role",
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
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "KnowledgeAssessment"
        },
        "title": "Assessments",
        "required": true
    },
    "discoveries": {
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
                    "description": "supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值",
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
                "candidate_id": {
                    "type": "string",
                    "title": "Candidate Id",
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
            "title": "KnowledgeDiscovery"
        },
        "title": "Discoveries",
        "required": true
    },
    "discovery_summary": {
        "type": "string",
        "title": "Discovery Summary",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Limitations"
    },
    "unresolved_questions": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Unresolved Questions"
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
        "title": "Selected Evidence",
        "required": true
    }
};
export const explorationDeltaCommitParameters = {
    "selections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "key_evidence": {
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
                            "role": {
                                "type": "string",
                                "enum": [
                                    "support",
                                    "counter",
                                    "context",
                                    "allowed_variation"
                                ],
                                "title": "Role",
                                "required": true
                            },
                            "reason": {
                                "type": "string",
                                "description": "它独有地说明主张的哪项事实；与已有精选重复则不选。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AnalysisKeyEvidence"
                    },
                    "title": "Key Evidence",
                    "required": true
                }
            },
            "title": "AnalysisSelectionChange"
        },
        "description": "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。",
        "title": "Selections"
    },
    "commit_key": {
        "type": "string",
        "description": "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。",
        "title": "Commit Key",
        "required": true
    },
    "base_revision": {
        "type": "integer",
        "description": "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。",
        "title": "Base Revision",
        "required": true
    },
    "summary": {
        "type": "string",
        "description": "截至本次提交的整个作业摘要，不写轮次或本批新增。",
        "title": "Summary",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍有效的实际限制。",
        "title": "Limitations",
        "required": true
    },
    "unresolved_questions": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍待核对的问题。",
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
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AnalysisCatalogMerge"
        },
        "title": "Merges"
    },
    "arguments": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "description": "本场已观察的完整原图ID，不接受裁图或别名。",
                    "title": "Evidence Id",
                    "required": true
                },
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "counter",
                        "context",
                        "allowed_variation"
                    ],
                    "description": "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。",
                    "title": "Role",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "description": "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。",
                    "title": "Reason",
                    "required": true
                },
                "state": {
                    "type": "string",
                    "enum": [
                        "active",
                        "resolved",
                        "out_of_scope"
                    ],
                    "title": "State",
                    "default": "active"
                },
                "observation_id": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。",
                    "title": "Observation Id"
                }
            },
            "title": "AnalysisArgumentEdit"
        },
        "description": "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。",
        "title": "Arguments"
    },
    "citation_corrections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "title": "Evidence Id",
                    "required": true
                },
                "whole_image_id": {
                    "type": "string",
                    "title": "Whole Image Id",
                    "required": true
                }
            },
            "title": "AnalysisCitationCorrection"
        },
        "description": "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。",
        "title": "Citation Corrections"
    },
    "round_id": {
        "type": "integer",
        "description": "当前上下文给出的轮次，不能自行推进。",
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
                    "description": "仅描述这张图实际观察的事实；局部定位使用原图坐标。",
                    "title": "Description",
                    "required": true
                },
                "evidence_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。",
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
                                "description": "逐图按所选方向要求判断：applicable表示所需结构和核对范围可见，足以回答该方向问题，未见所查现象也适用；not_applicable表示目标结构不存在或不属于该方向；uncertain表示遮挡、失焦或画面缺失使要求范围不能充分核对。只看清一部分不能把整个范围记为applicable，也不能将未看清当成允许变化或完整支持；可见部分事实可保留为context，不能静默缩小方向要求。",
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
                    "description": "仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。",
                    "title": "Report Preparation Error",
                    "default": false
                }
            },
            "title": "AnalysisSampleObservation"
        },
        "title": "Observations"
    },
    "directions": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "change_reason": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "改变已有主张或适用条件的原因；只改标题或精选图不需要。",
                    "title": "Change Reason"
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
                }
            },
            "title": "AnalysisDirectionBody"
        },
        "description": "只提交新增或正文变化的完整业务条目；未变传[]。不重复累计图像ID，论据在arguments提交增量，精选在selections独立提交。",
        "title": "Directions",
        "required": true
    },
    "report_reviews": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "round_id": {
                    "type": "integer",
                    "title": "Round Id",
                    "required": true
                },
                "discovery_decisions": {
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
                            "action": {
                                "type": "string",
                                "enum": [
                                    "new",
                                    "merge",
                                    "reject"
                                ],
                                "title": "Action",
                                "required": true
                            },
                            "direction_id": {
                                "oneOf": [
                                    {
                                        "type": "string"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Direction Id"
                            },
                            "reason": {
                                "type": "string",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "ExplorationDiscoveryDecision"
                    },
                    "title": "Discovery Decisions",
                    "required": true
                }
            },
            "title": "ExplorationReportReview"
        },
        "title": "Report Reviews"
    }
};
export const knowledgeDeltaCommitParameters = {
    "selections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "key_evidence": {
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
                            "role": {
                                "type": "string",
                                "enum": [
                                    "support",
                                    "counter",
                                    "context",
                                    "allowed_variation"
                                ],
                                "title": "Role",
                                "required": true
                            },
                            "reason": {
                                "type": "string",
                                "description": "它独有地说明主张的哪项事实；与已有精选重复则不选。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AnalysisKeyEvidence"
                    },
                    "title": "Key Evidence",
                    "required": true
                }
            },
            "title": "AnalysisSelectionChange"
        },
        "description": "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。",
        "title": "Selections"
    },
    "commit_key": {
        "type": "string",
        "description": "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。",
        "title": "Commit Key",
        "required": true
    },
    "base_revision": {
        "type": "integer",
        "description": "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。",
        "title": "Base Revision",
        "required": true
    },
    "summary": {
        "type": "string",
        "description": "截至本次提交的整个作业摘要，不写轮次或本批新增。",
        "title": "Summary",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍有效的实际限制。",
        "title": "Limitations",
        "required": true
    },
    "unresolved_questions": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍待核对的问题。",
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
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AnalysisCatalogMerge"
        },
        "title": "Merges"
    },
    "arguments": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "description": "本场已观察的完整原图ID，不接受裁图或别名。",
                    "title": "Evidence Id",
                    "required": true
                },
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "counter",
                        "context",
                        "allowed_variation"
                    ],
                    "description": "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。",
                    "title": "Role",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "description": "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。",
                    "title": "Reason",
                    "required": true
                },
                "state": {
                    "type": "string",
                    "enum": [
                        "active",
                        "resolved",
                        "out_of_scope"
                    ],
                    "title": "State",
                    "default": "active"
                },
                "observation_id": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。",
                    "title": "Observation Id"
                }
            },
            "title": "AnalysisArgumentEdit"
        },
        "description": "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。",
        "title": "Arguments"
    },
    "citation_corrections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "title": "Evidence Id",
                    "required": true
                },
                "whole_image_id": {
                    "type": "string",
                    "title": "Whole Image Id",
                    "required": true
                }
            },
            "title": "AnalysisCitationCorrection"
        },
        "description": "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。",
        "title": "Citation Corrections"
    },
    "round_id": {
        "type": "integer",
        "description": "当前上下文给出的轮次，不能自行推进。",
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
                    "description": "仅描述这张图实际观察的事实；局部定位使用原图坐标。",
                    "title": "Description",
                    "required": true
                },
                "evidence_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。",
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
                                "description": "逐图按所选方向要求判断：applicable表示所需结构和核对范围可见，足以回答该方向问题，未见所查现象也适用；not_applicable表示目标结构不存在或不属于该方向；uncertain表示遮挡、失焦或画面缺失使要求范围不能充分核对。只看清一部分不能把整个范围记为applicable，也不能将未看清当成允许变化或完整支持；可见部分事实可保留为context，不能静默缩小方向要求。",
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
                    "description": "仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。",
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
    "checks": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "change_reason": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "改变已有主张或适用条件的原因；只改标题或精选图不需要。",
                    "title": "Change Reason"
                },
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
                    "description": "supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值",
                    "title": "Status",
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
                    "description": "只引用当前selected_directions中的完整ref。",
                    "title": "Direction Refs",
                    "required": true
                },
                "dataset_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "仅列当前条目实际有证据的子数据集。",
                    "title": "Dataset Ids",
                    "required": true
                }
            },
            "title": "AnalysisCheckBody"
        },
        "description": "只提交新增或正文变化的完整业务条目；未变传[]。论据在arguments提交增量，精选在selections独立提交。",
        "title": "Checks",
        "required": true
    },
    "report_reviews": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "round_id": {
                    "type": "integer",
                    "title": "Round Id",
                    "required": true
                },
                "discovery_decisions": {
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
                            "action": {
                                "type": "string",
                                "enum": [
                                    "new",
                                    "merge",
                                    "reject"
                                ],
                                "title": "Action",
                                "required": true
                            },
                            "check_id": {
                                "oneOf": [
                                    {
                                        "type": "string"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "title": "Check Id"
                            },
                            "reason": {
                                "type": "string",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "KnowledgeDiscoveryDecision"
                    },
                    "title": "Discovery Decisions",
                    "required": true
                }
            },
            "title": "KnowledgeReportReview"
        },
        "title": "Report Reviews"
    }
};
export const explorationDeltaFinalizeParameters = {
    "selections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "key_evidence": {
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
                            "role": {
                                "type": "string",
                                "enum": [
                                    "support",
                                    "counter",
                                    "context",
                                    "allowed_variation"
                                ],
                                "title": "Role",
                                "required": true
                            },
                            "reason": {
                                "type": "string",
                                "description": "它独有地说明主张的哪项事实；与已有精选重复则不选。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AnalysisKeyEvidence"
                    },
                    "title": "Key Evidence",
                    "required": true
                }
            },
            "title": "AnalysisSelectionChange"
        },
        "description": "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。",
        "title": "Selections"
    },
    "commit_key": {
        "type": "string",
        "description": "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。",
        "title": "Commit Key",
        "required": true
    },
    "base_revision": {
        "type": "integer",
        "description": "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。",
        "title": "Base Revision",
        "required": true
    },
    "summary": {
        "type": "string",
        "description": "截至本次提交的整个作业摘要，不写轮次或本批新增。",
        "title": "Summary",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍有效的实际限制。",
        "title": "Limitations",
        "required": true
    },
    "unresolved_questions": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍待核对的问题。",
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
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AnalysisCatalogMerge"
        },
        "title": "Merges"
    },
    "arguments": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "description": "本场已观察的完整原图ID，不接受裁图或别名。",
                    "title": "Evidence Id",
                    "required": true
                },
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "counter",
                        "context",
                        "allowed_variation"
                    ],
                    "description": "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。",
                    "title": "Role",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "description": "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。",
                    "title": "Reason",
                    "required": true
                },
                "state": {
                    "type": "string",
                    "enum": [
                        "active",
                        "resolved",
                        "out_of_scope"
                    ],
                    "title": "State",
                    "default": "active"
                },
                "observation_id": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。",
                    "title": "Observation Id"
                }
            },
            "title": "AnalysisArgumentEdit"
        },
        "description": "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。",
        "title": "Arguments"
    },
    "citation_corrections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "title": "Evidence Id",
                    "required": true
                },
                "whole_image_id": {
                    "type": "string",
                    "title": "Whole Image Id",
                    "required": true
                }
            },
            "title": "AnalysisCitationCorrection"
        },
        "description": "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。",
        "title": "Citation Corrections"
    },
    "complete": {
        "type": "boolean",
        "description": "全部条目已复核后，最后提交作业全局摘要并设为true。",
        "title": "Complete",
        "default": false
    },
    "directions": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "change_reason": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "改变已有主张或适用条件的原因；只改标题或精选图不需要。",
                    "title": "Change Reason"
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
                }
            },
            "title": "AnalysisDirectionBody"
        },
        "title": "Directions",
        "required": true
    }
};
export const knowledgeDeltaFinalizeParameters = {
    "selections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "key_evidence": {
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
                            "role": {
                                "type": "string",
                                "enum": [
                                    "support",
                                    "counter",
                                    "context",
                                    "allowed_variation"
                                ],
                                "title": "Role",
                                "required": true
                            },
                            "reason": {
                                "type": "string",
                                "description": "它独有地说明主张的哪项事实；与已有精选重复则不选。",
                                "title": "Reason",
                                "required": true
                            }
                        },
                        "title": "AnalysisKeyEvidence"
                    },
                    "title": "Key Evidence",
                    "required": true
                }
            },
            "title": "AnalysisSelectionChange"
        },
        "description": "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。",
        "title": "Selections"
    },
    "commit_key": {
        "type": "string",
        "description": "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。",
        "title": "Commit Key",
        "required": true
    },
    "base_revision": {
        "type": "integer",
        "description": "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。",
        "title": "Base Revision",
        "required": true
    },
    "summary": {
        "type": "string",
        "description": "截至本次提交的整个作业摘要，不写轮次或本批新增。",
        "title": "Summary",
        "required": true
    },
    "limitations": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍有效的实际限制。",
        "title": "Limitations",
        "required": true
    },
    "unresolved_questions": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "整个作业仍待核对的问题。",
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
                },
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AnalysisCatalogMerge"
        },
        "title": "Merges"
    },
    "arguments": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "description": "本场已观察的完整原图ID，不接受裁图或别名。",
                    "title": "Evidence Id",
                    "required": true
                },
                "role": {
                    "type": "string",
                    "enum": [
                        "support",
                        "counter",
                        "context",
                        "allowed_variation"
                    ],
                    "description": "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。",
                    "title": "Role",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "description": "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。",
                    "title": "Reason",
                    "required": true
                },
                "state": {
                    "type": "string",
                    "enum": [
                        "active",
                        "resolved",
                        "out_of_scope"
                    ],
                    "title": "State",
                    "default": "active"
                },
                "observation_id": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。",
                    "title": "Observation Id"
                }
            },
            "title": "AnalysisArgumentEdit"
        },
        "description": "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。",
        "title": "Arguments"
    },
    "citation_corrections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "entry_id": {
                    "type": "string",
                    "title": "Entry Id",
                    "required": true
                },
                "evidence_id": {
                    "type": "string",
                    "title": "Evidence Id",
                    "required": true
                },
                "whole_image_id": {
                    "type": "string",
                    "title": "Whole Image Id",
                    "required": true
                }
            },
            "title": "AnalysisCitationCorrection"
        },
        "description": "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。",
        "title": "Citation Corrections"
    },
    "complete": {
        "type": "boolean",
        "description": "全部条目已复核后，最后提交作业全局摘要并设为true。",
        "title": "Complete",
        "default": false
    },
    "checks": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "change_reason": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "null"
                        }
                    ],
                    "description": "改变已有主张或适用条件的原因；只改标题或精选图不需要。",
                    "title": "Change Reason"
                },
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
                    "description": "supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值",
                    "title": "Status",
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
                    "description": "只引用当前selected_directions中的完整ref。",
                    "title": "Direction Refs",
                    "required": true
                },
                "dataset_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "仅列当前条目实际有证据的子数据集。",
                    "title": "Dataset Ids",
                    "required": true
                }
            },
            "title": "AnalysisCheckBody"
        },
        "title": "Checks",
        "required": true
    },
    "direction_reviews": {
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
                "reason": {
                    "type": "string",
                    "title": "Reason",
                    "required": true
                }
            },
            "title": "AnalysisDirectionReview"
        },
        "title": "Direction Reviews"
    }
};
export const analysisEvidenceReferenceParameters = {
    "view": {
        "type": "string",
        "enum": [
            "whole",
            "annotation_rois"
        ],
        "title": "View",
        "default": "whole"
    },
    "evidence_id": {
        "type": "string",
        "title": "Evidence Id",
        "required": true
    }
};
export const analysisImageViewParameters = {
    "view": {
        "type": "string",
        "enum": [
            "whole",
            "annotation_rois"
        ],
        "title": "View",
        "default": "whole"
    },
    "sample_id": {
        "type": "string",
        "title": "Sample Id",
        "required": true
    }
};
