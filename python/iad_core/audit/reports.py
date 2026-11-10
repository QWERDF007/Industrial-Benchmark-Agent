import json
from contextlib import nullcontext
from collections import Counter, defaultdict

from iad_core.audit.models import AuditFinal, AuditSampleRun
from iad_core.audit.report_models import (AuditCount, AuditStatistics, AuditRecordQuery, AuditGroupCommit,
    AuditReportCommit, AuditReportSession, AuditIssueGroup)
from iad_core.audit.state import AuditState


class AuditReports:
    def __init__(self, db):
        self.db, self.state = db, AuditState(db)

    def statistics(self, run_id: str) -> AuditStatistics:
        samples = self.state.samples(run_id)
        counts, occurrences, reviews = Counter(), Counter(), Counter()
        images = defaultdict(set)
        datasets, cross, knowledge = defaultdict(Counter), defaultdict(Counter), defaultdict(Counter)
        records = {record.sample.sample_id:record for record in self.state.snapshot(run_id).manifest.records}
        for sample in samples:
            final = sample.result
            completed = sample.state == 'COMPLETED' and isinstance(final, AuditFinal) and final.execution_status == 'completed'
            state = final.state if completed else 'incomplete'
            counts[state] += 1
            datasets[records[sample.sample_id].sample.dataset_id][state] += 1
            source = sample.consistency.reason
            if source == 'MODEL_REVIEWED':
                source += ':' + (sample.consistency.verdict or 'UNCERTAIN')
            cross[source][state] += 1
            if not completed:
                continue
            for finding in final.findings:
                occurrences[finding.type] += 1
                images[finding.type].add(sample.sample_id)
            reviews.update(review.assessment for review in final.consistency_review)
            for check in final.check_assessments:
                knowledge[check.check_id][check.status] += 1
        observations = [sample.result.observations for sample in samples if sample.state == 'COMPLETED'
            and isinstance(sample.result, AuditFinal) and sample.result.execution_status == 'completed' and sample.result.observations]
        total, completed = len(samples), counts['normal'] + counts['suspect']
        return AuditStatistics(total_images=total, completed_images=completed, normal_images=counts['normal'],
            suspect_images=counts['suspect'], incomplete_images=total-completed,
            completion_rate=completed/total if total else None,
            suspect_rate_among_completed=counts['suspect']/completed if completed else None,
            issue_occurrences=sum(occurrences.values()),
            issue_types={kind:AuditCount(image_count=len(images[kind]),occurrences=count) for kind,count in occurrences.items()},
            datasets={key:dict(value) for key,value in datasets.items()}, consistency_cross={key:dict(value) for key,value in cross.items()},
            consistency_assessments=dict(reviews),knowledge_assessments={key:dict(value) for key,value in knowledge.items()},
            observation_images=len(observations),observation_occurrences=sum(map(len,observations)))

    def matching(self, run_id: str, query: AuditRecordQuery) -> list[AuditSampleRun]:
        selected = []
        for sample in self.state.samples(run_id):
            final = sample.result
            status = final.state if sample.state == 'COMPLETED' and final else 'incomplete'
            if query.sample_id and query.sample_id != sample.sample_id or query.state and query.state != status:
                continue
            if query.issue_type and (not isinstance(final, AuditFinal) or not any(f.type == query.issue_type for f in final.findings)):
                continue
            if query.consistency_assessment and (not isinstance(final, AuditFinal) or not any(r.assessment == query.consistency_assessment for r in final.consistency_review)):
                continue
            if query.knowledge_id and (not final or not any(a.check_id == query.knowledge_id for a in final.check_assessments)):
                continue
            selected.append(sample)
        return selected

    def records(self, run_id: str, query: dict) -> dict:
        query = AuditRecordQuery.model_validate(query)
        selected = self.matching(run_id,query)
        start = (query.page-1)*query.page_size
        items = [dict(sample_id=sample.sample_id,execution_state=sample.state,
            final=sample.result.model_dump(mode='json') if sample.result else None,
            consistency=dict(reason=sample.consistency.reason,program_conclusion=sample.consistency.program_conclusion,
                model_conclusion=sample.consistency.model_conclusion,
                result=sample.consistency.result.model_dump(mode='json') if sample.consistency.result else None,
                gates=[gate.model_dump(mode='json',include={'candidate_id','gate_status','relation','reason','limitations','region_checks'})
                    for gate in sample.consistency.gates])) for sample in selected[start:start+query.page_size]]
        return dict(kind='audit_records',job_id=run_id,generation=self.session(run_id).generation if self.state.snapshot(run_id).schema_version>=3 else 0,
            total=len(selected),page=query.page,page_size=query.page_size,items=items)

    def session(self, run_id: str) -> AuditReportSession:
        with self.db.connection() as connection:
            row = connection.execute('SELECT * FROM audit_report_runs WHERE job_id=?', (run_id,)).fetchone()
        if row is None:
            raise LookupError('本作业没有原生报告Session')
        return AuditReportSession(job_id=run_id,session_id=row['session_id'],session_created=bool(row['session_created']),generation=row['generation'],state=row['state'],
            groups=json.loads(row['groups_json']),result=json.loads(row['result_json']) if row['result_json'] else None,error=row['error'])

    def begin(self, run_id: str):
        if any(sample.state in ('PENDING','RUNNING') for sample in self.state.samples(run_id)):
            raise ValueError('所有主图处理结束后才能汇总报告')
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_report_runs SET state='RUNNING',error=NULL WHERE job_id=? AND state!='COMPLETED'", (run_id,))
        return self.session(run_id)

    def context(self, run_id: str) -> dict:
        snapshot = self.state.snapshot(run_id)
        report = self.session(run_id)
        return dict(phase='report',job_id=run_id,session_id=report.session_id,generation=report.generation,dataset_ids=snapshot.manifest.dataset_ids,
            dataset_format=snapshot.manifest.records[0].dataset_format,
            consistency_job_id=snapshot.consistency_job_id,knowledge=snapshot.knowledge.model_dump(mode='json') if snapshot.knowledge else None,
            statistics=self.statistics(run_id).model_dump(mode='json'),groups=[group.model_dump(mode='json') for group in report.groups],
            record_count=len(snapshot.manifest.records),pending_sample_ids=sorted({record.sample.sample_id for record in snapshot.manifest.records}-self.read_ids(run_id)))

    def delivered(self, run_id: str, call):
        generation = self.session(run_id).generation
        registered = {sample.sample_id for sample in self.state.samples(run_id)}
        delivered = set()
        for message in call.request.get('messages',[]):
            if message.get('role') != 'tool':
                continue
            for block in message.get('content',[]):
                if block.get('type') != 'text':
                    continue
                try:
                    page = json.loads(block['text'])
                except (ValueError,KeyError):
                    continue
                if isinstance(page,dict) and page.get('kind')=='audit_records' and page.get('job_id')==run_id and page.get('generation')==generation:
                    delivered.update(item['sample_id'] for item in page['items'])
        if delivered - registered:
            raise ValueError('报告读取包含本作业范围外记录')
        with self.db.connection() as connection:
            connection.executemany('INSERT OR IGNORE INTO audit_report_reads VALUES(?,?,?,?)',[(run_id,generation,call.call_id,sample_id) for sample_id in delivered])

    def read_ids(self, run_id: str) -> set[str]:
        generation = self.session(run_id).generation
        with self.db.connection() as connection:
            return {row[0] for row in connection.execute("""SELECT r.sample_id FROM audit_report_reads r JOIN model_calls c ON c.call_id=r.call_id
                WHERE r.job_id=? AND r.generation=? AND json_extract(c.summary_json,'$.finished_at') IS NOT NULL
                AND json_extract(c.summary_json,'$.finish_reason') NOT IN ('error','aborted') AND json_extract(c.summary_json,'$.error') IS NULL""",(run_id,generation))}

    def groups(self, run_id: str, request: dict) -> AuditReportSession:
        submission = AuditGroupCommit.model_validate(request)
        if len({group.group_id for group in submission.groups}) != len(submission.groups):
            raise ValueError('本次主题ID重复')
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            current = connection.execute('SELECT r.*,j.status FROM audit_report_runs r JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?',(run_id,)).fetchone()
            if current is None:
                raise LookupError('审计报告不存在')
            canonical = json.dumps(dict(kind='groups',generation=current['generation'],value=submission.model_dump(mode='json')),sort_keys=True,ensure_ascii=False)
            saved = connection.execute('SELECT submission_json FROM audit_report_commits WHERE job_id=? AND commit_key=?',(run_id,submission.commit_key)).fetchone()
            if saved:
                if saved[0] != canonical:
                    raise ValueError('同一报告提交键不能用于不同内容')
            else:
                if current['state'] != 'RUNNING' or current['status'] != 'RUNNING':
                    raise ValueError('报告不在执行中，不能保存主题')
                merged = {item['group_id']:AuditIssueGroup.model_validate(item) for item in json.loads(current['groups_json'])}
                if set(submission.remove_group_ids) - merged.keys():
                    raise ValueError('删除的主题不存在')
                for group_id in submission.remove_group_ids:
                    del merged[group_id]
                merged.update({group.group_id:group for group in submission.groups})
                self.validate_groups(run_id,list(merged.values()),complete=False)
                connection.execute('INSERT INTO audit_report_commits VALUES(?,?,?)',(run_id,submission.commit_key,canonical))
                connection.execute('UPDATE audit_report_runs SET groups_json=? WHERE job_id=?',
                    (json.dumps([group.model_dump(mode='json') for group in merged.values()],ensure_ascii=False),run_id))
        return self.session(run_id)

    def validate_groups(self, run_id: str, groups: list[AuditIssueGroup], *, complete: bool):
        samples = {sample.sample_id:sample for sample in self.state.samples(run_id)}
        issues = {(sample.sample_id,finding.finding_id) for sample in samples.values()
            if sample.state == 'COMPLETED' and isinstance(sample.result,AuditFinal) for finding in sample.result.findings}
        seen = set()
        for group in groups:
            refs = [(ref.sample_id,ref.finding_id) for ref in group.issue_refs]
            if len(set(refs)) != len(refs) or set(refs) - issues or seen & set(refs):
                raise ValueError('主题必须引用真实完成疑点且每项疑点只归入一个主主题')
            seen.update(refs)
            representatives = [item for item in group.representatives if item.role == 'representative']
            counters = [item for item in group.representatives if item.role == 'counter']
            if not 1 <= len(representatives) <= 3 or len(counters) > 1:
                raise ValueError('每个主题选择1至3张典型图，至多1张判断边界对照图')
            if len({item.sample_id for item in group.representatives}) != len(group.representatives):
                raise ValueError('主题图像证据不能重复')
            for item in group.representatives:
                sample = samples.get(item.sample_id)
                if sample is None or sample.state != 'COMPLETED' or not sample.result or not sample.result.evidence_ids:
                    raise ValueError('代表图必须属于本作业真实完成观察的图像')
                if item.finding_id is not None and (item.sample_id,item.finding_id) not in issues:
                    raise ValueError('典型图或对照图引用的疑点不存在')
                if item.role == 'representative' and (item.sample_id,item.finding_id) not in set(refs):
                    raise ValueError('代表图必须关联本主题真实疑点')
        if complete and seen != issues:
            raise ValueError('报告主题尚未覆盖全部已完成图级疑点')

    def commit(self, run_id: str, request: dict) -> AuditReportSession:
        submission = AuditReportCommit.model_validate(request)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            current = connection.execute('SELECT r.*,j.status FROM audit_report_runs r JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?',(run_id,)).fetchone()
            if current is None:
                raise LookupError('审计报告不存在')
            canonical = json.dumps(dict(kind='report',generation=current['generation'],value=submission.model_dump(mode='json')),sort_keys=True,ensure_ascii=False)
            saved = connection.execute('SELECT submission_json FROM audit_report_commits WHERE job_id=? AND commit_key=?',(run_id,submission.commit_key)).fetchone()
            if saved:
                if saved[0] != canonical:
                    raise ValueError('同一报告提交键不能用于不同内容')
            else:
                if current['state'] != 'RUNNING' or current['status'] != 'RUNNING':
                    raise ValueError('作业不在执行中，不能提交迟到报告')
                self.validate_groups(run_id,[AuditIssueGroup.model_validate(group) for group in json.loads(current['groups_json'])],complete=True)
                if {sample.sample_id for sample in self.state.samples(run_id)} != self.read_ids(run_id):
                    raise ValueError('报告尚未实际读取全部图级记录，请使用audit_records读取剩余页')
                connection.execute('INSERT INTO audit_report_commits VALUES(?,?,?)',(run_id,submission.commit_key,canonical))
                connection.execute("UPDATE audit_report_runs SET result_json=?,state='COMPLETED',error=NULL WHERE job_id=?",(submission.model_dump_json(),run_id))
        return self.session(run_id)

    def evidence(self, run_id: str, sample_id: str, evidence_id: str):
        from iad_core.audit.evidence import AuditEvidence
        from iad_core.evidence.registrations import PreparedRegistration, RegistrationMediaPage
        sample = self.state.sample(run_id,sample_id)
        if sample.state != 'COMPLETED' or evidence_id not in AuditEvidence(self.state).observed(run_id,sample_id):
            raise ValueError('报告仅能读取本作业逐图已完成实际观察的证据')
        with self.db.connection() as connection:
            media = [PreparedRegistration.model_validate_json(row[0]) for row in connection.execute(
                'SELECT media_json FROM audit_sample_media WHERE job_id=? AND target_id=?',(run_id,sample_id))]
        image = next((image for page in media for image in page.images if image.image.evidence_id == evidence_id),None)
        if image is None:
            raise LookupError('实际观察证据没有保存的像素')
        whole = next((page.evidence_id for page in media if page.sample_id == image.sample_id and page.evidence_id),None)
        return RegistrationMediaPage(sample_id=image.sample_id,evidence_id=whole,total=1,offset=0,images=[image],error=None)

    def failure(self, run_id: str, message: str):
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_report_runs SET state='FAILED',error=? WHERE job_id=? AND state!='COMPLETED'",(message,run_id))

    def finalize(self, run_id: str, *, connection=None, status: str | None = None, finished_at: str | None = None):
        from iad_core.audit.queries import AuditQueries
        from iad_core.workbench.audit_html import AuditHtmlReport
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            row = connection.execute('SELECT report_html FROM audit_workflow_runs WHERE job_id=?',(run_id,)).fetchone()
            if row and row[0] is not None:
                return
            queries = AuditQueries(self.db)
            report = queries.report(run_id)
            if status is not None:
                report = report.model_copy(update={'status':status,'finished_at':finished_at,'export_ready':True})
            if report.status in ('PENDING','RUNNING'):
                raise ValueError('作业尚未结束，不能生成最终报告')
            report = report.model_copy(update={'export_ready':True})
            html = AuditHtmlReport(queries).render(run_id,report=report)['html']
            connection.execute('UPDATE audit_workflow_runs SET summary_json=?,report_html=? WHERE job_id=?',
                (report.model_dump_json(exclude_computed_fields=True),html,run_id))
