"""Explicit image groups selected from the shared source query for test scenarios."""
from iad_core.knowledge.requests import MiningStart
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.sources import KnowledgeSources


def selected_group(db, dataset_id, kind, images=None, knowledge_preset=None):
    presets = knowledge_preset or []
    if images is None:
        repository = KnowledgeRepository(db)
        normal = next((value for value in (repository.get(vid) for vid in presets) if value.kind == 'normal'), None)
        images = list(KnowledgeSources(db).eligible(dataset_id, kind, normal if kind == 'defect' else None).require_available())
    return MiningStart(image_count=len(images), images=images, knowledge_preset=presets)


def frozen_observation_response(request):
    """External MLLM response for a scenario with no contradictory old-criterion observations."""
    import json
    import httpx
    body = json.loads(request.content)
    if body.get('response_format', {}).get('json_schema', {}).get('name') != 'KnowledgeObservations':
        return None
    prompt = body['messages'][0]['content'][0]['text']
    scope = json.loads(prompt.split('冻结观察请求：')[1].split('\n请根据图像')[0])
    observations = [dict(check_id=check['check_id'], sample_id=source['sample_id'], status='supports',
        description='所见结构符合冻结判据', position_analysis='主体区域', illumination_analysis='均匀照明',
        normal_explanation='未观察到反例', evidence_ids=source['raw_evidence_ids'], suspects=[])
        for source in scope['sources'] for check in scope['checks']]
    return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
        'message': {'content': json.dumps({'observations': observations}, ensure_ascii=False)}}]})
