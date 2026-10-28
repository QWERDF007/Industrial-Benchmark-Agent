import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import threading
import os
import pytest

from iad_core.consistency.errors import ConsistencyError
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord
from iad_core.storage.repositories import SampleRepository

from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoders
from iad_core.storage.database import Database
from tests.feature_fixtures import MockFeatureExtractor


@pytest.fixture
def content_cache_env(tmp_path):
    images,labels=tmp_path/'images',tmp_path/'labels'
    images.mkdir();labels.mkdir()
    for name,color in [('a','red'),('copy','red'),('b','blue')]:
        Image.new('RGB',(32,32),color).save(images/(name+'.png'))
    db=Database(str(tmp_path/'cache.db'))
    registry=DatasetRegistry(db)
    dataset=registry.import_labelme(DatasetImport(format='labelme',name='cache',image_dir=str(images),annotation_dir=str(labels)))
    weights=tmp_path/'weights.pt';weights.write_bytes(b'dispatch-only fixture')
    profile=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    config=ImageEncoderConfig(profile=profile)
    encoder=MockFeatureExtractor(profile=profile)
    ids=[dataset.dataset.id+':'+name+'.png' for name in ('a','copy','b')]
    return db,registry,dataset,config,encoder,ids


def test_copies_share_one_vector_and_annotation_changes_do_not_encode(content_cache_env):
    db,registry,dataset,config,encoder,ids=content_cache_env
    cache=ContentFeatureCache(db)
    labels=Path(dataset.annotations.root)
    first=cache.prepare(ids,config,extractor=encoder)
    assert first.total_samples==3 and first.total_content==2
    assert first.encoded_content_count==2 and first.cache_hit_count==0 and first.failed_count==0
    assert first.encoded_pixels == 2048
    assert first.completed_samples==3 and first.storage_bytes==2*512*4
    (labels/'a.json').write_text(json.dumps({'imageWidth':32,'imageHeight':32,'shapes':[
        {'label':'dent','shape_type':'rectangle','points':[[1,1],[4,4]]}]}))
    registry.rescan(dataset.dataset.id)
    second=cache.prepare(ids,config,extractor=encoder)
    assert second.encoded_content_count==0 and second.cache_hit_count==2 and second.completed_samples==3
    assert second.encoded_pixels == 0


def test_decoded_memory_budget_limits_real_image_batches_before_the_encoder(content_cache_env):
    db, registry, dataset, config, _, ids = content_cache_env
    for name, color in [('a', 'red'), ('copy', 'red'), ('b', 'blue')]:
        Image.new('RGB', (512, 512), color).save(Path(dataset.root) / (name + '.png'))
    registry.rescan(dataset.dataset.id)
    settings = ImageEncoders(db).read()
    assert settings.resources.decode_workers == 2
    limited = ImageEncoderConfig(profile=config.profile, batch_size=8, decode_memory_mb=3)

    class ObservedEncoder(MockFeatureExtractor):
        batches = []
        def encode_batch(self, images):
            self.batches.append(len(images))
            return super().encode_batch(images)

    encoder = ObservedEncoder(profile=config.profile)
    result = ContentFeatureCache(db).prepare(ids, limited, extractor=encoder)
    assert encoder.batches == [1, 1]
    assert result.encoded_pixels == 524288
    assert result.decode_reserved_peak_bytes <= 3 * 1024**2


def test_default_two_decode_workers_cancel_before_encoding_without_failed_records(content_cache_env):
    db, _, _, config, encoder, ids = content_cache_env
    entered, release, stopped = threading.Event(), threading.Event(), threading.Event()
    threads, lock = set(), threading.Lock()

    def checkpoint():
        if threading.current_thread().name.startswith('iad-image-decode'):
            with lock:
                threads.add(threading.get_ident())
                if len(threads) == 2:
                    entered.set()
            assert release.wait(5)
        if stopped.is_set():
            raise InterruptedError('Cancelled while original images were being decoded')

    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(ContentFeatureCache(db).prepare, ids, config, extractor=encoder, checkpoint=checkpoint)
        try:
            assert entered.wait(3)
        finally:
            stopped.set(); release.set()
        with pytest.raises(InterruptedError):
            future.result(timeout=5)
    assert len(threads) == 2
    assert all(FeatureRepository(db).get_for_sample(identity, config.profile.profile_id) is None for identity in ids)


def test_decode_resources_can_be_saved_without_requiring_a_visual_model(tmp_path):
    from iad_core.feature.profiles import ImageResources
    db = Database(str(tmp_path / 'resources.db'))
    settings = ImageEncoders(db)
    resources = ImageResources(decode_workers=3, decode_memory_mb=64)
    saved = settings.save(ImageEncoderEdit(expected_revision=0, selection=None, resources=resources))
    assert saved.selection is None and saved.resources == resources
    assert settings.read().resources == resources


def test_deleting_one_dataset_keeps_the_shared_vector_until_its_last_member(content_cache_env,tmp_path):
    db,registry,dataset,config,encoder,ids=content_cache_env
    cache=ContentFeatureCache(db)
    cache.prepare(ids,config,extractor=encoder)
    original=FeatureRepository(db).get_for_sample(ids[0],config.profile.profile_id)
    images=tmp_path/'other';images.mkdir()
    Image.open(Path(dataset.root)/'a.png').save(images/'other.png',compress_level=0)
    other=registry.import_labelme(DatasetImport(format='labelme',name='other',image_dir=str(images),annotation_dir=dataset.annotations.root))
    other_id=other.dataset.id+':other.png'
    assert cache.prepare([other_id],config,extractor=encoder).encoded_content_count==0
    registry.delete(dataset.dataset.id)
    retained=FeatureRepository(db).get_for_sample(other_id,config.profile.profile_id)
    assert retained['embedding_blob']==original['embedding_blob'] and retained['attempt_count']==1
    registry.delete(other.dataset.id)
    assert FeatureRepository(db).get(original['content_group_id'],config.profile.profile_id) is None


def test_concurrent_requests_share_the_same_content_encoding(content_cache_env):
    db,_,_,config,_,ids=content_cache_env
    class CountedEncoder(MockFeatureExtractor):
        def __init__(self):
            super().__init__(profile=config.profile)
            self.encoded=0
            self.lock=threading.Lock()
        def encode_batch(self,images):
            with self.lock:self.encoded+=len(images)
            return super().encode_batch(images)
    encoder=CountedEncoder()
    with ThreadPoolExecutor(max_workers=2) as executor:
        results=list(executor.map(lambda _:ContentFeatureCache(db).prepare(ids,config,extractor=encoder),range(2)))
    assert encoder.encoded==2
    assert sorted(result.encoded_content_count for result in results)==[0,2]
    assert sorted(result.cache_hit_count for result in results)==[0,2]


def test_failed_content_is_persisted_and_retry_does_not_encode_successes(content_cache_env):
    db,_,_,config,_,ids=content_cache_env
    class SelectiveEncoder(MockFeatureExtractor):
        fail=True
        def encode_batch(self,images):
            if self.fail and any(image.getpixel((0,0))==(255,0,0) for image in images):
                raise ConsistencyError('UNSUPPORTED_IMAGE','External encoder rejected red content')
            return super().encode_batch(images)
    encoder=SelectiveEncoder(profile=config.profile)
    cache=ContentFeatureCache(db)
    result=cache.prepare(ids,config,extractor=encoder)
    assert result.encoded_content_count==1 and result.failed_count==1 and result.completed_samples==1
    repository=FeatureRepository(db)
    red=PixelIndex(db).get(ids[0]).content_group_id
    failed=repository.get(red,config.profile.profile_id)
    assert failed['status']=='FAILED' and failed['error_code']=='UNSUPPORTED_IMAGE' and failed['attempt_count']==1
    encoder.fail=False
    retried=cache.prepare(ids,config,extractor=encoder)
    assert retried.encoded_content_count==1 and retried.cache_hit_count==1 and retried.failed_count==0
    assert repository.get(red,config.profile.profile_id)['attempt_count']==2
    assert repository.get_for_sample(ids[2],config.profile.profile_id)['attempt_count']==1


def test_cancelled_cache_waiter_exits_without_marking_content_failed(content_cache_env):
    import time
    from filelock import FileLock
    db,_,_,config,_,ids=content_cache_env
    cancelled=threading.Event();entered=threading.Event()
    def checkpoint():
        entered.set()
        if cancelled.is_set():raise InterruptedError('Stopped while waiting for the shared encoder')
    with ThreadPoolExecutor(max_workers=1) as executor:
        lock=FileLock(str(Path(db.db_path).resolve())+'.features.'+config.profile.profile_id+'.lock')
        lock.acquire()
        try:
            future=executor.submit(ContentFeatureCache(db).prepare,ids,config,extractor=MockFeatureExtractor(profile=config.profile),checkpoint=checkpoint)
            assert entered.wait(2)
            time.sleep(.05);cancelled.set()
            with pytest.raises(InterruptedError):future.result(timeout=1)
        finally:lock.release()
    assert FeatureRepository(db).get_for_sample(ids[0],config.profile.profile_id) is None


@pytest.mark.parametrize('mutation',['missing','hidden_change'])
def test_unavailable_copy_does_not_destroy_another_members_shared_vector(content_cache_env,mutation):
    db,_,dataset,config,encoder,ids=content_cache_env
    cache=ContentFeatureCache(db)
    cache.prepare(ids,config,extractor=encoder)
    source=Path(dataset.root)/'a.png'
    if mutation=='missing':
        source.unlink()
    else:
        stat=source.stat()
        payload=bytearray(source.read_bytes());payload[-1]^=1
        source.write_bytes(payload)
        os.utime(source,ns=(stat.st_atime_ns,stat.st_mtime_ns))
    unavailable=cache.prepare([ids[0]],config,extractor=encoder,force=True)
    assert unavailable.failed_count==1 and unavailable.completed_samples==0
    assert unavailable.encoded_content_count==0
    retained=FeatureRepository(db).get_for_sample(ids[1],config.profile.profile_id)
    assert retained is not None and retained['attempt_count']==1


def test_profiles_and_views_have_independent_vectors(content_cache_env):
    db,_,dataset,config,encoder,ids=content_cache_env
    cache=ContentFeatureCache(db)
    cache.prepare(ids,config,extractor=encoder)
    original=FeatureRepository(db).get_for_sample(ids[0],config.profile.profile_id)
    profile=EmbeddingProfile.create(config.profile.model_id,config.profile.weights_ref,storage_dtype='float16')
    alternate=ImageEncoderConfig(profile=profile)
    result=cache.prepare(ids,alternate,extractor=MockFeatureExtractor(profile=profile))
    assert result.encoded_content_count==2 and result.storage_bytes==2*512*2
    repository=FeatureRepository(db)
    repository.upsert(FeatureRecord(content_group_id=original['content_group_id'],profile_id=config.profile.profile_id,
        view_key='roi:1,1,4,4',dim=512,dtype='float32',embedding_blob=original['embedding_blob']))
    assert repository.get(original['content_group_id'],profile.profile_id)['dtype']=='float16'
    assert repository.get(original['content_group_id'],config.profile.profile_id,'roi:1,1,4,4')['view_key']=='roi:1,1,4,4'
    assert repository.get_for_sample(ids[0],config.profile.profile_id)['attempt_count']==1
    assert len(repository.list_by_task(dataset.task.task_id,config.profile.profile_id))==3


def test_unindexed_samples_require_a_published_content_scan(content_cache_env):
    db,_,_,config,encoder,ids=content_cache_env
    samples=SampleRepository(db)
    original=samples.get(ids[0])
    samples.upsert(original.model_copy(update={'sample_id':'unindexed','relative_path':'unindexed.png'}))
    with pytest.raises(ConsistencyError) as failed:
        ContentFeatureCache(db).prepare(['unindexed'],config,extractor=encoder)
    assert failed.value.code=='INDEX_NOT_READY'
    assert FeatureRepository(db).get_for_sample('unindexed',config.profile.profile_id) is None


def test_rescan_during_encoding_does_not_claim_coverage_for_changed_content(content_cache_env):
    db,registry,dataset,config,_,ids=content_cache_env
    class ConcurrentChangeEncoder(MockFeatureExtractor):
        def encode_batch(self,images):
            Image.new('RGB',(32,32),'green').save(Path(dataset.root)/'a.png')
            registry.rescan(dataset.dataset.id)
            return super().encode_batch(images)
    with pytest.raises(ConsistencyError) as changed:
        ContentFeatureCache(db).prepare([ids[0]],config,extractor=ConcurrentChangeEncoder(profile=config.profile))
    assert changed.value.code=='SOURCE_UNAVAILABLE'
    assert FeatureRepository(db).get_for_sample(ids[0],config.profile.profile_id) is None
    assert FeatureRepository(db).get_for_sample(ids[1],config.profile.profile_id)['attempt_count']==1


def test_sample_coverage_tracks_the_selected_profile_and_baseline_reads_shared_cache(content_cache_env):
    from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner
    from iad_core.tools.task_tools import task_inspect
    from iad_core.workbench.query import WorkbenchQuery
    db,_,dataset,config,encoder,ids=content_cache_env
    ContentFeatureCache(db).prepare(ids,config,extractor=encoder)
    settings=ImageEncoders(db)
    settings.save(ImageEncoderEdit(expected_revision=0,selection=config))
    assert WorkbenchQuery(db).datasets()['datasets'][0]['feature_coverage_pct']==100
    assert task_inspect(dataset.task.task_id,db_path=db.db_path).metrics['features_cached']==3
    samples=SampleRepository(db)
    runner=FeatureMemoryBankRunner(db_path=db.db_path,profile_id=config.profile.profile_id)
    runner.prepare(dataset.task.task_id,'test-build',[samples.get(ids[0])])
    predictions=runner.predict([samples.get(ids[1]),samples.get(ids[2])],'test')
    assert predictions[0].image_score==pytest.approx(0,abs=1e-6)
    assert predictions[1].image_score>.5
    profile=EmbeddingProfile.create(config.profile.model_id,config.profile.weights_ref,storage_dtype='float16')
    settings.save(ImageEncoderEdit(expected_revision=1,selection=ImageEncoderConfig(profile=profile)))
    assert WorkbenchQuery(db).datasets()['datasets'][0]['feature_coverage_pct']==0
    assert task_inspect(dataset.task.task_id,db_path=db.db_path).metrics['features_cached']==0
    assert FeatureRepository(db).get_for_sample(ids[0],config.profile.profile_id)['attempt_count']==1
