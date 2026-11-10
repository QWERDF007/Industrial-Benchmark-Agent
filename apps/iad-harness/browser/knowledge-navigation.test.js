import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

test('knowledge navigation restores the selected dataset and frozen job through history and refresh without starting work',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-knowledge-navigation-'));
  const workspace=findWorkspaceRoot(),app=path.join(workspace,'apps/iad-harness'),database=path.join(root,'navigation.db');
  let bridge,server,driver;
  t.after(async()=>{
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();await fs.rm(root,{recursive:true,force:true});
  });
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys
from pathlib import Path
from uuid import uuid4
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.knowledge.instructions import default_directions
root=Path(sys.argv[1]);db=Database(sys.argv[2]);registry=DatasetRegistry(db)
group=registry.create_group('导航组');datasets=[]
role=dict(profile=dict(provider_id='fixture',model_id='navigation',endpoint='http://127.0.0.1:30003/v1/chat/completions',context_tokens=65536,max_output_tokens=4096),native_profile=dict(api='openai-completions',baseURL='http://127.0.0.1:30003/v1'),input_modalities=['text','image'])
ModuleSettings(db).save(dict(module='knowledge',expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='navigation'))))
runtime=WorkbenchRuntime(db);jobs=AnalysisAgentJobs(runtime)
for index,name in enumerate(['甲子集','乙子集']):
 directory=root/str(index);directory.mkdir();Image.new('RGB',(32,24),(100+index,110,120)).save(directory/'sample.png')
 config=registry.import_labelme(DatasetImport(format='labelme',name=name,image_dir=str(directory),annotation_dir=str(directory)))
 registry.save(config,group_id=group['group_id'])
 created=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[config.dataset.id],system_prompt=name+'的冻结系统正文。',
  mining_prompt=dict(objective=name+'的知识作业',instruction=name+'的冻结用户正文。',directions=[default_directions()[0].model_dump(mode='json')])),agent=role)
 jobs.cancel(created['run_id'])
 datasets.append(dict(dataset_id=config.dataset.id,name=name,run_id=created['run_id']))
print(json.dumps(dict(datasets=datasets)));runtime.close()
`,root,database],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  bridge=new PythonBridge({cwd:workspace,dbPath:database});
  const frozen=await Promise.all(data.datasets.map(dataset=>bridge.execute('analysis_agent_snapshot',{run_id:dataset.run_id})));
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
    const entries=[],mains=new Map(),listeners=new Set();let panel=null;
    const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
    apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});return()=>{};}}});
    function App(){const[id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>}
    createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const writes=[],api=createIadHttpHandler(bridge);
  server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(req.method!=='GET')writes.push(pathname);
    if(pathname==='/browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/browser.js"></script>');}
    else void api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1920,height:1080});
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const click=async css=>{const target=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();};
  const navigate=async label=>(await driver.wait(until.elementLocated(By.xpath(`//nav[@aria-label="主导航"]/button[normalize-space(.)="${label}"]`)),10000)).click();
  const selectSubset=async dataset=>{
    await click('#subset');
    const options=await driver.findElements(By.css('#subset-menu input'));
    for(const option of options)if(await option.isSelected()!==((await option.getAttribute('value'))===dataset.dataset_id))await option.click();
    await click('#subset');
  };
  const selected=async dataset=>{
    await driver.wait(async()=>await(await element(`#subset-menu input[value="${dataset.dataset_id}"]`)).isSelected(),10000);
    const row=await element(`tr[data-pick-job="${dataset.run_id}"]`);await driver.wait(async()=>await row.getAttribute('aria-selected')==='true',10000);
    assert.ok(!(await driver.findElement(By.css('body')).getText()).includes('所选作业不属于当前数据集'));
  };
  try{
    await driver.get(`http://127.0.0.1:${server.address().port}/`);
    await navigate('知识挖掘');
    await element('#knowledge-page');const[first,second]=data.datasets;
    await selectSubset(first);await click(`tr[data-pick-job="${first.run_id}"] td`);await selected(first);
    await click(`button[data-job-prompt="${first.run_id}"]`);
    const text=await(await element('.iad-prompt-drawer')).getText();
    assert.ok(text.includes(first.name+'的冻结系统正文。')&&text.includes(first.name+'的冻结用户正文。'));
    await click('button[aria-label="关闭查看提示词抽屉"]');
    await selectSubset(second);await click(`tr[data-pick-job="${second.run_id}"] td`);await selected(second);
    await driver.navigate().refresh();await selected(second);
    let location=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad'));
    assert.equal(location.datasetId,second.dataset_id);assert.equal(location.job,second.run_id);
    await driver.navigate().back();await driver.navigate().back();await driver.navigate().back();await selected(first);
    location=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad'));
    assert.equal(location.datasetId,first.dataset_id);assert.equal(location.job,first.run_id);
    await driver.navigate().forward();await driver.navigate().forward();await driver.navigate().forward();await selected(second);
    await navigate('图像浏览');await element('[data-page="industrial-images"]');
    await navigate('知识挖掘');await selected(second);
    await click('#create-btn');await element('#kb-setup-page');await driver.navigate().refresh();await element('#kb-setup-page');
    assert.equal(await(await element('#prompt-text-system')).isEnabled(),true);assert.equal(await(await element('#prompt-text')).isEnabled(),true);
    await click('#kb-setup-back');await selected(second);
    await click('#subset');await click(`#subset-menu input[value="${first.dataset_id}"]`);await click('#subset');
    await element(`tr[data-pick-job="${first.run_id}"]`);await element(`tr[data-pick-job="${second.run_id}"]`);
    await driver.navigate().refresh();
    for(const dataset of data.datasets)assert.equal(await(await element(`#subset-menu input[value="${dataset.dataset_id}"]`)).isSelected(),true);
    await click('#create-btn');await element('#kb-setup-page');
    for(const dataset of data.datasets)assert.equal(await(await element(`#kb-setup-child-menu input[value="${dataset.dataset_id}"]`)).isSelected(),true,'新建表单保留所选全部子数据集');
    await click('#kb-setup-back');
    assert.deepEqual(writes,[],'navigation, history and refresh must not create jobs or save prompts');
    for(const [index,dataset] of data.datasets.entries()){
      const jobs=await bridge.execute('analysis_list',{dataset_id:dataset.dataset_id,analysis_kind:'knowledge'});
      assert.deepEqual(jobs.jobs.map(job=>job.run_id),[dataset.run_id]);assert.equal(jobs.jobs[0].model_calls.length,0);
      assert.deepEqual(await bridge.execute('analysis_agent_snapshot',{run_id:dataset.run_id}),frozen[index]);
    }
    const output=path.join(workspace,'runs/verification/analysis-native-pages');await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,'knowledge-native-navigation.png'),await driver.takeScreenshot(),'base64');
  }catch(error){await fs.writeFile('/tmp/native-knowledge-navigation-failure.png',await driver.takeScreenshot(),'base64');throw error;}
});
