export const AUDIT_DATA_CONSISTENCY_SKILL = {
    name: 'audit-data-consistency', source: 'bundled', provider: 'iad-harness',
    description: '查当前图的全库候选、执行用户指定的数据一致性范围、继续原批次，或解释冻结图像与标注差异。',
    content: `先区分用户意图，所有结论以实际引用、覆盖及图片为依据。
1. 当前图查询：dataset_list/图像引用确认来源，image_retrieve 使用真实 sample_id 或当前会话附件，检索库默认全部登记集。只查询时不启动全库建库或批次；缺索引报告覆盖，用户要求准备时 image_index_prepare。
2. 全库/范围检查：用户明确要求时 consistency_start；subjects 和 corpus_scope 独立，默认 exact。request_id 固定到同一请求，双击/重发不得换 ID 制造重复任务。consistency_status 读取真实完成/失败/未处理，RUNNING/PENDING 不是完成。用户要求停止用 consistency_cancel，继续原任务用 consistency_retry，沿原引用，不自行扩展范围或重扫。
3. 查看结果：consistency_query/report 的 selection 为 batch 或 scope。当前、历史、未知分别呈现；TOP_K 只覆盖实际召回候选，不说全库没有冲突。consistency_groups/group_members 按同一个 query_id 分页，不能只读首批就说全组无差异。
4. 解释差异：consistency_context 核对真实 result_id/evidence_id 和可选 difference_ids/return_location，工具会返回真正可读的原图、两侧标注层和同位置局部附件。EXACT 共享原图只发一份；虚线仅是另一来源参考，不是本图已存在标注。原始质量、模型推断、人工复核和规范分开。不得凭文件名、OK/NG或另一副本的FAIL猜测图像真值。
5. 用户明确要求当前图组的模型解释且已有query_id/group_id时，consistency_group_analyze以固定request_id执行完整组验证；consistency_group_analysis读取真实状态、保存结论及引用。只有COMPLETED且有结构化结果才说已分析，失败/未运行/超预算保留原事实，不能用首批候选冒充全组。不为普通单图查询自行启动模型组分析。
6. 按上下文的 next_cursor 读取剩余差异；remaining_differences/unselected_differences 为未解释范围，超过图片/文本预算明确说明限制并分页。缺证就保留未知，不臆测附件。consistency_evidence 查看冻结目录，必要时 consistency_evidence_media 按媒体引用读取附件，consistency_evidence_export 获取真实证据产物。
7. review_context 中的处置动作、实际 review_events 与修正检查为人审引用；review_state 与 correction_state 分别解释，已裁决不等于源标注已修复。VERIFIED 只说明指定建议在重新扫描与比较后已核实，待补依据仍可保留。回答分别列出像素/几何确定事实、可解释推断、待补规范或人审；保留返回证据链接及同一 return_location。不启动未请求的知识挖掘、模型审计或人工裁决，不改原标注、Gold 或人审。`,
};
