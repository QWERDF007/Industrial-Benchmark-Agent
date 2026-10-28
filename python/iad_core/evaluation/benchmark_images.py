import hashlib
import random
import shutil
import sqlite3
from pathlib import Path

from PIL import Image, ImageEnhance

from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.index import PixelIndex
from iad_core.evaluation.retrieval_models import BenchmarkImage, BenchmarkQuery, BenchmarkSource, RetrievalBenchmark
from iad_core.feature.profiles import EmbeddingProfile


def build_retrieval_benchmark(db_path: str, profiles: dict[str, EmbeddingProfile], output: Path, *,
                              sources: int = 220, tuning_sources: int = 20, seed: int = 7) -> RetrievalBenchmark:
    if not 0 <= tuning_sources < sources:
        raise ValueError('Keep at least one source exclusively for acceptance')
    with sqlite3.connect(Path(db_path).resolve().as_uri() + '?mode=ro', uri=True) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute('''SELECT s.sample_id,s.image_path,p.* FROM samples s
            JOIN sample_pixel_index p ON p.sample_id=s.sample_id JOIN datasets d ON d.dataset_id=s.dataset_id
            WHERE s.is_excluded=0 AND p.scan_ref=d.scan_ref AND p.content_group_id IS NOT NULL
            ORDER BY s.sample_id''').fetchall()
    unique = {}
    for row in rows:
        unique.setdefault(row['content_group_id'], row)
    rows = list(unique.values())
    random.Random(seed).shuffle(rows)
    if len(rows) < sources:
        raise ValueError(f'Requested {sources} distinct published sources, only {len(rows)} available')
    output = Path(output).resolve()
    output.mkdir(parents=True)
    roots = {name: output / name for name in ('queries', 'references')}
    for root in roots.values():
        root.mkdir()
    images, queries, provenance = [], [], {}
    for position, row in enumerate(rows[:sources]):
        original = SourceImage.read(row['image_path'], PixelIndex.entry(row))
        group = row['content_group_id']
        split = 'tuning' if position < tuning_sources else 'acceptance'
        provenance[group] = BenchmarkSource(sample_id=row['sample_id'], image_path=Path(row['image_path']), sha256=original.sha256)

        def capture(name, dataset, path, stratum):
            images.append(BenchmarkImage(item_id=name, dataset=dataset, relative_path=path.name,
                sha256=hashlib.sha256(path.read_bytes()).hexdigest(), source_group=group, split=split, stratum=stratum))

        query_id = f'source-{position:04}-query'
        query_path = roots['queries'] / (query_id + Path(row['image_path']).suffix.lower())
        query_path.write_bytes(original.payload)
        capture(query_id, 'queries', query_path, 'original')
        positives, strict = [], []
        exact_id = f'source-{position:04}-exact'
        exact_path = roots['references'] / (exact_id + query_path.suffix)
        shutil.copyfile(query_path, exact_path)
        capture(exact_id, 'references', exact_path, 'exact')
        positives.append(exact_id); strict.append(exact_id)
        with Image.open(query_path) as opened:
            image = opened.copy()
        if image.mode not in ('L', 'LA', 'RGB', 'RGBA'):
            raise ValueError('Benchmark transformations require supported integer grayscale or color images')
        width, height = image.size
        transforms = {'lossless': image, 'jpeg': image.convert('RGB'),
            'resize': image.resize((max(1, width * 3 // 4), max(1, height * 3 // 4)), Image.Resampling.LANCZOS),
            'brightness': ImageEnhance.Brightness(image).enhance(.92),
            'crop': image.crop((width // 8, height // 8, width - width // 8, height - height // 8)),
            'rotation': image.rotate(5, resample=Image.Resampling.BICUBIC, fillcolor=image.getpixel((0, 0)))}
        for stratum, transformed in transforms.items():
            identity = f'source-{position:04}-{stratum}'
            path = roots['references'] / (identity + ('.jpg' if stratum == 'jpeg' else '.png'))
            transformed.save(path, **({'quality': 85} if stratum == 'jpeg' else {}))
            capture(identity, 'references', path, stratum)
            positives.append(identity)
            if stratum == 'lossless':
                strict.append(identity)
        negative = f'source-{position:04}-controlled-micro-defect'
        defective = image.copy()
        value = defective.getpixel((width // 2, height // 2))
        defective.putpixel((width // 2, height // 2), (value[0] ^ 1, *value[1:]) if isinstance(value, tuple) else value ^ 1)
        path = roots['references'] / (negative + '.png')
        defective.save(path)
        capture(negative, 'references', path, 'controlled_micro_defect')
        if position == tuning_sources:
            for member in range(80):
                identity = f'source-{position:04}-large-group-{member:03}'
                path = roots['references'] / (identity + query_path.suffix)
                shutil.copyfile(query_path, path)
                capture(identity, 'references', path, 'exact')
                positives.append(identity); strict.append(identity)
        queries.append(BenchmarkQuery(query_id=query_id, relevant_ids=positives, strict_ids=strict,
            hard_negative_ids=[negative], verification='controlled_transforms'))
    manifest = RetrievalBenchmark(origin='industrial', datasets=roots, corpus=['references'], items=images,
        queries=queries, profiles=profiles, sources=provenance)
    (output / 'retrieval-benchmark.json').write_text(manifest.model_dump_json(indent=2))
    return manifest
