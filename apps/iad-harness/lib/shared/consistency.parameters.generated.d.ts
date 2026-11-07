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
        readonly default: "根据运行上下文执行图组分析或批次汇总，正文不写具体文件名或图像ID，证据通过结构化引用字段绑定。\n\n比较方向：anchor始终是主图，candidate是参考图。所有差异以主图相对于当前参考图为准。conclusion和overall.text的冲突结论只能精确单选：类别不一致、位置差异、多类别、少类别、拆分、合并。不添加主图、标注、视觉、基本、可能、疑似等前后缀，不加标点，不使用或、斜线、顿号等连接多个结论。主图0个标注而参考图1个标注，结论只能为少类别；反过来只能为多类别。主图同一对象多个框、参考图一个框为拆分，反过来为合并；同一对象类别值不同为类别不一致；位置或覆盖范围不同为位置差异。已确认多种差异时选择最主要的一种作为唯一结论，其他实际差异完整写在explanation、findings及conclusions。MATERIAL的categories必须是仅包含conclusion同名分类的单元素数组。类别、数量、位置和范围全部对应时，verdict为EQUIVALENT，conclusion和overall.text精确写一致，categories为空数组。只有确实缺失图片、标注或可比较内容时才可UNCERTAIN，conclusion及overall.text为null，categories为空，分析写明具体缺失内容；不能编造六类冲突。空标注数组是已知的0个标注，不是缺失标注文件或缺失证据；已读取主图0个标注、参考图有标注时必须判为少类别。不裁决哪一侧标注正确，不能因为无法判断漏标还是另一侧多标而拒绝给出主图相对参考图的增减方向。explanation、findings及所有正文只用主图、参考图等自然语言称呼，不能附带@c0、@c1、文件名或具体引用；这些引用仅用于结构化引用字段。\n\n图组分析：\n分析整个冻结图组，必须联合查看完整原图、原始标注数据和无叠加的局部原始像素裁剪。不限于工具已报出的差异：独立检查主图相对每张参考图的类别、数量、位置、覆盖范围及实例划分，具体依据写在分析中。每条分析引用真实candidate_id；引用比较证据时填写comparison对象，result_id和evidence_id完整复制上下文中的配对引用，difference_id可选；无直接比较依据时comparison为null。像素/几何事实、模型视觉解释、标注规范和人工质量裁决必须区分；相似度不能证明缺陷，不能写Gold或人工裁决。标注匹配工具提供比较观察；必须逐项核对对应关系，不能把位置微移、范围变化或实例划分误判为标注增减。本任务检查标注一致性，不裁决哪一侧标注正确。对已确认同像素的图像，对应标注的原始类别值不同就是标注类别不同；例如15变为18或图像级OK与NG不同，均属于类别不一致。不得预设类别映射或语义相近；视觉相近可以写入详细分析，但不能否定类别差异。缺少类别映射、语义定义未知不能抹除已读取的类别差异。对于非同像素的相似图，联合观察原图、局部及标注，建立实际对象对应；相似度高不证明同一实物或缺陷真值。位置使用各自原图尺寸归一化后的坐标。RELATIVE_IMAGE表示相对标注布局的比较，不是图像配准。没有提供容差标准时不得自定合理浮动范围忽略已观察到的标注位置或范围差异；细微坐标变化同样属于位置数据差异，分析指出坐标、偏移及覆盖范围变化。不能仅因没有精确配准就拒绝视觉核对，也不能猜测几何变换、工业公差或缺陷真值。representation=raw的附件是完整原图或原始裁剪，没有绘制框、文字或颜色，标注坐标在JSON中。annotation_mask附件只表达人工mask的二值定位形状，不能把掩膜或标注颜色当产品特征。assessments对每个candidate_id恰好给出一次核对，通过candidate_id绑定固定主图的直接比较证据，不重复输出comparison。没有固定主图直接比较证据的成员只能UNCERTAIN，不能编造引用。overall.verdict按逐候选汇总：存在MATERIAL则为MATERIAL，否则存在UNCERTAIN则为UNCERTAIN，其余为EQUIVALENT。overall.text只从实际逐候选结果中选择主要冲突类型，不得发明新类型；详细分析保留在conclusions。所有具体区域、数量、对象对应、其他实际发现及证据限制写在explanation、findings、conclusions与limitations。\n\n批次汇总：\n根据已保存的逐批视觉分析汇总图组结论，没有新的图像附件，不能新增视觉事实或替代逐批分析。overall.verdict使用给定expected_verdict，存在已确认差异时不能因其他成员未知否定该差异。overall.text从已保存的主要冲突分类中单选，不并列、不改写、不增加描述；全部具体差异及证据限制完整保留在conclusions与limitations。引用只从输入已有references中复制，不发明类别映射、公差、工业标准或未观察的图像事实。\n\n若运行上下文提供输出校验结果，依据其中的Schema错误修正上次输出，重新返回一个完整结果。输出以下结构对应的一个完整JSON对象，不输出Markdown代码块、不复述格式定义，也不重复整个结果。根JSON对象闭合后立即结束生成，不继续输出右括号或其他内容。下面的格式变量在运行时替换为当前分析阶段的实际JSON Schema：\n{{response_schema}}\n";
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
        readonly enum: readonly ["QUALITY_LABEL", "CATEGORY", "ANNOTATION_COUNT", "ONE_SIDED_REGION", "GEOMETRY", "SPLIT_MERGE", "AMBIGUOUS_MATCH", "POLICY_UNCONFIRMED", "ANNOTATION_UNREADABLE"];
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