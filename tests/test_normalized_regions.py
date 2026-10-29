import pytest
from pydantic import ValidationError

from iad_core.advisory.analysis import RegionProposal
from iad_core.knowledge.models import KnowledgeSuspect


@pytest.mark.parametrize('region_type,fields', [
    (RegionProposal, {'reason': '细线周边区域'}),
    (KnowledgeSuspect, {'evidence_id': 'actual-raw-image', 'description': '垂直细线',
                       'normal_explanation': '需排除正常接缝'}),
])
def test_normalized_regions_request_nonzero_rectangles_and_reject_line_segments(region_type, fields):
    schema = region_type.model_json_schema()['properties']['bbox_1000']
    assert schema['items'].get('minimum') == 0
    assert schema['items'].get('maximum') == 1000
    assert 'x1<x2' in schema['description'] and 'y1<y2' in schema['description']
    assert '线段' in schema['description']
    actual = region_type(**fields, bbox_1000=[313, 0, 315, 981])
    assert actual.bbox_1000 == [313, 0, 315, 981]
    for invalid in ([314, 0, 314, 981], [313, 981, 315, 0], [-1, 0, 315, 981], [0, 0, 1001, 981]):
        with pytest.raises(ValidationError):
            region_type(**fields, bbox_1000=invalid)
