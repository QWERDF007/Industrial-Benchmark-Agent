from typing import Optional

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.dataset.registry import DatasetRegistry
from iad_core.knowledge.models import KnowledgeKind
from iad_core.knowledge.instructions import (FrozenMiningPrompt, MiningPromptConfiguration, DEFAULT_DIRECTIONS, DEFAULT_OBJECTIVES)
from iad_core.storage.database import Database


class MiningPromptQuery(AnalysisModel):
    dataset_id: str = Field(min_length=1)
    kind: KnowledgeKind


class MiningPromptEdit(MiningPromptQuery):
    expected_revision: str
    configuration: Optional[MiningPromptConfiguration] = Field(description='完整替换挖掘目标和方向；null恢复默认')


class MiningPrompt(MiningPromptQuery):
    instruction: str
    configuration: MiningPromptConfiguration
    revision: str
    customized: bool


class KnowledgePrompts:
    def __init__(self, db: Database):
        self.db = db

    def read(self, query: MiningPromptQuery) -> MiningPrompt:
        DatasetRegistry(self.db).get(query.dataset_id)
        with self.db.connection() as conn:
            row = conn.execute('SELECT configuration_json FROM knowledge_prompts WHERE dataset_id=? AND kind=?',
                               (query.dataset_id, query.kind)).fetchone()
        default = MiningPromptConfiguration(objective=DEFAULT_OBJECTIVES[query.kind], directions=list(DEFAULT_DIRECTIONS))
        configuration = MiningPromptConfiguration.model_validate_json(row[0]) if row else default
        frozen = FrozenMiningPrompt.capture(configuration)
        revision = ('custom:' if row else 'default:') + frozen.signature
        return MiningPrompt(**query.model_dump(), instruction=frozen.instruction, configuration=configuration,
                            revision=revision, customized=row is not None)

    def save(self, edit: MiningPromptEdit) -> MiningPrompt:
        query = MiningPromptQuery.model_validate(edit.model_dump(include={'dataset_id', 'kind'}))
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            if self.read(query).revision != edit.expected_revision:
                raise ValueError('提示词已变化，请重新读取后修改')
            if edit.configuration is None:
                conn.execute('DELETE FROM knowledge_prompts WHERE dataset_id=? AND kind=?', (edit.dataset_id, edit.kind))
            else:
                conn.execute('''INSERT INTO knowledge_prompts(dataset_id,kind,configuration_json) VALUES(?,?,?)
                    ON CONFLICT(dataset_id,kind) DO UPDATE SET configuration_json=excluded.configuration_json''',
                             (edit.dataset_id, edit.kind, edit.configuration.model_dump_json()))
        return self.read(query)
