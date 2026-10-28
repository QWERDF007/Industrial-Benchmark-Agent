import argparse
import json
from pathlib import Path

from iad_core.consistency.errors import ConsistencyError
from iad_core.evaluation.retrieval import evaluate_retrieval
from iad_core.evaluation.retrieval_models import RetrievalBenchmark
from iad_core.evaluation.retrieval_report import write_retrieval_report
from iad_core.feature.profiles import ImageEncoderConfig


def main() -> int:
    parser = argparse.ArgumentParser(description='Evaluate frozen industrial copies using actual configured image encoders')
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--profiles', required=True, help='Comma-separated names declared in the manifest')
    parser.add_argument('--device', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--batch-size', type=int, default=8)
    parser.add_argument('--top-k', type=int, default=50)
    args = parser.parse_args()
    manifest = RetrievalBenchmark.model_validate_json(args.manifest.read_bytes())
    manifest = manifest.model_copy(update={'datasets': {name: (root if root.is_absolute() else args.manifest.parent / root).resolve()
        for name, root in manifest.datasets.items()}})
    names = args.profiles.split(',')
    if len(set(names)) != len(names) or not set(names).issubset(manifest.profiles):
        parser.error('Profile names must be distinct configured manifest entries')
    if args.output.exists() and any(args.output.iterdir()):
        parser.error('Use a fresh output directory; existing evaluation evidence is retained')
    args.output.mkdir(parents=True, exist_ok=True)
    results = {}
    def progress(phase, completed, total):
        if completed % 20 == 0 or completed == total:
            print(json.dumps({'phase': phase, 'completed': completed, 'total': total}), flush=True)
    for name in names:
        config = ImageEncoderConfig(profile=manifest.profiles[name], device=args.device, batch_size=args.batch_size)
        print('Evaluating ' + name, flush=True)
        try:
            config.profile.verify_artifacts()
            import torch
            torch.set_num_threads(2)
            if config.device.startswith('cuda:') and torch.cuda.is_available():
                torch.cuda.set_device(config.device)
                torch.cuda.reset_peak_memory_stats(config.device)
            results[name] = evaluate_retrieval(manifest, config, args.output / name, top_k=args.top_k, progress=progress)
        except (ConsistencyError, OSError, ValueError) as error:
            results[name] = {'status': 'UNAVAILABLE', 'profile_id': config.profile.profile_id,
                'error_code': error.code if isinstance(error, ConsistencyError) else 'EVALUATION_FAILED',
                'reason': str(error), 'publication_ready': False}
            folder = args.output / name
            folder.mkdir(parents=True, exist_ok=True)
            (folder / 'metrics.json').write_text(json.dumps(results[name], ensure_ascii=False, indent=2))
        summary = write_retrieval_report(results, args.output)
        print(json.dumps({'profile': name, 'status': results[name]['status'], 'publication_ready': results[name]['publication_ready']}), flush=True)
    return 0 if summary['publication_ready'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
