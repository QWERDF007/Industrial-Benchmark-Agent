import {finalizeFixtureCatalog,respondFixtureTools} from '../test/fixtures/analysis-finalization.js';
import {auditReportTool} from '../test/fixtures/audit-report.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');

export async function startNativeModelHost({bundlePath = path.join(workspace, 'apps/iad-harness'), launchCwd = workspace, plugins = [], profilePatch = ''} = {}) {
  const calls = [],errors=[];
  const external = http.createServer(async (req, res) => {
    try {
    const chunks=[]; for await (const chunk of req) chunks.push(chunk);
    const body=chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    calls.push({path:req.url, authorization:req.headers.authorization, body});
    const model = req.url.startsWith('/second/') ? 'second-model' : 'first-model';
    if (body?.stream && !body.response_format) {
      const parse=content=>{try{return JSON.parse((typeof content==='string'?content:content.find(part=>part.type==='text').text).split('\n')[0]);}catch{return null;}};
      const index=body.messages.findLastIndex(message=>message.role==='user'&&parse(message.content)?.job_id);
      const context=index<0?null:parse(body.messages[index].content);
      const pages=body.messages.slice(index+1).filter(message=>message.role==='tool').map(message=>parse(message.content));
      let tools;
      if(context?.role==='observer'){
        const originals=body.messages[index].content.filter(part=>part.type==='text').map(part=>parse(part.text)).filter(item=>item?.images);
        respondFixtureTools(res,[{name:'exploration_observe',arguments:{observations:originals.map(page=>({
          sample_id:page.sample_id,dataset_id:page.images[0].dataset_id,description:'本批原图的轮廓可见。',evidence_ids:[page.evidence_id]})),
          assessments:[],discoveries:[],discovery_summary:'本批未增加独立方向。',key_evidence_ids:[]}}],{model});return;
      }
      if(context?.role==='reviewer'){
        respondFixtureTools(res,[{name:'exploration_commit',arguments:{commit_key:'review-'+context.revision,
          round_id:context.round.round_id,base_revision:context.revision,observations:[],directions:[],
          report_reviews:context.reports.map(task=>({round_id:task.round.round_id,discovery_decisions:[]})),
          summary:'已核对完整批次观察。',limitations:[],unresolved_questions:[]}}],{model});return;
      }
      if(context?.kind==='audit_records'){
        respondFixtureTools(res,[auditReportTool(context,pages)],{model});return;
      }
      if(context?.phase==='finalize'){
        const module=body.tools.some(tool=>tool.function.name==='exploration_finalize')?'exploration':'knowledge';
        respondFixtureTools(res,finalizeFixtureCatalog(context,pages,module),{model});return;
      }
      if(context?.round){
        const module=body.tools.some(tool=>tool.function.name==='exploration_commit')?'exploration':'knowledge';
        if(!pages.length)tools=context.round.targets.map(target=>({name:'analysis_images',arguments:{sample_id:target.sample_id}}));
        else{
          const observations=pages.map(page=>({sample_id:page.sample_id,dataset_id:page.images[0].dataset_id,
            description:'观察原图及全部必需标注局部。',evidence_ids:[page.evidence_id],
            directions:context.selected_directions.map(direction=>({direction_ref:direction.ref,status:'applicable',reason:'当前主体轮廓可见。'}))}));
          const ids=pages.filter(page=>page.images.some(item=>item.image.role==='overview'&&item.image.representation==='raw')).map(page=>page.evidence_id);
          const dataset_ids=[...new Set(observations.map(item=>item.dataset_id))];
          const changes=module==='exploration'?{directions:[{direction_id:'contour',title:'主体轮廓',instruction:'复看主体轮廓连续性。',applies_to:'both',
            rationale:'当前已观察范围的原图轮廓。',evidence_ids:ids,counter_evidence_ids:[],dataset_ids,limitations:[]}]}:
            {checks:[{check_id:'visible-contour',title:'轮廓可见',subject:'主体',location:'外缘',criterion:'复看主体轮廓连续性。',allowed_variations:[],
              limitations:[],status:'supported',support_evidence_ids:ids,counter_evidence_ids:[],dataset_ids,direction_refs:context.selected_directions.map(direction=>direction.ref)}]};
          tools=[{name:module==='exploration'?'exploration_commit':'knowledge_commit',arguments:{commit_key:'complete',round_id:context.round.round_id,
            base_revision:context.revision,observations,...changes,summary:'当前全部已观察范围的轮廓结果。',limitations:[],unresolved_questions:[]}}];
        }
      }else if(context?.target){
        tools=!pages.length?[{name:'audit_images',arguments:{sample_id:context.sample_id}}]:[{name:'audit_commit',arguments:{commit_key:'final',final:{
          state:'normal',analysis:'本张原图与原始标注已逐项观察。',conclusion:'当前可见范围未发现标注疑点。',basis:['本张整图及必需局部。'],
          evidence_ids:pages.map(page=>page.evidence_id),limitations:[],findings:[],
          check_assessments:(context.knowledge?.entries||[]).map(entry=>({check_id:entry.check.check_id,status:'consistent',description:'当前主体可观察。',
            evidence_ids:pages.map(page=>page.evidence_id)}))}}}];
      }
      const delta=tools?{role:'assistant',tool_calls:tools.map((tool,index)=>({index,id:randomUUID(),type:'function',function:{name:tool.name,arguments:JSON.stringify(tool.arguments)}}))}:
        {role:'assistant',content:'普通会话已保存'};
      res.writeHead(200, {'Content-Type': 'text/event-stream'});
      for (const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:tools?'tool_calls':'stop'}])
        res.write('data: ' + JSON.stringify({id:'model-settings-fixture',object:'chat.completion.chunk',model,choices:[choice],
          usage:choice.finish_reason?{prompt_tokens:500,completion_tokens:100,total_tokens:600}:undefined})+'\n\n');
      res.end('data: [DONE]\n\n');
      return;
    }
    let result;
    if (req.url.endsWith('/models')) result={data:[{id:model}]};
    else if (req.url.endsWith('/tokenize')) result={count:1000,max_model_len:262144};
    else {
      if(body.response_format)throw new Error('settings fixture only serves the native tool protocol');
      result={choices:[{finish_reason:'stop',message:{role:'assistant',content:'ok'}}]};
    }
    res.writeHead(200, {'Content-Type':'application/json'});res.end(JSON.stringify(result));
    }catch(error){errors.push(String(error));res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>external.listen(0,'127.0.0.1',resolve));
  const modelBase=`http://127.0.0.1:${external.address().port}`;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-model-settings-'));
  execFileSync('/home/dell/anaconda3/envs/iad_agent/bin/python',[path.join(workspace,'apps/iad-harness/test/fixtures/knowledge_dataset.py'),root]);
  const profile = path.join(root, 'home/profiles/web');
  await fs.mkdir(profile, {recursive: true});
  await fs.mkdir(path.join(profile, 'node_modules/@industrial-benchmark'), {recursive: true});
  await fs.symlink(bundlePath, path.join(profile, 'node_modules/@industrial-benchmark/iad-harness'));
  await fs.writeFile(path.join(profile, 'package.json'), JSON.stringify({name: 'iad-model-settings', private: true, type: 'module',
    dsh: {profile: {bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']}}}));
  await fs.writeFile(path.join(profile, 'cordis.yml'), '[]\n');
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, '0.0.0.0', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const patch = path.join(root, 'host.patch.yml');
  await fs.writeFile(patch, `- id: webserver
  config:
    host: 0.0.0.0
    port: ${port}
- insert:
    - id: industrial-harness-plugin
      name: '@industrial-benchmark/iad-harness'
      config:
        cwd: ${JSON.stringify(workspace)}
        dbPath: ${JSON.stringify(path.join(root, 'workbench.db'))}
${plugins.map((name, index) => `    - id: fixture-${index}\n      name: ${JSON.stringify(name)}\n`).join('')}`);
  await fs.writeFile(path.join(profile, 'cordis.patch.yml'), `- id: ui-settings-general
  config:
    welcomeNoticeVersion: 2026-09-28.1
- id: llm-pi-ai
  config:
    providers:
      first-service:
        displayName: First service
        api: openai-completions
        baseURL: ${modelBase}/first/v1
        apiKeyEnv: IAD_FIRST_TEST_KEY
        models:
          - id: first-model
            name: First model
            input: [text, image]
            contextWindow: 262144
            maxTokens: 8192
      second-service:
        displayName: Second service
        api: openai-completions
        baseURL: ${modelBase}/second/v1
        apiKeyEnv: IAD_SECOND_TEST_KEY
        models:
          - id: second-model
            name: Second model
            input: [text, image]
            contextWindow: 262144
            maxTokens: 8192
- id: agent-default-model
  config:
    provider: first-service
    model: first-model
${profilePatch}`);
  const args = [path.join(bundlePath, 'node_modules/@deepseek-ai/dsh/lib/bin.js'), '--profile', 'web', '--patch', patch, '--port', String(port), '--no-open'];
  const options = {cwd: launchCwd, env: {...process.env, DSH_HOME: path.join(root, 'home'), IAD_FIRST_TEST_KEY:'first-isolated-key', IAD_SECOND_TEST_KEY:'second-isolated-key', IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'}, stdio: ['ignore', 'pipe', 'pipe']};
  let host, log = '';
  function launch() {
    log = '';
    host = spawn(process.env.IAD_NODE_PATH || process.execPath, args, options);
    host.stdout.on('data', data => {log += data;});
    host.stderr.on('data', data => {log += data;});
  }
  async function stop() {
    if (host.exitCode !== null || host.signalCode !== null) return;
    const exited = new Promise(resolve => host.once('exit', resolve));
    host.kill('SIGTERM');
    await Promise.race([exited, delay(3000)]);
    if (host.exitCode === null) host.kill('SIGKILL');
    await exited;
  }
  launch();
  return {root, get host() {return host;}, modelBase, calls, errors, readLog: () => log,
    async restart() {await stop();launch();},
    async close() {
      await stop();
      await new Promise(resolve => external.close(resolve));
      await fs.rm(root, {recursive: true, force: true});
    }};
}
