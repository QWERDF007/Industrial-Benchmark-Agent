from collections import Counter
from collections.abc import Iterable
from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.group_analysis_conclusions import MODEL_CONCLUSION_LABELS
from iad_core.consistency.models import Count, Identifier, ModelAssessmentState
from iad_core.consistency.result_models import FactState


class GalleryStatisticFact(AnalysisModel):
    group_id: Identifier
    facts_state: FactState
    conflict_categories: list[ConflictCategory]
    model_categories: list[ConflictCategory]
    model_state: ModelAssessmentState
    model_conclusion: str | None = None
    annotation_conclusion: str


class GalleryStatistics(AnalysisModel):
    total: Count
    original_categories: dict[str, Count]
    model_categories: dict[str, Count]
    agreement: dict[Literal['same', 'different'], Count]
    unjudged: Count

    @classmethod
    def capture(cls, items: Iterable[GalleryStatisticFact], *, include_model_categories: bool = False) -> 'GalleryStatistics':
        original, model, agreement = Counter(), Counter(), Counter()
        seen = set()
        for item in items:
            identity = item.group_id, item.facts_state
            if identity in seen:
                continue
            seen.add(identity)
            categories = set(item.conflict_categories)
            if include_model_categories:
                categories.update(item.model_categories)
            original.update(categories)
            conclusion = 'EQUIVALENT' if item.model_state == 'EQUIVALENT' else item.model_conclusion
            if item.model_state not in ('MATERIAL', 'EQUIVALENT') or conclusion not in MODEL_CONCLUSION_LABELS:
                continue
            model[conclusion] += 1
            agrees = item.annotation_conclusion in (conclusion, MODEL_CONCLUSION_LABELS[conclusion])
            agreement['same' if agrees else 'different'] += 1
        return cls(total=len(seen), original_categories=dict(sorted(original.items())),
            model_categories=dict(sorted(model.items())), agreement={key: agreement[key] for key in ('same', 'different')},
            unjudged=len(seen) - sum(agreement.values()))
