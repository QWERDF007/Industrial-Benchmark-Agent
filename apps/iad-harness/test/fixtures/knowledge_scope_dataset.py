from pathlib import Path
import sys
from PIL import Image, ImageDraw

root = Path(sys.argv[1])
(root / 'images').mkdir()
(root / 'labels').mkdir()
for index in range(43):
    image = Image.new('RGB', (160, 100), (150 + index, 180, 200))
    ImageDraw.Draw(image).rectangle((20 + index, 20, 80 + index, 60), fill=(80, index + 30, 50))
    image.save(root / 'images' / f'part-{index:02}.png')
