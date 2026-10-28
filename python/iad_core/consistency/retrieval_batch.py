from dataclasses import dataclass

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ImageQuery
from iad_core.consistency.retrieval_models import RetrievalPage


@dataclass(frozen=True)
class RetrievalOutcome:
    query: ImageQuery
    page: RetrievalPage | None = None
    error: ConsistencyError | None = None

    def __post_init__(self):
        if (self.page is None) == (self.error is None):
            raise ValueError('A retrieval outcome requires either an actual page or an explicit failure')
