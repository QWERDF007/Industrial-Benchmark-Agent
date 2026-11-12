import json
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.audit.jobs import AuditAgentJobs
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.knowledge.instructions import default_directions
from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.runtime import WorkbenchRuntime
from tests.audit_support import save_image

root = Path(sys.argv[1])
runtime = WorkbenchRuntime(Database(str(root / 'test.db')))
analysis, consistency, audit = AnalysisAgentJobs(runtime), ConsistencyAgentJobs(runtime), AuditAgentJobs(runtime)
def command(action, module=None):
    if action == 'init':
        images = root / 'images'
        images.mkdir()
        for index in range(4):
            image = Image.new('RGB', (80, 60), (30 + index * 20, 40, 50))
            image.putpixel((index, index), (240, 200, 40))
            image.save(images / f'part-{index}.png')
        registry = DatasetRegistry(runtime.db)
        config = registry.import_labelme(DatasetImport(format='labelme', name='实时结果验证', image_dir=str(images), annotation_dir=str(images)))
        role = dict(profile=dict(provider_id='fixture', model_id='job-results', endpoint='http://127.0.0.1:1/v1/chat/completions',
            context_tokens=65536, max_output_tokens=4096), native_profile=dict(api='openai-completions', baseURL='http://127.0.0.1:1/v1'), input_modalities=['text','image'])
        for module in ['exploration', 'knowledge', 'audit']:
            ModuleSettings(runtime.db).save(dict(module=module, expected_revision=0,
                settings=dict(model=dict(provider_id='fixture', model_id='job-results'), **({'batch_size':4} if module != 'audit' else {}))))
        did = config.dataset.id
        jobs = {}
        for module in ['exploration', 'knowledge']:
            request = dict(submission_id=str(uuid4()), analysis_kind=module, dataset_ids=[did])
            if module == 'exploration':
                request.update(normal_images=[did + f':part-{i}.png' for i in range(4)], prompt=dict(text='核对主体外缘。'))
            else:
                request['mining_prompt'] = dict(objective='核对主体外缘。', instruction='核对可见外缘。', directions=[default_directions()[0].model_dump(mode='json')])
            jobs[module] = analysis.start(request, agent=role)['run_id']
        upstream = consistency.start(dict(submission_id=str(uuid4()), dataset_ids=[did], mode='exact'))['run_id']
        for anchor in consistency.anchors(upstream):
            consistency.session_created(upstream, anchor.anchor_id)
            assert not consistency.retrieve(upstream, anchor.anchor_id).candidates
            consistency.submit_empty(upstream, anchor.anchor_id)
        consistency.finish(upstream)
        jobs['audit'] = audit.start(dict(submission_id=str(uuid4()), subset_ids=[did], consistency_job_id=upstream), agent=role)['run_id']
        jobs['consistency'] = consistency.start(dict(submission_id=str(uuid4()), dataset_ids=[did], mode='exact'))['run_id']
        (root / 'fixture.json').write_text(json.dumps(dict(dataset_id=did, jobs=jobs)))
    else:
        fixture = json.loads((root / 'fixture.json').read_text())
        run_id, did = fixture['jobs'][module], fixture['dataset_id']
        if action == 'cancel':
            (audit if module == 'audit' else consistency if module == 'consistency' else analysis).cancel(run_id)
        elif module == 'consistency':
            pending = next(anchor for anchor in consistency.anchors(run_id) if anchor.state == 'PENDING')
            consistency.session_created(run_id, pending.anchor_id)
            assert not consistency.retrieve(run_id, pending.anchor_id).candidates
            consistency.submit_empty(run_id, pending.anchor_id)
        elif module == 'audit':
            pending = next(sample for sample in audit.samples(run_id) if sample.state == 'PENDING')
            save_image(audit, run_id, pending, ['finding'] if action == 'suspect' else [])
        else:
            state = analysis.state(run_id)
            field = 'directions' if module == 'exploration' else 'checks'
            entry = dict(title='外缘连续性' if action == 'advance' else '外缘连续关系', dataset_ids=[did], limitations=[])
            if module == 'exploration':
                entry.update(direction_id='edge', instruction='沿可辨外缘核对连续关系。', rationale='完整外缘结构可辨。', applies_to='both')
            else:
                entry.update(check_id='edge', subject='主体', location='外缘', criterion='沿可辨外缘核对连续关系。', allowed_variations=[], status='provisional', direction_refs=['D1'])
            submission = dict(commit_key=action, round_id=1, base_revision=state.revision,
                **{field:[entry]}, observations=[], summary='外缘可按连续关系核对。', limitations=[], unresolved_questions=[])
            if action == 'advance':
                pages = AnalysisEvidence(analysis).batch(run_id).registrations
                calls = ModelCalls(runtime.db)
                call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-11T12:00:00Z', request={})
                calls.start_native(run_id, call, sample_id=None, session_id=state.session_id, attempt=1)
                AnalysisEvidence(analysis).delivered(run_id, call.call_id, [image.image.evidence_id for page in pages for image in page.images])
                calls.finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id, finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
                submission['observations'] = [dict(sample_id=page.sample_id, dataset_id=did, description='主体外缘可辨。', evidence_ids=[page.evidence_id],
                    directions=[dict(direction_ref=d.ref, status='applicable', reason='外缘可观察。') for d in analysis.snapshot(run_id).selected_directions]) for page in pages]
                submission['arguments'] = [dict(entry_id='edge', evidence_id=page.evidence_id, role='counter' if i == 2 else 'support', reason='该图呈现可比较的外缘结构。') for i,page in enumerate(pages)]
                submission['selections'] = [dict(entry_id='edge', key_evidence=[
                    dict(evidence_id=pages[0].evidence_id, role='support', reason='外缘结构可辨。'),
                    dict(evidence_id=pages[2].evidence_id, role='counter', reason='不同外缘形态需要复核。')])]
            AnalysisCommits(analysis).accept(run_id, submission)
    return json.loads((root / 'fixture.json').read_text())


try:
    for line in sys.stdin:
        try:
            request = json.loads(line)
            print(json.dumps(command(**request)), flush=True)
        except Exception as error:
            import traceback
            traceback.print_exc(file=sys.stderr)
            print(json.dumps({'error':str(error)}), flush=True)
finally:
    runtime.close()
