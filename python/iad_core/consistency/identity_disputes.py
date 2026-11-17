import hashlib
import json
from typing import Literal

from pydantic import Field, create_model, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.agent_review_models import AnchorObservation, GateDispute
from iad_core.consistency.group_models import ModelVisualWindow
from iad_core.consistency.identity_models import candidate_pair_key
from iad_core.evidence.images import PreparedImageBundle
from iad_core.evidence.model_inputs import ModelImageInputs, MODEL_IMAGE_GUIDANCE
from iad_core.workbench.calls import ModelCalls


class IdentityDispute(GateDispute):
    observation_id: str
    anchor_id: str
    candidate_id: str


class DisputeLocation(AnalysisModel):
    windows: list[ModelVisualWindow] = Field(default_factory=list)
    limitation: str = Field(default_factory=str)


class IdentityDisputes:
    def __init__(self, db):
        self.db = db

    def read(self, run_id: str, anchor_id: str, candidate_id: str) -> list[IdentityDispute]:
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT observation_json FROM consistency_visual_requests
                WHERE job_id=? AND anchor_id IN (?,?) AND EXISTS (
                    SELECT 1 FROM json_each(observation_json,'$.result.observations') observation
                    WHERE json_extract(observation.value,'$.candidate_id') IN (?,?)
                    AND json_type(observation.value,'$.gate_dispute')='object') ORDER BY rowid''',
                (run_id, anchor_id, candidate_id, anchor_id, candidate_id)).fetchall()
        result = []
        for row in rows:
            observed = AnchorObservation.model_validate_json(row[0])
            for item in observed.result.observations:
                if item.candidate_id in (anchor_id, candidate_id) and item.gate_dispute is not None:
                    result.append(IdentityDispute(**item.gate_dispute.model_dump(),
                        observation_id=observed.observation_id, anchor_id=observed.request.anchor_id,
                        candidate_id=item.candidate_id))
        return result

    @staticmethod
    def validate_windows(windows, sizes):
        for window in windows:
            if window.sample_id not in sizes:
                raise ValueError('内容争议窗口须属于本次主图或当前候选')
            width, height = sizes[window.sample_id]
            x1, y1, x2, y2 = window.bbox
            if not (0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height):
                raise ValueError('内容争议窗口须在原图画布内且宽高大于零')

    def locate(self, run_id, anchor_id, candidate_id, disputes, roots, client, checkpoint, *,
               revision, request_id, max_side):
        missing = [(index, item) for index, item in enumerate(disputes) if not item.windows and not item.region_pair_ids]
        if not missing:
            return disputes
        sizes = {side: root.evidence.original_size for side, root in zip(('main', 'candidate'), roots)}
        context = {'scope': 'dispute_locations', 'original_sizes': sizes,
            'perspective': '每条reason沿用提出争议时的表述，其中主图指source_side，候选指另一侧。sample_id使用当前图组的main或candidate。',
            'disputes': [{'ref': 'd'+str(index), 'source_side': 'main' if item.anchor_id == anchor_id else 'candidate',
                'reason': item.reason} for index, item in missing]}
        fingerprint = hashlib.sha256(json.dumps([context, max_side,
            [root.evidence.model_dump(mode='json') for root in roots]], sort_keys=True).encode()).hexdigest()
        with self.db.connection() as connection:
            saved = connection.execute('''SELECT fingerprint,record_json FROM consistency_gate_observations
                WHERE job_id=? AND anchor_id=? AND candidate_id=? AND gate_revision=? AND request_id=? AND page_index=1''',
                (run_id, anchor_id, candidate_id, revision, request_id)).fetchone()
        window_type = create_model('DisputeWindow', __base__=ModelVisualWindow, sample_id=(Literal['main', 'candidate'], ...))
        location_type = create_model('DisputeLocation', __base__=DisputeLocation,
            windows=(list[window_type], Field(default_factory=list)))

        @model_validator(mode='after')
        def valid_locations(value):
            try:
                for index, _ in missing:
                    location = getattr(value, 'd'+str(index))
                    self.validate_windows(location.windows, sizes)
                    if not location.windows and not location.limitation.strip():
                        raise ValueError('无法定位争议时须说明具体限制')
            except ValueError as error:
                raise repairable_output_error('dispute_location', str(error)) from error
            return value

        response_type = create_model('DisputeLocations', __base__=AnalysisModel,
            __validators__={'valid_locations': valid_locations},
            **{'d'+str(index): (location_type, ...) for index, _ in missing})
        if saved:
            if saved['fingerprint'] != fingerprint:
                raise ValueError('争议定位输入与已保存图证不一致')
            locations = response_type.model_validate_json(saved['record_json'])
        else:
            inputs = ModelImageInputs(self.db.db_path)
            bundles = [PreparedImageBundle(side+'_image', {'side': side, 'original_size': sizes[side]},
                (root.for_model(inputs, max_side),)) for side, root in zip(('main', 'candidate'), roots)]
            checkpoint()
            with ModelCalls(self.db).bind(run_id, checkpoint, role='vision', sample_id=anchor_id,
                    request_id=request_id+'-locate', pair_keys=[candidate_pair_key(anchor_id, candidate_id)]):
                plan = client.plan(response_type,
                    '逐条定位disputes描述的实际争议。用原图像素返回覆盖该位置的小范围窗口，一侧能可靠定位即可。'
                    '描述只用于引导查找，不证明差异存在；看不到或无法定位时返回空windows并说明limitation。',
                    bundles, client.resolve_model(), context=context, system_prompt=MODEL_IMAGE_GUIDANCE)
                locations = client.generate(plan)
            checkpoint()
            with self.db.connection() as connection:
                connection.execute('''INSERT INTO consistency_gate_observations(job_id,anchor_id,candidate_id,
                    gate_revision,request_id,page_index,fingerprint,record_json,call_ids_json)
                    VALUES(?,?,?,?,?,1,?,?,'[]') ON CONFLICT DO NOTHING''',
                    (run_id, anchor_id, candidate_id, revision, request_id, fingerprint, locations.model_dump_json()))
        result = list(disputes)
        identities = {'main': anchor_id, 'candidate': candidate_id}
        for index, dispute in missing:
            windows = [window.model_copy(update={'sample_id': identities[window.sample_id]})
                for window in getattr(locations, 'd'+str(index)).windows]
            result[index] = dispute.model_copy(update={'windows': windows})
        return result
