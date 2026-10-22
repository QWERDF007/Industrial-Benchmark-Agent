import hashlib
import json
from typing import List, Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel


class MiningDirection(AnalysisModel):
    direction_id: str = Field(min_length=1, pattern=r'\S')
    title: str = Field(min_length=1, pattern=r'\S')
    instruction: str = Field(min_length=1, pattern=r'\S')
    enabled: bool = True
    origin: Literal['preset', 'dataset'] = 'dataset'


class MiningPromptConfiguration(AnalysisModel):
    objective: str = Field(min_length=1, pattern=r'\S')
    directions: List[MiningDirection]

    @model_validator(mode='after')
    def unique_directions(self):
        ids = [item.direction_id for item in self.directions]
        titles = [item.title.strip().casefold() for item in self.directions]
        if len(ids) != len(set(ids)) or len(titles) != len(set(titles)):
            raise ValueError('挖掘方向的编号和名称不能重复')
        return self

    def render(self) -> str:
        directions = [f'{item.direction_id} | {item.title}：{item.instruction}' for item in self.directions if item.enabled]
        return '挖掘目标：' + self.objective + '\n用户选择的观察方向：\n' + '\n'.join(directions)


class FrozenMiningPrompt(AnalysisModel):
    configuration: MiningPromptConfiguration
    instruction: str
    signature: str = Field(pattern='^[a-f0-9]{64}$')

    @classmethod
    def capture(cls, configuration: MiningPromptConfiguration):
        instruction = configuration.render()
        return cls(configuration=configuration, instruction=instruction, signature=cls.signature_for(configuration, instruction))

    @staticmethod
    def signature_for(configuration: MiningPromptConfiguration, instruction: str) -> str:
        return hashlib.sha256(json.dumps({'configuration': configuration.model_dump(), 'instruction': instruction},
                                        sort_keys=True, ensure_ascii=False).encode()).hexdigest()

    @model_validator(mode='after')
    def valid_signature(self):
        if self.signature_for(self.configuration, self.instruction) != self.signature:
            raise ValueError('冻结挖掘提示词内容与签名不一致')
        return self


DEFAULT_DIRECTIONS = tuple(
    MiningDirection(direction_id=key, title=title, instruction=instruction, origin='preset')
    for key, title, instruction in [
        ('shape', '整体形态', '轮廓、长宽比例、对称性、弯曲、翘曲的可见外观，整体与局部关系。'),
        ('parts', '部件组成', '可见部件的存在、数量、排列、方向、重复单元、对应与共现关系。'),
        ('geometry', '位置与几何关系', '相对位置、间距、对齐、平行、同心、接触、间隙及可见遮挡，不凭透视图推断精密尺寸。'),
        ('assembly', '装配与配合', '接缝、贴合、错位、露出、插接、扣合、紧固件及装配完整性的可见线索。'),
        ('connections', '连接与走线', '引脚、触点、导线、焊盘、轨迹、交叉与连接分布；只能描述可见连接外观，不推断电气导通或功能。'),
        ('edges', '边缘与开口', '边缘连续性、孔、槽、齿、缺口、开口内外、堵塞、毛刺、崩边与局部残缺的可见迹象。'),
        ('integrity', '表面完整性', '裂纹状线条、划痕、磨损、压痕、凹坑、凸起、破损及其与结构边界的关系。'),
        ('texture', '纹理与表面加工', '纹理方向、周期、粗细、颗粒、纤维、加工纹路、光泽一致性及正常局部变化。'),
        ('coating', '颜色与覆盖层', '颜色分布、斑点、色差、涂覆、镀层或膜层的可见连续性、露底、起皮；材质与化学成分不由颜色证明。'),
        ('cleanliness', '清洁与异物', '颗粒、纤维、污迹、残胶、油状痕迹、附着物、孔隙内遮挡及可能的正常反光解释。'),
        ('process', '工艺痕迹', '适用时观察胶路、焊缝、焊点、切边、冲压、注塑、浇口、飞边、溢胶、覆盖连续性和分布；不凭外观宣称强度或工艺合格。'),
        ('markings', '标识与图案', '字符、标志、印刷、刻印、编码区域的存在、位置、朝向、清晰度、缺笔、重影及图案重复关系；无业务依据不判定编码内容正确。'),
        ('packaging', '柔性部件与包装', '适用时观察折痕、褶皱、封边、封口、薄膜、边缘卷曲、褶叠及其正常变化。'),
        ('logic', '多实例与逻辑关系', '多个对象的数量、槽位、组合、左右对应、顺序和相互位置；仅在跨图证据支持时形成约束。'),
        ('imaging', '成像与允许变化', '视角、旋转、尺度、光照、高光、阴影、曝光、透明/反射、景深、模糊、遮挡和背景；区分产品变化与成像变化，不假设未提供的背面或其他视图。'),
    ]
)

DEFAULT_OBJECTIVES = {
    'normal': '联合比较当前候选良品图组，充分发现有跨图支持的正常外观规律、允许变化和适用边界，同时识别候选池中的整图或局部疑点。',
    'defect': '联合比较异常候选及实际可用的正常知识和比较图，发现异常外观判据、正常替代解释和适用边界；无正常基准时只整理待核验假设。',
}
