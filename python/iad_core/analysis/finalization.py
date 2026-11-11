import json

from iad_core.analysis.arguments import AnalysisArguments
from iad_core.analysis.catalog import AnalysisCatalogs
from iad_core.analysis.coverage import AnalysisCoverageReader
from iad_core.analysis.finalization_models import (AnalysisFinalizationContext, AnalysisFinalizationReceipt,
    AnalysisDirectionCoverage, AnalysisFinalizationEntry, ExplorationFinalize, KnowledgeFinalize)
from iad_core.analysis.catalog_review import AnalysisCatalogReview
from iad_core.analysis.finalization_state import AnalysisFinalizationState
from iad_core.analysis.models import AnalysisCatalog
from iad_core.analysis.publications import AnalysisPublications
from iad_core.evidence.registrations import PreparedRegistration


class AnalysisFinalizations:
    """Review every stable entry in the same job and publish the accepted final state atomically."""

    def __init__(self, jobs):
        self.jobs, self.db = jobs, jobs.db

    def context(self, run_id: str) -> AnalysisFinalizationContext:
        snapshot = self.jobs.snapshot(run_id)
        with self.jobs.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            state = connection.execute('''SELECT r.revision,r.catalog_json,r.session_id,j.status FROM analysis_workflow_runs r
                JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?''', (run_id,)).fetchone()
            coverage = AnalysisCoverageReader(self.db).read(run_id, connection)
            if coverage.unprocessed:
                raise ValueError('冻结登记尚未全部处理，不能进入全局定稿')
            if not coverage.observed_visuals:
                raise ValueError('未形成有效视觉观察，不能进入全局定稿')
            existing = connection.execute('SELECT 1 FROM analysis_finalizations WHERE job_id=?', (run_id,)).fetchone()
            if existing is None:
                if state['status'] != 'RUNNING':
                    raise InterruptedError('作业已停止，不能开始定稿')
                connection.execute('''INSERT INTO analysis_finalizations(job_id,base_revision,reviewed_json,direction_reviews_json)
                    VALUES(?,?,?,?)''', (run_id, state['revision'], '[]', '[]'))
                self.jobs.jobs.update(run_id, connection=connection, phase='FINALIZING_SCOPE')
            catalog = AnalysisCatalog.model_validate_json(state['catalog_json'])
            progress = AnalysisFinalizationState.progress(connection, run_id, catalog.entry_ids)
            review = AnalysisCatalogReview()
            entries = []
            for item in [*catalog.directions, *catalog.checks]:
                identity = item.direction_id if snapshot.module == 'exploration' else item.check_id
                arguments = AnalysisArguments.read(connection, run_id, identity, state['revision'])
                entries.append(AnalysisFinalizationEntry(entry_id=identity,title=item.title,dataset_ids=item.dataset_ids,
                    direction_refs=[] if snapshot.module == 'exploration' else item.direction_refs,
                    predecessor_ids=item.predecessor_direction_ids if snapshot.module == 'exploration' else item.predecessor_check_ids,
                    argument_count=len(arguments), issues=review.entry(item, arguments)))
        observations = AnalysisCoverageReader(self.db).observations(run_id)
        directions = []
        for selected in snapshot.selected_directions:
            statuses = {item.sample_id:direction.status for item in observations for direction in item.directions
                if direction.direction_ref == selected.ref and not item.report_preparation_error}
            directions.append(AnalysisDirectionCoverage(direction_ref=selected.ref,
                applicable=sum(value=='applicable' for value in statuses.values()),
                not_applicable=sum(value=='not_applicable' for value in statuses.values()),
                uncertain=sum(value=='uncertain' for value in statuses.values()), failed=coverage.failed,
                entry_ids=[entry.check_id for entry in catalog.checks if selected.ref in entry.direction_refs]))
        return AnalysisFinalizationContext(**progress.model_dump(), job_id=run_id, session_id=state['session_id'],
            revision=state['revision'], coverage=coverage.model_dump(exclude={'records'}), entries=entries,
            selected_directions=snapshot.selected_directions, directions=directions, summary=catalog.summary,
            limitations=catalog.limitations, unresolved_questions=catalog.unresolved_questions)

    def accept(self, run_id: str, request: dict) -> AnalysisFinalizationReceipt:
        snapshot = self.jobs.snapshot(run_id)
        schema = ExplorationFinalize if snapshot.module == 'exploration' else KnowledgeFinalize
        submission = schema.model_validate(request)
        canonical = json.dumps(submission.model_dump(mode='json'), ensure_ascii=False, sort_keys=True)
        with self.jobs.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            previous = connection.execute('''SELECT submission_json,receipt_json FROM analysis_finalization_commits
                WHERE job_id=? AND commit_key=?''', (run_id, submission.commit_key)).fetchone()
            if previous is not None:
                if previous['submission_json'] != canonical:
                    raise ValueError('同一定稿提交键不可用于不同内容')
                return AnalysisFinalizationReceipt.model_validate_json(previous['receipt_json'])
            job = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()
            finalization = connection.execute('SELECT * FROM analysis_finalizations WHERE job_id=?', (run_id,)).fetchone()
            if finalization is None or finalization['base_revision'] != submission.base_revision:
                raise ValueError('请读取全局定稿上下文并使用锁定的base_revision')
            if job['status'] != 'RUNNING' or finalization['complete']:
                raise InterruptedError('作业定稿已停止或完成，不能提交新内容')
            state = connection.execute('SELECT revision,catalog_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
            revision = state['revision'] + 1
            media = {value.sample_id:value for row in connection.execute('SELECT media_json FROM analysis_sample_media WHERE job_id=?',(run_id,))
                for value in [PreparedRegistration.model_validate_json(row[0])]}
            observed = {eid for row in connection.execute('SELECT observation_json FROM analysis_sample_observations WHERE job_id=?',(run_id,))
                for eid in json.loads(row[0])['evidence_ids']}
            previous_catalog = AnalysisCatalog.model_validate_json(state['catalog_json'])
            catalog = AnalysisCatalogs().apply(snapshot, previous_catalog,
                submission, media, observed, connection=connection, run_id=run_id, revision=revision)
            entries = {item.direction_id:item for item in catalog.directions} if snapshot.module == 'exploration' else {item.check_id:item for item in catalog.checks}
            edited = getattr(submission, 'directions' if snapshot.module == 'exploration' else 'checks')
            reviewed = set(json.loads(finalization['reviewed_json'])) & entries.keys()
            affected = {item.entry_id for item in [*submission.arguments, *submission.citation_corrections]}
            affected.update(merge.target_id for merge in submission.merges)
            reviewed.difference_update(affected)
            review = AnalysisCatalogReview()
            for item in edited:
                eid = item.direction_id if snapshot.module == 'exploration' else item.check_id
                if eid not in entries:
                    continue
                issues = review.entry(entries[eid], AnalysisArguments.read(connection, run_id, eid, revision))
                if issues:
                    raise ValueError('条目尚未定稿：' + json.dumps(dict(entry_id=eid,issues=issues), ensure_ascii=False))
                reviewed.add(eid)
            direction_reviews = {item['direction_ref']:item for item in json.loads(finalization['direction_reviews_json'])}
            proposed_direction_reviews = submission.direction_reviews if snapshot.module == 'knowledge' else []
            if {item.direction_ref for item in proposed_direction_reviews} - {item.ref for item in snapshot.selected_directions}:
                raise ValueError('定稿引用本场未选择的方向')
            direction_reviews.update({item.direction_ref:item.model_dump() for item in proposed_direction_reviews})
            pending = entries.keys() - reviewed
            if submission.complete:
                if pending or {item.ref for item in snapshot.selected_directions} - direction_reviews.keys():
                    saved = AnalysisFinalizationState.progress(connection,run_id,previous_catalog.entry_ids)
                    saved_directions = {item.direction_ref for item in saved.direction_reviews}
                    raise ValueError('本次定稿页未保存；仍有未定稿条目或未核对的所选方向，不能发表全局终稿：' + json.dumps(dict(
                        page_saved=False,pending_entry_ids=saved.pending_entry_ids,
                        pending_direction_refs=[item.ref for item in snapshot.selected_directions if item.ref not in saved_directions]),ensure_ascii=False))
                if not submission.summary.strip():
                    raise ValueError('作业摘要尚未定稿：摘要不能为空')
            connection.execute('UPDATE analysis_workflow_runs SET revision=?,catalog_json=? WHERE job_id=?',
                (revision,catalog.model_dump_json(),run_id))
            connection.execute('''UPDATE analysis_finalizations SET reviewed_json=?,direction_reviews_json=?,complete=? WHERE job_id=?''',
                (json.dumps([eid for eid in entries if eid in reviewed]),json.dumps(list(direction_reviews.values()),ensure_ascii=False),submission.complete,run_id))
            if submission.complete:
                self.jobs.jobs.update(run_id, connection=connection, completion_pending=False, phase='ANALYSIS_PUBLISHED')
                publication = AnalysisPublications(self.db).publish(run_id, connection=connection)
                connection.execute('UPDATE analysis_finalizations SET version_id=? WHERE job_id=?',(publication.version_id,run_id))
            receipt = AnalysisFinalizationReceipt(**AnalysisFinalizationState.progress(connection,run_id,catalog.entry_ids).model_dump(),
                commit_key=submission.commit_key,revision=revision)
            connection.execute('''INSERT INTO analysis_finalization_commits(job_id,commit_key,revision,submission_json,receipt_json)
                VALUES(?,?,?,?,?)''',(run_id,submission.commit_key,revision,canonical,receipt.model_dump_json()))
            return receipt
