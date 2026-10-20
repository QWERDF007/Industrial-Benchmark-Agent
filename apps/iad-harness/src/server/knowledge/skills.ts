import type { SkillRegistration } from "@deepseek-ai/dsh-skill";

export const KNOWLEDGE_SKILLS: readonly SkillRegistration[] = [
  {
    name: "mine-normal-knowledge",
    description: "挖掘良品知识：从数据集候选良品学习结构、正常变化与检查判据，同时核验可能混入的异常。",
    source: "bundled",
    provider: "iad-harness",
    content: `# 挖掘良品知识

使用项目已有 MLLM 挖掘作业，不在对话中另写一套视觉分析或固定产品检查表。

1. 使用 dataset_list 确认数据集及 dataset_id；只有一个明确目标时直接使用，否则请用户选择，不能猜测。
2. 调用 knowledge_mine_normal，传入 dataset_id；用户明确指定新增来源时才传 sample_ids。后继作业合并父版本仍合格来源并重新核验；默认覆盖全部合格良品，不能自行设置数量或 ROI 预算。
   用户要求修订判据时，先用 knowledge_get 读取当前同类型版本和 check_id；将建议放入 corrections，并传 base_version_id。这是待核验候选，不能当作事实；基准变化时不得静默换版或套用到其他条目。
3. 保存返回的 run_id，通过 knowledge_job_status 查询同一作业。PENDING/RUNNING 仅表示正在执行；收到停止要求时调用 knowledge_job_cancel。
4. 只有返回 knowledge_version_id 才使用 knowledge_get 读取该版本。失败、取消或中断时如实报告完成、失败和未处理数量，不能声称发布成功。
5. 检查规则的支持/反对引用、状态、限制及 findings。必要时使用 knowledge_evidence 按 version_id/evidence_id 查看真正送模的原图或 ROI；不得用重新截图冒充原证据。
6. 简要报告版本、来源覆盖、规则及最多三个优先核实的疑点，附 finding/evidence 引用。良品不足或知识不确定时明确说明。

无标注和人工选取是来源资格，不是确认真值。全图、原生 ROI、Mask 的联合分析、位置/光照解释和容量分组由领域作业执行。不得预设框胶或其他产品类别，不得把颜色定位图当作产品外观，不得改写原标注、人审、原始质量或 Gold。
所得正常版本可作为 mine-defect-knowledge 的显式输入；挖掘知识本身不表示已经完成数据集重审。`,
  },
  {
    name: "mine-defect-knowledge",
    description: "挖掘不良品知识：依据指定良品版本联合核验标注和疑点，区分支持、反驳与证据不足。",
    source: "bundled",
    provider: "iad-harness",
    content: `# 挖掘不良品知识

使用项目已有知识核验与挖掘作业；标注类别只是线索，不直接等于缺陷。

1. 使用 dataset_list 确认 dataset_id。用户指定良品版本时用 knowledge_get 核对；否则读取该数据集当前 normal 知识并展示选用版本，后续明确传 normal_version_id。
2. 若没有可用良品知识，先执行 mine-normal-knowledge，待其发布后再继续；不能跳过正常知识依据或跨数据集套用规则。
3. 调用 knowledge_mine_defect，传 dataset_id 与冻结的 normal_version_id；只有用户指定新增来源时传 sample_ids。后继作业合并父版本仍合格来源并重新核验；默认核验全部合格异常候选，不设人为图片/ROI 上限。
   用户要求修订判据时，先用 knowledge_get 读取当前 defect 版本和 check_id；将建议放入 corrections 并传 base_version_id。修订仍须图像核验，不能直接改写已发布知识；基准变化时不得静默换版。
4. 保存 run_id，通过 knowledge_job_status 查询同一作业，停止时调用 knowledge_job_cancel。运行中不能随良品知识头更新而切换依据。
5. 用返回的 knowledge_version_id 调用 knowledge_get；按需用 knowledge_evidence 读取实际证据。区分 supported、refuted、insufficient，保留正常反光/变化的解释与限制。
6. 简要报告正常/不良版本、覆盖及最多三个需要复核的 finding/evidence 引用；没有核验正例时报告知识缺失或待验证假设，不能虚构已验证异常类别。

全图、真实原生 ROI、二值标注图与冻结知识的联合核验由领域作业完成，不为每个 ROI 在对话中重复全图分析。模型输出只是建议，不得改写人审、原标注、原始质量或 Gold；知识挖掘成功也不等于已完成数据集重审。`,
  },
];
