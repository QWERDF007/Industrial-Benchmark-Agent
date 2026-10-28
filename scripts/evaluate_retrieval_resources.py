import argparse
import json
from pathlib import Path

from iad_core.evaluation.resource_workload import ResourceWorkload
from iad_core.feature.profiles import ImageEncoderConfig


def main():
    parser = argparse.ArgumentParser(description='Measure full-resolution retrieval resources in separate model and verification processes')
    parser.add_argument('--stage', choices=['prepare', 'measure', 'incremental', 'report'], required=True)
    parser.add_argument('--workload', type=Path, required=True)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--queries', type=int, default=30)
    parser.add_argument('--candidates', type=int, default=20)
    args = parser.parse_args()
    workload = ResourceWorkload.model_validate_json(args.workload.read_bytes())
    config = ImageEncoderConfig.model_validate_json(args.config.read_bytes())
    if args.stage != 'prepare':
        prepared = json.loads((args.output / 'prepared.json').read_text())
        if ImageEncoderConfig.model_validate(prepared['config']) != config:
            parser.error('Resource stages require the same frozen encoder configuration')

    def progress(phase, completed, total):
        print(json.dumps({'phase': phase, 'completed': completed, 'total': total}), flush=True)

    if args.stage == 'prepare':
        import torch
        from iad_core.evaluation.resource_preparation import prepare_resource_index
        torch.set_num_threads(2)
        if config.device.startswith('cuda:'):
            torch.cuda.set_device(config.device)
            torch.cuda.reset_peak_memory_stats(config.device)
        result = prepare_resource_index(workload, config, args.output, progress=progress)
        print(json.dumps({'stage': 'PREPARED', 'encoded_content': result['prepared']['encoded_content_count'],
            'encoded_pixels': result['prepared']['encoded_pixels'], 'seconds': result['seconds'], 'throughput': result['throughput']}), flush=True)
    elif args.stage == 'measure':
        from iad_core.evaluation.resource_measurement import measure_resource_index
        prepared = json.loads((args.output / 'prepared.json').read_text())
        result = measure_resource_index(prepared, args.output, queries=args.queries, candidates=args.candidates, progress=progress)
        print(json.dumps({'stage': 'MEASURED', 'gates': result['gates'], 'measured_checks_passed': result['measured_checks_passed']}), flush=True)
        return 0 if result['measured_checks_passed'] else 1
    elif args.stage == 'incremental':
        import torch
        from iad_core.evaluation.resource_incremental import evaluate_resource_incremental
        torch.set_num_threads(2)
        if config.device.startswith('cuda:'):
            torch.cuda.set_device(config.device)
        result = evaluate_resource_incremental(prepared, args.output)
        print(json.dumps({'stage': 'INCREMENTAL', 'gates': result['gates'], 'cancellation': result['cancellation']}), flush=True)
        return 0 if result['incremental_checks_passed'] else 1
    elif args.stage == 'report':
        from iad_core.evaluation.resource_report import write_resource_report
        result = write_resource_report(args.output)
        print(json.dumps({'stage': 'REPORTED', 'resource_acceptance_passed': result['resource_acceptance_passed']}), flush=True)
        return 0 if result['resource_acceptance_passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
