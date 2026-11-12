from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.analysis.models import AnalysisCatalog, FrozenAnalysisDirection
from iad_core.evidence.registrations import RegistrationMediaPage
from iad_core.exploration.observation_models import ExplorationBatchReport, ExplorationEvidenceReport
from iad_core.knowledge.observation_models import KnowledgeBatchReport, KnowledgeEvidenceReport
from iad_core.workbench.analysis_manifest import AnalysisRegistration, AnalysisRound


class AnalysisBatchTask(AnalysisModel):
    round: AnalysisRound
    wave_id: int
    session_id: str
    catalog_revision: int
    catalog: AnalysisCatalog
    report: ExplorationBatchReport | KnowledgeBatchReport | ExplorationEvidenceReport | KnowledgeEvidenceReport | None = None
    reviewed: bool = False


class AnalysisWave(AnalysisModel):
    wave_id: int | None = None
    tasks: list[AnalysisBatchTask]


class AnalysisWorkerMaterials(AnalysisModel):
    role: Literal['observer'] = 'observer'
    job_id: str
    task: AnalysisBatchTask
    sources: list[AnalysisRegistration]
    registrations: list[RegistrationMediaPage]
    selected_directions: list[FrozenAnalysisDirection] = Field(default_factory=list)
