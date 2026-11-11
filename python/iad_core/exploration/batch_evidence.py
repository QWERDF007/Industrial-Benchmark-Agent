from sqlite3 import Connection
from collections.abc import Iterable, Mapping, Sequence

from iad_core.evidence.registrations import PreparedRegistration
from iad_core.workbench.analysis_manifest import AnalysisTarget
from iad_core.analysis.observation_models import AnalysisSampleObservation


class ExplorationBatchEvidence:
    """Validate a whole batch against successful requests made by its own Session."""

    def __init__(self, connection: Connection, run_id: str, session_id: str,
                 targets: Sequence[AnalysisTarget], media: Mapping[str, PreparedRegistration]):
        delivered = {row[0] for row in connection.execute('''SELECT d.evidence_id FROM analysis_media_deliveries d
            JOIN model_calls c ON c.call_id=d.call_id WHERE d.job_id=? AND json_extract(c.summary_json,'$.session_id')=?
            AND json_extract(c.summary_json,'$.finished_at') IS NOT NULL
            AND json_extract(c.summary_json,'$.finish_reason') NOT IN ('error','aborted')
            AND json_extract(c.summary_json,'$.error') IS NULL''', (run_id, session_id))}
        self.completed: list[str] = []
        self.failed: list[str] = []
        self.evidence_ids: set[str] = set()
        self.whole_images: dict[str, AnalysisTarget] = {}
        for target in targets:
            source = media.get(target.sample_id)
            if source is None:
                raise ValueError('本场当前批次登记缺少已准备的材料')
            if source.evidence_id is None:
                if not source.error:
                    raise ValueError('本批登记缺少完整原图及实际材料错误')
                self.failed.append(target.sample_id)
                continue
            required = {source.evidence_id, *(item.image.evidence_id for item in source.images if item.required)}
            if required - delivered:
                raise ValueError('本批完整原图及必需局部未进入自身实际模型请求的成功记录')
            self.completed.append(target.sample_id)
            self.whole_images[source.evidence_id] = target
            self.evidence_ids.update(item.image.evidence_id for item in source.images if item.image.evidence_id in delivered)

    def observations(self, existing: Sequence[AnalysisSampleObservation],
                     facts: Iterable[tuple[str, Sequence[str], Sequence[str]]]) -> list[AnalysisSampleObservation]:
        """Project explicit image-linked statements; uncited registrations get no text."""
        cited = {eid for item in existing for eid in item.evidence_ids}
        descriptions: dict[str, list[str]] = {}
        limitations: dict[str, list[str]] = {}
        for text, evidence_ids, limits in facts:
            for eid in evidence_ids:
                if eid not in self.whole_images or eid in cited:
                    continue
                descriptions.setdefault(eid, []).append(text)
                limitations.setdefault(eid, []).extend(limits)
        return [*existing, *(AnalysisSampleObservation(sample_id=self.whole_images[eid].sample_id,
            dataset_id=self.whole_images[eid].dataset_id, description='\n'.join(dict.fromkeys(texts)),
            evidence_ids=[eid], limitations=list(dict.fromkeys(limitations[eid]))) for eid, texts in descriptions.items())]
