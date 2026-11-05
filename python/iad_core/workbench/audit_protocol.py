import hashlib
import json

from iad_core.advisory.analysis import AuditAnalysis
from iad_core.workbench.joint import OUTPUT_RESERVE_TOKENS
from iad_core.workbench.vision import GENERATION_PARAMETERS, MODEL_PROMPT_CONTRACT


AUDIT_GENERATION_VERSION = 'dataset-audit-v9'


def audit_generation_signature() -> str:
    return hashlib.sha256(json.dumps([AUDIT_GENERATION_VERSION, MODEL_PROMPT_CONTRACT, GENERATION_PARAMETERS,
        OUTPUT_RESERVE_TOKENS, AuditAnalysis.model_json_schema()], sort_keys=True).encode()).hexdigest()
