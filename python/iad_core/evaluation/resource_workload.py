import hashlib
import io
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Literal

from PIL import Image, ImageDraw
from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Digest
from iad_core.consistency.retrieval_sources import SourceImage


class ResourceImage(AnalysisModel):
    path: Path
    sha256: Digest
    source_sha256: Digest
    kind: Literal['main', 'stress']
    resolution: int = Field(ge=1)


class ResourceWorkload(AnalysisModel):
    performance_only: Literal[True] = True
    items: list[ResourceImage]
    sources: dict[str, Digest]
    generation_workers: int


def materialize_resource_image(base: Image.Image, path: Path, signature: int, bits: int) -> str:
    image = base.copy()
    cell = max(1, min(12, image.width // (bits + 2)))
    draw = ImageDraw.Draw(image)
    for bit in range(bits):
        color = 'white' if signature & (1 << bit) else 'black'
        draw.rectangle((bit * cell, 0, (bit + 1) * cell - 1, cell * 2 - 1), fill=color)
    image.save(path, quality=92, subsampling=0)
    image.close()
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build_resource_workload(sources: list[Path], output: Path, *, count: int = 5000, resolution: int = 2048,
                            stress_count: int = 100, stress_resolution: int = 4096, workers: int = 2) -> ResourceWorkload:
    if not sources or min(count, resolution, stress_count, stress_resolution, workers) < 1:
        raise ValueError('A resource workload requires source images and positive sizes')
    output = Path(output).resolve()
    output.mkdir(parents=True)
    roots = {kind: output / kind for kind in ('main', 'stress')}
    for root in roots.values():
        root.mkdir()
    bits = (count + stress_count).bit_length()

    def generate(source_index):
        source = SourceImage.read(str(sources[source_index]))
        with Image.open(io.BytesIO(source.payload)) as opened:
            original = opened.convert('RGB')
        items = []
        for kind, total, size, offset in [('main', count, resolution, 0), ('stress', stress_count, stress_resolution, count)]:
            positions = range(source_index, total, len(sources))
            if not positions:
                continue
            base = original.resize((size, size), Image.Resampling.LANCZOS)
            for position in positions:
                path = roots[kind] / f'{position:06}.jpg'
                digest = materialize_resource_image(base, path, position + offset, bits)
                items.append(ResourceImage(path=path, sha256=digest,
                    source_sha256=source.sha256, kind=kind, resolution=size))
            base.close()
        original.close()
        return source.sha256, items

    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix='iad-resource-images') as pool:
        generated = list(pool.map(generate, range(min(len(sources), max(count, stress_count)))))
    workload = ResourceWorkload(items=sorted((item for _, items in generated for item in items), key=lambda item: str(item.path)),
        sources={str(sources[index]): sha for index, (sha, _) in enumerate(generated)}, generation_workers=workers)
    (output / 'workload.json').write_text(workload.model_dump_json(indent=2))
    return workload
