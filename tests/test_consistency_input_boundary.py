import json
from uuid import uuid4

import pytest

from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.errors import ConsistencyError
from iad_core.storage.repositories import AnnotationRepository
from iad_core.workbench.runtime import WorkbenchRuntime


def test_bad_annotation_is_handled_after_identity_inside_the_created_task(dataset, tmp_path):
    database, registry, config = dataset
    (tmp_path/'labels/dent.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[
        {'label':'dent','shape_type':'rectangle','points':[[10,10],[10,20]]}]}))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        created = checks.start({'submission_id':str(uuid4()), 'dataset_ids':[config.dataset.id], 'mode':'exact',
            'subjects':{'kind':'samples','sample_ids':[anchor]}})
        assert created['created'] is True
        checks.session_created(created['run_id'], anchor)
        checks.retrieve(created['run_id'], anchor)
        review = ConsistencyAgentReview(runtime)
        identity = review.verify(created['run_id'], anchor)
        assert identity.completed and identity.eligible_ids
        with pytest.raises(ConsistencyError, match=anchor + ':ann_0') as failure:
            review.finish_rules(created['run_id'], anchor)
        assert failure.value.code == 'ANNOTATION_UNREADABLE'
        assert checks.anchor(created['run_id'], anchor).result is None
    finally:
        runtime.close()


def test_partly_visible_raw_rectangle_is_revalidated_without_rewriting_imported_data(dataset, tmp_path):
    database, registry, config = dataset
    raw = json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[
        {'label':'18','shape_type':'rectangle','points':[[54.99,218.68],[131.65,241.84]]}]})
    label = tmp_path/'labels/dent.json'
    label.write_text(raw)
    registry.rescan(config.dataset.id)
    anchor = config.dataset.id + ':dent.png'
    repository = AnnotationRepository(database)
    original, = repository.list_by_sample(anchor)
    # Arrange an import made when partially visible rectangles were rejected.
    legacy = original.model_copy(update={'geometry_status':'INVALID'})
    repository.upsert(legacy)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run_id = checks.start({'submission_id':str(uuid4()),'dataset_ids':[config.dataset.id],'mode':'exact',
            'subjects':{'kind':'samples','sample_ids':[anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        candidates = checks.retrieve(run_id, anchor)
        review = ConsistencyAgentReview(runtime)
        assert review.verify(run_id, anchor).completed
        assert review.finish_rules(run_id, anchor) is None
        prepared = ConsistencyAgentEvidence(runtime).prepare(run_id, anchor, [candidates.candidates[0].sample_id])
        source = next(source for source in prepared.facts['sources'].values() if source['sample_id']==anchor)
        assert source['annotations'][0]['bbox'] == [54.99,218.68,131.65,241.84]
        assert source['annotations'][0]['geometry_status'] == 'VALID'
        crops = [view['crop_bbox'] for view in source['visual_inputs'] if view['window_source']=='annotation']
        assert crops and all(0<=box[0]<box[2]<=320 and 0<=box[1]<box[3]<=240 for box in crops)
        assert repository.list_by_sample(anchor) == [legacy]
        assert label.read_text() == raw
        from iad_core.evidence.current_sources import CurrentSource
        evidence = runtime.consistency_service.evidence(prepared.facts['candidates'][candidates.candidates[0].sample_id]['comparison']['evidence_id'])
        frozen = evidence.sources.left
        historical = frozen.model_copy(update={'annotations':frozen.annotations.model_copy(update={'annotations':[legacy]})})
        with database.connection() as connection:
            current = CurrentSource.capture(database, anchor, connection)
        assert current.state(historical) == 'CURRENT'
    finally:
        runtime.close()
