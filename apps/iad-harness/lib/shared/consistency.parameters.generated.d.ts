export declare const conflictCategoryDefaults: {
    readonly labelme: readonly ["类别不一致", "位置差异", "多类别", "少类别", "拆分", "合并"];
    readonly folder_classification: readonly ["类别不一致"];
};
export declare const conflictCategories: readonly ["类别不一致", "位置差异", "多类别", "少类别", "拆分", "合并", "对应关系差异"];
export declare const modelAssessmentLabels: {
    readonly NOT_ANALYZED: "未分析";
    readonly RUNNING: "分析中";
    readonly FAILED: "分析失败";
    readonly EQUIVALENT: "未发现实质标注差异";
    readonly MATERIAL: "存在实质差异";
    readonly UNCERTAIN: "证据不足";
};
export declare const consistencyRouteEnums: {
    readonly pageId: readonly ["industrial-consistency"];
    readonly tab: readonly ["conflicts", "search", "groups", "jobs"];
    readonly facts: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
    readonly galleryOrder: readonly ["recent", "members"];
    readonly differenceFilter: readonly ["all", "category", "geometry", "presence", "instances", "multiple"];
    readonly modelFilter: readonly ["all", "NOT_ANALYZED", "RUNNING", "FAILED", "EQUIVALENT", "MATERIAL", "UNCERTAIN"];
    readonly detailTab: readonly ["summary", "evidence", "review"];
    readonly reviewFilter: readonly ["OPEN", "NEEDS_CONTEXT", "RESOLVED"];
};
export declare const groupAnalysisStartParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly kind: {
        readonly type: "string";
        readonly enum: readonly ["conflicts", "groups"];
        readonly title: "Kind";
        readonly required: true;
    };
    readonly group_id: {
        readonly type: "string";
        readonly title: "Group Id";
        readonly required: true;
    };
    readonly facts_state: {
        readonly type: "string";
        readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
        readonly title: "Facts State";
        readonly default: "CURRENT";
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
    readonly batch_size: {
        readonly type: "integer";
        readonly title: "Batch Size";
        readonly default: 12;
    };
    readonly instruction: {
        readonly type: "string";
        readonly title: "Instruction";
        readonly default: "根据本次运行上下文执行图组分析或批次汇总。结论与描述概括差异，不写具体文件名或图像ID；具体证据使用结构化引用字段。\n\n图组分析：\n分析整个冻结图组；每条结论引用真实candidate_id。引用比较证据时填写comparison对象，其中result_id和evidence_id必须完整复制上下文中的配对引用，difference_id可选；无直接比较依据时comparison为null。像素/几何事实、模型视觉解释、标注规范和人工质量裁决必须区分；相似度不能证明缺陷，不能写Gold或人工裁决。标注匹配工具输出是待核对的候选解释，不是漏标结论。必须联合查看完整原图、原始标注数据和无叠加的局部原始像素裁剪，逐项核对单侧标注是否其实对应另一侧位置微移、范围变化或拆分合并的标注；不得照抄工具分类作为视觉结论。本任务检查标注一致性，不裁决哪一侧标注正确。对已确认同像素的图像，对应标注的原始类别值不同就是标注类别不同，例如15变为18，或图像级OK与NG不同，均属于MATERIAL类别差异；不需要先确认类别语义或等价性。不得预设类别映射或语义相近，不得用缺少映射、类别定义未知或两图像素相同将已确认的类别差异降为EQUIVALENT或UNCERTAIN。同像素图中若独立查看原图和局部后发现两类所指对象视觉相近，视觉相近可以写入详细分析，但不能否定类别差异。对于非同像素的相似图，先联合观察原图、局部及标注，判断对象、缺陷和标注规则是否可比。相似度高不等于同一实物或同一缺陷，不能仅因OK/NG不同、原始类别值不同、标注数量不同或框位置不同就判MATERIAL。应区分真实产品外观差异带来的合理标签变化与同类可见现象被不一致标注：图像差异能解释标签变化且未发现实质标注规则差异时可判EQUIVALENT，说明真实差别；有具体视觉对应依据支持标注冲突时才判MATERIAL，说明对应对象、可见现象和冲突；无法建立可靠视觉对应或缺陷依据不足时判UNCERTAIN，写明实际缺失的依据。程序像素不兼容、几何未匹配只表示工具未建立对应，不能仅因没有精确配准就拒绝视觉核对；同样不能凭模型猜测几何变换、工业公差或缺陷真值。不限于工具已报出的差异，也不限于现有分类：独立检查完整原图与标注，主动发现漏检差异、标错对象、无关背景、忽略区域、边界约定及其他有图像依据的问题。细微坐标变化不能直接等同标注错误；核对标注是否对应、偏移或范围变化是否构成实际差异，未知公差不得自行编造。representation=raw的附件是完整原图或原始裁剪，没有绘制标注框、文字或颜色。标注坐标在JSON中；annotation_mask附件只表达人工mask标注的二值定位形状，不是真实产品像素，不能把掩膜黑白或标注颜色当产品特征。对完整图组联合分析后，overall.text只写一句简短的差异结论，仅概括差异类型，不写位置、数值、依据或建议。不要重复verdict，不加“整体结论为”等引导语，不写分析过程或理由。例如“标注类别不同”“标注位置偏移”“缺少标注”“多出标注”“标注拆分”“标注合并”“未发现标注差异”；多种差异用短语合并，其他实际发现据实概括，不局限于这些示例。详细依据、位置、数值、解释和限制写入conclusions与limitations。逐候选conclusion和overall.text必须由你根据图像与标注给出确定性的简短自然语言结论，只说明具体差异类型或明确无差异，不在最终结论中展开分析。保留类别、位置、数量、增加、减少、拆分、合并等所有实际差异，不限于这些类型，也不能压缩为一致/不一致标签。不得使用“基本一致”“大致相同”“可能”“疑似”“待核对”“待确认”等表述回避判断。分析写入逐候选explanation和conclusions，说明差异在哪里、哪一侧增加或减少、偏移及拆分合并的具体依据；没有差异时在分析中说明类别、数量、位置和覆盖范围的实际对应关系；不得把没有精确配准、类别语义未知或规范未确认直接当成证据不足。确实缺少图片、标注或可比较内容时，写明具体缺失的证据及其阻断的判断，不能编造事实或泛称待核对。assessments必须对每个candidate_id恰好给出一次核对：EQUIVALENT表示未发现实质标注一致性问题或仅轻微标注浮动，不要求不同实物的像素相同；MATERIAL表示同像素图已确认的类别差异或有视觉对应依据的实质标注冲突，UNCERTAIN表示比较证据不足；findings自由描述问题，不受工具分类限制。overall.verdict按逐成员结论汇总：存在MATERIAL则为MATERIAL；否则存在UNCERTAIN则为UNCERTAIN；其余为EQUIVALENT。assessments通过candidate_id绑定已提供的固定主图比较证据，不重复输出comparison；没有直接比较证据的候选只能UNCERTAIN。说明每个候选实际属于类别变化、位置/范围变化、实例划分、标注增减或具体缺失的比较依据，并引用对应差异证据。没有固定主图直接比较证据的成员只能保留未知。不得编造引用；仅记录实际影响差异判断的证据或覆盖限制，不要求裁决标注正误，不将缺少类别映射或语义定义列为已确认类别差异的判断限制。\n\n\n批次汇总：\n根据已保存的各批视觉分析汇总图组结论。这里没有新的图像附件，不能新增视觉事实或替代逐批分析。保留批次中的实质差异、未知项和限制。overall.verdict必须使用给定expected_verdict，不能因其他成员未知否定已确认差异。overall.text仍直接陈述具体结论，不用“基本一致”“可能”“疑似”“待核对”等模糊话术，不写分析过程；保留全部实际差异类型。conclusions写综合依据，引用只能从输入已有references中复制。不判断哪一侧标注正确，不发明类别映射、公差或工业标准；局部批次解释不能扩展为未观察的图像事实。\n\n若运行上下文提供输出校验结果，依据其中的Schema错误修正上次输出，重新返回一个完整结果。输出以下结构对应的一个完整JSON对象，不输出Markdown代码块、不复述格式定义，也不重复整个结果。根JSON对象闭合后立即结束生成，不继续输出右括号或其他内容。下面的格式变量在运行时替换为当前分析阶段的实际JSON Schema：\n{{response_schema}}\n";
    };
};
export declare const galleryReferenceParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly kind: {
        readonly type: "string";
        readonly enum: readonly ["conflicts", "groups"];
        readonly title: "Kind";
        readonly required: true;
    };
    readonly group_id: {
        readonly type: "string";
        readonly title: "Group Id";
        readonly required: true;
    };
    readonly facts_state: {
        readonly type: "string";
        readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
        readonly title: "Facts State";
        readonly default: "CURRENT";
    };
};
export declare const consistencyStartParameters: {
    readonly subjects: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
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
            readonly title: "DatasetScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["samples"];
                    readonly title: "Kind";
                    readonly default: "samples";
                };
                readonly sample_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Sample Ids";
                    readonly required: true;
                };
            };
            readonly title: "SampleScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["filtered"];
                    readonly title: "Kind";
                    readonly default: "filtered";
                };
                readonly dataset_id: {
                    readonly type: "string";
                    readonly title: "Dataset Id";
                    readonly required: true;
                };
                readonly filters: {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly raw_label_filters: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["PASS", "FAIL", "UNCERTAIN"];
                            };
                            readonly title: "Raw Label Filters";
                        };
                        readonly annotation_filters: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Annotation Filters";
                        };
                        readonly model_status: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"];
                            readonly title: "Model Status";
                            readonly default: "all";
                        };
                        readonly review_status: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"];
                            readonly title: "Review Status";
                            readonly default: "all";
                        };
                        readonly technical: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "issues"];
                            readonly title: "Technical";
                            readonly default: "all";
                        };
                        readonly reference_status: {
                            readonly type: "string";
                            readonly enum: readonly ["all", "candidate", "excluded"];
                            readonly title: "Reference Status";
                            readonly default: "all";
                        };
                        readonly search: {
                            readonly type: "string";
                            readonly title: "Search";
                            readonly default: "";
                        };
                        readonly sort_by: {
                            readonly type: "string";
                            readonly enum: readonly ["default", "risk", "tech"];
                            readonly title: "Sort By";
                            readonly default: "default";
                        };
                    };
                    readonly title: "SampleFilters";
                };
            };
            readonly title: "FilteredScope";
        }];
        readonly title: "Subjects";
        readonly required: true;
    };
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
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
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
    readonly mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "visual", "combined"];
        readonly title: "Mode";
    };
    readonly min_similarity: {
        readonly type: "number";
        readonly title: "Min Similarity";
    };
    readonly profile_id: {
        readonly type: "string";
        readonly title: "Profile Id";
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
    readonly model_analysis_prompt: {
        readonly type: "string";
        readonly title: "Model Analysis Prompt";
    };
    readonly prompt: {
        readonly type: "string";
        readonly title: "Prompt";
    };
};
export declare const imageRetrieveParameters: {
    readonly query: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["sample"];
                    readonly title: "Kind";
                    readonly default: "sample";
                };
                readonly sample_id: {
                    readonly type: "string";
                    readonly title: "Sample Id";
                    readonly required: true;
                };
            };
            readonly title: "SampleImageQuery";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["temporary"];
                    readonly title: "Kind";
                    readonly default: "temporary";
                };
                readonly image_ref: {
                    readonly type: "string";
                    readonly title: "Image Ref";
                    readonly required: true;
                };
            };
            readonly title: "TemporaryImageQuery";
        }];
        readonly title: "Query";
        readonly required: true;
    };
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
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
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
    readonly mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "visual", "combined"];
        readonly title: "Mode";
        readonly default: "combined";
    };
    readonly profile_id: {
        readonly type: "string";
        readonly title: "Profile Id";
    };
    readonly top_k: {
        readonly type: "integer";
        readonly title: "Top K";
        readonly default: 50;
    };
    readonly min_similarity: {
        readonly type: "number";
        readonly title: "Min Similarity";
    };
    readonly cursor: {
        readonly type: "string";
        readonly title: "Cursor";
    };
};
export declare const imageIndexPrepareParameters: {
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
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
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
    readonly profile_id: {
        readonly type: "string";
        readonly title: "Profile Id";
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
};
export declare const consistencyCompareParameters: {
    readonly sample_a: {
        readonly type: "string";
        readonly title: "Sample A";
        readonly required: true;
    };
    readonly sample_b: {
        readonly type: "string";
        readonly title: "Sample B";
        readonly required: true;
    };
    readonly matching: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly minimum_iou: {
                readonly type: "number";
                readonly description: "Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review";
                readonly title: "Minimum Iou";
                readonly default: 0.5;
            };
            readonly ambiguity_tolerance: {
                readonly type: "number";
                readonly title: "Ambiguity Tolerance";
                readonly default: 1e-9;
            };
            readonly tiny_area: {
                readonly type: "number";
                readonly title: "Tiny Area";
                readonly default: 4;
            };
            readonly split_coverage: {
                readonly type: "number";
                readonly title: "Split Coverage";
                readonly default: 0.9;
            };
            readonly max_instances: {
                readonly type: "integer";
                readonly title: "Max Instances";
                readonly default: 500;
            };
            readonly max_roi_pixels: {
                readonly type: "integer";
                readonly title: "Max Roi Pixels";
                readonly default: 16777216;
            };
            readonly max_cached_pixels: {
                readonly type: "integer";
                readonly title: "Max Cached Pixels";
                readonly default: 67108864;
            };
        };
        readonly title: "AnnotationMatchingConfig";
    };
    readonly near: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly target_size: {
                readonly type: "array";
                readonly items: {
                    readonly type: "integer";
                };
                readonly title: "Target Size";
            };
            readonly pixel_cosine_threshold: {
                readonly type: "number";
                readonly title: "Pixel Cosine Threshold";
                readonly default: 0.99;
            };
            readonly ncc_threshold: {
                readonly type: "number";
                readonly title: "Ncc Threshold";
                readonly default: 0.98;
            };
            readonly max_mean_abs_diff: {
                readonly type: "number";
                readonly title: "Max Mean Abs Diff";
                readonly default: 0.006;
            };
            readonly max_high_diff_ratio: {
                readonly type: "number";
                readonly title: "Max High Diff Ratio";
                readonly default: 0.0015;
            };
            readonly diff_pixel_threshold: {
                readonly type: "number";
                readonly title: "Diff Pixel Threshold";
                readonly default: 0.08;
            };
            readonly enable_translation_search: {
                readonly type: "boolean";
                readonly title: "Enable Translation Search";
                readonly default: true;
            };
        };
        readonly title: "NearComparisonConfig";
    };
};
export declare const consistencyEvidenceParameters: {
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
};
export declare const consistencyQueryParameters: {
    readonly selection: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["batch"];
                    readonly title: "Kind";
                    readonly default: "batch";
                };
                readonly batch_id: {
                    readonly type: "string";
                    readonly title: "Batch Id";
                    readonly required: true;
                };
            };
            readonly title: "BatchSelection";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["scope"];
                    readonly title: "Kind";
                    readonly default: "scope";
                };
                readonly subjects: {
                    readonly oneOf: readonly [{
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["all_registered"];
                                readonly title: "Kind";
                                readonly default: "all_registered";
                            };
                        };
                        readonly title: "AllRegisteredScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["datasets"];
                                readonly title: "Kind";
                                readonly default: "datasets";
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
                        readonly title: "DatasetScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["samples"];
                                readonly title: "Kind";
                                readonly default: "samples";
                            };
                            readonly sample_ids: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                                readonly title: "Sample Ids";
                                readonly required: true;
                            };
                        };
                        readonly title: "SampleScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["filtered"];
                                readonly title: "Kind";
                                readonly default: "filtered";
                            };
                            readonly dataset_id: {
                                readonly type: "string";
                                readonly title: "Dataset Id";
                                readonly required: true;
                            };
                            readonly filters: {
                                readonly type: "object";
                                readonly additionalProperties: false;
                                readonly properties: {
                                    readonly raw_label_filters: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                            readonly enum: readonly ["PASS", "FAIL", "UNCERTAIN"];
                                        };
                                        readonly title: "Raw Label Filters";
                                    };
                                    readonly annotation_filters: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                        readonly title: "Annotation Filters";
                                    };
                                    readonly model_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"];
                                        readonly title: "Model Status";
                                        readonly default: "all";
                                    };
                                    readonly review_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"];
                                        readonly title: "Review Status";
                                        readonly default: "all";
                                    };
                                    readonly technical: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "issues"];
                                        readonly title: "Technical";
                                        readonly default: "all";
                                    };
                                    readonly reference_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["all", "candidate", "excluded"];
                                        readonly title: "Reference Status";
                                        readonly default: "all";
                                    };
                                    readonly search: {
                                        readonly type: "string";
                                        readonly title: "Search";
                                        readonly default: "";
                                    };
                                    readonly sort_by: {
                                        readonly type: "string";
                                        readonly enum: readonly ["default", "risk", "tech"];
                                        readonly title: "Sort By";
                                        readonly default: "default";
                                    };
                                };
                                readonly title: "SampleFilters";
                            };
                        };
                        readonly title: "FilteredScope";
                    }];
                    readonly title: "Subjects";
                    readonly required: true;
                };
                readonly corpus_scope: {
                    readonly oneOf: readonly [{
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["all_registered"];
                                readonly title: "Kind";
                                readonly default: "all_registered";
                            };
                        };
                        readonly title: "AllRegisteredScope";
                    }, {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["datasets"];
                                readonly title: "Kind";
                                readonly default: "datasets";
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
                        readonly title: "DatasetScope";
                    }];
                    readonly title: "Corpus Scope";
                };
                readonly facts: {
                    readonly type: "string";
                    readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
                    readonly title: "Facts";
                    readonly default: "CURRENT";
                };
                readonly mode: {
                    readonly type: "string";
                    readonly enum: readonly ["exact", "visual", "combined"];
                    readonly title: "Mode";
                    readonly default: "exact";
                };
                readonly profile_id: {
                    readonly type: "string";
                    readonly title: "Profile Id";
                };
                readonly min_similarity: {
                    readonly type: "number";
                    readonly title: "Min Similarity";
                    readonly default: 0.95;
                };
            };
            readonly title: "ScopeSelection";
        }];
        readonly title: "Selection";
        readonly required: true;
    };
    readonly annotation_differences_only: {
        readonly type: "boolean";
        readonly title: "Annotation Differences Only";
        readonly default: false;
    };
    readonly relation: {
        readonly type: "string";
        readonly enum: readonly ["EXACT", "NEAR_CANDIDATE", "VISUAL_REFERENCE", "DIFFERENT", "UNCHECKED"];
        readonly title: "Relation";
    };
    readonly confirmed_conflict: {
        readonly type: "boolean";
        readonly title: "Confirmed Conflict";
    };
    readonly difference_type: {
        readonly type: "string";
        readonly enum: readonly ["QUALITY_LABEL", "CATEGORY", "ONE_SIDED_REGION", "GEOMETRY", "SPLIT_MERGE", "AMBIGUOUS_MATCH", "POLICY_UNCONFIRMED", "ANNOTATION_UNREADABLE"];
        readonly title: "Difference Type";
    };
    readonly review_state: {
        readonly type: "string";
        readonly enum: readonly ["OPEN", "NEEDS_CONTEXT", "RESOLVED"];
        readonly title: "Review State";
    };
    readonly correction_state: {
        readonly type: "string";
        readonly enum: readonly ["NOT_REQUIRED", "PROPOSED", "AWAITING_RESCAN", "VERIFIED"];
        readonly title: "Correction State";
    };
    readonly cursor: {
        readonly type: "string";
        readonly title: "Cursor";
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 50;
    };
};
export declare const consistencyGroupParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 20;
    };
};
export declare const consistencyGroupMemberParameters: {
    readonly query_id: {
        readonly type: "string";
        readonly title: "Query Id";
        readonly required: true;
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 20;
    };
    readonly group_id: {
        readonly type: "string";
        readonly title: "Group Id";
        readonly required: true;
    };
    readonly facts_state: {
        readonly type: "string";
        readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
        readonly title: "Facts State";
        readonly default: "CURRENT";
    };
};
export declare const consistencyContextParameters: {
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
    readonly result_id: {
        readonly type: "string";
        readonly title: "Result Id";
        readonly required: true;
    };
    readonly difference_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Difference Ids";
    };
    readonly return_location: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly pageId: {
                readonly type: "string";
                readonly enum: readonly ["industrial-consistency"];
                readonly title: "Pageid";
                readonly default: "industrial-consistency";
            };
            readonly tab: {
                readonly type: "string";
                readonly enum: readonly ["conflicts", "search", "groups", "jobs"];
                readonly title: "Tab";
            };
            readonly scope: {
                readonly oneOf: readonly [{
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly kind: {
                            readonly type: "string";
                            readonly enum: readonly ["all_registered"];
                            readonly title: "Kind";
                            readonly default: "all_registered";
                        };
                    };
                    readonly title: "AllRegisteredScope";
                }, {
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly kind: {
                            readonly type: "string";
                            readonly enum: readonly ["datasets"];
                            readonly title: "Kind";
                            readonly default: "datasets";
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
                    readonly title: "DatasetScope";
                }];
                readonly title: "Scope";
            };
            readonly query: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly kind: {
                        readonly type: "string";
                        readonly enum: readonly ["sample"];
                        readonly title: "Kind";
                        readonly default: "sample";
                    };
                    readonly sample_id: {
                        readonly type: "string";
                        readonly title: "Sample Id";
                        readonly required: true;
                    };
                };
                readonly title: "SampleImageQuery";
            };
            readonly batchId: {
                readonly type: "string";
                readonly title: "Batchid";
            };
            readonly resultId: {
                readonly type: "string";
                readonly title: "Resultid";
            };
            readonly evidenceId: {
                readonly type: "string";
                readonly title: "Evidenceid";
            };
            readonly facts: {
                readonly type: "string";
                readonly enum: readonly ["CURRENT", "HISTORICAL", "UNKNOWN"];
                readonly title: "Facts";
            };
            readonly groupId: {
                readonly type: "string";
                readonly title: "Groupid";
            };
            readonly memberId: {
                readonly type: "string";
                readonly title: "Memberid";
            };
            readonly differenceId: {
                readonly type: "string";
                readonly title: "Differenceid";
            };
            readonly returnPage: {
                readonly type: "string";
                readonly title: "Returnpage";
            };
            readonly sessionId: {
                readonly type: "string";
                readonly title: "Sessionid";
            };
            readonly queryId: {
                readonly type: "string";
                readonly title: "Queryid";
            };
            readonly gallerySearch: {
                readonly type: "string";
                readonly title: "Gallerysearch";
            };
            readonly galleryOrder: {
                readonly type: "string";
                readonly enum: readonly ["recent", "members"];
                readonly title: "Galleryorder";
            };
            readonly differenceFilter: {
                readonly type: "string";
                readonly enum: readonly ["all", "category", "geometry", "presence", "instances", "multiple"];
                readonly title: "Differencefilter";
            };
            readonly modelFilter: {
                readonly type: "string";
                readonly enum: readonly ["all", "NOT_ANALYZED", "RUNNING", "FAILED", "EQUIVALENT", "MATERIAL", "UNCERTAIN"];
                readonly title: "Modelfilter";
            };
            readonly galleryPage: {
                readonly type: "integer";
                readonly title: "Gallerypage";
            };
            readonly detailTab: {
                readonly type: "string";
                readonly enum: readonly ["summary", "evidence", "review"];
                readonly title: "Detailtab";
            };
            readonly subjectId: {
                readonly type: "string";
                readonly title: "Subjectid";
            };
            readonly reviewFilter: {
                readonly type: "string";
                readonly enum: readonly ["OPEN", "NEEDS_CONTEXT", "RESOLVED"];
                readonly title: "Reviewfilter";
            };
            readonly groupPage: {
                readonly type: "integer";
                readonly title: "Grouppage";
            };
            readonly memberPage: {
                readonly type: "integer";
                readonly title: "Memberpage";
            };
        };
        readonly title: "ConsistencyReturnLocation";
    };
    readonly cursor: {
        readonly type: "string";
        readonly title: "Cursor";
    };
    readonly difference_page_size: {
        readonly type: "integer";
        readonly title: "Difference Page Size";
        readonly default: 3;
    };
    readonly max_images: {
        readonly type: "integer";
        readonly title: "Max Images";
        readonly default: 8;
    };
    readonly max_image_bytes: {
        readonly type: "integer";
        readonly title: "Max Image Bytes";
        readonly default: 12582912;
    };
    readonly max_text_bytes: {
        readonly type: "integer";
        readonly title: "Max Text Bytes";
        readonly default: 32768;
    };
};
export declare const consistencyBatchParameters: {
    readonly batch_id: {
        readonly type: "string";
        readonly title: "Batch Id";
        readonly required: true;
    };
};
export declare const consistencyRetryParameters: {
    readonly batch_id: {
        readonly type: "string";
        readonly title: "Batch Id";
        readonly required: true;
    };
    readonly request_id: {
        readonly type: "string";
        readonly title: "Request Id";
        readonly required: true;
    };
    readonly sample_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Sample Ids";
    };
};
export declare const consistencyMediaParameters: {
    readonly evidence_id: {
        readonly type: "string";
        readonly title: "Evidence Id";
        readonly required: true;
    };
    readonly media_id: {
        readonly type: "string";
        readonly title: "Media Id";
        readonly required: true;
    };
    readonly max_side: {
        readonly type: "integer";
        readonly title: "Max Side";
        readonly default: 1280;
    };
};
export declare const temporaryImageLimits: {
    readonly max_source_bytes: 134217728;
    readonly max_bytes: 268435456;
    readonly max_images: 128;
    readonly max_vector_bytes: 8388608;
    readonly ttl_seconds: 1800;
};
//# sourceMappingURL=consistency.parameters.generated.d.ts.map