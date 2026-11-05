from iad_core.workbench.benchmark_report import BenchmarkFacts
from iad_core.workbench.report_requirements import REPORT_METRICS


def report_data(facts: BenchmarkFacts) -> dict[str, list[dict[str, str]]]:
    annotations = facts.annotation_coverage
    result = {
        'technical_usability': [dict(label='可读取且无阻断问题', value=f'{facts.technical_usability.numerator}/{facts.technical_usability.denominator}', basis=facts.technical_usability.basis)],
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
