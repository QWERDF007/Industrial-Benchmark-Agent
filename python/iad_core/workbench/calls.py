import json
import time
import uuid
import zlib
from contextlib import contextmanager,nullcontext
from contextvars import ContextVar
from datetime import datetime, timezone
from sqlite3 import Connection
from typing import Any, List, Literal, Optional, Tuple

import httpx

from iad_core.advisory.analysis import AnalysisModel
from iad_core.storage.database import Database


class ModelCallError(AnalysisModel):
    type: str
    message: str


class ModelCallSummary(AnalysisModel):
    call_id: str
    run_id: str
    operation: Literal['tokenize', 'generate']
    schema_name: str
    phase: Optional[str]
    sample_id: Optional[str]
    started_at: str
    finished_at: Optional[str] = None
    elapsed_ms: Optional[float] = None
    http_status: Optional[int] = None
    response_id: Optional[str] = None
    response_model: Optional[str] = None
    finish_reason: Optional[str] = None
    usage: Optional[dict[str, Any]] = None
    error: Optional[ModelCallError] = None


class ModelCallDetail(ModelCallSummary):
    request_body: str
    response_body: Optional[str]


_active: ContextVar[Optional[Tuple['ModelCalls', str]]] = ContextVar('iad_model_calls', default=None)


class ModelCalls:
    def __init__(self, db: Database):
        self.db = db

    @contextmanager
    def bind(self, run_id: str):
        token = _active.set((self, run_id))
        try:
            yield
        finally:
            _active.reset(token)

    @staticmethod
    @contextmanager
    def exchange(client: httpx.Client, request: httpx.Request, operation: Literal['tokenize', 'generate'], schema_name: str):
        binding = _active.get()
        if binding is None:
            yield client.send(request)
            return
        repository, run_id = binding
        with repository.db.connection() as conn:
            payload = json.loads(conn.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0])
            summary = ModelCallSummary(call_id='call_' + uuid.uuid4().hex, run_id=run_id, operation=operation,
                schema_name=schema_name, phase=payload.get('phase'), sample_id=payload.get('current_sample_id'),
                started_at=datetime.now(timezone.utc).isoformat())
            conn.execute('INSERT INTO model_calls(call_id,run_id,summary_json,request_body) VALUES(?,?,?,?)',
                         (summary.call_id, run_id, summary.model_dump_json(), zlib.compress(request.content)))
        response = None
        started = time.perf_counter()
        try:
            response = client.send(request)
            yield response
        except Exception as error:
            summary.error = ModelCallError(type=type(error).__name__, message=str(error))
            raise
        finally:
            summary.finished_at = datetime.now(timezone.utc).isoformat()
            summary.elapsed_ms = (time.perf_counter() - started) * 1000
            if response is not None:
                summary.http_status = response.status_code
                try:
                    body = response.json()
                except (ValueError, UnicodeError):
                    body = None
                if isinstance(body, dict):
                    summary.response_id = body.get('id') if isinstance(body.get('id'), str) else None
                    summary.response_model = body.get('model') if isinstance(body.get('model'), str) else None
                    summary.usage = body.get('usage') if isinstance(body.get('usage'), dict) else None
                    choices = body.get('choices')
                    if isinstance(choices, list) and choices and isinstance(choices[0], dict):
                        reason = choices[0].get('finish_reason')
                        summary.finish_reason = reason if isinstance(reason, str) else None
            with repository.db.connection() as conn:
                conn.execute('UPDATE model_calls SET summary_json=?,request_body=?,response_body=? WHERE call_id=?',
                    (summary.model_dump_json(), zlib.compress(request.content),
                     zlib.compress(response.content) if response is not None else None, summary.call_id))

    def list(self, run_id: str, connection: Optional[Connection] = None) -> List[ModelCallSummary]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            rows = conn.execute('SELECT summary_json FROM model_calls WHERE run_id=? ORDER BY rowid', (run_id,)).fetchall()
        return [ModelCallSummary.model_validate_json(row[0]) for row in rows]

    def interrupt(self, run_id: str, connection: Connection) -> None:
        rows = connection.execute("""SELECT summary_json FROM model_calls WHERE run_id=?
            AND json_extract(summary_json,'$.finished_at') IS NULL""", (run_id,)).fetchall()
        for row in rows:
            summary = ModelCallSummary.model_validate_json(row[0])
            summary.error = ModelCallError(type='WorkerInterrupted', message='工作进程已中断；模型服务是否完成、返回内容和用量未知')
            summary.finished_at = datetime.now(timezone.utc).isoformat()
            connection.execute('UPDATE model_calls SET summary_json=? WHERE call_id=?',
                               (summary.model_dump_json(), summary.call_id))

    def get(self, run_id: str, call_id: str) -> ModelCallDetail:
        with self.db.connection() as conn:
            row = conn.execute('SELECT * FROM model_calls WHERE run_id=? AND call_id=?', (run_id, call_id)).fetchone()
        if row is None:
            raise LookupError('Model call not found in this job')
        return ModelCallDetail(**json.loads(row['summary_json']), request_body=zlib.decompress(row['request_body']).decode(),
            response_body=zlib.decompress(row['response_body']).decode('utf-8', errors='replace') if row['response_body'] is not None else None)
