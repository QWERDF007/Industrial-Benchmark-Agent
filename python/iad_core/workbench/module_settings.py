from typing import Annotated, Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.models import ConsistencyRetrievalSettings
from iad_core.consistency.position import PositionTolerancePolicy
from iad_core.storage.database import Database
from iad_core.workbench.model_profile import GenerationLimits, ModelLimits, ReasoningEffort
from iad_core.workbench.analysis_sampling import DEFAULT_SAMPLING_RATIO, SamplingRatio

BusinessModule = Literal['exploration', 'knowledge', 'consistency', 'audit']
JobConcurrency = Annotated[int, Field(ge=1, strict=True)]


class ModuleModelReference(AnalysisModel):
    provider_id: NonBlankText
    model_id: NonBlankText


class ModuleSettingsValues(AnalysisModel):
    model: ModuleModelReference | None = None
    reasoning_effort: ReasoningEffort | None = None


class AnalysisSamplingSettingsValues(ModuleSettingsValues):
    batch_size: int = Field(default=4, ge=1, strict=True)
    sampling_ratio: SamplingRatio = DEFAULT_SAMPLING_RATIO
    whole_image_max_side: int | None = Field(default=None, ge=1, strict=True)
    agent_limits: GenerationLimits = Field(default_factory=GenerationLimits)


class ExplorationSettingsValues(AnalysisSamplingSettingsValues):
    concurrency: JobConcurrency = 2


class KnowledgeSettingsValues(AnalysisSamplingSettingsValues):
    concurrency: JobConcurrency = 2
    batch_size: int = Field(default=12, ge=1, le=200, strict=True)


class AuditSettingsValues(ModuleSettingsValues):
    whole_image_max_side: int | None = Field(default=None, ge=1, strict=True)
    concurrency: JobConcurrency = 1
    agent_limits: GenerationLimits = Field(default_factory=GenerationLimits)


class ConsistencySettingsValues(ModuleSettingsValues, ConsistencyRetrievalSettings):
    concurrency: JobConcurrency = 1
    agent_limits: GenerationLimits = Field(default_factory=GenerationLimits)
    vision_limits: ModelLimits = Field(default_factory=lambda: ModelLimits(capacity_mode='vllm_tokenize'))
    position_tolerance: PositionTolerancePolicy = Field(default_factory=PositionTolerancePolicy)


class ModuleSettingsPayload(AnalysisModel):
    module: BusinessModule
    settings: ModuleSettingsValues | ExplorationSettingsValues | KnowledgeSettingsValues | ConsistencySettingsValues | AuditSettingsValues

    @model_validator(mode='before')
    @classmethod
    def module_values(cls, value):
        if isinstance(value, dict):
            value = dict(value)
            schema = {'consistency': ConsistencySettingsValues, 'exploration': ExplorationSettingsValues,
                'knowledge': KnowledgeSettingsValues, 'audit': AuditSettingsValues}.get(value.get('module'), ModuleSettingsValues)
            value['settings'] = schema.model_validate(value['settings'])
        return value


class ModuleSettingsSnapshot(ModuleSettingsPayload):
    revision: int = Field(ge=0)


class ModuleSettingsEdit(ModuleSettingsPayload):
    expected_revision: int = Field(ge=0)


class ModuleSettings:
    def __init__(self, db: Database):
        self.db = db

    def read(self, module: BusinessModule) -> ModuleSettingsSnapshot:
        # Validation also rejects unknown section names before reading storage.
        snapshot = ModuleSettingsSnapshot(module=module, revision=0, settings={})
        with self.db.connection() as conn:
            row = conn.execute('SELECT revision,settings_json FROM workbench_module_settings WHERE module=?', (module,)).fetchone()
        if row:
            values = type(snapshot.settings).model_validate_json(row['settings_json'])
            return ModuleSettingsSnapshot(module=module, revision=row['revision'], settings=values)
        return snapshot

    def save(self, edit: dict | ModuleSettingsEdit) -> ModuleSettingsSnapshot:
        edit = ModuleSettingsEdit.model_validate(edit)
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            row = conn.execute('SELECT revision,settings_json FROM workbench_module_settings WHERE module=?', (edit.module,)).fetchone()
            revision = row['revision'] if row else 0
            if revision != edit.expected_revision:
                raise ValueError('模块配置已变化，请刷新后再保存')
            schema = type(ModuleSettingsSnapshot(module=edit.module, revision=0, settings={}).settings)
            current = schema.model_validate_json(row['settings_json']) if row else schema()
            values = schema.model_validate({**current.model_dump(), **edit.settings.model_dump(exclude_unset=True)})
            conn.execute('''INSERT INTO workbench_module_settings(module,revision,settings_json) VALUES(?,?,?)
                ON CONFLICT(module) DO UPDATE SET revision=excluded.revision,settings_json=excluded.settings_json''',
                (edit.module, revision + 1, values.model_dump_json()))
        return ModuleSettingsSnapshot(module=edit.module, revision=revision + 1, settings=values)

    def consistency_request(self, request: dict) -> dict:
        defaults = self.read('consistency').settings.model_dump(include={'mode', 'min_similarity'})
        return {**defaults, **request}


def module_settings_get(args, db_path):
    return ModuleSettings(Database(db_path)).read(args['module']).model_dump(mode='json')


def module_settings_save(args, db_path):
    return ModuleSettings(Database(db_path)).save(args).model_dump(mode='json')


def module_settings_validate(args, db_path):
    return ModuleSettingsEdit.model_validate(args).model_dump(mode='json', exclude_unset=True)
