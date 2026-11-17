from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.task_types import ConsistencyTaskType
from iad_core.evidence.model_inputs import MODEL_IMAGE_GUIDANCE


IDENTITY_PIPELINE = 'identity-v8'
IDENTITY_PROMPT_VERSION = 'consistency-pair-review-v8.13'


class IdentityPrompts(AnalysisModel):
    gate_system: NonBlankText
    gate_user: NonBlankText
    gate_examples: NonBlankText


ANALYSIS_STYLE = '''用直白中文写分析：先给判断，再说明图上哪个位置、两侧具体有什么差别。每项事实说一次。
summary或explanation通常用一到三句；区域描述只保留能帮助判断的形状、线条或纹理。相同细节简短说明，不逐项重复证明。
limitations只写实际影响本次判断的问题，例如“右上角局部太小，看不清边缘”。看清了就直接判断，不添加通用免责声明。
正文不用资格、冻结、专用审核、实质性证据链等流程术语，不抄写内部ID，不写“基于上述”“在本次范围内”“不构成全面检查”等套话。'''

BBOX_SYSTEM = MODEL_IMAGE_GUIDANCE + '\n\n' + '''比较主图与已经确认同内容的候选图的矩形或多边形标注。程序负责检索、内容核对、保存和汇总；你直接观察本次提供的原图、局部及原始标注，给出每个候选的判断。
多边形以polygon顶点描述真实轮廓，bbox仅为定位和裁剪用的外接框；不能用外接框代替轮廓判断覆盖。矩形和多边形可共同参与比较，形状类型不同本身不表示标注冲突。
先确认标注指向的实际对象，再比较类别、数量和实际区域覆盖。按“主图相对于候选图”记录以下差异：
- category_mismatch：同一对象类别不同。
- extra_annotation：主图多出完整实例标注，候选没有对应实例标注。
- missing_annotation：候选有完整实例标注，主图缺少对应实例标注。
- missing_content：同一对象在主图的标注漏盖了候选已覆盖的部分内容。
- extra_content：同一对象在主图的标注额外覆盖了候选未覆盖的部分内容。
- split：主图多个标注对应候选一个标注。
- merge：主图一个标注对应候选多个标注。
先判断完整实例是否缺失，再比较对应对象的覆盖内容。拆分、合并不重复计同组实例增减；联合覆盖有差异时另记内容问题。同一对象双向内容增减须分别保存，不能统称位置差异。全部独立问题保留，主结论由程序按类别、少标实例、多标实例、少标内容、多标内容、拆分、合并的顺序选择。
少数像素的边界变化、轻微偏移或尺寸变化，只要实际覆盖基本相同，就判一致。极小对象也要看实际覆盖，不能单凭坐标差或IoU判断。几何映射及容差由程序提供，不自行计算或设阈值。
reviews中的每个候选都返回判断：EQUIVALENT为一致，MATERIAL为已确认差异，UNCERTAIN为缺少具体关键证据。已确认的问题全部写入issues，保留其他确实无法判断的部分。
仅使用输入中的标注和区域短引用，程序绑定真实来源。候选多数意见不能决定哪一侧标注正确。
若新看到两侧实际图像内容不同，返回GATE_DISPUTE及具体差别，issues为空；内容不同不能算多标或少标。
''' + ANALYSIS_STYLE

BBOX_USER = '''逐候选比较两图的原始标注、类别与实际区域覆盖，直接提交判断、全部独立差异和简洁分析。
有差异时写清位置和两侧的具体不同；一致时说明决定性依据。只有实际缺少关键证据时才写无法判断。'''

ANOMALY_SYSTEM = MODEL_IMAGE_GUIDANCE + '\n\n' + '''核对已经确认同内容的两张图的登记图像级标签。标签相等性由程序比较，合法标签相同为一致，不同为图像标签不一致。
保留实际标签和来源。缺少合法标签时说明具体数据问题，不根据外观猜测标签。
''' + ANALYSIS_STYLE

ANOMALY_USER = '读取程序的图像级标签比较结果，简洁说明两侧标签是否相同。'

GATE_SYSTEM = MODEL_IMAGE_GUIDANCE + '\n\n' + '''判断两张工业图像是否具有相同的实际视觉内容。本次提供完整原图和双方标注关注区域的局部；标注只用于定位，类别及有无框不能决定图像内容是否相同。
先比较完整原图，再观察全部局部。即使整图已经发现不同，也要完成本次实际送达的局部观察。只有一侧有标注时，仍需比较另一侧可靠对应位置的内容。
平移、旋转、缩放、曝光或压缩可能改变外观。对应位置的真实形状、线条或纹理出现新增、消失、改变，且不能用成像变化解释时，判content_different。产品轮廓、背景相似或能够配准，不能替代细节比较。
overview填写same、different或unverified，分别表示实际内容相同、实际内容不同、无法可靠确认。regions按输入windows顺序逐区填写一个字符：S为相同，D为不同，U为无法可靠确认；拼成无分隔符的字符串，长度必须等于windows数量，例如三个区域依次相同、不同、无法确认则填写“SDU”；没有已配对区域时填写空字符串。每个区域都要看，不能省略或调换。
D和U区域都要在details中有具体事实，填写refs及observation；同一事实写一次，refs列出实际出现该事实的全部区域。同一区域可关联多个独立事实，每项用一句直白中文说明位置和具体变化，相同区域无需重复描述。unmapped_regions逐一使用提供的短引用填写实际局部的简短观察及无法对应的原因，不把另一侧原图当成缺失的对应裁图。
details.refs只用实际已配对局部的r编号，整图差别写summary，不能把overview当作区域引用。同一局部可关联多个独立差别，不能漏掉。真实图像、区域和媒体ID由程序绑定。局部属于对应原图，不是独立样本。
summary用一两句给出整对图像的关键判断，不汇编逐区域描述。有差异时指出具体位置及有无或形状变化，不只写“暗斑分布不同”，不机械重复“不能用平移或曝光解释”。summary和limitations由两侧共用，必须使用“两图”或“一侧、另一侧”的对称表述，不使用主图、候选、左图或右图称呼。例如“两图右上角白点形状不同”或“一侧多出短划痕，另一侧没有”。关系无法可靠确认或细节看不清时如实记录unverified。
局部太小、看不清或无法对应，只说明该区域未核实，不能据此判content_different。整图存在独立且明确的内容差别时可以判不同，但summary应写实际差别，无法比较的局部只写入该区域观察和limitations。
只比较实际像素内容，不根据文件名、标签、可视化框线或数字判断身份。输出紧凑JSON，不缩进或添加多余空白。
''' + ANALYSIS_STYLE

GATE_USER = '核对每对完整原图和全部局部，逐区返回判断。用一句直白中文说明关键依据；只对不同或无法确认的区域补充具体事实，相同细节不重复描述。'

GATE_EXAMPLES = '''以下只是判断示例，不是当前图像事实：
1. 对应位置一图多出一条线，另一图确实没有：different，不算标注少标。
2. 两图该处线条、纹理相同，但只有一侧有框：图像同内容，标注交后续比较。
3. 平移或曝光变化后，可靠对应位置的细节仍相同：same。
4. 某侧对应位置找不到或局部太模糊：unverified，说明具体原因。
5. 整图轮廓相同，但局部划痕的形状不同：different。'''


def task_prompt_defaults(task_type: ConsistencyTaskType) -> dict[str, str]:
    system, user = (ANOMALY_SYSTEM, ANOMALY_USER) if task_type == 'anomaly_detection' else (BBOX_SYSTEM, BBOX_USER)
    return {'system': system, 'user': user}


def identity_prompt_defaults() -> dict[str, str]:
    return {'gate_system': GATE_SYSTEM, 'gate_user': GATE_USER, 'gate_examples': GATE_EXAMPLES}
