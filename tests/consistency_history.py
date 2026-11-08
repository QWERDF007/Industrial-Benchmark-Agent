import json
from uuid import uuid4

from iad_core.consistency.gallery import GalleryQueries, GalleryReference
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft


def save_group_history(db, reference, conclusions):
    frozen = GalleryQueries(db).freeze(GalleryReference.model_validate(reference))
    group = frozen.group
    assessments, references = [], []
    for member in group.members:
        conclusion = conclusions[member.image.sample.relative_path]
        assessments.append(dict(candidate_id=member.image.sample_id,
            verdict='EQUIVALENT' if conclusion == '一致' else 'MATERIAL', conclusion=conclusion,
            categories=[] if conclusion == '一致' else [conclusion], explanation='历史图组已保存的逐候选分析', findings=[]))
        references.append(dict(candidate_id=member.image.sample_id,
            comparison=member.comparison.model_dump(exclude={'anchor_side'})))
    conflict = next((item for item in assessments if item['verdict'] == 'MATERIAL'), None)
    result = GroupAnalysisDraft.model_validate(dict(assessments=assessments,
        overall=dict(verdict='MATERIAL' if conflict else 'EQUIVALENT', text=conflict['conclusion'] if conflict else '一致', references=references),
        conclusions=[dict(text='历史图组的冻结结论与引用', references=references)], limitations=[]))
    samples = [group.anchor.sample_id, *[member.image.sample_id for member in group.members]]
    run = 'consistency_analysis_' + uuid4().hex
    request = dict(dataset_id=group.anchor.sample.dataset_id, sample_ids=samples, model_name='historical-fixture',
        frozen_group=group.model_dump(mode='json'), group_fingerprint=frozen.identity.fingerprint('historical-fixture-v1'),
        analysis_schema='historical-fixture-v1', analysis_selection=frozen.selection.model_dump(mode='json'))
    payload = dict(request=request, errors=[], group_analysis=result.model_dump(mode='json'),
        root_run_id=run, sample_ids=samples, completed_sample_ids=samples, failed_sample_ids=[],
        dataset_id=group.anchor.sample.dataset_id, model_name='historical-fixture',
        total_samples=len(samples), completed=len(samples), failed=0)
    with db.connection() as connection:
        connection.execute('''INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json,message,progress)
            VALUES(?,?,'CONSISTENCY_ANALYSIS','COMPLETED',?,'历史模型结果',1)''',
            (run, group.anchor.sample.task_id, json.dumps(payload)))
    return run
