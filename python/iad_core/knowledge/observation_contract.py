from typing import Literal

from pydantic import Field, create_model

from iad_core.advisory.analysis import AnalysisModel
from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.mining import KnowledgeInput
from iad_core.knowledge.models import (KnowledgeCheck, KnowledgeObservation,
    KnowledgeObservationContent, KnowledgeObservations, KnowledgeSuspect)


class ObservationContract:
    """Freeze a complete source × criterion matrix and bind its short references."""

    def __init__(self, checks: list[KnowledgeCheck], inputs: list[KnowledgeInput]):
        self.checks = {f'c{i}': check for i, check in enumerate(checks)}
        self.sources = {f's{i}': item.source.sample_id for i, item in enumerate(inputs)}
        if not checks or not inputs or len(set(self.sources.values())) != len(inputs):
            raise ValueError('Observation requires unique sources and nonempty criteria')
        if len({check.check_id for check in checks}) != len(checks):
            raise ValueError('Observation criteria must be unique')
        images = {image.evidence.evidence_id: image for item in inputs for image in item.images}
        aliases = {eid: f'v{i}' for i, eid in enumerate(images)}
        self.evidence_refs = {alias: eid for eid, alias in aliases.items()}
        self.images = [PreparedImage(image.evidence.model_copy(update={'evidence_id': aliases[eid]}), image.path)
                       for eid, image in images.items()]
        self.context = {
            'checks': [dict(check.criterion_context(), check_key=key) for key, check in self.checks.items()],
            'sources': [], 'evidence_refs': self.evidence_refs,
        }
        rows = {}
        for key, item in zip(self.sources, inputs):
            raw = tuple(dict.fromkeys(aliases[image.evidence.evidence_id] for image in item.images
                                     if image.evidence.representation == 'raw'))
            if not raw:
                raise ValueError('Each observed source requires raw visual evidence')
            self.context['sources'].append({'source_key': key, 'sample_id': item.source.sample_id,
                                            'raw_evidence_keys': list(raw)})
            suspect = create_model('ObservationSuspect_' + key, __base__=KnowledgeSuspect,
                                   evidence_id=(Literal[raw], ...))
            cell = create_model('ObservationCell_' + key, __base__=KnowledgeObservationContent,
                                evidence_ids=(list[Literal[raw]], Field(min_length=1)),
                                suspects=(list[suspect], ...))
            row = create_model('ObservationRow_' + key, __base__=AnalysisModel,
                               **{check_key: (cell, ...) for check_key in self.checks})
            rows[key] = (row, ...)
        self.response_type = create_model('KnowledgeObservations', __base__=AnalysisModel, **rows)

    def bind(self, response: AnalysisModel) -> KnowledgeObservations:
        matrix = self.response_type.model_validate(response.model_dump())
        observations = []
        for source_key, sample_id in self.sources.items():
            row = getattr(matrix, source_key)
            for check_key, check in self.checks.items():
                cell = getattr(row, check_key).model_dump()
                cell['evidence_ids'] = [self.evidence_refs[key] for key in cell['evidence_ids']]
                for suspect in cell['suspects']:
                    suspect['evidence_id'] = self.evidence_refs[suspect['evidence_id']]
                observations.append(KnowledgeObservation(sample_id=sample_id, check_id=check.check_id, **cell))
        return KnowledgeObservations(observations=observations)
