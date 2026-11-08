from iad_core.consistency.group_analysis_conclusions import CONCLUSION_CATEGORIES


GROUP_DIRECTION_INSTRUCTION = (
    '比较方向：anchor始终是主图，candidate是参考图。所有差异以主图相对于当前参考图为准。'
    'conclusion和overall.text的冲突结论只能精确单选：' + '、'.join(CONCLUSION_CATEGORIES) + '。'
    '不添加主图、标注、视觉、基本、可能、疑似等前后缀，不加标点，不使用或、斜线、顿号等连接多个结论。'
    '在有效、穷尽且非忽略的可比域内，主图0个标注而参考图1个标注为少类别；反过来为多类别。'
    '主图同一对象多个框、参考图一个框为拆分，反过来为合并；同一对象类别值不同为类别不一致；位置或覆盖范围不同为位置差异。'
    '已确认多种差异时选择最主要的一种作为唯一结论，其他实际差异完整写在explanation、findings及conclusions。'
    'MATERIAL的categories必须是仅包含conclusion同名分类的单元素数组。'
    '类别、数量、位置和范围全部对应时，verdict为EQUIVALENT，conclusion和overall.text精确写一致，categories为空数组。'
    '缺少关键标注来源、覆盖或可比内容时用UNCERTAIN，conclusion及overall.text为null，categories为空，分析写明具体限制。'
    'annotation_availability区分有效空标、未提供、读取失败和未知；只有有效空标才是已知0个标注。'
    'annotation_applicability记录覆盖与共同可比域限制；PARTIAL、UNKNOWN或ignore不能支持所限制区域的缺标推断，原始数量差异仍保留。'
    '不裁决哪一侧标注正确，不能因为无法判断漏标还是另一侧多标而拒绝给出主图相对参考图的增减方向。'
    'explanation、findings及所有正文只用主图、参考图等自然语言称呼，不能附带@c0、@c1、文件名或具体引用；这些引用仅用于结构化引用字段。'
)


DEFAULT_CONSISTENCY_PROMPT = (
    '逐主图核对全部入选候选的标注一致性，查看两侧原图、原始标注及适用原像素局部。'
    '区分标注数据差异、可见现象与实物本身的状态差异；相似度不证明同一实物或缺陷真值。'
    '不同实物先建立可比现象，真实外观变化可以解释标注差异。位置差异须有同图像素证据或可靠配准，'
    '归一化标注布局不能代替配准。类别仅按明确映射比较，不以出现频数裁定哪侧正确。'
    + GROUP_DIRECTION_INSTRUCTION
    + '逐候选覆盖完整并保留具体证据、限制与其他发现。存在MATERIAL时整场为MATERIAL，否则有关键领域证据不足则为UNCERTAIN，其余EQUIVALENT。'
    '原始程序事实与模型结论、人审分别保存，不修改原标注、人审或Gold。'
)
