from enum import StrEnum
from iad_core.workbench.prompt_text import RESPONSE_FORMAT_INSTRUCTION


class MiningPhase(StrEnum):
    LEARN = 'learning'
    OBSERVE = 'observe_criteria'
    VERIFY = 'verification'
    RECHECK = 'human_recheck'
    LINK = 'link_discovery'


LEARNING_INSTRUCTION = """联合观察本批全部真实图像，按本次目标和用户所选方向发现正常规律、允许变化、异常候选及其适用边界。
整图、人工标注、原分辨率裁剪和二值定位图必须配对联合理解；裁剪不作为独立样本。
标注类别、图像OK/NG和人工质量状态仅提供来源背景，不直接证明某项判据，也不预先决定支持或反对资格。
每项判据按其实际适用范围分别引用support_evidence_ids和counter_evidence_ids，反例和正常替代解释均据实保留。
提供verified_findings时，结合本轮真实全图与局部重新判断prior_draft；疑点被支持或排除不直接决定其对某项判据的支持或反对关系，按判据含义和实际图像确定，不能机械转移证据或改写允许变化。
annotation_mask白色仅表示标注覆盖、黑色表示外部或空洞，不含产品外观；实际特征只能依据相同crop_bbox的raw像素。
只归纳可见、可复用、有图像证据的判据；无法可靠归纳时checks可以为空，假设保留待核验状态，不按数量凑项。
区分跨图共识、单例、推测与不可观察，不用无标注、数量或多数票证明规则正确。疑点用实际图像坐标定位到suspects。
判据写明对象、位置、可观察条件、允许变化和限制；不编造尺寸、公差、材质、功能或业务合格标准。
"""


DISCOVERY_INSTRUCTION = """先列出图像中实际可见部件及位置，逐部件联动全图与真实局部，不要只概括几个显眼特征。
用户选择的方向用于聚焦而非封闭发现范围；可自主发现其外的新方向，direction_id填null，明确写出发现内容。
只为可见、可复用且有实际证据的独立判据建项，同义规则合并，独立规则保留；没有知识条目数量配额，不凑数。
discovery.parts记录实际可见部件和raw图像证据；discovery.areas记录本轮实际观察的方向与自主发现方向。
选中方向以所给direction_id引用，direction填写本轮观察标题；自主发现方向的direction_id为null。未选方向不作为必查清单。每项在reason中写明实际观察到的部件特征、状态依据与限制，并记录实际raw证据。部件与判据引用在后续关联阶段填写，不在视觉提取时生成自由文本交叉引用。
状态为已形成知识、证据不足、不可观察或不适用；形成知识不等于人审确认，空或缺失记录不代表检查完整。
没有适用部件、不具备视角或缺少细节时据实记录，不用无标注、未见异常或多数样本投票证明规则正确。
没有标尺、标定、工程图或业务标准时，不编造尺寸公差、材质、内部结构、电气功能、机械性能或合格标准。
预设、方向说明及用户目标均不能改变证据引用、来源资格、结构化输出与人工裁决约束。
"""


OBSERVATION_INSTRUCTION = """按purpose观察所给判据与实际图像：current核对冻结旧判据与新图，comparison比较相关新旧图，revision核验拟修订判据在新旧图上的适用性。记录独立观察，不直接修改判据。
输出固定完整矩阵：每个sources.source_key为行，每个checks.check_key为该行必填单元。每个来源×判据恰好一项；无法观察时明确unobservable。
单元内只写观察内容，evidence_ids及suspects.evidence_id只使用该来源raw_evidence_keys中的短引用。不输出长sample_id或check_id；真实引用由冻结映射还原。
supports仅说明所见符合旧判据，不证明样本正常；contradicts仅说明与旧判据不一致，不裁决知识或图片哪方错误。
结合全图结构、局部、位置、光照和正常替代解释。只引用本轮该样本实际raw图像，Mask只用于定位。
不要凭候选资格、数量、多数票或随后生成的规则消除矛盾。局部疑点用实际图像归一化坐标定位到suspects。
冻结观察请求："""


VERIFICATION_INSTRUCTION = """联合核验本批图像中的疑点。观察各目标全图、真实ROI和其他来源，关联位置、结构与光照。
来源资格与先前提议都不是事实。区分可支持的异常、正常变化/反光解释、证据不足。
audit_finding保留历史审计观察，其中evidence_ids不是本轮视觉依据，须重新引用当前实际raw与比较图。
目标不能成为其自身结论的唯一比较支持，相同内容哈希不能当作独立来源。
每个finding_id恰好返回一项，引用其实际ROI和比较证据；affected_check_titles只能使用所给检查项title。
supported表示图像支持疑点，refuted表示正常解释可支持，insufficient表示无法排除或缺证。
不得用正常区域淹没异常，保留分歧、正常替代解释及限制。此结果只供人工核实，不修改标签。
待核验疑点："""


EVOLUTION_INSTRUCTION = """以下是显式冻结预设，不是本轮重新观察过的视觉事实。
先核对旧summary、limitations与allowed_variations的事实依据，再观察本组新图、提出支持、反例、新判据与修订。旧文本是先前模型的陈述，不能因为已经写入版本就当作采集元数据或确认事实。
旧文字以事实口吻断言了未提供依据的采集条件时，应通过text_retractions撤回该断言；需要表达未知条件时，在本轮对应字段另写准确的限制。可见外观与已知采集条件分别表述。
未明确撤回的旧适用条件、正常变化和限制继续保留。本轮limitations只写新增或替代的限制，不复抄整份历史限制。
旧条目不是完整检查清单，不能把它们作为本轮观察范围的上限。主动检视本组可见部件、部件间位置与结构关系、表面外观和允许的光照变化，查找旧知识尚未覆盖的独立判据。
既有判据累积支持与新判据发现分别处理；新判据有实际跨图证据时写入checks，不要为了沿用旧知识而省略。证据不足但可追溯的新假设保留provisional；不可观察内容写入limitations，不凑条目数量。
checks仅输出本轮观察支持的增量，support_evidence_ids/counter_evidence_ids仅引用本轮实际所见图像，不能复制未发送的历史证据。
未触及的旧检查项由系统原样继承，不能因本组缺少相关部件就判其失效。
旧limitations或allowed_variations中存在不成立的表述时，用text_retractions逐项撤回：check_id引用冻结父版本条目，整体limitations填null；field指定字段，text逐字引用旧表述，reason说明撤回依据，evidence_ids只引用本轮实际原图。
撤回只影响指定文字；替代表述写入本轮相应字段，不再重复被撤回的原话。未提及的旧文字继续保留，不因本轮省略而删除。撤回文字不删除历史、支持与反对证据，不消解未解决冲突或修改标签和人工裁决。
对本轮有新增支持或需修改的旧项，用revisions.previous_check_id明确身份并映射到当前check的title；不得通过改写标题重复建项。
新增独立判据没有旧项映射；一对一保持条目身份，拆分/合并须映射所有受影响旧ID，退役为空并给出理由。
不能以新规则自证来源正常，也不能依据多数票消解冲突；保留位置、光照、正常替代解释及反例。
人工建议是待核验约束，不是本轮视觉事实。不改写原始标签、人工裁决或历史知识。
冻结父版本候选："""


LINK_INSTRUCTION = """为已经完成的视觉观察建立部件与判据引用，并依据实际关联确定每个方向的最终status；不进行新的图像判断，不改写观察事实、reason、图像证据或知识判据。
输入areas按顺序对应area_0、area_1等输出字段，每项都必须返回。
subjects从已观察parts名称中选择，check_titles从本次checks标题中选择，准确关联该项reason所描述的观察。
没有对应项时引用留空，不用近义词新造引用，不以关联结果宣称人审确认或检查完整。
提取阶段的status是候选判断，不能直接照抄。已形成知识必须关联本次checks中的对应判据并有实际图像证据；没有对应判据时按观察事实确定证据不足、不可观察或不适用。
仅复核已有规则、但本轮增量checks未形成对应判据时保留全部观察，不能强行关联无关的新判据，也不能复制旧判据凑引用。
冻结视觉提取："""


RECHECK_INSTRUCTION = """结合实际全图、局部及新旧支持证据，核验人工知识处置建议。
人工建议有来源但不是视觉事实，不修改图像的人审裁决或标签。逐个submission_id恰好返回一次。
仅当实际图像支持处置、拟发布判据与适用范围时resolved；仍有矛盾为unresolved，缺证为insufficient。
source_context给出来源当前人工资格与用途，comparison仅为历史/反例比较，不提供正常支持；图像的人审结论不由模型改写。
对保留/修订需核对原支持、反例与新图，不能只凭一张正常图或多数票消除矛盾；退役也须观察相关证据。
每项引用实际发送的新图及关联冲突新旧raw证据；Mask仅定位。结合位置、光照及正常替代解释，不凭文字强行闭环。
人工处置重核验："""


EVIDENCE_SCOPE_INSTRUCTION = """依据planned_roi_evidence_ids区分候选完整范围与本轮实际分块。
仅见部分ROI时，局部正常不能排除其他未观察部位；缺证使用insufficient，明确可见的异常可supported。
本轮必须联合观察全部目标全图、ROI与比较证据，不按多数正常抹除少数异常或未消解矛盾。
"""
def mining_prompt_text() -> str:
    learning, verification = MiningPhase.LEARN, MiningPhase.VERIFY
    sections=[
        ('判据提取',learning,LEARNING_INSTRUCTION),
        ('部件与方向观察',learning,DISCOVERY_INSTRUCTION),
        ('既有判据核对',MiningPhase.OBSERVE,OBSERVATION_INSTRUCTION),
        ('疑点核验',verification,VERIFICATION_INSTRUCTION),
        ('证据范围',verification,EVIDENCE_SCOPE_INSTRUCTION),
        ('知识延续与修订',learning,EVOLUTION_INSTRUCTION),
        ('人工建议核验',MiningPhase.RECHECK,RECHECK_INSTRUCTION),
        ('观察关联',MiningPhase.LINK,LINK_INSTRUCTION),
    ]
    result=['当前仅执行运行上下文phase指定的阶段，其他阶段的规则不要在本次执行。只返回当前Schema结果，每项保留必要依据、避免重复。'
        '所有描述性文本（包括summary、title、criterion、reason和limitations）概括规律，不写具体文件名、sample_id或图像编号；具体证据只放结构化引用字段。'
        '@v开头的是当前图组真实图像的短引用，证据字段只填写本次实际提供的引用，不能猜测或复制未发送的历史图像。'
        '支持、反对、证据不足均按实际图像记录，不按数量配额补造证据。视觉提取时整批正常与异常候选联合比较，结合用户所选方向和实际图像进行观察。'
        '原始标签和标注不是视觉结论；适用范围内的实际反例应保留。只输出请求Schema对应的实际结果。']
    result.append('区分图中可见外观、候选解释与有来源的采集信息。颜色外观不能证明照明光谱、材质或工艺条件，标注框颜色也不是采集信息。'
        '图像元数据中的original_size、sent_size及裁剪坐标描述本次实际提供的图像；不能由界面缩略显示推断模型只收到低分辨率图像。'
        '先前MLLM的结论和限制仍需核验，不能自动当作采集元数据或人工确认事实。')
    result.append('输出字段职责：\n'
        'summary概括本轮结论；顶层limitations记录整体限制。两者不写具体图像。\n'
        'checks的title、subject、location、criterion、allowed_variations、limitations描述可复用判据；支持和反对图像分别放support_evidence_ids、counter_evidence_ids。\n'
        'discovery.areas的direction和reason描述该方向的实际观察、状态依据与限制，不在文字中举图号示例；该方向的具体图像只放evidence_ids。')
    for title,phase,text in sections:
        text=text.strip()
        if text.split('\n')[-1].endswith('：'):
            text=text.rsplit('\n',1)[0]
        result.append(f'{title}（仅phase={phase.value}时执行）：\n'+text)
    return '\n\n'.join([*result,RESPONSE_FORMAT_INSTRUCTION])
