from iad_core.workbench.job_models import failure_message
import json
from collections import deque
from uuid import UUID, uuid4

from pydantic import Field, model_validator

from iad_core.exploration.models import ExplorationStart
from iad_core.workbench.jobs import JobContext


class ExplorationBatchStart(ExplorationStart):
    submission_id: UUID = Field(default_factory=uuid4)
    initial_batch_size: int = Field(default=8, ge=3, le=200)
    batch_size: int = Field(default=4, ge=2, le=199)

    @model_validator(mode='after')
    def larger_initial_batch(self):
        if self.initial_batch_size <= self.batch_size:
            raise ValueError('首次探索图组必须比后续图组大')
        return self


class ExplorationBatches:
    def __init__(self, exploration):
        self.exploration = exploration
        self.jobs = exploration.jobs

    @staticmethod
    def plan(request: ExplorationBatchStart) -> list[dict]:
        normal, defect = deque(request.normal_images), deque(request.defect_images)
        batches = []
        while normal or defect:
            size = request.batch_size if batches else request.initial_batch_size
            normals = [] if normal or not request.normal_images else [request.normal_images[0]]
            defects = [] if defect or not request.defect_images else [request.defect_images[0]]
            selected = []
            while len(normals) + len(defects) < size and (normal or defect):
                if normal and (not defect or len(normals) <= len(defects)):
                    sid = normal.popleft()
                    normals.append(sid)
                else:
                    sid = defect.popleft()
                    defects.append(sid)
                selected.append(sid)
            batches.append(dict(normal_images=normals, defect_images=defects, source_ids=selected))
        return batches

    def start(self, request: ExplorationBatchStart | dict, *, model_name: str | None = None) -> dict:
        request = ExplorationBatchStart.model_validate(request)
        submission = request.model_dump(mode='json')
        if existing := self.jobs.submitted('EXPLORATION_BATCH', submission):
            return existing
        payload = self.prepare(request, model_name=model_name)
        return self.jobs.start('EXPLORATION_BATCH', payload['task_id'], payload, self.execute, '准备分批方向探索')

    def prepare(self, request: ExplorationBatchStart | dict, *, model_name: str | None = None) -> dict:
        request = ExplorationBatchStart.model_validate(request)
        submission = request.model_dump(mode='json')
        base = ExplorationStart.model_validate(request.model_dump(include=set(ExplorationStart.model_fields)))
        payload = self.exploration.prepare(base,model_name)
        payload.update(submission=submission,batches=self.plan(request))
        return payload

    def validate(self, request: dict, *, batch: dict | None = None):
        scoped = request
        if batch is not None:
            scoped = dict(request, exploration_request={**request['exploration_request'],
                'normal_images':batch['normal_images'], 'defect_images':batch['defect_images']},
                normal_sources=[source for source in request['normal_sources'] if source['sample_id'] in batch['normal_images']],
                defect_sources=[source for source in request['defect_sources'] if source['sample_id'] in batch['defect_images']])
        self.exploration.validate(scoped)
        if request['batches'] != self.plan(ExplorationBatchStart.model_validate(request['submission'])):
            raise ValueError('冻结探索批次已变化')

    def retry(self, run_id: str) -> dict:
        return self.jobs.retry(run_id, ('EXPLORATION_BATCH',), self.execute, validate=self.validate)

    def execute(self, context: JobContext):
        request = context.payload['request']
        self.validate(request)
        base = ExplorationStart.model_validate(request['exploration_request'])
        with self.exploration.db.connection() as conn:
            rows = conn.execute('''SELECT payload_json FROM job_runs WHERE job_type='EXPLORATION_BATCH'
                AND json_extract(payload_json,'$.root_run_id')=? ORDER BY id''', (context.payload['root_run_id'],)).fetchall()
        run_ids = list(dict.fromkeys(run_id for row in rows for run_id in json.loads(row[0]).get('batch_runs', [])))
        completed = {}
        for run_id in run_ids:
            child = self.jobs.status(run_id, ('DIRECTION_EXPLORATION',))
            if child['status'] == 'COMPLETED':
                child_request = child['request']['exploration_request']
                completed[(tuple(child_request['normal_images']), tuple(child_request['defect_images']))] = child
        previous = base.parent_version_id
        pending = set(request['sample_ids'])
        context.update(total_batches=len(request['batches']), completed_batches=0, phase='EXPLORING_BATCHES')
        for index, batch in enumerate(request['batches']):
            context.checkpoint()
            key = (tuple(batch['normal_images']), tuple(batch['defect_images']))
            child = completed.get(key)
            selected = [sid for sid in batch['source_ids'] if sid in pending]
            if child:
                if child['request']['exploration_request']['parent_version_id'] != previous:
                    raise ValueError('冻结探索批次的继承关系不一致')
                self.exploration.repository.get(child['exploration_version_id'])
            else:
                if len(selected) != len(batch['source_ids']):
                    raise ValueError('已完成探索批次缺少对应冻结版本')
                self.validate(request, batch=batch)
                child_request = base.model_copy(update=dict(normal_images=batch['normal_images'],
                    defect_images=batch['defect_images'], parent_version_id=previous))
                child = context.join(self.exploration.start(child_request, request['model_name']))
                if child['status'] != 'COMPLETED':
                    raise ValueError(f"探索图组 {index + 1} 未完成（{child['run_id']}）：" +
                                     failure_message(child['errors']))
            previous = child['exploration_version_id']
            if index == len(request['batches']) - 1:
                self.validate(request)
            if selected:
                context.record(selected, exploration_version_id=previous, completed_batches=index + 1, active_batch_run_id=None)
                pending.difference_update(selected)
            else:
                context.update(exploration_version_id=previous, completed_batches=index + 1)
