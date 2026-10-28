import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Builder, By, Key, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from './workbench-layout.js';
import { PythonBridge, createIadHttpHandler } from '../lib/server/index.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(app, '../..');

test('knowledge navigation: one entry preserves each type and dataset through history and refresh without starting jobs', {timeout: 120000}, async () => {
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
  const starts=[]; let contradict=false, alterCriterion=false, failGeneration=false;
  let delaySavedResponse=false,savedResponseReady=false,releaseSavedResponse;
  const previous={capacity:process.env.LIVE_VLM_CAPACITY_MODE,endpoint:process.env.LIVE_VLM_ENDPOINT,model:process.env.LIVE_VLM_MODEL};
  const server=http.createServer(async(req,res)=>{
    if(req.method==='POST' && req.url==='/api/iad/knowledge/prompt' && delaySavedResponse){
      delaySavedResponse=false;const end=res.end;res.end=function(...args){savedResponseReady=true;releaseSavedResponse=()=>{res.end=end;end.apply(res,args);};return res;};
    }
    if(req.method==='POST' && /\/(knowledge|audit)\/(start|retry)/.test(req.url)) starts.push(req.url);
    if(req.url==='/model/tokenize'){
      for await(const chunk of req){}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({count:1000,max_model_len:32768}));
    }else if(req.url==='/model/v1/chat/completions'){
      let body='';for await(const chunk of req)body+=chunk;const value=JSON.parse(body);
      if(failGeneration){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'本机验收模型请求失败'}}));return;}
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
      const raw=evidence.filter(e=>e.representation==='raw').map(e=>e.evidence_id);
      answer.discovery={parts:[{name:'主体',location:'全图',evidence_ids:raw}],areas:[
        {direction_id:null,direction:'平面蓝色观察',subjects:['主体'],status:'已形成知识',reason:'输入图中可见蓝色平面',check_titles:['表面外观'],evidence_ids:raw},
        {direction_id:null,direction:'背面结构',subjects:['主体'],status:'不可观察',reason:'没有背面视图',check_titles:[],evidence_ids:[]}]};
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
    const click=async text=>{const button=await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}' or @aria-label='${text}']`)),8000);await driver.wait(until.elementIsEnabled(button),8000);await button.click();};
    await element('nav[aria-label="主导航"]');
    assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("nav[aria-label=主导航] button")].map(e=>e.textContent)'),['数据集管理','图像浏览','方向探索','知识挖掘','数据一致性','模型审计','人工复核','模型设置']);
    await click('知识挖掘');
    await element('[data-page="industrial-knowledge"]');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="当前数据集"]'),datasets[0].dataset_id);
    assert.equal((await driver.findElements(By.css('[aria-label="知识挖掘配置"]'))).length,0,'知识结果不挂载新建配置');
    assert.equal((await driver.findElements(By.css('.iad-knowledge-jobs'))).length,0,'作业只在作业标签挂载');
    assert.equal((await driver.findElements(By.css('.iad-knowledge-context [aria-label="知识类型"],.iad-knowledge-context select[aria-label="知识版本"]'))).length,2,'类型与版本位于同一紧凑上下文行');
    const count=()=>element('input[aria-label="挖掘图像数量"]');
    const expectCount=expected=>driver.wait(async()=>await(await count()).getAttribute('value')===expected,5000,`Expected persisted count ${expected}`);
    await click('新建挖掘');await(await count()).clear();await(await count()).sendKeys('20');await click('返回知识结果');await click('版本');
    await click('异常');await click('新建挖掘');await expectCount('10');
    await(await count()).clear();await(await count()).sendKeys('5');await click('返回知识结果');await click('作业记录');
    assert.equal((await driver.findElements(By.css('.iad-knowledge-jobs'))).length,1,'没有知识版本也能查询作业');
    await click('良品');
    assert.equal(await(await element('[aria-label="知识视图"] button.active')).getText(),'版本');
    await click('新建挖掘');await expectCount('20');await driver.navigate().refresh();await expectCount('20');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="当前数据集"]'),datasets[1].dataset_id);
    await click('新建挖掘');await expectCount('10');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="当前数据集"]'),datasets[0].dataset_id);
    await expectCount('20');
    assert.deepEqual(starts,[],'navigation and refresh must never create jobs');
    for(const dataset of datasets){const jobs=await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json();assert.deepEqual(jobs.jobs,[]);}
    await element('button[aria-label="通用方向"]');
    await(await element('button[aria-label="编辑方向 整体形态"]')).click();
    assert.equal(await(await element('button[data-action="save-mining-directions"]')).isEnabled(),false,'打开未修改的行不产生dirty');
    await click('取消本行编辑');
    const shape=await element('input[aria-label="启用方向 整体形态"]');
    await driver.wait(()=>shape.isEnabled(),5000);
    await shape.click();
    await(await element('button[aria-label="编辑方向 整体形态"]')).click();
    const editTitle=await element('input[aria-label^="方向名称 "]');await editTitle.clear();await editTitle.sendKeys('临时名称');
    await(await element('input[aria-label="启用方向 部件组成"]')).click();
    await click('取消本行编辑');
    assert.equal(await(await element('input[aria-label="启用方向 整体形态"]')).isSelected(),false);
    assert.equal(await(await element('input[aria-label="启用方向 部件组成"]')).isSelected(),false,'取消本行不修改其他行');
    await(await element('input[aria-label="启用方向 部件组成"]')).click();
    const directionSearch=await element('input[aria-label="搜索挖掘方向"]');await directionSearch.sendKeys('不存在的方向');
    await driver.wait(()=>driver.executeScript("return document.querySelectorAll('.iad-direction-row').length===0"),5000);
    await directionSearch.clear();await directionSearch.sendKeys('整体');
    await driver.wait(()=>driver.executeScript("return document.querySelectorAll('.iad-direction-row').length===1"),5000);
    assert.equal(await(await element('input[aria-label="启用方向 整体形态"]')).isSelected(),false,'搜索不修改隐藏选择');
    await directionSearch.clear();
    await click('添加方向');
    await(await element('input[aria-label="新方向名称"]')).sendKeys('孔内背景');
    await(await element('textarea[aria-label="新方向说明"]')).sendKeys('观察孔内背景是否清楚可见，区分遮挡与阴影。');
    await click('添加数据集方向');
    assert.equal(await(await element('input[aria-label="启用方向 孔内背景"]')).isSelected(),true);
    await click('保存方向');
    await driver.wait(async()=>!(await(await element('button[data-action="save-mining-directions"]')).isEnabled()),5000);
    await driver.navigate().refresh();
    await element('button[aria-label="通用方向"]');
    assert.equal(await(await element('input[aria-label="启用方向 整体形态"]')).isSelected(),false);
    await(await element('button[aria-label="自定义方向"]')).click();
    assert.equal(await(await element('input[aria-label="启用方向 孔内背景"]')).isSelected(),true);
    await(await element('button[aria-label="通用方向"]')).click();
    await driver.manage().window().setRect({width:1920,height:1080});
    const layout=await driver.executeScript('return {viewport:innerWidth,width:document.scrollingElement.scrollWidth}');
    assert.ok(layout.width<=layout.viewport,`桌面方向编辑溢出：${JSON.stringify(layout)}`);
    const keyboardDirection=await element('input[aria-label="启用方向 整体形态"]');
    await keyboardDirection.sendKeys(' ');
    assert.equal(await keyboardDirection.isSelected(),true,'方向可用键盘切换');
    await keyboardDirection.sendKeys(' ');
    assert.equal(await keyboardDirection.isSelected(),false);
    await(await count()).clear();await(await count()).sendKeys('1');await click('选择来源图像');await click('按数量选择');await click('完成选择');
    await click('查看全部已选来源');assert.equal(await(await element('input[type="checkbox"][aria-label^="选择来源"]')).isSelected(),true);await click('完成选择');
    await click('开始挖掘良品知识');
    let knowledge;
    await driver.wait(async()=>{knowledge=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${datasets[0].dataset_id}&kind=normal`)).json()).knowledge;return !!knowledge;},10000);
    assert.equal(knowledge.sources.length,1);assert.equal(knowledge.observed_source_ids.length,1);
    assert.equal(knowledge.model_name,'test-browser-mllm');assert.equal(starts.length,1);
    await click('知识条目');
    await(await element('.iad-knowledge-discovery>summary')).click();
    await element('.iad-discovery-area');
    assert.match(await(await element('.iad-knowledge-discovery')).getText(),/模型新增/);
    assert.equal(knowledge.mining_prompt.configuration.directions.find(item=>item.title==='孔内背景').origin,'dataset');
    await(await element('.iad-discovery-area>button')).click();
    await element('input[aria-label="启用方向 平面蓝色观察"]');
    await click('保存方向');
    await driver.wait(async()=>!(await(await element('button[data-action="save-mining-directions"]')).isEnabled()),5000);
    await click('返回知识结果');await click('作业记录');await element('table[aria-label="作业列表"]');
    const headers=await driver.findElements(By.css('table[aria-label="作业列表"] thead th'));
    assert.deepEqual(await Promise.all(headers.map(e=>e.getText())),['任务','类型','状态','完成 / 总数','失败','开始时间']);
    assert.equal((await driver.findElements(By.css('[aria-label="作业详情"]'))).length,0,'默认无作业详情');
    const jobRow=await element('table[aria-label="作业列表"] tbody tr');
    await jobRow.sendKeys(Key.ENTER);await element('dialog[aria-label="作业详情"]');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal(await driver.executeScript('return document.activeElement.tagName'),'TR');
    await jobRow.sendKeys(Key.SPACE);await element('dialog[aria-label="作业详情"]');
    await fs.mkdir(path.resolve(app,'../../runs/browser/ui-workbench'),{recursive:true});
    for(const width of [1366,1792,1920]){
      await viewport(driver,width,1080);
      const size=await driver.executeScript('const e=document.querySelector("dialog[aria-label=作业详情]"),r=e.getBoundingClientRect();return {width:r.width,right:r.right,viewport:document.documentElement.clientWidth,overflow:e.scrollWidth-e.clientWidth}');
      assert.ok(size.width>=520&&size.width<=620&&Math.abs(size.right-size.viewport)<=1&&size.overflow<=1,JSON.stringify(size));
      await fs.writeFile(path.resolve(app,`../../runs/browser/ui-workbench/knowledge-drawer-${width}.png`),await driver.takeScreenshot(),"base64");
    }
    await click('观察证据');
    await element('button[title="放大冻结观察证据"]');
    await(await element('button[title="放大冻结观察证据"]')).click();
    await element('.iad-viewer-world img');await click('关闭');
    assert.equal(starts.length,1,'Inspecting frozen observations never starts another model job');

    await driver.actions().sendKeys(Key.ESCAPE).perform();await click('知识条目');await click('作为预设继续选图');
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
    await element('[aria-label="冲突证据"]');await element('aside[aria-label="知识处置面板"]');
    await driver.manage().window().setRect({width:1920,height:1080});
    const conflictLayout=await driver.executeScript("const queue=document.querySelector('[aria-label=知识冲突队列]').getBoundingClientRect(),evidence=document.querySelector('[aria-label=冲突证据]').getBoundingClientRect(),decision=document.querySelector('aside[aria-label=知识处置面板]').getBoundingClientRect();return {queueRight:queue.right,evidenceLeft:evidence.left,evidenceRight:evidence.right,decisionLeft:decision.left}");
    assert.ok(conflictLayout.evidenceLeft>conflictLayout.queueRight && conflictLayout.decisionLeft>conflictLayout.evidenceRight,'宽屏按队列、证据、处置三区排列');

    await(await element('input[aria-label="知识复核人"]')).sendKeys('浏览器复核员');
    await(await element('textarea[aria-label="知识复核原因"]')).sendKeys('补充实际比较证据后再核验');
    const disposition=await element('select[aria-label="知识处置方式"]');
    assert.deepEqual(await driver.executeScript('return [...arguments[0].options].map(option=>option.value)',disposition),['retain','revise','retire','need_evidence']);
    await(await element('select[aria-label="知识处置方式"] option[value="revise"]')).click();
    await(await element('textarea[aria-label="知识修订建议"]')).sendKeys('此处仅是修订草稿，不属于最终保留决定');
    for(const action of ['retire','need_evidence','retain']){await(await element(`select[aria-label="知识处置方式"] option[value="${action}"]`)).click();assert.equal((await driver.findElements(By.css('textarea[aria-label="知识修订建议"]'))).length,0);}

    await click('提交知识处置');
    await driver.wait(async()=>await(await element('[data-field="knowledge-review-state"]')).getText()==='待重核验',5000);
    assert.equal(starts.length,2,'Human confirmation must not create a mining job');
    const dispositionRecord=await(await fetch(base+'/api/iad/review/knowledge?'+new URLSearchParams({version_id:conflictVersion.version_id,conflict_id:conflictVersion.conflicts[0].conflict_id}))).json();
    assert.equal(dispositionRecord.events.at(-1).instruction,'','隐藏的修订草稿不能随保留决定提交');

    const conflictFilter=await element('select[aria-label="知识冲突状态"]');
    await driver.executeScript('arguments[0].value="pending_review";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',conflictFilter);
    await driver.wait(async()=>!(await driver.findElements(By.css('form[aria-label="知识处置"]'))).length,5000);
    await driver.executeScript('arguments[0].value="pending_recheck";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',conflictFilter);
    await element('form[aria-label="知识处置"]');

    await click('选择图像重核验');
    assert.equal(await(await element('select[aria-label="知识预设"]')).getAttribute('value'),conflictVersion.version_id);
    assert.equal(starts.length,2,'Returning to configuration never starts revalidation');
    await element('button[data-action="knowledge-group-run"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'all','Human recheck returns to explicit historical support selection');
    await driver.navigate().refresh();
    await element('button[data-action="knowledge-group-run"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'all');

    contradict=false;await click('选择来源图像');await click('按数量选择');await click('完成选择');
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
    await click('新建挖掘');const mode=await element('select[aria-label="知识执行方式"]');
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
    await element('button[data-action="knowledge-group-run"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'recheck');
    await click('选择来源图像');assert.equal((await driver.findElements(By.css('input[type="checkbox"][aria-label^="选择来源"]'))).length,1);await click('完成选择');
    const runsBefore=(await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${predicateDataset.dataset_id}`)).json()).jobs.length;
    await driver.navigate().refresh();
    await element('button[data-action="knowledge-group-run"]');
    assert.equal(await(await element('select[aria-label="来源范围"]')).getAttribute('value'),'recheck');
    assert.equal((await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${predicateDataset.dataset_id}`)).json()).jobs.length,runsBefore,'Selecting pending criteria and refreshing never starts learning');
    await click('选择来源图像');await click('按数量选择');await click('完成选择');await driver.wait(async()=>await(await element('button[data-action="knowledge-group-run"]')).isEnabled(),5000);await click('开始挖掘良品知识');
    let verifiedPredicate;
    await driver.wait(async()=>{verifiedPredicate=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${predicateDataset.dataset_id}&kind=normal`)).json()).knowledge;return verifiedPredicate?.version_id!==revisedPredicate.version_id;},10000);
    assert.deepEqual(verifiedPredicate.checks[0].recheck_sample_ids,[]);
    const finishedScope=await(await fetch(base+`/api/iad/knowledge/scopes/${predicateScope.scope_run_id}`)).json();
    assert.equal(finishedScope.observed,3,'Re-observing a predicate never double-counts scope coverage');assert.equal(finishedScope.remaining,0);assert.equal(finishedScope.recheck,0);
    assert.deepEqual((await(await fetch(base+'/api/iad/knowledge?version_id='+revisedPredicate.version_id)).json()).knowledge,revisedPredicate);
    await click('作业记录');
    await(await element('table[aria-label="作业列表"] tbody tr td:first-child')).click();await element('dialog[aria-label="作业详情"]');
    const deletable=await element('.iad-job button[aria-label^="删除作业 "]');
    const deletingJob=await deletable.findElement(By.xpath('ancestor::article')).getAttribute('data-job-id');
    await deletable.click();
    await element('dialog[open][aria-label="删除作业"]');
    assert.equal(await driver.executeScript('return document.activeElement.textContent'),'取消');
    await click('取消');
    assert.equal((await driver.findElements(By.css(`.iad-job[data-job-id="${deletingJob}"]`))).length,1);
    await(await element(`.iad-job[data-job-id="${deletingJob}"] button[aria-label^="删除作业 "]`)).click();await click('确认删除');
    await driver.wait(async()=>!(await driver.findElements(By.css(`.iad-job[data-job-id="${deletingJob}"]`))).length,8000);
    assert.equal((await(await fetch(base+'/api/iad/knowledge?version_id='+verifiedPredicate.version_id)).json()).knowledge.version_id,verifiedPredicate.version_id);
    await click('知识条目');
    await(await element('button[aria-label^="删除知识条目 "]')).click();
    await element('dialog[open][aria-label="删除知识条目"]');
    await click('确认删除');
    let maintained;
    await driver.wait(async()=>{maintained=(await(await fetch(base+`/api/iad/knowledge?dataset_id=${predicateDataset.dataset_id}&kind=normal`)).json()).knowledge;return maintained?.version_id!==verifiedPredicate.version_id;},8000);
    assert.equal(maintained.checks.length,0);assert.ok(maintained.manual_edit);
    assert.deepEqual((await(await fetch(base+'/api/iad/knowledge?version_id='+verifiedPredicate.version_id)).json()).knowledge,verifiedPredicate);
    await driver.wait(async()=>!(await driver.findElements(By.css('dialog[open]'))).length,5000);
    assert.equal(await driver.executeScript('return document.activeElement.textContent'),'知识条目','Removing the final rule restores focus to a stable tab');
    const versionSelect=await element('select[aria-label="知识版本"]');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',versionSelect,verifiedPredicate.version_id);
    await driver.wait(async()=>(await driver.findElements(By.css('button[aria-label^="删除知识条目 "]'))).length===1,5000);
    assert.equal(await(await element('button[aria-label^="删除知识条目 "]')).isEnabled(),false,'A historical version is read-only');
    await click('新建挖掘');await element('textarea[aria-label="挖掘目标"]');
    const conflictDataset=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).datasetId;
    const savedBeforeConflict=await(await fetch(base+`/api/iad/knowledge/prompt?dataset_id=${conflictDataset}&kind=normal`)).json();
    const localGoal='保留这份尚未保存的并发编辑。';
    const goal=await element('textarea[aria-label="挖掘目标"]');await goal.clear();await goal.sendKeys(localGoal);
    await click('图像浏览');await driver.wait(until.alertIsPresent(),3000);await(await driver.switchTo().alert()).dismiss();
    assert.equal(await(await element('textarea[aria-label="挖掘目标"]')).getAttribute('value'),localGoal,'取消离开保留草稿');
    const remoteGoal='另一位用户已保存的新目标。';
    const concurrent=await fetch(base+'/api/iad/knowledge/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset_id:conflictDataset,kind:'normal',expected_revision:savedBeforeConflict.revision,configuration:{...savedBeforeConflict.configuration,objective:remoteGoal}})});assert.equal(concurrent.status,200);
    await click('保存方向');await driver.wait(()=>driver.executeScript("return [...document.querySelectorAll('[role=alert]')].some(e=>e.textContent.includes('提示词已变化'))"),5000);
    assert.equal(await(await element('textarea[aria-label="挖掘目标"]')).getAttribute('value'),localGoal,'真实expected_revision冲突保留草稿');
    await click('查看服务器版本');await element('dialog[aria-label="已保存的挖掘提示词"]');assert.match(await(await element('dialog pre')).getText(),new RegExp(remoteGoal));await click('关闭');
    await click('重新载入');await click('保留当前编辑');
    assert.equal(await(await element('textarea[aria-label="挖掘目标"]')).getAttribute('value'),localGoal);
    await click('重新载入');await click('重新载入服务器配置');
    await driver.wait(async()=>(await(await element('textarea[aria-label="挖掘目标"]')).getAttribute('value'))===remoteGoal,5000);
    assert.equal(await(await element('button[data-action="save-mining-directions"]')).isEnabled(),false);
    const otherDataset=datasets[1].dataset_id;
    const otherPrompt=await(await fetch(base+`/api/iad/knowledge/prompt?dataset_id=${otherDataset}&kind=normal`)).json();
    const lateGoal='旧数据集已提交但延迟返回的保存正文。';
    const lateInput=await element('textarea[aria-label="挖掘目标"]');await lateInput.clear();await lateInput.sendKeys(lateGoal);
    const heldStarted=await driver.executeScript('return performance.now()');delaySavedResponse=true;
    await click('保存方向');await driver.wait(()=>savedResponseReady,5000,'真实SQLite保存完成后暂缓HTTP返回');
    await(await element(`select[aria-label="当前数据集"] option[value="${otherDataset}"]`)).click();await driver.wait(until.alertIsPresent(),3000);await(await driver.switchTo().alert()).accept();
    await driver.wait(async()=>(await(await element('textarea[aria-label="挖掘目标"]')).getAttribute('value'))===otherPrompt.configuration.objective,5000);
    releaseSavedResponse();
    await driver.wait(()=>driver.executeScript("return performance.getEntriesByType('resource').some(e=>e.initiatorType==='fetch' && e.name.endsWith('/api/iad/knowledge/prompt') && e.responseEnd>=arguments[0])",heldStarted),5000,'等待旧POST完整返回');
    assert.equal(JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).datasetId,otherDataset);
    assert.equal(await(await element('textarea[aria-label="挖掘目标"]')).getAttribute('value'),otherPrompt.configuration.objective,'迟到保存响应不能覆盖新数据集');
    assert.equal((await(await fetch(base+`/api/iad/knowledge/prompt?dataset_id=${conflictDataset}&kind=normal`)).json()).configuration.objective,lateGoal);
    await click('返回知识结果');
    failGeneration=true;
    const retrySources=datasets[1].reference_sample_ids.slice(0,1);
    assert.equal(retrySources.length,1);
    const failedStart=await fetch(base+'/api/iad/knowledge/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'normal',knowledge_preset:[],image_count:1,images:retrySources})});
    assert.equal(failedStart.status,200,await failedStart.clone().text());const failedJob=await failedStart.json();
    await driver.wait(async()=>(await(await fetch(base+'/api/iad/knowledge/status/'+failedJob.run_id)).json()).status==='FAILED',10000);
    await click('作业记录');
    await(await element(`table[aria-label="作业列表"] td[title="${failedJob.run_id}"]`)).click();await element('dialog[aria-label="作业详情"]');
    await click('失败记录');assert.match(await(await element('.iad-job-errors')).getText(),/503/);
    failGeneration=false;await click('重试范围');await element('.iad-retry-samples input');
    assert.equal(await(await element('.iad-retry-samples input')).isEnabled(),false,'整组重试不能擅自缩减来源');
    await click('重试所选 1 张');
    await driver.wait(()=>driver.executeScript('const job=JSON.parse(new URL(location.href).searchParams.get("iad")).job;return job&&job!==arguments[0]',failedJob.run_id),5000);
    const retryId=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).job;
    let retried;await driver.wait(async()=>{retried=await(await fetch(base+'/api/iad/knowledge/status/'+retryId)).json();return retried.status==='COMPLETED';},10000);
    assert.equal(retried.parent_run_id,failedJob.run_id);assert.equal(retried.completed,1);

  }catch(error){
    if(driver){await fs.mkdir(path.resolve(app,'../../runs/browser/ui-workbench'),{recursive:true});await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/knowledge-failure.png'),await driver.takeScreenshot(),'base64');console.error(await driver.executeScript("return {dialogs:[...document.querySelectorAll('dialog:modal')].map(e=>e.getAttribute('aria-label')),text:document.querySelector('.iad-workbench')?.innerText.slice(-1800)}"));}
    throw error;
  }finally{releaseSavedResponse?.();if(driver)await driver.quit();bridge.destroy();
    for(const [key,value] of [['LIVE_VLM_CAPACITY_MODE',previous.capacity],['LIVE_VLM_ENDPOINT',previous.endpoint],['LIVE_VLM_MODEL',previous.model]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
