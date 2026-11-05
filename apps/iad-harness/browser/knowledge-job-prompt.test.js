import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cwd=path.resolve(app,'../..');

test('user chooses directions and changes subsets without losing the private mining draft',{timeout:90000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-private-job-'));
  const bridge=new PythonBridge({cwd,dbPath:path.join(root,'test.db')});
  execFileSync(bridge.pythonPath,['-c',"from pathlib import Path;from PIL import Image;import sys;p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir();[(Image.new('RGB',(120,80),(40,i*60,150)).save(p/'images'/f'part-{i}.png')) for i in range(2)]",root]);
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {KnowledgeMiningCreate} from './src/client/components/KnowledgeMiningCreate.tsx';
    import {WorkbenchModelProvider} from './src/client/models.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    function App(){const [data,setData]=React.useState(null);React.useEffect(()=>{
      Promise.all([fetch('/api/iad/datasets').then(r=>r.json()),fetch('/api/iad/datasets/groups').then(r=>r.json())])
        .then(([catalog,groups])=>setData({catalog,groups}));},[]);
      if(!data)return null;const dataset=data.catalog.datasets.find(item=>item.name==='作业提示词');
      return <div className="iad-workbench"><WorkbenchModelProvider><KnowledgeMiningCreate dataset={dataset}
        datasets={data.catalog.datasets} groups={data.groups.groups} selectedParentId={dataset.group_id}
        selectedChildId={dataset.dataset_id} onClose={()=>{}}
        onStarted={jobs=>{window.startedJob=jobs[0];}}/></WorkbenchModelProvider></div>;
    }createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge),writes=[],reads=[];
  const server=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(req.method==='GET')reads.push(pathname);
    if(pathname.endsWith('/tokenize')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({count:1000,max_model_len:262144}));return;}
    if(pathname.endsWith('/chat/completions')){
      let raw='';for await(const chunk of req)raw+=chunk;
      const body=JSON.parse(raw),parts=body.messages[0].content;
      const refs=parts.filter(part=>part.type==='text'&&part.text.startsWith('视觉证据：')).map(part=>JSON.parse(part.text.slice(5)).evidence_id);
      const result=body.response_format.json_schema.name==='DirectionDraft'
        ? {summary:'本批可以比较外轮廓和表面变化',limitations:[],directions:['主体轮廓变化','表面外观变化'].map(title=>({
          title,instruction:'结合整图与实际标注比较可见变化',applies_to:'both',rationale:'图像具有可见外观',evidence_ids:refs.slice(0,1),limitations:[]}))}
        : {summary:'本组未形成可复用判据',checks:[],suspects:[],limitations:[]};
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));return;
    }
    if(pathname==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<div id="root"></div><script src="/browser.js"></script>');return;}
    if(req.method==='POST'){
      let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>writes.push({path:pathname,body:JSON.parse(body)}));
    }
    await api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const names=['LIVE_VLM_ENDPOINT','LIVE_VLM_MODEL','LIVE_VLM_CAPACITY_MODE'];const environment=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  process.env.LIVE_VLM_ENDPOINT=base+'/model/v1';process.env.LIVE_VLM_MODEL='fixture-model';process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';
  const read=async route=>{const response=await fetch(base+'/api/iad/'+route);assert.equal(response.status,200);return response.json();};
  const post=async(route,body)=>{const response=await fetch(base+'/api/iad/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
  let driver;
  try{
    const group=await post('datasets/groups',{name:'小范围验证'});
    const dataset=await post('datasets/import',{format:'labelme',name:'作业提示词',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels'),group_id:group.group_id});
    await fs.cp(path.join(root,'images'),path.join(root,'second-images'),{recursive:true});
    const second=await post('datasets/import',{format:'labelme',name:'第二子集',image_dir:path.join(root,'second-images'),annotation_dir:path.join(root,'labels'),group_id:group.group_id});
    let exploration=await post('exploration/start',{dataset_id:dataset.dataset_id,
      normal_images:[dataset.dataset_id+':part-0.png',dataset.dataset_id+':part-1.png'],defect_images:[]});
    const deadline=Date.now()+15000;
    while(['PENDING','RUNNING'].includes(exploration.status)&&Date.now()<deadline){await delay(30);exploration=await read('exploration/status/'+exploration.run_id);}
    assert.equal(exploration.status,'COMPLETED',JSON.stringify(exploration.errors));
    const query=new URLSearchParams({dataset_id:dataset.dataset_id,kind:'normal'});
    const defaults=await read('knowledge/prompt?'+query);
    const original=await post('knowledge/prompt',{dataset_id:dataset.dataset_id,kind:'normal',expected_revision:defaults.revision,
      configuration:{...defaults.configuration,instruction:'以前的共享配置不能替代本次作业草稿。',directions:defaults.configuration.directions.map(direction=>({...direction,enabled:true}))}});
    writes.length=0;reads.length=0;
    const options=new firefox.Options().addArguments('-headless');options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1440,height:1000});await driver.get(base);
    const element=selector=>driver.wait(until.elementLocated(By.css(selector)),15000);
    await driver.wait(async()=>(await driver.findElements(By.css('#general-directions input[type=checkbox]'))).length>0,15000);
    await driver.wait(until.elementIsEnabled(await element('#kb-tab-preset')),15000);
    assert.equal((await driver.findElements(By.css('input[name=sample-kind]'))).length,0,'新建挖掘没有良品/异常类型');
    const checked=async selector=>{let count=0;for(const input of await driver.findElements(By.css(selector)))if(await input.isSelected())count++;return count;};
    assert.equal(await checked('#general-directions input[type=checkbox]'),0,'新作业的预设方向由用户手选');
    assert.ok(!(await (await element('#prompt-text')).getAttribute('value')).includes('以前的共享配置'));
    assert.ok(!(await (await element('#prompt-text')).getAttribute('value')).includes('本批可以比较外轮廓'));
    await (await element('#kb-tab-explore')).click();
    const explored=await driver.findElements(By.css('#explored-directions input[type=checkbox]'));
    assert.equal(explored.length,2);assert.equal(await checked('#explored-directions input[type=checkbox]'),0,'不自动启用探索方向');
    const directionId=await explored[0].getAttribute('data-dir-id');await explored[0].click();
    await driver.wait(async()=>(await (await element('#prompt-text')).getAttribute('value')).includes('本批可以比较外轮廓'),5000);
    await (await element('#kb-tab-preset')).click();
    await (await element('[data-edit-kind="preset"][data-edit-id="edges"]')).click();
    const editedTitle='本次边缘观察',editedText='结合主体与边缘细节比较实际变化。';
    for(const [selector,value] of [['#kb-dir-edit-name',editedTitle],['#kb-dir-edit-text',editedText]]){
      const input=await element(selector);await input.click();
      await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await input.sendKeys(value);
    }
    await (await element('#kb-dir-save')).click();
    const textarea=await element('#prompt-text'),instruction='本次作业只观察边缘的实际变化，保留相反证据和未确认项。';
    await textarea.click();await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await textarea.sendKeys(instruction,Key.TAB);
    for(const checkbox of await driver.findElements(By.css('#general-directions input[type=checkbox]'))){
      const chosen=(await checkbox.getAttribute('data-dir-id'))==='edges';if(await checkbox.isSelected()!==chosen)await checkbox.click();
    }
    assert.equal(await textarea.getAttribute('value'),instruction,'手改提示词不能被方向勾选覆盖');
    await (await element('#kb-setup-child-trigger')).click();
    await (await element(`#kb-setup-child-menu input[value="${second.dataset_id}"]`)).click();
    await driver.wait(until.elementIsEnabled(await element('#submit-job')),15000);
    assert.equal(await textarea.getAttribute('value'),instruction,'切换子数据集不能清除手工提示词');
    assert.equal(await checked('#general-directions input[type=checkbox]'),1,'切换范围保留用户选择');
    assert.ok((await (await element('#general-directions')).getText()).includes(editedTitle),'切换范围保留方向编辑');
    await (await element('#kb-setup-child-trigger')).click();
    const start=await element('#submit-job');await driver.wait(until.elementIsEnabled(start),10000);
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',start);await start.click();
    await driver.wait(()=>driver.executeScript(()=>!!window.startedJob),15000);
    const job=await driver.executeScript(()=>window.startedJob),raw=await read('analysis/node/'+job.run_id);
    assert.equal(writes.filter(write=>write.path==='/api/iad/knowledge/prompt').length,0,'创建作业不能写共享提示词');
    assert.equal(writes.filter(write=>write.path==='/api/iad/analysis/start').length,1);
    assert.equal(reads.filter(route=>route==='/api/iad/knowledge/prompt').length,0,'新建作业不自动读取共享选择');
    assert.equal(reads.filter(route=>route==='/api/iad/knowledge/presets').length,1,'切换子集不重复读取通用方向');
    assert.deepEqual(await read('knowledge/prompt?'+query),original);
    assert.equal(raw.request.units.length,2);
    assert.ok(!('kind' in raw.request.submission));
    for(const unit of raw.request.units){
      const frozen=unit.request.mining_prompt;
      assert.equal(frozen.instruction,instruction);
      assert.deepEqual(frozen.configuration.directions.map(direction=>direction.direction_id),['edges',directionId]);
      assert.equal(frozen.configuration.directions[0].title,editedTitle);
      assert.equal(frozen.configuration.directions[0].instruction,editedText);
    }
  }finally{
    if(driver)await driver.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));
    for(const name of names){if(environment[name]===undefined)delete process.env[name];else process.env[name]=environment[name];}
  }
});
