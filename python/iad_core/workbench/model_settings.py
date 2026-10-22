from typing import Literal, Optional

from pydantic import AnyHttpUrl, Field, SecretStr, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.storage.database import Database
from iad_core.workbench.model_profile import ModelLimits, ModelProfile


class WorkbenchModelSelection(AnalysisModel):
    provider_id: NonBlankText
    model_id: NonBlankText
    limits: ModelLimits = Field(default_factory=ModelLimits)


class WorkbenchModelSettings(AnalysisModel):
    revision: int = Field(ge=0)
    selection: Optional[WorkbenchModelSelection] = None


class WorkbenchModelEdit(AnalysisModel):
    expected_revision: int = Field(ge=0)
    selection: WorkbenchModelSelection


class ProviderModel(AnalysisModel):
    model_id: NonBlankText
    name: str
    input_modalities: Optional[list[str]] = None
    context_tokens: Optional[int] = Field(default=None, gt=0)
    max_output_tokens: Optional[int] = Field(default=None, gt=0)


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


class WorkbenchModelView(WorkbenchModelSettings):
    providers: list[WorkbenchProvider] = Field(default_factory=list)
    ready: bool = False
    error: Optional[str] = None
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


class ModelConnection(AnalysisModel):
    model_id: NonBlankText
    capacity_mode: Literal['vllm_tokenize']
    context_tokens: int = Field(gt=0)
    image_verified: Literal[False] = False


class WorkbenchModels:
    def __init__(self, db: Database):
        self.db = db

    def read(self) -> WorkbenchModelSettings:
        with self.db.connection() as conn:
            row = conn.execute('SELECT revision,selection_json FROM workbench_model_settings WHERE id=1').fetchone()
        return WorkbenchModelSettings(revision=row['revision'],
            selection=WorkbenchModelSelection.model_validate_json(row['selection_json'])) if row else WorkbenchModelSettings(revision=0)

    def save(self, edit: WorkbenchModelEdit) -> WorkbenchModelSettings:
        edit = WorkbenchModelEdit.model_validate(edit)
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            row = conn.execute('SELECT revision FROM workbench_model_settings WHERE id=1').fetchone()
            revision = row['revision'] if row else 0
            if revision != edit.expected_revision:
                raise ValueError('工作台模型配置已变化，请刷新后再保存')
            conn.execute('''INSERT INTO workbench_model_settings(id,revision,selection_json) VALUES(1,?,?)
                ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,selection_json=excluded.selection_json''',
                (revision + 1, edit.selection.model_dump_json()))
        return WorkbenchModelSettings(revision=revision + 1, selection=edit.selection)
