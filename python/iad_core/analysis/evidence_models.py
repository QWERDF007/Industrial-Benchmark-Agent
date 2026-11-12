from typing import Literal

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.evidence.registrations import RegistrationImageQuery, EvidenceReferenceQuery

ContextPolicy = Literal['legacy', 'evidence-on-demand-v1']
AnalysisImageView = Literal['whole', 'annotation_rois']


class AnalysisEvidenceCandidate(AnalysisModel):
    evidence_id: NonBlankText
    reason: NonBlankText


class AnalysisEvidenceSelection(AnalysisModel):
    view: AnalysisImageView = 'whole'


class AnalysisEvidenceReferenceQuery(EvidenceReferenceQuery, AnalysisEvidenceSelection):
    pass


class AnalysisImageQuery(RegistrationImageQuery, AnalysisEvidenceSelection):
    pass
