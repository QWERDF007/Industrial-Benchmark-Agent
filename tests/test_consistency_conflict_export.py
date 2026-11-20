import json
import zipfile
from pathlib import Path
from uuid import uuid4

import httpx
import pytest
from PIL import Image

from iad_core.consistency.conflict_export import ConsistencyConflictExport
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.dataset.registry import DatasetRegistry
from iad_core.dataset.folder_preview import preview_folder_dataset
from tests.test_consistency_agent_preparation import wait_for_preparation


@pytest.fixture
def completed_conflicts(native_audit, tmp_path):
    jobs, _, _, _ = native_audit
    root = tmp_path/'pairs'
    rules = [dict(path='ok', role='normal'), dict(path='ng', role='anomaly')]
    for folder in ('ok', 'ng'):
        (root/folder).mkdir(parents=True)
        Image.new('RGB', (32, 32), 'red').save(root/folder/'same.png')
    from iad_core.task.config import FolderRule
    preview = preview_folder_dataset(str(root), rules=[FolderRule(**r) for r in rules])
    config = DatasetRegistry(jobs.db).import_dataset(dict(format='folder_classification', name='配对集',
        root_dir=str(root), rules=rules, preview_fingerprint=preview.preview_fingerprint))
    checks = ConsistencyAgentJobs(jobs.runtime)
    run_id = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[config.dataset.id], mode='exact'))['run_id']
    wait_for_preparation(ConsistencyAgentPreparation(jobs.runtime), run_id)
    review = ConsistencyAgentReview(jobs.runtime)
    for anchor in checks.anchors(run_id):
        checks.session_created(run_id, anchor.anchor_id)
        checks.retrieve(run_id, anchor.anchor_id)
        review.verify(run_id, anchor.anchor_id)
        review.finish_rules(run_id, anchor.anchor_id)
    checks.finish(run_id)
    return jobs, run_id, root


def test_markdown_lists_each_real_pair_once_without_reading_source_files(completed_conflicts):
    jobs, run_id, root = completed_conflicts
    for image in root.rglob('*.png'):
        image.unlink()
    result = ConsistencyConflictExport(jobs.db).build(run_id, format='markdown')
    artifact = Path(result['path'])
    try:
        assert artifact.suffix == '.md'
        assert result['filename'] == run_id + '-标注冲突.md'
        assert result['media_type'] == 'text/markdown; charset=utf-8'
        text = artifact.read_text(encoding='utf-8')
        assert text.startswith('# 标注冲突\n')
        assert run_id in text
        assert text.count('## 类别不一致\n') == 1
        assert '| 主图数据集 | 主图文件名 | 对比图数据集 | 对比图文件名 |' in text
        assert '| 配对集 | ng/same.png | 配对集 | ok/same.png |' in text
        assert len([line for line in text.splitlines() if line.startswith('| 配对集 |')]) == 1
        assert str(root) not in text
        assert '![' not in text and 'data:image' not in text
        assert all(label not in text for label in ('无候选', '无有效候选', '一致图像', '人工核对'))
    finally:
        artifact.unlink()


def test_markdown_rejects_jobs_without_actual_conflicts(native_audit):
    jobs, _, run_id, _ = native_audit
    with pytest.raises(ValueError, match='没有可导出的标注问题'):
        ConsistencyConflictExport(jobs.db).build(run_id, format='markdown')


def test_export_only_problems_includes_originals_and_absolute_paths(completed_conflicts):
    jobs, run_id, root = completed_conflicts
    result = ConsistencyConflictExport(jobs.db).build(run_id)
    with zipfile.ZipFile(result['path']) as archive:
        names = archive.namelist()
        markdown = [n for n in names if n.endswith('.md')]
        assert len(markdown) == 2
        assert all(n.startswith('类别不一致/配对集/') for n in markdown)
        assert len([n for n in names if n.endswith('.png')]) == 2
        text = archive.read(markdown[0]).decode()
        assert str(root/'ok'/'same.png') in text and str(root/'ng'/'same.png') in text
        assert all(n.split('/')[0] not in ('无候选','无有效候选','一致') for n in names)
    Image.new('RGB', (32, 32), 'blue').save(root/'ok'/'same.png')
    with pytest.raises(ValueError, match='变化'):
        ConsistencyConflictExport(jobs.db).build(run_id)


def test_markdown_uses_shared_priority_and_preserves_the_selected_direction(native_audit, tmp_path):
    from iad_core.workbench.vision import VlmClient

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = next(message['content'] for message in json.loads(request.content)['messages'] if message['role'] == 'user')
        facts = json.loads(content[1]['text'])['facts']
        main = next(source for source in facts['sources'].values() if source['sample_id'] == facts['anchor']['sample_id'])['annotations']
        reviews = {}
        for identity in facts['candidates']:
            candidate = next(source for source in facts['sources'].values() if source['sample_id'] == identity)['annotations']
            issues = []
            if main and candidate and main[0]['raw_label'] != candidate[0]['raw_label']:
                issues.append(dict(type='category_mismatch', main_annotation_ids=[main[0]['annotation_id']],
                    candidate_annotation_ids=[candidate[0]['annotation_id']], description='同一对象类别不同。'))
            if len(main) != len(candidate):
                issues.append(dict(type='extra_annotation' if len(main) > len(candidate) else 'missing_annotation',
                    main_annotation_ids=[a['annotation_id'] for a in main[len(candidate):]],
                    candidate_annotation_ids=[a['annotation_id'] for a in candidate[len(main):]], description='一侧多出完整实例。'))
            reviews[identity] = dict(verdict='MATERIAL', explanation='类别或实例数量存在冲突。', issues=issues,
                limitations=[], disputed_regions=[])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({'reviews': reviews})}}]})

    jobs, _, _, _ = native_audit
    registry = DatasetRegistry(jobs.db)
    datasets = []
    for index, name in enumerate(('主|集`', '对比_集')):
        images, labels = tmp_path / f'images-{index}', tmp_path / f'labels-{index}'
        (images / 'nested').mkdir(parents=True)
        (labels / 'nested').mkdir(parents=True)
        for filename, color in [('both.png', 'blue'), ('instance.png', 'green'), ('normal.png', 'yellow')]:
            Image.new('RGB', (40, 40), color).save(images / 'nested' / filename)
            shapes = [] if filename == 'normal.png' else [dict(label='scratch' if index == 0 else 'dent',
                shape_type='rectangle', points=[[1, 1], [9, 9]])]
            if filename == 'instance.png' and index == 0:
                shapes = []
            if filename == 'both.png' and index == 1:
                shapes.append(dict(label='dent', shape_type='rectangle', points=[[20, 20], [30, 30]]))
            (labels / 'nested' / Path(filename).with_suffix('.json')).write_text(json.dumps(dict(
                imageWidth=40, imageHeight=40, shapes=shapes)))
        datasets.append(registry.import_dataset(dict(format='labelme', name=name,
            image_dir=str(images), annotation_dir=str(labels))).dataset.id)
    checks = ConsistencyAgentJobs(jobs.runtime)
    run_id = checks.start(dict(submission_id=str(uuid4()), dataset_ids=datasets, mode='exact'))['run_id']
    wait_for_preparation(ConsistencyAgentPreparation(jobs.runtime), run_id)
    review = ConsistencyAgentReview(jobs.runtime, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    for anchor in checks.anchors(run_id):
        checks.session_created(run_id, anchor.anchor_id)
        selected = checks.retrieve(run_id, anchor.anchor_id)
        review.verify(run_id, anchor.anchor_id)
        if review.finish_rules(run_id, anchor.anchor_id) is None:
            observed = review.observe(run_id, anchor.anchor_id, dict(request_id=str(uuid4()), fingerprint=selected.fingerprint,
                candidate_ids=[item.sample_id for item in selected.candidates], question='核对类别与完整实例。'))
            saved = [review.assess(run_id, anchor.anchor_id, dict(fingerprint=selected.fingerprint,
                observation_ids=[observed.observation_id], assessment=observation.assessment.model_dump()))
                for observation in observed.result.observations]
            review.finalize(run_id, anchor.anchor_id, dict(fingerprint=selected.fingerprint,
                assessment_ids=[record.assessment_id for record in saved]))
    checks.finish(run_id)
    for directory in (tmp_path / 'images-0', tmp_path / 'images-1', tmp_path / 'labels-0', tmp_path / 'labels-1'):
        for source in directory.rglob('*'):
            if source.is_file():
                source.unlink()
    exported = ConsistencyConflictExport(jobs.db).build(run_id, format='markdown')
    artifact = Path(exported['path'])
    try:
        text = artifact.read_text(encoding='utf-8')
        assert [line for line in text.splitlines() if line.startswith('## ')] == ['## 类别不一致', '## 少标实例']
        assert text.count('nested/both.png') == 2
        assert text.count('nested/instance.png') == 2
        assert 'normal.png' not in text
        assert '| 主\\|集\\` | nested/instance.png | 对比\\_集 | nested/instance.png |' in text
        assert '多标实例' not in text
        assert str(tmp_path) not in text
    finally:
        artifact.unlink()
