import argparse
import json
from pathlib import Path

from iad_core.evaluation.retrieval_report import write_retrieval_report


def main() -> int:
    parser = argparse.ArgumentParser(description='Summarize recorded retrieval metrics with matching resource evidence; no model execution')
    parser.add_argument('--evaluation', type=Path, required=True)
    parser.add_argument('--resources', type=Path, action='append', default=[])
    args = parser.parse_args()
    recorded = json.loads((args.evaluation / 'metrics.json').read_text())
    results = {name: json.loads((args.evaluation / name / 'metrics.json').read_text()) for name in recorded['profiles']}
    summary = write_retrieval_report(results, args.evaluation, resource_paths=args.resources)
    print(json.dumps({'publication_ready': summary['publication_ready'], 'selected_default': summary['selected_default'],
        'resource_verified_profiles': [name for name, metrics in summary['profiles'].items()
            if metrics.get('resource_acceptance', {}).get('resource_acceptance_passed')]}))
    return 0 if summary['publication_ready'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
