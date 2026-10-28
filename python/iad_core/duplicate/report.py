from iad_core.duplicate.models import DuplicateGroup, DuplicateMiningResult
from iad_core.storage.models import Sample


def generate_duplicate_report_markdown(result: DuplicateMiningResult, verified_groups: list[DuplicateGroup],
        samples_map: dict[str,Sample]) -> str:
    coverage=result.corpus_coverage
    lines=[f'# 图像重复检查：{result.task_id}', '',
        f'视觉候选阈值 {result.similarity_threshold}；索引覆盖 {coverage.completed}/{result.total_samples}，失败 {coverage.failed}，待处理 {coverage.pending}。',
        f'原图复核：{"已请求" if result.verification_requested else "未请求"}；不可核验 {result.verification_failed_count} 对；耗时 {result.elapsed_seconds:.2f} 秒。', '',
        '| 范围 | 组数 | 涉及样本 | 跨来源组 |', '| --- | ---: | ---: | ---: |',
        f'| 视觉候选连通图 | {result.candidate_group_count} | {result.candidate_sample_count} | {result.candidate_cross_origin_group_count} |',
        f'| 原像素严格同图 | {result.verified_group_count} | {result.verified_sample_count} | {result.verified_cross_origin_group_count} |', '',
        f'近重复候选 {result.near_candidate_pair_count} 对，保留直接关系，不作为严格同图组的传递性依据。', '',
        '候选来自指定索引和 Top-K 邻居预算，不能据此宣称现实重复关系全部找全。', '',
        '| 来源关系 | 候选对 | 严格同图对 |', '| --- | ---: | ---: | ---: |']
    lines.extend(f'| {name} | {result.cross_origin_pairs.get(name,0)} | {result.verified_cross_origin_pairs.get(name,0)} |'
        for name in sorted(set(result.cross_origin_pairs)|set(result.verified_cross_origin_pairs)))
    for group in sorted(verified_groups,key=lambda value:(-value.size,value.group_id))[:15]:
        lines.extend(['',f'## {group.group_id} · {group.size} 成员'])
        lines.extend(f'- {samples_map[identity].relative_path}' for identity in group.sample_ids[:5])
    return '\n'.join(lines)+'\n'
