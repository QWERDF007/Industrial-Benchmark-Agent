import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport,textZoom} from './workbench-layout.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('mixed exploration is preserved on refresh and directions feed the next mining request', {timeout:240000}, async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-exploration-browser-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/knowledge_dataset.py'),root]);
 execFileSync(bridge.pythonPath,['-c',"import shutil,sys;from pathlib import Path;p=Path(sys.argv[1]);[shutil.copyfile(p/'images/part-0.png',p/f'images/z-{i}.png') for i in range(98)];[(shutil.copyfile(p/'images/part-2.png',p/f'images/z-ng-{i}.png'),shutil.copyfile(p/'labels/part-2.json',p/f'labels/z-ng-{i}.json')) for i in range(19)]",root]);
 const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
 const entries=[],mains=new Map(),listeners=new Set();let panel=null;
 const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
 apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});}}});
 function App(){const[id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>};createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const api=createIadHttpHandler(bridge),generated=[],media=[],statusReads=[];
 let readingStatus=0,maxStatusReads=0;
 let releaseExploration; const waitingExploration=new Promise(resolve=>{releaseExploration=resolve});
 let blockStatus=false, releaseStatus, unavailableEvidence='';const statusGate=new Promise(resolve=>{releaseStatus=resolve});
 let delayStartResponse=false,startResponseReady=false,releaseStartResponse;
 let delayedEvidence='',releaseEvidence, delayedEvidenceReady=false;
 const evidenceGate=new Promise(resolve=>{releaseEvidence=resolve});
 const server=http.createServer(async(req,res)=>{
  if(delayedEvidence && new URL(req.url,'http://localhost').pathname===delayedEvidence){delayedEvidenceReady=true;await evidenceGate;if(res.destroyed)return;}
  if(req.method==='POST' && req.url==='/api/iad/exploration/start' && delayStartResponse){delayStartResponse=false;const end=res.end;res.end=function(...args){startResponseReady=true;releaseStartResponse=()=>{res.end=end;end.apply(res,args);};return res;};}
  if(/^\/api\/iad\/exploration\/(jobs|status\/)/.test(req.url)){
   statusReads.push(Date.now());maxStatusReads=Math.max(maxStatusReads,++readingStatus);
   let closed=false;const complete=()=>{if(!closed){closed=true;readingStatus--;}};res.once('finish',complete);res.once('close',complete);
  }
  if(unavailableEvidence && new URL(req.url,'http://localhost').pathname===unavailableEvidence){res.writeHead(503,{'Cache-Control':'no-store'});res.end('Evidence temporarily unavailable');return;}
  if(req.url.startsWith('/api/iad/media/'))media.push(req.url);
  if(req.url.startsWith('/api/iad/exploration/jobs') && blockStatus){await statusGate;if(res.destroyed)return;}
  if(req.url.startsWith('/model/')){
   let text='';for await(const c of req)text+=c;const b=JSON.parse(text);let answer;
   if(req.url==='/model/tokenize')answer={count:3000,max_model_len:32768};
   else{
    generated.push(b);const ids=b.messages[0].content.filter(v=>v.type==='text'&&v.text.startsWith('视觉证据：')).map(v=>JSON.parse(v.text.slice(5)).evidence_id);
    if(b.response_format.json_schema.name==='DirectionDraft')await waitingExploration;
    answer=b.response_format.json_schema.name==='DirectionDraft'?{summary:'两组样例的完整探索摘要。'.repeat(100),directions:[{title:'孔位与背景对照',instruction:'结合孔位比较背景遮挡与反光',applies_to:'both',rationale:`对照 ${ids[0]} 与 ${ids[20]}，保留未知引用 unknown-evidence-id。`,evidence_ids:[...ids.slice(0,3),...ids.slice(20,25)],limitations:['合成图']},{title:'异常局部破损',instruction:'观察异常样例的局部破损',applies_to:'defect',rationale:'异常组的可见线索',evidence_ids:[ids[20]],limitations:['仅适用于异常知识']}],limitations:['合成样例不代表质量真值','成像条件需要核对','标注规范待确认','只依据可见区域','需要人工确认方向']}
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
  const options=new firefox.Options().addArguments('-headless').setPreference('ui.primaryPointerCapabilities',6).setPreference('browser.cache.disk.enable',false).setPreference('browser.cache.memory.enable',false);if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const el=css=>driver.wait(until.elementLocated(By.css(css)),8000);
  const click=async text=>{const button=await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}' or @aria-label='${text}']`)),8000);await driver.wait(until.elementIsEnabled(button),8000);await button.click();};
  const responsiveEvidence=[];
  const checkResponsive=async(name,selector)=>{
    for(const [width,height,zoom,theme] of [[1920,1080,1,'light'],[1920,1080,1,'dark']]){
      await viewport(driver,width,height);await textZoom(driver,zoom);await driver.executeScript("document.body.toggleAttribute('data-ds-dark-theme',arguments[0])",theme==='dark');
      const measured=await driver.executeScript(selector=>{const root=document.querySelector(selector),body=root.getBoundingClientRect(),footer=root.querySelector('.iad-direction-footer')?.getBoundingClientRect(),canvas=root.querySelector('.iad-viewer-viewport')?.getBoundingClientRect();return {overflow:root.scrollWidth-root.clientWidth,viewport:[innerWidth,innerHeight],footer:footer ? [footer.top,footer.bottom] : null,canvas:canvas ? [canvas.width,canvas.height] : null,root:[body.top,body.bottom]};},selector);
      responsiveEvidence.push({name,width,height,zoom,theme,...measured});await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/1527-responsive.json'),JSON.stringify(responsiveEvidence,null,2));assert.ok(measured.overflow<=1,JSON.stringify(responsiveEvidence.at(-1)));
      if(measured.footer)assert.ok(measured.footer[0]>=0 && measured.footer[1]<=height,JSON.stringify(responsiveEvidence.at(-1)));
      if(measured.canvas)assert.ok(measured.canvas[0]>=120 && measured.canvas[1]>=120,JSON.stringify(responsiveEvidence.at(-1)));
      if(width===1920)await fs.writeFile(path.resolve(app,`../../runs/browser/ui-workbench/1527-${name}-${theme}-${width}-${zoom}.png`),await driver.takeScreenshot(),'base64');
    }
    await textZoom(driver,1);await viewport(driver,1366,768);await driver.executeScript("document.body.removeAttribute('data-ds-dark-theme')");
  };
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
  assert.equal((await driver.findElements(By.css('.iad-review-focused .iad-viewer-edge-button'))).length,2,'人工复核画布也使用边缘悬浮切图');
  assert.equal((await driver.findElements(By.css('.iad-review-focused .iad-image-step'))).length,0,'人工复核画布移除顶部文字切图');
  assert.equal((await driver.findElements(By.css('.iad-decision input[type=radio]'))).length,5,'保留五种人工裁决');
  const reviewImage=()=>driver.findElement(By.css('.iad-review-focused .iad-image-frame img')).getAttribute('src');
  const beforeReview=await reviewImage();
  const nextImage=await el('.iad-review-focused button[aria-label="下一张图像"]');
  await driver.actions().move({origin:nextImage}).perform();
  await fs.mkdir(path.resolve(app,'../../runs/browser/ui-workbench'),{recursive:true});
  await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/review-edge-right-1920.png'),await driver.takeScreenshot(),'base64');
  await nextImage.click();await driver.wait(async()=>(await reviewImage())!==beforeReview,5000);
  await(await el('.iad-review-focused button[aria-label="上一张图像"]')).click();await driver.wait(async()=>(await reviewImage())===beforeReview,5000);

  const focusLayout=await driver.executeScript("const c=document.querySelector('.iad-review-focused .iad-viewer-viewport').getBoundingClientRect(),b=document.querySelector('.iad-decision button[type=submit]').getBoundingClientRect();return {canvas:[c.width,c.height],submit:[b.top,b.bottom],height:innerHeight}");
  assert.ok(focusLayout.canvas[0]>300&&focusLayout.canvas[1]>200,JSON.stringify(focusLayout));assert.ok(focusLayout.submit[0]>=0&&focusLayout.submit[1]<=focusLayout.height,'1366×768当前图和提交入口同时可见');
  await fs.mkdir(path.resolve(app,'../../runs/browser/ui-workbench'),{recursive:true});await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/review-1366.png'),await driver.takeScreenshot(),'base64');
  await viewport(driver,1920,1080);await textZoom(driver,1);await click('复核记录');
  assert.equal(await(await el('[aria-label="复核视图"] button.active')).getText(),'复核记录','桌面仍能切换标签');
  await driver.wait(()=>driver.executeScript("return !document.querySelector('.iad-review-records')?.textContent.includes('加载复核记录')"),5000);
  assert.equal((await driver.findElements(By.css('.iad-inspector,.iad-pagination'))).length,0,'空复核记录不显示分页及队列中遗留的样本详情');
  await click('复核队列');await(await el('.iad-decision input[type=radio][value=FAIL]')).click();
  await click('复核记录');await click('复核队列');
  assert.equal(await(await el('.iad-decision input[type=radio][value=FAIL]')).isSelected(),true,'切换记录后保留未提交裁决草稿');await textZoom(driver,1);await viewport(driver,1366,768);


  await click('方向探索');await el('[data-page="industrial-exploration"]');
  assert.equal((await driver.findElements(By.css('input[aria-label="良品图像数量"]'))).length,0,'结果视图不挂载长配置');
  assert.equal(await driver.executeScript("return getComputedStyle(document.querySelector('.iad-exploration-page .iad-empty')).backgroundColor"),'rgb(255, 255, 255)','探索空态沿用 HTML 的白色内容表面');
  await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/exploration-empty-1366.png'),await driver.takeScreenshot(),'base64');
  await click('新建探索');
  assert.equal((await driver.findElements(By.xpath('//button[normalize-space(.)="选取良品图像" or normalize-space(.)="选取异常图像"]'))).length,0,'每组只保留一个选图入口，按数量选取位于选择器内');
  const promptBody=await el('textarea[aria-label="提示词正文"]');await promptBody.clear();await promptBody.sendKeys('浏览器识别句子：仅联合比较本轮证据，不推断内部材质。');
  await click('另存为新预设');await(await el('input[aria-label="预设名称"]')).sendKeys('浏览器对照预设');await click('保存预设');
  await driver.wait(async()=>(await(await el('textarea[aria-label="提示词正文"]')).getAttribute('value')).includes('浏览器识别句子'),5000);
  await(await el('textarea[aria-label="提示词正文"]')).sendKeys(' 本次临时编辑。');
  const executionText=await(await el('textarea[aria-label="提示词正文"]')).getAttribute('value');
  await(await el('select[aria-label="提示词预设"] option[value="variation"]')).click();await click('保留当前编辑');
  assert.equal(await(await el('textarea[aria-label="提示词正文"]')).getAttribute('value'),executionText);
  await count('良品','20');await count('异常','20');await click('选择良品图像');await click('按数量选择');await click('完成选择');await click('选择异常图像');await click('按数量选择');await click('完成选择');
  await driver.wait(async()=>await(await el('button.iad-primary')).isEnabled(),8000);
  await driver.navigate().refresh();
  assert.equal(await(await el('input[aria-label="良品图像数量"]')).getAttribute('value'),'20');
  assert.equal(await(await el('input[aria-label="异常图像数量"]')).getAttribute('value'),'20');
  await click('查看全部已选良品');await el('dialog[aria-label="选择良品图像"]');assert.equal((await driver.findElements(By.css('dialog .iad-source-option'))).length,10);await(await el('button[aria-label="关闭选择良品图像"]')).click();
  assert.equal(await(await el('textarea[aria-label="提示词正文"]')).getAttribute('value'),executionText,'刷新恢复按数据集保存的正文草稿');
  await checkResponsive('exploration-setup','.iad-exploration-setup-layout');
  await click('开始探索');
  await driver.wait(()=>generated.length===1,8000);
  await driver.wait(async()=>(await(await el('.iad-job-table')).getText()).includes('模型联合分析'),8000);
  assert.equal((await driver.findElements(By.css('.iad-exploration-page progress'))).length,0,'联合生成不显示逐图发布百分比');
  assert.equal((await(await el('.iad-job-table')).getText()).includes('完成 / 总数'),false,'探索列表不使用逐图完成数');
  await el('[aria-label="探索状态同步"]');
  assert.match(await(await el('.iad-exploration-progress')).getText(),/输入 40 张/);
  const synced=await(await el('[aria-label="探索状态同步"] .iad-muted')).getText();
  await driver.wait(async()=>(await(await el('[aria-label="探索状态同步"] .iad-muted')).getText())!==synced,5000,'慢模型期间仍持续成功同步');
  maxStatusReads=readingStatus;const beforeSteady=statusReads.length;
  await driver.sleep(3100);assert.ok(statusReads.length-beforeSteady>=2 && statusReads.length-beforeSteady<=3,'稳定运行期间只有一个1200毫秒状态轮询器');assert.equal(maxStatusReads,1,'状态读取按顺序完成');
  const workbenchWindow=await driver.getWindowHandle();await driver.switchTo().newWindow('tab');await driver.get('about:blank');
  const beforeHidden=statusReads.length;await driver.sleep(2600);assert.ok(statusReads.length-beforeHidden<=1,'后台页暂停轮询，允许一个已经发出的请求完成');
  await driver.close();await driver.switchTo().window(workbenchWindow);
  const beforeForeground=statusReads.length;await driver.wait(()=>statusReads.length>beforeForeground,2000,'回到真实前台后立即同步');
  await click('新建探索');
  const queuedPrompt='排队任务的冻结正文。';const queuedText=await el('textarea[aria-label="提示词正文"]');await queuedText.clear();await queuedText.sendKeys(queuedPrompt);
  const heldStarted=await driver.executeScript('return performance.now()');delayStartResponse=true;
  await click('加入队列');await driver.wait(()=>startResponseReady,5000,'队列持久化成功后延迟POST返回');
  await click('返回探索结果');await click('新建探索');
  const waitingDraft='旧提交返回前已重新打开的探索草稿。';const waitingText=await el('textarea[aria-label="提示词正文"]');await waitingText.clear();await waitingText.sendKeys(waitingDraft);
  releaseStartResponse();
  await driver.wait(()=>driver.executeScript("return performance.getEntriesByType('resource').some(e=>e.initiatorType==='fetch' && e.name.endsWith('/api/iad/exploration/start') && e.responseEnd>=arguments[0])",heldStarted),5000);
  assert.equal(await driver.executeScript("return document.querySelector('textarea[aria-label=\"提示词正文\"]')?.value"),waitingDraft,'旧提交的迟到响应不能关闭新配置或覆盖新草稿');
  await click('返回探索结果');await click('探索作业');
  const queuedJob=(await(await fetch(base+`/api/iad/exploration/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs.find(job=>job.status==='PENDING');
  await(await el(`button[aria-label="查看作业 ${queuedJob.run_id}"]`)).click();await driver.wait(()=>driver.executeScript("return document.querySelector('.iad-job-table')?.innerText.includes('排队第 1 项')"),5000);
  await click('取消排队');await driver.wait(()=>driver.executeScript("return document.querySelector('[aria-label=\"作业详情\"]')?.innerText.includes('已取消')"),5000);
  assert.equal(generated.length,1,'取消排队任务没有模型请求');
  await click('复制为新配置');assert.equal(await(await el('textarea[aria-label="提示词正文"]')).getAttribute('value'),queuedPrompt);
  const newDraft='仍在编辑的新草稿，不被旧任务完成覆盖。';const draftText=await el('textarea[aria-label="提示词正文"]');await draftText.clear();await draftText.sendKeys(newDraft);
  blockStatus=true;
  await driver.wait(()=>driver.executeScript("return document.querySelector('[aria-label=\"探索状态同步\"]')?.dataset.state==='stale'"),15000,'悬挂状态读取在10秒后进入stale');
  assert.equal(await(await el('button.iad-primary')).isEnabled(),false,'同步失败不能重复提交未知队列状态');
  const frozenClock=await(await el('.iad-exploration-progress>.iad-muted')).getText();
  await driver.sleep(1200);assert.equal(await(await el('.iad-exploration-progress>.iad-muted')).getText(),frozenClock,'stale时冻结上次快照的时钟');
  blockStatus=false;releaseStatus();await click('重试同步');
  await driver.wait(()=>driver.executeScript("return document.querySelector('[aria-label=\"探索状态同步\"]')?.dataset.state==='current'"),5000);
  releaseExploration();
  await driver.wait(async()=>(await(await fetch(base+`/api/iad/exploration/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs.some(job=>job.status==='COMPLETED'),10000);
  assert.equal(await(await el('textarea[aria-label="提示词正文"]')).getAttribute('value'),newDraft,'旧任务完成不覆盖新草稿或切换视图');
  await click('返回探索结果');await driver.wait(async()=>(await driver.findElements(By.css('table[aria-label="探索方向"] tbody tr'))).length===2,10000);
  assert.equal((await driver.findElements(By.css('table[aria-label="探索方向"] tbody tr'))).length,2,'按 HTML 用紧凑方向表呈现结果');
  const limits=await el('details.iad-exploration-limitations');
  assert.equal(await limits.getAttribute('open'),null,'整体限制默认收起');
  assert.match(await limits.findElement(By.css('summary')).getText(),/5 项/);
  await limits.findElement(By.css('summary')).sendKeys(Key.ENTER);
  assert.equal((await limits.findElements(By.css('ol li'))).length,5);
  await limits.findElement(By.css('summary')).sendKeys(Key.SPACE);
  await driver.wait(async()=>!(await limits.getAttribute('open')),2000);
  const summary=await el('[aria-label="探索摘要"]');
  assert.ok((await summary.getText()).length>200);
  const collapsed=await summary.getRect();await click('展开探索摘要');
  assert.ok((await summary.getRect()).height>collapsed.height);await click('收起探索摘要');
  for(const width of [1366,1792,1920]){
    await viewport(driver,width,1080);
    assert.ok(await driver.executeScript('const e=document.querySelector(".iad-exploration-results");return e.scrollWidth<=e.clientWidth+1'));
    await fs.writeFile(path.resolve(app,`../../runs/browser/ui-workbench/exploration-results-${width}.png`),await driver.takeScreenshot(),'base64');
  }
  await limits.findElement(By.css('summary')).click();
  await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/exploration-limits-1920.png'),await driver.takeScreenshot(),'base64');
  await limits.findElement(By.css('summary')).click();
  assert.equal(generated.length,1);assert.equal(generated[0].messages[0].content.filter(v=>v.type==='image_url').length,40);assert.ok(generated[0].messages[0].content[0].text.startsWith(executionText));
  const originalExploration=(await(await fetch(base+`/api/iad/exploration?dataset_id=${dataset.dataset_id}`)).json()).exploration;
  unavailableEvidence=`/api/iad/exploration/evidence/${originalExploration.version_id}/${originalExploration.directions[0].evidence_ids[0]}`;
  await click('查看方向');
  assert.equal((await driver.findElements(By.css('.iad-direction-evidence-item'))).length,8,'当前方向的3良品+5异常分组同时展示');
  await(await el('button[aria-label="定位证据 良品 N1"]')).click();assert.equal(await driver.executeScript("return document.activeElement.getAttribute('aria-label')"),'查看证据 良品 N1');
  assert.match(await(await el('.iad-direction-body')).getText(),/unknown-evidence-id/,'未知引用保留原文');
  await el('dialog.iad-direction-dialog .iad-media-error');
  delayedEvidence=unavailableEvidence;
  await(await el('button[aria-label="查看证据 良品 N1"]')).click();
  await driver.wait(()=>delayedEvidenceReady,5000,'真实证据请求暂缓返回');
  assert.equal(await driver.executeScript("const media=document.querySelector('dialog.iad-viewer-dialog .iad-viewer-media');return media?.getAttribute('aria-busy')==='true' && media.querySelector('[role=status]')?.textContent.includes('正在加载图像')"),true,'大图加载期间有可见状态，不能显示空白画布');
  const loadingStatus=await el('dialog.iad-viewer-dialog .iad-viewer-media [role=status]');
  assert.equal(await loadingStatus.isDisplayed(),true,'加载提示实际可见');
  for(const [width,height,zoom,theme] of [[1920,1080,1,'light'],[1920,1080,1,'dark']]){
   await viewport(driver,width,height);await textZoom(driver,zoom);await driver.executeScript("document.body.toggleAttribute('data-ds-dark-theme',arguments[0])",theme==='dark');
   assert.equal(await driver.executeScript("const e=document.querySelector('dialog.iad-viewer-dialog .iad-viewer-media [role=status]'),r=e.getBoundingClientRect();return r.width>0 && r.height>0 && r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight"),true,'桌面浅深色加载提示不遮挡或溢出');
   await fs.writeFile(path.resolve(app,`../../runs/browser/ui-workbench/image-loading-${theme}-${width}-${zoom}.png`),await driver.takeScreenshot(),'base64');
  }
  await textZoom(driver,1);await viewport(driver,1366,768);await driver.executeScript("document.body.removeAttribute('data-ds-dark-theme')");
  releaseEvidence();
  await el('dialog.iad-viewer-dialog .iad-viewer-media .iad-media-error');
  assert.equal(await(await el('dialog.iad-viewer-dialog .iad-viewer-media')).getAttribute('aria-busy'),'false','失败结束加载状态，显示原重试入口');
  unavailableEvidence='';
  assert.match(await(await el('.iad-viewer-heading')).getText(),/良品 N1.*1 \/ 8/,'媒体缺失保留当前集合位置');
  await(await el('dialog.iad-viewer-dialog .iad-viewer-media button[aria-label="重新加载图像"]')).click();
  await driver.wait(()=>driver.executeScript("const img=document.querySelector('dialog.iad-viewer-dialog .iad-viewer-world img');return img?.complete && img.naturalWidth>0 && !document.querySelector('dialog.iad-viewer-dialog .iad-viewer-media .iad-media-error')"),5000);
  assert.equal(await driver.executeScript("const media=document.querySelector('dialog.iad-viewer-dialog .iad-viewer-media');return media?.getAttribute('aria-busy')==='false' && !media.querySelector('[role=status]')"),true,'重试加载真实像素后移除加载提示');
  await click('返回方向详情');
  await(await el('dialog.iad-direction-dialog button[aria-label="重新加载图像"]')).click();
  await driver.wait(()=>driver.executeScript("return [...document.querySelectorAll('.iad-direction-evidence-item img')].every(img=>img.complete && img.naturalWidth>0) && !document.querySelector('dialog.iad-direction-dialog .iad-media-error')"),5000);
  await checkResponsive('direction-detail','dialog.iad-direction-dialog');
  await(await el('button[aria-label="查看证据 良品 N1"]')).click();
  await checkResponsive('evidence-viewer','dialog.iad-viewer-dialog');
  await(await el('select[aria-label="缩放"] option[value="1"]')).click();
  await(await el('.iad-viewer-viewport')).click();await driver.actions().sendKeys('\uE00F').perform();
  await driver.wait(()=>driver.executeScript("return document.querySelector('.iad-viewer-heading small')?.textContent.includes('2 / 8')"),5000);
  await driver.actions().move({origin:await el('button[aria-label="上一张图像"]')}).perform();await(await el('button[aria-label="上一张图像"]')).click();await driver.wait(()=>driver.executeScript("return document.querySelector('select[aria-label=\"缩放\"]').value==='1'"),5000,'每图保留真实100%缩放');
  await driver.actions().sendKeys('\uE00C').perform();
  await driver.wait(()=>driver.executeScript("return !document.querySelector('dialog.iad-viewer-dialog')"),5000);
  assert.equal(await driver.executeScript("return document.activeElement.getAttribute('aria-label')"),'查看证据 良品 N1','Esc恢复详情中原图像按钮焦点');
  await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/direction-detail-1366.png'),await driver.takeScreenshot(),'base64');
  await click('返回');await(await el('table[aria-label="探索方向"] tbody tr:nth-child(2) button')).click();
  assert.deepEqual(await driver.executeScript("return [...document.querySelectorAll('select[aria-label=\"采用知识类型\"] option')].map(option=>option.value)"),['defect'],'仅异常方向不能选择良品知识');
  await click('返回');await(await el('table[aria-label="探索方向"] tbody tr:first-child button')).click();
  assert.equal((await driver.findElements(By.css('.iad-direction-footer button.iad-primary'))).length,1);await click('去知识挖掘');await el('h3[data-action="mining-directions"]');await checkResponsive('knowledge-setup','.iad-knowledge-setup');await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/1527-responsive.json'),JSON.stringify(responsiveEvidence,null,2));
  const choice=await el('input[aria-label="启用探索方向 孔位与背景对照"]');assert.equal(await choice.isSelected(),false);await choice.click();await click('保存方向');
  await driver.wait(async()=>{const p=await(await fetch(base+`/api/iad/knowledge/prompt?dataset_id=${dataset.dataset_id}&kind=normal`)).json();return p.configuration.directions.some(v=>v.origin==='explored'&&v.enabled);},8000);
  await driver.manage().window().setRect({width:1920,height:1080});assert.equal(await driver.executeScript('return document.documentElement.scrollWidth>innerWidth'),false);await driver.manage().window().setRect({width:1440,height:1000});
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
  assert.equal((await driver.findElements(By.css('.iad-job[data-job-id]'))).length,0,'千条历史不自动打开详情');
  assert.equal((await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${large.dataset_id}`)).json()).jobs.length,30,'复用服务既有列表上限');
  await click('下一页');
  const firstVolume=await el('table[aria-label="作业列表"] tbody td[title]');
  const volumeJobId=await firstVolume.getAttribute('title');
  await firstVolume.click();await el('dialog[aria-label="作业详情"]');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  assert.equal(await(await el('table[aria-label="作业列表"] tbody td[title]')).getAttribute('title'),volumeJobId,'关闭抽屉保留当前分页');
  const jobSearch=await el('input[aria-label="搜索任务"]');await jobSearch.sendKeys(volumeJobId);
  await driver.wait(async()=>(await driver.findElements(By.css('table[aria-label="作业列表"] tbody tr'))).length===1,5000);
  await(await el('table[aria-label="作业列表"] tbody td[title]')).click();await el('dialog[aria-label="作业详情"]');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  assert.equal(await jobSearch.getAttribute('value'),volumeJobId,'关闭抽屉保留搜索');
  await(await el('select[aria-label="任务状态"] option[value="COMPLETED"]')).click();
  await driver.wait(async()=>(await driver.findElements(By.css('table[aria-label="作业列表"] tbody tr'))).length===0,5000);
  await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/knowledge-jobs-filter-empty.png'),await driver.takeScreenshot(),'base64');


 }catch(error){
  if(driver){await fs.writeFile(path.resolve(app,'../../runs/browser/ui-workbench/exploration-failure.png'),await driver.takeScreenshot(),'base64');console.error(JSON.stringify({location:await driver.getCurrentUrl(),generated:generated.length,counts:generated.reduce((counts,item)=>{const schema=item.response_format.json_schema.name;counts[schema]=(counts[schema]||0)+1;return counts;},{}),page:(await driver.findElement(By.css('body')).getText()).slice(-1800)}));}
  throw error;
 }finally{
  releaseExploration();releaseStatus();releaseEvidence();releaseStartResponse?.();await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));for(const k of keys)if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];await fs.rm(root,{recursive:true,force:true});
 }
});
