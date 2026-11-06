import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('job status drawer follows supplied snapshots and restores focus without polling', {timeout:60000},async()=>{
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {JobStatusDrawer,JobStatusButton} from './src/client/components/JobStatusDrawer.tsx';import {WorkspaceContext} from './src/client/workspace.tsx';import {workbenchStyles} from './src/client/styles.ts';
const workspace={subscribe:()=>()=>{},getSnapshot:()=>state,view:()=>({job:''})},state={pageId:'industrial-consistency'};
const initial={run_id:'analysis-real-contract',root_run_id:'analysis-real-contract',job_type:'ANALYSIS_WORKFLOW',analysis_kind:'consistency',status:'RUNNING',phase:'ANALYZING_CONFLICT_GROUPS',phase_started_at:'2026-11-05T12:00:00Z',message:'比较真实图组',completed:0,failed:0,unprocessed:100,total_samples:100,progress:0,total_gallery_groups:99,completed_gallery_groups:14,started_at:'2026-11-05T11:00:00Z',errors:[],batch_runs:[]};
function App(){const [open,setOpen]=React.useState(false),[job,setJob]=React.useState(initial);return <WorkspaceContext.Provider value={workspace}><style>{workbenchStyles}</style><main className="iad-workbench"><div id="completed"><JobStatusButton job={{...initial,status:'COMPLETED'}} onClick={()=>setOpen(true)}/></div><div id="running"><JobStatusButton job={initial} onClick={()=>setOpen(true)}/></div><button key={job.run_id} data-job-root="analysis-real-contract" id="launch" onClick={()=>setOpen(true)}>查看状态</button><button id="stop" onClick={()=>setJob({...initial,run_id:'analysis-retry-attempt',status:'FAILED',message:'模型调用失败',failed:1,unprocessed:99,errors:[{sample_id:'sample-1',relative_path:'image.png',code:'MODEL_OUTPUT_INVALID',message:'真实响应格式不完整',source_run_id:'real-child-step',source_phase:'EXPLORING_DIRECTIONS'}]})}>更新服务快照</button>{open&&<JobStatusDrawer job={job} onClose={()=>setOpen(false)}/>}</main></WorkspaceContext.Provider>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let driver;
 try{
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1600,height:1000});await driver.get(`http://127.0.0.1:${server.address().port}`);
  const el=id=>driver.wait(until.elementLocated(By.id(id)),5000), click=async id=>(await el(id)).click();
  assert.equal((await driver.findElements(By.css('#completed button'))).length,0,'成功状态仅显示文本，不打开状态抽屉');
  assert.equal(await driver.executeScript('return getComputedStyle(document.querySelector("#running button")).borderWidth'),'0px','状态文字不套按钮边框');
  await click('launch');const drawer=await driver.wait(until.elementLocated(By.css('dialog[open]')),5000);
  assert.equal(await drawer.getAttribute('aria-label'),'作业状态');
  const rect=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return {width:r.width,right:r.right,height:r.height,view:innerWidth}',drawer);
  assert.equal(rect.width,560);assert.equal(rect.right,rect.view);
  const appearance=await driver.executeScript('const s=getComputedStyle(arguments[0]),section=arguments[0].querySelector("section"),body=arguments[0].querySelector(".iad-job-drawer-body");return {radius:s.borderTopRightRadius,sectionBorder:getComputedStyle(section).borderLeftWidth,top:body.getBoundingClientRect().top}',drawer);
  assert.equal(await driver.executeScript('return getComputedStyle(arguments[0],"::backdrop").backgroundColor',drawer),'rgba(17, 28, 45, 0.49)');
  assert.equal(appearance.radius,'0px','抽屉边角沿用HTML的全高直角');
  assert.equal(appearance.sectionBorder,'0px','阶段区域只有分割线，不套卡片边框');
  assert.equal(appearance.top,64,'抽屉正文紧接64px标题栏');
  assert.equal((await drawer.findElements(By.css('.iad-job-metrics,.iad-job-progress-card,.iad-retry-scope'))).length,0,'抽屉不添加原型之外的统计卡片和表单');
  assert.equal((await drawer.findElements(By.css('.iad-job-stage'))).length,4,'阶段列表沿用HTML结构');
  assert.deepEqual(await Promise.all((await drawer.findElements(By.css('footer button'))).map(button=>button.getText())),['关闭']);
  assert.match(await drawer.getText(),/14 \/ 99/);assert.match(await drawer.getText(),/分析冲突图组/);
  assert.match(await drawer.getText(),/2026/);assert.ok(!(await drawer.getText()).includes('准备图像已完成'),'current phase must not invent a history');
  await driver.executeScript("document.getElementById('stop').click()");
  await driver.wait(async()=>/真实响应格式不完整/.test(await drawer.getText()),5000);
  assert.match(await drawer.getText(),/MODEL_OUTPUT_INVALID/);assert.match(await drawer.getText(),/image.png/);assert.match(await drawer.getText(),/real-child-step/);assert.match(await drawer.getText(),/模型联合分析/);
  await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  await driver.wait(async()=>await driver.executeScript('return document.activeElement.id')==='launch',5000);
 }finally{await driver?.quit();await new Promise(r=>server.close(r));}
});
