import cv2
import numpy as np
import pytest
from PIL import Image

from iad_core.consistency.identity_geometry import ImageCorrespondence
from iad_core.duplicate.verification_models import Registration


@pytest.fixture
def sparse_pair(tmp_path):
    rows, columns = np.mgrid[:480, :640]
    image = np.full((480, 640), 128., dtype=np.float64)
    for index, (x, y) in enumerate(((80, 200), (120, 250), (160, 300), (200, 350))):
        radius = 5 + index
        distance = ((columns - x) / (radius * (.7 + index * .1))) ** 2 + ((rows - y) / radius) ** 2
        image += (100 - index * 10) * np.exp(-.5 * distance)
    image = np.uint8(image)
    candidate = cv2.warpAffine(image, np.float64([[1, 0, -2], [0, 1, -4]]), (640, 480), borderValue=128)
    paths = [tmp_path / 'sparse-main.png', tmp_path / 'sparse-candidate.png']
    for path, pixels in zip(paths, (image, candidate)):
        Image.fromarray(pixels).save(path)
    return paths


@pytest.mark.parametrize('reverse', [False, True])
def test_sparse_features_preserve_a_distant_regions_position_and_size(sparse_pair, reverse):
    paths = list(sparse_pair)
    if reverse:
        paths.reverse()
    geometry = ImageCorrespondence.estimate(*(str(path) for path in paths))
    assert geometry.facts.status == 'registered'
    projected = geometry.project([550, 30, 565, 45])
    expected = [[548, 26], [563, 26], [563, 41], [548, 41]] if reverse else [
        [552, 34], [567, 34], [567, 49], [552, 49]]
    np.testing.assert_allclose(projected, expected, atol=.7)
    assert 3 <= geometry.facts.inliers <= geometry.facts.matches < 8
    assert geometry.facts.main_visible_fraction > .95


@pytest.mark.parametrize('scales', [(1, 1), (6, 5)])
def test_similarity_registration_preserves_rotation_scale_and_original_resolution(tmp_path, scales):
    image = np.random.default_rng(31).integers(0, 256, (400, 500), dtype=np.uint8)
    candidate_to_main = cv2.getRotationMatrix2D((250, 200), 8, 1.1)
    candidate = cv2.warpAffine(image, cv2.invertAffineTransform(candidate_to_main), (500, 400))
    paths = [tmp_path / 'main.png', tmp_path / 'candidate.png']
    for path, array, scale in zip(paths, (image, candidate), scales):
        Image.fromarray(array).resize((500 * scale, 400 * scale), Image.Resampling.LANCZOS).save(path)
    geometry = ImageCorrespondence.estimate(*(str(path) for path in paths))
    assert geometry.facts.status == 'registered'
    expected = cv2.transform(np.float64([[[200, 150], [220, 150], [220, 170], [200, 170]]]),
        candidate_to_main)[0] * scales[0]
    np.testing.assert_allclose(geometry.project(np.float64([200, 150, 220, 170]) * scales[1]),
        expected, atol=.7 * scales[0])


def test_inverse_registration_expresses_uncertainty_in_the_other_images_pixels():
    matrix = np.float64([[2, 0, 10], [0, 2, 20], [0, 0, 1]])
    geometry = ImageCorrespondence(matrix, Registration(status='registered',
        candidate_to_main=matrix.tolist(), reprojection_error_px=3))
    inverse = geometry.inverted()
    assert inverse.facts.reprojection_error_px == pytest.approx(1.5)
    np.testing.assert_allclose(inverse.project([10, 20, 30, 40]), [[0, 0], [10, 0], [10, 10], [0, 10]])
    assert inverse.inverted().facts.reprojection_error_px == pytest.approx(3)
