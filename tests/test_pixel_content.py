import io

import numpy as np
import pytest
from PIL import Image, PngImagePlugin


def test_lossless_encoding_metadata_and_palette_preserve_the_strict_pixel_relation(tmp_path):
    from iad_core.duplicate.pixels import PixelContent

    original = Image.new('RGB', (11, 9), (12, 34, 56))
    a, b = tmp_path / 'original.png', tmp_path / 'renamed.png'
    original.save(a, compress_level=0)
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text('Comment', 'encoding metadata is not a pixel difference')
    original.save(b, compress_level=9, pnginfo=metadata)
    left, right = PixelContent.read(a), PixelContent.read(b)
    assert a.read_bytes() != b.read_bytes()
    assert left.descriptor.pixel_key == right.descriptor.pixel_key
    compared = left.compare(right)
    assert compared.status == 'COMPLETE'
    assert compared.exact_equal is True
    assert compared.compared_pixels == 99 and compared.changed_pixels == 0 and compared.max_abs_diff == 0
    palette = tmp_path / 'palette.png'
    original.quantize(colors=1).save(palette)
    assert left.compare(PixelContent.read(palette)).exact_equal is True


@pytest.mark.parametrize('mode,dtype,base,changed,max_diff', [
    ('RGB', np.uint8, (0, 100, 200), (255, 0, 200), 255),
    ('RGBA', np.uint8, (10, 20, 30, 255), (10, 20, 30, 254), 1),
    ('LA', np.uint8, (30, 255), (30, 254), 1),
    ('L', np.uint8, 255, 0, 255),
    ('I;16', np.uint16, 1024, 1025, 1),
])
def test_border_pixel_color_alpha_and_16bit_low_bits_are_never_exact(tmp_path, mode, dtype, base, changed, max_diff):
    from iad_core.duplicate.pixels import PixelContent

    shape = (7, 13, len(base)) if isinstance(base, tuple) else (7, 13)
    array = np.zeros(shape, dtype=dtype)
    array[:] = base
    image_a = Image.fromarray(array).copy()
    array[0, -1] = changed
    image_b = Image.fromarray(array)
    a, b = tmp_path / 'a.png', tmp_path / 'b.png'
    image_a.save(a)
    image_b.save(b)
    left, right = PixelContent.read(a), PixelContent.read(b)
    assert left.descriptor.bit_depth == (16 if mode == 'I;16' else 8)
    assert left.descriptor.pixel_key != right.descriptor.pixel_key
    result = left.compare(right, block_rows=2)
    assert result.exact_equal is False
    assert result.compared_pixels == 91
    assert result.changed_pixels == 1
    assert result.max_abs_diff == max_diff


def test_incompatible_unavailable_and_unsupported_are_not_zero_differences(tmp_path):
    from iad_core.duplicate.pixels import PixelContent

    rgb, rgba, smaller, broken, floating, animated = [tmp_path / name for name in
        ['rgb.png', 'rgba.png', 'smaller.png', 'broken.png', 'floating.tiff', 'animated.gif']]
    Image.new('RGB', (10, 10), 'blue').save(rgb)
    Image.new('RGBA', (10, 10), 'blue').save(rgba)
    Image.new('RGB', (9, 10), 'blue').save(smaller)
    broken.write_bytes(b'not an image')
    Image.fromarray(np.ones((10, 10), dtype=np.float32)).save(floating)
    Image.new('RGB', (10, 10), 'red').save(animated, save_all=True,
        append_images=[Image.new('RGB', (10, 10), 'blue')])
    original = PixelContent.read(rgb)
    for source in [rgba, smaller]:
        result = original.compare(PixelContent.read(source))
        assert result.status == 'INCOMPATIBLE'
        assert result.exact_equal is False and result.changed_pixels is None
    for source, expected in [(broken, 'UNAVAILABLE'), (floating, 'UNSUPPORTED'), (animated, 'UNSUPPORTED')]:
        content = PixelContent.read(source)
        assert content.descriptor.decode_status == expected and content.descriptor.reason
        result = original.compare(content)
        assert result.status == expected
        assert result.exact_equal is None and result.changed_pixels is None and result.max_abs_diff is None


def test_transparent_palette_expansion_exif_coordinates_and_lossless_preview(tmp_path):
    from iad_core.duplicate.pixels import PixelContent

    rgba = Image.new('RGBA', (4, 3), (0, 0, 0, 0))
    palette = Image.new('P', (4, 3), 0)
    palette.putpalette([0, 0, 0] * 256)
    a, b = tmp_path / 'rgba.png', tmp_path / 'palette.png'
    rgba.save(a)
    palette.save(b, transparency=0)
    assert PixelContent.read(a).compare(PixelContent.read(b)).exact_equal is True
    exif = Image.Exif()
    exif[274] = 6
    source = tmp_path / 'oriented.png'
    Image.new('RGB', (13, 7), 'red').save(source, exif=exif)
    content = PixelContent.read(source)
    assert (content.descriptor.width, content.descriptor.height) == (13, 7)
    assert content.descriptor.annotation_coordinates == 'EXIF_AMBIGUOUS'
    preview = Image.open(io.BytesIO(content.png()))
    assert preview.size == (13, 7) and 274 not in preview.getexif()
    assert content.compare(PixelContent.read(preview)).exact_equal is True


def test_16bit_tiff_integer_containers_keep_the_same_effective_depth(tmp_path):
    from iad_core.duplicate.pixels import PixelContent

    array = np.array([[0, 32768], [65535, 25]], dtype=np.uint16)
    png, tiff = tmp_path / '16.png', tmp_path / '16.tiff'
    Image.fromarray(array).save(png)
    Image.fromarray(array).save(tiff)
    compared = PixelContent.read(png).compare(PixelContent.read(tiff))
    assert compared.exact_equal is True and compared.max_abs_diff == 0


def test_wide_original_rows_and_separate_regions_keep_exact_integer_statistics():
    from iad_core.duplicate.pixels import PixelContent

    array=np.zeros((2,600001),dtype=np.uint16)
    left=PixelContent.read(Image.fromarray(array))
    changed=array.copy();changed[0,262144]=1;changed[1,524288]=17
    right=PixelContent.read(Image.fromarray(changed))
    result=left.compare(right,block_rows=1)
    assert result.compared_pixels==1200002 and result.changed_pixels==2 and result.max_abs_diff==17
    local=left.region_statistics(right,[[262143,0,262146,1],[524287,1,524290,2]])
    assert local.compared_pixels==6 and local.changed_pixels==2 and local.max_abs_diff==17
