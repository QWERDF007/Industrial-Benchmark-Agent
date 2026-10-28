from iad_core.advisory.analysis import AnalysisModel
from iad_core.duplicate.pair_repository import PairObservations
from iad_core.duplicate.relations import ContentRelations, StrictContentGroup
from iad_core.storage.database import Database
from iad_core.consistency.errors import ConsistencyError


class LeakageRelations(AnalysisModel):
    strict_content_groups: list[StrictContentGroup]
    near_leakage_pairs: list[tuple[str, str]]

    @property
    def groups(self) -> list[list[str]]:
        return [group.sample_ids for group in self.strict_content_groups]

    def assert_covered(self, sample_ids: list[str]) -> None:
        indexed = {identity for group in self.strict_content_groups for identity in group.sample_ids}
        if not set(sample_ids).issubset(indexed):
            raise ConsistencyError('INDEX_NOT_READY', 'Formal benchmark requires current published content for every exported sample; rescan first')


def load_leakage_relations(db: Database, task_id: str, *, sample_ids: list[str] | None = None) -> LeakageRelations:
    if sample_ids is None:
        with db.connection() as connection:
            sample_ids = [row[0] for row in connection.execute('SELECT sample_id FROM samples WHERE task_id=? AND is_excluded=0', (task_id,))]
    pairs = [(item.sample_id_a, item.sample_id_b) for item in PairObservations(db).current(task_id)
        if item.verification.relation == 'NEAR_CANDIDATE']
    related = sorted({*sample_ids, *(identity for pair in pairs for identity in pair)})
    strict = ContentRelations(db).groups(related)
    return LeakageRelations(strict_content_groups=strict, near_leakage_pairs=pairs)
