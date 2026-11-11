import type {Context} from '@deepseek-ai/cordis';
import {defineTool} from '@deepseek-ai/dsh-tools';
import {explorationCommitParameters,explorationFinalizeParameters} from '../../shared/analysis-agent.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {workbenchJsonOutput} from '../tool-output.js';

export function registerExplorationTools(scope: Context, bridge: PythonBridge, runId: string) {
  scope.tools.register(defineTool({name: 'exploration_commit', description: '主Agent提交首批观察，或一次复核当前波全部子代理报告并更新全局目录。role=reviewer时，observations传[]，round_id使用当前上下文round.round_id；report_reviews逐份填写reports中各报告的round.round_id及discovery_decisions，逐项覆盖该报告全部候选，无候选也提交空数组。宿主一次导入整波已核验观察，保留各图原批次，不把文字汇总算作主Agent看图。new填写本次新方向ID，merge填写兼容目标及部位/现象/动作/条件一致的理由，reject说明实际证据或可见性限制。后续仍可新增任意数量的独立方向，不受首批目录数量限制。首批建立目录及每波复核时，按实际解释作用更新key_evidence，良品可说明正常结构、比较基准或相容变化；不按图级身份设配额，不要求良品和异常同时入选，也不把良品精选推迟至定稿。可比较正常对照用support或allowed_variation关联，不把正常对照当实质反例。提交当前轮待处理登记的实际观察与方向目录变更。observations使用analysis_context.round.targets的dataset_id及sample_id，每项填写description并引用该登记已送达的完整原图evidence_id；局部归属原登记，不新增样本观察。report_preparation_error仅对应材料回执中实际存在的error，不能把不确定或工具尚未读取记作取证失败。原图及全部必需局部实际送达并成功提交才计覆盖。directions只填新增或修改条目，未变方向传[]并由服务端保留；仅增加论据可只填arguments。改变已有instruction、rationale、适用条件或limitations时填写change_reason，先用analysis_arguments分页读齐该条目旧有效论据，再在arguments逐项按observation_id、evidence_id及role说明保留、解释或移出范围的理由；旧论据不能因本批未出现而省略复核。新增论据只引用本次或已保存的实际观察，新观察可省observation_id由宿主绑定。可分多次提交，末轮也可以新增方向；合并填写来源ID和共同检查动作，服务端保留来源及反例。成功回执返回revision、覆盖与完成状态并结束本次调用轮次；校验失败全部回滚，按回执修正重提。',
    parameters: explorationCommitParameters, output: workbenchJsonOutput,
    execute: async (submission, execution) => {
      const result = await bridge.execute('analysis_agent_commit', {run_id: runId, submission}, execution.signal);
      execution.concludeTurn();
      return result;
    }}));
  scope.tools.register(defineTool({name:'exploration_finalize',description:'目标耗尽后，在原Session按页定稿全部方向，含早期及末批发现。先读analysis_context的定稿上下文；base_revision始终使用锁定值，不以递增revision替代。按pending_entry_ids读取analysis_catalog及analysis_arguments，核对每项完整有效支持、正常对照、实质反例、范围、限制与未决项，必要时analysis_evidence回看。directions只提交本页复核的完整条目，其他保留；改写主张、适用条件或限制需change_reason并逐一复核全部既有有效论据，arguments补齐实际作用理由。key_evidence核对观察阶段已有选择，按实际解释作用保留或更新少数完整原图，最多4张；良品与异常均可入选，不要求两组同时入选，缺少良品不影响定稿。重要反例必须有代表，不以精选数量推算证据强度。未决内容仅限实际可见性、可比条件及对照不足，不请求类别释义或工艺标准，不罗列未证实成因。失败本页全部回滚；按错误修正重提，不假设部分成功。全部pending_entry_ids复核后以complete=true提交整个作业的摘要、仍有效的限制和未决项并原子发表；无可靠方向可空集，摘要仍说明实际观察及原因。回执提供正式version_id，成功后结束本轮。',
    parameters:explorationFinalizeParameters,output:workbenchJsonOutput,execute:async(submission,execution)=>{
      const result=await bridge.execute('analysis_agent_finalize',{run_id:runId,submission},execution.signal);
      execution.concludeTurn();return result;
    }}));
}
