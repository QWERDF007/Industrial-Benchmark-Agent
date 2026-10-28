"""Real-weight retrieval workflow; not the S18 recall or scale acceptance gate."""

import argparse
import hashlib
import json
import shutil
import tempfile
import time
from pathlib import Path

from PIL import Image

from iad_core.consistency.models import ImageRetrieve, TemporaryImageQuery
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.consistency.service import ConsistencyService
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.workbench.runtime import close_workbenches, workbench


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profiles-file', type=Path, required=True)
    parser.add_argument('--model-id', required=True)
    parser.add_argument('--image', type=Path, action='append', required=True)
    parser.add_argument('--device', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if len(args.image) != 2:
        parser.error('Provide two different industrial source images')
    profile = EmbeddingProfile.create(**next(value for value in json.loads(args.profiles_file.read_text()) if value['model_id'] == args.model_id))
    selection = ImageEncoderConfig(profile=profile, device=args.device, batch_size=2)
    try:
        with tempfile.TemporaryDirectory(prefix='iad-real-retrieval-') as temporary:
            root = Path(temporary)
            query_root, corpus_root = root / 'query', root / 'corpus'
            query_root.mkdir(); corpus_root.mkdir()
            query_path = query_root / ('query' + args.image[0].suffix)
            shutil.copyfile(args.image[0], query_path)
            for index in range(80):
                shutil.copyfile(args.image[0], corpus_root / (f'{index:03}' + args.image[0].suffix))
            shutil.copyfile(args.image[1], corpus_root / ('other' + args.image[1].suffix))
            with Image.open(args.image[0]) as source:
                width, height = source.size
            (corpus_root / '079.json').write_text(json.dumps({'imageWidth': width, 'imageHeight': height,
                'shapes': [{'label': '待核实区域', 'shape_type': 'rectangle', 'points': [[2, 2], [10, 10]]}]}))
            db = Database(str(root / 'retrieval.db'))
            registry = DatasetRegistry(db)
            policy = {'policy_id': 'verification-surface-v1', 'annotation_role': 'REFERENCE', 'annotation_coverage': 'EXHAUSTIVE'}
            configs = [registry.import_labelme(DatasetImport(format='labelme', name=name,
                image_dir=str(images), annotation_dir=str(images), annotation_policy=policy))
                for name, images in [('query', query_root), ('corpus', corpus_root)]]
            query_id = configs[0].dataset.id + ':' + query_path.name
            ImageEncoders(db).save(ImageEncoderEdit(expected_revision=0, selection=selection))
            service = ConsistencyService(db)
            request = ImageRetrieve(query={'kind': 'sample', 'sample_id': query_id},
                corpus_scope={'kind': 'datasets', 'dataset_ids': [configs[1].dataset.id]}, top_k=2)
            assert FeatureRepository(db).get_for_sample(query_id, profile.profile_id) is None
            runtime = workbench(db.db_path)
            assert runtime.images.stats().instances_created == runtime.images.stats().encode_calls == 0
            started = time.perf_counter()
            partial = service.retrieve(request)
            assert partial.visual.status == 'PARTIAL' and partial.visual.corpus_coverage.completed == 80
            assert partial.exact.member_count == 80 and partial.exact.groups[0].conflict_count == 1
            with db.connection() as connection:
                groups = [row[0] for row in connection.execute('SELECT group_id FROM image_content_groups')]
            records = FeatureRepository(db).records(groups, profile.profile_id)
            assert len(records) == 1 and records[0]['attempt_count'] == 1
            first_seconds = time.perf_counter() - started
            cold_encoder_calls = runtime.images.stats().encode_calls
            assert cold_encoder_calls == runtime.images.stats().instances_created == 1
            ids = [sample.sample_id for sample in ConsistencyScopes(db).resolve(request.corpus_scope).samples]
            prepared = ContentFeatureCache(db, workbench(db.db_path).images).prepare(ids, selection)
            assert prepared.encoded_content_count == prepared.cache_hit_count == 1
            started = time.perf_counter()
            result = service.retrieve(request)
            query_seconds = time.perf_counter() - started
            assert result.visual.status == 'READY' and result.exact.member_count == 80 and result.member_count == 81
            assert result.coverage.verification.completed == 81 and result.coverage.annotation.completed == 80
            group = result.exact.groups[0]
            for _ in range(3):
                last = service.retrieve(request.model_copy(update={'cursor': group.next_member_cursor}))
                group = last.exact.groups[0]
            assert len(group.members) == 8 and group.members[-1].annotation.confirmed_conflict
            runtime = workbench(db.db_path)
            image = runtime.temporary_images.accept(args.image[0].read_bytes(), owner_id='verification-session')
            temporary_request = request.model_copy(update={'query': TemporaryImageQuery(image_ref=image.image_ref)})
            temporary_seconds = []
            before_temporary = runtime.images.stats()
            for _ in range(2):
                started = time.perf_counter()
                temporary_result = service.retrieve(temporary_request, owner_id='verification-session')
                temporary_seconds.append(time.perf_counter() - started)
                assert temporary_result.member_count == 81 and temporary_result.coverage.annotation.pending == 81
            assert runtime.images.stats().encode_calls - before_temporary.encode_calls == 1
            assert runtime.images.stats().instances_created == 1
            assert runtime.temporary_images.stats().vector_bytes == profile.dim * 4
            runtime.temporary_images.release_owner('verification-session')
            assert runtime.temporary_images.stats().image_count == runtime.temporary_images.stats().vector_bytes == 0
            records = FeatureRepository(db).records(groups, profile.profile_id)
            assert len(records) == 2 and all(record['attempt_count'] == 1 for record in records)
            started = time.perf_counter()
            compared = service.compare(ConsistencyCompare(sample_a=query_id, sample_b=configs[1].dataset.id + ':079' + args.image[0].suffix))
            frozen_seconds = time.perf_counter() - started
            bundle = service.evidence(compared.evidence_id)
            assert bundle.result.annotation.confirmed_conflict
            media_root = args.output.parent / (args.output.stem + '-media')
            media_root.mkdir(parents=True, exist_ok=True)
            rendered = []
            started = time.perf_counter()
            for media in bundle.media:
                if media.available:
                    artifact = service.evidence_media(compared.evidence_id, media.media_id)
                    payload = Path(artifact['path']).read_bytes()
                    with Image.open(artifact['path']) as actual:
                        assert actual.width > 0 and actual.height > 0
                    destination = media_root / (media.media_id + '.png')
                    destination.write_bytes(payload)
                    rendered.append({'media_id': media.media_id, 'representation': media.representation,
                        'path': str(destination), 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest()})
            rendering_seconds = time.perf_counter() - started
            evidence = {'verification': __doc__, 'profile': profile.model_dump(mode='json'), 'device': args.device,
                'initial_query_seconds': first_seconds, 'warm_query_seconds': query_seconds,
                'first_query_had_cached_vector': False, 'first_query_encoder_calls': cold_encoder_calls,
                'temporary_uncached_vector_seconds': temporary_seconds[0], 'temporary_cached_vector_seconds': temporary_seconds[1],
                'frozen_comparison_seconds': frozen_seconds, 'evidence_rendering_seconds': rendering_seconds,
                'cold_query_with_evidence_seconds': first_seconds + frozen_seconds + rendering_seconds,
                'evidence_id': compared.evidence_id, 'rendered': rendered,
                'initial_partial': partial.model_dump(mode='json'), 'explicit_prepare': prepared.model_dump(mode='json'),
                'ready': result.model_dump(mode='json'), 'last_member_page': last.model_dump(mode='json'),
                'temporary': temporary_result.model_dump(mode='json'), 'index_stats': runtime.indexes.stats().model_dump(),
                'after_release': runtime.temporary_images.stats().model_dump()}
        args.output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({'verification': __doc__, 'members': result.member_count, 'exact_members': result.exact.member_count,
            'confirmed_conflicts': result.exact.groups[0].conflict_count, 'initial_query_seconds': first_seconds,
            'warm_query_seconds': query_seconds, 'temporary': 'released'}, ensure_ascii=False))
    finally:
        close_workbenches()


if __name__ == '__main__':
    main()
