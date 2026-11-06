from iad_core.workbench.benchmark_report import BenchmarkFacts
from iad_core.workbench.report_requirements import REPORT_METRICS


def report_data(facts: BenchmarkFacts) -> dict[str, list[dict[str, str]]]:
    annotations = facts.annotation_coverage
    technical = facts.technical_evidence
    consistency = facts.scope_consistency
    result = {
        'technical_usability': [dict(label=label, value=f'{ratio.numerator}/{ratio.denominator}' if ratio.denominator else '不可计算', basis=ratio.basis) for label, ratio in [
            ('原图完整解码', technical.image_decoding), ('空间标注坐标有效', technical.annotation_geometry),
            ('标注声明尺寸匹配', technical.annotation_source_sizes), ('有效尺寸且无阻断问题', facts.technical_usability)]],
        'technical_states': [dict(label=label, value=str(count), basis=basis) for label, count, basis in [
            *[(f'解码 {status}', count, '最近扫描保存的原始像素解码状态') for status, count in technical.decode_statuses.items()],
            *[(f'坐标 {status}', count, '已解析空间标注的扫描几何状态') for status, count in technical.geometry_statuses.items()],
            ('标注解析失败图像', technical.annotation_parse_error_samples, '解析失败的图像不计为无标注已确认'),
            ('标注声明尺寸未知', technical.source_size_unknown_annotations, '尺寸缺失不计入尺寸匹配分母')]],
        'bbox_scale': [dict(label={'width_fraction':'框宽 / 原图宽', 'height_fraction':'框高 / 原图高', 'area_fraction':'框面积 / 原图面积'}[key],
            value=(f'{item.count} 个，{item.minimum:.6g}～{item.maximum:.6g}，中位数 {item.median:.6g}' if item.count else '无可用框尺度'),
            basis='有效空间标注外接框的归一化尺度；不含无效框，不是缺陷真实面积或物理尺寸') for key, item in technical.bbox_scale.items()],
        'raw_labels': [dict(label=key, value=str(value), basis='当前范围原始标签，未自动作为 Gold') for key, value in facts.raw_labels.items()],
        'gold_by_policy': ([dict(label=item['policy_name'], value=str(item['independently_confirmed']), basis='独立人工或业务来源确认的记录数；政策间不相加') for item in facts.gold_by_policy]
            or [dict(label='独立 Gold', value='未提供', basis='没有独立确认的冻结参考真值，不能计算真实错误率')]),
        'label_comparison': [dict(label='原标不一致', value=f'{facts.label_comparison.numerator}/{facts.label_comparison.denominator}', basis=facts.label_comparison.basis)],
        'annotation_coverage': [dict(label=label, value=str(value), basis='记录存在不等于标注完整或业务语义已确认') for label, value in [
            ('有空间标注图像', annotations.annotated_samples), ('无空间标注图像', annotations.unannotated_samples),
            ('有 bbox 图像', annotations.bbox_samples), ('有真实 mask 图像', annotations.mask_samples),
            ('无效标注', annotations.invalid_annotations), ('完整性资格未确认', annotations.completeness_unknown_samples)]],
        'knowledge_versions': [dict(label=version.version_id, value=f'{len(version.checks)} 条',
            basis=f'支持状态 {sum(check.status=="supported" for check in version.checks)}，冲突 {sum(check.status=="conflicted" for check in version.checks)}；正反引用可追溯') for version in facts.knowledge_versions],
        'independence': [dict(label=field, value=f'{item.known_samples}/{facts.registered_samples}',
            basis=f'有记录样本，已知组数 {item.known_groups}，缺失 {item.missing_samples}；未知组不能推定独立') for field, item in facts.independence.items()],
        'capability_candidates': ([dict(label=name, value=str(len(ids)), basis='仅为模型提出的切片候选，可能重叠，尚未独立确认') for name, ids in facts.capability_candidates.items()]
            or [dict(label='能力切片', value='未记录', basis='尚无具可见证据的冻结切片候选')]),
        'outcomes': [dict(label=key, value=str(value), basis='有效综合审计记录按 sample_id 去重；疑点不是人工真值') for key, value in facts.outcomes.items()],
        'coverage': [dict(label='有效审计覆盖', value=f'{facts.audited_samples}/{facts.registered_samples}', basis=facts.coverage.basis)],
        'evaluation_evidence': ([dict(label=item['model_id'], value=item['status'], basis=item['scope_note']) for item in facts.evaluation_evidence]
            or [dict(label='独立模型评测', value='未提供', basis='缺冻结划分、Val 阈值和实际预测，不把构建审计当 Test 成绩')]),
        'consistency_records': [dict(label='冻结一致性记录', value=str(len(facts.consistency_records)), basis='与本次有效审计对应的比较线索，不与疑点数相加')],
        'scope_consistency': [dict(label=label,value=str(getattr(consistency.statistics.current,key)),
            basis='选定范围与同范围检索库的当前结果；对向比较去重，差异项不等于图像数或已确认业务错误') for label,key in [
            ('当前比较对','pairs'), ('严格同图组','strict_groups'), ('严格同图成员','strict_members'),
            ('已确认质量标签冲突项','confirmed_quality_conflicts'), ('区域标注差异项','regional_differences'),
            ('待确认策略项','policy_unknown'), ('无效标注比较对','invalid_annotation_pairs'), ('待复核差异项','pending_review')]] + [
            dict(label='历史比较记录',value=str(consistency.facts.historical),basis='历史结果不混入当前比较统计'),
            dict(label='资格未知比较记录',value=str(consistency.facts.unknown),basis='来源或证据不可核验的记录不混入当前比较统计'),
            dict(label='严格同图检查覆盖',value=f'{consistency.execution.completed}/{consistency.execution.total}',
                basis='复用匹配当前范围的既有检查；不把已检查图像数当成相似图穷举证明'),
            dict(label='检查完整性',value={'EXACT_SCOPE':'严格同图范围完整','TOP_K':'候选检索 Top-K','SIMILARITY_THRESHOLD':'相似度阈值检索','PARTIAL':'部分完成','INDEX_ONLY':'仅索引'}[consistency.retrieval_completeness],
                basis='当前严格同图检查口径；未处理、失败与无匹配的来源分别保留')],
        'scope_dataset_ids': [dict(label='子数据集', value=str(len(facts.scope_dataset_ids)), basis='去重登记图像为覆盖率分母，未审计保留')],
    }
    for group, specifications in REPORT_METRICS.items():
        rows = []
        for label, path, population in specifications:
            values = []
            for evaluation in facts.evaluation_evidence:
                if path is None or evaluation['status'] != 'COMPLETED':
                    continue
                metric = evaluation['metrics']
                counts = metric.get('test_class_counts', {})
                if population == 'HARD_NORMAL':
                    count = metric.get('hard_normal_metrics', {}).get('hard_normal_count', 0)
                elif population == 'BOTH':
                    count = min(counts.get('NORMAL', 0), counts.get('ANOMALY', 0))
                else:
                    count = counts.get(population, 0) if population else 1
                if not count:
                    continue
                value = metric
                for name in path.split('.'):
                    value = value.get(name) if isinstance(value, dict) else None
                if value is not None:
                    values.append(dict(label=label, value=f'记录值：{value}', basis=f'{evaluation["model_id"]}，{evaluation["run_id"]}；{evaluation["scope_note"]}'))
            rows.extend(values or [dict(label=label, value='不可计算',
                basis='缺少当前任务下可核验的冻结预测、有效分母或实际测量；未测与零错误分开')])
        result[group] = rows
    return result
