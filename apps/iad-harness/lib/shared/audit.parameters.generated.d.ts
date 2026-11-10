export declare const auditEvidenceParameters: {
    readonly run_id: {
        readonly type: "string";
        readonly title: "Run Id";
    };
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
    };
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
    readonly suggestion_id: {
        readonly type: "string";
        readonly title: "Suggestion Id";
    };
};
export declare const auditCommitParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly description: "本次图级终稿的幂等键，仅同内容重传复用。";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly final: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly execution_status: {
                readonly type: "string";
                readonly enum: readonly ["completed", "incomplete", "failed"];
                readonly title: "Execution Status";
                readonly required: true;
            };
            readonly state: {
                readonly oneOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["normal", "suspect"];
                }, {
                    readonly type: "null";
                }];
                readonly title: "State";
                readonly required: true;
            };
            readonly analysis: {
                readonly type: "string";
                readonly title: "Analysis";
                readonly required: true;
            };
            readonly conclusion: {
                readonly type: "string";
                readonly title: "Conclusion";
                readonly required: true;
            };
            readonly basis: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Basis";
                readonly required: true;
            };
            readonly evidence_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。";
                readonly title: "Evidence Ids";
                readonly required: true;
            };
            readonly check_assessments: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly check_id: {
                            readonly type: "string";
                            readonly description: "必须来自本场knowledge.entries[].check.check_id；不是标注ID、上游差异ID或自拟图像检查项。";
                            readonly title: "Check Id";
                            readonly required: true;
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: readonly ["consistent", "deviates", "unobservable", "not_applicable"];
                            readonly title: "Status";
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
                            readonly description: "本次实际观察的完整原图身份；局部图仅用于观察，不单独引用。";
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                    };
                    readonly title: "AuditCheckAssessment";
                };
                readonly description: "仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。";
                readonly title: "Check Assessments";
                readonly required: true;
            };
            readonly consistency_review: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly source_issue_id: {
                            readonly type: "string";
                            readonly title: "Source Issue Id";
                            readonly required: true;
                        };
                        readonly assessment: {
                            readonly type: "string";
                            readonly enum: readonly ["supported", "unsupported", "insufficient"];
                            readonly title: "Assessment";
                            readonly required: true;
                        };
                        readonly reason: {
                            readonly type: "string";
                            readonly title: "Reason";
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
                    };
                    readonly title: "AuditConsistencyAssessment";
                };
                readonly description: "恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。";
                readonly title: "Consistency Review";
                readonly required: true;
            };
            readonly findings: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly finding_id: {
                            readonly type: "string";
                            readonly title: "Finding Id";
                            readonly required: true;
                        };
                        readonly description: {
                            readonly type: "string";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly location: {
                            readonly type: "string";
                            readonly title: "Location";
                            readonly required: true;
                        };
                        readonly check_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。";
                            readonly title: "Check Ids";
                        };
                        readonly evidence_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                        readonly normal_explanation: {
                            readonly type: "string";
                            readonly title: "Normal Explanation";
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
                        readonly type: {
                            readonly type: "string";
                            readonly enum: readonly ["image_label_mismatch", "category_mismatch", "extra_annotation", "missing_annotation", "position_difference", "split", "merge"];
                            readonly title: "Type";
                            readonly required: true;
                        };
                        readonly annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "引用当前主图真实annotation_id；类别、多标、位置和合并至少1个，拆分至少2个，少标或图像级可以为空。";
                            readonly title: "Annotation Ids";
                        };
                        readonly consistency_issue_refs: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "只引用本图上游result.issues中的真实issue_id，独立发现且不采纳上游问题时为空。";
                            readonly title: "Consistency Issue Refs";
                        };
                    };
                    readonly title: "AuditFinding";
                };
                readonly title: "Findings";
                readonly required: true;
            };
            readonly observations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly description: {
                            readonly type: "string";
                            readonly title: "Description";
                            readonly required: true;
                        };
                        readonly annotation_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Annotation Ids";
                        };
                        readonly evidence_ids: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "本次实际观察的完整原图身份，不单独引用局部图。";
                            readonly title: "Evidence Ids";
                            readonly required: true;
                        };
                    };
                    readonly title: "AuditObservation";
                };
                readonly description: "有理解价值但不足以形成质量疑点的简短观察，不计入疑点，也不改变业务结论；不因缺少类别语义或假设规范而填写。";
                readonly title: "Observations";
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
        readonly title: "AuditFinal";
        readonly required: true;
    };
};
export declare const auditRecordParameters: {
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 30;
    };
    readonly sample_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Sample Id";
    };
    readonly issue_type: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Issue Type";
    };
    readonly consistency_assessment: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["supported", "unsupported", "insufficient"];
        }, {
            readonly type: "null";
        }];
        readonly title: "Consistency Assessment";
    };
    readonly knowledge_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Knowledge Id";
    };
    readonly state: {
        readonly oneOf: readonly [{
            readonly type: "string";
            readonly enum: readonly ["normal", "suspect", "incomplete"];
        }, {
            readonly type: "null";
        }];
        readonly title: "State";
    };
};
export declare const auditGroupParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly groups: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly group_id: {
                    readonly type: "string";
                    readonly title: "Group Id";
                    readonly required: true;
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                    readonly required: true;
                };
                readonly description: {
                    readonly type: "string";
                    readonly title: "Description";
                    readonly required: true;
                };
                readonly issue_refs: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly sample_id: {
                                readonly type: "string";
                                readonly title: "Sample Id";
                                readonly required: true;
                            };
                            readonly finding_id: {
                                readonly type: "string";
                                readonly title: "Finding Id";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditIssueReference";
                    };
                    readonly title: "Issue Refs";
                    readonly required: true;
                };
                readonly representatives: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly sample_id: {
                                readonly type: "string";
                                readonly title: "Sample Id";
                                readonly required: true;
                            };
                            readonly finding_id: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                                readonly title: "Finding Id";
                            };
                            readonly role: {
                                readonly type: "string";
                                readonly enum: readonly ["representative", "counter"];
                                readonly description: "representative为典型疑点图；counter为已观察的判断边界对照图，不是人工确认的正常真值。";
                                readonly title: "Role";
                                readonly default: "representative";
                            };
                            readonly reason: {
                                readonly type: "string";
                                readonly title: "Reason";
                                readonly required: true;
                            };
                        };
                        readonly title: "AuditRepresentative";
                    };
                    readonly title: "Representatives";
                    readonly required: true;
                };
                readonly normal_explanations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Normal Explanations";
                };
                readonly limitations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Limitations";
                };
            };
            readonly title: "AuditIssueGroup";
        };
        readonly title: "Groups";
    };
    readonly remove_group_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Remove Group Ids";
    };
};
export declare const auditReportParameters: {
    readonly commit_key: {
        readonly type: "string";
        readonly title: "Commit Key";
        readonly required: true;
    };
    readonly scope_analysis: {
        readonly type: "string";
        readonly title: "Scope Analysis";
        readonly required: true;
    };
    readonly issue_analysis: {
        readonly type: "string";
        readonly title: "Issue Analysis";
        readonly required: true;
    };
    readonly consistency_analysis: {
        readonly type: "string";
        readonly title: "Consistency Analysis";
        readonly required: true;
    };
    readonly knowledge_analysis: {
        readonly type: "string";
        readonly title: "Knowledge Analysis";
        readonly required: true;
    };
    readonly boundary_analysis: {
        readonly type: "string";
        readonly description: "解释相似现象在已保存图级记录中的判断边界；不重判终稿，不假设类别语义、实例规范或采集工艺。没有实际对照时不编造。";
        readonly title: "Boundary Analysis";
        readonly default: "";
    };
    readonly conclusion: {
        readonly type: "string";
        readonly title: "Conclusion";
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
export declare const auditReportEvidenceParameters: {
    readonly sample_id: {
        readonly type: "string";
        readonly title: "Sample Id";
        readonly required: true;
    };
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
};
export declare const auditCropParameters: {
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
export declare const auditStartParameters: {
    readonly submission_id: {
        readonly type: "string";
        readonly title: "Submission Id";
        readonly required: true;
    };
    readonly subset_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Subset Ids";
        readonly required: true;
    };
    readonly consistency_job_id: {
        readonly type: "string";
        readonly title: "Consistency Job Id";
        readonly required: true;
    };
    readonly knowledge: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly job_id: {
                readonly type: "string";
                readonly title: "Job Id";
                readonly required: true;
            };
            readonly version_id: {
                readonly type: "string";
                readonly title: "Version Id";
                readonly required: true;
            };
            readonly entry_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Entry Ids";
                readonly required: true;
            };
        };
        readonly title: "AuditKnowledgeSelection";
    };
    readonly instruction: {
        readonly type: "string";
        readonly title: "Instruction";
        readonly default: "审核当前主图的标注质量。实际观察本次提供的完整原图、原始标注和全部必要局部，逐项核对本图数据一致性结果。\n\n对于上游存在的每项差异，分别判断“支持为疑点、不支持、证据不足”并说明当前主图的实际依据；若上游没有差异，则直接继续本图独立审核，不虚构差异。知识可以为空；如已选用知识，先确认适用性，再结合本图实际证据使用。\n\n重点检查当前可见内容与现有标注之间的遗漏嫌疑、额外标注、覆盖异常和实例组织等质量关系。不验证人工类别语义或真值，不假设有未提供的规范。只有具有可核查依据时才保存质量疑点；普通视觉变化不得自动认定为少标，必要时可保留简短待判别观察。\n\n保存图级结论、全部独立疑点、真实图像证据、上游及知识关联、必要的正常替代解释与实际限制。自然语言不要罗列内部 ID、文件路径或执行信息，不修改原始标注。";
    };
    readonly system_prompt: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "System Prompt";
    };
    readonly report_instruction: {
        readonly type: "string";
        readonly title: "Report Instruction";
        readonly default: "根据本次作业全部已保存的图级审计终稿、冻结的数据一致性结果、实际选用的知识以及程序提供的准确统计，形成面向使用者的数据集质量审计报告。\n\n说明审计范围、完成情况、图级结论分布，区分疑点图像数、独立质量疑点次数与未完成图像；如记录待判别观察，则单独统计，不并入质量疑点。逐项统计口径以程序计算为准，不估算未提供的数量。\n\n归并主要质量问题主题，说明各主题涉及的不同图像数量、问题次数、具体视觉与原始标注关系及必要限制；对相似现象但审核结论不同的情况，分析当前记录体现的判断边界，不修改图级终稿。\n\n交叉分析上游数据一致性结果与图级审计结论，说明知识条目的实际作用；未选知识时不虚构知识贡献。每类主要主题只选择少量关键图像证据，必要时提供判断边界的对照图，保留真实结构化引用并由界面关联完整原图及原始标注。\n\n报告正文仅呈现用户关心的质量发现、统计、关键证据、整体结论和人工复核重点。不得输出作业、数据集、图像、标注、媒体或问题的内部 ID、完整文件名、工具参数、数据库字段、分页或执行日志。这些仅存于结构化关联字段。\n\n模型疑点率不等于人工确认错误率。不得验证人工类别真实语义，不推断不存在的标注规范，不修改标注，不生成建议类别、建议框或 Gold 结论。不凭历史对话猜数字，不重判或覆盖已保存图级结果。\n\n典型证据与判断边界对照仅引用完整原图，局部裁剪图不作为报告证据。";
    };
};
//# sourceMappingURL=audit.parameters.generated.d.ts.map