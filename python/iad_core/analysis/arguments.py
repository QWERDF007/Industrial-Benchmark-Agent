import json
from sqlite3 import Connection

from iad_core.analysis.argument_models import (AnalysisArgumentPage,
    AnalysisArgumentQuery, AnalysisArgumentRecord)
from iad_core.analysis.models import ProposedAnalysisDirection, ProposedAnalysisCheck


class AnalysisArguments:
    """Persist claim revisions and observed arguments; derive catalogs and key selections."""

    @staticmethod
    def read(connection: Connection, run_id: str, entry_id: str, revision: int, *, history: bool = False) -> list[AnalysisArgumentRecord]:
        rows = connection.execute('''SELECT a.* FROM analysis_claim_arguments a
            WHERE a.job_id=? AND a.entry_id=? AND a.revision<=?
            AND (? OR NOT EXISTS(SELECT 1 FROM analysis_claim_arguments newer
                WHERE newer.job_id=a.job_id AND newer.entry_id=a.entry_id
                AND newer.evidence_id=a.evidence_id AND newer.role=a.role
                AND newer.revision>a.revision AND newer.revision<=?)) ORDER BY a.revision,a.rowid''',
            (run_id, entry_id, revision, history, revision)).fetchall()
        return [AnalysisArgumentRecord.model_validate(dict(row)) for row in rows]

    def query(self, connection: Connection, run_id: str, query: AnalysisArgumentQuery) -> AnalysisArgumentPage:
        state = connection.execute('SELECT revision FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
        if state is None:
            raise LookupError('原生分析作业不存在')
        revision = state['revision'] if query.revision is None else query.revision
        if revision > state['revision']:
            raise ValueError('论据查询版本超出已保存目录')
        items = [item for item in self.read(connection, run_id, query.entry_id, revision, history=query.history)
            if (query.role is None or item.role == query.role) and (query.state is None or item.state == query.state)]
        end = query.offset + query.limit
        return AnalysisArgumentPage(job_id=run_id, revision=revision, total=len(items), offset=query.offset,
            next_offset=end if end < len(items) else None, items=items[query.offset:end])

    def apply(self, connection: Connection, run_id: str, revision: int, entries: dict,
              submission, snapshot, media) -> None:
        exploration = snapshot.module == 'exploration'
        support = 'evidence_ids' if exploration else 'support_evidence_ids'
        owners = {image.image.evidence_id: (source, image.image) for source in media.values() for image in source.images}
        datasets = {record.sample.sample_id: record.sample.dataset_id for record in snapshot.manifest.records}
        observations = {}
        observation_images = {}
        observation_directions = {}
        for row in connection.execute('''SELECT observation_id,observation_json FROM analysis_sample_observations
                WHERE job_id=? ORDER BY revision,rowid''', (run_id,)):
            observation = json.loads(row['observation_json'])
            observation_images[row['observation_id']] = set(observation['evidence_ids'])
            observation_directions[row['observation_id']] = {item['direction_ref']:item['status'] for item in observation['directions']}
            for eid in observation_images[row['observation_id']]:
                observations[eid] = row['observation_id']
        edits = {}
        for edit in submission.arguments:
            key = (edit.entry_id, edit.evidence_id, edit.role)
            if key in edits:
                raise ValueError('同次提交的论据关系不能重复')
            if edit.entry_id not in entries:
                raise ValueError('论据条目不属于当前目录')
            edits[key] = edit
        for entry_id, entry in entries.items():
            row = connection.execute('''SELECT claim_revision,content_json FROM analysis_claim_revisions
                WHERE job_id=? AND entry_id=? ORDER BY claim_revision DESC LIMIT 1''', (run_id, entry_id)).fetchone()
            semantic = ['instruction', 'applies_to', 'rationale', 'dataset_ids', 'limitations'] if exploration else [
                'subject', 'location', 'criterion', 'allowed_variations', 'dataset_ids', 'direction_refs', 'limitations']
            content = {name: entry[name] for name in semantic}
            previous_content = {name: json.loads(row['content_json'])[name] for name in semantic} if row else None
            for correction in submission.citation_corrections:
                if correction.entry_id == entry_id and previous_content is not None:
                    previous_content = json.loads(json.dumps(previous_content).replace(correction.evidence_id, correction.whole_image_id))
            changed = previous_content is not None and previous_content != content
            current = {(item.evidence_id, item.role): item for item in self.read(connection, run_id, entry_id, revision)}
            if changed:
                missing = [dict(entry_id=entry_id,evidence_id=eid,role=role,observation_id=item.observation_id)
                    for (eid,role),item in current.items() if item.state == 'active' and (entry_id,eid,role) not in edits]
                if not entry.get('change_reason') or missing:
                    raise ValueError('改变已有主张或适用条件需要change_reason；主张修订须复核全部既有有效论据，明确保留、解释或移出范围及理由。'
                        '本次提交未保存；在arguments中逐项复核待处理关系，保留有效论据也需说明理由。\n'+json.dumps(dict(
                            entry_id=entry_id,changed_fields=[name for name in semantic if previous_content[name] != content[name]],
                            requires_change_reason=not bool(entry.get('change_reason')),missing_argument_reviews=missing),
                            ensure_ascii=False,separators=(',',':')))
            claim_revision = (row['claim_revision'] + int(changed)) if row else 1
            if row is None or changed:
                schema = ProposedAnalysisDirection if exploration else ProposedAnalysisCheck
                claim = schema.model_validate({name: entry[name] for name in schema.model_fields if name in entry})
                connection.execute('''INSERT INTO analysis_claim_revisions
                    (job_id,entry_id,claim_revision,revision,reason,content_json) VALUES(?,?,?,?,?,?)''',
                    (run_id, entry_id, claim_revision, revision, entry.get('change_reason'), claim.model_dump_json()))
            # Explicit legacy ID associations remain factual, with unknown reasons until reviewed.
            proposed = {(eid, role): None for role, name in [('support', support), ('counter', 'counter_evidence_ids')]
                for eid in entry[name] if (eid, role) not in current}
            for merge in submission.merges:
                if merge.target_id == entry_id:
                    for source_id in merge.source_ids:
                        for item in self.read(connection, run_id, source_id, revision):
                            key = (item.evidence_id, item.role)
                            if key not in current and proposed.get(key) is None:
                                proposed[key] = item
            proposed.update({(eid, role): edit for (target, eid, role), edit in edits.items() if target == entry_id})
            for (eid, role), value in proposed.items():
                if eid not in owners or not owners[eid][1].is_whole_image or eid not in observations:
                    raise ValueError('论据必须引用本场已观察的完整原图')
                source, image = owners[eid]
                previous = current.get((eid, role))
                state = value.state if value else 'active'
                reason = value.reason if value else None
                locator = value.locator_id if value else None
                observation_id = value.observation_id if value and value.observation_id else observations[eid]
                if observation_id not in observation_images or eid not in observation_images[observation_id]:
                    raise ValueError('论据必须关联实际观察过该原图的观察ID')
                if not exploration and state == 'active' and role == 'counter' and not any(
                        observation_directions[observation_id].get(ref) == 'applicable' for ref in entry['direction_refs']):
                    raise ValueError('反例必须来自本条目关联方向中适用且可观察的记录；不适用或不确定的观察可保留为context或范围说明')
                if locator and (locator not in observations or locator not in owners or owners[locator][0].sample_id != source.sample_id):
                    raise ValueError('局部定位必须来自同登记已观察的媒体')
                if state == 'active' and datasets[source.sample_id] not in entry['dataset_ids']:
                    raise ValueError('有效论据的登记必须位于条目适用范围内')
                if state != 'active' and previous is None and not isinstance(value, AnalysisArgumentRecord):
                    raise ValueError('只能解释或移出已有关联论据')
                origin = value.origin_entry_id if isinstance(value, AnalysisArgumentRecord) else previous.origin_entry_id if previous else entry_id
                record = AnalysisArgumentRecord(job_id=run_id, entry_id=entry_id, claim_revision=claim_revision,
                    revision=revision, observation_id=observation_id, evidence_id=eid, locator_id=locator,
                    role=role, state=state, reason=reason, origin_entry_id=origin)
                if previous and not changed and previous.model_dump(exclude={'revision'}) == record.model_dump(exclude={'revision'}):
                    continue
                connection.execute('''INSERT INTO analysis_claim_arguments(job_id,entry_id,evidence_id,role,revision,
                    claim_revision,observation_id,locator_id,state,reason,origin_entry_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)''',
                    (run_id, entry_id, eid, role, revision, claim_revision, observation_id, locator, state, reason, origin))
            active = [item for item in self.read(connection, run_id, entry_id, revision) if item.state == 'active']
            for role, name in [('support', support), ('counter', 'counter_evidence_ids')]:
                entry[name] = list(dict.fromkeys(item.evidence_id for item in active if item.role == role))
            keys = entry.get('key_evidence')
            if keys is not None:
                if len({key['evidence_id'] for key in keys}) != len(keys):
                    raise ValueError('同一条目的关键图不能重复')
                pixels = set()
                for key in keys:
                    if not any(item.evidence_id == key['evidence_id'] and item.role == key['role'] for item in active):
                        roles = ', '.join(sorted({item.role for item in active if item.evidence_id == key['evidence_id']})) or '无'
                        raise ValueError(f"精选原图的角色 {key['role']} 与本条目完整有效论据不一致；该图有效角色：{roles}")
                    pixel_hash = owners[key['evidence_id']][0].pixel_sha256
                    if pixel_hash and pixel_hash in pixels:
                        raise ValueError('同一条目的同像素登记只选一张完整原图代表，完整论据仍保留全部登记')
                    pixels.add(pixel_hash)
                    locator = key.get('locator_id')
                    if locator and (locator not in observations or owners[locator][0].sample_id != owners[key['evidence_id']][0].sample_id):
                        raise ValueError('关键图定位必须来自同登记已观察的媒体')
                if any(item.role == 'counter' for item in active) and not any(key['role'] == 'counter' for key in keys):
                    raise ValueError('存在有效反例时，关键图需保留能改变解释的反例')
