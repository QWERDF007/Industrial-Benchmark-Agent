import hashlib
import json

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.group_analysis_models import GroupAnalysisSummary
from iad_core.consistency.group_analysis_contract import GroupAnalysisContract
from iad_core.workbench.vision import ModelCapacityError


class GroupAnalysisSynthesis:
    MAX_TEXT_BYTES = 128 * 1024
    def __init__(self, client, validation):
        self.client, self.validation = client, validation

    def summarize(self, context, group, batches) -> GroupAnalysisSummary:
        nodes = [dict(node_id=batch.input_fingerprint, result=GroupAnalysisSummary.model_validate(
            batch.result.model_dump(exclude={'assessments'}))) for batch in batches]
        cached = {tuple(step['input_node_ids']): step for step in context.payload.get('prior_summary_steps', [])}
        steps = []
        while len(nodes) > 1:
            queue = [nodes[start:start + 8] for start in range(0, len(nodes), 8)]
            reduced = []
            while queue:
                selected = queue.pop(0)
                if len(selected) == 1:
                    reduced.extend(selected)
                    continue
                ids = tuple(node['node_id'] for node in selected)
                expected = self.validation.verdict(node['result'].overall.verdict for node in selected)
                allowed = {ref.candidate_id for node in selected for ref in [*node['result'].overall.references,
                    *[ref for conclusion in node['result'].conclusions for ref in conclusion.references]]}
                facts = dict(expected_verdict=expected,
                    summaries=[dict(node_id=node['node_id'], result=node['result'].model_dump(mode='json')) for node in selected])
                if ids in cached:
                    step = cached[ids]
                    result = GroupAnalysisSummary.model_validate(step['result'])
                    self.validation.validate(result, group, allowed, expected_verdict=expected)
                else:
                    try:
                        response_type = self.validation.response_type(GroupAnalysisSummary, group, allowed, expected_verdict=expected)
                        contract = GroupAnalysisContract(response_type, group)
                        instruction = context.payload['request']['analysis_instruction'] + '\n冻结批次分析：' + json.dumps(
                            contract.encode(facts), ensure_ascii=False, separators=(',', ':'))
                        if len(instruction.encode()) > self.MAX_TEXT_BYTES:
                            raise ConsistencyError('RESOURCE_LIMIT', '批次汇总超过文本容量')
                        contract.record(context, hashlib.sha256(json.dumps(ids).encode()).hexdigest())
                        plan = self.client.plan(contract.response_type, instruction, [], context.payload['model_name'])
                    except (ConsistencyError, ModelCapacityError) as error:
                        if isinstance(error, ConsistencyError) and error.code != 'RESOURCE_LIMIT':
                            raise
                        if len(selected) <= 2:
                            raise
                        middle = len(selected) // 2
                        queue[:0] = [selected[:middle], selected[middle:]]
                        continue
                    context.checkpoint()
                    result = self.client.generate(plan)
                    step = dict(input_node_ids=list(ids), run_id=context.run_id,
                        node_id=hashlib.sha256(json.dumps(ids).encode()).hexdigest(), result=result.model_dump(mode='json'))
                steps.append(step)
                context.update(group_summary_steps=steps)
                reduced.append(dict(node_id=step['node_id'], result=result))
            if len(reduced) >= len(nodes):
                raise ConsistencyError('RESOURCE_LIMIT', '完整批次结论无法在当前模型容量内汇总')
            nodes = reduced
        return nodes[0]['result']
