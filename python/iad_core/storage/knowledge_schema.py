import json
import sqlite3


def migrate_knowledge_sources(conn: sqlite3.Connection) -> None:
    rows = conn.execute("""SELECT version_id,snapshot_json FROM knowledge_versions
        WHERE json_type(snapshot_json,'$.removed_source_ids') IS NOT NULL""").fetchall()
    for version_id, raw in rows:
        snapshot = json.loads(raw)
        removed = set(snapshot.pop('removed_source_ids'))
        comparisons = {source['sample_id']: source for source in snapshot.get('comparison_sources', [])}
        pending = removed - comparisons.keys()
        parent_id = snapshot['parent_version_id']
        visited = {version_id}
        while pending and parent_id and parent_id not in visited:
            visited.add(parent_id)
            row = conn.execute('SELECT snapshot_json FROM knowledge_versions WHERE version_id=?', (parent_id,)).fetchone()
            if row is None:
                break
            parent = json.loads(row[0])
            for source in parent['sources'] + parent.get('comparison_sources', []):
                if source['sample_id'] in pending:
                    comparisons[source['sample_id']] = source
                    pending.remove(source['sample_id'])
            parent_id = parent['parent_version_id']
        if pending:
            raise ValueError(f'知识版本 {version_id} 缺少已移除来源的冻结记录，无法迁移')
        snapshot['comparison_sources'] = list(comparisons.values())
        conn.execute('UPDATE knowledge_versions SET snapshot_json=? WHERE version_id=?',
                     (json.dumps(snapshot, ensure_ascii=False), version_id))
