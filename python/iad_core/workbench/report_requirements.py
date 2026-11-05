from iad_core.workbench.prompt_text import RESPONSE_FORMAT_INSTRUCTION


REPORT_REQUIREMENTS = {
    'technical_usability': dict(card='dataset', title='技术可用性', data=['technical_usability', 'technical_states', 'annotation_coverage'], required='图像可读率、坐标有效率、原图与标注对应情况'),
    'label_trust': dict(card='dataset', title='标签可信性与 Gold 资格', data=['raw_labels', 'gold_by_policy', 'label_comparison'], required='确认覆盖、未决、银标、独立随机抽查及加权标签错误估计'),
    'annotation_completeness': dict(card='dataset', title='标注完整性', data=['annotation_coverage'], required='图像与区域核验、完整或部分标注资格、bbox 与真实 mask 分层'),
    'rule_explanation': dict(card='dataset', title='规则可解释性与正反证据', data=['knowledge_versions'], required='可见事实、验收来源、适用条件、支持、反驳、独立验证与未决原因'),
    'normal_coverage': dict(card='dataset', title='正常变化覆盖', data=['independence', 'capability_candidates'], required='已知批次、域、允许变化覆盖及独立物理件数'),
    'defect_coverage': dict(card='dataset', title='缺陷覆盖', data=['annotation_coverage', 'bbox_scale', 'capability_candidates', 'outcomes'], required='形态、位置、框尺度、可见对比与结构关系，候选与确认分开'),
    'independence': dict(card='dataset', title='独立性与代表性', data=['independence'], required='物理件、批次、连拍、重复、跨划分关联及生产分布范围'),
    'statistical_support': dict(card='dataset', title='统计支撑', data=['coverage', 'independence', 'capability_candidates'], required='有效独立分子分母、各切片样本数、差异区间及最低可辨差异'),
    'discrimination': dict(card='dataset', title='区分能力', data=['evaluation_evidence'], required='开发试评天花板或地板、同样本模型配对差异、排名稳定性和保留集确认'),
    'detection': dict(card='model', title='缺陷检出', data=['evaluation_evidence', 'gold_by_policy'], required='Val 冻结阈值的 Test Recall、TP、FN、各类漏检，I-AUROC 与 I-AP 及异常比例'),
    'normal_tolerance': dict(card='model', title='普通与困难良品容忍', data=['evaluation_evidence', 'gold_by_policy'], required='Test FPR、FP、TN、Hard-Normal FPR，各自有效分母及未知样本'),
    'acceptance_boundary': dict(card='model', title='验收边界区分', data=['evaluation_evidence', 'consistency_records'], required='确认 OK/NG 成对同时判对率、对内排序、同分约定、配对连通组'),
    'small_defects': dict(card='model', title='细小与低对比缺陷', data=['evaluation_evidence', 'capability_candidates', 'annotation_coverage', 'bbox_scale'], required='原图尺度及模型输入尺度分层 Recall、定位召回、语义切片抽查'),
    'localization': dict(card='model', title='局部定位', data=['evaluation_evidence', 'annotation_coverage'], required='完整 bbox AP/Recall、部分标注区域召回、可靠 mask 的 P-AUROC/P-AP/P-AUPRO 与忽略区'),
    'structural_relations': dict(card='model', title='结构关系', data=['evaluation_evidence', 'capability_candidates'], required='缺失、多件、错位及对应正常结构的独立切片 Recall/FPR'),
    'domain_generalization': dict(card='model', title='跨域泛化', data=['evaluation_evidence', 'independence'], required='固定阈值的原域与未见域 Recall/FPR 变化、目标域可见信息轨道'),
    'efficiency': dict(card='model', title='效率与系统成本', data=['evaluation_evidence'], required='固定硬件和输入协议下的真实 p50/p95、吞吐、显存、内存、建库与调用成本'),
    'explanation_uncertainty': dict(card='model', title='解释证据与不确定性', data=['outcomes', 'coverage'], required='MLLM 证据有效率、拒答覆盖与已回答风险；传统 AD 无语言输出不扣分'),
    'mllm_calibration': dict(card='calibration', title='MLLM 构建流程校准', data=['gold_by_policy', 'outcomes', 'coverage'], required='独立专家参考集、疑点发现 Precision/Recall、确定结论错误率、覆盖风险、切片可靠性及复核成本'),
    'benchmark_protocol': dict(card='protocol', title='任务协议与适用范围', data=['scope_dataset_ids', 'evaluation_evidence', 'independence'], required='代表性、挑战、跨域三部分；Gold/银标/未决、独立划分、冻结提示词与输入预算、Val 阈值、预测和重试协议'),
}

REPORT_METRICS = {
    'detection_metrics': [('Test Recall','image_metrics.recall','ANOMALY'),('TP','image_metrics.true_positive',None),
        ('FN','image_metrics.false_negative',None),('I-AUROC','image_metrics.i_auroc','BOTH'),
        ('I-AP','image_metrics.i_ap','BOTH'),('异常比例',None,None)],
    'normal_tolerance_metrics': [('Test FPR',None,None),('FP','image_metrics.false_positive',None),
        ('TN','image_metrics.true_negative',None),('Hard-Normal FPR','hard_normal_metrics.hard_normal_fpr','HARD_NORMAL')],
    'acceptance_boundary_metrics': [('成对同时判对率',None,None),('对内排序正确率',None,None),('有效配对连通组',None,None)],
    'small_defects_metrics': [('原图框尺度分层 Recall',None,None),('输入尺度分层 Recall',None,None),('低对比切片 Recall',None,None)],
    'localization_metrics': [('bbox AP',None,None),('bbox Recall',None,None),('已标区域召回',None,None),
        ('P-AUROC','pixel_metrics.p_auroc',None),('P-AP','pixel_metrics.p_ap',None),('P-AUPRO','pixel_metrics.p_aupro',None)],
    'structural_relations_metrics': [('结构关系切片 Recall',None,None),('结构关系切片 FPR',None,None)],
    'domain_generalization_metrics': [('原域 Recall/FPR',None,None),('未见域 Recall/FPR',None,None),('固定阈值变化量',None,None)],
    'efficiency_metrics': [('p50 延迟',None,None),('p95 延迟',None,None),('吞吐',None,None),('显存',None,None),
        ('内存',None,None),('建库成本',None,None),('调用成本',None,None)],
    'explanation_uncertainty_metrics': [('证据有效率',None,None),('拒答覆盖率',None,None),('已回答错误率',None,None)],
    'mllm_calibration_metrics': [('疑点发现 Precision',None,None),('疑点发现 Recall',None,None),('确定结论错误率',None,None),
        ('覆盖率与风险',None,None),('切片标记可靠性',None,None),('有效问题复核成本',None,None)],
}
for metric_group in REPORT_METRICS:
    REPORT_REQUIREMENTS[metric_group.removesuffix('_metrics')]['data'].append(metric_group)

DEFAULT_REPORT_PROMPT = '''依据冻结报告事实和本次实际图像，逐项输出数据集能力卡、模型能力卡及流程校准、任务协议结论。
report_observation阶段只将本批实际图像作为视觉依据，统计仍使用完整冻结范围；report_summary阶段结合全部child_reports与实际代表图归纳，不丢弃冲突、缺证和子批观察范围，子批实际已见图像可以通过结构化字段追溯。
每节采用结论、真实数据、图像证据与适用限制的语义，分析简洁连贯；不得从缺失记录补造测量或业务门槛，不输出未经校准的质量总分。
statistics是确定性统计的唯一来源。原始标签不是独立Gold；不一致率不是错误率，高风险送审改标率不能代替总体标签错误估计。
构建工具的审计建议不等于参评模型预测。缺独立真值、相同冻结输入协议、有效分母或实际预测时，不得宣称模型准确率、Recall、FPR、定位成绩或模型排名。
无缺陷、无困难良品、无可靠mask、空分母和未测量均不能写成零错误。bbox不得当真实mask或缺陷面积，部分标注的未匹配预测不自动算误报。
按独立物理件或配对连通组解释统计支撑；生产分布未知时只讨论观察范围；切片可重叠，不虚增样本。无法区分模型时据实写样本不足。
资料不全时说明具体缺失及影响，每项状态为可评估、限定评估、待补证或不支持该指标；有依据的部分仍保留，不用通用免责声明替代真实判断。
未记录不等于实际不存在；完整性未知不能断言标注不完整，仅在代表图中未观察到某类现象不能断言整个数据集没有。技术可用率、原图解码率、标注坐标有效率分别按对应统计解释，框尺度不是缺陷真实面积。
知识规则的来源与正常替代解释、支持及反对图像、未决冲突应据实保留。只有实际提供的图像才能作为本次视觉依据，引用填写结构化字段；正文不要文件名或图像编号。
能力切片只按可见事实提出候选，不因某模型错了就认定固有难度。自报置信度不当作正确概率，MLLM评价须区分独立校准与未验证部分。
保留数据集可用于什么任务、哪些范围需要补证及模型能力差异是否有依据的最终结论。只返回当前Schema结果。''' + '\n\n' + RESPONSE_FORMAT_INSTRUCTION
