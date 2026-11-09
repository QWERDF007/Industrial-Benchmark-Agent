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
                readonly oneOf: readonly [{
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
                }, {
                    readonly type: "null";
                }];
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
export declare const analysisCropParameters: {
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
    readonly bbox: {
        readonly type: "array";
        readonly items: {
            readonly type: "integer";
        };
        readonly title: "Bbox";
        readonly required: true;
    };
};
export declare const explorationCommitParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly round_id: {
        readonly type: "integer";
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
                    readonly title: "Description";
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
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
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
            };
            readonly title: "AnalysisCatalogMerge";
        };
        readonly title: "Merges";
    };
    readonly directions: {
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
        readonly description: "JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。条目仅引用关键代表原图，不累加全部已看图像。";
        readonly title: "Directions";
        readonly required: true;
    };
};
export declare const knowledgeCommitParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly base_revision: {
        readonly type: "integer";
        readonly title: "Base Revision";
        readonly required: true;
    };
    readonly round_id: {
        readonly type: "integer";
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
                    readonly title: "Description";
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
    readonly unresolved_questions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
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
            };
            readonly title: "AnalysisCatalogMerge";
        };
        readonly title: "Merges";
    };
    readonly checks: {
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
                    readonly description: "supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值";
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
            readonly title: "ProposedAnalysisCheck";
        };
        readonly description: "JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。条目仅引用关键代表原图，不累加全部已看图像。";
        readonly title: "Checks";
        readonly required: true;
    };
};
//# sourceMappingURL=analysis-agent.parameters.generated.d.ts.map