"""Run with the base installation, without torch or any FAISS distribution."""

import argparse
import importlib.metadata
import importlib.util
import json
import tempfile
from pathlib import Path

from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.duplicate.pixels import PixelContent
from iad_core.consistency.annotations import AnnotationMatcher, AnnotationSet
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.storage.database import Database
from iad_core.tools import execute_internal_tool
from iad_core.workbench.runtime import WorkbenchRuntime


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    assert all(importlib.util.find_spec(name) is None for name in ('torch', 'faiss')), 'Use a base-only virtual environment'
    with tempfile.TemporaryDirectory(prefix='iad-content-index-cpu-') as temporary:
        root = Path(temporary)
        images, labels = root / 'images', root / 'labels'
        images.mkdir(); labels.mkdir()
        Image.new('RGBA', (32, 32), (1, 2, 3, 4)).save(images / 'a.png')
        Image.new('RGBA', (32, 32), (1, 2, 3, 4)).save(images / 'b.png', compress_level=0)
        changed = Image.new('RGBA', (32, 32), (1, 2, 3, 4))
        changed.putpixel((31, 31), (1, 2, 3, 5))
        changed.save(images / 'c.png')
        (labels / 'a.json').write_text(json.dumps({'imageWidth':32,'imageHeight':32,
            'shapes':[{'label':'dent','shape_type':'rectangle','points':[[1,1],[4,4]]}]}))
        Image.new('I;16', (32, 32), 257).save(images / 'integer.tiff')
        db = Database(str(root / 'cpu.db'))
        registry = DatasetRegistry(db)
        config = registry.import_labelme(DatasetImport(format='labelme', name='CPU 像素验证',
            image_dir=str(images), annotation_dir=str(labels), annotation_policy=AnnotationPolicy(
                policy_id='cpu-example',annotation_role='REFERENCE',annotation_coverage='EXHAUSTIVE')))
        index = PixelIndex(db)
        members = [index.get(config.dataset.id + ':' + name) for name in ('a.png', 'b.png', 'c.png')]
        assert members[0].content_group_id == members[1].content_group_id != members[2].content_group_id
        assert index.members(members[0].content_group_id).total == 2
        annotation_result = AnnotationMatcher().compare(
            AnnotationSet.capture(db,members[0].sample_id),AnnotationSet.capture(db,members[1].sample_id),relation='EXACT')
        assert annotation_result.confirmed_conflict
        single_sided = [item for item in annotation_result.differences if item.type=='ONE_SIDED_REGION']
        assert len(single_sided)==1 and single_sided[0].region==[1,1,4,4]
        difference = PixelContent.read(images / 'a.png').compare(PixelContent.read(images / 'c.png'))
        assert difference.changed_pixels == 1 and not difference.exact_equal
        rescanned = registry.rescan(config.dataset.id)
        assert rescanned.pixel_index.reused_samples == 4 and rescanned.pixel_index.decoded_images == 0
        assert rescanned.pixel_index.coverage.completed == 4
        assert index.get(config.dataset.id + ':integer.tiff').descriptor.bit_depth == 16
        assert execute_internal_tool('task_inspect', {'task_id':config.task.task_id}, db_path=db.db_path)['status'] == 'OK'
        runtime = WorkbenchRuntime(db)
        runtime.close()
        import sys
        assert 'iad_core.workbench.vision' not in sys.modules
        result = {'torch_installed':False, 'faiss_installed':False, 'strict_copy_members':2,
            'edge_alpha_difference':difference.model_dump(), 'rescan':rescanned.pixel_index.model_dump(),
            'annotation_differences':annotation_result.model_dump(),
            'versions':{name:importlib.metadata.version(name) for name in ('numpy','pillow','pydantic','filelock')}}
        output = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(output + '\n')
    print(output)


if __name__ == '__main__':
    main()
