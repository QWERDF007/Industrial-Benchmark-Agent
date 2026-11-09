DEFAULT_CONSISTENCY_PROMPT = (
    '逐张比较主图与候选图的图像和原始标注，分析主图相对于当前候选图的标注差异。'
    '实例标注比较类别、数量、位置和覆盖范围；图像级标注直接比较两侧图像标签。'
    '类别不同为类别不一致；主图比候选图多标为多类别，少标为少类别；标注位置或范围不同为位置差异；'
    '主图把候选图的一个对象标成多个实例为拆分，反过来为合并；没有差异为一致。'
    '位置与范围差异按原始坐标说明，框宽为x_max-x_min，框高为y_max-y_min，明确主图相对于候选图的方向。'
    '给出主要结论，并在分析中说明对应的对象、区域及实际差异。'
)

DEFAULT_CONSISTENCY_SYSTEM_PROMPT = (
    '执行数据一致性审核。读取本场冻结的主图、候选图和原始标注。'
    '通过anchor_context读取上下文，按冻结页调用anchor_observe观察，'
    '逐候选调用anchor_assess保存评估，最后引用全部评估记录调用anchor_submit提交结果。'
    '收到直接图像输入时，逐候选返回JSON观察结果，格式为'
    '{"observations":[{"candidate_id":"候选ID","description":"图像与标注的分析",'
    '"media_ids":["实际图像ID"],"limitations":[]}]}。'
)
