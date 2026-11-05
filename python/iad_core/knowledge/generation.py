import hashlib
import json

from iad_core.knowledge.models import KnowledgeDraft, KnowledgeLearning, KnowledgeVerification, KnowledgeSnapshot
from iad_core.knowledge.mining import OUTPUT_RESERVE_TOKENS
from iad_core.knowledge.prompt_text import (LEARNING_INSTRUCTION, DISCOVERY_INSTRUCTION, LINK_INSTRUCTION,
    VERIFICATION_INSTRUCTION, EVOLUTION_INSTRUCTION,
    OBSERVATION_INSTRUCTION, RECHECK_INSTRUCTION, EVIDENCE_SCOPE_INSTRUCTION)
from iad_core.workbench.vision import MODEL_PROMPT_CONTRACT, GENERATION_PARAMETERS
from iad_core.evidence.images import MODEL_INPUT_VERSION

GENERATION_VERSION = "dataset-knowledge-v41"

def generation_signature() -> str:
    return hashlib.sha256(json.dumps([GENERATION_VERSION, MODEL_INPUT_VERSION, MODEL_PROMPT_CONTRACT, GENERATION_PARAMETERS, OUTPUT_RESERVE_TOKENS, LEARNING_INSTRUCTION, DISCOVERY_INSTRUCTION, LINK_INSTRUCTION, KnowledgeLearning.model_json_schema(),
        VERIFICATION_INSTRUCTION,
        EVOLUTION_INSTRUCTION, OBSERVATION_INSTRUCTION, RECHECK_INSTRUCTION, EVIDENCE_SCOPE_INSTRUCTION, KnowledgeDraft.model_json_schema(),
        KnowledgeVerification.model_json_schema(), KnowledgeSnapshot.model_json_schema()], sort_keys=True).encode()).hexdigest()
