import json
import sys
from pathlib import Path

from PIL import Image


root = Path(sys.argv[1])
for subset, normals, defects in (
    ('labelme-a', 26, {'scratch.png': ['类别 2', '类别 10', '类别 2']}),
    ('labelme-b', 1, {'dent.png': ['凹陷'], 'scratch.png': ['类别 10']}),
):
    images, labels = root / subset / 'images', root / subset / 'labels'
    images.mkdir(parents=True)
    labels.mkdir()
    for filename in [*[f'normal-{index:02}.png' for index in range(normals)], *defects, 'missing.png', 'unreadable.png']:
        Image.new('RGB', (320, 240), '#a0a0a0').save(images / filename)
        if filename == 'missing.png':
            continue
        content = {'imageWidth': 320, 'imageHeight': 240, 'shapes': [
            {'shape_type': 'rectangle', 'label': category, 'points': [[20, 30], [100, 120]]}
            for category in defects.get(filename, [])]}
        (labels / Path(filename).with_suffix('.json')).write_text(
            '{invalid' if filename == 'unreadable.png' else json.dumps(content))

for role in ('OK', 'NG', 'unknown'):
    directory = root / 'folder' / role
    directory.mkdir(parents=True)
    Image.new('RGB', (320, 240), '#b0b0b0').save(directory / f'{role.lower()}.png')

directory = root / 'convention'
directory.mkdir()
Image.new('RGB', (320, 240), '#c0c0c0').save(directory / 'convention-normal.png')
