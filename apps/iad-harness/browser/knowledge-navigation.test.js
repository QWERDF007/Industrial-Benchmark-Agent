import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { PythonBridge, createIadHttpHandler } from '../lib/server/index.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(app, '../..');

test('knowledge navigation: one entry preserves each type and dataset through history and refresh without starting jobs', {timeout: 60000}, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-knowledge-navigation-'));
  const bridge = new PythonBridge({cwd: workspace, dbPath: path.join(root, 'test.db')});
  execFileSync(bridge.pythonPath, ['-c', "from PIL import Image;import sys;from pathlib import Path;p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir();Image.new('RGB',(120,80),'blue').save(p/'images'/'normal.png')", root]);
  const bundle = await build({stdin: {contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
    const entries=[],mains=new Map(),listeners=new Set();let panel=null;
    const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
    apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});}}});
    function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>};
    createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api = createIadHttpHandler(bridge);
  const starts=[]; let contradict=false, alterCriterion=false;
  const previous={capacity:process.env.LIVE_VLM_CAPACITY_MODE,endpoint:process.env.LIVE_VLM_ENDPOINT,model:process.env.LIVE_VLM_MODEL};
  const server=http.createServer(async(req,res)=>{
    if(req.method==='POST' && /\/(knowledge|audit)\/(start|retry)/.test(req.url)) starts.push(req.url);
    if(req.url==='/model/tokenize'){
      for await(const chunk of req){}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({count:1000,max_model_len:32768}));
    }else if(req.url==='/model/v1/chat/completions'){
      let body='';for await(const chunk of req)body+=chunk;const value=JSON.parse(body);
      const evidence=value.messages[0].content.filter(p=>p.type==='text'&&p.text.startsWith('视觉证据：')).map(p=>JSON.parse(p.text.slice(5)));
      if(value.response_format.json_schema.name==='KnowledgeRecheckResult'){
        const scope=JSON.parse(value.messages[0].content[0].text.split('人工处置重核验：')[1].split('\n请根据图像')[0]);
        const decisions=scope.events.map(event=>({submission_id:event.submission_id,status:'resolved',description:'真实新旧图支持处置',evidence_ids:evidence.filter(item=>item.representation==='raw').map(item=>item.evidence_id),limitations:[]}));
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({decisions})}}]}));return;
      }
      if(value.response_format.json_schema.name==='KnowledgeObservations'){
        const scope=JSON.parse(value.messages[0].content[0].text.split('冻结观察请求：')[1].split('\n请根据图像')[0]);
        const observations=scope.sources.flatMap(source=>scope.checks.map(check=>({check_id:check.check_id,sample_id:source.sample_id,status:contradict?'contradicts':'supports',description:'新图与旧判据需人工核实',position_analysis:'全图',illumination_analysis:'均匀照明',normal_explanation:'可能是允许变化',evidence_ids:source.raw_evidence_ids,suspects:[]})));
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({observations})}}]}));return;
      }
      const answer={summary:'可见蓝色平面',checks:[{title:'表面外观',subject:'主体',location:'全图',criterion:alterCriterion?'可见蓝色平面且边缘连续':'可见蓝色平面',allowed_variations:[],support_evidence_ids:evidence.filter(e=>e.representation==='raw').map(e=>e.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[],revisions:[]};
      const parent=value.messages[0].content[0].text.split('冻结父版本候选：')[1]?.split('\n')[0];
      if(parent)answer.revisions=JSON.parse(parent).checks.map(check=>({previous_check_id:check.check_id,current_check_titles:['表面外观'],reason:'同一可见判据'}));
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]}));
    }else if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);}
    else if(new URL(req.url,'http://localhost').pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<div id="root"></div><script src="/browser.js"></script>');}
    else api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';
  process.env.LIVE_VLM_ENDPOINT=base+"/model/v1";process.env.LIVE_VLM_MODEL="test-browser-mllm";
  let driver;
  try{
    const datasets=[];
    for(const name of ['甲数据集','乙数据集']){
      await fs.cp(path.join(root,'images'),path.join(root,name,'images'),{recursive:true});await fs.mkdir(path.join(root,name,'labels'));
      const response=await fetch(base+'/api/iad/datasets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format:'labelme',name,image_dir:path.join(root,name,'images'),annotation_dir:path.join(root,name,'labels')})});
      assert.equal(response.status,200,await response.clone().text());datasets.push(await response.json());
    }
    const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.get(base);
    const element=css=>driver.wait(until.elementLocated(By.css(css)),8000);
    const click=async text=>{await(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),8000)).click();};
    await element('nav[aria-label="主导航"]');
    assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("nav[aria-label=主导航] button")].map(e=>e.textContent)'),['数据集管理','图像浏览','知识挖掘','模型审计','人工复核']);
    await click('知识挖掘');
    await element('[data-page="industrial-knowledge"]');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="当前数据集"]'),datasets[0].dataset_id);
    const count=()=>element('input[aria-label="挖掘图像数量"]');
    const expectCount=expected=>driver.wait(async()=>await(await count()).getAttribute('value')===expected,5000,`Expected persisted count ${expected}`);
    await(await count()).clear();await(await count()).sendKeys('20');await click('版本');
    await click('异常');
    await expectCount('10');
    await(await count()).clear();await(await count()).sendKeys('5');await click('作业记录');
    await click('良品');
    assert.equal(await(await count()).getAttribute('value'),'20');
    assert.equal(await(await element('nav[aria-label="知识视图"] button.active')).getText(),'版本');
    await driver.navigate().back();
    await expectCount('5');
    assert.equal(await(await element('nav[aria-label="知识类型"] button[aria-pressed="true"]')).getText(),'异常');
    await driver.navigate().refresh();
    await expectCount('5');
    const datasetSelect=await element('select[aria-label="当前数据集"]');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',datasetSelect,datasets[1].dataset_id);
    await expectCount('10');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="当前数据集"]'),datasets[0].dataset_id);
    await expectCount('5');
    assert.deepEqual(starts,[],'navigation and refresh must never create jobs');
    for(const dataset of datasets){
      const jobs=await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json();assert.deepEqual(jobs.jobs,[]);
    }
    await click('良品');
    await(await count()).clear();await(await count()).sendKeys('1');await click('按数量选择');
    await driver.wait(async()=>await(await element('input[type="checkbox"][aria-label^="选择来源"]')).isSelected(),5000);
    await click('开始挖掘良品知识');
    let knowledge;
    await driver.wait(async()=>{knowledge=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${datasets[0].dataset_id}&kind=normal`)).json()).knowledge;return !!knowledge;},10000);
    assert.equal(knowledge.sources.length,1);assert.equal(knowledge.observed_source_ids.length,1);
    assert.equal(knowledge.model_name,'test-browser-mllm');assert.equal(starts.length,1);
    await(await element('.iad-knowledge-jobs summary')).click();
    await element('button[title="放大冻结观察证据"]');
    await(await element('button[title="放大冻结观察证据"]')).click();
    await element('.iad-viewer-world img');await click('关闭');
    assert.equal(starts.length,1,'Inspecting frozen observations never starts another model job');

    await driver.wait(async()=>await(await element('select[aria-label="知识预设"]')).getAttribute('value')==='',5000);
    await click('作为预设继续选图');
    assert.equal(await(await element('select[aria-label="知识预设"]')).getAttribute('value'),knowledge.version_id);
    await driver.wait(async()=>!(await driver.findElements(By.css('input[type="checkbox"][aria-label^="选择来源"]'))).length,5000);
    assert.equal(starts.length,1,'Continue selection must not automatically create the next job');
    contradict=true;
    const runResponse=await fetch(base+'/api/iad/knowledge/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'normal',knowledge_preset:[knowledge.version_id],image_count:1,images:knowledge.observed_source_ids})});
    assert.equal(runResponse.status,200,await runResponse.clone().text());
    let conflictVersion;
    await driver.wait(async()=>{conflictVersion=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${datasets[0].dataset_id}&kind=normal`)).json()).knowledge;return !!conflictVersion?.conflicts.length;},10000);
    await click('人工复核');await click('知识冲突');
    await element('form[aria-label="知识处置"]');
    await(await element('input[aria-label="知识复核人"]')).sendKeys('浏览器复核员');
    await(await element('textarea[aria-label="知识复核原因"]')).sendKeys('补充实际比较证据后再核验');
    await click('提交知识处置');
    await driver.wait(async()=>await(await element('[data-field="knowledge-review-state"]')).getText()==='待重核验',5000);
    assert.equal(starts.length,2,'Human confirmation must not create a mining job');
    const conflictFilter=await element('select[aria-label="知识冲突状态"]');
    await driver.executeScript('arguments[0].value="pending_review";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',conflictFilter);
    await driver.wait(async()=>!(await driver.findElements(By.css('form[aria-label="知识处置"]'))).length,5000);
    await driver.executeScript('arguments[0].value="pending_recheck";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',conflictFilter);
    await element('form[aria-label="知识处置"]');

    await click('选择图像重核验');
    assert.equal(await(await element('select[aria-label="知识预设"]')).getAttribute('value'),conflictVersion.version_id);
    assert.equal(starts.length,2,'Returning to configuration never starts revalidation');
    await element('input[type="checkbox"][aria-label^="选择来源"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'all','Human recheck returns to explicit historical support selection');
    await driver.navigate().refresh();
    await element('input[type="checkbox"][aria-label^="选择来源"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'all');

    contradict=false;await click('按数量选择');
    await driver.wait(async()=>await(await element('button[data-action="knowledge-group-run"]')).isEnabled(),5000);
    await click('开始挖掘良品知识');
    let recheckedVersion;
    await driver.wait(async()=>{recheckedVersion=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${datasets[0].dataset_id}&kind=normal`)).json()).knowledge;return recheckedVersion?.version_id!==conflictVersion.version_id;},10000);
    assert.equal(recheckedVersion.parent_version_id,conflictVersion.version_id);assert.equal(recheckedVersion.conflicts[0].resolution.status,'resolved');
    assert.deepEqual((await(await fetch(base+`/api/iad/knowledge?version_id=${conflictVersion.version_id}`)).json()).knowledge,conflictVersion,'Explicit browser recheck leaves the historical version unchanged');
    await click('人工复核');await click('知识冲突');
    await driver.wait(async()=>await(await element('[data-field="knowledge-review-state"]')).getText()==='已生效',5000);
    const resolvedFilter=await element('select[aria-label="知识冲突状态"]');
    await driver.executeScript('arguments[0].value="resolved";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',resolvedFilter);
    await element('form[aria-label="知识处置"]');assert.equal(starts.length,3);

    const range=await(await fetch(base+'/api/iad/knowledge/scopes/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset_id:datasets[0].dataset_id,kind:'normal',objective:'连续处理固定来源范围'})})).json();
    const selectedScope=encodeURIComponent(JSON.stringify({pageId:'industrial-knowledge',datasetId:datasets[0].dataset_id,knowledgeKind:'normal',scopeRunId:range.scope_run_id,miningCount:'1'}));
    await driver.get(base+'/?iad='+selectedScope);
    await element('[aria-label="连续范围进度"]');
    assert.match(await(await element('[aria-label="连续范围进度"]')).getText(),/已观察 0.*剩余 1/);
    await click('停止范围');
    await driver.wait(async()=>await(await element('[data-field="knowledge-scope-state"]')).getText()==='已停止',5000);
    assert.equal(starts.length,3,'Stopping a waiting scope never starts a job');
    await click('继续范围');
    await driver.wait(async()=>await(await element('[data-field="knowledge-scope-state"]')).getText()==='待继续',5000);
    assert.equal(starts.length,3,'Resuming authorization never starts a model');
    const mode=await element('select[aria-label="知识执行方式"]');
    await driver.executeScript('arguments[0].value="continuous";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',mode);
    await element('button[data-action="knowledge-agent-run"]');
    await driver.navigate().refresh();
    assert.equal(await(await element('select[aria-label="知识执行方式"]')).getAttribute('value'),'continuous');
    assert.equal(starts.length,3,'Viewing continuous execution and refreshing preserve the scope without launching it');
    execFileSync(bridge.pythonPath,['-c',"from PIL import Image;import sys;from pathlib import Path;p=Path(sys.argv[1]);(p/'images').mkdir(parents=True);(p/'labels').mkdir();[Image.new('RGB',(120,80),c).save(p/'images'/f'{i}.png') for i,c in enumerate(('blue','navy','cyan'))]",path.join(root,'predicate')]);
    const apiPost=async(url,body)=>{const response=await fetch(base+'/api/iad'+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
    const predicateDataset=await apiPost('/datasets/import',{format:'labelme',name:'判据核验',image_dir:path.join(root,'predicate/images'),annotation_dir:path.join(root,'predicate/labels')});
    const predicateScope=await apiPost('/knowledge/scopes/open',{dataset_id:predicateDataset.dataset_id,kind:'normal',objective:'按明确知识版本重核验历史判据'});
    const sourcePage=await(await fetch(base+'/api/iad/knowledge/sources?'+new URLSearchParams({dataset_id:predicateDataset.dataset_id,kind:'normal',scope_run_id:predicateScope.scope_run_id}))).json();
    const learn=async(images,preset)=>{let job=await apiPost(`/knowledge/scopes/${predicateScope.scope_run_id}/start`,{kind:'normal',image_count:images.length,images,knowledge_preset:preset?[preset]:[]});await driver.wait(async()=>{job=await(await fetch(base+'/api/iad/knowledge/status/'+job.run_id)).json();return !['PENDING','RUNNING'].includes(job.status);},10000);assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));return(await(await fetch(base+'/api/iad/knowledge?version_id='+job.knowledge_version_id)).json()).knowledge;};
    const initialPredicate=await learn(sourcePage.items.slice(0,2).map(item=>item.sample_id));
    alterCriterion=true;
    const revisedPredicate=await learn([sourcePage.items[2].sample_id],initialPredicate.version_id);
    assert.equal(revisedPredicate.checks[0].recheck_sample_ids.length,1);
    const criterionLocation=encodeURIComponent(JSON.stringify({pageId:'industrial-knowledge',datasetId:predicateDataset.dataset_id,knowledgeKind:'normal',scopeRunId:predicateScope.scope_run_id,miningCount:'1'}));
    await driver.get(base+'/?iad='+criterionLocation);
    await click('重核验历史来源 · 1 张');
    await element('input[type="checkbox"][aria-label^="选择来源"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'recheck');
    assert.equal((await driver.findElements(By.css('input[type="checkbox"][aria-label^="选择来源"]'))).length,1);
    const runsBefore=(await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${predicateDataset.dataset_id}`)).json()).jobs.length;
    await driver.navigate().refresh();
    await element('input[type="checkbox"][aria-label^="选择来源"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'recheck');
    assert.equal((await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${predicateDataset.dataset_id}`)).json()).jobs.length,runsBefore,'Selecting pending criteria and refreshing never starts learning');
    await click('按数量选择');await click('开始挖掘良品知识');
    let verifiedPredicate;
    await driver.wait(async()=>{verifiedPredicate=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${predicateDataset.dataset_id}&kind=normal`)).json()).knowledge;return verifiedPredicate?.version_id!==revisedPredicate.version_id;},10000);
    assert.deepEqual(verifiedPredicate.checks[0].recheck_sample_ids,[]);
    const finishedScope=await(await fetch(base+`/api/iad/knowledge/scopes/${predicateScope.scope_run_id}`)).json();
    assert.equal(finishedScope.observed,3,'Re-observing a predicate never double-counts scope coverage');assert.equal(finishedScope.remaining,0);assert.equal(finishedScope.recheck,0);
    assert.deepEqual((await(await fetch(base+'/api/iad/knowledge?version_id='+revisedPredicate.version_id)).json()).knowledge,revisedPredicate);
  }catch(error){
    if(driver) console.error(await driver.executeScript("return {url:location.href,count:document.querySelector('input[aria-label=\"挖掘图像数量\"]')?.value,text:document.body.textContent.slice(-1200)}"));
    throw error;
  }finally{if(driver)await driver.quit();bridge.destroy();
    for(const [key,value] of [['LIVE_VLM_CAPACITY_MODE',previous.capacity],['LIVE_VLM_ENDPOINT',previous.endpoint],['LIVE_VLM_MODEL',previous.model]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
