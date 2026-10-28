import numpy as np
import pytest
from PIL import Image

from iad_core.duplicate.verify import PairVerifier


def test_thumbnail_agreement_never_hides_a_changed_original_border_pixel(tmp_path):
    left,right=tmp_path/'left.png',tmp_path/'right.png'
    array=np.full((768,1024,3),90,dtype=np.uint8)
    Image.fromarray(array).save(left)
    array[0,0,2]=255
    Image.fromarray(array).save(right)
    result=PairVerifier().verify(str(left),str(right),regions=[[-1,-1,1,1],[0,0,2,1]])
    assert result.relation=='NEAR_CANDIDATE'
    assert result.pixel.exact_equal is False
    assert result.pixel.changed_pixels==1 and result.pixel.max_abs_diff==165
    assert result.local.compared_pixels==2 and result.local.changed_pixels==1
    assert result.local.max_abs_diff==165
    assert result.registration.status=='UNSUPPORTED' and result.registration.reason


def test_repeated_original_query_reuses_only_its_thumbnail_and_preserves_full_pixel_facts():
    from iad_core.duplicate.pixels import PixelContent

    original = Image.new('RGB', (256, 256), (100, 110, 120))
    first = original.copy(); first.putpixel((0, 0), (100, 110, 121))
    second = original.copy(); second.putpixel((255, 255), (100, 110, 122))
    left = PixelContent.read(original)
    verifier = PairVerifier()
    a = verifier.verify_pixels(left, PixelContent.read(first))
    b = verifier.verify_pixels(left, PixelContent.read(second))
    assert (a.pixel.changed_pixels, a.pixel.max_abs_diff) == (1, 1)
    assert (b.pixel.changed_pixels, b.pixel.max_abs_diff) == (1, 2)
    assert a.relation == b.relation == 'NEAR_CANDIDATE'
    assert verifier.stats().thumbnail_preparations == 3
    assert verifier.stats().retained_thumbnail_bytes == 262144


@pytest.mark.parametrize('kind',['color','alpha','uint16'])
def test_luminance_alpha_and_16bit_processing_cannot_prove_original_identity(tmp_path,kind):
    left,right=tmp_path/'a.png',tmp_path/'b.png'
    if kind=='uint16':
        array=np.full((64,64),1024,dtype=np.uint16)
        changed=1025
    elif kind=='alpha':
        array=np.full((64,64,4),128,dtype=np.uint8)
        changed=[128,128,128,129]
    else:
        array=np.full((64,64,3),90,dtype=np.uint8)
        changed=[91,90,90]
    Image.fromarray(array).save(left);array[0,0]=changed;Image.fromarray(array).save(right)
    result=PairVerifier().verify(str(left),str(right))
    assert result.relation=='NEAR_CANDIDATE' and result.pixel.changed_pixels==1
    assert result.pixel.exact_equal is False and result.pixel.max_abs_diff==1


def test_local_union_preserves_uncovered_pixels_and_does_not_double_count(tmp_path):
    a,b=tmp_path/'a.png',tmp_path/'b.png'
    image=Image.new('L',(8,8),0);image.save(a)
    image.putpixel((0,3),255);image.putpixel((2,2),255);image.save(b)
    result=PairVerifier().verify(str(a),str(b),regions=[[0,0,4,1],[0,0,1,4]])
    assert result.pixel.changed_pixels==2
    assert result.local.compared_pixels==7 and result.local.changed_pixels==1
    assert result.local.max_abs_diff==255


def test_different_sizes_and_partial_crops_have_no_assumed_coordinate_overlap(tmp_path):
    a,b=tmp_path/'a.png',tmp_path/'b.png'
    image=Image.fromarray(np.tile(np.array([0,255]*32,dtype=np.uint8),(64,1)))
    image.save(a);image.crop((16,0,48,64)).save(b)
    result=PairVerifier().verify(str(a),str(b),regions=[[0,0,8,8]])
    assert result.relation in ('NEAR_CANDIDATE','VISUAL_REFERENCE')
    assert result.pixel.status=='INCOMPATIBLE' and result.pixel.exact_equal is False
    assert result.local.status=='INCOMPATIBLE' and result.local.changed_pixels is None
    assert result.registration.status=='UNSUPPORTED'


def test_changed_path_does_not_reuse_stale_thumbnail_data(tmp_path):
    a,b=tmp_path/'a.png',tmp_path/'b.png'
    Image.new('RGB',(50,30),'red').save(a);Image.new('RGB',(50,30),'red').save(b)
    verifier=PairVerifier()
    assert verifier.verify(str(a),str(b)).relation=='EXACT'
    Image.new('RGB',(50,30),'blue').save(b)
    result=verifier.verify(str(a),str(b))
    assert result.pixel.changed_pixels==1500 and result.relation=='VISUAL_REFERENCE'


def test_local_region_budget_is_explicit(tmp_path):
    a=tmp_path/'a.png';Image.new('L',(8,8),0).save(a)
    result=PairVerifier().verify(str(a),str(a),regions=[[0,0,1,1]]*1001)
    assert result.pixel.exact_equal is True
    assert result.local.status=='UNSUPPORTED' and 'RESOURCE_LIMIT' in result.local.reason
    assert result.local.changed_pixels is None


def test_unreadable_and_unsupported_sources_leave_metrics_unknown(tmp_path):
    valid,unsupported=tmp_path/'valid.png',tmp_path/'floating.tiff'
    Image.new('L',(8,8),0).save(valid)
    Image.fromarray(np.zeros((8,8),dtype=np.float32)).save(unsupported)
    for source,status in [(tmp_path/'missing.png','UNAVAILABLE'),(unsupported,'UNSUPPORTED')]:
        result=PairVerifier().verify(str(valid),str(source),regions=[[0,0,1,1]])
        assert result.relation=='UNCHECKED' and result.pixel.status==status
        assert result.verified is False and result.pixel.exact_equal is None
        assert result.pixel_cosine is result.ncc is result.mean_abs_diff is result.high_diff_ratio is None
        assert result.local.status==status and result.local.changed_pixels is None


def test_configured_thumbnail_size_and_outside_regions_are_explicit(tmp_path):
    from iad_core.duplicate.verification_models import NearComparisonConfig

    a,b=tmp_path/'a.png',tmp_path/'b.png'
    image=Image.new('L',(100,80),100);image.save(a);image.putpixel((20,20),101);image.save(b)
    result=PairVerifier(NearComparisonConfig(target_size=(80,96))).verify(str(a),str(b),regions=[[200,200,220,220]])
    assert result.details['config']['target_size']==[80,96]
    assert result.local.status=='NOT_OBSERVABLE' and result.local.changed_pixels is None
    with pytest.raises(ValueError):NearComparisonConfig(target_size=(7,256))
    with pytest.raises(ValueError):NearComparisonConfig(max_mean_abs_diff=float('nan'))
    with pytest.raises(ValueError):PairVerifier().verify(str(a),str(b),regions=[[2,2,1,1]])


def test_stored_relation_cannot_overrule_observed_original_pixel_facts(tmp_path):
    from iad_core.duplicate.verification_models import VerificationResult

    a,b=tmp_path/'a.png',tmp_path/'b.png'
    image=Image.new('L',(8,8),0);image.save(a);image.putpixel((0,0),1);image.save(b)
    document=PairVerifier().verify(str(a),str(b)).model_dump(mode='json')
    document['relation']='EXACT'
    with pytest.raises(ValueError):VerificationResult.model_validate(document)
