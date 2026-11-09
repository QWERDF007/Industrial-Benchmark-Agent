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
    query = dict(version_id=version_id,check_id='C1',page_size=2)
    support = entry.knowledge_details(dict(query,evidence_role='support'),db.db_path)
    counter = entry.knowledge_details(dict(query,evidence_role='counter'),db.db_path)
    second = entry.knowledge_details(dict(query,evidence_role='support',page=2),db.db_path)
    assert (support['total'],len(support['items']),len(second['items'])) == (3,2,1)
    assert counter['total'] == len(counter['items']) == 1
    assert set(item['sample_id'] for item in support['items']).isdisjoint(item['sample_id'] for item in counter['items'])
    assert len({item['sample_id'] for item in [*support['items'],*second['items'],*counter['items']]}) == 4
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
