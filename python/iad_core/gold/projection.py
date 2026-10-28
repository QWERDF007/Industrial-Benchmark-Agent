import json
from collections import defaultdict
from dataclasses import dataclass
from sqlite3 import Connection

from iad_core.gold.annotation import filter_and_convert_gold_annotations
from iad_core.gold.consistency import GoldConsistency
from iad_core.gold.resolver import resolve_gold_for_sample
from iad_core.gold.schemas import GoldRecord, GoldConflictRecord
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository, AnnotationRepository
from iad_core.storage.review_repository import ReviewRepository
from iad_core.task.config import GoldPolicyConfig


@dataclass(frozen=True)
class GoldProjection:
    records: list[GoldRecord]
    conflicts: list[GoldConflictRecord]

    @classmethod
    def capture(cls, db: Database, task_id: str, policy: GoldPolicyConfig, connection: Connection | None = None,
                *, sample_ids: list[str] | None = None) -> 'GoldProjection':
        if connection is None:
            with db.connection() as connection:
                connection.execute('BEGIN')
                return cls.capture(db, task_id, policy, connection, sample_ids=sample_ids)
        samples = SampleRepository(db).list_by_task(task_id, connection=connection)
        if sample_ids is not None:
            requested = set(sample_ids)
            samples = [sample for sample in samples if sample.sample_id in requested]
        identities = {sample.sample_id for sample in samples}
        reviews, annotations = defaultdict(list), defaultdict(list)
        for review in ReviewRepository(db).list_decisions(task_id, connection=connection):
            reviews[review.sample_id].append(review)
        rows = connection.execute('SELECT * FROM annotations WHERE sample_id IN (SELECT value FROM json_each(?))', (json.dumps(sorted(identities)),))
        for row in rows:
            annotation = AnnotationRepository._row_to_annotation(row)
            annotations[annotation.sample_id].append(annotation)
        records, conflicts = [], []
        for sample in samples:
            record, conflict = resolve_gold_for_sample(sample, reviews[sample.sample_id], policy)
            record.annotations = filter_and_convert_gold_annotations(annotations[sample.sample_id])
            record.phenomena = sorted({annotation.phenomenon for annotation in record.annotations if annotation.phenomenon}
                or {annotation.raw_label for annotation in record.annotations if annotation.raw_label})
            records.append(record)
            if conflict:
                conflicts.append(conflict)
        constraints = GoldConsistency(db)
        consistency = constraints.conflicts(records, policy, connection)
        conflicts = [conflict for conflict in conflicts if conflict.sample_id not in consistency]
        localization = constraints.localization_blocks(sorted(identities), connection)
        for record in records:
            if record.sample_id in consistency:
                conflict = consistency[record.sample_id]
                record.gold_status, record.gold_quality, record.binary_label = 'CONFLICT', 'CONFLICT', None
                record.hard_normal = False
                record.provenance = {**record.provenance, 'consistency': conflict.conflicting_sources}
                conflicts.append(conflict)
            if record.sample_id in localization:
                record.annotations, record.phenomena = [], []
                record.provenance = {**record.provenance, 'consistency': {**record.provenance.get('consistency', {}), **localization[record.sample_id]}}
        return cls(records, conflicts)
