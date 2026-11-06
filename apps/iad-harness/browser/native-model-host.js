import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');

export async function startNativeModelHost() {
  const calls = [];
  const external = http.createServer(async (req, res) => {
    const chunks=[]; for await (const chunk of req) chunks.push(chunk);
    const body=chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    calls.push({path:req.url, authorization:req.headers.authorization, body});
    const model = req.url.startsWith('/second/') ? 'second-model' : 'first-model';
    let result;
    if (req.url.endsWith('/models')) result={data:[{id:model}]};
    else if (req.url.endsWith('/tokenize')) result={count:1000,max_model_len:262144};
    else {
      const evidence=body.messages[0].content.filter(row=>row.type==='text' && row.text.startsWith('视觉证据：')).map(row=>JSON.parse(row.text.slice(5)));
      const ids=evidence.map(row=>row.evidence_id), view={description:'观察到主体',position_analysis:'居中',illumination_analysis:'均匀'};
      const schema=body.response_format.json_schema.name; let answer;
      if(schema==='DirectionDraft') answer={summary:'比较图组',directions:[{title:'主体轮廓',instruction:'观察轮廓完整性',applies_to:'both',rationale:'主体清晰',evidence_ids:ids,limitations:[]}],limitations:[]};
      else if(schema==='JointAnalysis') {
        const checks=JSON.parse(body.messages[0].content[0].text.split('冻结知识：')[1].split('\n')[0]).checks;
        answer={...view,suggested_label:'PASS',reason_category:'NORMAL',confidence:0.8,evidence_ids:ids,global_view:view,
          region_observations:evidence.filter(row=>row.role==='roi' && row.representation==='raw').map((_,index)=>({...view,region_index:index+1})),
          check_assessments:checks.map(check=>({...view,check_id:check.check_id,status:'normal',evidence_ids:ids})),findings:[]};
      } else if(schema==='KnowledgeVerification') {
        const scope=JSON.parse(body.messages[0].content[0].text.split('待核验疑点：')[1].split('\n请根据图像')[0]);
        answer={findings:scope.findings.map(target=>({finding_id:target.finding_id,status:'insufficient',affected_check_titles:[],description:'合成验证仅核对路由',normal_explanation:'需人工核实',limitations:['隔离测试'],evidence_ids:ids,conflicts:[]}))};
      } else answer={summary:'可见部件知识',checks:[{title:'轮廓可见',subject:'主体',location:'全图',criterion:'主体轮廓可见',allowed_variations:[],support_evidence_ids:ids,counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[]};
      result={choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]};
    }
    res.writeHead(200, {'Content-Type':'application/json'});res.end(JSON.stringify(result));
  });
  await new Promise(resolve=>external.listen(0,'127.0.0.1',resolve));
  const modelBase=`http://127.0.0.1:${external.address().port}`;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-model-settings-'));
  execFileSync('/home/dell/anaconda3/envs/iad_agent/bin/python',[path.join(workspace,'apps/iad-harness/test/fixtures/knowledge_dataset.py'),root]);
  const profile = path.join(root, 'home/profiles/web');
  await fs.mkdir(profile, {recursive: true});
  await fs.mkdir(path.join(profile, 'node_modules/@industrial-benchmark'), {recursive: true});
  await fs.symlink(path.join(workspace, 'apps/iad-harness'), path.join(profile, 'node_modules/@industrial-benchmark/iad-harness'));
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
`);
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
      second-service:
        displayName: Second service
        api: openai-completions
        baseURL: ${modelBase}/second/v1
        apiKeyEnv: IAD_SECOND_TEST_KEY
        models:
          - id: second-model
            name: Second model
            input: [text, image]
- id: agent-default-model
  config:
    provider: first-service
    model: first-model
`);
  const host = spawn(process.env.IAD_NODE_PATH || process.execPath,
    [path.join(workspace, 'node_modules/@deepseek-ai/dsh/lib/bin.js'), '--profile', 'web', '--patch', patch, '--port', String(port), '--no-open'],
    {cwd: workspace, env: {...process.env, DSH_HOME: path.join(root, 'home'), IAD_FIRST_TEST_KEY:'first-isolated-key', IAD_SECOND_TEST_KEY:'second-isolated-key', IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'}, stdio: ['ignore', 'pipe', 'pipe']});
  let log='';
  host.stdout.on('data',data=>{log+=data;});host.stderr.on('data',data=>{log+=data;});
  return {root,host,modelBase,calls,readLog:()=>log,async close(){
    host.kill('SIGTERM');
    await Promise.race([new Promise(resolve=>host.once('exit',resolve)),delay(3000)]);
    if(host.exitCode===null)host.kill('SIGKILL');
    await new Promise(resolve=>external.close(resolve));
    await fs.rm(root,{recursive:true,force:true});
  }};
}
