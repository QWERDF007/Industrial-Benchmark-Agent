import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {createDatasetSession} from '../test/fixtures/dataset_session.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

const {values}=parseArgs({options:{'env-file':{type:'string'},image:{type:'string'},output:{type:'string'},case:{type:'string',default:'categories'},'verify-corrections':{type:'boolean',default:false}}});
if(!values.image || !values.output)throw new Error('--image and --output are required');
if(!['categories','missing-instances'].includes(values.case))throw new Error('--case must be categories or missing-instances');
if(values['verify-corrections'] && values.case!=='missing-instances')throw new Error('--verify-corrections requires missing-instances');
if(values['env-file'])process.loadEnvFile(values['env-file']);
const root=path.resolve(values.output);await fs.mkdir(root,{recursive:false});
const endpoint=(process.env.LIVE_VLM_ENDPOINT || '').replace(/\/chat\/completions$/,'').replace(/\/$/,'');
if(!endpoint)throw new Error('Configure the actual LIVE_VLM_ENDPOINT');
const headers={Authorization:'Bearer '+(process.env.LIVE_VLM_KEY || '')};
const modelsResponse=await fetch(endpoint+'/models',{headers,signal:AbortSignal.timeout(10000)});
if(!modelsResponse.ok)throw new Error('Actual model catalog returned '+modelsResponse.status);
const catalog=await modelsResponse.json();const model=catalog.data.find(item=>item.id===process.env.LIVE_VLM_MODEL) || catalog.data[0];
if(!model?.id || !Number.isSafeInteger(model.max_model_len))throw new Error('Actual model and context size must be declared');
execFileSync(resolvePythonPath(),['-c',`import json,sys,shutil
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);r.mkdir(exist_ok=True)
source=Path(sys.argv[2])
with Image.open(source) as image:width,height=image.size
missing=sys.argv[3]=='missing-instances'
for name,label in [('left','surface-a'),('right','surface-b')]:
 shutil.copyfile(source,r/(name+source.suffix))
 shapes=[]
 for number in range(7 if missing else 3):
  category=chr(65+number) if missing else label
  if missing and name=='right' and category in 'BEF':continue
  x=2+(number%3)*max(12,width//4);y=2+(number//3)*max(12,height//4)
  shapes.append({'label':category,'shape_type':'rectangle','points':[[x,y],[x+8,y+8]]})
 (r/(name+'.json')).write_text(json.dumps({'imageWidth':width,'imageHeight':height,'shapes':shapes}))
`,path.join(root,'images'),path.resolve(values.image),values.case]);
const session=await createDatasetSession({root:path.join(root,'session'),dbPath:path.join(root,'benchmark.db'),endpoint,model:model.id,apiKeyEnv:'LIVE_VLM_KEY',contextWindow:model.max_model_len,maxTokens:8192});
const trace=[];
session.ctx.on('tools/result',(exec,result)=>trace.push({name:exec.name,arguments:exec.arguments,result}));
try{
  const dataset=await session.ctx.iadPythonBridge.execute('dataset_import',{format:'labelme',name:'实际工业图解释验证',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'images'),annotation_policy:{policy_id:'real-context-policy',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
  const suffix=path.extname(values.image);
  const sampleA=dataset.dataset_id+':left'+suffix,sampleB=dataset.dataset_id+':right'+suffix;
  const retrieval=await session.ctx.iadPythonBridge.execute('image_retrieve',{request:{query:{kind:'sample',sample_id:sampleA},corpus_scope:{kind:'all_registered'},mode:'exact'}});
  if(retrieval.member_count!==1 || retrieval.exact.groups[0]?.members[0]?.sample_id!==sampleB)throw new Error('The full-corpus query did not retrieve the actual other sample');
  const saved=await session.ctx.iadPythonBridge.execute('consistency_compare',{sample_a:dataset.dataset_id+':left'+suffix,sample_b:dataset.dataset_id+':right'+suffix});
  const missingLabels=saved.annotation.differences.flatMap(item=>item.type==='ONE_SIDED_REGION' ? item.left.map(annotation=>annotation.raw_label) : []).sort();
  if(values.case==='missing-instances' && JSON.stringify(missingLabels)!==JSON.stringify(['B','E','F']))throw new Error('Expected actual B/E/F instance differences');
  const reference={evidence_id:saved.evidence_id,result_id:saved.result_id,difference_page_size:1,return_location:{pageId:'industrial-consistency',tab:'conflicts',evidenceId:saved.evidence_id,resultId:saved.result_id}};
  const started=Date.now();
  session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:[
    `请用 audit-data-consistency 技能解释这份已有证据的全部三个${values.case==='missing-instances' ? '实例缺失差异（左侧ABCDEFG，右侧ACDG，缺B/E/F）' : '类别差异'}。只读取已有证据，不启动检查、编码、知识挖掘、审计或人审。`,
    '一致性证据引用：'+JSON.stringify(reference),
    '每次 consistency_context 按 difference_page_size:1 读取，按 next_cursor 原样继续直到 remaining_differences 为 0；实际查看图片，别把人工构造的标签当成真实缺陷。保留原始冻结像素结论，说明哪些只是标注差异。',
    '返回比较证据：http://localhost/?'+new URLSearchParams({iad:JSON.stringify(reference.return_location)}),
  ].join('\n')}]}));
  await session.handle.agent.whenIdle();
  const contexts=trace.filter(item=>item.name==='consistency_context' && !item.result.isError);
  const read=new Set(contexts.flatMap(item=>item.result.value.context.differences.map(difference=>difference.difference_id)));
  const images=contexts.flatMap(item=>item.result.content.filter(block=>block.type==='image'));
  const messages=session.handle.session?.deriveMessages?.() || session.handle.agent.session.deriveMessages();
  const answer=messages.filter(message=>message.role==='assistant').flatMap(message=>message.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n');
  const result={model:model.id,context_window:model.max_model_len,elapsed_ms:Date.now()-started,source:path.resolve(values.image),controlled_annotation_labels:true,
    evidence_id:saved.evidence_id,result_id:saved.result_id,total_differences:saved.annotation.differences.length,read_differences:read.size,
    image_blocks:images.length,tool_names:trace.map(item=>item.name),remaining:contexts.at(-1)?.result.value.context.remaining_differences ?? null,answer,
    case:values.case,missing_labels:missingLabels,retrieval};
  await fs.writeFile(path.join(root,'tool-trace.json'),JSON.stringify(trace,null,2)+'\n');
  await fs.writeFile(path.join(root,'result.json'),JSON.stringify(result,null,2)+'\n');
  if(trace.some(item=>item.result.isError))throw new Error('A real tool call failed; inspect tool-trace.json');
  if(read.size!==3 || result.remaining!==0 || images.length<3)throw new Error('The model did not read all three actual difference pages and images');
  if(trace.some(item=>!['skill','consistency_context','consistency_evidence','consistency_evidence_media'].includes(item.name)))throw new Error('The model started an unrequested operation');
  if(!answer.includes(saved.result_id) && !answer.includes(saved.evidence_id) && !answer.includes('返回'))throw new Error('The explanation omitted the evidence return reference');
  if(values['verify-corrections']){
    const bridge=session.ctx.iadPythonBridge,sourcePath=path.join(root,'images/right.json');
    const sourceBefore=await fs.readFile(sourcePath),imageBefore=await fs.readFile(values.image);
    const decision=await bridge.execute('consistency_review_submit',{client_request_id:randomUUID(),evidence_id:saved.evidence_id,result_id:saved.result_id,
      difference_ids:saved.annotation.differences.map(item=>item.difference_id),reviewer:'controlled-workflow-verifier',comment:'验证预先构造的B/E/F缺失实例，不代表工业缺陷真值',
      action:{kind:'PROPOSE_REGION_CHANGE',changes:saved.annotation.differences.map(item=>({operation:'add',sample_id:sampleB,
        category:item.left[0].raw_label,geometry:{kind:'bbox',coordinates:item.left[0].bbox}}))}});
    const proposalPreservedSource=(await fs.readFile(sourcePath)).equals(sourceBefore);
    if(!proposalPreservedSource)throw new Error('A region proposal changed source annotations');
    const before=await bridge.execute('consistency_correction_verify',{client_request_id:randomUUID(),decision_id:decision.decision_id,evidence_id:saved.evidence_id,reviewer:'controlled-workflow-verifier'});
    if(before.correction_state!=='AWAITING_RESCAN')throw new Error('Unapplied corrections were treated as verified');
    const labels=JSON.parse(sourceBefore);
    for(const difference of saved.annotation.differences){
      const annotation=difference.left[0];labels.shapes.push({label:annotation.raw_label,shape_type:'rectangle',points:[annotation.bbox.slice(0,2),annotation.bbox.slice(2)]});
    }
    await fs.writeFile(sourcePath,JSON.stringify(labels));
    await bridge.execute('dataset_scan',{dataset_id:dataset.dataset_id});
    const corrected=await bridge.execute('consistency_compare',{sample_a:sampleA,sample_b:sampleB});
    const after=await bridge.execute('consistency_correction_verify',{client_request_id:randomUUID(),decision_id:decision.decision_id,evidence_id:corrected.evidence_id,reviewer:'controlled-workflow-verifier'});
    const historical=await bridge.execute('consistency_evidence',{evidence_id:saved.evidence_id});
    result.correction={decision_id:decision.decision_id,before:before.correction_state,after:after.correction_state,
      remaining_differences:corrected.annotation.differences.length,corrected_evidence_id:corrected.evidence_id,
      proposal_preserved_source:proposalPreservedSource,historical_evidence_unchanged:JSON.stringify(historical.result)===JSON.stringify(saved),
      raw_image_unchanged:createHash('sha256').update(await fs.readFile(values.image)).digest('hex')===createHash('sha256').update(imageBefore).digest('hex'),
      changed_source_path:sourcePath,controlled_review:true};
    if(after.correction_state!=='VERIFIED' || result.correction.remaining_differences || !result.correction.historical_evidence_unchanged || !result.correction.raw_image_unchanged)throw new Error('The real correction/rescan did not preserve current and historical facts');
    await fs.writeFile(path.join(root,'result.json'),JSON.stringify(result,null,2)+'\n');
  }
  console.log(JSON.stringify({model:result.model,elapsed_ms:result.elapsed_ms,read_differences:read.size,image_blocks:images.length,tool_names:result.tool_names,output:root}));
}catch(failure){await fs.writeFile(path.join(root,'tool-trace.json'),JSON.stringify(trace,null,2)+'\n');throw failure;}
finally{await session.dispose();}
