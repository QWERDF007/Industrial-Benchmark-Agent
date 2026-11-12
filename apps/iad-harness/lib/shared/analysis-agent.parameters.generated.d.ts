export declare const explorationAgentStartParameters: {
    readonly submission_id: {
        readonly type: "string";
        readonly title: "Submission Id";
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
    readonly normal_images: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Normal Images";
    };
    readonly defect_images: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Defect Images";
    };
    readonly prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly preset_id: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "Preset Id";
            };
            readonly preset_name: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "Preset Name";
            };
            readonly preset_revision: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "Preset Revision";
            };
            readonly text: {
                readonly type: "string";
                readonly title: "Text";
                readonly required: true;
            };
        };
        readonly title: "FrozenExplorationPrompt";
        readonly required: true;
    };
    readonly system_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "System Prompt";
    };
    readonly observer_prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly system_prompt: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "System Prompt";
                readonly required: true;
            };
            readonly user_prompt: {
                readonly type: "string";
                readonly title: "User Prompt";
                readonly required: true;
            };
        };
        readonly title: "AnalysisRolePrompts";
    };
};
export declare const knowledgeAgentStartParameters: {
    readonly submission_id: {
        readonly type: "string";
        readonly title: "Submission Id";
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
    readonly mining_prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly objective: {
                readonly type: "string";
                readonly title: "Objective";
                readonly required: true;
            };
            readonly directions: {
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
                        readonly enabled: {
                            readonly type: "boolean";
                            readonly title: "Enabled";
                            readonly default: true;
                        };
                        readonly origin: {
                            readonly type: "string";
                            readonly enum: readonly ["preset", "dataset", "explored"];
                            readonly title: "Origin";
                            readonly default: "dataset";
                        };
                        readonly source: {
                            readonly oneOf: readonly [{
                                readonly oneOf: readonly [{
                                    readonly type: "object";
                                    readonly additionalProperties: false;
                                    readonly properties: {
                                        readonly origin: {
                                            readonly type: "string";
                                            readonly enum: readonly ["preset"];
                                            readonly title: "Origin";
                                            readonly default: "preset";
                                        };
                                        readonly catalog_id: {
                                            readonly type: "string";
                                            readonly title: "Catalog Id";
                                            readonly default: "knowledge-directions";
                                        };
                                        readonly direction_id: {
                                            readonly type: "string";
                                            readonly title: "Direction Id";
                                            readonly required: true;
                                        };
                                        readonly revision: {
                                            readonly type: "string";
                                            readonly title: "Revision";
                                            readonly required: true;
                                        };
                                    };
                                    readonly title: "PresetDirectionSource";
                                }, {
                                    readonly type: "object";
                                    readonly additionalProperties: false;
                                    readonly properties: {
                                        readonly origin: {
                                            readonly type: "string";
                                            readonly enum: readonly ["explored"];
                                            readonly title: "Origin";
                                            readonly default: "explored";
                                        };
                                        readonly run_id: {
                                            readonly type: "string";
                                            readonly title: "Run Id";
                                            readonly required: true;
                                        };
                                        readonly version_id: {
                                            readonly type: "string";
                                            readonly title: "Version Id";
                                            readonly required: true;
                                        };
                                        readonly direction_id: {
                                            readonly type: "string";
                                            readonly title: "Direction Id";
                                            readonly required: true;
                                        };
                                    };
                                    readonly title: "ExploredDirectionSource";
                                }];
                            }, {
                                readonly type: "null";
                            }];
                            readonly title: "Source";
                        };
                    };
                    readonly title: "MiningDirection";
                };
                readonly title: "Directions";
                readonly required: true;
            };
            readonly instruction: {
                readonly type: "string";
                readonly title: "Instruction";
                readonly required: true;
            };
            readonly exploration: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly version_id: {
                        readonly type: "string";
                        readonly title: "Version Id";
                        readonly required: true;
                    };
                    readonly summary: {
                        readonly type: "string";
                        readonly title: "Summary";
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
                };
                readonly title: "MiningExploration";
            };
        };
        readonly title: "SubmittedMiningPrompt";
        readonly required: true;
    };
    readonly system_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "System Prompt";
    };
    readonly observer_prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly system_prompt: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
                readonly title: "System Prompt";
                readonly required: true;
            };
            readonly user_prompt: {
                readonly type: "string";
                readonly title: "User Prompt";
                readonly required: true;
            };
        };
        readonly title: "AnalysisRolePrompts";
    };
};
export declare const analysisScopeParameters: {
    readonly dataset_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Dataset Ids";
        readonly required: true;
    };
};
export declare const analysisCatalogParameters: {
    readonly section: {
        readonly type: "string";
        readonly enum: readonly ["directions", "checks"];
        readonly title: "Section";
        readonly required: true;
    };
    readonly ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Ids";
    };
    readonly offset: {
        readonly type: "integer";
        readonly title: "Offset";
        readonly default: 0;
    };
    readonly limit: {
        readonly type: "integer";
        readonly title: "Limit";
        readonly default: 20;
    };
};
export declare const analysisObservationParameters: {
    readonly entry_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Entry Id";
    };
    readonly evidence_role: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Evidence Role";
    };
    readonly sample_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Sample Id";
    };
    readonly direction_ref: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Direction Ref";
    };
    readonly round_id: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Round Id";
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 10;
    };
};
export declare const analysisArgumentParameters: {
    readonly entry_id: {
        readonly type: "string";
        readonly title: "Entry Id";
        readonly required: true;
    };
    readonly revision: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Revision";
    };
    readonly offset: {
        readonly type: "integer";
        readonly title: "Offset";
        readonly default: 0;
    };
    readonly limit: {
        readonly type: "integer";
        readonly title: "Limit";
        readonly default: 20;
    };
    readonly role: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["support", "counter", "context", "allowed_variation"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Role";
    };
    readonly state: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["active", "resolved", "out_of_scope"];
        }, {
            readonly type: "null";
        }];
        readonly title: "State";
    };
    readonly history: {
        readonly type: "boolean";
        readonly title: "History";
        readonly default: false;
    };
};
export declare const analysisClaimParameters: {
    readonly entry_id: {
        readonly type: "string";
        readonly title: "Entry Id";
        readonly required: true;
    };
    readonly revision: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Revision";
    };
    readonly offset: {
        readonly type: "integer";
        readonly title: "Offset";
        readonly default: 0;
    };
    readonly limit: {
        readonly type: "integer";
        readonly title: "Limit";
        readonly default: 20;
    };
};
export declare const analysisMediaParameters: {
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
    readonly offset: {
        readonly type: "integer";
        readonly title: "Offset";
        readonly default: 0;
    };
    readonly limit: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Limit";
    };
};
export declare const explorationImageParameters: {
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
};
export declare const explorationCropParameters: {
    readonly bbox: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly title: "Bbox";
        readonly required: true;
    };
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
};
export declare const analysisCropParameters: {
    readonly bbox: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly title: "Bbox";
        readonly required: true;
    };
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
    readonly offset: {
        readonly type: "integer";
        readonly title: "Offset";
        readonly default: 0;
    };
    readonly limit: {
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Limit";
    };
};
export declare const explorationFinalizeParameters: {
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
                readonly evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Evidence Ids";
                    readonly required: true;
                };
                readonly counter_evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Counter Evidence Ids";
                };
            };
            readonly title: "FinalizedAnalysisDirection";
        };
        readonly description: "JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。支持和反例是完整论据，遗漏不撤销；arguments说明每项作用，key_evidence另选最多4张展示原图。正文图像引用写成[工具返回的完整原图evidence_id]，不缩写，不引用裁图。";
        readonly title: "Directions";
        readonly required: true;
    };
};
export declare const knowledgeFinalizeParameters: {
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
            };
            readonly title: "FinalizedAnalysisCheck";
        };
        readonly description: "只提交新增或修改的完整知识条目；真实原图引用放在结构化证据和论据字段，正文不堆放ID。key_evidence从首批起维护最多4张典型原图，与完整论据分开。";
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
        readonly description: "逐selected_directions.ref说明实际产出或零产出的原因；不能填新生成的知识check_id，最终提交前必须全部核对。";
        readonly title: "Direction Reviews";
    };
};
export declare const explorationCommitParameters: {
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
        readonly description: "仅在需要时补充有明确图像引用的实际事实，不要求逐图填写；技术覆盖由整批媒体送达和正式提交核验。";
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
                readonly key_evidence: {
                    readonly oneOf: readonly [{
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
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。";
                    readonly title: "Key Evidence";
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
                readonly evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Evidence Ids";
                    readonly required: true;
                };
                readonly counter_evidence_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Counter Evidence Ids";
                };
            };
            readonly title: "ProposedAnalysisDirection";
        };
        readonly description: "JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。支持和反例是完整论据，遗漏不撤销；arguments说明每项作用，key_evidence另选最多4张展示原图。正文图像引用写成[工具返回的完整原图evidence_id]，不缩写，不引用裁图。";
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
        readonly description: "主Agent一次复核当前波全部报告，按各报告round.round_id填写。每份报告的discovery_decisions逐项处理全部候选：new新建、merge兼容归并、reject说明实际依据；无候选时填空数组。";
        readonly title: "Report Reviews";
    };
};
export declare const knowledgeBatchReportParameters: {
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
    readonly key_evidence_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Key Evidence Ids";
        readonly required: true;
    };
};
export declare const knowledgeCommitParameters: {
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
                readonly key_evidence: {
                    readonly oneOf: readonly [{
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
                    }, {
                        readonly type: "null";
                    }];
                    readonly description: "当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。";
                    readonly title: "Key Evidence";
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
            };
            readonly title: "ProposedAnalysisCheck";
        };
        readonly description: "只提交新增或修改的完整知识条目；真实原图引用放在结构化证据和论据字段，正文不堆放ID。key_evidence从首批起维护最多4张典型原图，与完整论据分开。";
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
        readonly description: "一次复核当前波全部报告，discovery_decisions逐项处理全部候选，目标使用check_id。";
        readonly title: "Report Reviews";
    };
};
//# sourceMappingURL=analysis-agent.parameters.generated.d.ts.map