from uuid import uuid4

from PIL import Image

from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.dataset.registry import DatasetRegistry
from iad_core.duplicate.pixels import PixelContent
from iad_core.storage.repositories import SampleRepository


def test_manifest_freeze_does_not_decode_registered_pixels_and_evidence_rejects_changed_sources(agent_jobs, monkeypatch):
    jobs, dataset_id, role = agent_jobs
    sample_id = dataset_id + ':normal.png'
    request = dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[dataset_id],
        normal_images=[sample_id],prompt={'text':'观察冻结来源。'})
    def reject_decode(*args, **kwargs):
        raise AssertionError('冻结登记清单不应重新解码已登记图像')
    with monkeypatch.context() as patch:
        patch.setattr(PixelContent,'read',reject_decode)
        first = jobs.start(request,agent=role)
        frozen = jobs.snapshot(first['run_id'])
    Image.new('RGB',(320,240),'red').save(SampleRepository(jobs.db).get(sample_id).image_path)
    page = AnalysisEvidence(jobs).read(first['run_id'],{'sample_id':sample_id})
    assert page.images == []
    assert page.error == '源图或标注版本与冻结清单不一致'
    DatasetRegistry(jobs.db).rescan(dataset_id)
    jobs.cancel(first['run_id'])
    second = jobs.start({**request,'submission_id':str(uuid4())},agent=role)
    changed = jobs.snapshot(second['run_id'])
    old = next(record for record in frozen.manifest.records if record.sample.sample_id==sample_id)
    new = next(record for record in changed.manifest.records if record.sample.sample_id==sample_id)
    assert old.source_fingerprint != new.source_fingerprint
    assert jobs.snapshot(first['run_id']) == frozen
    assert AnalysisEvidence(jobs).read(second['run_id'],{'sample_id':sample_id}).error is None
