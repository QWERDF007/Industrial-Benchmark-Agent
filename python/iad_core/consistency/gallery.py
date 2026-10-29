import json
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import Count, DifferenceType, GalleryFilterKind, Identifier
from iad_core.consistency.result_models import FactState
from iad_core.consistency.result_snapshot import ResultSnapshots
from iad_core.storage.database import Database
from iad_core.storage.models import Sample


class GalleryQuery(AnalysisModel):
    query_id: Identifier
    kind: Literal['conflicts', 'groups']
    page: int = Field(default=1, ge=1, strict=True)
    page_size: int = Field(default=15, ge=1, le=100, strict=True)
    search: str = Field(default='', max_length=500)
    order: Literal['recent', 'members'] = 'recent'
    difference_filter: GalleryFilterKind = 'all'


class GalleryReference(AnalysisModel):
    query_id: Identifier
    kind: Literal['conflicts', 'groups']
    group_id: Identifier
    facts_state: FactState = 'CURRENT'


class GalleryMemberQuery(GalleryReference):
    page: int = Field(default=1, ge=1, strict=True)
    page_size: int = Field(default=20, ge=1, le=100, strict=True)


class GalleryImage(AnalysisModel):
    sample: Sample
    evidence_id: Identifier
    side: Literal['left', 'right']
    available: bool

    @property
    def sample_id(self) -> str:
        return self.sample.sample_id


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


class GalleryFilterCount(AnalysisModel):
    value: GalleryFilterKind
    label: str
    count: Count


class GalleryPage(AnalysisModel):
    query_id: Identifier
    kind: Literal['conflicts', 'groups']
    filters: list[GalleryFilterCount]
    items: list[GalleryItem]
    total: Count


class GalleryComparison(AnalysisModel):
    evidence_id: Identifier
    result_id: Identifier
    anchor_side: Literal['left', 'right']


class GalleryMember(AnalysisModel):
    image: GalleryImage
    comparison: GalleryComparison | None


class GalleryMemberPage(AnalysisModel):
    query_id: Identifier
    group_id: Identifier
    anchor: GalleryImage
    items: list[GalleryMember]
    total: Count


class GalleryQueries:
    """Read image groups from the complete immutable result selection."""

    FILTERS = (
        ('all','全部',()),
        ('annotation','标注差异',('CATEGORY','ONE_SIDED_REGION','GEOMETRY','SPLIT_MERGE','AMBIGUOUS_MATCH')),
        ('quality','质量差异',('QUALITY_LABEL',)),
        ('policy','规范差异',('POLICY_UNCONFIRMED',)),
        ('unavailable','待补依据',('ANNOTATION_UNREADABLE','POLICY_UNCONFIRMED')),
    )

    PAIRS = '''WITH pairs AS MATERIALIZED (
        SELECT i.position,i.facts_state,i.evidence_available,r.evidence_id,r.result_id,
            json_extract(r.snapshot_json,'$.sources.left') left_source,
            json_extract(r.snapshot_json,'$.sources.right') right_source,
            json_extract(r.snapshot_json,'$.result.annotation.differences') differences,
            json_extract(r.snapshot_json,'$.result.annotation.confirmed_conflict') confirmed,
            json_extract(r.snapshot_json,'$.result.verification.relation') relation
        FROM consistency_query_items i JOIN consistency_results r ON r.evidence_id=i.evidence_id
        WHERE i.query_id=?), edges AS (
        SELECT *,CASE WHEN ?='conflicts' THEN
            json_extract(left_source,'$.sample.sample_id')||'@'||json_extract(left_source,'$.source_sha256')||'@'||COALESCE(json_extract(left_source,'$.scan_ref'),'')
            ELSE COALESCE(CASE WHEN json_extract(left_source,'$.content_group_id')=json_extract(right_source,'$.content_group_id')
                THEN json_extract(left_source,'$.content_group_id') END,result_id) END group_id
        FROM pairs WHERE ?='conflicts' OR relation='EXACT'),
        nodes AS (
            SELECT group_id,facts_state,position,evidence_id,'left' side,left_source source,evidence_available FROM edges
            UNION ALL SELECT group_id,facts_state,position,evidence_id,'right',right_source,evidence_available FROM edges)'''

    def __init__(self, db: Database):
        self.db = db

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
            types AS (SELECT DISTINCT e.group_id,e.facts_state,json_extract(d.value,'$.type') type
                FROM edges e,json_each(e.differences) d),
            anchors AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY group_id,facts_state ORDER BY position,side) rank FROM nodes),
            counts AS (SELECT group_id,facts_state,COUNT(*) pair_count,MAX(confirmed) confirmed FROM edges GROUP BY group_id,facts_state)
            """
        selected_types = next(types for value, _, types in self.FILTERS if value == request.difference_filter)
        selected = '' if request.difference_filter == 'all' else """ WHERE EXISTS (SELECT 1 FROM types t
            WHERE t.group_id=g.group_id AND t.facts_state=g.facts_state AND t.type IN (SELECT value FROM json_each(?)))"""
        selected_args = args if not selected else (*args, json.dumps(selected_types))
        order = 'g.member_count DESC,g.position,g.group_id,g.facts_state' if request.order == 'members' else 'g.position,g.group_id,g.facts_state'
        with self.db.connection() as connection:
            total = connection.execute(cte + ' SELECT COUNT(*) FROM matching g' + selected, selected_args).fetchone()[0]
            rows = connection.execute(cte + """ SELECT g.*,a.source,a.evidence_id,a.side,a.evidence_available,c.pair_count,c.confirmed,
                COALESCE((SELECT json_group_array(type) FROM types t WHERE t.group_id=g.group_id AND t.facts_state=g.facts_state),'[]') difference_types
                FROM matching g JOIN anchors a ON a.group_id=g.group_id AND a.facts_state=g.facts_state AND a.rank=1
                JOIN counts c ON c.group_id=g.group_id AND c.facts_state=g.facts_state""" + selected + ' ORDER BY ' + order + ' LIMIT ? OFFSET ?',
                (*selected_args, request.page_size, (request.page - 1) * request.page_size)).fetchall()
            all_count = connection.execute(cte + ' SELECT COUNT(*) FROM matching', args).fetchone()[0]
            type_rows = connection.execute(cte + """ SELECT t.* FROM types t JOIN matching g
                ON t.group_id=g.group_id AND t.facts_state=g.facts_state""", args).fetchall()
        filters = [GalleryFilterCount(value=value,label=label,count=all_count if value=='all' else
            len({(row['group_id'],row['facts_state']) for row in type_rows if row['type'] in types})) for value,label,types in self.FILTERS]
        return GalleryPage(query_id=request.query_id,kind=request.kind,total=total,filters=filters,items=[
            GalleryItem(group_id=row['group_id'],facts_state=row['facts_state'],anchor=self.image(row),
                member_count=row['member_count'],candidate_count=row['member_count']-1,dataset_count=row['dataset_count'],
                pair_count=row['pair_count'],difference_types=json.loads(row['difference_types']),confirmed_conflict=bool(row['confirmed'])) for row in rows])

    def members(self, request: GalleryMemberQuery) -> GalleryMemberPage:
        ResultSnapshots(self.db).get(request.query_id)
        args = (request.query_id, request.kind, request.kind)
        group_args = (*args, request.group_id, request.facts_state)
        with self.db.connection() as connection:
            anchor = connection.execute(self.PAIRS + ''' SELECT * FROM nodes WHERE group_id=? AND facts_state=?
                ORDER BY position,side LIMIT 1''', group_args).fetchone()
            if anchor is None:
                raise ConsistencyError('REFERENCE_NOT_FOUND', 'Image group is outside this result snapshot')
            image = self.image(anchor)
            candidates = ''' SELECT json_extract(source,'$.sample.sample_id') sample_id FROM nodes
                WHERE group_id=? AND facts_state=? AND json_extract(source,'$.sample.sample_id')<>? GROUP BY sample_id'''
            total = connection.execute(self.PAIRS + ' SELECT COUNT(*) FROM (' + candidates + ')', (*group_args, image.sample_id)).fetchone()[0]
            rows = connection.execute(self.PAIRS + candidates + ' ORDER BY sample_id LIMIT ? OFFSET ?',
                (*group_args, image.sample_id, request.page_size, (request.page - 1) * request.page_size)).fetchall()
            items = []
            for candidate in rows:
                identity = candidate['sample_id']
                pair = connection.execute(self.PAIRS + ''' SELECT * FROM edges WHERE group_id=? AND facts_state=? AND (
                    (left_source=? AND json_extract(right_source,'$.sample.sample_id')=?) OR
                    (right_source=? AND json_extract(left_source,'$.sample.sample_id')=?)) ORDER BY position LIMIT 1''',
                    (*group_args, anchor['source'], identity, anchor['source'], identity)).fetchone()
                comparison = None
                if pair is not None:
                    anchor_side = 'left' if pair['left_source'] == anchor['source'] else 'right'
                    side = 'right' if anchor_side == 'left' else 'left'
                    source = dict(source=pair[side + '_source'], side=side, evidence_id=pair['evidence_id'], evidence_available=pair['evidence_available'])
                    comparison = GalleryComparison(evidence_id=pair['evidence_id'], result_id=pair['result_id'], anchor_side=anchor_side)
                else:
                    source = connection.execute(self.PAIRS + ''' SELECT * FROM nodes WHERE group_id=? AND facts_state=?
                        AND json_extract(source,'$.sample.sample_id')=? ORDER BY position,side LIMIT 1''', (*group_args, identity)).fetchone()
                items.append(GalleryMember(image=self.image(source), comparison=comparison))
        return GalleryMemberPage(query_id=request.query_id, group_id=request.group_id, anchor=image, items=items, total=total)
