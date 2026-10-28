import numpy as np
import os
import threading
import json
import zipfile
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.feature.index import CorpusIndexes
from iad_core.feature.index_models import IndexLimits
from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord


@pytest.fixture
def corpus_vectors(tmp_path):
    db=Database(str(tmp_path/'index.db'))
    registry=DatasetRegistry(db)
    labels=tmp_path/'labels';labels.mkdir()
    datasets=[]
    for name,images in [('left',[('a','red'),('b','blue')]),('right',[('copy','red'),('c','green')])]:
        root=tmp_path/name;root.mkdir()
        for filename,color in images:Image.new('RGB',(32,32),color).save(root/(filename+'.png'))
        datasets.append(registry.import_labelme(DatasetImport(format='labelme',name=name,image_dir=str(root),annotation_dir=str(labels))))
    weights=tmp_path/'weights.pt';weights.write_bytes(b'index test vectors; no model inference')
    profile=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    ImageEncoders(db).register(profile)
    ids=[datasets[0].dataset.id+':a.png',datasets[0].dataset.id+':b.png',datasets[1].dataset.id+':c.png']
    groups=[PixelIndex(db).get(sample).content_group_id for sample in ids]
    for group,values in zip(groups,[(1,0),(.8,.6),(0,1)]):
        vector=np.zeros(512,dtype=np.float32);vector[:2]=values
        FeatureRepository(db).upsert(FeatureRecord(content_group_id=group,profile_id=profile.profile_id,
            dim=512,dtype='float32',embedding_blob=vector.tobytes()))
    return db,registry,datasets,profile,ids,groups


def test_cross_dataset_index_uses_one_row_per_content_and_exact_cosine_ranking(corpus_vectors):
    db,_,datasets,profile,ids,groups=corpus_vectors
    with CorpusIndexes(db) as indexes:
        info=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        assert info.vector_count==3 and info.member_count==4
        assert info.vector_bytes==3*512*4 and info.coverage.completed==4
        with indexes.acquire({'kind':'all_registered'},profile.profile_id) as index:
            query=np.zeros((1,512),dtype=np.float32);query[0,0]=1
            hits=index.search(query,top_k=3)[0]
            assert [hit.group_id for hit in hits]==groups
            assert [hit.score for hit in hits]==pytest.approx([1,.8,0],abs=1e-6)
            assert set(index.members(groups[0]))=={ids[0],datasets[1].dataset.id+':copy.png'}
        assert indexes.stats().builds==1 and indexes.stats().disk_loads==0


def test_hot_queries_reuse_memory_and_a_new_pool_loads_one_complete_artifact(corpus_vectors):
    db,_,_,profile,_,_=corpus_vectors
    query=np.zeros((1,512),dtype=np.float32);query[0,0]=1
    with CorpusIndexes(db) as indexes:
        original=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        for _ in range(5):
            with indexes.acquire({'kind':'all_registered'},profile.profile_id) as index:
                assert index.search(query,top_k=3)[0][0].score==1
        assert indexes.stats().queries==5 and indexes.stats().disk_loads==0 and indexes.stats().builds==1
    with CorpusIndexes(db) as indexes:
        loaded=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        assert loaded.generation==original.generation
        assert indexes.stats().disk_loads==1 and indexes.stats().builds==0


def test_failed_publication_preserves_the_old_memory_and_disk_index(corpus_vectors,monkeypatch):
    db,_,_,profile,_,_=corpus_vectors
    with CorpusIndexes(db) as indexes:
        original=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        from pathlib import Path
        before=Path(original.index_path).read_bytes()
        replace=os.replace
        def fail_publication(source,destination):
            if str(destination)==original.index_path:raise OSError('simulated publication failure')
            return replace(source,destination)
        with monkeypatch.context() as patch:
            patch.setattr(os,'replace',fail_publication)
            with pytest.raises(OSError,match='publication failure'):
                indexes.prepare({'kind':'all_registered'},profile.profile_id,force=True)
        with indexes.acquire({'kind':'all_registered'},profile.profile_id) as index:
            assert index.info.generation==original.generation
        assert Path(original.index_path).read_bytes()==before
        assert indexes.stats().reserved_bytes==indexes.stats().reserved_build_bytes==0
        assert not list(Path(original.index_path).parent.glob('*.tmp'))


def test_queries_keep_the_old_lease_while_an_index_is_published(corpus_vectors,monkeypatch):
    db,_,_,profile,_,_=corpus_vectors
    query=np.zeros((1,512),dtype=np.float32);query[0,0]=1
    with CorpusIndexes(db) as indexes:
        original=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        ready,resume=threading.Event(),threading.Event()
        replace=os.replace
        def delayed_publication(source,destination):
            if str(destination)==original.index_path:
                ready.set();assert resume.wait(5)
            return replace(source,destination)
        with monkeypatch.context() as patch,ThreadPoolExecutor(max_workers=1) as executor:
            patch.setattr(os,'replace',delayed_publication)
            future=executor.submit(indexes.prepare,{'kind':'all_registered'},profile.profile_id,force=True)
            assert ready.wait(5)
            with indexes.acquire({'kind':'all_registered'},profile.profile_id) as old:
                assert old.info.generation==original.generation
                assert old.search(query,top_k=1)[0][0].score==1
                resume.set();new=future.result(timeout=5)
                assert new.generation!=original.generation
                assert old.info.generation==original.generation
                with indexes.acquire({'kind':'all_registered'},profile.profile_id) as current:
                    assert current.info.generation==new.generation
                    assert indexes.stats().pinned_entries==2
        assert indexes.stats().resident_bytes==new.resident_bytes


def test_deletion_rebuilds_only_current_groups_and_a_live_lease_is_immutable(corpus_vectors):
    db,registry,datasets,profile,ids,groups=corpus_vectors
    with CorpusIndexes(db) as indexes:
        with indexes.acquire({'kind':'all_registered'},profile.profile_id) as original:
            registry.delete(datasets[0].dataset.id)
            with indexes.acquire({'kind':'all_registered'},profile.profile_id) as current:
                assert set(current.group_ids)=={groups[0],groups[2]}
                assert current.info.member_count==2
                assert current.members(groups[0])==(datasets[1].dataset.id+':copy.png',)
            assert len(original.group_ids)==3 and ids[0] in original.members(groups[0])
        assert indexes.stats().builds==2


def test_bounded_lru_does_not_evict_active_queries_and_released_leases_cannot_query(corpus_vectors):
    db,_,datasets,profile,_,_=corpus_vectors
    with CorpusIndexes(db,limits=IndexLimits(max_entries=1)) as indexes:
        with indexes.acquire({'kind':'datasets','dataset_ids':[datasets[0].dataset.id]},profile.profile_id) as first:
            with pytest.raises(ConsistencyError) as full:
                indexes.prepare({'kind':'datasets','dataset_ids':[datasets[1].dataset.id]},profile.profile_id)
            assert full.value.code=='RESOURCE_LIMIT'
        with pytest.raises(RuntimeError,match='closed'):first.members('anything')
        indexes.prepare({'kind':'datasets','dataset_ids':[datasets[1].dataset.id]},profile.profile_id)
        assert indexes.stats().cache_entries==1 and indexes.stats().evictions==1


@pytest.mark.parametrize('fault',['payload','metadata'])
def test_incomplete_or_inconsistent_artifacts_rebuild_from_sqlite(corpus_vectors,fault):
    db,_,_,profile,_,_=corpus_vectors
    with CorpusIndexes(db) as indexes:
        original=indexes.prepare({'kind':'all_registered'},profile.profile_id)
    path=Path(original.index_path)
    with zipfile.ZipFile(path) as archive:
        manifest=json.loads(archive.read('manifest.json'));payload=bytearray(archive.read('index.faiss'))
    if fault=='payload':payload[-1]^=1
    else:manifest['info']['vector_count']=999
    with zipfile.ZipFile(path,'w') as archive:
        archive.writestr('manifest.json',json.dumps(manifest))
        archive.writestr('index.faiss',payload)
    with CorpusIndexes(db) as indexes:
        repaired=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        assert repaired.vector_count==3 and repaired.generation!=original.generation
        assert indexes.stats().builds==1 and indexes.stats().invalid_artifacts==1


def test_concurrent_builds_reserve_cache_slots_before_publication(corpus_vectors,monkeypatch):
    db,_,datasets,profile,_,_=corpus_vectors
    ready,resume=threading.Event(),threading.Event()
    replace=os.replace
    def delayed_publication(source,destination):
        if not ready.is_set():
            ready.set();assert resume.wait(5)
        return replace(source,destination)
    with CorpusIndexes(db,limits=IndexLimits(max_entries=1)) as indexes,monkeypatch.context() as patch,ThreadPoolExecutor(max_workers=2) as executor:
        patch.setattr(os,'replace',delayed_publication)
        first=executor.submit(indexes.prepare,{'kind':'datasets','dataset_ids':[datasets[0].dataset.id]},profile.profile_id)
        try:
            assert ready.wait(5)
            second=executor.submit(indexes.prepare,{'kind':'datasets','dataset_ids':[datasets[1].dataset.id]},profile.profile_id)
            with pytest.raises(ConsistencyError) as full:
                second.result(timeout=1)
            assert full.value.code=='RESOURCE_LIMIT'
        finally:resume.set()
        first.result(timeout=5)
        assert indexes.stats().cache_entries==1


def test_profile_isolation_and_float16_storage_use_separate_fp32_indexes(corpus_vectors):
    db,_,_,profile,_,groups=corpus_vectors
    alternate=EmbeddingProfile.create(profile.model_id,profile.weights_ref,storage_dtype='float16')
    ImageEncoders(db).register(alternate)
    for group,values in zip(groups,[(0,1),(.6,.8),(1,0)]):
        vector=np.zeros(512,dtype=np.float16);vector[:2]=values
        FeatureRepository(db).upsert(FeatureRecord(content_group_id=group,profile_id=alternate.profile_id,
            dim=512,dtype='float16',embedding_blob=vector.tobytes()))
    query=np.zeros((1,512),dtype=np.float32);query[0,0]=2
    with CorpusIndexes(db) as indexes:
        with indexes.acquire({'kind':'all_registered'},profile.profile_id) as original:
            assert original.search(query,top_k=3)[0][0].group_id==groups[0]
        with indexes.acquire({'kind':'all_registered'},alternate.profile_id) as different:
            hits=different.search(query,top_k=3)[0]
            assert [hit.group_id for hit in hits]==groups[::-1]
            assert [hit.score for hit in hits]==pytest.approx([1,.6,0],abs=5e-4)
            assert different.info.vector_bytes==3*512*4
        assert query[0,0]==2 and indexes.stats().cache_entries==2


def test_partial_feature_coverage_is_explicit_and_updates_rebuild_from_cached_vectors(corpus_vectors):
    db,_,_,profile,_,groups=corpus_vectors
    repository=FeatureRepository(db)
    previous=repository.get(groups[1],profile.profile_id)
    repository.upsert(FeatureRecord(content_group_id=groups[1],profile_id=profile.profile_id,dim=512,dtype='float32',
        status='FAILED',error_code='ENCODER_UNAVAILABLE',error_message='recorded test failure'))
    with CorpusIndexes(db) as indexes:
        incomplete=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        assert incomplete.vector_count==2
        assert incomplete.coverage.total==4 and incomplete.coverage.completed==3 and incomplete.coverage.failed==1
        repository.upsert(FeatureRecord(content_group_id=groups[1],profile_id=profile.profile_id,dim=512,dtype='float32',embedding_blob=previous['embedding_blob']))
        ready=indexes.prepare({'kind':'all_registered'},profile.profile_id)
        assert ready.vector_count==3 and ready.coverage.completed==4
        assert ready.generation!=incomplete.generation


@pytest.mark.parametrize('limits',[IndexLimits(max_resident_bytes=1),IndexLimits(max_build_bytes=1)])
def test_memory_limits_reject_before_allocating_an_index(corpus_vectors,limits):
    db,_,_,profile,_,_=corpus_vectors
    with CorpusIndexes(db,limits=limits) as indexes:
        with pytest.raises(ConsistencyError) as limited:indexes.prepare({'kind':'all_registered'},profile.profile_id)
        assert limited.value.code=='RESOURCE_LIMIT'
        assert indexes.stats().resident_bytes==indexes.stats().reserved_bytes==indexes.stats().builds==0


def test_dataset_order_is_canonical_and_ui_filters_do_not_create_permanent_indexes(corpus_vectors):
    from iad_core.consistency.scopes import ConsistencyScopes
    db,registry,datasets,profile,_,_=corpus_vectors
    ids=[dataset.dataset.id for dataset in datasets]
    with CorpusIndexes(db) as indexes:
        first=indexes.prepare({'kind':'datasets','dataset_ids':ids},profile.profile_id)
        second=indexes.prepare({'kind':'datasets','dataset_ids':ids[::-1]},profile.profile_id)
        assert first.scope_id==second.scope_id and first.generation==second.generation
        frozen=ConsistencyScopes(db).resolve({'kind':'datasets','dataset_ids':ids})
        registry.rescan(datasets[0].dataset.id)
        with pytest.raises(ConsistencyError) as stale:indexes.prepare(frozen,profile.profile_id)
        assert stale.value.code=='SOURCE_UNAVAILABLE'
        with pytest.raises(ConsistencyError) as filters:
            indexes.prepare({'kind':'filtered','dataset_id':ids[0],'filters':{}},profile.profile_id)
        assert filters.value.code=='INVALID_SCOPE'


def test_visual_query_can_live_outside_the_corpus_and_self_does_not_consume_the_result(corpus_vectors):
    from iad_core.feature.search import search_by_sample
    from iad_core.workbench.runtime import close_workbenches
    db,_,datasets,profile,ids,_=corpus_vectors
    try:
        ranked=search_by_sample(ids[2],profile_id=profile.profile_id,top_k=1,db_path=db.db_path).items
        assert [hit.sample_id for hit in ranked]==[ids[1]]
        outside=search_by_sample(datasets[1].dataset.id+':copy.png',profile_id=profile.profile_id,top_k=1,
            corpus_scope={'kind':'datasets','dataset_ids':[datasets[0].dataset.id]},db_path=db.db_path).items
        assert [hit.sample_id for hit in outside]==[ids[0]]
    finally:close_workbenches()


def test_cached_index_without_faiss_reports_dependency_readiness(corpus_vectors):
    interpreter=Path('/tmp/iad-consistency-cpu/bin/python')
    if not interpreter.exists():pytest.skip('Base-only verification environment is not installed')
    db,_,_,profile,_,_=corpus_vectors
    with CorpusIndexes(db) as indexes:indexes.prepare({'kind':'all_registered'},profile.profile_id)
    code='''
import importlib.util,sys
from iad_core.feature.index import CorpusIndexes
from iad_core.storage.database import Database
from iad_core.consistency.errors import ConsistencyError
assert importlib.util.find_spec('faiss') is None
with CorpusIndexes(Database(sys.argv[1])) as indexes:
    try:indexes.prepare({'kind':'all_registered'},sys.argv[2])
    except ConsistencyError as error:assert error.code=='INDEX_NOT_READY'
    else:raise AssertionError('A cached file cannot replace the missing CPU search library')
'''
    result=subprocess.run([str(interpreter),'-c',code,db.db_path,profile.profile_id],capture_output=True,text=True,timeout=20)
    assert result.returncode==0,result.stderr


def test_visual_tool_reports_partial_corpus_without_claiming_full_coverage(corpus_vectors):
    from iad_core.tools.feature_tools import visual_search
    from iad_core.workbench.runtime import close_workbenches
    db,_,_,profile,ids,groups=corpus_vectors
    FeatureRepository(db).upsert(FeatureRecord(content_group_id=groups[1],profile_id=profile.profile_id,
        dim=512,dtype='float32',status='FAILED',error_code='ENCODER_UNAVAILABLE',error_message='recorded failure'))
    try:
        result=visual_search(ids[2],profile_id=profile.profile_id,db_path=db.db_path)
        assert result.status=='PARTIAL'
        assert result.metrics['corpus_coverage']=={'total':4,'completed':3,'failed':1,'unsupported':0,'pending':0}
        assert result.metrics['retrieval_completeness']=='TOP_K'
        assert result.metrics['group_count']==1 and result.metrics['results_count']==2
    finally:close_workbenches()
