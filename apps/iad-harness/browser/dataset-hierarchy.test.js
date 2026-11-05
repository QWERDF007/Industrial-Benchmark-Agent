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

test('all workbench scopes honor real parents and preserve unassigned data without creating groups',{timeout:90000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-dataset-hierarchy-'));
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  let driver,server;
  t.after(async()=>{await driver?.quit();server?.closeAllConnections();if(server?.listening)await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});});
  execFileSync(bridge.pythonPath,['-c',`
import sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);(p/'labels').mkdir()
for name,color in [('a','blue'),('b','red'),('u','green')]:
    (p/name).mkdir();Image.new('RGB',(80,60),color).save(p/name/(name+'.png'))
`,root]);
  const realGroups=[];
  for(const name of ['项目一','项目二','空分组'])realGroups.push(await bridge.execute('dataset_group_create',{name}));
  const datasets=[];
  for(const [index,key,name] of [[0,'a','超节点_项目一'],[1,'b','框胶_项目二'],[2,'u','框胶_未分配']])datasets.push(await bridge.execute('dataset_import',{
    format:'labelme',name,image_dir:path.join(root,key),annotation_dir:path.join(root,'labels'),...(index<2?{group_id:realGroups[index].group_id}:{})}));
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
    const entries=[],mains=new Map(),listeners=new Set();let panel=null;
    const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
    apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push(o)}}});
    function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav>{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>}
    createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge),writes=[],reads=[];
  server=http.createServer(async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');return;}
    if(req.method!=='GET')writes.push({method:req.method,url:req.url});else reads.push(req.url);await api(req,res);
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const read=async route=>{const r=await fetch(base+'/api/iad/'+route);assert.equal(r.status,200);return r.json();};
  let stage="initial";
  try {
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1904,height:1000});await driver.get(base);
  const el=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  const click=async node=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
  const navigate=async label=>click(await driver.wait(until.elementLocated(By.xpath(`//nav/button[normalize-space(.)="${label}"]`)),10000));
  await navigate('数据集管理');await el(`tr[data-id="${datasets[0].dataset_id}"]`);
  assert.equal((await driver.findElements(By.css('.dataset-table .data-row:not(.parent-row)'))).length,3,'未分配父级的数据不能从管理列表消失');
  const unassigned=await driver.findElement(By.xpath('//tr[contains(@class,"parent-row")][.//span[normalize-space(.)="未分组"]]'));
  assert.equal((await unassigned.findElements(By.css('button[data-icon="edit"],button[data-icon="delete"],button[data-icon="add"]'))).length,0,'未分组是只读视图区，不是可写后端分组');
  const ownership=await driver.executeScript(()=>{const groups={};let parent;for(const row of document.querySelectorAll('.dataset-table tbody tr[data-id]')){if(row.classList.contains('parent-row'))parent=row.querySelector('.name-text').textContent;else groups[row.dataset.id]=parent;}return groups;});
  assert.deepEqual(ownership,{[datasets[0].dataset_id]:'项目一',[datasets[1].dataset_id]:'项目二',[datasets[2].dataset_id]:'未分组'});
  for(const [page,parent,child,menu] of [
    ['图像浏览','#parent','#child','#child-menu'],['方向探索','#exp-parent','#exp-child-toggle','#exp-child-menu'],
    ['知识挖掘','#dataset','#subset',null],['数据一致性','#dc-parent','#dc-child-trigger','#dc-child-options'],
    ['模型审计','#audit-dataset','#audit-child-trigger','#audit-child-menu']]){
    stage=page;await navigate(page);await el(parent);
    await driver.wait(async()=>(await driver.findElements(By.css(parent+' option'))).length===4,10000,page+'应展示实际三个分组和未分组');
    const virtual=await driver.findElement(By.xpath(`//select[@id="${parent.slice(1)}"]/option[normalize-space(.)="未分组"]`));
    for(const [groupId,expected] of [[realGroups[0].group_id,datasets[0].dataset_id],[realGroups[1].group_id,datasets[1].dataset_id],[await virtual.getAttribute('value'),datasets[2].dataset_id]]){
      stage=page+" / "+groupId;await click(await el(`${parent} option[value="${groupId}"]`));
      if(menu){await click(await el(child));await driver.wait(async()=>(await driver.findElements(By.css(menu+' input[type=checkbox]'))).length===1,5000);}
      const choices=await driver.findElements(By.css(menu?menu+' input[type=checkbox]':child+' option'));
      assert.deepEqual((await Promise.all(choices.map(node=>node.getAttribute('value')))).filter(value=>value.startsWith('ds_')),[expected],page+'不能按名称猜父级或把未分组塞进第一组');
      if(menu)await click(await el(child));
    }
  }
  assert.ok(reads.some(url=>url.startsWith('/api/iad/samples?')),'图像浏览使用当前多子集查询');
  assert.equal(reads.some(url=>/^\/api\/iad\/samples\/[^?]+\?/.test(url)),false,'原图像浏览加载器不能在新页面后台重复查询另一份样本');
  assert.equal(writes.length,0,'浏览范围不应创建或迁移真实数据集');
  assert.equal((await read('datasets/groups')).groups.length,3);
  assert.equal((await read('datasets')).datasets.find(d=>d.dataset_id===datasets[2].dataset_id).group_id,null);
  await navigate('数据集管理');
  for(let index=0;index<realGroups.length;index++){
    const group=realGroups[index];await click(await el(`tr[data-id="${group.group_id}"] button[data-icon="delete"]`));
    await click(await el('dialog:modal button[data-variant="danger"]'));
    await driver.wait(async()=>(await read('datasets/groups')).groups.length===realGroups.length-index-1,10000);
    await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
  }
  assert.equal((await driver.findElements(By.css('.dataset-table .parent-row'))).length,1,'删除全部真实组后只保留未分组视图');
  await navigate('图像浏览');
  assert.deepEqual(await Promise.all((await driver.findElements(By.css('#parent option'))).map(node=>node.getText())),['未分组']);
  await el(`[data-sample-id="${datasets[2].dataset_id}:u.png"]`);
  await navigate('数据集管理');await click(await el(`tr[data-id="${datasets[2].dataset_id}"] button[data-icon="delete"]`));
  await click(await el('dialog:modal button[data-variant="danger"]'));
  await driver.wait(async()=>(await read('datasets')).datasets.length===0,10000);
  await el('.dataset-table .blank');
  assert.equal((await driver.findElements(By.css('.dataset-table .parent-row'))).length,0,'空库不应出现固定示例分组');
  await(await el('#addBtn')).click();
  assert.equal(await(await el('input[name="new-kind"][value="child"]')).isEnabled(),false,'没有真实父级时不能创建挂靠到虚拟分区的子数据集');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  for(const name of ['a','b','u'])await fs.access(path.join(root,name,name+'.png'));
  }catch(error){console.error(stage,(await driver.findElement(By.css('body')).getText()).slice(-2600));await fs.writeFile('/tmp/iad-hierarchy-failure.png',await driver.takeScreenshot(),'base64');throw error;}
});
