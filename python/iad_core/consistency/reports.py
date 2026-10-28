from iad_core.consistency.result_models import ConsistencyQuery,ConsistencyReport
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.result_snapshot import ResultSnapshots
from iad_core.storage.database import Database


class ConsistencyReports:
    def __init__(self,db: Database):self.db=db

    def report(self,request: ConsistencyQuery) -> ConsistencyReport:
        page=ResultQueries(self.db).query(request)
        snapshot=ResultSnapshots(self.db).get(page.query_id)
        return ConsistencyReport(page=page,statistics=snapshot.statistics,gold=snapshot.gold,
            pending_review=snapshot.statistics.current.pending_review,
            pending_correction=snapshot.statistics.current.pending_correction)
