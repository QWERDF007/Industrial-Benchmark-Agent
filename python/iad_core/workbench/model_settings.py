from typing import Optional

from pydantic import AnyHttpUrl, Field, SecretStr, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.workbench.model_profile import ModelProfile, ReasoningEffort


class ProviderModel(AnalysisModel):
    model_id: NonBlankText
    name: str
    input_modalities: Optional[list[str]] = None
    context_tokens: Optional[int] = Field(default=None, gt=0)
    max_output_tokens: Optional[int] = Field(default=None, gt=0)
    reasoning_efforts: list[ReasoningEffort] = Field(default_factory=list)


class WorkbenchProvider(AnalysisModel):
    provider_id: str
    name: str
    endpoint: Optional[str] = None
    api: Optional[str] = None
    models: list[ProviderModel]
    error: Optional[str] = None
    editable: bool = False
    removable: bool = False
    credential_configured: bool = False
    credential_writable: bool = False


class ModelCatalog(AnalysisModel):
    providers: list[WorkbenchProvider] = Field(default_factory=list)
    provider_revision: Optional[int] = None


class ProviderEdit(AnalysisModel):
    expected_revision: int = Field(ge=0)
    provider_id: str = Field(pattern=r'^[a-z][a-z0-9-]*$')
    name: NonBlankText
    endpoint: AnyHttpUrl
    models: list[ProviderModel] = Field(min_length=1)
    api_key: Optional[SecretStr] = None

    @model_validator(mode='after')
    def unique_models(self):
        if len({model.model_id for model in self.models}) != len(self.models):
            raise ValueError('模型ID不能重复')
        return self


class ProviderReference(AnalysisModel):
    expected_revision: int = Field(ge=0)
    provider_id: NonBlankText


class ProviderDiscovery(AnalysisModel):
    endpoint: AnyHttpUrl
    provider_id: Optional[str] = None
    api_key: Optional[SecretStr] = None


class ModelExecution(AnalysisModel):
    profile: ModelProfile
    api_key: Optional[SecretStr] = None
