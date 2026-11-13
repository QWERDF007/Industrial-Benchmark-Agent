import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

test('user chooses directions and changes subsets without losing either private native mining prompt',{timeout:90000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-mining-draft-'));
  const workspace=findWorkspaceRoot(),app=path.join(workspace,'apps/iad-harness'),database=path.join(root,'draft.db');
  let bridge,server,driver;
  t.after(async()=>{
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();await fs.rm(root,{recursive:true,force:true});
  });
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.entry import dataset_get
root=Path(sys.argv[1]);db=Database(sys.argv[2]);registry=DatasetRegistry(db)
group=registry.create_group('作业提示词组');datasets=[]
for index,name in enumerate(['第一子集','第二子集']):
 directory=root/str(index);directory.mkdir()
 for number in range(2):Image.new('RGB',(32,24),(100+index,110+number,120)).save(directory/(str(number)+'.png'))
 config=registry.import_labelme(DatasetImport(format='labelme',name=name,image_dir=str(directory),annotation_dir=str(directory)))
 registry.save(config,group_id=group['group_id']);datasets.append(dataset_get({'dataset_id':config.dataset.id},db.db_path))
ModuleSettings(db).save(dict(module='knowledge',expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='native-draft'),batch_size=2)))
print(json.dumps(dict(datasets=datasets,groups=[group])))
`,root,database],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  bridge=new PythonBridge({cwd:workspace,dbPath:database});
  const role={profile:{provider_id:'fixture',model_id:'native-draft',endpoint:'http://127.0.0.1:30003/v1/chat/completions',context_tokens:65536,max_output_tokens:4096},
    native_profile:{api:'openai-completions',baseURL:'http://127.0.0.1:30003/v1'},input_modalities:['text','image']};
  const accepted=[];
  bridge.useModelRouting({async execute(operation,args,signal,dispatch){
    if(operation!=='analysis_start')return dispatch(operation,args,signal);
    const job=await dispatch('analysis_agent_start',{request:args.request,agent:role},signal);
    accepted.push({job,request:args.request});return job;
  }});
  const presets=(await bridge.execute('knowledge_presets')).directions;
  assert.ok(presets.length>=2);const [first,second]=presets;
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {KnowledgeMiningCreate} from './src/client/components/KnowledgeMiningCreate.tsx';
    import {WorkbenchProviders} from './src/client/host/WorkbenchProviders.tsx';
    import {Workspace} from './src/client/workspace.tsx';import {WorkbenchSession} from './src/client/workbench-session.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const data=${JSON.stringify(data)},dataset=data.datasets[0],workspace=new Workspace(new WorkbenchSession({}));
    workspace.openLocation({pageId:'industrial-knowledge',datasetId:dataset.dataset_id});
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    createRoot(document.getElementById('root')).render(<WorkbenchProviders workspace={workspace}>
      <div className="iad-workbench"><KnowledgeMiningCreate dataset={dataset} datasets={data.datasets} groups={data.groups}
        selectedParentId={dataset.group_id} selectedChildIds={[dataset.dataset_id]} onClose={()=>{}} onStarted={()=>{}}/></div>
    </WorkbenchProviders>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge),reads=[],writes=[];
  server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(req.method==='GET')reads.push(pathname);else writes.push(pathname);
    if(pathname==='/browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/browser.js"></script>');}
    else void api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1920,height:1080});
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const click=async css=>{const target=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();};
  const fill=async(css,text)=>{
    const input=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',input);await input.click();
    await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await input.sendKeys(text,Key.TAB);
  };
  try{
    await driver.get(`http://127.0.0.1:${server.address().port}/`);
    await click(`#general-directions input[data-dir-id="preset:${first.direction_id}"]`);
    await driver.wait(async()=>(await(await element('#prompt-text')).getAttribute('value')).includes(first.title),10000);
    await click(`button[data-edit-id="preset:${first.direction_id}"]`);
    await fill('#kb-dir-edit-name','本场边缘方向');await fill('#kb-dir-edit-text','观察本场原始边缘。');await click('#kb-dir-save');
    await driver.wait(async()=>(await(await element('#prompt-text')).getAttribute('value')).includes('观察本场原始边缘。'),10000);
    const defaultSystem=await(await element('#prompt-text-system')).getAttribute('value');
    const system='本场系统规则：只用实际观察的证据。',user='本场用户要求：比较边缘，保留相反证据。';
    await fill('#prompt-text-system',system);await fill('#prompt-text',user);
    await click(`#general-directions input[data-dir-id="preset:${second.direction_id}"]`);
    await click('#kb-setup-child-trigger');await click(`#kb-setup-child-menu input[value="${data.datasets[1].dataset_id}"]`);await click('#kb-setup-child-trigger');
    await driver.wait(async()=>(await(await element('#kb-run-summary')).getText()).includes('子数据集 2 个'),10000);
    assert.equal(await(await element('#prompt-text')).getAttribute('value'),user);
    assert.equal(await(await element('#prompt-text-system')).getAttribute('value'),system);
    await click('#compose-prompt');await click('dialog[aria-label="恢复自动生成提示词"] button[aria-label="取消"]');
    assert.equal(await(await element('#prompt-text')).getAttribute('value'),user);
    await click('#compose-prompt');
    await click('#confirm-accept');
    await driver.wait(async()=>(await(await element('#prompt-text')).getAttribute('value')).includes('本场边缘方向'),10000);
    const composed=await(await element('#prompt-text')).getAttribute('value');
    assert.ok(composed.includes(second.title)&&composed.includes('第二子集'));
    assert.equal(await(await element('#prompt-text-system')).getAttribute('value'),defaultSystem);
    await fill('#prompt-text-system',system);
    await fill('#prompt-text',user);
    const output=path.join(workspace,'runs/verification/analysis-native-pages');
    await fs.mkdir(output,{recursive:true});
    await driver.executeScript('document.querySelector("#kb-prompt-title").scrollIntoView({block:"start"})');
    await fs.writeFile(path.join(output,'knowledge-private-draft.png'),await driver.takeScreenshot(),'base64');
    const submit=await element('#submit-job');await driver.wait(until.elementIsEnabled(submit),10000);
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',submit);await submit.click();
    await driver.wait(()=>accepted.length===1,10000);
    const {job,request}=accepted[0],snapshot=await bridge.execute('analysis_agent_snapshot',{run_id:job.run_id});
    assert.equal(request.system_prompt,system);assert.equal(snapshot.system_prompt,system);assert.equal(snapshot.instruction,user);
    assert.equal(snapshot.manifest.records.length,4);assert.deepEqual(snapshot.plan.rounds.map(batch=>batch.targets.length),[2,2]);
    assert.equal(snapshot.selected_directions.length,2);assert.equal(snapshot.selected_directions[0].source_title,first.title);
    assert.equal(snapshot.selected_directions[0].title,'本场边缘方向');assert.equal(snapshot.selected_directions[0].instruction,'观察本场原始边缘。');
    assert.deepEqual(snapshot.selected_directions[0].source,first.source);
    assert.equal(request.image_count,undefined);assert.equal(request.knowledge_preset,undefined);
    assert.ok(!reads.some(route=>route==='/api/iad/knowledge/prompt'||route.includes('/knowledge/scopes')));
    assert.deepEqual(writes,['/api/iad/analysis/start']);
  }catch(error){
    await fs.writeFile('/tmp/native-knowledge-draft-page-failure.png',await driver.takeScreenshot(),'base64');
    throw new Error((await driver.findElement(By.css('body')).getText()).slice(-3000),{cause:error});
  }
});
