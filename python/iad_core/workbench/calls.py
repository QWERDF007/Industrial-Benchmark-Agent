import json
import time
import uuid
from contextlib import contextmanager,nullcontext
from contextvars import ContextVar
from datetime import datetime, timezone
from sqlite3 import Connection
from typing import Annotated, Any, Callable, List, Literal, Optional, Tuple

import httpx
from pydantic import AwareDatetime, Field, FiniteFloat

from iad_core.advisory.analysis import AnalysisModel
from iad_core.storage.database import Database
from iad_core.workbench.completion import CompletionResponse, ResponseCapture


class ModelCallError(AnalysisModel):
    type: str
    message: str


class ModelCallSummary(AnalysisModel):
    call_id: str
    run_id: str
    operation: Literal['tokenize', 'generate']
    schema_name: Optional[str]
    phase: Optional[str]
    sample_id: Optional[str]
    role: Optional[Literal['agent', 'vision']] = None
    request_id: Optional[str] = None
    source: Literal['http', 'native_llm'] = 'http'
    session_id: Optional[str] = None
    attempt: Optional[int] = Field(default=None, gt=0, strict=True)
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
    request_body: str = Field(description='http来源为传输正文；native_llm来源为省略运行时signal的SDK请求JSON')
    response_body: Optional[str] = Field(description='http来源为传输正文；native_llm来源为SDK流的实际终态与可得用量')


class NativeModelCallStart(AnalysisModel):
    call_id: str = Field(min_length=1)
    started_at: AwareDatetime
    request: dict[str, Any]


class NativeModelCallEnd(AnalysisModel):
    call_id: str = Field(min_length=1)
    finished_at: AwareDatetime
    elapsed_ms: Annotated[FiniteFloat, Field(ge=0)]
    finish_reason: Optional[str] = None
    usage: Optional[dict[str, Any]] = None
    error: Optional[ModelCallError] = None
    http_status: Optional[int] = None


_active: ContextVar[Optional[Tuple['ModelCalls', str, Optional[Callable[[], None]], str, Optional[str], Optional[str], Optional[str]]]] = ContextVar('iad_model_calls', default=None)


class ModelCalls:
    def __init__(self, db: Database):
        self.db = db

    def start_native(self, run_id: str, request: NativeModelCallStart, *, sample_id: str | None, session_id: str,
                     attempt: int) -> None:
        with self.db.connection() as connection:
            payload = json.loads(connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0])
            summary = ModelCallSummary(call_id=request.call_id, run_id=run_id, operation='generate',
                schema_name=None, phase=payload.get('phase'), sample_id=sample_id,
                role='agent', request_id=request.call_id, source='native_llm', session_id=session_id, attempt=attempt,
                started_at=request.started_at.isoformat())
            connection.execute('INSERT INTO model_calls(call_id,run_id,summary_json) VALUES(?,?,?)',
                (summary.call_id, run_id, summary.model_dump_json()))
            self.db.call_payloads.write(run_id, summary.call_id, 'request', json.dumps(request.request, ensure_ascii=False).encode())

    def finish_native(self, run_id: str, sample_id: str | None, result: NativeModelCallEnd) -> None:
        with self.db.connection() as connection:
            row = connection.execute('SELECT summary_json FROM model_calls WHERE run_id=? AND call_id=?',
                (run_id, result.call_id)).fetchone()
            if row is None:
                raise LookupError('原生模型调用不属于当前作业')
            summary = ModelCallSummary.model_validate_json(row[0])
            if summary.source != 'native_llm' or summary.sample_id != sample_id:
                raise ValueError('原生模型调用不属于当前主图')
            summary.finished_at = result.finished_at.isoformat()
            summary.elapsed_ms, summary.finish_reason = result.elapsed_ms, result.finish_reason
            summary.usage = (result.usage if result.error is None and result.finish_reason is not None
                and result.usage and any(result.usage.values()) else None)
            summary.error, summary.http_status = result.error, result.http_status
            connection.execute('UPDATE model_calls SET summary_json=? WHERE call_id=?', (summary.model_dump_json(), summary.call_id))
            self.db.call_payloads.write(run_id, summary.call_id, 'response', result.model_dump_json().encode())

    @contextmanager
    def bind(self, run_id: str, checkpoint: Optional[Callable[[], None]] = None, *, state_run_id: Optional[str] = None,
             role: Optional[Literal['agent', 'vision']] = None, request_id: Optional[str] = None, sample_id: Optional[str] = None):
        token = _active.set((self, run_id, checkpoint, state_run_id or run_id, role, request_id, sample_id))
        try:
            yield
        finally:
            _active.reset(token)

    @staticmethod
    @contextmanager
    def exchange(client: httpx.Client, request: httpx.Request, operation: Literal['tokenize', 'generate'], schema_name: str, *, stream: bool = False):
        binding = _active.get()
        if binding is None:
            response = client.send(request, stream=stream)
            try:
                yield response
            finally:
                response.close()
            return
        repository, run_id, checkpoint, state_run_id, role, request_id, sample_id = binding
        with repository.db.connection() as conn:
            payload = json.loads(conn.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (state_run_id,)).fetchone()[0])
            summary = ModelCallSummary(call_id='call_' + uuid.uuid4().hex, run_id=run_id, operation=operation,
                schema_name=schema_name, phase=payload.get('phase'), sample_id=sample_id if sample_id is not None else payload.get('current_sample_id'),
                role=role, request_id=request_id,
                started_at=datetime.now(timezone.utc).isoformat())
            conn.execute('INSERT INTO model_calls(call_id,run_id,summary_json) VALUES(?,?,?)',
                         (summary.call_id, run_id, summary.model_dump_json()))
            repository.db.call_payloads.write(run_id, summary.call_id, 'request', request.content)
        response, capture, response_body = None, None, None
        started = time.perf_counter()
        try:
            response = client.send(request, stream=stream)
            if stream and not response.is_stream_consumed:
                capture = ResponseCapture(response.stream, checkpoint)
                response.stream = capture
            if response.is_error:
                response.read()
            yield response
        except Exception as error:
            summary.error = ModelCallError(type=type(error).__name__, message=str(error))
            raise
        finally:
            summary.finished_at = datetime.now(timezone.utc).isoformat()
            summary.elapsed_ms = (time.perf_counter() - started) * 1000
            if response is not None:
                summary.http_status = response.status_code
                recorded = (httpx.Response(response.status_code, headers=response.headers, content=bytes(capture.content))
                            if capture is not None else response)
                response_body = recorded.content
                try:
                    body = CompletionResponse.read(recorded).body
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
                response.close()
            with repository.db.connection() as conn:
                updated = conn.execute('UPDATE model_calls SET summary_json=? WHERE call_id=?',
                    (summary.model_dump_json(), summary.call_id))
                if updated.rowcount and response_body is not None:
                    repository.db.call_payloads.write(run_id, summary.call_id, 'response', response_body)

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
        with self.db.call_payloads.reading(), self.db.connection() as conn:
            row = conn.execute('SELECT * FROM model_calls WHERE run_id=? AND call_id=?', (run_id, call_id)).fetchone()
            if row is None:
                raise LookupError('Model call not found in this job')
            request, response = self.db.call_payloads.read(run_id, call_id)
            summary = json.loads(row['summary_json'])
            if summary.get('finished_at') and summary.get('http_status') is not None and response is None:
                raise RuntimeError('模型调用响应正文缺失')
        return ModelCallDetail(**summary, request_body=request.decode(),
            response_body=response.decode('utf-8', errors='replace') if response is not None else None)
