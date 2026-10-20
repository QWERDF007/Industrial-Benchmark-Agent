import hashlib
from pathlib import Path

from PIL import Image

from iad_core.entry import dataset_import, dataset_scan, sample_get
from iad_core.tools.image_tools import sample_view
from tests.product_corpus import create_product_corpus


def test_controlled_products_import_real_pixels_and_masks_without_exposing_case_answers(tmp_path):
    corpus = create_product_corpus(tmp_path)
    db_path = str(tmp_path / 'verification.db')
    assert len(corpus['products']) == 2
    hashes = []
    for product in corpus['products']:
        root = Path(product['root'])
        assert sorted(p.name for p in root.iterdir()) == ['images', 'labels']
        dataset = dataset_import({'name': root.name, 'image_dir': str(root / 'images'),
                                  'annotation_dir': str(root / 'labels')}, db_path)
        assert len(product['cases']) == 10
        originals = {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
        for case in product['cases']:
            detail = sample_get({'sample_id': dataset['dataset_id'] + ':' + case['file']}, db_path)
            assert detail['review_decision'] is None
            assert detail['suggestion'] is None
            assert detail['sample']['width'] == 768
            assert detail['sample']['height'] == 512
            assert len(detail['annotations']) == (case['condition'] not in {'normal', 'brightness_variant', 'contaminated_pool'})
            assert all(a['geometry_status'] == 'VALID' and a['raw_label'] == '待核实区域' for a in detail['annotations'])
        masked = product['cases'][4]
        detail = sample_get({'sample_id': dataset['dataset_id'] + ':' + masked['file']}, db_path)
        annotation, = detail['annotations']
        assert annotation['annotation_type'] == 'mask'
        assert annotation['bbox'] == [160, 200, 225, 297]
        with Image.open(annotation['mask_path']) as image:
            assert image.size == (768, 512)
            assert image.getpixel((168, 208)) == 255
            assert image.getpixel((200, 240)) == 0
        viewed = sample_view(dataset['dataset_id'], detail['sample']['sample_id'], view='annotation_overlay', db_path=db_path)
        assert viewed.status.value == 'OK'
        with Image.open(viewed.metrics['view_path']) as overlay, Image.open(root / 'images' / masked['file']) as raw:
            assert overlay.getpixel((168, 208)) != raw.getpixel((168, 208))
            assert overlay.getpixel((200, 240)) == raw.getpixel((200, 240))
        dataset_scan({'dataset_id': dataset['dataset_id']}, db_path)
        assert {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in originals} == originals
        hashes.append(originals[root / 'images/sample-00.png'])
    assert hashes[0] != hashes[1], 'Different product forms must be different actual pixels'
