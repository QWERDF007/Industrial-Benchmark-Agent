from typing import Literal

CandidateRole = Literal['normal', 'defect']


class AnalysisSourceRoles:
    """Classify a registration from the dataset's actual annotation contract."""

    @staticmethod
    def resolve(dataset_format: str, quality_status: str, annotation_status: str | None,
                annotation_count: int) -> CandidateRole | None:
        if dataset_format == 'folder_classification':
            return {'PASS': 'normal', 'FAIL': 'defect'}.get(quality_status)
        if annotation_status == 'VALID_EMPTY' and annotation_count == 0:
            return 'normal'
        if annotation_status == 'VALID_NONEMPTY' and annotation_count > 0:
            return 'defect'
        return None
