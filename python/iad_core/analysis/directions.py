from iad_core.analysis.models import FrozenAnalysisDirection
from iad_core.analysis.publications import AnalysisPublications
from iad_core.knowledge.instructions import ExploredDirectionSource, default_directions


class AnalysisDirections:
    def __init__(self, db):
        self.db = db

    def freeze(self, prompt) -> list[FrozenAnalysisDirection]:
        presets = {direction.direction_id: direction for direction in default_directions()}
        frozen = []
        for direction in prompt.directions:
            if not direction.enabled:
                continue
            context = {}
            if direction.origin == 'preset':
                original = presets.get(direction.direction_id)
                if original is None:
                    raise ValueError('所选预设方向不存在')
                source = original.source
                if direction.source != source:
                    raise ValueError('所选预设方向版本已变化，请重新选择')
            elif direction.origin == 'explored' and isinstance(direction.source, ExploredDirectionSource):
                source = direction.source
                if direction.direction_id != source.direction_id:
                    raise ValueError('探索方向来源与选择不一致')
                snapshot = AnalysisPublications(self.db).get(source.version_id)
                if snapshot.job_id != source.run_id or snapshot.module != 'exploration':
                    raise ValueError('来源不属于所选探索作业')
                with self.db.connection() as connection:
                    if connection.execute('SELECT 1 FROM analysis_direction_removals WHERE version_id=? AND direction_id=?',
                            (source.version_id, source.direction_id)).fetchone():
                        raise ValueError('所选探索方向已移除')
                original = next((item for item in snapshot.catalog.directions if item.direction_id == source.direction_id), None)
                if original is not None:
                    context = dict(source_summary=snapshot.catalog.summary, source_limitations=[*snapshot.catalog.limitations, *original.limitations],
                        source_dataset_ids=original.dataset_ids, source_evidence_ids=original.evidence_ids,
                        source_counter_evidence_ids=original.counter_evidence_ids)
                if original is None:
                    raise ValueError('探索发布版本没有该方向')
            else:
                raise ValueError('请选择预设或带完整发布版本引用的探索方向')
            frozen.append(FrozenAnalysisDirection(ref='D' + str(len(frozen) + 1), source=source,
                source_title=original.title, source_instruction=original.instruction,
                title=direction.title, instruction=direction.instruction, **context))
        return frozen
