export declare const auditStartParameters: {
    readonly dataset_id: {
        readonly type: "string";
        readonly title: "Dataset Id";
        readonly required: true;
    };
    readonly subset_ids: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Subset Ids";
    };
    readonly submission_id: {
        readonly type: "string";
        readonly title: "Submission Id";
    };
    readonly knowledge_version_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Knowledge Version Id";
        readonly required: true;
    };
    readonly knowledge_job_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Knowledge Job Id";
    };
    readonly knowledge_entry_ids: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Knowledge Entry Ids";
    };
    readonly consistency_job_ids: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Consistency Job Ids";
    };
    readonly sample_ids: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly title: "Sample Ids";
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
    readonly consistency_mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "visual", "combined"];
        readonly title: "Consistency Mode";
        readonly default: "exact";
    };
    readonly consistency_profile_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Consistency Profile Id";
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
    readonly instruction: {
        readonly type: "string";
        readonly title: "Instruction";
        readonly default: "根据运行上下文执行联合检查、补看或批次汇总。结论和描述概括实际发现，不写具体文件名或图像ID；具体图像依据放入结构化证据字段。\n\n依据冻结的数据集知识联合分析真实全图与全部ROI，逐项核验可观察判据，结合结构、位置、光照与允许变化。不要预设产品或缺陷清单。知识规则是可追溯的判据，不是当前图像的事实；本次结论只能引用实际输入图像或已提供的子批次图像证据。independent_support只说明支持来源独立于主图，不代表判据已核实。usable_for_judgment=false的判据仅作为观察线索，不能作为验收依据。check_assessments必须覆盖所有冻结check_id各一次；不适用或不可观察必须给出原因和图像依据。每项须引用至少一张实际raw图像，二值定位图不能独立支持外观判断。正常判据偏离或异常判据命中均标记anomaly，不可用标注类别直接推断。若某检查项缺少局部细节，使用其inspection_regions提出实际位置，由系统追加原图裁剪；不要猜测不存在的证据。findings记录需要复核的实际疑点，每项以check_ids关联检查点，description必填并写明实际可见现象，hypothesis记录异常假设，normal_explanation记录合理正常解释，limitations记录限制，review_action记录具体复核动作。每项分别提供description现象描述和location.description位置说明。location局部位置使用原图像素坐标bbox并引用实际覆盖该位置的raw证据；整体关系疑点使用global位置且引用全图，不伪造局部框。location.scope=local用于孔内异物、表面色差等可定位现象，必须给出原图bbox；global仅用于整体结构关系，不能用它跳过局部定位。priority仅表示复核顺序，不是缺陷概率；每个anomaly检查项须关联至少一个finding，无疑点时findings为空。以一句简短综合建议指出最需要人工复核的位置，避免长篇重复视觉描述。\n\n补看后同一现象用related_findings引用给定reference并更新观察，不再重复创建。确已排除时用resolved_findings给出该reference、实际依据和正常解释；未明确处理的疑点仍待复核。\n\n当前只追加尚缺的原图细节。结合此前证据与新图逐项重审；已补齐的缺证可消解，尚未消解的异常、冲突和限制须保留。\n\n综合各子批次完整分析，结合当前全图和代表性ROI重新判断；不得用正常批次否定其他批次的异常证据。\n\n收到冻结综合审计时，结合当前图像、实际比较图、冻结知识和一致性记录生成最终结论。最终suggested_label表示是否有可用判据支持当前判断，不等于肉眼未见异常。先检查本次knowledge.checks的usable_for_judgment：若全部为false，最终suggested_label只能写UNCERTAIN，无论主图外观正常还是存在明显异常疑点，均不能写PASS或FAIL；异常观察、正常解释和相应证据仍须如实保留。observation仍如实描述可见的正常或异常外观，analysis_text说明判据缺口及其影响；疑点及其证据继续保留，不因无法定论而停止观察或消去发现。未知、冲突或不可观察不得给确定PASS。audit_target明确本次唯一待审主图及其整图证据；作业虽有多张图，本次结论只描述该主图。input_scope列出本次实际提供的参考图像及来源数量；比较批次及其汇总始终审计同一主图，不能把作业总图数、知识来源总数或检索库大小当成本次实际观察的图数。参考图中的现象仅用于支持或反对主图的具体解释，不能改写成主图或整个数据集的事实。analysis_text写连贯综合分析，说明可见变化、适用规律、正常替代解释及一致性线索是否影响判断；description写简短结论，basis只列直接相关的事实与真实图像、知识条目和一致性结果引用。正文用判据名称说明依据，检查项ID仅放在basis.knowledge_check_ids中，所有短引用只放在对应证据字段。observation只写可见事实，applicable_rule说明适用判据与条件或无适用规则，normal_alternative保留正常解释及其证据。label_relation区分与原标一致、疑似漏标、疑似误标、不同条件可解释和无法判断，不修改原标或裁决真值。proposed_slice仅列有可见证据的能力切片候选，例如框尺度、低对比、结构关系、困难正常或域变化；bbox尺度不是缺陷真实面积，模型是否出错不能定义固有难度。无可靠切片依据时留空。一致性差异不自动证明产品缺陷，未审计或缺证不视为正常，疑点仅为待复核候选。比较图是独立来源，不能把其标注、局部或位置混为待审主图的事实；只引用实际提供的图像。支持、反对和缺证据实保留，未知的工程阈值不由模型补造。\n\n在同一次分析中同时观察全图与所附全部ROI，关联整体结构、各区域关系和产品知识。\n\n联合检查、补看阶段第一张是待审全图，其余为同一原图的ROI及配对的二值定位图。冻结综合审计阶段用audit_target和image_owners区分主图与各参考来源，参考图的局部属于其自己的原图。annotation_mask白色只表示标注覆盖，黑色表示其外或空洞，不代表产品颜色；必须结合相同crop_bbox的raw图观察，不把定位图另计为ROI。坐标均为原图像素坐标，裁剪没有拉伸；将局部现象定位回全图，综合周边结构、位置与光照解释，标注只是待核实线索，不是缺陷真值。global_view描述整体；region_observations必须按region_index为每个输入ROI各给一项观察，从1开始，不遗漏或重复。最终结论关联全图与局部证据；evidence_ids只能用所附证据ID或子批次已引用的ID。suspect_regions仅列需要补充细看的新线索，用整图0..1000归一化坐标。每项观察简洁明确。\n\n若运行上下文提供输出校验结果，依据其中的Schema错误修正上次输出，重新返回一个完整结果。输出以下结构对应的一个完整JSON对象，不输出Markdown代码块、不复述格式定义，也不重复整个结果。根JSON对象闭合后立即结束生成，不继续输出右括号或其他内容。下面的格式变量在运行时替换为当前分析阶段的实际JSON Schema：\n{{response_schema}}\n";
    };
};
//# sourceMappingURL=audit.parameters.generated.d.ts.map