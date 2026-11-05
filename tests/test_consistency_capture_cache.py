from pathlib import Path

import pytest
from PIL import Image

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.service import ConsistencyService
from iad_core.consistency.repository import ConsistencyRepository


@pytest.mark.parametrize('damage',['missing','corrupt'])
@pytest.mark.parametrize('reopen',[False,True])
def test_new_capture_rebuilds_derived_bytes_from_verified_sources_while_history_is_strict(dataset,damage,reopen):
    db,_,config=dataset
    service=ConsistencyService(db)
    request=ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png')
    result=service.compare(request)
    frozen=ConsistencyRepository(db).get(result.evidence_id)
    media=Path(service.evidence_media(result.evidence_id,'left-original')['path'])
    if damage=='missing':media.unlink()
    else:media.write_bytes(b'corrupted cache bytes')
    with pytest.raises(ConsistencyError,match='historical proof'):
        service.evidence(result.evidence_id)
    with Image.open(Path(config.root)/'dent.png') as image:
        assert image.size==(320,240)
    if reopen:
        service.close()
        service=ConsistencyService(db)
    try:
        rebuilt=service.compare(request)
        assert service.evidence(rebuilt.evidence_id).result.verification.relation=='EXACT'
        assert ConsistencyRepository(db).get(result.evidence_id)==frozen
        restored=service.evidence_media(rebuilt.evidence_id,'left-original')
        with Image.open(restored['path']) as image:
            assert image.convert('RGB').getextrema()==((0,0),(0,0),(255,255))
    finally:
        service.close()
