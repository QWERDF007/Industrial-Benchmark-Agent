export declare const explorationPresetParameters: {
    readonly name: {
        readonly type: "string";
        readonly title: "Name";
        readonly required: true;
    };
    readonly text: {
        readonly type: "string";
        readonly title: "Text";
        readonly required: true;
    };
};
export declare const explorationBatchReportParameters: {
    readonly observations: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly dataset_id: {
                    readonly type: "string";
                    readonly title: "Dataset Id";
                    readonly required: true;
                };
                readonly sample_id: {
                    readonly type: "string";
                    readonly title: "Sample Id";
                    readonly required: true;
                };
                readonly description: {
                    readonly type: "string";
                    readonly description: "仅描述这张图实际观察的事实；局部定位使用原图坐标。";
                    readonly title: "Description";
                    readonly required: true;
                };
                readonly evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。";
                    readonly title: "Evidence Ids";
                    readonly required: true;
                };
                readonly directions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly direction_ref: {
                                readonly type: "string";
                                readonly title: "Direction Ref";
                                readonly required: true;
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["applicable", "not_applicable", "uncertain"];
                                readonly description: "逐图按所选方向要求判断：applicable表示所需结构和核对范围可见，足以回答该方向问题，未见所查现象也适用；not_applicable表示目标结构不存在或不属于该方向；uncertain表示遮挡、失焦或画面缺失使要求范围不能充分核对。只看清一部分不能把整个范围记为applicable，也不能将未看清当成允许变化或完整支持；可见部分事实可保留为context，不能静默缩小方向要求。";
                                readonly title: "Status";
                                readonly required: true;
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AnalysisDirectionObservation";
                    };
                    readonly title: "Directions";
                };
                readonly limitations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Limitations";
                };
                readonly report_preparation_error: {
                    readonly type: "boolean";
                    readonly description: "仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。";
                    readonly title: "Report Preparation Error";
                    readonly default: false;
                };
            };
            readonly title: "AnalysisSampleObservation";
        };
        readonly title: "Observations";
        readonly required: true;
    };
    readonly assessments: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly direction_id: {
                    readonly type: "string";
                    readonly title: "Direction Id";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "normal_control", "counter", "not_comparable", "uncertain", "not_present"];
                    readonly title: "Role";
                    readonly required: true;
                };
                readonly evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Evidence Ids";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "ExplorationAssessment";
        };
        readonly title: "Assessments";
        readonly required: true;
    };
    readonly discoveries: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly instruction: {
                    readonly type: "string";
                    readonly title: "Instruction";
                    readonly required: true;
                };
                readonly applies_to: {
                    readonly type: "string";
                    readonly enum: readonly ["normal", "defect", "both"];
                    readonly title: "Applies To";
                    readonly required: true;
                };
                readonly rationale: {
                    readonly type: "string";
                    readonly title: "Rationale";
                    readonly required: true;
                };
                readonly evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Evidence Ids";
                    readonly required: true;
                };
                readonly limitations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Limitations";
                    readonly required: true;
                };
                readonly candidate_id: {
                    readonly type: "string";
                    readonly title: "Candidate Id";
                    readonly required: true;
                };
            };
            readonly title: "ExplorationDiscovery";
        };
        readonly title: "Discoveries";
        readonly required: true;
    };
    readonly discovery_summary: {
        readonly type: "string";
        readonly title: "Discovery Summary";
        readonly required: true;
    };
    readonly key_evidence_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Key Evidence Ids";
        readonly required: true;
    };
};
//# sourceMappingURL=exploration.parameters.generated.d.ts.map