import argparse
import hashlib
import json
import os
from pathlib import Path

import httpx
from pydantic import BaseModel, computed_field

from iad_core.workbench.vision import TokenCapacity


class NativeAgentCapacityReport(BaseModel):
    model: str
    request_sha256: str
    submission_sha256: str
    input_capacity: TokenCapacity
    submission_capacity: TokenCapacity
    tool_call_capacity: TokenCapacity
    native_requests: int
    tool_calls: int
    declared_context_tokens: int
    declared_output_tokens: int

    @computed_field
    @property
    def input_budget_exceeded(self) -> bool:
        return self.input_capacity.count + self.declared_output_tokens > min(
            self.declared_context_tokens, self.input_capacity.max_model_len)

    @computed_field
    @property
    def submission_budget_exceeded(self) -> bool:
        return self.submission_capacity.count > self.declared_output_tokens

    @computed_field
    @property
    def tool_call_budget_exceeded(self) -> bool:
        return self.tool_call_capacity.count > self.declared_output_tokens


def main() -> int:
    parser = argparse.ArgumentParser(description='用真实 vLLM tokenizer 核对已保存原生 Agent 请求与完整提交参数；输出参数计数不含推理及工具协议开销。')
    parser.add_argument('--evidence-dir', type=Path, required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--endpoint', default=os.environ.get('LIVE_VLM_ENDPOINT'), required='LIVE_VLM_ENDPOINT' not in os.environ)
    options = parser.parse_args()
    summary = json.loads((options.evidence_dir / 'summary.json').read_text())
    requests = (options.evidence_dir / 'agent-requests.jsonl').read_bytes().splitlines()
    calls = [json.loads(line) for line in (options.evidence_dir / 'tool-calls.jsonl').read_text().splitlines()]
    submission_bytes = (options.evidence_dir / 'final-submission.json').read_bytes()
    endpoint = options.endpoint.rstrip('/').removesuffix('/chat/completions').removesuffix('/v1') + '/tokenize'
    headers = {'Authorization': 'Bearer ' + os.environ['LIVE_VLM_KEY']}
    with httpx.Client(timeout=30, trust_env=False, headers=headers) as client:
        def measure(body):
            response = client.post(endpoint, json=body)
            response.raise_for_status()
            return TokenCapacity.model_validate(response.json())

        inputs = [(raw, measure({**json.loads(raw), 'model': options.model, 'add_generation_prompt': True})) for raw in requests]
        request_bytes, input_capacity = max(inputs, key=lambda item: item[1].count)
        outputs = [measure({'model': options.model, 'prompt': call['arguments'], 'add_special_tokens': False}) for call in calls]
        submission_capacity = measure({'model': options.model, 'prompt': submission_bytes.decode(), 'add_special_tokens': False})
    report = NativeAgentCapacityReport(model=options.model,
        request_sha256=hashlib.sha256(request_bytes).hexdigest(), submission_sha256=hashlib.sha256(submission_bytes).hexdigest(),
        input_capacity=input_capacity, submission_capacity=submission_capacity,
        tool_call_capacity=max(outputs, key=lambda item: item.count), native_requests=len(requests), tool_calls=len(calls),
        declared_context_tokens=summary['agent_context_tokens'], declared_output_tokens=summary['agent_output_tokens'])
    encoded = report.model_dump_json(indent=2)
    (options.evidence_dir / 'capacity-report.json').write_text(encoded + '\n')
    print(encoded)
    return int(report.input_budget_exceeded or report.submission_budget_exceeded or report.tool_call_budget_exceeded)


if __name__ == '__main__':
    raise SystemExit(main())
