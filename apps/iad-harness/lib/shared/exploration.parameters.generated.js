/* Generated from Python exploration preset models. */
export const explorationPresetParameters = {
    "name": {
        "type": "string",
        "title": "Name",
        "required": true
    },
    "text": {
        "type": "string",
        "title": "Text",
        "required": true
    }
};
export const explorationBatchReportParameters = {
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
    "key_evidence_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "title": "Key Evidence Ids",
        "required": true
    }
};
