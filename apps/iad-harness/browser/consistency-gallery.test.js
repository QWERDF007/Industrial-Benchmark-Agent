import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';
import {viewport} from './workbench-layout.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('consistency galleries preserve anchors, candidate pages, modal focus and frozen evidence', {timeout:120000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-gallery-browser-'));
  const output=process.env.IAD_GALLERY_OUTPUT||'/tmp/iad-gallery-browser';await fs.mkdir(output,{recursive:true});
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});t.after(()=>bridge.destroy());
  execFileSync(bridge.pythonPath,['-c',`
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
r=Path(sys.argv[1]);(r/'images').mkdir();(r/'labels').mkdir()
for group,count,color in [('a',23,'#bdc8d2'),('b',3,'#e4d4b1'),('c',3,'#a7ccd9')]:
 im=Image.new('RGB',(640,480),color);d=ImageDraw.Draw(im);d.rectangle((100,80,540,400),fill='#314257');d.ellipse((180,180,260,260),fill=color)
 for i in range(count):
  name=f'{group}-{i:02d}';im.save(r/'images'/f'{name}.png')
  (r/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':640,'imageHeight':480,'shapes':[{'label':f'category-{min(i,2) if group!="c" else 0}','shape_type':'rectangle','points':[[180,180],[260,260]]}]}))
`,root]);
  const group=await bridge.execute('dataset_group_create',{name:'一致性真实资源'});
  const dataset=await bridge.execute('dataset_import',{format:'labelme',group_id:group.group_id,name:'固定主图核验',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const comparisons=new Map();
  for(const [group,count] of [['a',23],['b',3],['c',3]])for(let i=1;i<count;i++)comparisons.set(`${group}-${String(i).padStart(2,'0')}`,await bridge.execute('consistency_compare',{sample_a:`${dataset.dataset_id}:${group}-00.png`,sample_b:`${dataset.dataset_id}:${group}-${String(i).padStart(2,'0')}.png`}));
  const started=await bridge.execute('consistency_start',{subjects:{kind:'all_registered'},mode:'exact',request_id:'browser-program'});
  let batch;
  do {await new Promise(resolve=>setTimeout(resolve,20));batch=await bridge.execute('consistency_status',{batch_id:started.batch_id});}while(['PENDING','RUNNING'].includes(batch.status));
  assert.equal(batch.status,'COMPLETED');
  let expectedReport=await bridge.execute('consistency_report',{selection:{kind:'batch',batch_id:batch.batch_id},relation:'EXACT',annotation_differences_only:true});
  let expectedGallery=await bridge.execute('consistency_gallery',{query_id:expectedReport.page.query_id,kind:'conflicts',order:'members'});
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
const entries=[],mains=new Map(),listeners=new Set();let panel=null;
const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push(o)}}});
function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <div style={{height:'100%'}}>{Page&&<Page/>}</div>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge);
  const modelRequests=[];
  const programReads=[];
  let reviewContextReads=0;
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/tokenize'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({count:1000,max_model_len:262144}));}
    if(req.url==='/v1/chat/completions'){
      const chunks=[];for await(const chunk of req)chunks.push(chunk);modelRequests.push(JSON.parse(Buffer.concat(chunks)));
      const body=modelRequests.at(-1), text=body.messages[0].content[0].text;
      const visual=body.response_format.json_schema.name==='GroupAnalysisDraft';
      const scope=JSON.parse(text.split(visual?'冻结图组：':'冻结批次分析：')[1].split('\n请根据图像')[0]);
      const references=visual?Object.entries(scope.candidates).map(([candidate_id,item])=>({candidate_id,
        comparison:{result_id:item.comparison.result_id,evidence_id:item.comparison.evidence_id}}))
        :scope.summaries.flatMap(item=>item.result.overall.references);
      const result={...(visual?{assessments:references.map(ref=>({candidate_id:ref.candidate_id,verdict:'MATERIAL',explanation:'对应标注的原始类别值不同。',findings:['标注类别不同']}))}:{}),
        overall:{verdict:'MATERIAL',text:'标注类别不同',references},conclusions:[{text:'固定主图与候选的像素相同，对应标注的原始类别值不同。',references}],limitations:[]};
      res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({id:'local-group-analysis',model:'local-protocol-model',choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
    }
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    if(req.url.startsWith('/api/iad')){
      if(req.url.startsWith('/api/iad/consistency/runs'))programReads.push(req.url);
      if(req.url==='/api/iad/consistency/review/context')reviewContextReads++;
      return api(req,res);
    }
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}body{font-family:system-ui;font-size:14px}</style><div id="root"></div><script src="/browser.js"></script>');
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try{
    const workflow=await bridge.execute('analysis_start',{request:{analysis_kind:'consistency',mode:'exact',dataset_ids:[dataset.dataset_id]},
      _model_execution:{profile:{endpoint:`http://127.0.0.1:${server.address().port}/v1`,model_id:'local-protocol-model',capacity_mode:'vllm_tokenize',max_visual_inputs:16}}});
    let workflowState;
    do {await new Promise(resolve=>setTimeout(resolve,20));workflowState=await bridge.execute('analysis_status',{run_id:workflow.run_id});}while(['PENDING','RUNNING'].includes(workflowState.status));
    assert.equal(workflowState.status,'COMPLETED',JSON.stringify(workflowState.errors));
    batch=await bridge.execute('consistency_status',{batch_id:workflowState.program_batch_id});
    expectedReport=await bridge.execute('consistency_report',{selection:{kind:'batch',batch_id:batch.batch_id},relation:'EXACT',annotation_differences_only:true});
    expectedGallery=await bridge.execute('consistency_gallery',{query_id:expectedReport.page.query_id,kind:'conflicts',order:'members'});
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    const start=`http://127.0.0.1:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify({pageId:"industrial-consistency"})})}`;
    const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
    const click=async label=>(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${label}' or @aria-label='${label}']`)),10000)).click();
    await driver.get(start);await viewport(driver,1920,1080);
    const operations=await element(`[data-dc-row="${batch.batch_id}"] .dc-operations`);
    assert.ok(!programReads.includes('/api/iad/consistency/runs'),'列表只读取当前范围作业引用的程序批次，不重算全局历史批次');
    assert.ok(programReads.includes('/api/iad/consistency/runs/'+batch.batch_id));
    assert.deepEqual(await Promise.all((await operations.findElements(By.css('button'))).map(button=>button.getAttribute('aria-label'))),
      ['查看统计结果',`删除检查作业 ${batch.batch_id}`],'作业操作与HTML原型一致，不添加检查作业详情入口');
    assert.equal((await driver.findElements(By.css('dialog[aria-label="检查作业详情"]'))).length,0);
    const stats=await operations.findElement(By.css('button[aria-label="查看统计结果"]'));await stats.click();
    const statistics=await element('.dc-stats-dialog');
    const statsLayout=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return {modal:arguments[0].matches("dialog:modal"),width:r.width,x:r.x+r.width/2-innerWidth/2,y:r.y+r.height/2-innerHeight/2}',statistics);
    assert.equal(statsLayout.modal,true,'统计窗口应复用公共原生Modal');assert.equal(statsLayout.width,960);assert.ok(Math.abs(statsLayout.x)<=1&&Math.abs(statsLayout.y)<=1);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
    assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',stats),true,'统计关闭后焦点回到操作按钮');
    const cards=()=>driver.findElements(By.css('[data-dc="open-conflict"]'));
    await driver.wait(async()=>(await cards()).length===expectedGallery.total,10000);
    assert.equal(reviewContextReads,0,'图库首次渲染不能逐卡片读取完整图像复核上下文');
    for(const card of await cards())assert.match(await card.getText(),/模型：存在实质差异/);
    const first=await element(`[data-dc="open-conflict"][data-id="${expectedGallery.items[0].group_id}"]`);await first.click();
    await driver.wait(async()=>/固定主图与候选/.test(await (await element('[aria-label="模型分析"]')).getText()),10000);
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="candidate"]'))).length===22,10000);
    const comparison=await element('#dc-compare-mask');
    assert.equal(await driver.executeScript('return getComputedStyle(arguments[0]).display',await comparison.findElement(By.css('.dc-dialog-body'))),'block','对比正文保留独立的文档流，不能继承方向详情的弹性布局');
    const compareLayout=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return {modal:arguments[0].matches("dialog:modal"),width:r.width,x:r.x+r.width/2-innerWidth/2,y:r.y+r.height/2-innerHeight/2}',comparison);
    assert.equal(compareLayout.modal,true,'冲突对比应复用公共原生Modal');assert.equal(compareLayout.width,1380);assert.ok(Math.abs(compareLayout.x)<=1&&Math.abs(compareLayout.y)<=1);
    const zoom=await element('[data-dc="zoom-anchor"]');await zoom.click();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===2,5000);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===1,5000);
    assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',zoom),true,'关闭大图返回原对比图焦点');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
    assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',first),true,'关闭对比返回图像卡片焦点');
    await first.click();await element('#dc-compare-mask [data-dc="zoom-anchor"] img');
    const anchorSrc=await driver.findElement(By.css('[data-dc="zoom-anchor"] img')).getAttribute('src');
    const lastCandidate=(await driver.findElements(By.css('[data-dc="candidate"]')))[21];
    const candidateLayout=await driver.executeScript(`return [arguments[0],arguments[0].parentElement,arguments[0].parentElement.parentElement].map(element=>{
      const style=getComputedStyle(element),rect=element.getBoundingClientRect();return {className:element.className,display:style.display,height:rect.height,width:rect.width,maxHeight:style.maxHeight,overflow:style.overflow,flex:style.flex};})`,lastCandidate);
    assert.ok(candidateLayout[0].height>100,JSON.stringify(candidateLayout));
    await driver.executeScript('arguments[0].scrollIntoView({block:"nearest",inline:"center"})',lastCandidate);
    await lastCandidate.click();
    await driver.wait(async()=>await driver.findElement(By.css('[data-dc="zoom-candidate"] img')).getAttribute('src')!==anchorSrc,5000);
    assert.equal(await driver.findElement(By.css('[data-dc="zoom-anchor"] img')).getAttribute('src'),anchorSrc);
    assert.ok(anchorSrc.includes('/consistency/evidence/'));
    await fs.writeFile(path.join(output,'current-conflict-dialog.png'),await driver.takeScreenshot(),'base64');
    await click('关闭');
    const report=await bridge.execute('consistency_report',{selection:{kind:'batch',batch_id:batch.batch_id},relation:'EXACT',annotation_differences_only:true});
    const gallery=await bridge.execute('consistency_gallery',{query_id:report.page.query_id,kind:'conflicts',order:'members'});
    const analyzed=await bridge.execute('consistency_group_analysis',{query_id:report.page.query_id,kind:'conflicts',group_id:gallery.items[0].group_id,facts_state:'CURRENT'});
    assert.equal(analyzed.status,'COMPLETED');
    assert.equal(analyzed.result.assessments.length,22);
    assert.equal(new Set(analyzed.result.assessments.map(item=>item.candidate_id)).size,22);
    assert.ok(modelRequests.some(body=>body.response_format.json_schema.name==='GroupAnalysisSummary'));
    await (await element(`[data-dc="open-conflict"][data-id="${expectedGallery.items[0].group_id}"]`)).click();
    const confirm=await element('input[name="dc-review"][value="confirmed"]');await driver.wait(until.elementIsEnabled(confirm),10000);await confirm.click();
    await driver.findElement(By.id('dc-note')).sendKeys('实际核对后确认此比较的差异');
    await click('保存复核');await driver.wait(async()=>(await driver.findElements(By.css('#dc-compare-mask'))).length===0,10000);
    await driver.navigate().refresh();await driver.wait(async()=>(await cards()).length===expectedGallery.total,10000);
    await (await element(`[data-dc="open-conflict"][data-id="${expectedGallery.items[0].group_id}"]`)).click();
    await driver.wait(async()=>await driver.findElement(By.css('input[name="dc-review"][value="confirmed"]')).isSelected(),10000);
    const members=await bridge.execute('consistency_gallery_members',{query_id:report.page.query_id,kind:'conflicts',group_id:gallery.items[0].group_id,facts_state:'CURRENT'});
    const reviewed=await bridge.execute('consistency_review_context',{evidence_id:members.items[0].comparison.evidence_id});
    assert.equal(reviewed.decisions.at(-1).request.action.kind,'CONFIRM_DIFFERENCE');assert.equal(reviewed.review_events.length,0);
    await click('关闭');
    const originalRow=await element(`[data-dc-row="${batch.batch_id}"]`);
    await originalRow.findElement(By.css('td')).click();
    const following=await bridge.execute('analysis_start',{request:{analysis_kind:'consistency',mode:'exact',dataset_ids:[dataset.dataset_id]},
      _model_execution:{profile:{endpoint:`http://127.0.0.1:${server.address().port}/v1`,model_id:'local-protocol-model',capacity_mode:'vllm_tokenize',max_visual_inputs:16}}});
    let followingState;
    do {await new Promise(resolve=>setTimeout(resolve,20));followingState=await bridge.execute('analysis_status',{run_id:following.run_id});}while(['PENDING','RUNNING'].includes(followingState.status));
    assert.equal(followingState.status,'COMPLETED',JSON.stringify(followingState.errors));
    const followingDelete=await element(`[data-dc-row="${followingState.program_batch_id}"] [data-icon="delete"]`);
    assert.equal(await originalRow.getAttribute('aria-selected'),'true','后台新增记录不切换当前选中作业');
    await followingDelete.sendKeys(Key.ENTER);
    const deletion=await element('dialog[aria-label="删除检查作业"][open]');
    const cancel=await deletion.findElement(By.css('button[aria-label="取消删除"]'));
    assert.equal(await driver.switchTo().activeElement().then(element=>element.getId()),await cancel.getId());
    await cancel.sendKeys(Key.ENTER);
    await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="删除检查作业"][open]'))).length===0,10000);
    assert.equal(await originalRow.getAttribute('aria-selected'),'true','确认窗的按键不能触发背景作业行');
    await followingDelete.click();
    const confirmedDeletion=await element('dialog[aria-label="删除检查作业"][open]');
    await confirmedDeletion.findElement(By.css('button[data-variant="danger"]')).click();
    await driver.wait(async()=>!(await bridge.execute('analysis_list',{dataset_id:dataset.dataset_id,analysis_kind:'consistency'})).jobs
      .some(job=>job.root_run_id===following.run_id),10000,'轮询新增的作业应可直接删除');
    assert.equal((await bridge.execute('analysis_status',{run_id:workflow.run_id})).status,'COMPLETED','删除新增记录不影响原作业');
    await driver.wait(async()=>(await cards()).length===expectedGallery.total,10000);
    execFileSync(bridge.pythonPath,['-c','import sqlite3,sys\nwith sqlite3.connect(sys.argv[1]) as c:c.execute("UPDATE consistency_queries SET expires_at=?",("2000-01-01T00:00:00+00:00",))',path.join(root,'test.db')]);
    await (await cards())[0].click();
    await driver.wait(async()=>(await driver.findElement(By.css('#dc-compare-mask')).getText()).includes('snapshot'),10000);
    assert.equal((await driver.findElements(By.css('[data-dc="zoom-candidate"] img'))).length,0,'失败时不得显示旧候选或主图代替候选');
    await click('关闭');await click('新建检查');
    await bridge.execute('dataset_delete',{dataset_id:dataset.dataset_id});
    await click('开始检查');
    await driver.wait(async()=>(await driver.findElements(By.css('#dc-new-mask [role="alert"]'))).length>0,10000);
    assert.ok(await driver.findElement(By.id('dc-new-mask')).isDisplayed());
    assert.equal((await bridge.execute('consistency_list',{})).items.length,0,'创建失败不得留下假作业');
    console.log(JSON.stringify({output,groups:expectedGallery.total,anchorCandidates:22,modelRequests:modelRequests.length}));
  }catch(error){if(driver){await fs.writeFile(path.join(output,'failure.png'),await driver.takeScreenshot(),'base64');console.error((await driver.findElement(By.css('body')).getText()).slice(-5000));}throw error;}
  finally{if(driver)await driver.quit();await new Promise(resolve=>server.close(resolve));}
});
