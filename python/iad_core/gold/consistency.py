from collections import defaultdict
import json
from sqlite3 import Connection

from iad_core.dataset.registry import DatasetRegistry
from iad_core.duplicate.relations import ContentRelations
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.consistency.review_repository import ConsistencyDecisionRepository
from iad_core.evidence.current_sources import CurrentSource
from iad_core.gold.resolver import resolve_gold_for_sample
from iad_core.gold.schemas import GoldRecord, GoldConflictRecord
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.storage.review_repository import ReviewRepository
from iad_core.task.config import GoldPolicyConfig


class GoldConsistency:
    def __init__(self, db: Database):
        self.db = db

    def conflicts(self, records: list[GoldRecord], policy: GoldPolicyConfig, connection: Connection | None = None) -> dict[str, GoldConflictRecord]:
        if connection is None:
            with self.db.connection() as connection:
                connection.execute('BEGIN')
                return self.conflicts(records, policy, connection)
        targets = {record.sample_id for record in records}
        target_samples = SampleRepository(self.db).get_many(sorted(targets), connection)
        policies = {dataset_id: DatasetRegistry(self.db).get(dataset_id, connection).annotations
            for dataset_id in {sample.dataset_id for sample in target_samples}}
        targets = {sample.sample_id for sample in target_samples
            if policies[sample.dataset_id].policy_id is not None and policies[sample.dataset_id].annotation_role == 'REFERENCE'}
        if not targets:
            return {}
        groups = ContentRelations(self.db).groups(list(targets), connection)
        identities = sorted({identity for group in groups for identity in group.sample_ids})
        samples = {sample.sample_id: sample for sample in SampleRepository(self.db).get_many(identities, connection)}
        policies = {dataset_id: DatasetRegistry(self.db).get(dataset_id, connection).annotations for dataset_id in {sample.dataset_id for sample in samples.values()}}
        reviews = defaultdict(list)
        for event in ReviewRepository(self.db).list_decisions(connection=connection):
            if event.sample_id in samples:
                reviews[event.sample_id].append(event)
        golds = {identity: resolve_gold_for_sample(sample, reviews[identity], policy)[0] for identity, sample in samples.items()}
        conflicts = {}
        binary = {'PASS': 'NORMAL', 'HARD_NORMAL': 'NORMAL', 'FAIL': 'ANOMALY', 'CONFLICT': 'CONFLICT'}
        for group in groups:
            by_policy = defaultdict(list)
            for identity in group.sample_ids:
                annotations = policies[samples[identity].dataset_id]
                if annotations.policy_id is not None and annotations.annotation_role == 'REFERENCE':
                    by_policy[annotations.policy_id].append(identity)
            for policy_id, members in by_policy.items():
                labels = {identity: golds[identity].gold_quality if golds[identity].gold_status != 'EXCLUDED'
                    else samples[identity].quality_status.value for identity in members}
                categories = {binary.get(label) for label in labels.values()} - {None}
                if len(members) < 2 or not ('CONFLICT' in categories or {'NORMAL', 'ANOMALY'}.issubset(categories)):
                    continue
                for identity in targets.intersection(members):
                    conflicts[identity] = GoldConflictRecord(sample_id=identity, task_id=samples[identity].task_id,
                        policy_name=policy.policy_name, reason='同规范严格同图存在未解决的有效质量矛盾',
                        conflicting_sources={'content_group_id': group.group_id, 'annotation_policy_id': policy_id,
                            'sample_ids': members, 'effective_quality': labels,
                            'review_decision_ids': [event.decision_id for member in members for event in reviews[member]
                                if event.reviewer in policy.trusted_reviewers]})
        return conflicts

    def localization_blocks(self, sample_ids: list[str], connection: Connection | None = None) -> dict[str, dict]:
        selected = set(sample_ids)
        blocked = {}
        current = {}
        if connection is None:
            with self.db.connection() as connection:
                connection.execute('BEGIN')
                return self.localization_blocks(sample_ids, connection)
        rows = connection.execute('''SELECT snapshot_json,snapshot_sha256 FROM consistency_results
            WHERE json_extract(snapshot_json,'$.parameters.sample_a') IN (SELECT value FROM json_each(?))
            OR json_extract(snapshot_json,'$.parameters.sample_b') IN (SELECT value FROM json_each(?))''',
            (json.dumps(sample_ids), json.dumps(sample_ids)))
        for row in rows:
            saved = ConsistencyRepository.deserialize(row['snapshot_json'], row['snapshot_sha256'])
            sources = (saved.sources.left, saved.sources.right)
            differences = [difference.difference_id for difference in saved.result.annotation.differences
                if difference.confirmed_conflict and difference.type != 'QUALITY_LABEL']
            targets = selected.intersection(source.sample.sample_id for source in sources) if differences else set()
            for decision in ConsistencyDecisionRepository(self.db).history(saved.result.evidence_id, connection):
                if decision.request.action.kind == 'PROPOSE_REGION_CHANGE':
                    targets.update(change.sample_id for change in decision.request.action.changes if change.sample_id in selected)
            if not targets:
                continue
            for source in sources:
                identity = source.sample.sample_id
                if identity not in current:
                    current[identity] = CurrentSource.capture(self.db, identity, connection)
            if not all(current[source.sample.sample_id].state(source, include_review=False) == 'CURRENT' for source in sources):
                continue
            for identity in targets:
                entry = blocked.setdefault(identity, {'localization_state': 'UNRESOLVED', 'evidence_ids': [], 'difference_ids': []})
                entry['evidence_ids'].append(saved.result.evidence_id)
                entry['difference_ids'].extend(differences)
        return blocked
