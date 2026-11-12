import json
import subprocess
import sys
from uuid import uuid4

import pytest

from iad_core import entry
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration


def test_custom_complete_prompt_is_exactly_the_frozen_model_instruction():
    configuration = MiningPromptConfiguration(objective='比较边缘', directions=[], instruction='逐图比较原始标注与边缘，保留不确定项。')
    frozen = FrozenMiningPrompt.capture(configuration)
    assert frozen.instruction == configuration.instruction
    assert FrozenMiningPrompt.model_validate_json(frozen.model_dump_json()) == frozen


def test_default_mining_user_prompt_contains_the_task_without_system_workflow():
    frozen = FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='比较边缘', directions=[]))
    assert '比较边缘' in frozen.instruction
    assert 'analysis_images' not in frozen.instruction
    assert 'knowledge_commit' not in frozen.instruction


def test_sample_detail_reads_the_suggestions_fixed_native_knowledge_version(native_knowledge_versions,advisory_record):
    db,dataset_id,publications=native_knowledge_versions
    fixed=publications[0].version_id
    target=dataset_id+':dent.png'
    saved=advisory_record(db,target,label='FAIL',knowledge_version_id=fixed)
    detail=entry.sample_get({'sample_id':target},db.db_path)
    assert detail['suggestion']['suggestion_id'] == saved.suggestion_id
    assert detail['knowledge'] == entry.knowledge_get({'version_id':fixed},db.db_path)
    assert detail['knowledge']['version_id'] != publications[1].version_id
    assert detail['knowledge']['catalog']['checks'][0]['check_id'] == 'C1'


def test_support_and_counter_evidence_have_independent_filtered_pages(native_knowledge_versions):
    db, _, publications = native_knowledge_versions
    version_id = publications[0].version_id
    before = entry.knowledge_get({'version_id':version_id},db.db_path)
    query = dict(version_id=version_id,check_id='C1',page_size=1)
    support = entry.knowledge_details(dict(query,evidence_role='support'),db.db_path)
    counter = entry.knowledge_details(dict(query,evidence_role='counter'),db.db_path)
    second = entry.knowledge_details(dict(query,evidence_role='support',page=2),db.db_path)
    assert (support['total'],len(support['items']),len(second['items'])) == (3,1,1)
    assert support['check']['support_count'] == len(support['support_evidence_ids']) == 3
    assert counter['total'] == len(counter['items']) == 1
    assert set(item['sample_id'] for item in support['items']).isdisjoint(item['sample_id'] for item in counter['items'])
    assert len({item['sample_id'] for item in [*support['items'],*second['items'],*counter['items']]}) == 3
    assert entry.knowledge_details(dict(query,evidence_role='counter'),db.db_path) == counter
    assert entry.knowledge_get({'version_id':version_id},db.db_path) == before


def test_check_review_is_persistent_version_scoped_and_does_not_change_model_evidence(native_knowledge_versions):
    db, dataset_id, publications = native_knowledge_versions
    first, second = (publication.version_id for publication in publications)
    before = entry.knowledge_get({'version_id':first},db.db_path)
    query = {'version_id':first,'page_size':8}
    initial = entry.knowledge_details(query,db.db_path)
    assert (initial['items'][0]['review']['status'],initial['items'][0]['review']['revision']) == ('pending',0)
    submission = dict(version_id=first,check_id='C1',expected_revision=0,submission_id=str(uuid4()),status='rejected',note='需要另一视角。')
    saved = entry.knowledge_check_review(submission,db.db_path)
    assert saved['revision'] == 1
    assert entry.knowledge_check_review(submission,db.db_path) == saved
    assert entry.knowledge_details(dict(query,review_status='pending'),db.db_path)['total'] == 0
    assert entry.knowledge_details(dict(query,review_status='rejected',search='孔位'),db.db_path)['total'] == 1
    with pytest.raises(ValueError,match='已变化'):
        entry.knowledge_check_review(dict(submission,submission_id=str(uuid4()),status='confirmed'),db.db_path)
    with pytest.raises(ValueError,match='同一人工提交ID'):
        entry.knowledge_check_review(dict(submission,status='confirmed'),db.db_path)
    with pytest.raises(LookupError):
        entry.knowledge_check_review(dict(submission,submission_id=str(uuid4()),check_id='foreign-check'),db.db_path)
    latest = entry.knowledge_check_review(dict(submission,submission_id=str(uuid4()),expected_revision=1,status='confirmed'),db.db_path)
    assert latest['revision'] == 2
    assert entry.knowledge_check_review(submission,db.db_path) == saved
    detail = entry.knowledge_details(dict(query,check_id='C1'),db.db_path)
    assert detail['check']['review'] == latest
    assert detail['support_evidence_ids'] == before['catalog']['checks'][0]['support_evidence_ids']
    assert entry.knowledge_details({'version_id':second},db.db_path)['items'][0]['review']['status'] == 'pending'
    assert entry.knowledge_get({'version_id':first},db.db_path) == before
    metadata = entry.knowledge_versions({'dataset_id':dataset_id},db.db_path)
    assert metadata['current_version_id'] == second
    assert {version['version_id'] for version in metadata['versions']} == {first,second}
    response = subprocess.run([sys.executable,'-m','iad_core.entry','--query-worker'],
        input=json.dumps(dict(operation='knowledge_details',arguments=dict(query,check_id='C1'),db_path=db.db_path))+'\n',
        text=True,capture_output=True,check=True,timeout=10)
    assert json.loads(response.stdout)['data']['check']['review'] == latest


def test_knowledge_read_requires_one_native_run_or_fixed_version(native_knowledge_versions):
    db, _, publications = native_knowledge_versions
    first, second = publications
    assert entry.knowledge_get({'run_id':first.job_id},db.db_path)['publication']['version_id'] == first.version_id
    assert entry.knowledge_get({'version_id':second.version_id},db.db_path)['version_id'] == second.version_id
    for arguments in ({},{'dataset_id':first.coverage.records[0].dataset_id},
            {'run_id':first.job_id,'version_id':second.version_id}):
        with pytest.raises(ValueError,match='作业run_id或发布version_id之一'):
            entry.knowledge_get(arguments,db.db_path)


def test_selected_images_preserve_human_review_until_the_claim_changes(observed_claim):
    from iad_core.analysis.commits import AnalysisCommits
    from iad_core.analysis.publications import AnalysisPublications
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
    from iad_core.knowledge.models import KnowledgeCheckReviewSubmission, KnowledgeDetailQuery
    jobs, run_id, submission, whole_ids = observed_claim
    publications, reviews = AnalysisPublications(jobs.db), KnowledgeCheckReviews(jobs.db)
    first_id = jobs.cancel(run_id)['analysis_version_id']
    first = publications.get(first_id)
    confirmed = reviews.submit(KnowledgeCheckReviewSubmission(version_id=first_id,check_id='edge',
        expected_revision=0,submission_id=uuid4(),status='confirmed',note='主体外缘可复核。'))
    jobs.resume(run_id)
    context = jobs.context(run_id)
    round_id = jobs.snapshot(run_id).plan.rounds[-1].round_id
    check = submission['checks'][0]
    AnalysisCommits(jobs).accept(run_id,{**submission,'commit_key':'key-only','base_revision':context.revision,
        'round_id':round_id,'observations':[],'checks':[{**check,'key_evidence':[
            dict(evidence_id=whole_ids[0],role='support',reason='用于复核同一主体外缘。')]}]})
    second_id = jobs.cancel(run_id)['analysis_version_id']
    second = publications.get(second_id)
    detail = AnalysisQueries(jobs.db).details(KnowledgeDetailQuery(version_id=second_id,check_id='edge'))
    assert detail.check.review.status == 'confirmed'
    assert detail.check.review.note == confirmed.note
    assert detail.check.review.revision == 0
    assert second.catalog.checks[0].independent_source_count == 3
    assert second.parent_version_id == first_id
    replacement = reviews.submit(KnowledgeCheckReviewSubmission(version_id=second_id,check_id='edge',
        expected_revision=0,submission_id=uuid4(),status='rejected',note='需要进一步核对。'))
    assert replacement.revision == 1
    assert reviews.read(first_id)['edge'] == confirmed
    jobs.resume(run_id)
    context = jobs.context(run_id)
    AnalysisCommits(jobs).accept(run_id,{**submission,'commit_key':'claim-changed','base_revision':context.revision,
        'round_id':round_id,'observations':[],'checks':[{**check,'criterion':'仅沿上侧外缘复核轮廓的连续关系。',
            'change_reason':'目标缩小到可辨的上侧外缘。'}],
        'arguments':[dict(entry_id='edge',evidence_id=eid,role='support',reason='上侧外缘可辨，仍支持修订后的主张。')
            for eid in whole_ids]})
    third_id = jobs.cancel(run_id)['analysis_version_id']
    changed = AnalysisQueries(jobs.db).details(KnowledgeDetailQuery(version_id=third_id,check_id='edge'))
    assert changed.check.review.status == 'pending'
    assert reviews.read(second_id)['edge'] == replacement
    assert publications.get(first_id) == first
    assert publications.get(second_id) == second
