from uuid import UUID, uuid4

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel


class SelectedDatasets(AnalysisModel):
    submission_id: UUID = Field(default_factory=uuid4)
    dataset_ids: list[str] = Field(min_length=1)

    @model_validator(mode='after')
    def distinct_datasets(self):
        if len(self.dataset_ids) != len(set(self.dataset_ids)):
            raise ValueError('子数据集不能重复')
        return self
