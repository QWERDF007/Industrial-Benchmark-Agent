"""Controlled pixels and separate case conditions for cross-product verification."""

import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance


def create_product_corpus(root: Path) -> dict:
    products = []
    conditions = ['normal', 'normal', 'brightness_variant', 'contaminated_pool', 'masked_foreign_material',
                  'wrong_label_normal', 'tiny_foreign_material', 'spatial_relation', 'specular_reflection', 'unobservable']
    for form in ('a', 'b'):
        directory = root / f'dataset-{form}'
        images, labels = directory / 'images', directory / 'labels'
        images.mkdir(parents=True)
        labels.mkdir()
        cases = []
        for index, condition in enumerate(conditions):
            image = Image.new('RGB', (768, 512), '#d0d4da')
            draw = ImageDraw.Draw(image)
            if form == 'a':
                draw.rounded_rectangle((96, 128, 672, 384), radius=20, fill='#343b44')
                for x in (192, 320, 448, 576):
                    dy = -48 if condition == 'spatial_relation' and x == 192 else 0
                    draw.rectangle((x-28, 184, x+28, 328), fill='#171e25')
                    draw.rectangle((x-18, 200+dy, x+18, 312+dy), fill='#d8b854')
                    draw.line((x-10, 205+dy, x-10, 307+dy), fill='#f6df96', width=4)
            else:
                draw.rectangle((96, 96, 672, 416), fill='#e4dfd0', outline='#665a48', width=8)
                for x in range(128, 652, 32):
                    draw.line((x, 112, x, 400), fill='#9a7952', width=12)
                for y in range(128, 401, 32):
                    dy = 16 if condition == 'spatial_relation' and y == 224 else 0
                    draw.line((112, y+dy, 656, y+dy), fill='#c9b792', width=12)
                    for x in range(128, 652, 64):
                        draw.rectangle((x-6, y+dy-7, x+6, y+dy+7), fill='#9a7952')
            if condition == 'contaminated_pool':
                draw.rectangle((174, 220, 210, 292), fill='#b62932')
            if condition == 'masked_foreign_material':
                draw.rectangle((160, 200, 224, 220), fill='#b62932')
                draw.rectangle((160, 200, 180, 296), fill='#b62932')
            if condition == 'tiny_foreign_material':
                draw.rectangle((190, 246, 194, 250), fill='#c3152b')
            if condition == 'specular_reflection':
                draw.polygon([(130, 150), (146, 140), (625, 348), (609, 360)], fill='#f8f4dc')
            if condition == 'unobservable':
                draw.rectangle((120, 168, 648, 344), fill='#fffefd')
            if condition == 'brightness_variant':
                image = ImageEnhance.Brightness(image).enhance(0.8)
            if index == 1:
                image = ImageEnhance.Brightness(image).enhance(1.04)
            file = f'sample-{index:02}.png'
            image.save(images / file)
            shapes = []
            if condition == 'masked_foreign_material':
                mask = Image.new('L', (65, 97))
                painter = ImageDraw.Draw(mask)
                painter.rectangle((0, 0, 64, 20), fill=255)
                painter.rectangle((0, 0, 20, 96), fill=255)
                payload = io.BytesIO()
                mask.save(payload, 'PNG')
                shapes = [{'label': '待核实区域', 'shape_type': 'mask', 'points': [[160, 200], [224, 296]],
                           'mask': base64.b64encode(payload.getvalue()).decode()}]
            elif condition in {'wrong_label_normal', 'spatial_relation', 'unobservable'}:
                shapes = [{'label': '待核实区域', 'shape_type': 'rectangle',
                           'points': [[160, 184], [224, 328]] if condition != 'unobservable' else [[120, 168], [648, 344]]}]
            elif condition in {'tiny_foreign_material', 'specular_reflection'}:
                points = [[186, 242], [198, 242], [198, 254], [186, 254]] if condition == 'tiny_foreign_material' else [
                    [128, 148], [146, 136], [628, 348], [609, 364]]
                shapes = [{'label': '待核实区域', 'shape_type': 'polygon', 'points': points}]
            if shapes:
                (labels / f'sample-{index:02}.json').write_text(json.dumps({
                    'imageWidth': 768, 'imageHeight': 512, 'shapes': shapes}, ensure_ascii=False))
            cases.append({'file': file, 'condition': condition})
        products.append({'root': str(directory.resolve()), 'form': 'four-contact connector' if form == 'a' else 'woven lattice', 'cases': cases})
    return {'products': products, 'industrial_quality': 'unassessed', 'case_conditions': 'generator controls; not human industrial truth'}


if __name__ == '__main__':
    target = Path(sys.argv[1]).resolve()
    corpus = create_product_corpus(target)
    (target / 'casebook.json').write_text(json.dumps(corpus, ensure_ascii=False, indent=2))
