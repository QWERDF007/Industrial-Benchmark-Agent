from datetime import datetime, timezone
from uuid import uuid4

from iad_core.exploration.models import ExplorationPromptPreset, ExplorationPresetEdit, FrozenExplorationPrompt
from iad_core.storage.database import Database


_BUILTINS = ({'id': 'general',
  'name': '通用对比探索',
  'text': '联合观察本次全部候选良品与异常图像，探索值得后续检查的方向。\n'
          '从真实可见的共性、差异、结构关系、正常变化与观察限制出发，不套用固定缺陷分类，不凑方向数量。\n'
          '候选角色仅是来源线索，可能存在错标、污染或成像差异；不能把 NG、标注或外观差异直接当作缺陷。\n'
          '每项方向说明后续应观察或比较什么，明确适用于良品、异常或两者，并引用本次真实图像 evidence_id 说明依据与限制。\n'
          '合并同义方向；证据不足时可以不提出方向。不虚构尺寸、材质、物理功能或不可见部位。\n'
          '只输出候选检查议题，不声称完成质量判定、知识挖掘或人工确认。'},
 {'id': 'variation',
  'name': '正常变化与成像差异',
  'text': '联合比较本次良品与异常图组，重点探索正常外观变化与成像变化可能混淆判断的方向。\n'
          '观察亮度、反光、视角、位置和可见遮挡在各图中的变化；仅讨论图像实际支持的现象，不推断未知拍摄条件。\n'
          '比较同类变化是否同时存在于两组，不因出现于候选良品就认定为正常，也不因出现于候选异常就认定为缺陷。\n'
          '提出后续需要对照哪些区域、哪些样例及需要补充什么证据，标明适用范围和局限。\n'
          '每项引用本次真实 evidence_id；合并同义项。证据不足可返回空方向，不将探索结论直接作为质量规则。'},
 {'id': 'surface',
  'name': '表面与局部差异',
  'text': '联合观察本次两组图像，探索表面与局部可见差异中值得进一步核查的方向。\n'
          '关注纹理、边缘、覆盖、颜色和局部痕迹的共性与差异；这些是可选观察线索，不是必须填满的缺陷类别。\n'
          '将疑似局部差异与反光、模糊、阴影和遮挡进行对照；不把所有污点、划痕样外观直接判为异常。\n'
          '每项描述可执行的比较位置与观察方法、两组中的支持或反例、适用范围及不可辨认的限制。\n'
          '仅引用本次 evidence_id，不虚构不可见细节或像素外的物理尺寸。允许无方向；不输出已确认缺陷结论。'},
 {'id': 'assembly',
  'name': '结构与装配关系',
  'text': '同时比较本次候选良品和异常图组，探索结构、组成及相对位置关系中的可观察检查方向。\n'
          '从图像实际出现的轮廓、部件数量、位置、间距、连接和遮挡关系出发，不预设具体产品结构或必有缺陷类别。\n'
          '区分姿态与视角变化、可见性不足和可能的结构差异；不凭图像臆测装配规范、内部功能、材质或绝对尺寸。\n'
          '为各方向提出后续对照方法，说明适用于哪组或两者，引用真实 evidence_id 及不确定性。\n'
          '合并重复方向；证据不足允许返回空结果。探索方向仅供后续选择，不直接改变质量标签。'})


class ExplorationPrompts:
    def __init__(self, db: Database):
        self.db = db

    def list(self) -> list[ExplorationPromptPreset]:
        with self.db.connection() as conn:
            rows = conn.execute('SELECT id,name,text FROM exploration_prompt_presets ORDER BY created_at,id').fetchall()
        return ([ExplorationPromptPreset(**preset, builtin=True) for preset in _BUILTINS]
                + [ExplorationPromptPreset(**dict(row), builtin=False) for row in rows])

    def default(self) -> FrozenExplorationPrompt:
        preset = self.list()[0]
        return FrozenExplorationPrompt(preset_id=preset.id, preset_name=preset.name, text=preset.text)

    def create(self, edit: ExplorationPresetEdit) -> ExplorationPromptPreset:
        edit = ExplorationPresetEdit.model_validate(edit)
        name = edit.name.strip()
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            names = [p['name'] for p in _BUILTINS] + [r[0] for r in conn.execute('SELECT name FROM exploration_prompt_presets')]
            if any(existing.casefold() == name.casefold() for existing in names):
                raise ValueError('已有同名预设，请换一个名称。')
            preset = ExplorationPromptPreset(id='custom_' + uuid4().hex, name=name, text=edit.text, builtin=False)
            conn.execute('INSERT INTO exploration_prompt_presets(id,name,text,created_at) VALUES(?,?,?,?)',
                         (preset.id, preset.name, preset.text, datetime.now(timezone.utc).isoformat()))
        return preset
