import hashlib
import json

from iad_core.knowledge.models import KnowledgeDraft, KnowledgeVerification, KnowledgeSnapshot
from iad_core.knowledge.mining import OUTPUT_RESERVE_TOKENS
from iad_core.knowledge.verification import VERIFICATION_INSTRUCTION
from iad_core.knowledge.defect import DEFECT_INSTRUCTION, DEFECT_VERIFICATION_INSTRUCTION
from iad_core.knowledge.evolution import EVOLUTION_INSTRUCTION
from iad_core.knowledge.observation import OBSERVATION_INSTRUCTION
from iad_core.knowledge.recheck import RECHECK_INSTRUCTION
from iad_core.knowledge.findings import EVIDENCE_SCOPE_INSTRUCTION
from iad_core.workbench.vision import RESPONSE_INSTRUCTION, GENERATION_PARAMETERS

GENERATION_VERSION = "dataset-knowledge-v19"
NORMAL_INSTRUCTION = """联合观察这一数据集的候选良品，发现产品可见的部件、结构关系、位置、纹理、光照与允许变化。
不要根据数据集名称假设产品或预设缺陷检查表。只归纳可观察、可复用且有图像证据的检查判据。
人工选取和无标注只是来源资格，不是确认真值。寻找候选良品中的异常与矛盾，将其定位为suspects，
不要将疑似异常作为对应正常规则的支持。区分跨样本共识、单例、推测与不可观察。
每个检查项指向实际support_evidence_ids和counter_evidence_ids，不编造尺寸、坐标或不存在的图像引用。
normal是来源全图，roi是该来源的原分辨率细节。结合其原图尺寸、crop_bbox和光照联合判断，勿将分块视作独立样本。
annotation_mask是纯二值定位图：白色只表示标注覆盖、黑色表示其外部/空洞，完全不含产品外观或颜色。
须与相同crop_bbox的raw原图配对联合观察；只在raw图像中判断产品特征，不能根据标注染色/形状推断缺陷或正常变化。
对每项写明适用对象/位置、可观察判据、允许变化与限制。没有可靠规律时允许checks为空并说明限制。
来源："""

def generation_signature() -> str:
    return hashlib.sha256(json.dumps([GENERATION_VERSION, RESPONSE_INSTRUCTION, GENERATION_PARAMETERS, OUTPUT_RESERVE_TOKENS, NORMAL_INSTRUCTION,
        VERIFICATION_INSTRUCTION, DEFECT_INSTRUCTION, DEFECT_VERIFICATION_INSTRUCTION,
        EVOLUTION_INSTRUCTION, OBSERVATION_INSTRUCTION, RECHECK_INSTRUCTION, EVIDENCE_SCOPE_INSTRUCTION, KnowledgeDraft.model_json_schema(),
        KnowledgeVerification.model_json_schema(), KnowledgeSnapshot.model_json_schema()], sort_keys=True).encode()).hexdigest()
