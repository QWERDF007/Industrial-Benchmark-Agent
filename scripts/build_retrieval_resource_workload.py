import argparse
import json
from pathlib import Path

from iad_core.evaluation.resource_workload import build_resource_workload
from iad_core.evaluation.retrieval_models import RetrievalBenchmark


def main():
    parser = argparse.ArgumentParser(description='Materialize full-resolution industrial-derived files for resource measurements only')
    parser.add_argument('--source-manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--count', type=int, default=5000)
    parser.add_argument('--resolution', type=int, default=2048)
    parser.add_argument('--stress-count', type=int, default=100)
    parser.add_argument('--stress-resolution', type=int, default=4096)
    args = parser.parse_args()
    source = RetrievalBenchmark.model_validate_json(args.source_manifest.read_bytes())
    paths = [item.image_path for item in source.sources.values()]
    workload = build_resource_workload(paths, args.output, count=args.count, resolution=args.resolution,
        stress_count=args.stress_count, stress_resolution=args.stress_resolution)
    print(json.dumps({'images': len(workload.items), 'sources': len(workload.sources), 'performance_only': workload.performance_only}))


if __name__ == '__main__':
    main()
