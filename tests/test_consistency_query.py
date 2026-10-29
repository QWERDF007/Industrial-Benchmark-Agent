import pytest

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.result_queries import ConsistencyQuery,ResultQueries
from iad_core.consistency.service import ConsistencyService


def test_scope_results_distinguish_rescanned_history_and_keep_existing_pages_frozen(dataset):
    db,registry,config=dataset
    service=ConsistencyService(db)
    first=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png'))
    second=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':normal.png',sample_b=config.dataset.id+':normal2.png'))
    assert service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png'))==first
    queries=ResultQueries(db)
    request=ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}},page_size=1)
    page=queries.query(request)
    assert page.total==2 and page.next_cursor
    assert page.items[0].facts_state=='CURRENT'
    assert page.scopes.subjects.sample_count==4
    assert 'samples' not in page.model_dump(mode='json')['scopes']['subjects']
    from iad_core.consistency.result_snapshot import ResultSnapshots
    assert len(ResultSnapshots(db).get(page.query_id).scopes.subjects.samples) == 4
    registry.rescan(config.dataset.id)
    current=queries.query(request)
    assert current.total==0
    historical=queries.query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'},'facts':'HISTORICAL'}))
    assert historical.total==2
    assert all(item.facts_state=='HISTORICAL' for item in historical.items)
    following=queries.query(request.model_copy(update={'cursor':page.next_cursor}))
    assert following.query_id==page.query_id and following.observed_at==page.observed_at
    assert {page.items[0].result.result_id,following.items[0].result.result_id}=={first.result_id,second.result_id}
    assert following.items[0].facts_state=='CURRENT'
    with pytest.raises(ConsistencyError,match='different query'):
        queries.query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'samples','sample_ids':[config.dataset.id+':dent.png']}},cursor=page.next_cursor,page_size=1))


def test_scope_report_reuses_completed_batches_without_adding_their_denominators(dataset,tmp_path):
    import time
    from PIL import Image
    from iad_core.consistency.reports import ConsistencyReports
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.dataset.registry import DatasetImport
    from iad_core.workbench.runtime import WorkbenchRuntime
    db,registry,_=dataset
    runtime=WorkbenchRuntime(db)
    try:
        for request_id in ('report-first','report-again'):
            started=runtime.consistency.start(ConsistencyStart(subjects={'kind':'all_registered'},request_id=request_id))
            deadline=time.monotonic()+10
            while time.monotonic()<deadline:
                batch=runtime.consistency.status(started.batch_id)
                if batch.status not in ('PENDING','RUNNING'):break
                time.sleep(.01)
            assert batch.status=='COMPLETED'
        report=ConsistencyReports(db).report(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
        assert report.page.execution.total==report.page.execution.completed==4
        assert report.page.execution.pending==0 and report.page.retrieval_completeness=='EXACT_SCOPE'
        assert report.statistics.current.pairs==1 and report.statistics.current.strict_groups==1
        assert report.statistics.current.strict_members==2
        assert report.statistics.current.regional_differences>=1
        from iad_core.consistency.group_queries import GroupQueries,GroupQuery,GroupMemberQuery
        groups=GroupQueries(db).query(GroupQuery(query_id=report.page.query_id))
        assert groups.total==1 and groups.items[0].member_count==2 and groups.items[0].pair_count==1
        members=GroupQueries(db).members(GroupMemberQuery(query_id=report.page.query_id,group_id=groups.items[0].group_id,page_size=1))
        assert members.total==2 and len(members.items)==1
        following=GroupQueries(db).members(GroupMemberQuery(query_id=report.page.query_id,group_id=groups.items[0].group_id,page=2,page_size=1))
        assert members.items[0].sample_id!=following.items[0].sample_id
        extra=tmp_path/'more';extra.mkdir();Image.new('RGB',(20,20),'red').save(extra/'new.png')
        registry.import_labelme(DatasetImport(format='labelme',name='新检索库成员',image_dir=str(extra),annotation_dir=str(extra)))
        expanded=ConsistencyReports(db).report(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
        assert expanded.page.execution.total==expanded.page.execution.pending==5
        assert expanded.page.execution.completed==0 and expanded.page.retrieval_completeness=='PARTIAL'
        assert expanded.statistics.current.pairs==1
    finally:runtime.close()


def test_scope_deduplicates_pair_orientation_and_reports_corrupt_evidence_as_unknown(dataset):
    from pathlib import Path
    from iad_core.consistency.reports import ConsistencyReports
    db,_,config=dataset;service=ConsistencyService(db)
    a=config.dataset.id+':dent.png';b=config.dataset.id+':scratch.png'
    service.compare(ConsistencyCompare(sample_a=a,sample_b=b))
    latest=service.compare(ConsistencyCompare(sample_a=b,sample_b=a))
    request=ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}})
    report=ConsistencyReports(db).report(request)
    assert report.page.total==report.statistics.current.pairs==1
    assert report.page.items[0].result.result_id==latest.result_id
    assert report.page.execution.pending==4 and report.page.execution.completed==0
    assert report.page.retrieval_completeness=='PARTIAL'
    assert report.pending_review == len(latest.annotation.differences) and report.pending_correction == 0 and report.gold_excluded == 4
    path=service.evidence_media(latest.evidence_id,'left-original')['path'];Path(path).write_bytes(b'corrupt retained image')
    unavailable=ConsistencyReports(db).report(request.model_copy(update={'selection':request.selection.model_copy(update={'facts':'UNKNOWN'})}))
    assert unavailable.statistics.unknown.pairs==2
    assert unavailable.statistics.current.pairs==0
    assert all(not item.evidence_available and item.facts_state=='UNKNOWN' for item in unavailable.page.items)
    assert ConsistencyReports(db).report(request).page.total==0


def test_scope_results_do_not_treat_unknown_policy_as_confirmed_conflicts(dataset):
    db,_,config=dataset;service=ConsistencyService(db)
    service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png'))
    result=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}},confirmed_conflict=True))
    assert result.total==0
