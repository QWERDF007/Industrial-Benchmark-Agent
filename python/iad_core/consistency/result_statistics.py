from sqlite3 import Connection

from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.consistency.result_models import ReportStatistics
from iad_core.consistency.review_models import DifferenceReview


class ResultStatistics:
    def __init__(self,connection: Connection):
        self.connection=connection
        for name in ('groups','members','differences','quality','regions','policy','pending_review','pending_correction'):
            connection.execute(f'CREATE TEMP TABLE stats_{name}(state TEXT,identity TEXT,PRIMARY KEY(state,identity))')
        self.statistics=ReportStatistics()

    def add(self,saved: FrozenEvidence,state: str,available: bool,review: list[DifferenceReview]):
        values=getattr(self.statistics,state.lower())
        values.pairs+=1
        values.invalid_annotation_pairs+=saved.result.annotation.status!='COMPLETE'
        values.unavailable_evidence_pairs+=not available
        if saved.result.verification.relation=='EXACT':
            sources=(saved.sources.left,saved.sources.right)
            identity=sources[0].content_group_id if sources[0].content_group_id and sources[0].content_group_id==sources[1].content_group_id else saved.result.result_id
            self.connection.execute('INSERT OR IGNORE INTO stats_groups VALUES(?,?)',(state,identity))
            self.connection.executemany('INSERT OR IGNORE INTO stats_members VALUES(?,?)',[(state,source.sample.sample_id) for source in sources])
        for difference in saved.result.annotation.differences:
            self.connection.execute('INSERT OR IGNORE INTO stats_differences VALUES(?,?)',(state,difference.difference_id))
            if difference.type=='QUALITY_LABEL' and difference.confirmed_conflict:
                self.connection.execute('INSERT OR IGNORE INTO stats_quality VALUES(?,?)',(state,difference.difference_id))
            if difference.type in ('CATEGORY','ONE_SIDED_REGION','GEOMETRY','SPLIT_MERGE','AMBIGUOUS_MATCH'):
                self.connection.execute('INSERT OR IGNORE INTO stats_regions VALUES(?,?)',(state,difference.difference_id))
            if difference.policy_relation=='UNKNOWN':
                self.connection.execute('INSERT OR IGNORE INTO stats_policy VALUES(?,?)',(state,difference.difference_id))
        for status in review:
            if status.review_state != 'RESOLVED':
                self.connection.execute('INSERT OR IGNORE INTO stats_pending_review VALUES(?,?)',(state,status.difference_id))
            if status.correction_state in ('PROPOSED','AWAITING_RESCAN'):
                self.connection.execute('INSERT OR IGNORE INTO stats_pending_correction VALUES(?,?)',(state,status.difference_id))

    def finish(self) -> ReportStatistics:
        mapping={'groups':'strict_groups','members':'strict_members','differences':'differences','quality':'confirmed_quality_conflicts','regions':'regional_differences','policy':'policy_unknown','pending_review':'pending_review','pending_correction':'pending_correction'}
        for name,field in mapping.items():
            for state,count in self.connection.execute(f'SELECT state,COUNT(*) FROM stats_{name} GROUP BY state'):
                setattr(getattr(self.statistics,state.lower()),field,count)
        return ReportStatistics.model_validate(self.statistics.model_dump())
