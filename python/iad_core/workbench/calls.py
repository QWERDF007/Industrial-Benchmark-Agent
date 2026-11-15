import json
import time
import uuid
from contextlib import contextmanager,nullcontext
from contextvars import ContextVar
from datetime import datetime, timezone
from sqlite3 import Connection
from typing import Annotated, Any, Callable, List, Literal, Optional, Tuple, Sequence

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
    pair_keys: list[str] = Field(default_factory=list)
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


_active: ContextVar[Optional[Tuple['ModelCalls', str, Optional[Callable[[], None]], str, Optional[str], Optional[str], Optional[str], tuple[str, ...]]]] = ContextVar('iad_model_calls', default=None)


class ModelCalls:
    def __init__(self, db: Database):
        self.db = db

    def successful_native_ids(self, run_id: str, *, complete_response: bool = False) -> set[str]:
        with self.db.connection() as connection:
            return {row[0] for row in connection.execute("""SELECT call_id FROM model_calls WHERE run_id=?
                AND json_extract(summary_json,'$.source')='native_llm'
                AND json_extract(summary_json,'$.finished_at') IS NOT NULL
                AND json_extract(summary_json,'$.finish_reason') NOT IN ('error','aborted')
                AND json_extract(summary_json,'$.error') IS NULL
                AND (?=0 OR json_extract(summary_json,'$.finish_reason') IN ('stop','tool-calls'))""",
                (run_id, int(complete_response)))}

    def start_native(self, run_id: str, request: NativeModelCallStart, *, sample_id: str | None, session_id: str,
                     attempt: int) -> None:
        body = json.dumps(request.request, ensure_ascii=False).encode()
        with (
            self.db.call_payloads.prepare(run_id, request.call_id, 'request', body) as prepared,
            self.db.connection(after_commit=prepared.commit) as connection,
        ):
            payload = json.loads(connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0])
            summary = ModelCallSummary(call_id=request.call_id, run_id=run_id, operation='generate',
                schema_name=None, phase=payload.get('phase'), sample_id=sample_id,
                role='agent', request_id=request.call_id, source='native_llm', session_id=session_id, attempt=attempt,
                started_at=request.started_at.isoformat())
            connection.execute('INSERT INTO model_calls(call_id,run_id,summary_json) VALUES(?,?,?)',
                (summary.call_id, run_id, summary.model_dump_json()))
            prepared.publish()

    def finish_native(self, run_id: str, sample_id: str | None, result: NativeModelCallEnd) -> None:
        with (
            self.db.call_payloads.prepare(run_id, result.call_id, 'response', result.model_dump_json().encode()) as prepared,
            self.db.connection(after_commit=prepared.commit) as connection,
        ):
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
            prepared.publish()

    @contextmanager
    def bind(self, run_id: str, checkpoint: Optional[Callable[[], None]] = None, *, state_run_id: Optional[str] = None,
             role: Optional[Literal['agent', 'vision']] = None, request_id: Optional[str] = None, sample_id: Optional[str] = None,
             pair_keys: Sequence[str] = ()):
        token = _active.set((self, run_id, checkpoint, state_run_id or run_id, role, request_id, sample_id, tuple(pair_keys)))
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
        repository, run_id, checkpoint, state_run_id, role, request_id, sample_id, pair_keys = binding
        if checkpoint:
            checkpoint()
        with repository.db.connection() as conn:
            payload = json.loads(conn.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (state_run_id,)).fetchone()[0])
            anchor = conn.execute('SELECT phase,session_id,attempt FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (state_run_id, sample_id)).fetchone() if sample_id is not None else None
            summary = ModelCallSummary(call_id='call_' + uuid.uuid4().hex, run_id=run_id, operation=operation,
                schema_name=schema_name, phase=anchor['phase'] if anchor is not None else payload.get('phase'),
                session_id=anchor['session_id'] if anchor is not None else None, attempt=anchor['attempt'] if anchor is not None else None,
                sample_id=sample_id if sample_id is not None else payload.get('current_sample_id'),
                role=role, request_id=request_id,
                started_at=datetime.now(timezone.utc).isoformat())
        with (
            repository.db.call_payloads.prepare(run_id, summary.call_id, 'request', request.content) as prepared,
            repository.db.connection(after_commit=prepared.commit) as conn,
        ):
            conn.execute('INSERT INTO model_calls(call_id,run_id,summary_json) VALUES(?,?,?)',
                         (summary.call_id, run_id, summary.model_dump_json()))
            conn.executemany('INSERT INTO model_call_pairs VALUES(?,?,?)',
                [(summary.call_id, run_id, key) for key in pair_keys])
            prepared.publish()
        response, capture, response_body = None, None, None
        started = time.perf_counter()
        try:
            if checkpoint:
                checkpoint()
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
                    if body.get('object') == 'response' and isinstance(body.get('status'), str):
                        summary.finish_reason = body['status']
                    choices = body.get('choices')
                    if isinstance(choices, list) and choices and isinstance(choices[0], dict):
                        reason = choices[0].get('finish_reason')
                        summary.finish_reason = reason if isinstance(reason, str) else None
                response.close()
            prepared_body = (repository.db.call_payloads.prepare(run_id, summary.call_id, 'response', response_body)
                             if response_body is not None else nullcontext(None))
            with prepared_body as prepared:
                with repository.db.connection(after_commit=prepared.commit if prepared is not None else None) as conn:
                    updated = conn.execute('UPDATE model_calls SET summary_json=? WHERE call_id=?',
                        (summary.model_dump_json(), summary.call_id))
                    if updated.rowcount and prepared is not None:
                        prepared.publish()

    def list(self, run_id: str, connection: Optional[Connection] = None) -> List[ModelCallSummary]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            rows = conn.execute('''SELECT c.summary_json,(SELECT json_group_array(p.pair_key) FROM model_call_pairs p
                WHERE p.call_id=c.call_id AND p.job_id=c.run_id) pair_keys
                FROM model_calls c WHERE c.run_id=? ORDER BY c.rowid''', (run_id,)).fetchall()
        return [ModelCallSummary.model_validate_json(row[0]).model_copy(update={'pair_keys': json.loads(row[1])}) for row in rows]

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
            summary['pair_keys'] = [item[0] for item in conn.execute(
                'SELECT pair_key FROM model_call_pairs WHERE call_id=? AND job_id=?', (call_id, run_id))]
            if summary.get('finished_at') and summary.get('http_status') is not None and response is None:
                raise RuntimeError('模型调用响应正文缺失')
        return ModelCallDetail(**summary, request_body=request.decode(),
            response_body=response.decode('utf-8', errors='replace') if response is not None else None)
