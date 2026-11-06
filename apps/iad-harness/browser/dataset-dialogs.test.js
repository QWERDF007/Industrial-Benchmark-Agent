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
const cwd=path.resolve(app,'../..');

test('dataset dialogs preserve drafts, native focus, real imports and isolated deletion',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-dataset-dialogs-'));
  const bridge=new PythonBridge({cwd,dbPath:path.join(root,'test.db')});
  let driver,server,releaseListing,releaseDeletion,delayListing=false,delayDeletion=false;
  t.after(async()=>{releaseListing?.();releaseDeletion?.();await driver?.quit();server?.closeAllConnections();if(server?.listening)await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});});
  execFileSync(bridge.pythonPath,['-c',`
from pathlib import Path
from PIL import Image
import sys
p=Path(sys.argv[1])
for directory in ['images/inner','labels','incoming/images/batch','incoming/labels','classification/OK','classification/NG']:
    (p/directory).mkdir(parents=True)
for filename,color in [('images/source.png','blue'),('incoming/images/batch/next.png','red'),('classification/OK/ok.png','green'),('classification/NG/ng.png','red')]:
    Image.new('RGB',(80,60),color).save(p/filename)
`,root]);
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {DatasetManager} from './src/client/components/DatasetManager.tsx';
    import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const workspace=new Workspace(null);const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    function App(){const [data,setData]=React.useState(null);const load=()=>Promise.all([
      fetch('/api/iad/datasets').then(r=>r.json()),fetch('/api/iad/datasets/groups').then(r=>r.json())
    ]).then(([catalog,groups])=>setData({catalog,groups}));React.useEffect(()=>{void load()},[]);
      return <WorkspaceContext.Provider value={workspace}><main className="iad-workbench">{data&&<DatasetManager
        datasets={data.catalog.datasets} groups={data.groups.groups} selected={data.catalog.datasets[0]} onChanged={()=>void load()}/>}</main></WorkspaceContext.Provider>
    }createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge);
  server=http.createServer(async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');return;}
    if(req.url.startsWith('/api/iad/directories?')&&delayListing){delayListing=false;await new Promise(resolve=>{releaseListing=resolve;});}
    if(req.method==='DELETE'&&delayDeletion){delayDeletion=false;await new Promise(resolve=>{releaseDeletion=resolve;});}
    await api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const call=async(route,body)=>{const response=await fetch(base+'/api/iad/'+route,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});assert.equal(response.status,200,await response.clone().text());return response.json();};
  const group=await call('datasets/groups',{name:'真实目录'});
  const dataset=await call('datasets/import',{format:'labelme',name:'原图',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels'),group_id:group.group_id});
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1440,height:1000});await driver.get(base);
  const el=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  const click=async element=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',element);await element.click();};
  const expand=await el(`button[data-expand="${group.group_id}"]`);await click(expand);
  assert.equal((await driver.findElements(By.css(`tr[data-id="${dataset.dataset_id}"]`))).length,0);
  await click(expand);await el(`tr[data-id="${dataset.dataset_id}"]`);
  const trigger=await driver.wait(until.elementLocated(By.xpath('//input[@id="image-dir"]/following-sibling::button')),10000);await click(trigger);
  const dialog=await el('[aria-label="浏览服务器目录 - 图像目录"]');
  const geometry=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return {modal:arguments[0].matches("dialog:modal"),width:r.width,x:r.x+r.width/2-innerWidth/2,y:r.y+r.height/2-innerHeight/2}',dialog);
  assert.equal(geometry.modal,true,'目录选择应使用共享原生Modal');assert.equal(geometry.width,960);assert.ok(Math.abs(geometry.x)<=1&&Math.abs(geometry.y)<=1);
  const input=await dialog.findElement(By.css('input'));
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',input),true);
  await input.clear();await input.sendKeys(path.join(root,'absent'),Key.ENTER);
  await driver.wait(until.elementLocated(By.css('dialog [role="alert"]')),10000);
  const choose=await dialog.findElement(By.xpath('.//button[normalize-space(.)="选择此目录"]'));
  assert.equal(await choose.isEnabled(),false,'失败的目录导航不能提交未验证的路径');
  assert.equal(await(await el('#image-dir')).getAttribute('value'),path.join(root,'images'));
  await input.clear();await input.sendKeys(path.join(root,'images'),Key.ENTER);
  await driver.wait(async()=>await choose.isEnabled(),10000);
  await click(await dialog.findElement(By.xpath('.//button[normalize-space(.)="inner"]')));
  await driver.wait(async()=>await input.getAttribute('value')===path.join(root,'images/inner'),10000);
  await click(choose);
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await(await el('#image-dir')).getAttribute('value'),path.join(root,'images/inner'));
  assert.equal((await call('datasets/'+dataset.dataset_id)).image_dir,path.join(root,'images'),'目录选择只编辑草稿');
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',trigger),true);
  delayListing=true;await click(trigger);const reopened=await el('dialog[open]');
  const editing=await reopened.findElement(By.css('input'));await editing.clear();await editing.sendKeys(path.join(root,'images'));
  await driver.wait(()=>Boolean(releaseListing),5000);releaseListing();
  await driver.wait(async()=>await(await reopened.findElement(By.css('nav'))).getAttribute('aria-busy')==='false',10000);
  assert.equal(await editing.getAttribute('value'),path.join(root,'images'),'慢目录响应不能覆盖用户正在输入的路径');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',trigger),true);
  await click(await driver.findElement(By.xpath('//button[normalize-space(.)="取消更改"]')));
  await click(await el('button[aria-label="关闭详情抽屉"]'));
  const create=await el('#addBtn');await click(create);
  const creation=await el('[aria-label="添加数据集"]');
  assert.equal(await driver.executeScript('return arguments[0].matches("dialog:modal")',creation),true,'数据集表单也必须使用共享Modal');
  assert.equal(await driver.executeScript('return arguments[0].getBoundingClientRect().width',creation),740,'添加数据集使用原型的表单尺寸');
  assert.ok((await creation.getRect()).height<400,'添加数据集按字段撑高');
  const choices=await driver.executeScript(()=>[...document.querySelectorAll('dialog[open] input[name="new-kind"]')].map(input=>{const label=input.parentElement,r=label.getBoundingClientRect(),s=getComputedStyle(label);return {x:r.x,y:r.y,width:r.width,height:r.height,border:s.borderTopWidth}}));
  assert.ok(choices.every(choice=>choice.border==='1px'&&choice.height>=49),'添加类型恢复HTML的并排选项卡片');
  assert.equal(choices[0].y,choices[1].y);assert.ok(choices[0].x<choices[1].x);

  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',create),true);
  await click(await el(`button[aria-label="为 ${group.name} 添加子数据集"]`));
  const form=await el('dialog[aria-label="添加数据集"][open]');
  assert.equal(await driver.executeScript('return arguments[0].getBoundingClientRect().width',form),740,'同一添加表单不随添加类型变成其他弹窗尺寸');
  assert.ok((await form.getRect()).height<700,'子数据集表单不拉满屏幕');
  assert.equal(await(await el('#new-parent')).isEnabled(),false);
  assert.equal(await(await el('input[name="new-kind"][value="group"]')).isEnabled(),false);
  await(await el('#new-name')).sendKeys('新增真实子集');
  await(await el('#new-path')).sendKeys(path.join(root,'images'));
  await(await el('#new-label-path')).sendKeys(path.join(root,'labels'));
  const submit=await form.findElement(By.css('button[type="submit"]'));await click(submit);
  await driver.wait(until.elementLocated(By.css('dialog [role="alert"]')),10000);
  assert.equal(await(await el('#new-name')).getAttribute('value'),'新增真实子集','失败导入保留表单');
  const source=await el('#new-path');await source.clear();await source.sendKeys(path.join(root,'incoming/images'));
  const labels=await el('#new-label-path');await labels.clear();await labels.sendKeys(path.join(root,'incoming/labels'));
  const browse=await driver.findElement(By.xpath('//input[@id="new-path"]/following-sibling::button'));await click(browse);
  await el('dialog[aria-label="浏览服务器目录 - 图像目录"][open]');
  assert.equal((await driver.findElements(By.css('dialog:modal'))).length,2,'目录选择保留父级表单');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===1,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',browse),true);
  assert.equal(await(await el('#new-name')).getAttribute('value'),'新增真实子集');
  await click(browse);const nested=await el('dialog[aria-label="浏览服务器目录 - 图像目录"][open]');
  const batch=await driver.wait(until.elementLocated(By.xpath('//dialog//button[normalize-space(.)="batch"]')),10000);await click(batch);
  const confirm=await nested.findElement(By.xpath('.//button[normalize-space(.)="选择此目录"]'));
  await driver.wait(until.elementIsEnabled(confirm),10000);await click(confirm);
  assert.equal(await source.getAttribute('value'),path.join(root,'incoming/images/batch'));
  await click(submit);
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
  const imported=(await call('datasets')).datasets.find(value=>value.name==='新增真实子集');
  assert.ok(imported);assert.equal(imported.group_id,group.group_id);assert.equal(imported.total_samples,1);
  assert.equal(imported.image_dir,path.join(root,'incoming/images/batch'));
  await click(await el('button[aria-label="关闭详情抽屉"]'));
  const remove=await el(`tr[data-id="${imported.dataset_id}"] button[data-icon="delete"]`);await remove.sendKeys(Key.ENTER);
  assert.equal((await driver.findElements(By.css('aside.dataset-drawer'))).length,0,'行内按钮的键盘操作不能选择背景数据行');
  const deletion=await el('[aria-label="删除数据集"]');
  assert.equal(await driver.executeScript('return arguments[0].matches("dialog:modal")',deletion),true,'数据集删除确认应复用公共删除交互');
  assert.equal(await driver.executeScript('return arguments[0].getBoundingClientRect().width',deletion),530);
  assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),'取消删除');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',remove),true);
  assert.equal((await call('datasets')).datasets.length,2);
  await click(remove);delayDeletion=true;
  await click(await el('dialog[open] button[data-variant="danger"]'));
  await driver.wait(()=>Boolean(releaseDeletion),5000);
  assert.equal((await driver.findElements(By.css('aside.dataset-drawer'))).length,0,'删除确认的点击不能选中背景数据行');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  assert.equal((await driver.findElements(By.css('dialog[open]'))).length,1,'删除进行时不能关闭确认窗口');
  releaseDeletion();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
  assert.equal((await call('datasets')).datasets.length,1);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'search','被删行移除后焦点回到搜索栏');
  await fs.access(path.join(root,'incoming/images/batch/next.png'));
  await(await el(`tr[data-id="${dataset.dataset_id}"]`)).sendKeys(Key.ENTER);
  await el('aside.dataset-drawer');
  await click(await el('button[aria-label="关闭详情抽屉"]'));
  await click(create);await(await el('#new-name')).sendKeys('异常验证');
  await click(await el('dialog[open] button[type="submit"]'));
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
  const anomalyGroup=(await call('datasets/groups')).groups.find(value=>value.name==='异常验证');assert.ok(anomalyGroup);
  await click(await el('button[aria-label="关闭详情抽屉"]'));
  await click(await el('button[aria-label="为 异常验证 添加子数据集"]'));
  await click(await el('input[name="new-format"][value="folder_classification"]'));
  await(await el('#new-name')).sendKeys('OK和NG');await(await el('#new-path')).sendKeys(path.join(root,'classification'));
  const folderSubmit=await el('dialog[open] button[type="submit"]');await driver.wait(until.elementIsEnabled(folderSubmit),10000);await click(folderSubmit);
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
  const all=(await call('datasets')).datasets,anomaly=all.filter(value=>value.format==='folder_classification');
  assert.equal(anomaly.length,1,'OK和NG目录应导入为同一个子数据集');
  assert.equal(anomaly[0].total_samples,2);assert.equal(anomaly[0].group_id,anomalyGroup.group_id);
  assert.equal(all.find(value=>value.dataset_id===dataset.dataset_id).group_id,group.group_id);
  const images=(await call('samples?dataset_id='+anomaly[0].dataset_id)).items;
  assert.deepEqual(images.map(value=>value.quality_status).sort(),['FAIL','PASS']);
  await click(await el('button[aria-label="关闭详情抽屉"]'));
  await click(await el(`tr[data-id="${anomalyGroup.group_id}"] button[data-icon="delete"]`));
  const cascade=await el('dialog[aria-label="删除大数据集"][open]');
  assert.ok((await cascade.getText()).includes('1 个子数据集'));
  assert.equal(await cascade.findElement(By.css('button[data-variant="danger"]')).isEnabled(),false,'父级包含子集时按原型先处理子集');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await click(await el(`tr[data-id="${anomaly[0].dataset_id}"] button[data-icon="delete"]`));
  await click(await el('dialog[open] button[data-variant="danger"]'));
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
  await click(await el(`tr[data-id="${anomalyGroup.group_id}"] button[data-icon="delete"]`));
  const emptyGroup=await el('dialog[aria-label="删除大数据集"][open]');
  assert.equal(await emptyGroup.findElement(By.css('button[data-variant="danger"]')).isEnabled(),true);
  await click(await emptyGroup.findElement(By.css('button[data-variant="danger"]')));
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
  assert.equal((await call('datasets')).datasets.length,1);
  assert.equal((await call('datasets/groups')).groups.length,1);
  await fs.access(path.join(root,'classification/NG/ng.png'));
});
