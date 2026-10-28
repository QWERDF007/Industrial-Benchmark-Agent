import base64
import hashlib
import json

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import EvidenceSourceStates
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.consistency.result_models import ConsistencyQuery,ResultCursor,ResultPage,ResultSummary
from iad_core.consistency.result_snapshot import ResultSnapshots
from iad_core.storage.database import Database


class ResultQueries:
    def __init__(self,db: Database):self.db=db

    def query(self,request: ConsistencyQuery) -> ResultPage:
        request=ConsistencyQuery.model_validate(request)
        fingerprint=hashlib.sha256(json.dumps(request.model_dump(mode='json',exclude={'cursor'}),sort_keys=True).encode()).hexdigest()
        after=0
        if request.cursor:
            try:
                cursor=ResultCursor.model_validate_json(base64.b64decode(request.cursor+'='*(-len(request.cursor)%4),altchars=b'-_',validate=True))
            except ValueError as error:raise ConsistencyError('INVALID_SCOPE','Invalid consistency result cursor') from error
            if cursor.query_hash!=fingerprint:raise ConsistencyError('INVALID_SCOPE','Result cursor belongs to a different query')
            snapshot=ResultSnapshots(self.db).get(cursor.query_id)
            if snapshot.query_hash!=fingerprint:raise ConsistencyError('INVALID_SCOPE','Result cursor belongs to a different query')
            after=cursor.after
        else:snapshot=ResultSnapshots(self.db).create(request,fingerprint)
        with self.db.connection() as connection:
            rows=connection.execute('''SELECT position,evidence_id,facts_state,source_states_json,evidence_available
                FROM consistency_query_items WHERE query_id=? AND position>? ORDER BY position LIMIT ?''',
                (snapshot.query_id,after,request.page_size+1)).fetchall()
        items=[];selected=rows[:request.page_size]
        for row in selected:
            saved=ConsistencyRepository(self.db).get(row['evidence_id'])
            items.append(ResultSummary(sample_a=saved.parameters.sample_a,sample_b=saved.parameters.sample_b,result=saved.result,
                checked_at=saved.checked_at,facts_state=row['facts_state'],source_states=EvidenceSourceStates.model_validate_json(row['source_states_json']),evidence_available=bool(row['evidence_available'])))
        next_cursor=None
        if len(rows)>request.page_size:
            next_cursor=base64.urlsafe_b64encode(ResultCursor(query_id=snapshot.query_id,query_hash=fingerprint,after=selected[-1]['position']).model_dump_json().encode()).decode().rstrip('=')
        return ResultPage(query_id=snapshot.query_id,scopes=snapshot.scopes,observed_at=snapshot.observed_at,facts=snapshot.facts,items=items,total=snapshot.total,next_cursor=next_cursor,
            execution=snapshot.execution,corpus=snapshot.corpus,mode=snapshot.mode,profile_id=snapshot.profile_id,retrieval_completeness=snapshot.retrieval_completeness)
