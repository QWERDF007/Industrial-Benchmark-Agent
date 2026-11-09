import pytest
from PIL import Image


def test_independent_support_preserves_raw_16bit_content_identity(tmp_path):
    import numpy as np
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.storage.database import Database
    from iad_core.knowledge.sources import KnowledgeSources
    from iad_core.knowledge.support import KnowledgeSupport
    root = tmp_path / 'sensor'
    root.mkdir()
    pixels = np.array([[1000, 2000], [3000, 4000]], dtype=np.uint16)
    Image.fromarray(pixels).save(root / 'first.tiff')
    pixels[0, 0] += 1
    Image.fromarray(pixels).save(root / 'second.tiff')
    db = Database(str(tmp_path / 'sensor.db'))
    config = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme', name='16位来源', image_dir=str(root), annotation_dir=str(root)))
    sources = [KnowledgeSources(db).capture(config.dataset.id + ':' + name + '.tiff', 'initial_unannotated') for name in ('first', 'second')]
    groups = KnowledgeSupport(db).groups(sources)
    assert len(set(groups.values())) == 2


@pytest.mark.parametrize('target_name',['duplicate','independent'])
def test_reference_support_keeps_actual_identity_across_dataset_tasks(tmp_path,target_name):
    from PIL.PngImagePlugin import PngInfo
    from iad_core.dataset.registry import DatasetImport,DatasetRegistry
    from iad_core.knowledge.sources import KnowledgeSources
    from iad_core.knowledge.support import KnowledgeSupport
    from iad_core.storage.database import Database
    roots=[tmp_path/name for name in ('controls','targets')]
    for root in roots:root.mkdir()
    pixels=Image.new('RGB',(32,24),'blue')
    pixels.save(roots[0]/'control.png')
    metadata=PngInfo();metadata.add_text('origin','different container, identical pixels')
    pixels.save(roots[1]/'duplicate.png',pnginfo=metadata)
    pixels.putpixel((0,0),(0,1,255));pixels.save(roots[1]/'independent.png')
    db=Database(str(tmp_path/'references.db'))
    registry=DatasetRegistry(db)
    controls,targets=[registry.import_labelme(DatasetImport(format='labelme',name=root.name,
        image_dir=str(root),annotation_dir=str(root))) for root in roots]
    assert controls.task.task_id!=targets.task.task_id
    control_id=controls.dataset.id+':control.png'
    target_id=targets.dataset.id+':'+target_name+'.png'
    sources=KnowledgeSources(db)
    control=sources.capture(control_id,'initial_unannotated')
    support=KnowledgeSupport(db)
    target_groups=support.groups([control],target_sample_id=target_id)
    assert set(target_groups)=={control_id,target_id}
    assert (target_groups[control_id]==target_groups[target_id])==(target_name=='duplicate')
    others=[sources.capture(targets.dataset.id+':'+name+'.png','initial_unannotated')
        for name in ('duplicate','independent')]
    groups=support.groups([control,*others])
    assert set(groups)=={source.sample_id for source in [control,*others]}
    assert groups[control_id]==groups[others[0].sample_id]
    assert groups[control_id]!=groups[others[1].sample_id]
