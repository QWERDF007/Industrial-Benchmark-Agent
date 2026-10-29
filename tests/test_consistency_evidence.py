from pathlib import Path
import numpy as np
from PIL import Image

from iad_core.consistency.service import ConsistencyService


def test_exact_evidence_survives_source_deletion_until_dataset_is_deleted(dataset):
    from iad_core.consistency.evidence_models import ConsistencyCompare

    db,registry,config=dataset
    service=ConsistencyService(db)
    request=ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png')
    result=service.compare(request)
    bundle=service.evidence(result.evidence_id)
    assert bundle.result.verification.relation=='EXACT'
    assert bundle.sources.left.image==bundle.sources.right.image
    assert bundle.sources.left.annotations.annotations[0].raw_label=='dent'
    assert bundle.sources.right.annotations.annotations[0].raw_label=='scratch'
    assert service.compare(request).result_id==result.result_id
    for path in Path(config.root).glob('*.png'):path.unlink()
    reopened=ConsistencyService(db).evidence(result.evidence_id)
    assert reopened.result==result
    assert reopened.source_states.left==reopened.source_states.right=='MISSING'
    original=service.evidence_media(result.evidence_id,'left-original')
    from iad_core.duplicate.pixels import PixelContent
    assert PixelContent.read(original['path']).descriptor.width==320
    import pytest
    from iad_core.consistency.errors import ConsistencyError
    registry.delete(config.dataset.id)
    with pytest.raises(ConsistencyError, match='does not exist'):
        service.evidence(result.evidence_id)


def test_16bit_original_is_lossless_and_preview_uses_the_full_value_range(tmp_path):
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.storage.database import Database

    root=tmp_path/'images';root.mkdir()
    Image.fromarray(np.array([[0,32768,65535],[1,1024,65000]],dtype=np.uint16)).save(root/'sensor.tiff')
    db=Database(str(tmp_path/'evidence.db'))
    config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='16位传感器',image_dir=str(root),annotation_dir=str(root)))
    service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':sensor.tiff',sample_b=config.dataset.id+':sensor.tiff'))
    original=service.evidence_media(result.evidence_id,'left-original')
    with Image.open(original['path']) as image:
        assert image.size==(3,2) and image.getpixel((1,0))==32768 and image.getpixel((0,1))==1
    preview=service.evidence_media(result.evidence_id,'left-preview')
    with Image.open(preview['path']) as image:
        assert image.mode=='RGB' and [image.getpixel((x,0)) for x in range(3)]==[(0,0,0),(128,128,128),(255,255,255)]


def test_empty_annotation_mask_is_empty_instead_of_a_copy_of_the_photo(dataset):
    from iad_core.consistency.evidence_models import ConsistencyCompare

    db,_,config=dataset;service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':normal.png',sample_b=config.dataset.id+':normal.png'))
    mask=service.evidence_media(result.evidence_id,'left-annotation_mask')
    with Image.open(mask['path']) as image:assert image.convert('L').getbbox() is None


def test_one_sided_region_exports_both_actual_crops_and_a_separate_reference(tmp_path):
    import io,json,shutil,zipfile
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.storage.database import Database

    root=tmp_path/'images';root.mkdir()
    y,x=np.indices((20,20));pixels=np.stack([x*10,y*10,np.full_like(x,100)],axis=-1).astype(np.uint8)
    for name in ('left','right'):Image.fromarray(pixels).save(root/f'{name}.png')
    (root/'left.json').write_text(json.dumps({'imageWidth':20,'imageHeight':20,'shapes':[
        {'label':'dent','shape_type':'rectangle','points':[[4,4],[14,14]]}]}))
    db=Database(str(tmp_path/'evidence.db'));registry=DatasetRegistry(db)
    config=registry.import_labelme(DatasetImport(format='labelme',name='单侧区域',image_dir=str(root),annotation_dir=str(root),
        annotation_policy={'policy_id':'same','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}))
    service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':left.png',sample_b=config.dataset.id+':right.png'))
    difference=next(row for row in result.annotation.differences if row.type=='ONE_SIDED_REGION')
    bundle=service.evidence(result.evidence_id)
    crops=[media for media in bundle.media if media.difference_id==difference.difference_id and media.representation=='preview']
    assert len(crops)==2 and crops[0].bbox==crops[1].bbox==(2,2,16,16)
    reference=next(media for media in bundle.media if media.difference_id==difference.difference_id and media.representation=='reference_overlay')
    assert reference.side=='right' and reference.reference_from_other=='right'
    assert bundle.sources.right.annotations.annotations==[]
    shutil.rmtree(tmp_path/'cache',ignore_errors=True)
    for path in root.glob('*.png'):path.unlink()
    archive=service.evidence_export(result.evidence_id)
    with zipfile.ZipFile(archive.path) as exported:
        manifest=json.loads(exported.read('evidence.json'))
        for media in crops:
            with Image.open(io.BytesIO(exported.read(manifest['files'][media.media_id]))) as image:
                assert image.size==(14,14) and image.getpixel((0,0))==(20,20,100)
        with Image.open(io.BytesIO(exported.read(manifest['files'][reference.media_id]))) as image:
            assert image.getpixel((2,2))==(255,0,0)
            assert image.getpixel((9,2))==(110,40,100)
        assert '非示例' in exported.read('README.txt').decode()


def test_exif_preview_keeps_raw_axes_and_does_not_assume_annotation_coordinates(tmp_path):
    import json
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.storage.database import Database

    root=tmp_path/'images';root.mkdir()
    exif=Image.Exif();exif[274]=6
    image=Image.new('RGB',(30,20),'blue');image.putpixel((0,0),(255,0,0));image.save(root/'oriented.png',exif=exif)
    (root/'oriented.json').write_text(json.dumps({'imageWidth':30,'imageHeight':20,'shapes':[
        {'label':'dent','shape_type':'rectangle','points':[[1,1],[10,10]]}]}))
    db=Database(str(tmp_path/'evidence.db'));config=DatasetRegistry(db).import_labelme(DatasetImport(
        format='labelme',name='原始坐标',image_dir=str(root),annotation_dir=str(root)))
    service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':oriented.png',sample_b=config.dataset.id+':oriented.png'))
    assert result.verification.relation=='EXACT'
    assert result.verification.local.status=='UNSUPPORTED'
    bundle=service.evidence(result.evidence_id)
    assert not next(media for media in bundle.media if media.media_id=='left-annotation_overlay').available
    preview=service.evidence_media(result.evidence_id,'left-preview')
    with Image.open(preview['path']) as decoded:
        assert decoded.size==(30,20) and decoded.getpixel((0,0))==(255,0,0) and 274 not in decoded.getexif()


def test_mask_and_annotation_history_survive_rescan_and_cache_removal(defect_dataset):
    import shutil
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.dataset.registry import DatasetRegistry
    db,dataset_row,_,_=defect_dataset
    registry=DatasetRegistry(db);service=ConsistencyService(db)
    config=registry.get(dataset_row['dataset_id'])
    request=ConsistencyCompare(sample_a=config.dataset.id+':part-3.png',sample_b=config.dataset.id+':part-3.png')
    original=service.compare(request)
    bundle=service.evidence(original.evidence_id)
    frozen=bundle.sources.left
    assert len(frozen.masks)==1
    for annotation in frozen.annotations.annotations:
        if annotation.mask_path:Path(annotation.mask_path).unlink()
    shutil.rmtree(Path(db.db_path).parent/'cache',ignore_errors=True)
    Path(config.annotations.root,'part-3.json').write_text('{"imageWidth":320,"imageHeight":240,"shapes":[]}')
    registry.rescan(config.dataset.id)
    current=service.compare(request)
    assert current.result_id!=original.result_id
    reopened=service.evidence(original.evidence_id)
    assert reopened.source_states.left=='CHANGED'
    assert reopened.sources.left.annotations.annotations[0].raw_label=='待核实遮挡'
    path=service.evidence_media(original.evidence_id,'left-annotation_mask')['path']
    with Image.open(path) as image:assert image.convert('L').getbbox()==(90,110,111,131)


def test_tampered_retained_pixels_are_never_replaced_with_current_source(dataset):
    import pytest
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.consistency.errors import ConsistencyError

    db,_,config=dataset;service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png'))
    path=service.evidence_media(result.evidence_id,'left-original')['path']
    Path(path).write_bytes(b'changed')
    with pytest.raises(ConsistencyError,match='historical proof'):service.evidence(result.evidence_id)


def test_reordered_annotations_publish_new_facts_without_rewriting_history(dataset):
    import json
    from iad_core.consistency.evidence_models import ConsistencyCompare

    db,registry,config=dataset;service=ConsistencyService(db)
    path=Path(config.annotations.root)/'dent.json'
    document=json.loads(path.read_text());document['shapes'].append({'label':'pit','shape_type':'rectangle','points':[[40,40],[60,60]]})
    path.write_text(json.dumps(document));registry.rescan(config.dataset.id)
    request=ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png')
    previous=service.compare(request)
    before=service.evidence(previous.evidence_id)
    document['shapes'].reverse();path.write_text(json.dumps(document));registry.rescan(config.dataset.id)
    current=service.compare(request)
    assert current.result_id!=previous.result_id
    frozen=service.evidence(previous.evidence_id)
    assert frozen.sources.left.annotations==before.sources.left.annotations
    assert frozen.result==previous and frozen.source_states.left=='CHANGED'
    assert frozen.sources.left.image==service.evidence(current.evidence_id).sources.left.image


def test_source_replacement_before_rescan_cannot_freeze_stale_index_facts(dataset):
    import pytest
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.consistency.errors import ConsistencyError

    db,_,config=dataset
    Image.new('RGB',(320,240),'red').save(Path(config.root)/'dent.png')
    with pytest.raises(ConsistencyError,match='rescan'):
        ConsistencyService(db).compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png'))


def test_lossless_metadata_variants_share_one_retained_original(tmp_path):
    from PIL import PngImagePlugin
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.dataset.registry import DatasetImport,DatasetRegistry
    from iad_core.storage.database import Database

    root=tmp_path/'images';root.mkdir();image=Image.new('RGB',(40,30),'#6a8cad')
    image.save(root/'left.png',compress_level=0)
    metadata=PngImagePlugin.PngInfo();metadata.add_text('source','other-container')
    image.save(root/'right.png',compress_level=9,pnginfo=metadata)
    db=Database(str(tmp_path/'test.db'));registry=DatasetRegistry(db)
    config=registry.import_labelme(DatasetImport(format='labelme',name='不同编码',image_dir=str(root),annotation_dir=str(root)))
    service=ConsistencyService(db);result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':left.png',sample_b=config.dataset.id+':right.png'))
    bundle=service.evidence(result.evidence_id)
    assert bundle.sources.left.source_sha256!=bundle.sources.right.source_sha256
    assert bundle.sources.left.image==bundle.sources.right.image
    assert bundle.sources.left.scan_ref==bundle.sources.right.scan_ref


def test_two_independent_services_publish_the_same_immutable_evidence(dataset):
    from concurrent.futures import ThreadPoolExecutor
    from iad_core.consistency.evidence_models import ConsistencyCompare

    db,_,config=dataset
    request=ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png')
    with ThreadPoolExecutor(max_workers=2) as executor:
        results=list(executor.map(lambda _:ConsistencyService(db).compare(request),range(2)))
    assert results[0]==results[1]
    assert ConsistencyService(db).evidence(results[0].evidence_id).result==results[0]


def test_rgba_mask_overlay_preserves_transparency_without_losing_mask_pixels(tmp_path):
    import base64,io,json
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.dataset.registry import DatasetImport,DatasetRegistry
    from iad_core.storage.database import Database

    root=tmp_path/'images';root.mkdir()
    Image.new('RGBA',(20,20),(10,20,30,128)).save(root/'part.png')
    mask=Image.new('L',(5,5),255);buffer=io.BytesIO();mask.save(buffer,'PNG')
    (root/'part.json').write_text(json.dumps({'imageWidth':20,'imageHeight':20,'shapes':[
        {'label':'mask','shape_type':'mask','points':[[2,2],[6,6]],'mask':base64.b64encode(buffer.getvalue()).decode()}]}))
    db=Database(str(tmp_path/'test.db'));config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='透明图像',image_dir=str(root),annotation_dir=str(root)))
    service=ConsistencyService(db);result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':part.png',sample_b=config.dataset.id+':part.png'))
    media=service.evidence_media(result.evidence_id,'left-annotation_overlay')
    with Image.open(media['path']) as image:
        assert image.mode=='RGBA' and image.getpixel((0,0))==(10,20,30,128)
        assert image.getpixel((3,3))[:3]!=(10,20,30)


def test_human_review_is_frozen_separately_from_raw_quality(dataset):
    from uuid import uuid4
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.workbench.review import HumanReview,ReviewSubmission

    db,_,config=dataset;service=ConsistencyService(db)
    request=ConsistencyCompare(sample_a=config.dataset.id+':dent.png',sample_b=config.dataset.id+':scratch.png')
    reviewer=HumanReview(db)
    reviewer.submit(ReviewSubmission(submission_id=uuid4(),dataset_id=config.dataset.id,sample_id=request.sample_a,reviewer='operator',decision='PASS'))
    result=service.compare(request);frozen=service.evidence(result.evidence_id)
    assert frozen.sources.left.review.decision=='PASS'
    assert frozen.sources.left.sample.quality_status=='UNCERTAIN'
    reviewer.submit(ReviewSubmission(submission_id=uuid4(),dataset_id=config.dataset.id,sample_id=request.sample_a,reviewer='operator',decision='FAIL'))
    reopened=service.evidence(result.evidence_id)
    assert reopened.sources.left.review.decision=='PASS' and reopened.source_states.left=='CHANGED'
    assert service.compare(request).result_id!=result.result_id


def test_unreadable_annotation_remains_unavailable_in_export(defect_dataset):
    import json,zipfile,pytest
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.consistency.annotations import AnnotationSet

    db,row,_,_=defect_dataset
    config=DatasetRegistry(db).get(row['dataset_id'])
    identity=config.dataset.id+':part-3.png'
    annotations=AnnotationSet.capture(db,identity)
    Path(annotations.annotations[0].mask_path).unlink()
    service=ConsistencyService(db);result=service.compare(ConsistencyCompare(sample_a=identity,sample_b=identity))
    assert result.annotation.status=='PARTIAL'
    bundle=service.evidence(result.evidence_id)
    assert bundle.sources.left.issues
    assert not next(media for media in bundle.media if media.media_id=='left-annotation_overlay').available
    with pytest.raises(ConsistencyError) as error:service.evidence_media(result.evidence_id,'left-annotation_overlay')
    assert error.value.code=='ANNOTATION_UNREADABLE'
    artifact=service.evidence_export(result.evidence_id)
    with zipfile.ZipFile(artifact.path) as archive:
        manifest=json.loads(archive.read('evidence.json'))
        assert 'left-annotation_overlay' not in manifest['files']
        assert manifest['evidence']['sources']['left']['issues']


def test_frozen_gallery_thumbnail_does_not_replace_full_resolution_evidence(dataset, monkeypatch):
    from iad_core.consistency.evidence_models import ConsistencyCompare
    db, _, config = dataset
    service = ConsistencyService(db)
    result = service.compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    from iad_core.consistency.retrieval_sources import SourceImage
    reads = []
    original = SourceImage.read
    def record(path, published=None):
        reads.append(path)
        return original(path, published)
    monkeypatch.setattr(SourceImage, 'read', record)
    thumbnail = service.evidence_media(result.evidence_id, 'left-preview', max_side=96)
    full = service.evidence_media(result.evidence_id, 'left-original')
    assert reads == [], '冻结媒体不应重读当前来源，当前来源状态由证据详情单独核验'
    with Image.open(thumbnail['path']) as image:
        assert image.size == (96, 72)
    with Image.open(full['path']) as image:
        assert image.size == (320, 240)
    assert service.evidence(result.evidence_id).result == result
