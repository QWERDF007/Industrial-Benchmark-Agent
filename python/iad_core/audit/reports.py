import json
from contextlib import nullcontext
from collections import Counter, defaultdict

from iad_core.audit.models import AuditFinal, AuditSampleRun
from iad_core.audit.report_models import (AuditCount, AuditStatistics, AuditRecordQuery,
    AuditReportCommit, AuditReportSession, AuditDiscovery, AuditRepresentative)
from iad_core.audit.state import AuditState
from iad_core.workbench.calls import ModelCalls


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
            completed = sample.state == 'COMPLETED' and final is not None and final.execution_status == 'completed'
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
            and sample.result is not None and sample.result.execution_status == 'completed' and sample.result.observations]
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
            if query.issue_type and (final is None or not any(f.type == query.issue_type for f in final.findings)):
                continue
            if query.consistency_assessment and (final is None or not any(r.assessment == query.consistency_assessment for r in final.consistency_review)):
                continue
            if query.knowledge_id and (not final or not any(a.check_id == query.knowledge_id for a in final.check_assessments)):
                continue
            selected.append(sample)
        return selected

    def records(self, run_id: str, query: dict) -> dict:
        from iad_core.audit.master_models import AuditMasterRecord
        query = AuditRecordQuery.model_validate(query)
        selected = self.matching(run_id,query)
        start = (query.page-1)*query.page_size
        items = [AuditMasterRecord.capture(sample).model_dump(mode='json',exclude_computed_fields=True)
            for sample in selected[start:start+query.page_size]]
        return dict(kind='audit_records',job_id=run_id,
            total=len(selected),page=query.page,page_size=query.page_size,items=items)

    def session(self, run_id: str) -> AuditReportSession:
        with self.db.connection() as connection:
            row = connection.execute('SELECT * FROM audit_report_runs WHERE job_id=?', (run_id,)).fetchone()
        if row is None:
            raise LookupError('本作业没有原生报告Session')
        with self.db.connection() as connection:
            latest = connection.execute('SELECT revision,submission_json FROM audit_global_versions WHERE job_id=? ORDER BY revision DESC LIMIT 1',(run_id,)).fetchone()
        return AuditReportSession(revision=latest[0] if latest else 0,discoveries=json.loads(latest[1])['discoveries'] if latest else [],job_id=run_id,session_id=row['session_id'],session_created=bool(row['session_created']),state=row['state'],
            result=json.loads(row['result_json']) if row['result_json'] else None,error=row['error'],
            prompts=json.loads(row['prompts_json']) if row['prompts_json'] else None)

    def discovery(self, run_id: str, query: dict) -> dict:
        from iad_core.audit.discoveries import AuditDiscoveries
        return AuditDiscoveries(self).page(run_id, query)

    def begin(self, run_id: str):
        if any(sample.state in ('PENDING','RUNNING') for sample in self.state.samples(run_id)):
            raise ValueError('所有主图处理结束后才能汇总报告')
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_report_runs SET state='RUNNING',error=NULL WHERE job_id=? AND state!='COMPLETED'", (run_id,))
        return self.session(run_id)

    def delivered(self, run_id: str, call, evidence_ids: list[str] = ()):
        samples = {sample.sample_id:sample for sample in self.state.samples(run_id)}
        delivered = set()
        for message in call.request.get('messages',[]):
            for block in message.get('content',[]):
                if not isinstance(block,dict) or block.get('type') != 'text':
                    continue
                try:
                    page = json.loads(block['text'].splitlines()[0])
                except (ValueError,KeyError):
                    continue
                if isinstance(page,dict) and page.get('kind')=='audit_records' and page.get('job_id')==run_id:
                    delivered.update((item['sample_id'],item['result_revision']) for item in page['items'])
        if {item[0] for item in delivered} - samples.keys():
            raise ValueError('主 Agent 读取包含本作业范围外记录')
        from iad_core.evidence.registrations import PreparedRegistration
        with self.db.connection() as connection:
            available = {image.image.evidence_id for row in connection.execute('SELECT media_json FROM audit_sample_media WHERE job_id=?',(run_id,))
                for image in PreparedRegistration.model_validate_json(row[0]).images
                if image.image.is_whole_image and image.image.representation=='raw'}
            if set(evidence_ids) - available:
                raise ValueError('主 Agent 仅接收本作业冻结完整原图')
            connection.executemany('INSERT OR IGNORE INTO audit_master_reads VALUES(?,?,?,?)',
                [(run_id,call.call_id,sample_id,revision) for sample_id,revision in delivered])
            connection.executemany('INSERT OR IGNORE INTO audit_master_media_deliveries VALUES(?,?,?)',
                [(run_id,call.call_id,eid) for eid in evidence_ids])

    def read_versions(self, run_id: str) -> set[tuple[str,int]]:
        successful = ModelCalls(self.db).successful_native_ids(run_id,
            complete_response=self.state.snapshot(run_id).context_policy == 'evidence-on-demand-v1')
        with self.db.connection() as connection:
            return {(row[0],row[1]) for row in connection.execute(
                'SELECT sample_id,result_revision,call_id FROM audit_master_reads WHERE job_id=?',(run_id,)) if row[2] in successful}

    def observed(self, run_id: str) -> set[str]:
        successful = ModelCalls(self.db).successful_native_ids(run_id,
            complete_response=self.state.snapshot(run_id).context_policy == 'evidence-on-demand-v1')
        with self.db.connection() as connection:
            return {row[0] for row in connection.execute(
                'SELECT evidence_id,call_id FROM audit_master_media_deliveries WHERE job_id=?',(run_id,)) if row[1] in successful}

    def validate_references(self, run_id: str, refs, *, current_only: bool = False):
        samples = {sample.sample_id:sample for sample in self.state.samples(run_id)}
        for ref in refs:
            sample = samples.get(ref.sample_id)
            if sample is None:
                raise ValueError('引用不属于冻结范围')
            with self.db.connection() as connection:
                row = connection.execute('SELECT result_json FROM audit_image_versions WHERE job_id=? AND sample_id=? AND revision=?',
                    (run_id,ref.sample_id,ref.result_revision)).fetchone()
            if row is None:
                raise ValueError('须引用真实已保存的图级版本')
            result = AuditFinal.model_validate_json(row[0])
            records = {'finding':result.findings,'observation':result.observations,'feature':result.visual_features}
            if ref.kind != 'image' and (ref.index is None or ref.index >= len(records[ref.kind])):
                raise ValueError('引用的图级记录不存在')
            if current_only and ref.result_revision != sample.result_revision:
                raise ValueError('正式发现必须引用当前有效图级版本')

    def validate_gallery(self, run_id: str, representatives: list[AuditRepresentative],
            role_samples: dict[str,set[str]], *, required: bool):
        from iad_core.audit.evidence import AuditEvidence
        if required and not any(item.role=='representative' for item in representatives):
            raise ValueError('正式图证须包含典型完整原图')
        if len({item.sample_id for item in representatives}) != len(representatives):
            raise ValueError('同组图像证据不能重复')
        observed = self.observed(run_id)
        for item in representatives:
            if item.sample_id not in role_samples[item.role]:
                raise ValueError('典型原图须关联实际支持，对照原图须关联实际反例')
            page = AuditEvidence(self.state).prepare(run_id,item.sample_id,item.sample_id)
            if page.evidence_id not in observed:
                raise ValueError('主 Agent 尚未实际观察所选完整原图')

    def validate_discoveries(self, run_id: str, discoveries: list[AuditDiscovery], *, final: bool = False):
        if len({item.group_id for item in discoveries}) != len(discoveries):
            raise ValueError('全局发现引用不能重复')
        for discovery in discoveries:
            refs = [*discovery.support_refs,*discovery.counter_refs]
            self.validate_references(run_id,refs,current_only=final and discovery.status!='withdrawn')
            if discovery.kind=='quality_issue' and not any(ref.kind=='finding' for ref in discovery.support_refs):
                raise ValueError('质量疑点主题必须有真实图级疑点')
            self.validate_gallery(run_id,discovery.representatives,{
                'representative':{ref.sample_id for ref in discovery.support_refs},
                'counter':{ref.sample_id for ref in discovery.counter_refs}},required=final and discovery.status!='withdrawn')

    def commit(self, run_id: str, request: dict) -> AuditReportSession:
        from iad_core.audit.batches import AuditBatches
        submission = AuditReportCommit.model_validate(request)
        canonical = submission.model_dump_json(exclude_computed_fields=True)
        current = self.session(run_id)
        with self.db.connection() as connection:
            saved = connection.execute('SELECT submission_json FROM audit_report_commits WHERE job_id=? AND commit_key=?',
                (run_id,submission.commit_key)).fetchone()
        if saved:
            if json.loads(saved[0]) != json.loads(canonical):
                raise ValueError('同一报告提交键不能用于不同内容')
            return current
        if current.state!='RUNNING' or AuditBatches(self.state).begin(run_id) is not None or AuditBatches(self.state).rechecks(run_id):
            raise ValueError('须完成全部批次联合分析和定向复审后提交报告')
        catalog = {item.group_id:item for item in current.discoveries}
        if len(set(submission.discovery_ids))!=len(submission.discovery_ids) or set(submission.discovery_ids)-catalog.keys():
            raise ValueError('报告须选择真实全局发现')
        selected = [catalog[identity] for identity in submission.discovery_ids]
        if any(item.status=='withdrawn' for item in selected):
            raise ValueError('已撤回假设不能作为正式发现')
        self.validate_discoveries(run_id,selected,final=True)
        samples = self.state.samples(run_id)
        if {(sample.sample_id,sample.result_revision) for sample in samples} - self.read_versions(run_id):
            raise ValueError('报告尚未实际读取全部有效图级记录')
        from iad_core.audit.report_models import AUDIT_ISSUE_TYPES_BY_FORMAT
        if submission.consistency_analyses and {item.issue_type for item in submission.consistency_analyses} != set(
                AUDIT_ISSUE_TYPES_BY_FORMAT[self.state.snapshot(run_id).dataset_profile.dataset_format]):
            raise ValueError('一致性分析须分别覆盖本数据格式的全部适用差异类型')
        for section in [*submission.capabilities,*submission.coverage_topics,*submission.consistency_analyses]:
            self.validate_references(run_id,section.evidence_refs,current_only=True)
            if section.representatives:
                evidence_samples={ref.sample_id for ref in section.evidence_refs}
                self.validate_gallery(run_id,section.representatives,
                    {'representative':evidence_samples,'counter':evidence_samples},required=True)
        source = self.state.snapshot(run_id).dataset_profile.benchmark
        for assessment in submission.usability:
            if assessment.status!='usable' or assessment.purpose in ('exploration','training_experiment','debug'):
                continue
            if source is None or not source.source_matches_scope or not source.leakage.is_passed or source.readiness.standard_ad.status!='READY':
                raise ValueError('正式评测用途须有本范围真实 Gold、独立划分和已执行的就绪结果')
            if assessment.purpose=='pixel_evaluation' and source.pixel_gold_images==0:
                raise ValueError('矩形标注不能作为像素级 Gold')
            if assessment.purpose=='bbox_evaluation' and source.readiness.small_weak.status!='READY':
                raise ValueError('框级评测缺少真实定位就绪证据')
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            if connection.execute('SELECT status FROM job_runs WHERE job_id=?',(run_id,)).fetchone()[0]!='RUNNING':
                raise ValueError('作业已停止，不能提交报告')
            connection.execute('INSERT INTO audit_report_commits VALUES(?,?,?)',(run_id,submission.commit_key,canonical))
            connection.execute("UPDATE audit_report_runs SET result_json=?,state='COMPLETED',error=NULL WHERE job_id=?",(canonical,run_id))
        return self.session(run_id)

    def evidence(self, run_id: str, sample_id: str, evidence_id: str):
        from iad_core.audit.evidence import AuditEvidence
        from iad_core.evidence.registrations import RegistrationMediaPage
        self.state.sample(run_id,sample_id)
        media=AuditEvidence(self.state).prepare(run_id,sample_id,sample_id)
        image=next((item for item in media.images if item.image.evidence_id==evidence_id
            and item.image.is_whole_image and item.image.representation=='raw'),None)
        if image is None:
            raise ValueError('主 Agent 和报告仅能读取冻结完整原图')
        return RegistrationMediaPage(sample_id=sample_id,evidence_id=evidence_id,total=1,offset=0,images=[image],error=None)

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
