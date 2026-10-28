import hashlib
import json
from contextlib import nullcontext
from datetime import datetime, timezone
from sqlite3 import Connection
from typing import Optional,Sequence

from pydantic import TypeAdapter, ValidationError

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import (ConsistencyScopesSnapshot, FilteredScope, FrozenScope,
    DatasetScope, FrozenSample, SampleScope, ScanReference, ScopeSelector)
from iad_core.storage.database import Database
from iad_core.workbench.query import SampleQuery, WorkbenchQuery


selector_adapter = TypeAdapter(ScopeSelector)


class ConsistencyScopes:
    def __init__(self, db: Database):
        self.db = db

    def freeze(self, subjects: ScopeSelector, corpus: ScopeSelector, connection: Optional[Connection] = None) -> ConsistencyScopesSnapshot:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if not conn.in_transaction:conn.execute('BEGIN')
            frozen_corpus = self.resolve(corpus, conn)
            if frozen_corpus.selector.kind not in ('all_registered', 'datasets'):
                raise ConsistencyError('INVALID_SCOPE', 'The corpus must use registered datasets')
            if frozen_corpus.selector.kind=='all_registered' and frozen_corpus.dataset_ids:
                frozen_corpus=self.resolve(DatasetScope(dataset_ids=frozen_corpus.dataset_ids),conn)
            return ConsistencyScopesSnapshot(subjects=self.resolve(subjects, conn), corpus=frozen_corpus)

    def assert_current(self, scope: FrozenScope, connection: Optional[Connection] = None) -> None:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if connection is None:conn.execute('BEGIN')
            self.assert_scans(scope,conn)
            self.assert_samples(scope.samples,conn)

    def assert_scans(self,scope: FrozenScope,connection: Connection) -> None:
        scans={row[0]:row[1] for row in connection.execute('SELECT dataset_id,scan_ref FROM datasets')}
        if any(scans.get(scan.dataset_id)!=scan.scan_ref for scan in scope.scans):
            raise ConsistencyError('SOURCE_UNAVAILABLE','Frozen dataset scan changed; start a new batch')

    def assert_samples(self,samples: Sequence[FrozenSample],connection: Connection) -> None:
        expected={sample.sample_id:sample for sample in samples}
        fields=','.join(FrozenSample.model_fields)
        rows=connection.execute(f'''SELECT {fields},is_excluded FROM samples
            WHERE sample_id IN (SELECT value FROM json_each(?))''',(json.dumps(list(expected)),)).fetchall()
        current={row['sample_id']:FrozenSample.model_validate({name:row[name] for name in FrozenSample.model_fields}) for row in rows if not row['is_excluded']}
        if current!=expected:raise ConsistencyError('SOURCE_UNAVAILABLE','Frozen sample facts changed; start a new batch')

    def resolve(self, selector: ScopeSelector | dict, connection: Optional[Connection] = None) -> FrozenScope:
        try:
            selector = selector_adapter.validate_python(selector)
        except ValidationError as error:
            raise ConsistencyError('INVALID_SCOPE', str(error)) from error
        if selector.kind=='datasets':
            selector=selector.model_copy(update={'dataset_ids':sorted(selector.dataset_ids)})
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if connection is None:
                conn.execute('BEGIN')
            registered = {row['dataset_id']: row['scan_ref'] for row in
                conn.execute('SELECT dataset_id,scan_ref FROM datasets ORDER BY dataset_id')}
            if selector.kind == 'all_registered':
                dataset_ids = list(registered)
            elif selector.kind == 'datasets':
                dataset_ids = selector.dataset_ids
            elif isinstance(selector, FilteredScope):
                dataset_ids = [selector.dataset_id]
            else:
                rows = conn.execute('SELECT sample_id,dataset_id,is_excluded FROM samples WHERE sample_id IN (SELECT value FROM json_each(?))',
                    (json.dumps(selector.sample_ids),)).fetchall()
                if len(rows) != len(selector.sample_ids):
                    raise ConsistencyError('REFERENCE_NOT_FOUND', 'One or more samples do not exist')
                if any(row['is_excluded'] for row in rows):
                    raise ConsistencyError('INVALID_SCOPE', 'Excluded samples cannot enter the check scope')
                dataset_ids = sorted({row['dataset_id'] for row in rows})
            if any(dataset_id not in registered for dataset_id in dataset_ids):
                raise ConsistencyError('REFERENCE_NOT_FOUND', 'One or more datasets are not registered')
            source_rows = conn.execute('''SELECT sample_id,dataset_id,task_id,source_fingerprint,
                quality_status,quality_source,is_excluded,updated_at FROM samples
                WHERE dataset_id IN (SELECT value FROM json_each(?)) ORDER BY sample_id''',
                (json.dumps(dataset_ids),)).fetchall()
            selected_ids = None
            if isinstance(selector, FilteredScope):
                query = SampleQuery(dataset_id=selector.dataset_id, **selector.filters.model_dump())
                selected_ids = set(WorkbenchQuery(self.db).matching_ids(query, connection=conn))
            elif isinstance(selector, SampleScope):
                selected_ids = set(selector.sample_ids)
            samples = [FrozenSample.model_validate({key: row[key] for key in FrozenSample.model_fields})
                for row in source_rows if not row['is_excluded'] and (selected_ids is None or row['sample_id'] in selected_ids)]
            scans = [ScanReference(dataset_id=dataset_id, scan_ref=registered[dataset_id]) for dataset_id in dataset_ids]
            content = {'selector': selector.model_dump(mode='json'), 'dataset_ids': dataset_ids,
                'samples': [sample.model_dump(mode='json') for sample in samples],
                'scans': [scan.model_dump() for scan in scans]}
            scope_id = 'scope_' + hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()
            return FrozenScope(**content, scope_id=scope_id, sample_count=len(samples), frozen_at=datetime.now(timezone.utc))
