from uuid import uuid4
import json

from iad_core.audit.commits import AuditCommits
from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.reports import AuditReports
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd


def save_image(jobs, run_id, sample, findings=(), *, reviews=(), source_refs=(), check_assessments=(), observations=(),
        hypothesis_assessments=(),visual_features=(),selected_evidence=(),media_view=None,commit_key='final',analysis='已观察主图及全部局部。'):
    jobs.session_created(run_id, sample.sample_id)
    query = {'sample_id':sample.sample_id}
    if jobs.snapshot(run_id).context_policy == 'evidence-on-demand-v1': query['view'] = media_view or 'all'
    page = AuditEvidence(jobs).read(run_id, sample.sample_id, query)
    ids = [page.evidence_id]
    call = NativeModelCallStart(call_id='call_'+uuid4().hex, started_at='2026-11-10T12:00:00+08:00', request={'fixture':'joint original and annotation input'})
    calls = ModelCalls(jobs.db)
    calls.start_native(run_id, call, sample_id=sample.sample_id, session_id=sample.session_id, attempt=1)
    AuditEvidence(jobs).delivered(run_id, sample.sample_id, call.call_id, [image.image.evidence_id for image in page.images])
    calls.finish_native(run_id, sample.sample_id, NativeModelCallEnd(call_id=call.call_id, finished_at='2026-11-10T12:00:01+08:00', elapsed_ms=1000, finish_reason='tool-calls'))
    final = dict(execution_status='completed', state='suspect' if findings else 'normal', analysis=analysis,
        conclusion='发现独立疑点。' if findings else '本次未发现疑点。', basis=['冻结原图。'], evidence_ids=ids, check_assessments=list(check_assessments), consistency_review=list(reviews),
        observations=list(observations),hypothesis_assessments=list(hypothesis_assessments),visual_features=list(visual_features),selected_evidence=list(selected_evidence),findings=[dict(finding_id=fid,type='image_label_mismatch' if jobs.context(run_id,sample.sample_id).target.dataset_format=='folder_classification' else 'missing_annotation',description='有效覆盖需复核。',location='主体',annotation_ids=[],
            consistency_issue_refs=list(source_refs),check_ids=[],evidence_ids=ids,normal_explanation='需排除成像影响。',limitations=[]) for fid in findings],limitations=[])
    return AuditCommits(jobs).accept(run_id, sample.sample_id, dict(commit_key=commit_key, final=final))


def master_observed(jobs, run_id, context, evidence_ids=()):
    reports = AuditReports(jobs.db)
    session = reports.session(run_id)
    call = NativeModelCallStart(call_id='call_'+uuid4().hex, started_at='2026-11-11T12:00:00Z',
        request={'messages':[{'role':'user','content':[{'type':'text','text':json.dumps(context)}]}]})
    calls = ModelCalls(jobs.db)
    calls.start_native(run_id,call,sample_id=None,session_id=session.session_id,attempt=1)
    reports.delivered(run_id,call,list(evidence_ids))
    calls.finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-11T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))



def batch_submission(jobs, run_id, discoveries=(), review_requests=(), *, commit_key=None):
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.report_models import AuditDiscovery, AuditDiscoveryBody
    context = AuditBatches(jobs).context(run_id)
    submission = dict(commit_key=commit_key or str(uuid4()), batch_number=context['batch']['number'],
        base_revision=context['revision'], discoveries=list(discoveries), review_requests=list(review_requests))
    if jobs.snapshot(run_id).context_policy != 'evidence-on-demand-v1': return submission
    prior = {item.group_id:item for item in AuditReports(jobs.db).session(run_id).discoveries}
    bodies, changes, selections = [], [], []
    for value in discoveries:
        item = AuditDiscovery.model_validate(value)
        before = prior.get(item.group_id)
        body = item.model_dump(mode='json', include=set(AuditDiscoveryBody.model_fields))
        changed = before is None or body != before.model_dump(mode='json', include=set(AuditDiscoveryBody.model_fields))
        if changed: bodies.append(body)
        claim_changed = before is not None and any(getattr(before, name) != getattr(item, name)
            for name in ('description','visual_signature','annotation_relation','scope','key_difference'))
        for role in ('support','counter'):
            old = getattr(before, role+'_refs') if before else []
            new = getattr(item, role+'_refs')
            for reference in old:
                action = 'remove' if reference not in new else 'keep' if claim_changed else None
                if action: changes.append(dict(group_id=item.group_id, action=action, role=role,
                    reference=reference.model_dump(mode='json'), reason='根据冻结图级结果复核证据关系。'))
            for reference in new:
                if reference not in old: changes.append(dict(group_id=item.group_id, action='add', role=role,
                    reference=reference.model_dump(mode='json'), reason='实际图级记录支持本项证据关系。'))
        if before is None or item.representatives != before.representatives:
            selections.append(dict(group_id=item.group_id, representatives=[entry.model_dump(mode='json') for entry in item.representatives]))
    return {**submission, 'discoveries':bodies, 'evidence_changes':changes, 'representative_changes':selections}


def publish_batch(jobs, run_id, discoveries=(), review_requests=(), *, commit_key=None):
    from iad_core.audit.batches import AuditBatches
    batches = AuditBatches(jobs)
    context = batches.context(run_id)
    evidence = AuditEvidence(jobs)
    originals = [evidence.read(run_id, item['sample_id'], dict(sample_id=item['sample_id'])).evidence_id
        for discovery in discoveries for item in discovery.get('representatives', [])]
    master_observed(jobs, run_id, context, originals)
    return batches.publish(run_id, batch_submission(jobs, run_id, discoveries, review_requests, commit_key=commit_key))


def report_submission(**overrides):
    return dict(commit_key='report', discovery_ids=[], conclusion='完成范围内需复核。',
        consistency_analysis='逐项核对上游差异，候选不作为真值。', knowledge_analysis='按实际选用知识核对。',
        coverage_analysis='原图覆盖已观察主体与背景，未采集场景未评价。',
        independence_analysis='独立物理件、批次与序列仅依据真实元数据评价。', capabilities=[],
        usability=[dict(purpose=purpose, status='candidate' if purpose in ('exploration','training_experiment','debug') else 'not_evaluated',
            reason='可用原图开展视觉探索。' if purpose in ('exploration','training_experiment','debug') else '没有本范围正式评测就绪证据。')
            for purpose in ('exploration','training_experiment','debug','image_evaluation','bbox_evaluation','pixel_evaluation','formal_benchmark')],
        review_priorities=[], limitations=[]) | overrides
