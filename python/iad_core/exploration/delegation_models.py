from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.analysis.models import AnalysisCatalog
from iad_core.evidence.registrations import RegistrationMediaPage
from iad_core.exploration.observation_models import ExplorationBatchReport
from iad_core.workbench.analysis_manifest import AnalysisRegistration, AnalysisRound


class ExplorationBatchTask(AnalysisModel):
    round: AnalysisRound
    wave_id: int
    session_id: str
    catalog_revision: int
    catalog: AnalysisCatalog
    report: ExplorationBatchReport | None = None
    reviewed: bool = False


class ExplorationWave(AnalysisModel):
    wave_id: int | None = None
    tasks: list[ExplorationBatchTask]


class ExplorationWorkerMaterials(AnalysisModel):
    role: Literal['observer'] = 'observer'
    job_id: str
    task: ExplorationBatchTask
    sources: list[AnalysisRegistration]
    registrations: list[RegistrationMediaPage]
