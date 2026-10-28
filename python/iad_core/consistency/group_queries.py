from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import Count,Identifier
from iad_core.consistency.result_models import FactState
from iad_core.consistency.result_snapshot import ResultSnapshots
from iad_core.storage.database import Database


class GroupQuery(AnalysisModel):
    query_id: Identifier
    page: int = Field(default=1,ge=1,strict=True)
    page_size: int = Field(default=20,ge=1,le=100,strict=True)


class GroupMemberQuery(GroupQuery):
    group_id: Identifier
    facts_state: FactState = 'CURRENT'


class StrictGroup(AnalysisModel):
    group_id: Identifier
    facts_state: FactState
    member_count: Count
    dataset_count: Count
    pair_count: Count


class StrictGroupPage(AnalysisModel):
    query_id: Identifier
    items: list[StrictGroup]
    total: Count


class GroupMember(AnalysisModel):
    sample_id: Identifier
    dataset_id: Identifier
    relative_path: str
    evidence_id: Identifier


class GroupMemberPage(AnalysisModel):
    query_id: Identifier
    group_id: Identifier
    facts_state: FactState
    items: list[GroupMember]
    total: Count


class GroupQueries:
    EDGES='''WITH edges AS (
        SELECT COALESCE(CASE WHEN json_extract(r.snapshot_json,'$.sources.left.content_group_id')=json_extract(r.snapshot_json,'$.sources.right.content_group_id')
            THEN json_extract(r.snapshot_json,'$.sources.left.content_group_id') END,r.result_id) group_id,i.facts_state,r.evidence_id,
            json_extract(r.snapshot_json,'$.sources.left.sample') sample_a,json_extract(r.snapshot_json,'$.sources.right.sample') sample_b
        FROM consistency_query_items i JOIN consistency_results r ON r.evidence_id=i.evidence_id WHERE i.query_id=?
            AND json_extract(r.snapshot_json,'$.result.verification.relation')='EXACT'),
        members AS (
        SELECT group_id,facts_state,evidence_id,sample_a sample FROM edges UNION ALL
        SELECT group_id,facts_state,evidence_id,sample_b sample FROM edges)'''

    def __init__(self,db: Database):self.db=db

    def query(self,request: GroupQuery) -> StrictGroupPage:
        ResultSnapshots(self.db).get(request.query_id)
        with self.db.connection() as connection:
            total=connection.execute(self.EDGES+' SELECT COUNT(*) FROM (SELECT group_id,facts_state FROM edges GROUP BY group_id,facts_state)',(request.query_id,)).fetchone()[0]
            rows=connection.execute(self.EDGES+''' SELECT m.group_id,m.facts_state,
                COUNT(DISTINCT json_extract(m.sample,'$.sample_id')) member_count,
                COUNT(DISTINCT json_extract(m.sample,'$.dataset_id')) dataset_count,
                (SELECT COUNT(*) FROM edges e WHERE e.group_id=m.group_id AND e.facts_state=m.facts_state) pair_count
                FROM members m GROUP BY m.group_id,m.facts_state ORDER BY m.group_id,m.facts_state LIMIT ? OFFSET ?''',
                (request.query_id,request.page_size,(request.page-1)*request.page_size)).fetchall()
        return StrictGroupPage(query_id=request.query_id,items=[StrictGroup(**dict(row)) for row in rows],total=total)

    def members(self,request: GroupMemberQuery) -> GroupMemberPage:
        ResultSnapshots(self.db).get(request.query_id)
        with self.db.connection() as connection:
            source=self.EDGES+''' SELECT json_extract(sample,'$.sample_id') sample_id,json_extract(sample,'$.dataset_id') dataset_id,
                json_extract(sample,'$.relative_path') relative_path,MIN(evidence_id) evidence_id FROM members
                WHERE group_id=? AND facts_state=? GROUP BY sample_id'''
            args=(request.query_id,request.group_id,request.facts_state)
            total=connection.execute('SELECT COUNT(*) FROM ('+source+')',args).fetchone()[0]
            if not total:raise ConsistencyError('REFERENCE_NOT_FOUND','Strict group is outside this result snapshot')
            rows=connection.execute(source+' ORDER BY sample_id LIMIT ? OFFSET ?',(*args,request.page_size,(request.page-1)*request.page_size)).fetchall()
        return GroupMemberPage(query_id=request.query_id,group_id=request.group_id,facts_state=request.facts_state,items=[GroupMember(**dict(row)) for row in rows],total=total)
