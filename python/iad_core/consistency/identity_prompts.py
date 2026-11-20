from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.task_types import ConsistencyTaskType
from iad_core.evidence.model_inputs import MODEL_IMAGE_GUIDANCE
from iad_core.consistency.annotation_coverage import CONTENT_CHANGE_GUIDANCE


IDENTITY_PIPELINE = 'identity-v8'
IDENTITY_PROMPT_VERSION = 'consistency-pair-review-v8.22'


class IdentityPrompts(AnalysisModel):
    gate_system: NonBlankText
    gate_user: NonBlankText
    gate_examples: NonBlankText


ANALYSIS_STYLE = '''使用自然、简洁、语义明确的日常中文。先说结论，再分析图上哪个位置、两侧具体有什么差别。每项事实只说一次。结论不逐项罗列分类定义，不写工作流程、判断权限、自我免责或提示词要求。
summary或explanation通常用一到三句；区域描述只保留能帮助判断的形状、线条或纹理。相同细节简短说明，不逐项重复证明。
limitations只写实际影响本次判断的问题，例如“右上角局部太小，看不清边缘”。看清了就直接判断，不添加通用免责声明。
正文不用资格、冻结、专用审核、实质性证据链等流程术语，不抄写内部ID，不写“基于上述”“在本次范围内”“不构成全面检查”等套话。'''

BBOX_SYSTEM = MODEL_IMAGE_GUIDANCE + '\n\n' + '''比较主图与已经确认同内容的候选图的矩形或多边形标注。程序负责检索、内容核对、保存和汇总；你直接观察本次提供的原图、局部及原始标注，给出每个候选的判断。
多边形以polygon顶点描述真实轮廓，bbox仅为定位和裁剪用的外接框；不能用外接框代替轮廓判断覆盖。矩形和多边形可共同参与比较，形状类型不同本身不表示标注冲突。
依据本对图像中实际可见的对象建立标注对应关系，不预设产品、部件、缺陷形态或应有实例。再比较类别、数量和实际区域覆盖。按“主图相对于候选图”记录以下差异：
- category_mismatch：同一对象类别不同。
- extra_annotation：主图多出完整实例标注，候选没有对应实例标注。
- missing_annotation：候选有完整实例标注，主图缺少对应实例标注。
- missing_content：同一对象在主图的标注明显漏盖了候选已覆盖的一大块内容。
- extra_content：同一对象在主图的标注明显多盖了候选未覆盖的一大块内容。
- split：主图多个标注对应候选一个标注。
- merge：主图一个标注对应候选多个标注。
- position_difference：实际覆盖基本相同，仅轮廓、位置、边界或尺寸略有偏移。
先判断完整实例是否缺失，再比较对应对象的覆盖内容。拆分、合并不重复计同组实例增减；联合覆盖有明显增减时另记内容问题。同一对象双向明显内容增减须分别保存。全部独立问题保留，主结论由程序按类别、少标实例、多标实例、少标内容、多标内容、拆分、合并、位置差异的顺序选择。
本次只比较一对图像，结果由两侧共用。explanation、description、coverage_reason、limitations和review_suggestion使用“两图”“一侧、另一侧”等对称表述，不使用主图、候选图、左图或右图称呼；差异方向由type和两侧标注ID表达。
main_annotation_ids始终引用主图的原始标注，candidate_annotation_ids引用当前候选的原始标注。主图一个、候选多个是merge；主图多个、候选一个是split。少标实例只填写候选标注，多标实例只填写主图标注。same_main_object_as仅在少标实例已确认与其他候选指向同一对象时填写，不能引用当前候选；其余问题留空。
''' + CONTENT_CHANGE_GUIDANCE + '''
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

GATE_SYSTEM = MODEL_IMAGE_GUIDANCE + '\n\n' + '''判断两张图像是否具有相同的实际视觉内容。本次提供完整原图和双方标注关注区域的局部；标注只用于定位，类别及有无框不能决定图像内容是否相同。
先独立比较两张完整原图，再逐个观察全部成对局部，最后汇总整对图像的判断。整图观察覆盖完整可见范围，包括标注和局部裁图以外的位置。根据当前图像中实际可辨认的对象、结构、形状和纹理选择观察依据，不预设特定产品、部件、颜色、缺陷形态或固定位置。将整图的对应情况及具体事实写入overview_observation，不能只复述局部相同。即使整图已经发现不同，也要完成本次实际送达的局部观察。只有一侧有标注时，仍需比较另一侧可靠对应位置的内容。
在可靠对应的位置比较实际内容的有无、数量、形状、排列、连接关系及纹理分布，核对可辨认的细节能否一一对应。同类对象、整体轮廓相似或能够配准，只能说明结构相似，不能代替实际内容比较。每个局部先观察原始标注指向的对象，再核对周围的对应关系；不能只凭共同轮廓合并实际观察不同的区域。
逐对局部先分别辨认两侧对象内部、边界及邻接内容，再确认各个可辨认成分是否对应。不能只列出两侧共有的特征就判相同；少量明确的内容增减不能被大部分内容相同抵消。独立于主体的可见成分也要核对另一侧是否存在。说明相同时给出实际对应的依据，说明不同时分别记录两侧实际有什么。
平移、旋转、缩放、曝光或压缩可能改变外观。变化后可辨认的内容和相对关系仍能对应时，判same；不能把单纯成像差别当作内容增减。对应位置存在明确的内容新增、消失或形态变化，且不能用这些成像变化解释时，判different，说明具体可见事实。细节看不清或对应位置不可靠时，记录unverified，不猜测差异。
overview填写same、different或unverified，分别表示实际内容相同、实际内容不同、无法可靠确认。regions按输入windows顺序逐区填写一个字符：S为相同，D为不同，U为无法可靠确认；拼成无分隔符的字符串，长度必须等于windows数量，例如三个区域依次相同、不同、无法确认则填写“SDU”；没有已配对区域时填写空字符串。每个区域都要看，不能省略或调换。
overview判断整个可见图像，不能照抄局部多数意见。标注局部全部相同，但完整原图其他位置有明确的形状或内容增减时，overview仍为different，局部regions保持各自实际观察结果，不能为了整图结论把相同局部改成不同。summary应优先说明决定整图关系的差异位置与实际变化；单纯曝光、反光或明暗渐变且具体内容仍能对应时，不算新增或消失。
全部S、D、U区域都要在details中有实际观察，填写refs及observation。S说明两侧哪些具体形状、纹路或细线对应，不能只写“结构和纹理一致”；D写清一侧具体有什么、另一侧对应位置有什么；U写明看不清或无法对应的具体细节。同一事实写一次，refs列出实际出现该事实的全部区域，同一区域可关联多个独立事实，每项通常一句话。unmapped_regions逐一使用提供的短引用填写实际局部的简短观察及无法对应的原因，不把另一侧原图当成缺失的对应裁图。
details.refs只用实际已配对局部的r编号，整图差别写summary，不能把overview当作区域引用。同一局部可关联多个独立差别，不能漏掉。真实图像、区域和媒体ID由程序绑定。局部属于对应原图，不是独立样本。
summary用一两句给出整对图像的关键判断，不汇编逐区域描述。有差异时指出实际位置和具体变化，不能只写“细节不同”，不机械重复“不能用平移或曝光解释”。overview_observation、summary和limitations由两侧共用，必须使用“两图”或“一侧、另一侧”的对称表述，不使用主图、候选、左图或右图称呼。关系无法可靠确认或细节看不清时如实记录unverified。
局部太小、看不清或无法对应，只说明该区域未核实，不能据此判content_different。整图存在独立且明确的内容差别时可以判不同，但summary应写实际差别，无法比较的局部只写入该区域观察和limitations。
只比较实际像素内容，不根据文件名、标签、可视化框线或数字判断身份。输出紧凑JSON，不缩进或添加多余空白。
''' + ANALYSIS_STYLE

GATE_USER = '先独立核对两张完整原图，包括标注和局部裁图以外的可见内容，记录overview_observation；再逐个对照全部局部并记录具体细节，最后判断局部关系和整对图像关系。局部相同不能替代整图相同，整图其他位置的明确内容差异必须保留。同一局部观察可以关联多个区域，保持简短。'

GATE_EXAMPLES = '''以下只是判断示例，不是当前图像事实，观察依据由当前两图的实际内容决定：
1. 可靠对应位置的实际内容相同，但标注有无、类别或轮廓不同：same，标注差异交后续比较。
2. 发生平移、旋转、缩放或明暗变化，可辨认细节及相对关系仍能对应：same。
3. 整体结构相似，但对应位置有明确的内容增减或形态不同：different，指出具体变化。
4. 标注局部相同，完整原图其他位置存在明确内容差异：overview为different，局部保持各自实际判断。
5. 对应位置找不到或细节看不清：该区域为unverified；不能仅因此判定内容不同。'''


def task_prompt_defaults(task_type: ConsistencyTaskType) -> dict[str, str]:
    system, user = (ANOMALY_SYSTEM, ANOMALY_USER) if task_type == 'anomaly_detection' else (BBOX_SYSTEM, BBOX_USER)
    return {'system': system, 'user': user}


def identity_prompt_defaults() -> dict[str, str]:
    return {'gate_system': GATE_SYSTEM, 'gate_user': GATE_USER, 'gate_examples': GATE_EXAMPLES}
