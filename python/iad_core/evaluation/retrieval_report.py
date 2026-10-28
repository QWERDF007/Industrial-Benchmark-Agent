import json
import hashlib
from copy import deepcopy
from pathlib import Path

from iad_core.evaluation.resource_models import ResourceAcceptance


def write_retrieval_report(results: dict[str, dict], output: Path, *, resource_paths: list[Path] | None = None) -> dict:
    results = deepcopy(results)
    resources = {}
    profiles = {metrics['profile_id'] for metrics in results.values()}
    for path in resource_paths or []:
        path = Path(path).resolve()
        payload = path.read_bytes()
        acceptance = ResourceAcceptance.model_validate_json(payload)
        if acceptance.profile_id not in profiles:
            raise ValueError('Resource evidence does not match an evaluated embedding profile')
        if acceptance.profile_id in resources:
            raise ValueError('Choose one explicit resource measurement per embedding profile')
        resources[acceptance.profile_id] = (acceptance, path, hashlib.sha256(payload).hexdigest())
    for metrics in results.values():
        if metrics['status'] == 'EVALUATED' and metrics['profile_id'] in resources:
            acceptance, path, sha256 = resources[metrics['profile_id']]
            metrics['gates']['scale_and_resource_acceptance'] = acceptance.resource_acceptance_passed
            metrics['resource_acceptance'] = acceptance.model_dump(mode='json')
            metrics['resource_evidence'] = {'path': str(path), 'sha256': sha256}
            metrics['publication_ready'] = all(metrics['gates'].values())
    eligible = [name for name, metrics in results.items() if metrics['publication_ready']]
    eligible.sort(key=lambda name: (-results[name]['visual']['non_geometric_any_copy_recall'],
        -results[name]['visual']['member_recall'], results[name]['seconds']['end_to_end_p95'], name))
    summary = {'profiles': results, 'publication_ready': bool(eligible), 'selected_default': eligible[0] if eligible else None}
    lines = ['# 图像检索评测', '', '默认配置：' + (summary['selected_default'] or '未选定（发布验收未满足）'), '',
        '| 配置 | 状态 | 非几何至少一份 | 全部成员召回 | 严格成员召回 | 错误 EXACT / 负例 | 向量 P95 ms | 端到端 P95 s |',
        '|---|---|---:|---:|---:|---:|---:|---:|']
    for name, metrics in results.items():
        if metrics['status'] != 'EVALUATED':
            lines += [f'| {name} | {metrics["status"]} | — | — | — | — | — | — |', '',
                f'{name}：{metrics["reason"]}', '']
            continue
        visual, strict, seconds = metrics['visual'], metrics['strict'], metrics['seconds']
        non_geometric = visual['non_geometric_any_copy_recall']
        non_geometric_text = f'{non_geometric:.2%}' if non_geometric is not None else '未验证'
        strict_text = f'{strict["member_recall"]:.2%}' if strict['member_recall'] is not None else '未验证'
        lines.append(f'| {name} | EVALUATED | {non_geometric_text} | {visual["member_recall"]:.2%} | {strict_text} | '
            f'{strict["false_exact"]} / {strict["negative_pairs"]} | {seconds["vector_single_p95"] * 1000:.3f} | {seconds["end_to_end_p95"]:.3f} |')
    lines += ['', '## 变换副本', '', '| 配置 | JPEG成员 | 缩放成员 | 亮度成员 | 裁剪成员 | 旋转成员 | 查询全部副本找回 |',
        '|---|---:|---:|---:|---:|---:|---:|']
    for name, metrics in results.items():
        if metrics['status'] != 'EVALUATED':
            continue
        visual = metrics['visual']
        cells = []
        for stratum in ('jpeg', 'resize', 'brightness', 'crop', 'rotation'):
            measured = visual['strata'].get(stratum)
            cells.append(f'{measured["member_recall"]:.2%}' if measured else '未验证')
        lines.append(f'| {name} | ' + ' | '.join(cells) + f' | {visual["all_copies_recall"]:.2%} |')
    lines += ['', '## 验收范围', '']
    for name, metrics in results.items():
        if metrics['status'] != 'EVALUATED':
            continue
        missing = ', '.join(key for key, passed in metrics['gates'].items() if not passed)
        lines += [f'- {name}：{metrics["acceptance_sources"]} 个验收来源，{metrics["acceptance_queries"]} 次查询；'
            f'未满足或未验证：{missing or "无"}。详细配置、逐查询结果和负例证据见 [{name}]({name}/metrics.json)。']
        if 'resource_acceptance' in metrics:
            passed = metrics['resource_acceptance']['resource_acceptance_passed']
            lines.append(f'  [资源验收]({metrics["resource_evidence"]["path"]})：{"通过" if passed else "未通过或未验证"}；对应同一 profile_id。')
    lines += ['', '文件缓存未强制清空；当前端到端统计对应本清单的实际分辨率和候选数。受控单像素差异不替代人工确认的真实缺陷。', '']
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'metrics.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    (output / 'report.md').write_text('\n'.join(lines))
    return summary
