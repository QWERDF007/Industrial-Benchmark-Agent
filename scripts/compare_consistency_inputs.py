"""Compare frozen candidates and actual model image payloads without changing a job."""

import argparse
import base64
import collections
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sqlite3

from iad_core.consistency.identity_models import candidate_pair_key
from iad_core.consistency.recorded_inputs import RecordedModelInputs
from iad_core.storage.call_payloads import CallPayloads


def compare_inputs(database: Path, control: dict, run_id: str, *, minimum_pairs: int = 0) -> dict:
    payloads = CallPayloads(str(database))
    with closing(sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True)) as connection:
        status = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0]

        def candidates(run):
            return {
                sid: json.loads(body)['candidates']
                for sid, body in connection.execute(
                    'SELECT anchor_id,candidates_json FROM consistency_anchor_runs WHERE job_id=? AND candidates_json IS NOT NULL',
                    (run,),
                )
            }

        control_candidates = candidates(control['run_id'])
        target_candidates = candidates(run_id)
        common_candidates = set(control_candidates) & set(target_candidates)
        assert common_candidates
        score_delta = 0.0
        for sid in common_candidates:
            left, right = (control_candidates[sid], target_candidates[sid])
            assert len(left) == len(right), (sid, 'candidate count')
            for old, current in zip(left, right):
                assert {k: v for k, v in old.items() if k != 'score'} == {
                    k: v for k, v in current.items() if k != 'score'
                }, (sid, 'candidate IDs, kinds, ranks or content groups')
                if old['score'] is None or current['score'] is None:
                    assert old['score'] == current['score']
                else:
                    score_delta = max(score_delta, abs(old['score'] - current['score']))
        assert score_delta <= 1e-06, (
            'candidate score drift exceeds float32 arithmetic tolerance',
            score_delta,
        )
        current_pairs = {
            key: json.loads(body)
            for key, body in connection.execute(
                'SELECT pair_key,result_json FROM consistency_pair_reviews WHERE job_id=? AND result_json IS NOT NULL',
                (run_id,),
            )
        }

        def media(record):
            return sorted(
                (
                    (
                        v['sha256'],
                        v['source_sha256'],
                        tuple(v['original_size']),
                        tuple(v['crop_bbox']),
                        tuple(v['sent_size']),
                    )
                    for v in record['media']
                )
            )

        def regions(record):
            roots = {
                'main': record['media'][0]['source_sha256'],
                'candidate': record['media'][1]['source_sha256'],
            }
            return sorted(
                (
                    json.dumps(
                        {
                            'mapping': p['mapping'],
                            'views': sorted(
                                [
                                    {
                                        'original': roots[side],
                                        'window': p[side + '_window'],
                                        'sha256': (
                                            p[side + '_media']['sha256'] if p[side + '_media'] else None
                                        ),
                                    }
                                    for side in ('main', 'candidate')
                                ],
                                key=lambda value: json.dumps(value, sort_keys=True),
                            ),
                            'annotations': sorted(
                                [
                                    {
                                        **{k: v for k, v in origin.items() if k != 'side'},
                                        'original': roots[origin['side']],
                                    }
                                    for origin in p['source_annotations']
                                ],
                                key=lambda value: json.dumps(value, sort_keys=True),
                            ),
                        },
                        sort_keys=True,
                    )
                    for p in record['region_pairs']
                )
            )

        def originals(record):
            return sorted(
                (
                    (
                        v['sha256'],
                        v['source_sha256'],
                        tuple(v['original_size']),
                        tuple(v['crop_bbox']),
                        tuple(v['sent_size']),
                    )
                    for v in record['media']
                    if v['role'] == 'overview'
                )
            )

        def source_annotations(record):
            roots = {
                'main': record['media'][0]['source_sha256'],
                'candidate': record['media'][1]['source_sha256'],
            }
            return sorted(
                {
                    json.dumps(
                        {
                            **{k: v for k, v in origin.items() if k != 'side'},
                            'original': roots[origin['side']],
                        },
                        sort_keys=True,
                    )
                    for region in record['region_pairs']
                    for origin in region['source_annotations']
                }
            )

        def windows_by_annotation(record):
            roots = {
                'main': record['media'][0]['source_sha256'],
                'candidate': record['media'][1]['source_sha256'],
            }
            return {
                tuple(sorted((origin['annotation_id'] for origin in region['source_annotations']))): {
                    roots[side]: region[side + '_window'] for side in ('main', 'candidate')
                }
                for region in record['region_pairs']
            }

        compared_pairs = [p for p in control['pairs'] if p['pair_key'] in current_pairs]
        control_inputs = RecordedModelInputs(connection, control['run_id'])
        pair_inputs = RecordedModelInputs(connection, run_id)
        relation_changes = []
        roi_changes = []
        identical_roi_inputs = 0
        for pair in compared_pairs:
            left = pair['result']['record']
            right = current_pairs[pair['pair_key']]['record']
            assert originals(left) == originals(right), (
                'Original PNG bytes, dimensions or full-resolution delivery changed',
                pair['pair_key'],
            )
            assert source_annotations(left) == source_annotations(right), (
                'Original annotation references or boxes changed',
                pair['pair_key'],
            )
            assert control_inputs.annotations(
                pair['result']['anchor_id'], left['candidate_id']
            ) == pair_inputs.annotations(
                current_pairs[pair['pair_key']]['anchor_id'], right['candidate_id']
            ), '对照作业的完整原始标注或策略改变'
            identical = media(left) == media(right) and regions(left) == regions(right)
            if identical:
                identical_roi_inputs += 1
            else:
                owner_changed = left['media'][0]['source_sha256'] != right['media'][0]['source_sha256']
                assert owner_changed, ('ROI inputs changed with the same shared owner', pair['pair_key'])
                old_windows, new_windows = (windows_by_annotation(left), windows_by_annotation(right))
                deltas = []
                for key in old_windows.keys() & new_windows.keys():
                    for source in old_windows[key].keys() & new_windows[key].keys():
                        old_box, new_box = (old_windows[key][source], new_windows[key][source])
                        if old_box is not None and new_box is not None:
                            deltas.extend((abs(a - b) for a, b in zip(old_box, new_box)))
                roi_changes.append(
                    {
                        'pair_key': pair['pair_key'],
                        'shared_owner_changed': True,
                        'old_roi_count': len(left['region_pairs']),
                        'current_roi_count': len(right['region_pairs']),
                        'same_annotation_region_groups': old_windows.keys() == new_windows.keys(),
                        'maximum_comparable_window_coordinate_delta': max(deltas, default=None),
                    }
                )
            assert set(right['required_region_pair_ids']) == {
                p['region_pair_id'] for p in right['region_checks'] + right['unmapped_region_checks']
            }
            if left['relation'] != right['relation']:
                relation_changes.append(
                    {
                        'pair_key': pair['pair_key'],
                        'anchor_id': current_pairs[pair['pair_key']]['anchor_id'],
                        'candidate_id': right['candidate_id'],
                        'control_relation': left['relation'],
                        'control_reason': left['reason'],
                        'new_relation': right['relation'],
                        'new_reason': right['reason'],
                    }
                )
        associations = collections.defaultdict(list)
        for call, key in connection.execute(
            'SELECT call_id,pair_key FROM model_call_pairs WHERE job_id=? ORDER BY rowid', (run_id,)
        ):
            associations[call].append(key)
        calls = list(
            connection.execute(
                """SELECT call_id,json_extract(summary_json,'$.source') FROM model_calls
            WHERE run_id=? AND json_extract(summary_json,'$.operation')='generate'""",
                (run_id,),
            )
        )
        verified = set()
        actual_calls = 0
        audit_calls = 0
        actual_images = 0
        empty_review_violations = []
        empty_identity_violations = []
        for call_id, source in calls:
            assert source == 'http', '输入核验要求保存实际HTTP请求的视觉作业'
            request, _ = payloads.read(run_id, call_id)
            body = json.loads(request)
            messages = body.get('input', body.get('messages', []))
            parts = next(
                (
                    message['content']
                    for message in messages
                    if message.get('role') == 'user' and isinstance(message.get('content'), list)
                )
            )
            context = json.loads(parts[1]['text'])
            sent = set()
            wire_images = {}
            image_groups = collections.defaultdict(list)
            bundle = {}
            view = {}
            for part in parts:
                text = part.get('text', '')
                if text.startswith('原图资料：'):
                    bundle = json.loads(text.removeprefix('原图资料：'))
                elif text.startswith(('图像视图：', '视觉证据：')):
                    view = json.loads(text.split('：', 1)[1])
                if part['type'] in ('input_image', 'image_url'):
                    url = part['image_url']
                    url = url['url'] if isinstance(url, dict) else url
                    sha = hashlib.sha256(base64.b64decode(url.split(',', 1)[1])).hexdigest()
                    sent.add(sha)
                    alias = (
                        bundle['region_pair_id'] + '_' + bundle['side']
                        if 'window_index' in bundle
                        else bundle.get('evidence_id', view.get('evidence_id'))
                    )
                    assert alias is not None, '实际图片缺少引用'
                    if call_id in associations:
                        assert alias not in wire_images, '实际身份请求的图片引用重复'
                    wire_images[alias] = (view, sha)
                    image_groups[bundle.get('evidence_id', alias)].append((view, sha))
                    actual_images += 1
            if call_id in associations:
                assert context['scope'] in ('joint', 'pairs')
                pair_contexts = context['pairs'].values() if context['scope'] == 'pairs' else [context]
                for pair_context in pair_contexts:
                    annotations = pair_context.get('annotations')
                    if annotations is not None and (not any(annotations.values())):
                        empty_identity_violations.append(call_id)
                assert len(pair_contexts) == len(associations[call_id]), '实际请求图像对数量改变'
                expected_images = set()
                for key, pair_context in zip(associations[call_id], pair_contexts):
                    if key not in current_pairs:
                        continue
                    record = current_pairs[key]['record']
                    expected_images.update(
                        pair_inputs.verify_pair(
                            current_pairs[key]['anchor_id'],
                            record['candidate_id'],
                            pair_context,
                            wire_images,
                            record['media'],
                        )
                    )
                    assert record['source'] == 'vision', ('Program pair sent to identity model', key)
                    assert {v['sha256'] for v in record['media']} <= sent, (
                        'Original or ROI absent from actual HTTP image payload',
                        key,
                    )
                    verified.add(key)
                if all(key in current_pairs for key in associations[call_id]):
                    assert wire_images.keys() == expected_images, '实际身份请求含有未属于本批图像对的图片'
                actual_calls += 1
            elif context.get('facts'):
                pair_inputs.verify_audit(call_id, context, image_groups)
                audit_calls += 1
                facts = context['facts']
                sources = (
                    {s['sample_id']: s for s in facts['sources'].values()}
                    if isinstance(facts['sources'], dict)
                    else {s['sample_id']: s for s in facts['sources']}
                )
                anchor = sources[facts['anchor']['sample_id']]
                for candidate in facts['candidates']:
                    if not anchor['annotations'] and (not sources[candidate]['annotations']):
                        empty_review_violations.append(candidate)
        assert not empty_review_violations, 'Both-empty pair entered annotation review'
        assert not empty_identity_violations, 'Both-empty pair entered identity model'
        program_rows = list(
            connection.execute(
                "SELECT anchor_id,candidate_id FROM consistency_candidate_records\n     WHERE job_id=? AND phase='gate' AND json_extract(record_json,'$.basis')='empty_annotations'\n     AND json_extract(record_json,'$.source')='program'",
                (run_id,),
            )
        )
        program = {candidate_pair_key(anchor, candidate) for anchor, candidate in program_rows}
        assert not set(program) & {key for keys in associations.values() for key in keys}
        proof = {
            'run_id': run_id,
            'status': status,
            'in_progress': status in ('PENDING', 'RUNNING'),
            'same_candidate_ids_kinds_ranks_and_content_groups': len(common_candidates),
            'maximum_candidate_score_absolute_difference': score_delta,
            'compared_visual_pairs': len(compared_pairs),
            'same_original_png_bytes_dimensions_and_original_annotation_boxes': len(compared_pairs),
            'same_full_original_annotations_and_policies': len(compared_pairs),
            'same_all_roi_bytes_coordinates_and_mapping_pairs': identical_roi_inputs,
            'roi_window_changes_after_shared_owner_reversal': roi_changes,
            'roi_identity_comparison': 'Original PNGs and annotation boxes must match. The same owner requires identical ROI inputs; owner reversals can change inverse-mapped crop rounding and are reported individually. Every current-plan ROI must still be present in actual HTTP payloads.',
            'same_relation_pairs': len(compared_pairs) - len(relation_changes),
            'relation_disagreements': relation_changes,
            'actual_http_identity_requests_verified': actual_calls,
            'actual_http_annotation_requests_verified': audit_calls,
            'actual_http_image_blocks': actual_images,
            'visual_pairs_with_actual_original_and_all_roi_delivery': len(verified),
            'both_empty_program_pairs': len(program),
            'both_empty_program_directed_gates': len(program_rows),
            'both_empty_model_calls': 0,
        }
        if status == 'COMPLETED':
            assert verified == {
                key for key, value in current_pairs.items() if value['record']['source'] == 'vision'
            }, 'Some completed visual pairs have no actual original/all-ROI delivery evidence'
            assert len(compared_pairs) >= minimum_pairs, '模型输入对照数量不足'
            if minimum_pairs:
                assert len(common_candidates) == len(control_candidates), '对照主图的候选清单尚未全部核验'
        return proof


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', type=Path, default=Path('data/benchmark.db'))
    parser.add_argument('--control-proof', type=Path, required=True)
    parser.add_argument('--job-id', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--minimum-pairs', type=int, default=0)
    args = parser.parse_args()
    if args.minimum_pairs < 0:
        parser.error('--minimum-pairs 必须非负')
    proof = compare_inputs(
        args.database,
        json.loads(args.control_proof.read_text()),
        args.job_id,
        minimum_pairs=args.minimum_pairs,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(proof, ensure_ascii=False, indent=2))
    summary = {
        key: value
        for key, value in proof.items()
        if key
        not in (
            'relation_disagreements',
            'roi_identity_comparison',
            'roi_window_changes_after_shared_owner_reversal',
        )
    }
    summary.update(
        relation_disagreements=len(proof['relation_disagreements']),
        owner_reversal_roi_changes=len(proof['roi_window_changes_after_shared_owner_reversal']),
    )
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
