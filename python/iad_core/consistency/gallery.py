import hashlib
import json
from collections import Counter, defaultdict
from collections.abc import Sequence
from sqlite3 import Row
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.annotation_models import AnnotationComparison, ANNOTATION_DIFFERENCE_CATEGORIES
from iad_core.consistency.models import MODEL_ASSESSMENT_LABELS, Count, DifferenceType, GalleryFilterKind, GalleryModelFilter, Identifier, ModelAssessmentState
from iad_core.consistency.result_models import FactState
from iad_core.consistency.result_snapshot import ResultSnapshots
from iad_core.consistency.group_analysis_states import GroupAnalysisStates
from iad_core.consistency.candidate_selection import ELIGIBLE_PAIR_SQL, REVIEW_PAIR_SQL
from iad_core.consistency.group_models import FrozenAnalysisGroup, GalleryKind, GalleryImage, GalleryComparison, GalleryMember
from iad_core.storage.database import Database
from iad_core.storage.models import Sample


class GalleryQuery(AnalysisModel):
    query_id: Identifier
    kind: GalleryKind
    page: int = Field(default=1, ge=1, strict=True)
    page_size: int = Field(default=15, ge=1, le=1000, strict=True)
    search: str = Field(default='', max_length=500)
    order: Literal['recent', 'members'] = 'recent'
    difference_filter: GalleryFilterKind = 'all'
    model_filter: GalleryModelFilter = 'all'


class GalleryReference(AnalysisModel):
    query_id: Identifier
    kind: GalleryKind
    group_id: Identifier
    facts_state: FactState = 'CURRENT'


class GalleryMemberQuery(GalleryReference):
    page: int = Field(default=1, ge=1, strict=True)
    page_size: int = Field(default=20, ge=1, le=1000, strict=True)


class GalleryItem(AnalysisModel):
    group_id: Identifier
    facts_state: FactState
    anchor: GalleryImage
    member_count: Count
    candidate_count: Count
    dataset_count: Count
    pair_count: Count
    difference_types: list[DifferenceType]
    confirmed_conflict: bool
    model_state: ModelAssessmentState


class GalleryFilterCount(AnalysisModel):
    value: GalleryFilterKind
    label: str
    count: Count


class GalleryModelFilterCount(AnalysisModel):
    value: GalleryModelFilter
    label: str
    count: Count


class GalleryPage(AnalysisModel):
    query_id: Identifier
    kind: Literal['conflicts', 'groups']
    filters: list[GalleryFilterCount]
    model_filters: list[GalleryModelFilterCount]
    items: list[GalleryItem]
    total: Count


class GalleryMemberPage(AnalysisModel):
    query_id: Identifier
    group_id: Identifier
    anchor: GalleryImage
    items: list[GalleryMember]
    total: Count


class GalleryQueries:
    """Read image groups from the complete immutable result selection."""

    FILTERS = (
        ('all','全部差异'),
        ('category','标注类别不同'),
        ('geometry','标注位置或范围不同'),
        ('presence','缺少或多出标注'),
        ('instances','实例标注不同'),
        ('multiple','多项差异'),
    )
    MODEL_FILTERS = (('all','全部模型结论'),*MODEL_ASSESSMENT_LABELS.items())

    PAIRS = f'''WITH pairs AS MATERIALIZED (
        SELECT i.position,i.facts_state,i.evidence_available,r.evidence_id,r.result_id,
            json_extract(r.snapshot_json,'$.sources.left') left_source,
            json_extract(r.snapshot_json,'$.sources.right') right_source,
            json_extract(r.snapshot_json,'$.result.annotation.differences') differences,
            annotation_difference_types(json_extract(r.snapshot_json,'$.result.annotation')) difference_types,
            json_extract(r.snapshot_json,'$.result.annotation.confirmed_conflict') confirmed,
            json_extract(r.snapshot_json,'$.result.verification.relation') relation,
            (json_extract(r.snapshot_json,'$.result.annotation.invalid_left')+
                json_extract(r.snapshot_json,'$.result.annotation.invalid_right')>0) annotation_issues,
            json_extract(q.snapshot_json,'$.mode') mode
        FROM consistency_query_items i JOIN consistency_results r ON r.evidence_id=i.evidence_id
        JOIN consistency_queries q ON q.query_id=i.query_id
        WHERE i.query_id=?), edges AS (
        SELECT *,CASE WHEN ?='conflicts' THEN
            json_extract(left_source,'$.sample.sample_id')||'@'||json_extract(left_source,'$.source_sha256')||'@'||COALESCE(json_extract(left_source,'$.scan_ref'),'')
            ELSE COALESCE(CASE WHEN json_extract(left_source,'$.content_group_id')=json_extract(right_source,'$.content_group_id')
                THEN json_extract(left_source,'$.content_group_id') END,result_id) END group_id
        FROM pairs WHERE {ELIGIBLE_PAIR_SQL} AND (?='groups' OR {REVIEW_PAIR_SQL})),
        nodes AS (
            SELECT group_id,facts_state,position,evidence_id,'left' side,left_source source,evidence_available FROM edges
            UNION ALL SELECT group_id,facts_state,position,evidence_id,'right',right_source,evidence_available FROM edges)'''

    def __init__(self, db: Database):
        self.db = db

    @staticmethod
    def analysis_fingerprint(reference: GalleryReference, anchor: GalleryImage, evidence_ids: list[str]) -> str:
        from iad_core.consistency.group_analysis_models import GROUP_ANALYSIS_SCHEMA
        return hashlib.sha256(json.dumps({'schema':GROUP_ANALYSIS_SCHEMA,
            'group':reference.model_dump(include={'kind','group_id','facts_state'}),
            'anchor':{'evidence_id':anchor.evidence_id,'side':anchor.side},'evidence_ids':sorted(set(evidence_ids))},
            sort_keys=True).encode()).hexdigest()

    @staticmethod
    def image(row) -> GalleryImage:
        return GalleryImage(sample=Sample.model_validate(json.loads(row['source'])['sample']),
            evidence_id=row['evidence_id'], side=row['side'], available=bool(row['evidence_available']))

    def query(self, request: GalleryQuery) -> GalleryPage:
        ResultSnapshots(self.db).get(request.query_id)
        args = (request.query_id, request.kind, request.kind, request.search)
        cte = self.PAIRS + "," + """ grouped AS (
            SELECT group_id,facts_state,COUNT(DISTINCT json_extract(source,'$.sample.sample_id')) member_count,
                COUNT(DISTINCT json_extract(source,'$.sample.dataset_id')) dataset_count,MIN(position) position
                FROM nodes GROUP BY group_id,facts_state),
            matching AS (SELECT g.* FROM grouped g WHERE EXISTS (
                SELECT 1 FROM nodes n WHERE n.group_id=g.group_id AND n.facts_state=g.facts_state
                AND instr(lower(json_extract(n.source,'$.sample.relative_path')),lower(?))>0)),
            types AS (SELECT DISTINCT e.group_id,e.facts_state,d.value type
                FROM edges e,json_each(e.difference_types) d),
            anchors AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY group_id,facts_state ORDER BY position,side) rank FROM nodes),
            counts AS (SELECT group_id,facts_state,COUNT(*) pair_count,MAX(confirmed) confirmed FROM edges GROUP BY group_id,facts_state)
            """
        order = 'g.member_count DESC,g.position,g.group_id,g.facts_state' if request.order == 'members' else 'g.position,g.group_id,g.facts_state'
        with self.db.connection() as connection:
            connection.create_function('annotation_difference_types', 1, AnnotationComparison.json_difference_types, deterministic=True)
            rows = connection.execute(cte + """ SELECT g.*,a.source,a.evidence_id,a.side,a.evidence_available,c.pair_count,c.confirmed,
                COALESCE((SELECT json_group_array(type) FROM types t WHERE t.group_id=g.group_id AND t.facts_state=g.facts_state),'[]') difference_types,
                (SELECT json_group_array(e.evidence_id) FROM edges e WHERE e.group_id=g.group_id AND e.facts_state=g.facts_state) evidence_ids
                FROM matching g JOIN anchors a ON a.group_id=g.group_id AND a.facts_state=g.facts_state AND a.rank=1
                JOIN counts c ON c.group_id=g.group_id AND c.facts_state=g.facts_state ORDER BY """ + order, args).fetchall()
        counts, model_counts = Counter(), Counter()
        fingerprints={row['group_id']+'@'+row['facts_state']:self.analysis_fingerprint(
            GalleryReference(query_id=request.query_id,kind=request.kind,group_id=row['group_id'],facts_state=row['facts_state']),
            self.image(row),json.loads(row['evidence_ids'])) for row in rows}
        group_states=GroupAnalysisStates(self.db).read(set(fingerprints.values()))
        selected = []
        for row in rows:
            categories = {ANNOTATION_DIFFERENCE_CATEGORIES[kind] for kind in json.loads(row['difference_types'])}
            category = next(iter(categories)) if len(categories) == 1 else 'multiple' if categories else None
            model_state=group_states.get(fingerprints[row['group_id']+'@'+row['facts_state']],'NOT_ANALYZED')
            category_matches=request.difference_filter in ('all', category)
            model_matches=request.model_filter in ('all',model_state)
            if model_matches:counts[category] += 1
            if category_matches:model_counts[model_state] += 1
            if category_matches and model_matches:
                selected.append((row,model_state))
        total = len(selected)
        rows = selected[(request.page - 1) * request.page_size:request.page * request.page_size]
        filters = [GalleryFilterCount(value=value,label=label,count=sum(counts.values()) if value=='all' else counts[value]) for value,label in self.FILTERS]
        model_filters=[GalleryModelFilterCount(value=value,label=label,count=sum(model_counts.values()) if value=='all' else model_counts[value]) for value,label in self.MODEL_FILTERS]
        return GalleryPage(query_id=request.query_id,kind=request.kind,total=total,filters=filters,model_filters=model_filters,items=[
            GalleryItem(group_id=row['group_id'],facts_state=row['facts_state'],anchor=self.image(row),
                member_count=row['member_count'],candidate_count=row['member_count']-1,dataset_count=row['dataset_count'],
                pair_count=row['pair_count'],difference_types=json.loads(row['difference_types']),confirmed_conflict=bool(row['confirmed']),model_state=model_state) for row,model_state in rows])

    def members(self, request: GalleryMemberQuery) -> GalleryMemberPage:
        ResultSnapshots(self.db).get(request.query_id)
        args = (request.query_id, request.kind, request.kind)
        group_args = (*args, request.group_id, request.facts_state)
        with self.db.connection() as connection:
            connection.create_function('annotation_difference_types', 1, AnnotationComparison.json_difference_types, deterministic=True)
            pairs = connection.execute(self.PAIRS + ' SELECT * FROM edges WHERE group_id=? AND facts_state=? ORDER BY position', group_args).fetchall()
        if not pairs:
            raise ConsistencyError('REFERENCE_NOT_FOUND', 'Image group is outside this result snapshot')
        image, items, total = self._members(pairs, (request.page-1)*request.page_size, request.page*request.page_size)
        return GalleryMemberPage(query_id=request.query_id, group_id=request.group_id, anchor=image, items=items, total=total)

    def freeze(self, reference: GalleryReference) -> tuple[FrozenAnalysisGroup, str]:
        ResultSnapshots(self.db).get(reference.query_id)
        with self.db.connection() as connection:
            connection.create_function('annotation_difference_types',1,AnnotationComparison.json_difference_types,deterministic=True)
            pairs = connection.execute(self.PAIRS+' SELECT * FROM edges WHERE group_id=? AND facts_state=? ORDER BY position',
                (reference.query_id,reference.kind,reference.kind,reference.group_id,reference.facts_state)).fetchall()
        if not pairs:
            raise ConsistencyError('REFERENCE_NOT_FOUND', 'Image group is outside this result snapshot')
        return self._freeze(reference,pairs)

    def freeze_all(self, query_id: str, kind: GalleryKind) -> list[tuple[FrozenAnalysisGroup,str]]:
        ResultSnapshots(self.db).get(query_id)
        with self.db.connection() as connection:
            connection.create_function('annotation_difference_types',1,AnnotationComparison.json_difference_types,deterministic=True)
            pairs = connection.execute(self.PAIRS+' SELECT * FROM edges ORDER BY position', (query_id,kind,kind)).fetchall()
        groups: dict[tuple[str,FactState],list[Row]] = defaultdict(list)
        for pair in pairs:
            groups[pair['group_id'],pair['facts_state']].append(pair)
        return [self._freeze(GalleryReference(query_id=query_id,kind=kind,group_id=group_id,facts_state=state),members)
            for (group_id,state),members in groups.items()]

    def _freeze(self, reference: GalleryReference, pairs: Sequence[Row]) -> tuple[FrozenAnalysisGroup,str]:
        image, members, _ = self._members(pairs)
        group = FrozenAnalysisGroup(kind=reference.kind,group_id=reference.group_id,facts_state=reference.facts_state,
            anchor=image,members=members)
        return group,self.analysis_fingerprint(reference,image,[pair['evidence_id'] for pair in pairs])

    def _members(self, pairs: Sequence[Row], start: int = 0, stop: int | None = None) -> tuple[GalleryImage,list[GalleryMember],int]:
        sources = {}
        for pair in pairs:
            for side in ('left','right'):
                source = pair[side+'_source']
                identity = json.loads(source)['sample']['sample_id']
                sources.setdefault(identity, dict(source=source,side=side,evidence_id=pair['evidence_id'],evidence_available=pair['evidence_available']))
        anchor = next(iter(sources.values()))
        image = self.image(anchor)
        direct = {}
        for pair in pairs:
            anchor_side = 'left' if pair['left_source']==anchor['source'] else 'right' if pair['right_source']==anchor['source'] else None
            if anchor_side is None:
                continue
            side = 'right' if anchor_side=='left' else 'left'
            source = pair[side+'_source']
            identity = json.loads(source)['sample']['sample_id']
            direct.setdefault(identity, (dict(source=source,side=side,evidence_id=pair['evidence_id'],evidence_available=pair['evidence_available']),
                GalleryComparison(evidence_id=pair['evidence_id'],result_id=pair['result_id'],anchor_side=anchor_side)))
        identities = sorted(set(sources)-{image.sample_id})
        items = []
        for identity in identities[start:stop]:
            source, comparison = direct.get(identity,(sources[identity],None))
            items.append(GalleryMember(image=self.image(source),comparison=comparison))
        return image,items,len(identities)
