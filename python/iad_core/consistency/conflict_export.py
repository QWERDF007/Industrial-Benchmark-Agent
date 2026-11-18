"""Export actual problem records and the original files used by their comparisons."""
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
from tempfile import NamedTemporaryFile
import zipfile

from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES
from iad_core.consistency.conflict_categories import CONFLICT_RULES
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.dataset.adapters import get_adapter
from iad_core.dataset.adapters.base import RawImage, RawAnnotation
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.files import file_sha256


class ConsistencyConflictExport:
    def __init__(self, db):
        self.db = db

    def build(self, run_id: str) -> dict:
        results = ConsistencyAgentResults(self.db)
        with self.db.connection() as connection:
            ids = {row[0] for row in connection.execute(
                "SELECT anchor_id FROM consistency_anchor_runs WHERE job_id=? AND json_array_length(result_json,'$.issues')>0", (run_id,))}
        if not ids:
            raise ValueError('该作业没有可导出的标注问题')
        records = results.conclusions(run_id, ids)
        configs, sources, documents = {}, {}, defaultdict(list)
        for record in records:
            for issue in record.result.issues:
                label = CONFLICT_RULES[ISSUE_CATEGORIES[issue.type]].label
                for reference in issue.evidence:
                    evidence_ref = next((ref for ref in record.evidence if ref.candidate_id == reference.candidate_id), None)
                    if evidence_ref is None:
                        raise ValueError('标注问题缺少实际比较引用：' + record.summary.anchor_id)
                    frozen = ConsistencyRepository(self.db).get(evidence_ref.evidence_id)
                    pair = {s.sample.sample_id: s for s in (frozen.sources.left, frozen.sources.right)}
                    main, candidate = pair[record.summary.anchor_id], pair[reference.candidate_id]
                    for source in (main, candidate):
                        sid = source.sample.sample_id
                        if sid in sources and sources[sid].source_sha256 != source.source_sha256:
                            raise ValueError('同一图像存在不同的冻结版本：' + sid)
                        sources[sid] = source
                        dataset = source.sample.dataset_id
                        if dataset not in configs:
                            configs[dataset] = DatasetRegistry(self.db).get(dataset)
                    documents[label, main.sample.sample_id].append((issue, main, candidate))
        directories = {sid: re.sub(r'[\\/:*?"<>|\x00-\x1f]', '_', config.dataset.name or sid)
            for sid, config in configs.items()}
        names = Counter(directories.values())
        directories = {sid: name+('__'+sid if names[name] > 1 else '') for sid, name in directories.items()}
        assets = {}
        for sid, source in sources.items():
            sample = source.sample
            relative = PurePosixPath(sample.relative_path)
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError('图像相对路径无效：' + sample.relative_path)
            image = Path(sample.image_path)
            if not image.is_file() or file_sha256(str(image)) != source.source_sha256:
                raise ValueError('原图缺失或已发生变化：' + str(image))
            target = PurePosixPath('图像与标注', directories[sample.dataset_id], relative)
            assets[str(target)] = (image, source.source_sha256)
            availability = source.annotations.availability
            if availability.origin == 'FILE':
                if not availability.source or not Path(availability.source).is_file():
                    raise ValueError('原始标注文件缺失：' + str(availability.source))
                annotation = Path(availability.source)
                adapter = get_adapter(configs[sample.dataset_id])
                annotation_digest = file_sha256(str(annotation))
                raw = adapter.load_annotations(RawImage(image_path=str(image), relative_path=sample.relative_path,
                    dataset_id=sample.dataset_id), sample.width, sample.height)
                fields = set(RawAnnotation.model_fields) - {'mask_png'}
                actual = [item.model_dump(include=fields) for item in raw.annotations]
                expected = [item.model_dump(include=fields) for item in source.annotations.annotations]
                masks_match = all(item.mask_png is None or hashlib.sha256(item.mask_png).hexdigest() == frozen.mask_sha256
                    for item, frozen in zip(raw.annotations, source.annotations.annotations))
                if raw.availability.source != availability.source or actual != expected or not masks_match or file_sha256(str(annotation)) != annotation_digest:
                    raise ValueError('原始标注缺失或已发生变化：' + str(annotation))
                annotation_target = str(target.with_suffix('.json'))
                digest = annotation_digest
                if annotation_target in assets and assets[annotation_target][1] != digest:
                    raise ValueError('导出标注路径冲突：' + annotation_target)
                assets[annotation_target] = (annotation, digest)
        with NamedTemporaryFile(prefix='iad-conflicts-', suffix='.zip', delete=False) as output:
            path = Path(output.name)
        try:
            with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
                for (label, sid), entries in documents.items():
                    sample = sources[sid].sample
                    target = PurePosixPath(label, directories[sample.dataset_id], sample.relative_path+'.md')
                    lines = [f'# {label}', '', f'主图：`{sample.image_path}`', '']
                    for issue, main, candidate in entries:
                        references = defaultdict(set)
                        for source in (main, candidate):
                            references[Path(source.sample.image_path).name].add(source.sample.image_path)
                        pattern = r'(?<![/\\\w])(?:'+'|'.join(re.escape(name) for name in sorted(references, key=len, reverse=True))+r')(?![\w.])'
                        description = re.sub(pattern, lambda match: '、'.join(sorted(references[match[0]])), issue.description)
                        suggestion = re.sub(pattern, lambda match: '、'.join(sorted(references[match[0]])), issue.review_suggestion)
                        lines.extend([f'## 与 `{candidate.sample.image_path}` 对比', '',
                            f'结论：{label}。', '', description, '',
                            f'主图完整路径：`{main.sample.image_path}`',
                            f'对比图完整路径：`{candidate.sample.image_path}`', '', suggestion, ''])
                    text = '\n'.join(lines)
                    archive.writestr(str(target), text)
                for target, (original, digest) in assets.items():
                    with original.open('rb') as src, archive.open(target, 'w', force_zip64=True) as dst:
                        copied = hashlib.sha256()
                        for block in iter(lambda: src.read(1024*1024), b''):
                            copied.update(block)
                            dst.write(block)
                    if copied.hexdigest() != digest:
                        raise ValueError('文件在导出过程中发生变化：' + str(original))
                archive.writestr('manifest.json', json.dumps({'job_id': run_id, 'problem_images': len(ids),
                    'files': {target: {'source_path': str(path), 'sha256': sha} for target, (path, sha) in assets.items()}}, ensure_ascii=False))
        except BaseException:
            path.unlink(missing_ok=True)
            raise
        return {'path': str(path), 'filename': run_id+'-标注冲突.zip', 'problem_images': len(ids)}
