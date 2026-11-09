import json

from iad_core.analysis.models import (AnalysisEvidenceView, AnalysisPublicationView,
    AnalysisSource, AnalysisSourceCatalog, AnalysisWorkflowSnapshot, PublishedDirectionCatalog, PublishedDirectionChoice,
    KnowledgeCheckEvidencePage, AnalysisCatalog, AnalysisCatalogQuery, AnalysisCatalogPage, AnalysisSampleEvidence, AnalysisObservationQuery, AnalysisObservationPage, AnalysisObservationHistoryPage)
from iad_core.analysis.coverage import AnalysisCoverageReader
from iad_core.analysis.publications import AnalysisPublications
from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
from iad_core.knowledge.display_evidence import KnowledgeDisplayEvidence
from iad_core.knowledge.instructions import ExploredDirectionSource
from iad_core.knowledge.models import (KnowledgeCheckPage, KnowledgeCheckSummary,
    KnowledgeCriterion, KnowledgeEvidence, KnowledgeEvidencePage, KnowledgeVersion)


class AnalysisQueries:
    def __init__(self, db):
        self.db = db
        self.publications = AnalysisPublications(db)

    def view(self, version_id: str) -> AnalysisPublicationView:
        publication = self.publications.get(version_id)
        with self.db.connection() as connection:
            snapshot = AnalysisWorkflowSnapshot.model_validate_json(connection.execute(
                'SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (publication.job_id,)).fetchone()[0])
            removed = [row[0] for row in connection.execute('SELECT direction_id FROM analysis_direction_removals WHERE version_id=?', (version_id,))]
        records = {record.sample.sample_id: record for record in snapshot.manifest.records}
        roles = {target.sample_id: target.candidate_role for round in snapshot.plan.rounds for target in round.targets}
        observed = {eid for record in publication.coverage.records for eid in record.observed_evidence_ids}
        observed_samples = {record.sample_id for record in publication.coverage.records if record.observed_evidence_ids}
        return AnalysisPublicationView(**publication.model_dump(), selected_directions=snapshot.selected_directions, removed_direction_ids=removed,
            evidence=[AnalysisEvidenceView(evidence_id=image.evidence_id, sample_id=record.sample_id,
                dataset_id=record.dataset_id, filename=records[record.sample_id].sample.relative_path,
                candidate_role=roles[record.sample_id], sampling_group=records[record.sample_id].sampling_group or 'unclassified',
                image=image, observed=image.evidence_id in observed)
                for record in publication.coverage.records for image in record.media
                if image.evidence_id in observed or record.sample_id in observed_samples and image.role == 'overview'])

    def catalog(self, run_id: str, query: dict | AnalysisCatalogQuery) -> AnalysisCatalogPage:
        query = AnalysisCatalogQuery.model_validate(query)
        with self.db.connection() as connection:
            row = connection.execute('SELECT revision,catalog_json FROM analysis_workflow_runs WHERE job_id=?',(run_id,)).fetchone()
        if row is None:
            raise LookupError('原生分析作业不存在')
        catalog = AnalysisCatalog.model_validate_json(row['catalog_json'])
        items = getattr(catalog,query.section)
        key = 'direction_id' if query.section == 'directions' else 'check_id'
        if query.ids:
            if set(query.ids) - {getattr(item,key) for item in items}:
                raise LookupError('条目不属于本场当前目录')
            items = [item for item in items if getattr(item,key) in query.ids]
        end = query.offset + query.limit
        return AnalysisCatalogPage(job_id=run_id,revision=row['revision'],section=query.section,total=len(items),offset=query.offset,
            next_offset=end if end < len(items) else None,items=items[query.offset:end])

    def evidence(self, version_id: str, evidence_id: str) -> dict:
        view = self.view(version_id)
        image = next((item.image for item in view.evidence if item.evidence_id == evidence_id), None)
        if image is None:
            raise LookupError('该发布版本不存在指定观察证据')
        return {'path': EvidenceImages(self.db.db_path).path(image), 'media_type': image.media_type}

    def sample_evidence(self, version_id: str, sample_id: str) -> AnalysisSampleEvidence:
        view = self.view(version_id)
        with self.db.connection() as connection:
            row = connection.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (view.job_id,)).fetchone()
        snapshot = AnalysisWorkflowSnapshot.model_validate_json(row[0])
        record = next((record for record in snapshot.manifest.records if record.sample.sample_id == sample_id),None)
        if record is None:
            raise LookupError('该图像不属于所选发布版本')
        return AnalysisSampleEvidence(version_id=version_id,module=view.module,registration=record,
            items=[item for item in view.evidence if item.sample_id == sample_id])

    def observations(self, version_id: str, query: AnalysisObservationQuery) -> AnalysisObservationPage:
        view = self.view(version_id)
        if query.direction_ref and query.direction_ref not in {direction.ref for direction in view.selected_directions}:
            raise LookupError('该发布版本没有所选方向')
        history = AnalysisCoverageReader(self.db).history(view.job_id,query,view.revision)
        return AnalysisObservationPage(version_id=version_id,selected_directions=view.selected_directions,
            **history.model_dump(exclude={'job_id','revision'}))

    def observation_history(self, run_id: str, query: dict | AnalysisObservationQuery) -> AnalysisObservationHistoryPage:
        query = AnalysisObservationQuery.model_validate(query)
        with self.db.connection() as connection:
            row = connection.execute('SELECT revision FROM analysis_workflow_runs WHERE job_id=?',(run_id,)).fetchone()
        if row is None:
            raise LookupError('原生分析作业不存在')
        return AnalysisCoverageReader(self.db).history(run_id,query,row['revision'])

    def sources(self, dataset_ids: list[str]) -> AnalysisSourceCatalog:
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT sample_id,dataset_id,relative_path FROM samples
                WHERE dataset_id IN (SELECT value FROM json_each(?)) ORDER BY dataset_id,relative_path,sample_id''', (json.dumps(dataset_ids),)).fetchall()
        return AnalysisSourceCatalog(items=[AnalysisSource.model_validate(dict(row)) for row in rows])

    def remove_direction(self, request):
        view = self.view(request.version_id)
        if view.module != 'exploration' or not any(direction.direction_id == request.direction_id
                and request.dataset_id in direction.dataset_ids for direction in view.catalog.directions):
            raise ValueError('所选方向不属于当前发布范围')
        with self.db.connection() as connection:
            connection.execute('INSERT INTO analysis_direction_removals(version_id,direction_id) VALUES(?,?) ON CONFLICT DO NOTHING',
                (request.version_id, request.direction_id))
        return request

    def versions(self, dataset_id: str, module: str) -> list[KnowledgeVersion]:
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT p.publication_json,r.snapshot_json FROM analysis_publications p
                JOIN analysis_workflow_runs r ON r.job_id=p.job_id JOIN job_runs j ON j.job_id=p.job_id
                WHERE json_extract(r.snapshot_json,'$.module')=? AND j.deleted_at IS NULL
                AND EXISTS(SELECT 1 FROM json_each(r.snapshot_json,'$.manifest.dataset_ids') WHERE value=?)
                ORDER BY p.rowid DESC''', (module, dataset_id)).fetchall()
        return [KnowledgeVersion(version_id=p['version_id'], dataset_id=dataset_id, source_run_id=p['job_id'], parent_version_id=p.get('parent_version_id'),
            manually_edited=p.get('manual_edit') is not None,
            model_name=json.loads(row['snapshot_json'])['agent']['profile']['model_id'], created_at=p['created_at'],
            source_count=p['coverage']['total'], check_count=len(p['catalog']['checks']),
            supported_check_count=sum(check['status'] == 'supported' for check in p['catalog']['checks']))
            for row in rows for p in [json.loads(row['publication_json'])]]

    def choices(self, dataset_ids: list[str]) -> PublishedDirectionCatalog:
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT p.version_id FROM analysis_publications p
                JOIN analysis_workflow_runs r ON r.job_id=p.job_id JOIN job_runs j ON j.job_id=p.job_id
                WHERE json_extract(r.snapshot_json,'$.module')='exploration' AND j.deleted_at IS NULL
                AND p.rowid=(SELECT MAX(recent.rowid) FROM analysis_publications recent WHERE recent.job_id=p.job_id)
                AND EXISTS(SELECT 1 FROM json_each(r.snapshot_json,'$.manifest.dataset_ids') d
                    WHERE value IN (SELECT value FROM json_each(?))) ORDER BY p.rowid DESC''', (json.dumps(dataset_ids),)).fetchall()
        directions = []
        for row in rows:
            view = self.view(row['version_id'])
            directions.extend(PublishedDirectionChoice(direction_id=direction.direction_id, title=direction.title,
                instruction=direction.instruction, origin='explored', summary=view.catalog.summary,
                limitations=[*view.catalog.limitations, *direction.limitations],
                source=ExploredDirectionSource(run_id=view.job_id, version_id=view.version_id, direction_id=direction.direction_id))
                for direction in view.catalog.directions if direction.direction_id not in view.removed_direction_ids)
        return PublishedDirectionCatalog(directions=directions)

    def check_summaries(self, view: AnalysisPublicationView) -> list[KnowledgeCheckSummary]:
        projection = KnowledgeDisplayEvidence([KnowledgeEvidence(sample_id=item.sample_id,image=item.image) for item in view.evidence])
        reviews = KnowledgeCheckReviews(self.db).read(view.version_id)
        return [KnowledgeCheckSummary(**check.model_dump(include=set(KnowledgeCriterion.model_fields)),
            check_id=check.check_id, support_count=len(projection.images(check.support_evidence_ids)),
            counter_count=len(projection.images(check.counter_evidence_ids)), pending_recheck_source_count=0,
            support_limitations=check.support_limitations, conflict_ids=[], review=reviews.get(check.check_id, {})) for check in view.catalog.checks]

    def knowledge(self, version_id: str) -> AnalysisPublicationView:
        view = self.view(version_id)
        if view.module != 'knowledge':
            raise ValueError('该发布版本不是知识挖掘结果')
        return view

    def details(self, query):
        view = self.knowledge(query.version_id)
        images = [KnowledgeEvidence(sample_id=item.sample_id, image=item.image) for item in view.evidence]
        projection = KnowledgeDisplayEvidence(images)
        common = dict(version_id=view.version_id, dataset_id=view.coverage.records[0].dataset_id,
            page=query.page, page_size=query.page_size)
        start = (query.page - 1) * query.page_size
        if query.section == 'evidence':
            selected = projection.images(query.evidence_ids)
            return KnowledgeEvidencePage(version_id=view.version_id, total=len(selected), page=query.page,
                page_size=query.page_size, items=selected[start:start + query.page_size])
        if query.section != 'checks':
            raise ValueError('逐登记方向观察请读取对应原生分析作业')
        summaries = {check.check_id:check for check in self.check_summaries(view)}
        if query.check_id:
            check = next((check for check in view.catalog.checks if check.check_id == query.check_id), None)
            if check is None:
                raise LookupError('发布版本没有所选知识条目')
            ids = check.support_evidence_ids if query.evidence_role == 'support' else check.counter_evidence_ids if query.evidence_role == 'counter' else [*check.support_evidence_ids, *check.counter_evidence_ids]
            selected = projection.images(ids)
            return KnowledgeCheckEvidencePage(**common, check=summaries[check.check_id],
                directions=[direction for direction in view.selected_directions if direction.ref in check.direction_refs], support_evidence_ids=check.support_evidence_ids,
                counter_evidence_ids=check.counter_evidence_ids, total=len(selected), items=selected[start:start + query.page_size])
        term = query.search.strip().casefold()
        selected = [item for item in summaries.values() if (not term or term in (item.title + ' ' + item.criterion).casefold())
            and (query.review_status == 'all' or query.review_status == item.review.status
                or query.review_status == 'conflict' and item.status == 'conflicted')]
        return KnowledgeCheckPage(**common, total=len(selected), items=selected[start:start + query.page_size])
