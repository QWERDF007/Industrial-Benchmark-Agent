import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createAnalysisAgentHost} from './fixtures/analysis-agent-host.js';

for(const module of ['exploration','knowledge'])test(`${module} stops after three rejected commits without progress`,{timeout:30000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-progress-'));
  let runtime,calls=0;
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    JSON.parse(raw);
    if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
    calls++;
    if(calls>3){res.writeHead(400);res.end(JSON.stringify({error:{message:'unexpected fourth inference'}}));return;}
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    res.end('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:randomUUID(),type:'function',
      function:{name:module+'_commit',arguments:JSON.stringify({commit_key:'retry-'+calls,base_revision:0,round_id:1})}}]},finish_reason:null}]})+'\n\n'+
      'data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:1000,completion_tokens:100,total_tokens:1100}})+'\n\ndata: [DONE]\n\n');
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await runtime?.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  runtime=await createAnalysisAgentHost(root,`http://127.0.0.1:${provider.address().port}/v1`);
  const input=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry, DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.knowledge.instructions import default_directions
p=Path(sys.argv[1]);(p/'images').mkdir();Image.new('RGB',(32,24),'gray').save(p/'images/image.png')
db=Database(str(p/'pages.db'));config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='停机验证',image_dir=str(p/'images'),annotation_dir=str(p/'images')))
ModuleSettings(db).save(dict(module=sys.argv[2],expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='native-image'))))
print(json.dumps(dict(dataset_id=config.dataset.id,directions=[default_directions()[0].model_dump(mode='json')])))
`,root,module],{cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  const request={submission_id:randomUUID(),analysis_kind:module,dataset_ids:[input.dataset_id],...(module==='exploration'
    ?{normal_images:[input.dataset_id+':image.png'],prompt:{text:'观察原图并提交。'}}
    :{mining_prompt:{objective:'观察原图。',instruction:'提交实际观察。',directions:input.directions}})};
  const job=await runtime.scheduler.start(request);await runtime.scheduler.whenIdle();
  const status=await runtime.bridge.execute('analysis_status',{run_id:job.run_id});
  assert.equal(calls,3,'参数错误不能无限触发新推理');
  assert.equal(status.status,'FAILED');assert.equal(status.completed,0);assert.equal(status.analysis_version_id,null);
  assert.match(status.execution_error.message,/连续3次.*提交.*失败/);
  const context=await runtime.bridge.execute('analysis_agent_context',{run_id:job.run_id});
  const session=await runtime.host.read(context.session_id);
  assert.equal(session.events.filter(e=>e.type==='tool/result'&&e.data.message.isError).length,3);
});
