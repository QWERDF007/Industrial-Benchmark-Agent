import pytest
from PIL import Image, ImageDraw

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database


@pytest.fixture
def knowledge_dataset(tmp_path, request):
    images, labels = tmp_path / "images", tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for index in range(6):
        size = getattr(request, "param", (320, 240))
        image = Image.new("RGB", size, "#cccccc")
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill="#333333")
        for x in (100, 220):
            draw.ellipse((x - 15, 105, x + 15, 135), fill="#cccccc")
        if size[0] > 1800:
            image.putpixel((1800, 220), (255, 0, 0))
        image.save(images / f"part-{index}.png")
    db = Database(str(tmp_path / "knowledge.db"))
    config = DatasetRegistry(db).import_labelme(DatasetImport(
        name="双孔部件", image_dir=str(images), annotation_dir=str(labels),
    ))
    return db, config
