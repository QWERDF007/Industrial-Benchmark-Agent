import time
import pytest

from iad_core.consistency.models import ConsistencyStart
from iad_core.workbench.runtime import WorkbenchRuntime


@pytest.mark.parametrize('mode', ['exact', 'combined', 'visual', 'index'])
def test_missing_pixel_index_rejects_batch_before_creating_jobs(dataset, tmp_path, mode):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.models import ImageIndexPrepare
    from tests.feature_fixtures import configure_test_encoder

    db, registry, config = dataset
    configure_test_encoder(db, tmp_path)
    with db.connection() as connection:
        connection.execute('DELETE FROM sample_pixel_index WHERE sample_id=?', (config.dataset.id + ':dent.png',))
    runtime = WorkbenchRuntime(db)
    try:
        with pytest.raises(ConsistencyError, match='重扫') as failure:
            if mode == 'index':
                runtime.consistency.prepare(ImageIndexPrepare(request_id='missing-pixels'))
            else:
                runtime.consistency.start(ConsistencyStart(subjects={'kind': 'all_registered'}, mode=mode, request_id='missing-pixels'))
        assert failure.value.code == 'INDEX_NOT_READY'
        assert runtime.consistency.list().items == []
        registry.rescan(config.dataset.id)
        started = runtime.consistency.start(ConsistencyStart(subjects={'kind': 'all_registered'}, mode='exact', request_id='after-rescan'))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            batch = runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert batch.status == 'COMPLETED'
        assert (batch.completed, batch.failed, batch.unprocessed) == (4, 0, 0)
    finally:
        runtime.close()


def test_exact_batch_uses_real_dataset_children_and_frozen_pair_evidence(dataset):
    db,_,config=dataset
    runtime=WorkbenchRuntime(db)
    try:
        request=ConsistencyStart(subjects={'kind':'all_registered'},mode='exact',request_id='exact-first')
        started=runtime.consistency.start(request)
        assert started.kind=='started'
        catalog = runtime.consistency.list().model_dump(mode='json')
        listed = next(item for item in catalog['items'] if item['batch_id'] == started.batch_id)
        assert listed['scopes']['subjects']['sample_count'] == 4
        assert 'samples' not in listed['scopes']['subjects']
        assert all('sample_ids' not in child and 'request' not in child for child in listed['children'])
        assert runtime.consistency.start(request).batch_id==started.batch_id
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            batch=runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING','RUNNING'):break
            time.sleep(.01)
        assert batch.status=='COMPLETED'
        assert (batch.completed,batch.failed,batch.unprocessed,batch.total)==(4,0,0,4)
        assert len(batch.children)==1
        child=runtime.jobs.status(batch.children[0].run_id)
        assert child['dataset_id']==config.dataset.id and child['task_id']==config.task.task_id
        assert child['job_type']=='DATA_CONSISTENCY' and child['model_calls']==[]
        results=runtime.consistency.results(batch.batch_id)
        assert len(results)==1
        assert {results[0].sample_a,results[0].sample_b}=={config.dataset.id+':dent.png',config.dataset.id+':scratch.png'}
        from iad_core.consistency.service import ConsistencyService
        evidence=ConsistencyService(db).evidence(results[0].evidence_id)
        assert evidence.result.verification.relation=='EXACT'
    finally:runtime.close()


def test_visual_batch_prepares_query_subjects_outside_the_corpus_before_comparing(dataset, tmp_path, monkeypatch):
    from tests.feature_fixtures import configure_test_encoder, MockFeatureExtractor
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.storage.features import FeatureRepository
    from pathlib import Path
    from PIL import Image

    db, registry, config = dataset
    encoder = configure_test_encoder(db, tmp_path)
    query_root = tmp_path / 'query'; query_root.mkdir()
    Image.new('RGB', (320, 240), 'green').save(query_root / 'query.png')
    query = registry.import_labelme(DatasetImport(format='labelme', name='外部待检查集', image_dir=str(query_root), annotation_dir=str(query_root)))
    query_id = query.dataset.id + ':query.png'
    runtime = WorkbenchRuntime(db)
    monkeypatch.setattr(runtime.images, 'encode', lambda selection, images: MockFeatureExtractor(profile=selection.profile).encode_batch(images))
    try:
        started = runtime.consistency.start(ConsistencyStart(subjects={'kind': 'datasets', 'dataset_ids': [query.dataset.id]},
            corpus_scope={'kind': 'datasets', 'dataset_ids': [config.dataset.id]}, mode='combined', request_id='outside-corpus'))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            batch = runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert batch.status == 'COMPLETED', batch.model_dump()
        preparations = [child for child in batch.children if child.job_type == 'IMAGE_INDEX']
        assert len(preparations) == 2
        assert any(query_id in child.completed_sample_ids for child in preparations)
        assert FeatureRepository(db).get_for_sample(query_id, encoder.profile.profile_id) is not None
        assert runtime.indexes.stats().queries == runtime.indexes.stats().search_batches == 1
    finally:
        runtime.close()


def test_combined_batch_prepares_corpus_and_dataset_deletion_removes_its_history(dataset,tmp_path):
    from tests.feature_fixtures import configure_test_encoder,MockFeatureExtractor
    from iad_core.feature.cache import ContentFeatureCache
    from iad_core.storage.repositories import SampleRepository
    db,registry,config=dataset
    encoder=configure_test_encoder(db,tmp_path)
    ContentFeatureCache(db).prepare([sample.sample_id for sample in SampleRepository(db).list_by_task(config.task.task_id)],
        encoder,extractor=MockFeatureExtractor(profile=encoder.profile))
    runtime=WorkbenchRuntime(db)
    try:
        started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'all_registered'},mode='combined',request_id='combined'))
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            batch=runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING','RUNNING'):break
            time.sleep(.01)
        assert batch.status=='COMPLETED',batch.model_dump()
        assert (batch.completed,batch.failed,batch.unprocessed)==(4,0,0)
        assert [child.job_type for child in batch.children]==['IMAGE_INDEX','DATA_CONSISTENCY']
        assert runtime.indexes.stats().search_batches == 1
        assert runtime.indexes.stats().queries == 3
        assert batch.children[0].finished_at<=batch.children[1].started_at
        results=runtime.consistency.results(batch.batch_id)
        assert len(results)==6
        from iad_core.consistency.result_queries import ConsistencyQuery,ResultQueries
        from iad_core.consistency.errors import ConsistencyError
        import pytest
        queries=ResultQueries(db)
        request=ConsistencyQuery(selection={'kind':'batch','batch_id':batch.batch_id},page_size=1)
        page=queries.query(request);identities=[]
        assert page.total==6 and page.next_cursor
        with pytest.raises(ConsistencyError,match='different query'):
            queries.query(request.model_copy(update={'cursor':page.next_cursor,'relation':'EXACT'}))
        while True:
            identities.extend(item.result.result_id for item in page.items)
            if not page.next_cursor:break
            page=queries.query(request.model_copy(update={'cursor':page.next_cursor}))
        assert len(identities)==len(set(identities))==6
        assert queries.query(ConsistencyQuery(selection={'kind':'batch','batch_id':batch.batch_id},relation='EXACT')).total==1
        registry.delete(config.dataset.id)
        assert runtime.consistency.list().items == []
        with pytest.raises(ConsistencyError, match='does not exist'):
            runtime.consistency.status(batch.batch_id)
        from iad_core.consistency.service import ConsistencyService
        with pytest.raises(ConsistencyError, match='does not exist'):
            ConsistencyService(db).evidence(results[0].evidence_id)
    finally:runtime.close()


def test_cancelling_a_blocked_source_keeps_unprocessed_items_and_stops_new_children(dataset,tmp_path):
    import os,threading
    from pathlib import Path
    from PIL import Image
    from iad_core.dataset.registry import DatasetImport,DatasetRegistry

    db,_,config=dataset
    other=tmp_path/'other';other.mkdir();Image.new('RGB',(320,240),'blue').save(other/'copy.png')
    DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='另一个集',image_dir=str(other),annotation_dir=str(other)))
    source=Path(config.root)/'dent.png';payload=source.read_bytes();source.unlink();os.mkfifo(source)
    runtime=WorkbenchRuntime(db)
    released=False
    try:
        started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'all_registered'},request_id='cancel-blocked-source'))
        deadline=time.monotonic()+5
        while True:
            try:descriptor=os.open(source,os.O_WRONLY|os.O_NONBLOCK);break
            except OSError:
                if time.monotonic()>=deadline:raise
                time.sleep(.01)
        cancelled=runtime.consistency.cancel(started.batch_id)
        assert cancelled.cancel_requested
        os.write(descriptor,payload);os.close(descriptor);released=True
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            batch=runtime.consistency.status(started.batch_id)
            if batch.status=='CANCELLED':break
            time.sleep(.01)
        assert batch.status=='CANCELLED'
        assert batch.completed+batch.failed+batch.unprocessed==5
        assert batch.unprocessed>0 and len(batch.children)==1
        assert runtime.consistency.status(started.batch_id).children[0].cancel_requested
    finally:
        if not released:threading.Thread(target=lambda:source.write_bytes(payload),daemon=True).start()
        runtime.close();source.unlink();source.write_bytes(payload)


def test_batch_shows_the_query_being_read_before_its_outcome_is_available(dataset):
    import os, threading
    from pathlib import Path
    db, _, config = dataset
    identity = config.dataset.id + ':dent.png'
    source = Path(config.root) / 'dent.png'
    payload = source.read_bytes(); source.unlink(); os.mkfifo(source)
    runtime = WorkbenchRuntime(db)
    released = False
    try:
        started = runtime.consistency.start(ConsistencyStart(subjects={'kind': 'samples', 'sample_ids': [identity]}, request_id='show-active-query'))
        deadline = time.monotonic() + 5
        while True:
            try:
                descriptor = os.open(source, os.O_WRONLY | os.O_NONBLOCK); break
            except OSError:
                if time.monotonic() >= deadline: raise
                time.sleep(.01)
        state = runtime.consistency.status(started.batch_id)
        shown = state.children[0].current_sample
        runtime.consistency.cancel(started.batch_id)
        os.write(descriptor, payload); os.close(descriptor); released = True
        assert shown is not None and shown.sample_id == identity
        assert state.completed == 0 and state.unprocessed == 1
    finally:
        if not released: threading.Thread(target=lambda: source.write_bytes(payload), daemon=True).start()
        runtime.close(); source.unlink(); source.write_bytes(payload)


def test_empty_and_reused_request_ids_are_explicit(dataset):
    import pytest
    from iad_core.consistency.errors import ConsistencyError
    db,_,config=dataset;runtime=WorkbenchRuntime(db)
    try:
        request=ConsistencyStart(subjects={'kind':'filtered','dataset_id':config.dataset.id,'filters':{'search':'absent-image'}},request_id='nothing')
        result=runtime.consistency.start(request)
        assert result.kind=='no_work' and result.coverage.verification.total==0
        assert runtime.consistency.start(request)==result
        with pytest.raises(ConsistencyError,match='request_id'):
            runtime.consistency.start(ConsistencyStart(**{**request.model_dump(),'subjects':{'kind':'all_registered'}}))
    finally:runtime.close()


def test_index_preparation_uses_the_selected_profile_and_reuses_cached_content(dataset,tmp_path):
    from tests.feature_fixtures import configure_test_encoder,MockFeatureExtractor
    from iad_core.feature.cache import ContentFeatureCache
    from iad_core.consistency.models import ImageIndexPrepare
    from iad_core.storage.repositories import SampleRepository

    db,_,config=dataset
    encoder=configure_test_encoder(db,tmp_path)
    sample_ids=[sample.sample_id for sample in SampleRepository(db).list_by_task(config.task.task_id)]
    prepared=ContentFeatureCache(db).prepare(sample_ids,encoder,extractor=MockFeatureExtractor(profile=encoder.profile))
    assert prepared.encoded_content_count==3
    runtime=WorkbenchRuntime(db)
    try:
        started=runtime.consistency.prepare(ImageIndexPrepare(request_id='prepare-cached'))
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            batch=runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING','RUNNING'):break
            time.sleep(.01)
        assert batch.status=='COMPLETED' and batch.completed==batch.total==4
        assert all(child.job_type=='IMAGE_INDEX' and child.model_profile is None and child.model_calls==[] for child in batch.children)
        with runtime.indexes.acquire(batch.scopes.corpus,encoder.profile.profile_id) as index:
            assert index.info.vector_count==3 and index.info.member_count==4
    finally:runtime.close()


def test_batch_waits_in_existing_runner_queue_and_can_be_cancelled_before_start(dataset):
    import threading
    db,_,config=dataset
    runtime=WorkbenchRuntime(db)
    release=threading.Event();entered=threading.Event()
    sample_id=config.dataset.id+':normal.png'
    def occupied(context):
        entered.set()
        assert release.wait(10)
        context.record(sample_id)
    try:
        previous=runtime.jobs.start('DATA_CONSISTENCY',config.task.task_id,
            {'dataset_id':config.dataset.id,'sample_ids':[sample_id]},occupied,'已有任务')
        assert entered.wait(5)
        started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'samples','sample_ids':[sample_id]},request_id='queued-batch'))
        batch=runtime.consistency.status(started.batch_id)
        assert batch.status=='PENDING' and batch.children[0].status=='PENDING'
        assert batch.children[0].phase=='WAITING_RESOURCE'
        cancelled=runtime.consistency.cancel(batch.batch_id)
        assert cancelled.status=='CANCELLED' and cancelled.unprocessed==1
        assert runtime.jobs.status(previous['run_id'])['status']=='RUNNING'
    finally:release.set();runtime.close()


def test_retry_keeps_original_denominator_and_only_runs_unprocessed_samples(dataset):
    import os,threading
    from pathlib import Path
    db,_,config=dataset
    runtime=WorkbenchRuntime(db)
    source=Path(config.root)/'normal2.png';payload=source.read_bytes();source.unlink();os.mkfifo(source)
    released=False
    first=config.dataset.id+':normal.png';second=config.dataset.id+':normal2.png'
    try:
        started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'samples','sample_ids':[first,second]},request_id='retry-parent'))
        deadline=time.monotonic()+5
        while True:
            try:descriptor=os.open(source,os.O_WRONLY|os.O_NONBLOCK);break
            except OSError:
                if time.monotonic()>=deadline:raise
                time.sleep(.01)
        assert runtime.consistency.status(started.batch_id).completed==1
        runtime.consistency.cancel(started.batch_id)
        os.write(descriptor,payload);os.close(descriptor);released=True
        deadline=time.monotonic()+5
        while time.monotonic()<deadline and runtime.consistency.status(started.batch_id).status!='CANCELLED':time.sleep(.01)
        source.unlink();source.write_bytes(payload)
        retried=runtime.consistency.retry(started.batch_id,request_id='retry-child')
        assert runtime.consistency.retry(started.batch_id,request_id='retry-child').batch_id==retried.batch_id
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            batch=runtime.consistency.status(retried.batch_id)
            if batch.status not in ('PENDING','RUNNING'):break
            time.sleep(.01)
        assert batch.status=='COMPLETED' and batch.completed==batch.total==2
        assert batch.parent_batch_id==started.batch_id and batch.root_batch_id==started.batch_id
        assert batch.children[0].sample_ids==[second]
        assert runtime.consistency.status(started.batch_id).status=='CANCELLED'
    finally:
        if not released:threading.Thread(target=lambda:source.write_bytes(payload),daemon=True).start()
        runtime.close()
        if source.exists():source.unlink()
        source.write_bytes(payload)


def test_killed_batch_stays_interrupted_until_explicit_retry_with_original_scope(dataset):
    import os,select,subprocess,sys
    from pathlib import Path
    db,registry,config=dataset
    source=Path(config.root)/'normal2.png';payload=source.read_bytes();source.unlink();os.mkfifo(source)
    script='''import json,sys
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.consistency.models import ConsistencyStart
runtime=WorkbenchRuntime(Database(sys.argv[1]))
started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'samples','sample_ids':[sys.argv[2]]},request_id='killed-batch'))
print(started.batch_id,flush=True)
runtime.jobs.wait(runtime.consistency.status(started.batch_id).children[0].run_id,120)
'''
    process=subprocess.Popen([sys.executable,'-c',script,db.db_path,config.dataset.id+':normal2.png'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    runtime=None;descriptor=None
    try:
        assert select.select([process.stdout],[],[],10)[0]
        batch_id=process.stdout.readline().strip();assert batch_id.startswith('batch_')
        deadline=time.monotonic()+5
        while True:
            try:descriptor=os.open(source,os.O_WRONLY|os.O_NONBLOCK);break
            except OSError:
                if time.monotonic()>=deadline:raise
                time.sleep(.01)
        process.kill();process.wait(timeout=5)
        os.close(descriptor);descriptor=None
        source.unlink();source.write_bytes(payload)
        runtime=WorkbenchRuntime(db)
        interrupted=runtime.consistency.status(batch_id)
        assert interrupted.status=='INTERRUPTED' and interrupted.unprocessed==1
        assert interrupted.children[0].status=='INTERRUPTED'
        restored=runtime.consistency.start(ConsistencyStart(subjects={'kind':'samples','sample_ids':[config.dataset.id+':normal2.png']},request_id='killed-batch'))
        assert restored.batch_id==batch_id and restored.status=='INTERRUPTED'
        retried=runtime.consistency.retry(batch_id,request_id='recover-killed')
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            state=runtime.consistency.status(retried.batch_id)
            if state.status not in ('PENDING','RUNNING'):break
            time.sleep(.01)
        assert state.status=='COMPLETED' and state.completed==state.total==1
        registry.rescan(config.dataset.id)
        import pytest
        from iad_core.consistency.errors import ConsistencyError
        with pytest.raises(ConsistencyError,match='scan changed'):
            runtime.consistency.retry(batch_id,request_id='obsolete-scan')
    finally:
        if process.poll() is None:process.kill();process.wait(timeout=5)
        if descriptor is not None:os.close(descriptor)
        if runtime is not None:runtime.close()
        source.unlink();source.write_bytes(payload)


def test_index_batch_counts_supported_samples_separately_from_unsupported_content(dataset,tmp_path):
    from PIL import Image
    from pathlib import Path
    from tests.feature_fixtures import configure_test_encoder,MockFeatureExtractor
    from iad_core.feature.cache import ContentFeatureCache
    from iad_core.consistency.models import ImageIndexPrepare
    from iad_core.storage.repositories import SampleRepository
    db,registry,config=dataset
    Image.new('F',(20,20),.5).save(Path(config.root)/'float.tiff')
    registry.rescan(config.dataset.id)
    encoder=configure_test_encoder(db,tmp_path)
    ContentFeatureCache(db).prepare([sample.sample_id for sample in SampleRepository(db).list_by_task(config.task.task_id)],
        encoder,extractor=MockFeatureExtractor(profile=encoder.profile))
    runtime=WorkbenchRuntime(db)
    try:
        started=runtime.consistency.prepare(ImageIndexPrepare(request_id='partial-index'))
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            state=runtime.consistency.status(started.batch_id)
            if state.status not in ('PENDING','RUNNING'):break
            time.sleep(.01)
        assert state.status=='PARTIAL'
        assert (state.completed,state.failed,state.unprocessed,state.total)==(4,1,0,5)
        assert state.children[0].failed_sample_ids==[config.dataset.id+':float.tiff']
        assert state.children[0].errors[0].code=='UNSUPPORTED_IMAGE'
    finally:runtime.close()


def test_shared_runner_limits_consistency_cpu_work_to_two_real_datasets(dataset,tmp_path):
    import threading
    from PIL import Image
    from iad_core.dataset.registry import DatasetImport
    db,registry,config=dataset
    sources=[(config,config.dataset.id+':normal.png')]
    for index in range(2):
        folder=tmp_path/f'resource-{index}';folder.mkdir();Image.new('RGB',(10,10),(index,0,0)).save(folder/'frame.png')
        imported=registry.import_labelme(DatasetImport(format='labelme',name=f'资源集{index}',image_dir=str(folder),annotation_dir=str(folder)))
        sources.append((imported,imported.dataset.id+':frame.png'))
    runtime=WorkbenchRuntime(db);release=threading.Event();entered=[threading.Event() for _ in sources]
    handles=[]
    def execute(context,index,sample_id):
        entered[index].set()
        assert release.wait(10)
        context.record(sample_id)
    try:
        for index,(dataset_config,sample_id) in enumerate(sources):
            handles.append(runtime.jobs.start('DATA_CONSISTENCY',dataset_config.task.task_id,
                {'dataset_id':dataset_config.dataset.id,'sample_ids':[sample_id]},
                lambda context,index=index,sample_id=sample_id:execute(context,index,sample_id),'资源上限验证')['run_id'])
        assert entered[0].wait(5) and entered[1].wait(5)
        assert runtime.jobs.status(handles[2])['status']=='PENDING' and not entered[2].is_set()
        assert sum(runtime.jobs.status(identity)['status']=='RUNNING' for identity in handles)==2
        runtime.jobs.cancel(handles[2],('DATA_CONSISTENCY',))
        release.set()
        for identity in handles[:2]:
            runtime.jobs.wait(identity,5)
            assert runtime.jobs.status(identity)['status']=='COMPLETED'
        assert runtime.jobs.status(handles[2])['status']=='CANCELLED' and not entered[2].is_set()
    finally:release.set();runtime.close()


def test_eighty_identical_members_reuse_pixel_proof_without_losing_last_annotation_conflicts(tmp_path):
    import json,threading
    from PIL import Image
    from iad_core.dataset.registry import DatasetImport,DatasetRegistry
    from iad_core.storage.database import Database
    from iad_core.duplicate.pixels import PixelContent
    from iad_core.consistency.result_queries import ConsistencyQuery,ResultQueries
    images=tmp_path/'duplicates';images.mkdir()
    for index in range(80):
        Image.new('RGB',(32,32),(90,110,130)).save(images/f'{index:03}.png')
        (images/f'{index:03}.json').write_text(json.dumps({'imageWidth':32,'imageHeight':32,'shapes':[
            {'label':'dent' if index==79 else 'scratch','shape_type':'rectangle','points':[[5,5],[15,15]]}]}))
    db=Database(str(tmp_path/'groups.db'))
    DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='80同图',image_dir=str(images),annotation_dir=str(images),
        annotation_policy={'policy_id':'same','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}))
    comparisons=0;guard=threading.Lock()
    def profile(frame,event,arg):
        nonlocal comparisons
        if event=='call' and frame.f_code is PixelContent.compare.__code__:
            with guard:comparisons+=1
    previous=threading.getprofile();threading.setprofile(profile)
    runtime=WorkbenchRuntime(db)
    try:
        started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'all_registered'},request_id='eighty'))
        deadline=time.monotonic()+120
        while time.monotonic()<deadline:
            state=runtime.consistency.status(started.batch_id)
            if state.status not in ('PENDING','RUNNING'):break
            time.sleep(.1)
        assert state.status=='COMPLETED' and state.completed==state.total==80
        assert state.pair_count==3160
        conflicts=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'batch','batch_id':state.batch_id},confirmed_conflict=True,page_size=100))
        assert conflicts.total==79
        assert all(item.sample_a.endswith('079.png') or item.sample_b.endswith('079.png') for item in conflicts.items)
        assert 1<=comparisons<=80,f'Full pixel comparisons: {comparisons}'
        print(json.dumps({'samples':state.total,'pair_results':state.pair_count,'last_member_conflicts':conflicts.total,'full_pixel_comparisons':comparisons}))
    finally:runtime.close();threading.setprofile(previous)
