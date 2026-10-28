from collections import defaultdict
from sqlite3 import Connection

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import Count, FrozenScope
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database


class GoldAvailability(AnalysisModel):
    total: Count
    confirmed: Count | None = None
    conflicts: Count | None = None
    excluded: Count | None = None
    policy_names: list[str] = Field(default_factory=list)
    unavailable_reason: str | None = None

    @classmethod
    def capture(cls, db: Database, scope: FrozenScope, connection: Connection) -> 'GoldAvailability':
        from iad_core.gold.projection import GoldProjection
        result = cls(total=scope.sample_count)
        try:
            ConsistencyScopes(db).assert_current(scope, connection)
            configurations = {identity: DatasetRegistry(db).get(identity, connection) for identity in scope.dataset_ids}
            selected = defaultdict(list)
            for sample in scope.samples:
                config = configurations[sample.dataset_id]
                selected[(config.task.task_id, config.gold.model_dump_json())].append(sample.sample_id)
            from iad_core.task.config import GoldPolicyConfig
            records = []
            for (task_id, policy), identities in selected.items():
                records.extend(GoldProjection.capture(db, task_id, GoldPolicyConfig.model_validate_json(policy), connection, sample_ids=identities).records)
            if len(records) != scope.sample_count:
                raise ConsistencyError('SOURCE_UNAVAILABLE', 'Gold source membership changed during projection')
            result.confirmed = sum(record.gold_status == 'CONFIRMED' for record in records)
            result.conflicts = sum(record.gold_status == 'CONFLICT' for record in records)
            result.excluded = sum(record.gold_status == 'EXCLUDED' for record in records)
            result.policy_names = sorted({record.policy_name for record in records})
        except ConsistencyError as error:
            result.unavailable_reason = f'{error.code}: {error}'
        return result
