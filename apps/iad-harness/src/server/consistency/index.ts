import type {Context} from '@deepseek-ai/cordis';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {ContentBlock} from '@deepseek-ai/dsh-llm';
import type {ImageAttachmentRef} from '@deepseek-ai/dsh-attachment';
import type {Session} from '@deepseek-ai/dsh-session';
import type {ConsistencyContext} from '../../shared/domain.generated.js';
import {groupAnalysisStartParameters,galleryReferenceParameters,consistencyStartParameters,imageIndexPrepareParameters,consistencyCompareParameters,consistencyContextParameters,
  consistencyBatchParameters,consistencyRetryParameters,consistencyMediaParameters,consistencyQueryParameters,
  consistencyGroupParameters,consistencyGroupMemberParameters,consistencyEvidenceParameters} from '../../shared/consistency.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {readEvidenceAttachment} from '../evidence-attachment.js';

type Attachment={media_id:string;attachment:ImageAttachmentRef};

export function createConsistencyTools(bridge:PythonBridge,ctx:Context){
  const knownImages=new WeakMap<Session,Map<string,ImageAttachmentRef>>();
  return [
    defineTool({name:'consistency_group_analyze',description:'仅明确要求解释当前冻结图组时执行模型分析，复用既有作业与模型配置。完整读取组成员和冻结证据，结论引用经核验后保存；不写人审、原标注或Gold。相同request_id重用原作业。',parameters:groupAnalysisStartParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_group_analyze',{request:args,origin_session_id:exec.agent?.session.id},exec.signal)}),
    defineTool({name:'consistency_group_analysis',description:'只读当前冻结图组的真实模型分析状态与已保存结构化引用。没有完成结果时不得宣称已分析。',parameters:galleryReferenceParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_group_analysis',args,exec.signal)}),
    defineTool({name:'image_index_prepare',description:'仅用户要求建库或完整检查时准备共享图像索引。corpus_scope 独立于检查/质量筛选，使用已配置图像编码器，返回真实批次引用。',parameters:imageIndexPrepareParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('image_index_prepare',args,exec.signal)}),
    defineTool({name:'consistency_start',description:'按明确请求冻结检查范围与独立检索库，默认严格同图。相同 request_id 重用原批次；不启动聊天模型、知识挖掘或人工复核。',parameters:consistencyStartParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_start',args,exec.signal)}),
    defineTool({name:'consistency_status',description:'只读查看真实批次状态、样本分区计数与子作业错误，不自动重跑。',parameters:consistencyBatchParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_status',args,exec.signal)}),
    defineTool({name:'consistency_cancel',description:'用户要求停止时取消同一批次，保留完成事实与未处理量；核对终态，不自动重启。',parameters:consistencyBatchParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_cancel',args,exec.signal)}),
    defineTool({name:'consistency_retry',description:'仅用户要求继续/重试时处理原冻结批次失败和未处理项，复用已完成结果，不混入新扫描。',parameters:consistencyRetryParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_retry',args,exec.signal)}),
    defineTool({name:'consistency_query',description:'按 batch 或 scope 查询已保存结果。当前/历史/未知分开，冻结游标翻页不启动作业。',parameters:consistencyQueryParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_query',args,exec.signal)}),
    defineTool({name:'consistency_report',description:'读取真实范围/批次覆盖及去重报告。未处理、Top-K、未知保留原口径，缺少人审或Gold统计为未知。',parameters:consistencyQueryParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_report',args,exec.signal)}),
    defineTool({name:'consistency_groups',description:'按结果 query_id 分页查看严格同图组，不把近似连通关系当像素证明。',parameters:consistencyGroupParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_groups',args,exec.signal)}),
    defineTool({name:'consistency_group_members',description:'按同一 query_id/group_id 分页查看实际图组成员及证据，不能用首批代表全组。',parameters:consistencyGroupMemberParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_group_members',args,exec.signal)}),
    defineTool({name:'consistency_compare',description:'对真实样本引用冻结原图、标注、规范与比较证据；不写质量标签或人工裁决。',parameters:consistencyCompareParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_compare',args,exec.signal)}),
    defineTool({name:'consistency_evidence_export',description:'导出已有冻结证据，保留真实产物引用，不重跑检查。',parameters:consistencyEvidenceParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_evidence_export',args,exec.signal)}),
    defineTool({name:'consistency_evidence',description:'只读已有 EvidenceBundle 的冻结事实、来源、差异和媒体目录。需要有预算的图片与差异分页时用 consistency_context；不重跑检查。',parameters:consistencyEvidenceParameters,output:workbenchJsonOutput,execute:(args,exec)=>bridge.execute('consistency_evidence',args,exec.signal)}),
    defineTool({name:'consistency_evidence_media',description:'读取指定 evidence_id/media_id 的真实冻结图片附件。可用媒体由 consistency_context 返回，不接受任意路径。',parameters:consistencyMediaParameters,
      output:{...workbenchJsonOutput,render(args,value):ContentBlock[]{const record=value as unknown as Attachment;return [...workbenchJsonOutput.render(args,value),{type:'image',attachment:record.attachment}];}},
      execute:async(args,exec)=>{
        return await readEvidenceAttachment(bridge,ctx,'consistency_evidence_media',args,exec.signal);
      }}),
    defineTool({name:'consistency_context',description:'验证 result/evidence/difference 引用，返回有预算的真实原图/标注/局部附件与剩余差异游标。事实、人工复核、未知分开；保留 return_location。',parameters:consistencyContextParameters,
      output:{...workbenchJsonOutput,render(args,value):ContentBlock[]{const record=value as unknown as {attachments:Attachment[]};return [...workbenchJsonOutput.render(args,value),...record.attachments.map(item=>({type:'image' as const,attachment:item.attachment}))];}},
      execute:async(args,exec)=>{
        const context=await bridge.execute<ConsistencyContext>('consistency_context',args,exec.signal);
        const attachments=[];
        const existing_images=[];
        const session=exec.agent?.session;
        const available=new Set(session?.deriveMessages().flatMap(message=>message.content).filter(block=>block.type==='image').map(block=>block.attachment.attachmentId) || []);
        const sent=new Map([...(session ? knownImages.get(session) || [] : [])].filter(([,image])=>available.has(image.attachmentId)));
        for(const item of context.media){
          exec.signal.throwIfAborted();
          const existing=sent.get(item.sha256);
          if(existing){existing_images.push({media_id:item.descriptor.media_id,attachment:{...existing}});continue;}
          const media=await readEvidenceAttachment(bridge,ctx,'consistency_evidence_media',{evidence_id:context.evidence_id,media_id:item.descriptor.media_id},exec.signal,item);
          attachments.push({media_id:item.descriptor.media_id,attachment:media.attachment});
          sent.set(item.sha256,media.attachment);
        }
        if(session)knownImages.set(session,sent);
        return {context:JSON.parse(JSON.stringify(context)),attachments,existing_images,attachment_normalization:'HOST_NORMALIZED_DISPLAY'};
      }}),
  ];
}
