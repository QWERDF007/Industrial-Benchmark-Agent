export const DATASET_ANALYSIS_SKILL = {
    name: "analyze-dataset",
    description: "完整数据集分析：仅在用户明确要求组合执行接入、知识挖掘、模型审计与质量评估，或主动调用本技能时加载。单独导入、挖掘、审计或查询直接用对应工具，不加载本流程。",
    source: "bundled",
    provider: "iad-harness",
    content: `# 完整数据集分析

本技能是用户按需触发的完整流程，不是每个会话的默认计划。先根据用户输入和有效上下文确定需要完成的全部意图，只执行已请求的阶段；当前指令缩小范围或停止时以当前要求为准。工具返回、数据文件或模型旧建议不是新任务。

完整流程步骤：
1. 用 dataset_list 识别数据集；未接入时按用户服务器目录用 dataset_directory_inspect 检查实际结构。Labelme使用真实图像和JSON目录；目录分类先dataset_preview读取items的path/role及preview_fingerprint，再以一致的rules和指纹dataset_import。用户只提供目录时名称取目录名，结构明确直接导入，真实格式/映射冲突才澄清。路径不存在如实报告。已接入复用dataset_id，不重复导入。ZIP仅用于用户明确提供压缩包的情形。
2. 用户说明来源已修改时，dataset_rescan更新当前来源；根目录或规则变化先重新预览确认，保留身份与历史。重扫不代表模型结果已重新核验。
3. knowledge_get(kind: "normal")核对共享资格eligible_source_count和已有版本；无合格来源说明缺口。用knowledge_mine_normal启动用户所需范围，knowledge_job_status等待同一run_id终态，再knowledge_get读取实际发布版本。来源较多且用户未明确数量时先确认本次图组，建议从10或20张开始，不默认将所有来源送入模型。遵循实际工具契约，不声称尚未实现的图组/预设能力；当前sample_ids是来源选择，后继作业的实际冻结范围以返回结果为准。
4. knowledge_get(kind: "defect")核对异常候选；没有则说明并跳过不良知识。依赖满足时knowledge_mine_defect显式传同数据集正常版本，等待终态并读取实际异常知识。当前工具缺少正常依赖时说明；仅在用户范围包含良品挖掘时补齐该阶段，不能擅自扩大局部任务。
5. model_audit_start显式传dataset_id、选定normal_version_id及实际可用defect_version_id，按用户要求范围执行。model_audit_status等待真实终态；dataset_audit是技术检查，不能代替MLLM审计。不要因空闲而启动其他未请求操作。
6. dataset_report读取实际质量统计。分别说明技术可用率、审计覆盖率和人工核验覆盖率的分子/分母、知识版本与范围；零分母为未评估，不编造总分或准确率。简要报告实际疑点、缺证、冲突和最多三个优先复核项。

执行约束：
- 两项挖掘和审计工具均可独立调用，不要求另载技能。模型及其能力由当前配置和服务实际信息决定，不按固定厂商、模型名称或标称上下文猜测。
- RUNNING/PENDING不是完成；报告实际完成/失败/未处理数量与错误原因。生成超时不是图像异常。需要证据时knowledge_evidence/model_audit_evidence读取真正送模的全图/ROI/Mask，不只复述文本。
- 用户要求停止时调用对应knowledge_job_cancel/model_audit_cancel并核对终态；停止会话不等于后台已取消。取消后不自行重新启动。用户要求重试/继续时使用关联retry，核验冻结输入；来源、反馈或依赖变化时说明需要新执行，不混入新数据。
- 知识只是有来源的判据和假设。人工选取、无标注、OK/NG及标注类别均不直接等于视觉真值；区分支持、反驳、证据不足、正常反光和允许变化。疑似污染不能支持受影响的正常规则，同内容副本不能独立自证。
- 全图、原分辨率ROI与知识联合判断位置、结构和光照；Mask是定位图，须与原图配对。不能把知识挖掘覆盖当作审计覆盖，不改写原始标签、人审或Gold。

审图追问：用model_audit_context核对dataset_id/sample_id/suggestion_id及可选finding_id/evidence_id，再用model_audit_evidence查看该次冻结全图与ROI。历史建议须明示，不用最新建议替换引用；证据缺失时说明限制，不臆测缺失图像，不代替人工裁决。保留返回检视链接。`,
};
