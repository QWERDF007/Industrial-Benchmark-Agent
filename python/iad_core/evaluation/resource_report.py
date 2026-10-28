import json
from pathlib import Path

from iad_core.evaluation.resource_models import IncrementalChecks, ResourceAcceptance, ResourceChecks

def write_resource_report(output: Path) -> dict:
    output = Path(output)
    prepared = json.loads((output / 'prepared.json').read_text())
    measured = json.loads((output / 'resources.json').read_text())
    incremental_path = output / 'incremental.json'
    incremental = json.loads(incremental_path.read_text()) if incremental_path.exists() else None
    profile = prepared['config']['profile']['profile_id']
    if measured['profile_id'] != profile or (incremental and incremental['profile_id'] != profile):
        raise ValueError('Resource evidence must use the same frozen embedding profile')
    measured_checks = ResourceChecks.model_validate(measured['gates'])
    incremental_checks = IncrementalChecks.model_validate(incremental['gates']) if incremental else None
    passed = measured_checks.passed and incremental_checks is not None and incremental_checks.passed
    summary = {'profile_id': profile, 'preparation': prepared['seconds'], 'throughput': prepared['throughput'],
        'preparation_resources': prepared['resources'], 'verification_resources': measured['resources'],
        'measured_gates': measured['gates'], 'incremental_status': 'MEASURED' if incremental else 'UNVERIFIED',
        'incremental_gates': incremental['gates'] if incremental else None,
        'resource_acceptance_passed': passed, 'publication_ready': False}
    summary = ResourceAcceptance.model_validate(summary).model_dump(mode='json')
    lines = ['# 图像检索资源测量', '', '配置：`' + profile + '`', '',
        '负载为实际工业原图生成的完整分辨率派生文件，仅用于性能测量。', '',
        '| 分组 | 图像数 | 原图尺寸 | 向量查询次数 | 向量 P95 ms | 原图复核候选数 | 冷缓存建议 P95 s | 热缓存 P95 s |',
        '|---|---:|---|---:|---:|---:|---:|---:|']
    for name in ('main', 'stress'):
        item = measured[name]
        dimensions = ', '.join(f'{width}×{height}' for width, height in item['resolutions'])
        lines.append(f'| {name} | {item["index"]["member_count"]} | {dimensions} | {item["vector_queries"]} | '
            f'{item["vector_query_p95_ms"]:.3f} | {item["candidates_per_query"]} | {item["cold_advised_p95_seconds"]:.3f} | {item["warm_p95_seconds"]:.3f} |')
    preparation = prepared['seconds']
    resources = measured['resources']
    lines += ['', f'扫描 {preparation["scan"]:.2f} 秒，首次编码 {preparation["encoding"]:.2f} 秒；'
        f'{prepared["throughput"]["encoded_images_per_second"]:.2f} 图/秒、{prepared["throughput"]["encoded_megapixels_per_second"]:.2f} MPixel/秒。', '',
        f'模型外进程附加 RSS 上界：{resources["additional_rss_upper_bound_bytes"] / 1024**2:.2f} MiB。'
        f'解码 {resources["decode_workers"]} 线程、{resources["decode_memory_mb"]} MiB 预算，FAISS {resources["faiss_threads"]} 线程。', '',
        '冷缓存采用逐文件 POSIX_FADV_DONTNEED 建议；系统缓存是否完全清除没有强制保证。测量原始数组、容量及进程口径见 [resources.json](resources.json)。', '',
        '## 增量与停止', '']
    if incremental:
        lines += [f'新增 {incremental["new_contents"]} 个内容，实际编码 {incremental["incremental"]["encoded_content_count"]} 个；'
            f'只改注解后编码 {incremental["annotation_only"]["encoded_content_count"]} 个。']
        cancellation = incremental['cancellation']
        if cancellation:
            lines += [f'观察到真实设备前向后请求取消，响应 {cancellation["response_seconds"]:.6f} 秒；'
                f'完成新内容 {cancellation["completed_new_contents"]}、失败新内容 {cancellation["failed_new_contents"]}。']
    else:
        lines += ['未验证；缺少 incremental.json。']
    missing = [name for name, value in measured['gates'].items() if not value]
    if incremental:
        missing += [name for name, value in incremental['gates'].items() if not value]
    else:
        missing.append('incremental_and_cancellation')
    lines += ['', '## 验收', '', '资源门槛：' + ('通过' if passed else '未通过或未验证'), '',
        '未满足项：' + (', '.join(missing) or '无'), '',
        '检索质量、人工确认真实难负例和完整用户链另行验收。', '']
    (output / 'resource-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    (output / 'resource-report.md').write_text('\n'.join(lines))
    return summary
