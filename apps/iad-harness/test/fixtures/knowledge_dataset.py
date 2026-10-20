import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

root = Path(sys.argv[1])
images, labels = root / 'images', root / 'labels'
images.mkdir(parents=True)
labels.mkdir()
for index in range(3):
    image = Image.new('RGB', (320, 240), (205 + index * 4,) * 3)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((40, 60, 280, 180), radius=12, fill=(55 + index * 3,) * 3)
    for x in (100, 220):
        draw.ellipse((x-15, 105, x+15, 135), fill=(205 + index * 4,) * 3)
    if index == 2:
        draw.rectangle((90, 110, 110, 130), fill=(200, 35, 35))
    image.save(images / f'part-{index}.png')
(labels / 'part-2.json').write_text(json.dumps({'imageWidth': 320, 'imageHeight': 240,
    'shapes': [{'shape_type': 'rectangle', 'label': '待核实区域', 'points': [[80, 90], [120, 150]]}]}))
