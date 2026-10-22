import json

import pytest

from iad_core.entry import knowledge_get
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.storage.database import Database


@pytest.mark.parametrize('removed', [False, True])
def test_existing_knowledge_remains_readable_after_storage_upgrade(knowledge_dataset, removed):
    db, config = knowledge_dataset
    sid = config.dataset.id + ':part-0.png'
    sources = [s.model_dump() for s in KnowledgeSources(db).collect(config.dataset.id, [sid], 'normal')]
    common = dict(dataset_id=config.dataset.id, kind='normal', normal_version_id=None,
                  model_name='previous-model', generation_version='dataset-knowledge-v11',
                  signature='frozen-signature', summary='已有知识', checks=[], suspects=[],
                  limitations=[], evidence=[], mining_steps=[], created_at='2026-10-21T12:00:00Z')
    with db.connection() as conn:
        for vid, parent, group in [('old-parent', None, sources), ('old-head', 'old-parent', [] if removed else sources)]:
            snapshot = dict(common, version_id=vid, parent_version_id=parent, sources=group,
                            removed_source_ids=[sid] if removed and parent else [])
            conn.execute('INSERT INTO knowledge_versions VALUES(?,?,?,?,?,?,?,?)',
                         (vid, config.dataset.id, 'normal', parent, None, 'frozen-signature',
                          json.dumps(snapshot), common['created_at']))
        conn.execute('INSERT INTO knowledge_heads VALUES(?,?,?)', (config.dataset.id, 'normal', 'old-head'))

    Database(db.db_path)
    current = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    parent = knowledge_get({'version_id': 'old-parent'}, db.db_path)['knowledge']
    assert current['version_id'] == 'old-head'
    assert current['signature'] == 'frozen-signature'
    assert current['sources'] == ([] if removed else parent['sources'])
    assert current['comparison_sources'] == (parent['sources'] if removed else [])
    Database(db.db_path)
    assert knowledge_get({'version_id': 'old-head'}, db.db_path)['knowledge'] == current
