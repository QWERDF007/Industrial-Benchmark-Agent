export declare const explorationEvidenceReportParameters: {
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
        readonly description: "可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。";
        readonly title: "Observations";
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
                readonly limitations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Limitations";
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
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Limitations";
    };
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Unresolved Questions";
    };
    readonly selected_evidence: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly evidence_id: {
                    readonly type: "string";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisEvidenceCandidate";
        };
        readonly title: "Selected Evidence";
        readonly required: true;
    };
};
export declare const knowledgeEvidenceReportParameters: {
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
                readonly check_id: {
                    readonly type: "string";
                    readonly title: "Check Id";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "counter", "allowed_variation", "context", "normal_control", "not_comparable", "uncertain", "not_present"];
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
            readonly title: "KnowledgeAssessment";
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
                readonly subject: {
                    readonly type: "string";
                    readonly title: "Subject";
                    readonly required: true;
                };
                readonly location: {
                    readonly type: "string";
                    readonly title: "Location";
                    readonly required: true;
                };
                readonly criterion: {
                    readonly type: "string";
                    readonly title: "Criterion";
                    readonly required: true;
                };
                readonly allowed_variations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Allowed Variations";
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
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["supported", "provisional", "conflicted"];
                    readonly description: "supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值";
                    readonly title: "Status";
                    readonly required: true;
                };
                readonly support_evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Support Evidence Ids";
                    readonly required: true;
                };
                readonly counter_evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Counter Evidence Ids";
                    readonly required: true;
                };
                readonly candidate_id: {
                    readonly type: "string";
                    readonly title: "Candidate Id";
                    readonly required: true;
                };
                readonly direction_refs: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Direction Refs";
                    readonly required: true;
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "KnowledgeDiscovery";
        };
        readonly title: "Discoveries";
        readonly required: true;
    };
    readonly discovery_summary: {
        readonly type: "string";
        readonly title: "Discovery Summary";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Limitations";
    };
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Unresolved Questions";
    };
    readonly selected_evidence: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly evidence_id: {
                    readonly type: "string";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisEvidenceCandidate";
        };
        readonly title: "Selected Evidence";
        readonly required: true;
    };
};
export declare const explorationDeltaCommitParameters: {
    readonly selections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly key_evidence: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly evidence_id: {
                                readonly type: "string";
                                readonly title: "Evidence Id";
                                readonly required: true;
                            };
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                                readonly title: "Role";
                                readonly required: true;
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "它独有地说明主张的哪项事实；与已有精选重复则不选。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AnalysisKeyEvidence";
                    };
                    readonly title: "Key Evidence";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisSelectionChange";
        };
        readonly description: "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。";
        readonly title: "Selections";
    };
    readonly commit_key: {
        readonly type: "string";
        readonly description: "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly description: "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly summary: {
        readonly type: "string";
        readonly description: "截至本次提交的整个作业摘要，不写轮次或本批新增。";
        readonly title: "Summary";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍有效的实际限制。";
        readonly title: "Limitations";
        readonly required: true;
    };
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍待核对的问题。";
        readonly title: "Unresolved Questions";
        readonly required: true;
    };
    readonly merges: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly target_id: {
                    readonly type: "string";
                    readonly title: "Target Id";
                    readonly required: true;
                };
                readonly source_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Source Ids";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCatalogMerge";
        };
        readonly title: "Merges";
    };
    readonly arguments: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly description: "本场已观察的完整原图ID，不接受裁图或别名。";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                    readonly description: "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。";
                    readonly title: "Role";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。";
                    readonly title: "Reason";
                    readonly required: true;
                };
                readonly state: {
                    readonly type: "string";
                    readonly enum: readonly ["active", "resolved", "out_of_scope"];
                    readonly title: "State";
                    readonly default: "active";
                };
                readonly observation_id: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。";
                    readonly title: "Observation Id";
                };
            };
            readonly title: "AnalysisArgumentEdit";
        };
        readonly description: "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。";
        readonly title: "Arguments";
    };
    readonly citation_corrections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly whole_image_id: {
                    readonly type: "string";
                    readonly title: "Whole Image Id";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCitationCorrection";
        };
        readonly description: "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。";
        readonly title: "Citation Corrections";
    };
    readonly round_id: {
        readonly type: "integer";
        readonly description: "当前上下文给出的轮次，不能自行推进。";
        readonly title: "Round Id";
        readonly required: true;
    };
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
    };
    readonly directions: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly change_reason: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "改变已有主张或适用条件的原因；只改标题或精选图不需要。";
                    readonly title: "Change Reason";
                };
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
                readonly limitations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Limitations";
                    readonly required: true;
                };
                readonly direction_id: {
                    readonly type: "string";
                    readonly title: "Direction Id";
                    readonly required: true;
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisDirectionBody";
        };
        readonly description: "只提交新增或正文变化的完整业务条目；未变传[]。不重复累计图像ID，论据在arguments提交增量，精选在selections独立提交。";
        readonly title: "Directions";
        readonly required: true;
    };
    readonly report_reviews: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly round_id: {
                    readonly type: "integer";
                    readonly title: "Round Id";
                    readonly required: true;
                };
                readonly discovery_decisions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly candidate_id: {
                                readonly type: "string";
                                readonly title: "Candidate Id";
                                readonly required: true;
                            };
                            readonly action: {
                                readonly type: "string";
                                readonly enum: readonly ["new", "merge", "reject"];
                                readonly title: "Action";
                                readonly required: true;
                            };
                            readonly direction_id: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Direction Id";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "ExplorationDiscoveryDecision";
                    };
                    readonly title: "Discovery Decisions";
                    readonly required: true;
                };
            };
            readonly title: "ExplorationReportReview";
        };
        readonly title: "Report Reviews";
    };
};
export declare const knowledgeDeltaCommitParameters: {
    readonly selections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly key_evidence: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly evidence_id: {
                                readonly type: "string";
                                readonly title: "Evidence Id";
                                readonly required: true;
                            };
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                                readonly title: "Role";
                                readonly required: true;
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "它独有地说明主张的哪项事实；与已有精选重复则不选。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AnalysisKeyEvidence";
                    };
                    readonly title: "Key Evidence";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisSelectionChange";
        };
        readonly description: "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。";
        readonly title: "Selections";
    };
    readonly commit_key: {
        readonly type: "string";
        readonly description: "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly description: "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly summary: {
        readonly type: "string";
        readonly description: "截至本次提交的整个作业摘要，不写轮次或本批新增。";
        readonly title: "Summary";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍有效的实际限制。";
        readonly title: "Limitations";
        readonly required: true;
    };
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍待核对的问题。";
        readonly title: "Unresolved Questions";
        readonly required: true;
    };
    readonly merges: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly target_id: {
                    readonly type: "string";
                    readonly title: "Target Id";
                    readonly required: true;
                };
                readonly source_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Source Ids";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCatalogMerge";
        };
        readonly title: "Merges";
    };
    readonly arguments: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly description: "本场已观察的完整原图ID，不接受裁图或别名。";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                    readonly description: "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。";
                    readonly title: "Role";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。";
                    readonly title: "Reason";
                    readonly required: true;
                };
                readonly state: {
                    readonly type: "string";
                    readonly enum: readonly ["active", "resolved", "out_of_scope"];
                    readonly title: "State";
                    readonly default: "active";
                };
                readonly observation_id: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。";
                    readonly title: "Observation Id";
                };
            };
            readonly title: "AnalysisArgumentEdit";
        };
        readonly description: "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。";
        readonly title: "Arguments";
    };
    readonly citation_corrections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly whole_image_id: {
                    readonly type: "string";
                    readonly title: "Whole Image Id";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCitationCorrection";
        };
        readonly description: "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。";
        readonly title: "Citation Corrections";
    };
    readonly round_id: {
        readonly type: "integer";
        readonly description: "当前上下文给出的轮次，不能自行推进。";
        readonly title: "Round Id";
        readonly required: true;
    };
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
        readonly description: "本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。";
        readonly title: "Observations";
        readonly required: true;
    };
    readonly checks: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly change_reason: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "改变已有主张或适用条件的原因；只改标题或精选图不需要。";
                    readonly title: "Change Reason";
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly subject: {
                    readonly type: "string";
                    readonly title: "Subject";
                    readonly required: true;
                };
                readonly location: {
                    readonly type: "string";
                    readonly title: "Location";
                    readonly required: true;
                };
                readonly criterion: {
                    readonly type: "string";
                    readonly title: "Criterion";
                    readonly required: true;
                };
                readonly allowed_variations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Allowed Variations";
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
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["supported", "provisional", "conflicted"];
                    readonly description: "supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值";
                    readonly title: "Status";
                    readonly required: true;
                };
                readonly check_id: {
                    readonly type: "string";
                    readonly title: "Check Id";
                    readonly required: true;
                };
                readonly direction_refs: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "只引用当前selected_directions中的完整ref。";
                    readonly title: "Direction Refs";
                    readonly required: true;
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "仅列当前条目实际有证据的子数据集。";
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCheckBody";
        };
        readonly description: "只提交新增或正文变化的完整业务条目；未变传[]。论据在arguments提交增量，精选在selections独立提交。";
        readonly title: "Checks";
        readonly required: true;
    };
    readonly report_reviews: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly round_id: {
                    readonly type: "integer";
                    readonly title: "Round Id";
                    readonly required: true;
                };
                readonly discovery_decisions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly candidate_id: {
                                readonly type: "string";
                                readonly title: "Candidate Id";
                                readonly required: true;
                            };
                            readonly action: {
                                readonly type: "string";
                                readonly enum: readonly ["new", "merge", "reject"];
                                readonly title: "Action";
                                readonly required: true;
                            };
                            readonly check_id: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Check Id";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "KnowledgeDiscoveryDecision";
                    };
                    readonly title: "Discovery Decisions";
                    readonly required: true;
                };
            };
            readonly title: "KnowledgeReportReview";
        };
        readonly title: "Report Reviews";
    };
};
export declare const explorationDeltaFinalizeParameters: {
    readonly selections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly key_evidence: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly evidence_id: {
                                readonly type: "string";
                                readonly title: "Evidence Id";
                                readonly required: true;
                            };
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                                readonly title: "Role";
                                readonly required: true;
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "它独有地说明主张的哪项事实；与已有精选重复则不选。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AnalysisKeyEvidence";
                    };
                    readonly title: "Key Evidence";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisSelectionChange";
        };
        readonly description: "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。";
        readonly title: "Selections";
    };
    readonly commit_key: {
        readonly type: "string";
        readonly description: "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly description: "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly summary: {
        readonly type: "string";
        readonly description: "截至本次提交的整个作业摘要，不写轮次或本批新增。";
        readonly title: "Summary";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍有效的实际限制。";
        readonly title: "Limitations";
        readonly required: true;
    };
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍待核对的问题。";
        readonly title: "Unresolved Questions";
        readonly required: true;
    };
    readonly merges: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly target_id: {
                    readonly type: "string";
                    readonly title: "Target Id";
                    readonly required: true;
                };
                readonly source_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Source Ids";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCatalogMerge";
        };
        readonly title: "Merges";
    };
    readonly arguments: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly description: "本场已观察的完整原图ID，不接受裁图或别名。";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                    readonly description: "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。";
                    readonly title: "Role";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。";
                    readonly title: "Reason";
                    readonly required: true;
                };
                readonly state: {
                    readonly type: "string";
                    readonly enum: readonly ["active", "resolved", "out_of_scope"];
                    readonly title: "State";
                    readonly default: "active";
                };
                readonly observation_id: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。";
                    readonly title: "Observation Id";
                };
            };
            readonly title: "AnalysisArgumentEdit";
        };
        readonly description: "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。";
        readonly title: "Arguments";
    };
    readonly citation_corrections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly whole_image_id: {
                    readonly type: "string";
                    readonly title: "Whole Image Id";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCitationCorrection";
        };
        readonly description: "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。";
        readonly title: "Citation Corrections";
    };
    readonly complete: {
        readonly type: "boolean";
        readonly description: "全部条目已复核后，最后提交作业全局摘要并设为true。";
        readonly title: "Complete";
        readonly default: false;
    };
    readonly directions: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly change_reason: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "改变已有主张或适用条件的原因；只改标题或精选图不需要。";
                    readonly title: "Change Reason";
                };
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
                readonly limitations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Limitations";
                    readonly required: true;
                };
                readonly direction_id: {
                    readonly type: "string";
                    readonly title: "Direction Id";
                    readonly required: true;
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisDirectionBody";
        };
        readonly title: "Directions";
        readonly required: true;
    };
};
export declare const knowledgeDeltaFinalizeParameters: {
    readonly selections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly key_evidence: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly evidence_id: {
                                readonly type: "string";
                                readonly title: "Evidence Id";
                                readonly required: true;
                            };
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                                readonly title: "Role";
                                readonly required: true;
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly description: "它独有地说明主张的哪项事实；与已有精选重复则不选。";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AnalysisKeyEvidence";
                    };
                    readonly title: "Key Evidence";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisSelectionChange";
        };
        readonly description: "仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。";
        readonly title: "Selections";
    };
    readonly commit_key: {
        readonly type: "string";
        readonly description: "本次提交的幂等键；仅相同内容重传复用，修改内容须更换。";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly description: "观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly summary: {
        readonly type: "string";
        readonly description: "截至本次提交的整个作业摘要，不写轮次或本批新增。";
        readonly title: "Summary";
        readonly required: true;
    };
    readonly limitations: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍有效的实际限制。";
        readonly title: "Limitations";
        readonly required: true;
    };
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "整个作业仍待核对的问题。";
        readonly title: "Unresolved Questions";
        readonly required: true;
    };
    readonly merges: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly target_id: {
                    readonly type: "string";
                    readonly title: "Target Id";
                    readonly required: true;
                };
                readonly source_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Source Ids";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCatalogMerge";
        };
        readonly title: "Merges";
    };
    readonly arguments: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly description: "本场已观察的完整原图ID，不接受裁图或别名。";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
                    readonly description: "support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。";
                    readonly title: "Role";
                    readonly required: true;
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。";
                    readonly title: "Reason";
                    readonly required: true;
                };
                readonly state: {
                    readonly type: "string";
                    readonly enum: readonly ["active", "resolved", "out_of_scope"];
                    readonly title: "State";
                    readonly default: "active";
                };
                readonly observation_id: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。";
                    readonly title: "Observation Id";
                };
            };
            readonly title: "AnalysisArgumentEdit";
        };
        readonly description: "明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。";
        readonly title: "Arguments";
    };
    readonly citation_corrections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly entry_id: {
                    readonly type: "string";
                    readonly title: "Entry Id";
                    readonly required: true;
                };
                readonly evidence_id: {
                    readonly type: "string";
                    readonly title: "Evidence Id";
                    readonly required: true;
                };
                readonly whole_image_id: {
                    readonly type: "string";
                    readonly title: "Whole Image Id";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCitationCorrection";
        };
        readonly description: "按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。";
        readonly title: "Citation Corrections";
    };
    readonly complete: {
        readonly type: "boolean";
        readonly description: "全部条目已复核后，最后提交作业全局摘要并设为true。";
        readonly title: "Complete";
        readonly default: false;
    };
    readonly checks: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly change_reason: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "改变已有主张或适用条件的原因；只改标题或精选图不需要。";
                    readonly title: "Change Reason";
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly subject: {
                    readonly type: "string";
                    readonly title: "Subject";
                    readonly required: true;
                };
                readonly location: {
                    readonly type: "string";
                    readonly title: "Location";
                    readonly required: true;
                };
                readonly criterion: {
                    readonly type: "string";
                    readonly title: "Criterion";
                    readonly required: true;
                };
                readonly allowed_variations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Allowed Variations";
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
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["supported", "provisional", "conflicted"];
                    readonly description: "supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值";
                    readonly title: "Status";
                    readonly required: true;
                };
                readonly check_id: {
                    readonly type: "string";
                    readonly title: "Check Id";
                    readonly required: true;
                };
                readonly direction_refs: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "只引用当前selected_directions中的完整ref。";
                    readonly title: "Direction Refs";
                    readonly required: true;
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "仅列当前条目实际有证据的子数据集。";
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisCheckBody";
        };
        readonly title: "Checks";
        readonly required: true;
    };
    readonly direction_reviews: {
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
                readonly reason: {
                    readonly type: "string";
                    readonly title: "Reason";
                    readonly required: true;
                };
            };
            readonly title: "AnalysisDirectionReview";
        };
        readonly title: "Direction Reviews";
    };
};
export declare const analysisEvidenceReferenceParameters: {
    readonly view: {
        readonly type: "string";
        readonly enum: readonly ["whole", "annotation_rois"];
        readonly title: "View";
        readonly default: "whole";
    };
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
};
export declare const analysisImageViewParameters: {
    readonly view: {
        readonly type: "string";
        readonly enum: readonly ["whole", "annotation_rois"];
        readonly title: "View";
        readonly default: "whole";
    };
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
};
//# sourceMappingURL=analysis-context.parameters.generated.d.ts.map