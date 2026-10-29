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
  const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'固定主图核验',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const comparisons=new Map();
  for(const [group,count] of [['a',23],['b',3],['c',3]])for(let i=1;i<count;i++)comparisons.set(`${group}-${String(i).padStart(2,'0')}`,await bridge.execute('consistency_compare',{sample_a:`${dataset.dataset_id}:${group}-00.png`,sample_b:`${dataset.dataset_id}:${group}-${String(i).padStart(2,'0')}.png`}));
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
const entries=[],mains=new Map(),listeners=new Set();let panel=null;
const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push(o)}}});
function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <div style={{height:'100%'}}>{Page&&<Page/>}</div>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge);let failMembers=false;
  const modelRequests=[];
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/tokenize'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({count:1000,max_model_len:262144}));}
    if(req.url==='/v1/chat/completions'){
      const chunks=[];for await(const chunk of req)chunks.push(chunk);modelRequests.push(JSON.parse(Buffer.concat(chunks)));
      const compared=comparisons.get('a-22');
      const assessments=[...comparisons].filter(([name])=>name.startsWith('a-')).map(([name])=>({candidate_id:dataset.dataset_id+':'+name+'.png',verdict:'EQUIVALENT',explanation:'仍作为问题展示；视觉对象一致，类别含义需核对。',findings:[]}));
      const references=[{candidate_id:dataset.dataset_id+':a-22.png',comparison:{result_id:compared.result_id,evidence_id:compared.evidence_id,difference_id:compared.annotation.differences[0].difference_id}}];
      const result={assessments,overall:{verdict:'EQUIVALENT',text:'整组视觉基本一致，保留标注差异待核对。',references},conclusions:[{text:'固定主图与末页候选的标注类别不同，仍需人工核对适用规范。',references}],limitations:['模型解释不写入人工裁决。']};
      res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({id:'local-group-analysis',model:'local-protocol-model',choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
    }
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    if(req.url.startsWith('/api/iad')){
      if(failMembers&&req.url==='/api/iad/consistency/gallery/members'){failMembers=false;res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:{message:'候选加载测试失败'}}));}
      return api(req,res);
    }
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}body{font-family:system-ui;font-size:14px}</style><div id="root"></div><script src="/browser.js"></script>');
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try{
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    const route={pageId:'industrial-consistency',tab:'conflicts',scope:{kind:'all_registered'},galleryOrder:'members'};
    const start=`http://127.0.0.1:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify(route)})}`;
    const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
    const click=async label=>(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${label}' or @aria-label='${label}']`)),10000)).click();
    await driver.get(start);await viewport(driver,1920,1080);
    const cards=()=>driver.findElements(By.css('[aria-label="冲突图像"] .iad-consistency-image-card'));
    await driver.wait(async()=>(await cards()).length===2,10000);
    assert.equal((await driver.findElements(By.css('.iad-consistency-master-detail'))).length,0);
    await click('缺少或多出标注 0');await driver.wait(async()=>(await cards()).length===0,5000);
    await click('全部差异 2');await driver.wait(async()=>(await cards()).length===2,5000);
    assert.equal((await driver.findElements(By.css('select[aria-label="差异筛选"]'))).length,0);
    assert.ok((await Promise.all((await cards()).map(card=>card.getText()))).every(text=>!text.includes('c-00.png')&&!text.includes('待核对')&&!text.includes('规范未确认')));
    const first=(await cards())[0];assert.match(await first.getText(),/22.*候选/);assert.doesNotMatch(await first.getText(),/点击查看|查询图像 ·/);
    await first.sendKeys(Key.ENTER);
    const modal=await element('dialog[aria-label="图组详情"]');
    assert.equal((await modal.findElements(By.xpath('.//button[normalize-space(.)="查看比较证据"]'))).length,0);
    const images=()=>driver.executeScript('return [...document.querySelectorAll("dialog[aria-label=图组详情] .iad-consistency-canvases .iad-image-frame img")].map(e=>e.src)');
    await driver.wait(async()=>(await images()).length===2,5000);const initial=await images();
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("dialog[aria-label=图组详情] .iad-image-frame img")].every(e=>e.complete&&e.naturalWidth>0)'),5000);
    const candidates=await driver.findElements(By.css('[aria-label="候选图像"] button[data-sample-id]'));assert.equal(candidates.length,20);
    await candidates[1].click();await driver.wait(async()=>(await images())[1]!==initial[1],5000);
    assert.equal((await images())[0],initial[0],'切换候选不得替换主图');
    await click('MLLM 分析');assert.match(await modal.getText(),/未分析/);assert.doesNotMatch(await modal.getText(),/MLLM 已分析|模拟总结/);
    const analysisVisible=await driver.executeScript(()=>{
      const r=document.querySelector('[aria-label="MLLM 组级分析"]').getBoundingClientRect();
      const footer=document.querySelector('.iad-group-footer').getBoundingClientRect();
      return r.top>=0&&r.bottom<=footer.top;
    });
    assert.ok(analysisVisible,'打开图组后应直接看到MLLM分析状态，不能被固定页脚遮住');
    await click('证据清单');await element('[data-difference="CATEGORY"]');
    const beforeZoom=await images();await (await driver.findElements(By.css('dialog[aria-label="图组详情"] button[aria-label="全屏检视"]')))[1].click();await element('dialog.iad-viewer-dialog');
    await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog.iad-viewer-dialog'))).length===0,5000);
    assert.deepEqual(await images(),beforeZoom);
    assert.equal(await driver.findElement(By.css('[aria-label="图组详情页签"] [role=tab][aria-selected=true]')).getText(),'证据清单');
    for(const width of [1366,1792,1920]){
      await viewport(driver,width,1080);
      const bounds=await driver.executeScript('const e=document.querySelector("dialog[aria-label=图组详情]"),r=e.getBoundingClientRect();return {width:r.width,left:r.left,right:r.right,overflow:e.scrollWidth-e.clientWidth}');
      assert.ok(bounds.overflow<=1&&bounds.left>=0&&bounds.right<=width+1,JSON.stringify(bounds));
      if(width===1920)assert.ok(bounds.width>=1440&&bounds.width<=1521);
      await fs.writeFile(path.join(output,`dialog-${width}.png`),await driver.takeScreenshot(),'base64');
    }
    await click('下一页候选');await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="候选图像"] button[data-sample-id]'))).length===2,5000);
    assert.equal((await images())[0],initial[0]);
    const currentUrl=await driver.getCurrentUrl();await driver.navigate().refresh();await element('dialog[aria-label="图组详情"]');
    await driver.wait(async()=>(await images()).length===2,5000);assert.equal((await images())[0],initial[0]);
    await click('下一组');await driver.wait(async()=>(await images())[0]!==initial[0],5000);
    await driver.actions().sendKeys(Key.ARROW_LEFT).perform();await driver.wait(async()=>(await images())[0]===initial[0],5000);
    await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="图组详情"]'))).length===0,5000);
    assert.equal(await driver.executeScript('return document.activeElement.classList.contains("iad-consistency-image-card")'),true);
    await fs.writeFile(path.join(output,'conflicts-grid-1920.png'),await driver.takeScreenshot(),'base64');
    await click('重复图组');await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="重复图组"] .iad-consistency-image-card'))).length===3,5000);
    assert.match(await driver.findElement(By.css('[aria-label="重复图组"] .iad-consistency-image-card')).getText(),/23.*成员/);
    await driver.findElement(By.css('[aria-label="重复图组"] .iad-consistency-image-card')).click();await element('dialog[aria-label="图组详情"]');
    await driver.wait(async()=>(await images()).length===2,5000);const groupImage=(await images())[0];await click('下一页候选');
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="候选图像"] button[data-sample-id]'))).length===2,5000);assert.equal((await images())[0],groupImage);
    await fs.writeFile(path.join(output,'duplicate-dialog-1920.png'),await driver.takeScreenshot(),'base64');
    await click('MLLM 分析');
    const groupRoute=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    await bridge.execute('consistency_group_analyze',{request:{query_id:groupRoute.queryId,kind:'groups',group_id:groupRoute.groupId,facts_state:'CURRENT',request_id:'browser-model-analysis'},_model_execution:{profile:{endpoint:`http://127.0.0.1:${server.address().port}/v1`,model_id:'local-protocol-model',capacity_mode:'vllm_tokenize',max_visual_inputs:16}}});
    await driver.wait(()=>driver.findElement(By.css('[aria-label="MLLM 组级分析"]')).getText().then(text=>text.includes('MLLM 已分析')),15000);
    assert.equal(modelRequests.length,1);
    assert.ok(modelRequests[0].messages[0].content.some(part=>part.type==='image_url'));
    assert.doesNotMatch(await driver.findElement(By.css('[aria-label="MLLM 组级分析"]')).getText(),/定位候选|定位核对图像|当前候选核对/);
    assert.match(await driver.findElement(By.css('[aria-label="MLLM 组级分析"]>div:last-child')).getText(),/整体结论.*视觉基本一致[\s\S]*整组视觉基本一致/);
    await driver.findElement(By.css('[aria-label="候选图像"] button[data-sample-id="'+dataset.dataset_id+':a-22.png"]')).click();
    await driver.wait(()=>driver.findElement(By.css('[aria-label="候选图像"] button[aria-pressed=true]')).getAttribute('data-sample-id').then(value=>value===dataset.dataset_id+':a-22.png'),5000);
    assert.equal((await images())[0],groupImage);
    assert.equal((await driver.findElements(By.xpath('//button[normalize-space(.)="查看冻结证据"]'))).length,0);
    await click('MLLM 分析');
    await driver.wait(()=>driver.findElement(By.css('[aria-label="MLLM 组级分析"]')).getText().then(text=>text.includes('MLLM 已分析')),5000);
    await driver.executeScript('arguments[0].scrollIntoView({block:"end"})',await driver.findElement(By.css('[aria-label="MLLM 组级分析"]')));
    await fs.writeFile(path.join(output,'saved-model-analysis-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    const modelFilter=await element('select[aria-label="MLLM结论筛选"]');
    await modelFilter.findElement(By.css('option[value="EQUIVALENT"]')).click();
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="重复图组"] .iad-consistency-image-card'))).length===1,5000);
    assert.match(await driver.findElement(By.css('.iad-consistency-model-state')).getText(),/视觉基本一致/);
    await driver.navigate().refresh();await element('select[aria-label="MLLM结论筛选"]');
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="重复图组"] .iad-consistency-image-card'))).length===1,5000);
    assert.equal(await driver.findElement(By.css('select[aria-label="MLLM结论筛选"]')).getAttribute('value'),'EQUIVALENT');
    await driver.findElement(By.css('select[aria-label="MLLM结论筛选"] option[value="all"]')).click();
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="重复图组"] .iad-consistency-image-card'))).length===3,5000);
    failMembers=true;await driver.findElement(By.css('[aria-label="重复图组"] .iad-consistency-image-card')).click();
    await driver.wait(()=>driver.findElement(By.css('dialog[aria-label="图组详情"]')).getText().then(text=>text.includes('候选加载测试失败')),5000);
    assert.equal((await driver.findElements(By.css('dialog[aria-label="图组详情"] .iad-consistency-canvases .iad-image-frame img'))).length,0,'失败时不显示上次候选');
    await click('关闭图组详情');
    execFileSync(bridge.pythonPath,['-c',`
import json,sys
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1])/'extra';r.mkdir()
for i in range(16):
 for side,label in [('left','scratch'),('right','dent')]:
  name=f'g-{i:02d}-{side}';Image.new('RGB',(80,60),(i*11,90,170)).save(r/(name+'.png'))
  (r/(name+'.json')).write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[{'label':label,'shape_type':'rectangle','points':[[10,10],[30,30]]}]}))
`,root]);
    const extra=await bridge.execute('dataset_import',{format:'labelme',name:'真实跨页图组',image_dir:path.join(root,'extra'),annotation_dir:path.join(root,'extra'),annotation_policy:{policy_id:'extra-policy',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    for(let i=0;i<16;i++)await bridge.execute('consistency_compare',{sample_a:`${extra.dataset_id}:g-${String(i).padStart(2,'0')}-left.png`,sample_b:`${extra.dataset_id}:g-${String(i).padStart(2,'0')}-right.png`});
    await click('标注冲突');await driver.wait(async()=>(await cards()).length===15,5000);
    await (await cards())[14].click();await driver.wait(async()=>(await images()).length===2,5000);const lastOnPage=(await images())[0];
    await click('下一组');await driver.wait(async()=>JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).galleryPage===2&&(await images()).length===2&&(await images())[0]!==lastOnPage,5000);
    await click('上一组');await driver.wait(async()=>JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).galleryPage===1&&(await images()).length===2&&(await images())[0]===lastOnPage,5000);
    await fs.writeFile(path.join(output,'cross-page-group-1920.png'),await driver.takeScreenshot(),'base64');
    await click('关闭图组详情');
    const expired=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).queryId;
    execFileSync(bridge.pythonPath,['-c',
      'import sqlite3,sys\nwith sqlite3.connect(sys.argv[1]) as c:c.execute("UPDATE consistency_queries SET expires_at=? WHERE query_id=?",("2000-01-01T00:00:00+00:00",sys.argv[2]))',path.join(root,'test.db'),expired]);
    await click('下一页');
    await driver.wait(async()=>(await cards()).length===15,10000);
    const recovered=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad'));
    assert.notEqual(recovered.queryId,expired);assert.equal(recovered.galleryPage,1);
    assert.doesNotMatch(await driver.findElement(By.css('body')).getText(),/Result snapshot is unavailable/);
    console.log(JSON.stringify({output,groups:2,anchorCandidates:22,reloadRoute:currentUrl.includes('queryId'),realComparisons:40,crossPageGroups:18,localModelRequests:modelRequests.length}));
  }catch(error){if(driver){await fs.writeFile(path.join(output,'failure.png'),await driver.takeScreenshot(),'base64');console.error((await driver.findElement(By.css('body')).getText()).slice(-5000));}throw error;}
  finally{if(driver)await driver.quit();await new Promise(resolve=>server.close(resolve));}
});
