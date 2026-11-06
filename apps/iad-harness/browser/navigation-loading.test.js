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

test('navigation preserves a loaded dataset catalog and does not present loading as missing data',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-navigation-'));
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  execFileSync(bridge.pythonPath,['-c',`import json,sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir()
Image.new('RGB',(80,60),'gray').save(p/'images/image.png')
(p/'labels/image.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[{'label':'类别-'+str(i),'shape_type':'rectangle','points':[[10,10],[30,30]]} for i in range(40)]}))`,root]);
  const group=await bridge.execute('dataset_group_create',{name:'导航验收'});
  const dataset=await bridge.execute('dataset_import',{format:'labelme',group_id:group.group_id,name:'真实导航范围',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
const entries=[],mains=new Map(),listeners=new Set();let panel='industrial-exploration';
const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push(o)}}});
function App(){const [id,setId]=React.useState(panel);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav>{entries.map(e=><button key={e.id} aria-label={e.label} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav><Page/></>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,write:false,format:'iife',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  let releaseCatalog,requested,releaseSample;
  const sampleGate=new Promise(resolve=>releaseSample=resolve);
  const gate=new Promise(resolve=>releaseCatalog=resolve),started=new Promise(resolve=>requested=resolve);
  let reads=0;
  const api=createIadHttpHandler(bridge);
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    if(req.url.startsWith('/api/iad/sample/'))await sampleGate;
    if(req.url==='/api/iad/datasets'){reads++;requested();await gate;}
    if(req.url.startsWith('/api/iad/'))return api(req,res);
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><div id="root"></div><script src="/app.js"></script>');
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let driver;
  try{
    const options=new firefox.Options().addArguments('-headless');options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
    await driver.get(`http://127.0.0.1:${server.address().port}`);await started;
    const text=await driver.findElement(By.css('.iad-workbench')).getText();
    assert.ok(!text.includes('请先添加服务器上的数据集'),'加载期间不得错误提示添加数据集');
    assert.ok(!text.includes('选择数据集'),'加载期间不得显示空白范围选择器');
    releaseCatalog();await driver.wait(until.elementLocated(By.css('#exp-parent option')),10000);
    await driver.wait(async()=>await driver.findElement(By.id('exp-parent')).getAttribute('value')===dataset.group_id,10000);
    for(const [label,selector] of [['知识挖掘','#dataset'],['模型审计','#audit-dataset'],['数据一致性','#dc-parent'],['方向探索','#exp-parent']]){
      await driver.findElement(By.css(`button[aria-label="${label}"]`)).click();
      const control=await driver.wait(until.elementLocated(By.css(selector)),10000);
      assert.equal(await control.getAttribute('value'),dataset.group_id,'首次绘制已有目录，不闪空白');
      assert.ok(!(await driver.findElement(By.css('body')).getText()).includes('请先添加服务器上的数据集'));
    }
    await driver.findElement(By.css('button[aria-label="数据集管理"]')).click();
    await driver.wait(until.elementLocated(By.css('.dataset-table button[data-edit="'+dataset.dataset_id+'"]')),5000);
    assert.equal((await driver.findElements(By.id('summaryCount'))).length,0,'数据集表格上方不重复展示标题与数量');
    const manager=await driver.executeScript(()=>{
      const toolbar=document.querySelector('.iad-manager-search-wrap').getBoundingClientRect(),table=document.querySelector('.table-wrap').getBoundingClientRect();
      const search=document.getElementById('search').getBoundingClientRect(),clear=document.getElementById('manager-clear-search').getBoundingClientRect();
      return {left:toolbar.left,tableLeft:table.left,edits:[...document.querySelectorAll('.name-area button[data-icon="edit"]')].map(button=>({right:button.getBoundingClientRect().right,area:button.closest('.name-area').getBoundingClientRect().right})),clear:document.getElementById('manager-clear-search').parentElement===document.querySelector('.iad-manager-search-wrap'),searchCenter:search.y+search.height/2,clearCenter:clear.y+clear.height/2};
    });
    assert.equal(manager.left,manager.tableLeft,'搜索栏放在表格左侧');assert.equal(manager.clear,true,'清除按钮随搜索栏左移');
    assert.ok(Math.abs(manager.searchCenter-manager.clearCenter)<1,'清除按钮与搜索输入框保持同一行');
    assert.ok(manager.edits.length>=2);assert.ok(manager.edits.every(edit=>Math.abs(edit.right-edit.area)<1),'数据集与子数据集的编辑按钮均右对齐');
    assert.equal(reads,1,'各页面共享同一份数据集目录');
    await driver.findElement(By.css('.parent-row button[data-icon="delete"]')).click();
    const deletion=await driver.wait(until.elementLocated(By.css('dialog[aria-label="删除大数据集"][open]')),5000);
    assert.equal(await deletion.findElement(By.css('#confirm-accept')).isEnabled(),false,'包含子数据集时保留原型的删除约束');
    assert.match(await deletion.getText(),/请先处理其中的子数据集/);
    assert.deepEqual(await Promise.all((await deletion.findElements(By.css('footer button'))).map(button=>button.getText())),['取消','确认删除']);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.findElement(By.css('button[aria-label="图像浏览"]')).click();
    const card=await driver.wait(until.elementLocated(By.css('#grid .iad-thumbnail-card')),10000);await card.click();
    const preview=await driver.wait(until.elementLocated(By.id('detail-preview')),5000);
    const before=await preview.getRect();releaseSample();
    await driver.wait(async()=>(await driver.findElements(By.css('#detail-ann-content tbody tr'))).length===40,10000);
    const after=await preview.getRect();assert.ok(before.height>=310);
    assert.ok(Math.abs(before.height-after.height)<1,JSON.stringify({before,after})+'，标注返回后不能挤压图片预览区');
    assert.equal((await preview.findElements(By.css('svg.iad-annotation-layer > g > rect'))).length,40);


  }finally{releaseSample();releaseCatalog();await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));}
});
