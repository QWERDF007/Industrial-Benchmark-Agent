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
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('image details preserve native focus, current metadata and annotations across nested navigation',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-image-dialogs-'));
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  let driver,server,releaseDetail,delayDetail=true,blockedReads=0;
  const detailBarrier=new Promise(resolve=>{releaseDetail=resolve;});
  t.after(async()=>{releaseDetail();await driver?.quit();server?.closeAllConnections();if(server?.listening)await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});});
  execFileSync(bridge.pythonPath,['-c',`
import json,sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1])
for folder in ['images','labels','classification/OK','classification/NG']:(p/folder).mkdir(parents=True)
for name,size,color in [('a',(600,400),'blue'),('b',(900,300),'green')]:
    Image.new('RGB',size,color).save(p/'images'/f'{name}.png')
    (p/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':size[0],'imageHeight':size[1],'shapes':[{'label':name+'-mark','shape_type':'rectangle','points':[[10,20],[90,80]]}]}))
for folder,color in [('OK','white'),('NG','red')]:Image.new('RGB',(80,60),color).save(p/'classification'/folder/'sample.png')
`,root]);
  const labelmeGroup=await bridge.execute('dataset_group_create',{name:'标注图像'});
  const anomalyGroup=await bridge.execute('dataset_group_create',{name:'异常图像'});
  const labelme=await bridge.execute('dataset_import',{format:'labelme',name:'两张标注图',group_id:labelmeGroup.group_id,image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const folder=await bridge.execute('dataset_preview',{root_dir:path.join(root,'classification')});
  await bridge.execute('dataset_import',{format:'folder_classification',name:'OK与NG',group_id:anomalyGroup.group_id,root_dir:path.join(root,'classification'),rules:folder.items.map(({path,role})=>({path,role})),preview_fingerprint:folder.preview_fingerprint});
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
    import {ImagesPage} from './src/client/components/ImagesPage.tsx';import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    Promise.all([fetch('/api/iad/datasets').then(r=>r.json()),fetch('/api/iad/datasets/groups').then(r=>r.json())]).then(([catalog,groups])=>
      createRoot(document.getElementById('root')).render(<main className="iad-workbench"><ImagesPage datasets={catalog.datasets} groups={groups.groups}/></main>));`,
    loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge);
  server=http.createServer(async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');return;}
    if(req.url==='/api/iad/sample/'+encodeURIComponent(labelme.dataset_id+':b.png')&&delayDetail){blockedReads++;await detailBarrier;}
    await api(req,res);
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1904,height:1000});await driver.get(`http://127.0.0.1:${server.address().port}/`);
  const el=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  await(await el(`#parent option[value="${labelmeGroup.group_id}"]`)).click();
  const first=await el(`[data-sample-id="${labelme.dataset_id}:a.png"]`);await first.click();
  const detail=await el('#overlay');
  const geometry=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return {modal:arguments[0].matches("dialog:modal"),width:r.width,x:r.x+r.width/2-innerWidth/2,y:r.y+r.height/2-innerHeight/2}',detail);
  assert.equal(geometry.modal,true,'图像详情使用公共原生Modal');assert.equal(geometry.width,1380);assert.ok(Math.abs(geometry.x)<=1&&Math.abs(geometry.y)<=1);
  await driver.wait(async()=>(await(await el('#detail-ann-content')).getText()).includes('a-mark'),10000);
  await el('#detail-preview svg[aria-label="Labelme 标注"]');
  assert.ok((await(await el('#detail-fields')).getText()).includes(path.join(root,'images/a.png')));
  const preview=await el('#detail-preview');await preview.click();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===2,5000);
  await el('dialog[aria-label="原图检视器"] svg[aria-label="Labelme 标注"]');
  assert.equal(await(await el('#full-file-name')).getText(),'a.png');
  assert.equal((await driver.findElements(By.css('#full-overlay .iad-image-quality'))).length,0,'Labelme大图不显示图级OK/NG');
  await(await el('button[aria-label="下一张图像"]')).click();
  await driver.wait(()=>blockedReads>0,5000);await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===1,5000);
  const pendingText=await(await el('#detail-fields')).getText();
  assert.ok(pendingText.includes('b.png'));assert.ok(!pendingText.includes(path.join(root,'images/a.png')),'新图请求等待时不能显示上张图的路径');
  assert.ok(pendingText.includes('900 × 300'),'请求等待时使用当前样本尺寸');
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',preview),true);
  delayDetail=false;releaseDetail();
  await driver.wait(async()=>(await(await el('#detail-ann-content')).getText()).includes('b-mark'),10000);
  assert.equal(blockedReads,1,'详情和大图复用同一次样本详情请求');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',first),true);
  await(await el(`#parent option[value="${anomalyGroup.group_id}"]`)).click();
  const anomaly=await el('#grid [data-sample-id]');await anomaly.click();
  const annotations=await el('table[aria-label="异常检测标注列表"]');
  assert.match(await annotations.getText(),/OK|NG/);
  await(await el('#detail-preview')).click();await el('#full-overlay');
  const badges=await driver.findElements(By.css('.full-toolbar .iad-image-quality'));
  assert.equal(badges.length,1,'异常检测大图的图级标签应位于顶部工具栏');
  assert.equal((await driver.findElements(By.css('.full-stage .iad-image-quality'))).length,0);
  const quality=await badges[0].getText();assert.match(quality,/^(OK|NG)$/);
  const labelStyle=await driver.executeScript('const s=getComputedStyle(arguments[0]),f=getComputedStyle(document.querySelector("#full-file-name"));return {background:s.backgroundColor,color:s.color,fileColor:f.color,fontSize:s.fontSize,fileFontSize:f.fontSize,fontWeight:s.fontWeight,fileFontWeight:f.fontWeight,padding:s.padding,border:s.borderWidth,shadow:s.boxShadow}',badges[0]);
  assert.equal(labelStyle.background,'rgba(0, 0, 0, 0)','图级标注为纯文本，不带颜色块');
  assert.equal(labelStyle.color,labelStyle.fileColor,'图级标注与文件名使用相同文字颜色');
  assert.equal(labelStyle.fontSize,labelStyle.fileFontSize);
  assert.equal(labelStyle.fontWeight,labelStyle.fileFontWeight);
  assert.equal(labelStyle.padding,'0px');assert.equal(labelStyle.border,'0px');assert.equal(labelStyle.shadow,'none');
  const position=await driver.executeScript('const b=arguments[0].getBoundingClientRect(),t=document.querySelector(".full-toolbar").getBoundingClientRect();return {dx:b.x+b.width/2-t.x-t.width/2,dy:b.y+b.height/2-t.y-t.height/2}',badges[0]);
  assert.ok(Math.abs(position.dx)<=1&&Math.abs(position.dy)<=1,'OK/NG位于工具栏几何中央');
  assert.equal(await(await el('#full-file-name')).getText(),'sample.png');
  await(await el('button[aria-label="下一张图像"]')).click();
  await driver.wait(async()=>await(await el('.full-toolbar .iad-image-quality')).getText()===(quality==='OK'?'NG':'OK'),10000);
  assert.deepEqual(await driver.executeScript('const s=getComputedStyle(document.querySelector(".full-toolbar .iad-image-quality")),f=getComputedStyle(document.querySelector("#full-file-name"));return {background:s.backgroundColor,color:s.color,fileColor:f.color}'),{background:'rgba(0, 0, 0, 0)',color:labelStyle.fileColor,fileColor:labelStyle.fileColor});
  assert.equal(await(await el('#full-file-name')).getText(),'sample.png');
  const output=path.resolve(app,'../../runs/browser/image-dialogs');await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,'quality-toolbar.png'),await driver.takeScreenshot(),'base64');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',anomaly),true);
});
