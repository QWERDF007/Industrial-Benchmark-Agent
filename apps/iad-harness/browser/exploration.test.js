import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport,textZoom} from './workbench-layout.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('mixed exploration is preserved on refresh and directions feed the next mining request', {timeout:120000}, async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-exploration-browser-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/knowledge_dataset.py'),root]);
 execFileSync(bridge.pythonPath,['-c',"import shutil,sys;from pathlib import Path;p=Path(sys.argv[1]);[shutil.copyfile(p/'images/part-0.png',p/f'images/z-{i}.png') for i in range(117)]",root]);
 const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
 const entries=[],mains=new Map(),listeners=new Set();let panel=null;
 const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
 apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});}}});
 function App(){const[id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>};createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const api=createIadHttpHandler(bridge),generated=[],media=[];
 const server=http.createServer(async(req,res)=>{
  if(req.url.startsWith('/api/iad/media/'))media.push(req.url);
  if(req.url.startsWith('/model/')){
   let text='';for await(const c of req)text+=c;const b=JSON.parse(text);let answer;
   if(req.url==='/model/tokenize')answer={count:3000,max_model_len:32768};
   else{
    generated.push(b);const ids=b.messages[0].content.filter(v=>v.type==='text'&&v.text.startsWith('视觉证据：')).map(v=>JSON.parse(v.text.slice(5)).evidence_id);
    answer=b.response_format.json_schema.name==='DirectionDraft'?{summary:'两组样例提出方向',directions:[{title:'孔位与背景对照',instruction:'结合孔位比较背景遮挡与反光',applies_to:'both',rationale:'两组存在可观察差异',evidence_ids:ids,limitations:['合成图']}],limitations:[]}
    :{summary:'孔内背景知识',checks:[{title:'孔内背景',subject:'孔',location:'主体',criterion:'可见背景',allowed_variations:[],limitations:[],status:'supported',support_evidence_ids:ids,counter_evidence_ids:[]}],suspects:[],limitations:[]};
    if(b.response_format.json_schema.name==='JointAnalysis'){
      const view={description:'当前图像支持可见结构',position_analysis:'主体位置',illumination_analysis:'均匀照明'};
      const evidence=b.messages[0].content.filter(v=>v.type==='text'&&v.text.startsWith('视觉证据：')).map(v=>JSON.parse(v.text.slice(5)));
      const checks=JSON.parse(b.messages[0].content[0].text.split('冻结知识：')[1].split('\n')[0]).checks;
      answer={...view,global_view:view,suggested_label:'PASS',reason_category:'NORMAL',confidence:0.8,evidence_ids:ids,findings:[],
        check_assessments:checks.map(check=>({...view,check_id:check.check_id,status:'normal',evidence_ids:[ids[0]]})),
        region_observations:evidence.filter(e=>e.role==='roi'&&e.representation==='raw').map((_,i)=>({...view,region_index:i+1}))};
    }

   }
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(req.url==='/model/tokenize'?answer:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]}));
  }else if(req.url==='/browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
  else if(new URL(req.url,'http://localhost').pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}#root>.iad-workspace{flex:1;min-height:0}</style><div id="root"></div><script src="/browser.js"></script>');}
  else await api(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const keys=['LIVE_VLM_ENDPOINT','LIVE_VLM_MODEL','LIVE_VLM_CAPACITY_MODE','IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES'];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 process.env.LIVE_VLM_ENDPOINT=base+'/model/v1';process.env.LIVE_VLM_MODEL='test-mllm';process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES='2';
 let driver;
 try{
  const response=await fetch(base+'/api/iad/datasets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format:'labelme',name:'方向探索浏览器',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')})});assert.equal(response.status,200);const dataset=await response.json();
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const el=css=>driver.wait(until.elementLocated(By.css(css)),8000);
  const click=async text=>{const button=await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),8000);await driver.wait(until.elementIsEnabled(button),8000);await button.click();};
  const count=async(label,value)=>{const input=await el(`input[aria-label='${label}图像数量']`);await input.clear();await input.sendKeys(value);};
  await driver.get(base);await click('图像浏览');await el('[aria-label="图像视图"]');await click('良品来源');await el('[aria-label="良品来源管理"]');await click('全部图像');
  assert.equal((await driver.findElements(By.css('.iad-grid input[type=checkbox]'))).length,0,'普通浏览和来源选择分开');
  await click('模型审计');await el('.iad-grid');
  await driver.wait(async()=>(await driver.findElements(By.css('.iad-grid .iad-sample'))).length===24,8000);
  assert.equal((await driver.findElements(By.css('[aria-label="审计良品知识版本"]'))).length,0,'结果页不挂载完整审计设置');
  await click('新建审计');await el('dialog[aria-label="新建模型审计"]');
  assert.match(await(await el('[aria-label="审计执行范围"]')).getText(),/120 张/,'执行范围来自 total 而非当前页24张');
  await(await el('button[aria-label="关闭新建模型审计"]')).click();
  await viewport(driver,1366,768);await click('人工复核');await el('.iad-review-focused .iad-viewer-viewport');
  assert.equal((await driver.findElements(By.css('dialog[open]'))).length,0,'复核直接使用嵌入画布');
  assert.equal((await driver.findElements(By.css('.iad-decision input[type=radio]'))).length,5,'保留五种人工裁决');
  const focusLayout=await driver.executeScript("const c=document.querySelector('.iad-review-focused .iad-viewer-viewport').getBoundingClientRect(),b=document.querySelector('.iad-decision button[type=submit]').getBoundingClientRect();return {canvas:[c.width,c.height],submit:[b.top,b.bottom],height:innerHeight}");
  assert.ok(focusLayout.canvas[0]>300&&focusLayout.canvas[1]>200,JSON.stringify(focusLayout));assert.ok(focusLayout.submit[0]>=0&&focusLayout.submit[1]<=focusLayout.height,'1366×768当前图和提交入口同时可见');
  await fs.mkdir(path.resolve(app,'../../runs/browser/ui-workbench'),{recursive:true});await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/review-1366.png'),await driver.takeScreenshot(),'base64');
  await viewport(driver,375,812);await textZoom(driver,2);await click('复核记录');
  assert.equal(await(await el('[aria-label="复核视图"] button.active')).getText(),'复核记录','窄屏200%仍能切换标签');
  await driver.wait(()=>driver.executeScript("return !document.querySelector('.iad-review-records')?.textContent.includes('加载复核记录')"),5000);
  assert.equal((await driver.findElements(By.css('.iad-inspector,.iad-pagination'))).length,0,'空复核记录不显示分页及队列中遗留的样本详情');
  await click('复核队列');await click('打开人工裁决');await el('dialog.iad-review-drawer');
  await(await el('dialog input[type=radio][value=FAIL]')).click();await(await el('button[aria-label="关闭人工裁决"]')).click();await click('打开人工裁决');
  assert.equal(await(await el('dialog input[type=radio][value=FAIL]')).isSelected(),true,'窄屏裁决面板开关保持未提交草稿');
  assert.ok(await driver.executeScript("const e=document.querySelector('dialog.iad-review-drawer');return e.scrollWidth<=e.clientWidth+1"),'窄屏裁决不横向溢出');
  await(await el('button[aria-label="关闭人工裁决"]')).click();await textZoom(driver,1);await viewport(driver,1366,768);


  await click('方向探索');await el('[data-page="industrial-exploration"]');
  assert.equal((await driver.findElements(By.css('input[aria-label="良品图像数量"]'))).length,0,'结果视图不挂载长配置');
  assert.equal(await driver.executeScript("return getComputedStyle(document.querySelector('.iad-exploration-page .iad-empty')).backgroundColor"),'rgb(255, 255, 255)','探索空态沿用 HTML 的白色内容表面');
  await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/exploration-empty-1366.png'),await driver.takeScreenshot(),'base64');
  await click('新建探索');
  assert.equal((await driver.findElements(By.xpath('//button[normalize-space(.)="选取良品图像" or normalize-space(.)="选取异常图像"]'))).length,0,'每组只保留一个选图入口，按数量选取位于选择器内');
  await count('良品','2');await count('异常','1');await click('选择良品图像');await click('按数量选择');await click('完成选择');await click('选择异常图像');await click('按数量选择');await click('完成选择');
  await driver.wait(async()=>await(await el('button.iad-primary')).isEnabled(),8000);
  await driver.navigate().refresh();
  assert.equal(await(await el('input[aria-label="良品图像数量"]')).getAttribute('value'),'2');
  assert.equal(await(await el('input[aria-label="异常图像数量"]')).getAttribute('value'),'1');
  await click('查看全部已选良品');await el('dialog[aria-label="选择良品图像"]');assert.equal((await driver.findElements(By.css('dialog .iad-source-option'))).length,2);await(await el('button[aria-label="关闭选择良品图像"]')).click();
  await click('开始方向探索');await click('探索结果');await driver.wait(async()=>(await driver.findElements(By.css('table[aria-label="探索方向"] tbody tr'))).length===1,10000);
  assert.equal((await driver.findElements(By.css('table[aria-label="探索方向"] tbody tr'))).length,1,'按 HTML 用紧凑方向表呈现结果');
  assert.equal(generated.length,1);assert.equal(generated[0].messages[0].content.filter(v=>v.type==='image_url').length,3);
  await click('查看方向');await click('用于良品知识挖掘');await el('summary[data-action="mining-directions"]');await(await el('summary[data-action="mining-directions"]')).click();
  const choice=await el('input[aria-label="启用探索方向 孔位与背景对照"]');assert.equal(await choice.isSelected(),false);await choice.click();await click('保存方向');
  await driver.wait(async()=>{const p=await(await fetch(base+`/api/iad/knowledge/prompt?dataset_id=${dataset.dataset_id}&kind=normal`)).json();return p.configuration.directions.some(v=>v.origin==='explored'&&v.enabled);},8000);
  await driver.manage().window().setRect({width:500,height:900});assert.equal(await driver.executeScript('return document.documentElement.scrollWidth>innerWidth'),false);await driver.manage().window().setRect({width:1440,height:1000});
  const mining=await el('input[aria-label="挖掘图像数量"]');await mining.clear();await mining.sendKeys('2');await click('选择来源图像');await click('按数量选择');await click('完成选择');
  const start=await el('button[data-action="knowledge-group-run"]');await driver.wait(()=>start.isEnabled(),8000);await start.click();
  await driver.wait(()=>generated.length===2,10000);assert.ok(generated[1].messages[0].content[0].text.includes('结合孔位比较背景遮挡与反光'));
  await driver.wait(async()=>(await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs.every(job=>!['PENDING','RUNNING'].includes(job.status)),10000);
  await click('模型审计');await click('新建审计');
  const auditStart=await el('dialog.iad-drawer button.iad-primary');await driver.wait(()=>auditStart.isEnabled(),10000);await auditStart.click();
  await driver.wait(()=>driver.executeScript("return JSON.parse(new URL(location.href).searchParams.get('iad')).job.startsWith('audit_')"),10000,'Audit job must be selected after starting');
  const auditId=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).job;
  let audited;await driver.wait(async()=>{audited=await(await fetch(base+'/api/iad/audit/status/'+auditId)).json();if(['FAILED','PARTIAL'].includes(audited.status))assert.fail(JSON.stringify(audited.errors));return audited.status==='COMPLETED';},60000);
  assert.equal(audited.completed,120);assert.equal(audited.sample_ids.length,120);assert.equal(audited.failed,0,'实际执行整个120张筛选范围');
  assert.equal(generated.filter(request=>request.response_format.json_schema.name==='JointAnalysis').length,120,'每图使用真实联合审计流程');
  const beforeVolumeCalls=generated.length;
  await click('知识挖掘');
  const volumeRoot=path.join(root,'volume');await fs.mkdir(path.join(volumeRoot,'images'),{recursive:true});await fs.mkdir(path.join(volumeRoot,'labels'));
  for(let i=0;i<1000;i++)await fs.link(path.join(root,'images/part-0.png'),path.join(volumeRoot,'images',`source-${String(i).padStart(4,'0')}.png`));
  const imported=await fetch(base+'/api/iad/datasets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format:'labelme',name:'千图来源',image_dir:path.join(volumeRoot,'images'),annotation_dir:path.join(volumeRoot,'labels')})});assert.equal(imported.status,200,await imported.clone().text());const large=await imported.json();
  await click('刷新');await(await el(`select[aria-label="当前数据集"] option[value="${large.dataset_id}"]`)).click();await click('新建挖掘');
  const mediaBefore=media.length;
  const volumeCount=await el('input[aria-label="挖掘图像数量"]');await volumeCount.clear();await volumeCount.sendKeys('50');await click('选择来源图像');await click('按数量选择');await click('完成选择');
  await driver.wait(()=>driver.executeScript("return document.querySelector('.iad-source-picker [role=status]')?.textContent.includes('已选 50 / 50')"),10000);
  assert.equal((await driver.findElements(By.css('.iad-source-preview img'))).length,4,'50张已选只预览4张');
  await click('选择来源图像');await driver.wait(async()=>(await driver.findElements(By.css('dialog .iad-source-option'))).length===10,5000);
  assert.equal(await driver.executeScript("return [...document.querySelectorAll('dialog .iad-source-option input')].every(input=>input.checked)"),true);
  await click('下一页');await driver.wait(()=>driver.executeScript("return document.querySelector('dialog .iad-source-option span')?.textContent==='source-0010.png'"),5000);
  assert.equal(await driver.executeScript("return [...document.querySelectorAll('dialog .iad-source-option input')].every(input=>input.checked)"),true,'跨页保留已选');
  await(await el('input[aria-label="搜索来源图像"]')).sendKeys('source-09');await driver.wait(()=>driver.executeScript("return document.querySelector('dialog .iad-source-option span')?.textContent==='source-0900.png'"),5000);
  await(await el('dialog .iad-source-option input')).click();
  await(await driver.findElement(By.xpath('//label[contains(.,"仅已选")]/input'))).click();
  await driver.wait(()=>driver.executeScript("return document.querySelector('dialog .iad-source-option span')?.textContent==='source-0000.png'"),5000);
  await(await el('dialog .iad-source-option input')).click();await click('完成选择');
  assert.equal(JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).miningImages.length,50,'搜索及已选视图编辑保留完整集合');
  assert.equal(media.slice(mediaBefore).filter(url=>url.split('?')[0].endsWith('/image')).length,0,'分页选图不下载整库原图');assert.equal(generated.length,beforeVolumeCalls,'查看来源不发起模型调用');
  execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/ui_history.py'),path.join(root,'test.db'),large.dataset_id]);
  await click('返回知识结果');await click('作业记录');await driver.wait(async()=>(await driver.findElements(By.css('table[aria-label="作业列表"] tbody tr'))).length===10,10000);
  assert.equal((await driver.findElements(By.css('.iad-job[data-job-id]'))).length,1,'千条历史只挂载一份详情');
  assert.equal((await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${large.dataset_id}`)).json()).jobs.length,30,'复用服务既有列表上限');

 }catch(error){
  if(driver){await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/exploration-failure.png'),await driver.takeScreenshot(),'base64');console.error(JSON.stringify({location:await driver.getCurrentUrl(),generated:generated.length,counts:generated.reduce((counts,item)=>{const schema=item.response_format.json_schema.name;counts[schema]=(counts[schema]||0)+1;return counts;},{}),page:(await driver.findElement(By.css('body')).getText()).slice(-1800)}));}
  throw error;
 }finally{
  await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));for(const k of keys)if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];await fs.rm(root,{recursive:true,force:true});
 }
});
