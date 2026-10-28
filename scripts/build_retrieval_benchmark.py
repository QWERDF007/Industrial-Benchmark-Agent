import argparse
import json
from pathlib import Path

from iad_core.evaluation.benchmark_images import build_retrieval_benchmark
from iad_core.feature.profiles import EmbeddingProfile


def main():
    parser = argparse.ArgumentParser(description='Freeze independent industrial sources and controlled copy transformations')
    parser.add_argument('--db', required=True)
    parser.add_argument('--profiles-file', type=Path, required=True, help='Named EmbeddingProfile.create arguments')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--sources', type=int, default=220)
    parser.add_argument('--tuning-sources', type=int, default=20)
    parser.add_argument('--seed', type=int, default=7)
    args = parser.parse_args()
    profiles = {name: EmbeddingProfile.create(**definition) for name, definition in json.loads(args.profiles_file.read_text()).items()}
    manifest = build_retrieval_benchmark(args.db, profiles, args.output, sources=args.sources,
        tuning_sources=args.tuning_sources, seed=args.seed)
    print(json.dumps({'manifest': str(args.output / 'retrieval-benchmark.json'),
        'sources': len(manifest.sources), 'images': len(manifest.items), 'queries': len(manifest.queries)}))


if __name__ == '__main__':
    main()
