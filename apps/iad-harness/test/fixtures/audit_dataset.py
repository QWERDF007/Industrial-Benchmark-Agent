import json
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image

from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.publications import AnalysisPublications
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.dataset.registry import DatasetRegistry, DatasetImport
from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
from iad_core.knowledge.instructions import default_directions
from iad_core.knowledge.models import KnowledgeCheckReviewSubmission
from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.module_settings import ModuleSettings


root = Path(sys.argv[1])
images = root / 'images'
images.mkdir()
for index in range(2):
    Image.new('RGB', (40,30), 'blue' if index == 0 else 'gray').save(images / (str(index) + '.png'))
db = Database(sys.argv[2])
config = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme', name='真实原图审计',
    image_dir=str(images), annotation_dir=str(images)))
runtime = WorkbenchRuntime(db)
try:
    checks = ConsistencyAgentJobs(runtime)
    upstream = checks.start({'submission_id':str(uuid4()), 'dataset_ids':[config.dataset.id], 'mode':'exact'})
    for anchor in checks.anchors(upstream['run_id']):
        checks.session_created(upstream['run_id'],anchor.anchor_id)
        checks.retrieve(upstream['run_id'],anchor.anchor_id)
        checks.submit_empty(upstream['run_id'],anchor.anchor_id)
    runtime.jobs.finish_external(upstream['run_id'])
    settings = ModuleSettings(db)
    model = {'provider_id':'fixture','model_id':'native-audit'}
    settings.save({'module':'audit','expected_revision':0,'settings':{'model':model,'concurrency':2}})
    knowledge = None
    if sys.argv[3] == 'knowledge':
        settings.save({'module':'knowledge','expected_revision':0,'settings':{'model':model,'batch_size':2}})
        jobs = AnalysisAgentJobs(runtime)
        role = dict(profile=dict(endpoint=sys.argv[4]+'/chat/completions',capacity_mode='vllm_tokenize',
            provider_id='fixture',model_id='native-audit',context_tokens=65536,max_output_tokens=4096),
            native_profile=dict(api='openai-completions',baseURL=sys.argv[4]),input_modalities=['text','image'])
        mining = jobs.start(dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[config.dataset.id],
            mining_prompt=dict(objective='观察表面。',instruction='保留支持和反例。',
                directions=[default_directions()[0].model_dump(mode='json'),
                    {**default_directions()[1].model_dump(mode='json'),'title':'未选方向哨兵','instruction':'未选观点不得进入审计。'}])),agent=role)
        run_id = mining['run_id']
        context = jobs.context(run_id)
        evidence = AnalysisEvidence(jobs)
        pages = [evidence.read(run_id,dict(sample_id=target.sample_id)) for target in context.round.targets]
        call = NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'published observations'})
        calls = ModelCalls(db)
        calls.start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
        evidence.delivered(run_id,call.call_id,[item.image.evidence_id for page in pages for item in page.images])
        calls.finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
        direction_ref = context.selected_directions[0].ref
        check = dict(check_id='C1',title='表面变化',subject='主体',location='表面',criterion='复查色差是否遗漏标注。',
            allowed_variations=['照明变化'],limitations=['支持和反例尚待区分。'],status='conflicted',
            support_evidence_ids=[pages[0].images[0].image.evidence_id],counter_evidence_ids=[pages[1].images[0].image.evidence_id],
            key_evidence=[dict(evidence_id=pages[0].images[0].image.evidence_id,role='support',reason='复核表面外观。'),
                dict(evidence_id=pages[1].images[0].image.evidence_id,role='counter',reason='复核矛盾的表面外观。')],
            direction_refs=[direction_ref],dataset_ids=[config.dataset.id])
        AnalysisCommits(jobs).accept(run_id,dict(commit_key='fixture-publication',base_revision=0,round_id=1,
            observations=[dict(sample_id=page.sample_id,dataset_id=config.dataset.id,description='本场可见外观。',
                evidence_ids=[item.image.evidence_id for item in page.images],
                directions=[dict(direction_ref=direction.ref,status='applicable',reason='表面可见。') for direction in context.selected_directions]) for page in pages],
            checks=[check,{**check,'check_id':'C2','title':'暂定外观','status':'provisional','counter_evidence_ids':[],
                'key_evidence':check['key_evidence'][:1]},
                {**check,'check_id':'C3','title':'未选条目哨兵','direction_refs':[context.selected_directions[1].ref]}],
            summary='未选全局摘要哨兵。',limitations=['未选全局限制哨兵。'],unresolved_questions=['未选全局疑问哨兵。']))
        runtime.jobs.finish_external(run_id)
        version_id = AnalysisPublications(db).publish(run_id).version_id
        KnowledgeCheckReviews(db).submit(KnowledgeCheckReviewSubmission(submission_id=uuid4(),version_id=version_id,
            check_id='C1',expected_revision=0,status='rejected',note='人工否定仍保留原文。'))
        knowledge = dict(job_id=run_id,version_id=version_id,entry_ids=['C1','C2'])
    print(json.dumps(dict(dataset_id=config.dataset.id,consistency_job_id=upstream['run_id'],knowledge=knowledge)))
finally:
    runtime.close()
