import argparse
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, StrictBool

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import Identifier, Relation
from iad_core.duplicate.pair_repository import PairObservations
from iad_core.duplicate.verify import PairVerifier
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository


class ExportedPair(BaseModel):
    sample_id_a: Identifier
    sample_id_b: Identifier
    verified: StrictBool = False
    relation: Relation | None = None


class DirectPairExport(BaseModel):
    task_id: Identifier
    type: Literal['DIRECT_VERIFIED_PAIRS', 'DIRECT_EXACT_PAIRS', 'DIRECT_NEAR_CANDIDATES']
    pairs: list[ExportedPair]


def main() -> int:
    parser = argparse.ArgumentParser(description='Reverify exported direct image pairs against current published sources')
    parser.add_argument('--db', required=True)
    parser.add_argument('--task', required=True)
    parser.add_argument('--pairs', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    artifact = DirectPairExport.model_validate_json(args.pairs.read_bytes())
    if artifact.task_id != args.task:
        raise ValueError('Pair artifact does not belong to the requested task')
    candidates = sorted({tuple(sorted((item.sample_id_a, item.sample_id_b))) for item in artifact.pairs
        if item.verified or item.relation in ('EXACT', 'NEAR_CANDIDATE')})
    ignored = sum(not item.verified and item.relation not in ('EXACT', 'NEAR_CANDIDATE') for item in artifact.pairs)
    db = Database(args.db)
    samples = SampleRepository(db).get_many(sorted({identity for pair in candidates for identity in pair}))
    if any(sample.task_id != args.task for sample in samples):
        raise ValueError('Pair artifact references samples in another task')
    store, verifier = PairObservations(db), PairVerifier()
    observations, failures = [], []
    for left, right in candidates:
        try:
            observed = store.verify(left, right, verifier=verifier)
            observations.append(observed.model_dump(mode='json'))
            if not observed.verification.verified:
                failures.append({'sample_id_a': left, 'sample_id_b': right,
                    'code': 'NOT_ACCEPTED', 'reason': observed.verification.relation})
        except (ConsistencyError, ValueError) as error:
            failures.append({'sample_id_a': left, 'sample_id_b': right,
                'code': error.code if isinstance(error, ConsistencyError) else 'INVALID_PAIR', 'reason': str(error)})
    report = {'task_id': args.task, 'input_pairs': len(artifact.pairs), 'ignored_pairs': ignored, 'distinct_candidates': len(candidates),
        'accepted': len(candidates) - len(failures), 'failed': len(failures),
        'observations': observations, 'failures': failures}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({key: value for key, value in report.items() if key not in ('observations', 'failures')}))
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
