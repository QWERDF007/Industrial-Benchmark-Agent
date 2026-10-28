import json

import pytest
from PIL import Image

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.service import ConsistencyService
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.storage.database import Database


def test_context_resolves_frozen_differences_and_shares_original_with_explicit_remaining(tmp_path):
    from iad_core.consistency.context import ConsistencyContexts,ConsistencyContextRequest
    root=tmp_path/'images';root.mkdir()
    for name,kind in [('left','scratch'),('right','dent')]:
        Image.new('RGB',(80,80),(40,60,90)).save(root/(name+'.png'))
        (root/(name+'.json')).write_text(json.dumps({'imageWidth':80,'imageHeight':80,'shapes':[
            {'label':kind,'shape_type':'rectangle','points':[[10,10],[20,20]]},
            {'label':kind,'shape_type':'rectangle','points':[[40,40],[50,50]]}]}))
    db=Database(str(tmp_path/'context.db'))
    config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='证据上下文',image_dir=str(root),annotation_dir=str(root),
        annotation_policy={'policy_id':'same','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}))
    service=ConsistencyService(db)
    saved=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':left.png',sample_b=config.dataset.id+':right.png'))
    request=ConsistencyContextRequest(evidence_id=saved.evidence_id,result_id=saved.result_id,
        return_location={'pageId':'industrial-consistency','evidenceId':saved.evidence_id,'resultId':saved.result_id,'tab':'conflicts'},difference_page_size=1)
    context=ConsistencyContexts(db).get(request)
    assert context.result_id==saved.result_id and context.verification.relation=='EXACT'
    assert context.total_differences==2 and len(context.differences)==1 and context.remaining_differences==1
    assert context.next_cursor
    originals=[item for item in context.media if item.descriptor.representation=='original']
    assert len(originals)==1 and originals[0].sides==['left','right']
    assert {item.descriptor.side for item in context.media if item.descriptor.difference_id}=={'left','right'}
    assert context.return_location.evidenceId==saved.evidence_id
    second=ConsistencyContexts(db).get(request.model_copy(update={'cursor':context.next_cursor}))
    assert second.differences[0].difference_id!=context.differences[0].difference_id
    assert second.remaining_differences==0 and second.next_cursor is None
    for path in root.glob('*'):path.unlink()
    restored=ConsistencyContexts(db).get(request)
    assert restored.source_states.left==restored.source_states.right=='MISSING'
    assert restored.differences==context.differences
    from iad_core.consistency.errors import ConsistencyError
    with pytest.raises(ConsistencyError,match='result'):
        ConsistencyContexts(db).get(request.model_copy(update={'result_id':'missing'}))
    with pytest.raises(ConsistencyError,match='difference'):
        ConsistencyContexts(db).get(request.model_copy(update={'difference_ids':['missing']}))
    with pytest.raises(ConsistencyError,match='budget'):
        ConsistencyContexts(db).get(request.model_copy(update={'max_images':1}))
