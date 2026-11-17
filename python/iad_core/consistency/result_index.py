import json
from pathlib import PurePosixPath
from sqlite3 import Connection, Row
from collections.abc import Callable

from iad_core.consistency.agent_result_models import AnchorImageItem, AnchorImagePage, AnchorImageQuery
from iad_core.consistency.gallery import GalleryItem
from iad_core.consistency.gallery_statistics import GalleryStatisticFact, GalleryStatistics


class ConsistencyResultIndex:
    """Rebuildable projections; source-table triggers invalidate changed anchors atomically."""

    VERSION = 3

    def __init__(self, connection: Connection, run_id: str, *, errors: list[dict] = ()):
        self.connection, self.run_id = connection, run_id
        self.errors = {error['sample_id']: error.get('code') for error in errors}

    def current(self) -> bool:
        return self.connection.execute('''SELECT 1 FROM consistency_anchor_runs a
            LEFT JOIN consistency_result_index i ON i.job_id=a.job_id AND i.anchor_id=a.anchor_id
            WHERE a.job_id=? AND (i.anchor_id IS NULL OR i.projection_version<>?) LIMIT 1''', (self.run_id, self.VERSION)).fetchone() is None

    def refresh(self, project: Callable[[Row], tuple[AnchorImageItem, GalleryItem | None]]) -> int:
        rows = self.connection.execute('''SELECT a.* FROM consistency_anchor_runs a
            LEFT JOIN consistency_result_index i ON i.job_id=a.job_id AND i.anchor_id=a.anchor_id
            WHERE a.job_id=? AND (i.anchor_id IS NULL OR i.projection_version<>?) ORDER BY a.ordinal''', (self.run_id, self.VERSION)).fetchall()
        for row in rows:
            image, gallery = project(row)
            summary = image.summary
            self.connection.execute('''INSERT OR REPLACE INTO consistency_result_index(job_id,anchor_id,ordinal,filename,
                reason,program_conclusion,model_conclusion,agreement,review_state,categories_json,image_json,gallery_json,projection_version)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)''', (self.run_id, row['anchor_id'], row['ordinal'],
                PurePosixPath(image.image.sample.relative_path if image.image else image.sample.sample_id.split(':', 1)[1]).name,
                summary.reason, summary.program_conclusion, image.model_filter, image.agreement, image.review_state,
                json.dumps(gallery.conflict_categories if gallery else [], ensure_ascii=False),
                image.model_dump_json(), gallery.model_dump_json() if gallery else None, self.VERSION))

        return len(rows)

    def images(self, query: AnchorImageQuery, page: int, page_size: int) -> AnchorImagePage:
        clauses, args = ['i.job_id=?'], [self.run_id]
        if query.group == 'PROGRAM_CONSISTENT':
            clauses.append("program_conclusion='一致'")
        elif query.group in ('NO_CANDIDATES', 'NO_ELIGIBLE_CANDIDATES'):
            clauses.append('reason=?'); args.append(query.group)
        elif query.group != 'images':
            clauses.append('EXISTS(SELECT 1 FROM json_each(categories_json) WHERE value=?)'); args.append(query.group)
        if query.search.strip():
            clauses.append('instr(lower(filename),lower(?))>0'); args.append(query.search.strip())
        for name in ('model', 'agreement', 'review'):
            value = getattr(query, name)
            if value != 'all':
                column = {'model': 'model_conclusion', 'review': 'review_state', 'agreement': 'agreement'}[name]
                clauses.append(column + '=?'); args.append(value)
        where = ' AND '.join(clauses)
        total = self.connection.execute('SELECT count(*) FROM consistency_result_index i WHERE ' + where, args).fetchone()[0]
        rows = self.connection.execute('''SELECT i.image_json,a.state,a.phase,a.attempt,j.status job_status
            FROM consistency_result_index i JOIN consistency_anchor_runs a USING(job_id,anchor_id)
            JOIN job_runs j ON j.job_id=i.job_id WHERE ''' + where +
            ' ORDER BY i.ordinal LIMIT ? OFFSET ?', (*args, page_size, (page - 1) * page_size))
        items = []
        for row in rows:
            image = AnchorImageItem.model_validate_json(row['image_json'])
            state = row['job_status'] if row['state'] in ('PENDING', 'RUNNING') and row['job_status'] in (
                'CANCELLED', 'INTERRUPTED') else row['state']
            image.summary = image.summary.with_progress(state, row['phase'], row['attempt'],
                self.errors.get(image.summary.anchor_id))
            items.append(image)
        return AnchorImagePage(job_id=self.run_id, total=total,
            items=items, counts=self.counts())

    def counts(self):
        rows = self.connection.execute('''SELECT reason,program_conclusion,count(*) n FROM consistency_result_index
            WHERE job_id=? GROUP BY reason,program_conclusion''', (self.run_id,)).fetchall()
        counts = {'images': sum(row['n'] for row in rows), 'NO_CANDIDATES': 0,
            'NO_ELIGIBLE_CANDIDATES': 0, 'PROGRAM_CONSISTENT': 0}
        for row in rows:
            if row['reason'] in ('NO_CANDIDATES', 'NO_ELIGIBLE_CANDIDATES'):
                counts[row['reason']] += row['n']
            if row['program_conclusion'] == '一致':
                counts['PROGRAM_CONSISTENT'] += row['n']
        counts.update({row[0]: row[1] for row in self.connection.execute('''SELECT category.value,count(*)
            FROM consistency_result_index,json_each(categories_json) category WHERE job_id=? GROUP BY category.value''', (self.run_id,))})
        return counts

    def gallery(self, page, page_size):
        rows = self.connection.execute('''SELECT gallery_json FROM consistency_result_index
            WHERE job_id=? AND gallery_json IS NOT NULL ORDER BY ordinal LIMIT ? OFFSET ?''',
            (self.run_id, page_size, (page - 1) * page_size))
        return [GalleryItem.model_validate_json(row[0]) for row in rows]

    def statistics(self):
        rows = self.connection.execute('''SELECT json_object('group_id',anchor_id,
            'facts_state',json_extract(gallery_json,'$.facts_state'),
            'conflict_categories',json_extract(gallery_json,'$.conflict_categories'),
            'model_categories',json_extract(gallery_json,'$.model_categories'),
            'model_state',json_extract(gallery_json,'$.model_state'),
            'model_conclusion',json_extract(gallery_json,'$.model_conclusion'),
            'annotation_conclusion',json_extract(gallery_json,'$.annotation_conclusion'))
            FROM consistency_result_index WHERE job_id=? AND gallery_json IS NOT NULL''', (self.run_id,))
        return GalleryStatistics.capture(GalleryStatisticFact.model_validate_json(row[0]) for row in rows)
