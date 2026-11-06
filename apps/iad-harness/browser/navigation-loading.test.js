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
    const headings=[];
    for(const width of [1440,1920]){
      await driver.manage().window().setRect({width,height:1000});
      for(const label of ['数据集管理','图像浏览','方向探索','知识挖掘','数据一致性','模型审计']){
        await driver.findElement(By.css(`button[aria-label="${label}"]`)).click();
        await driver.wait(()=>driver.executeScript('return document.querySelector(".iad-workbench h1")?.textContent===arguments[0]',label),10000);
        const metrics=await driver.executeScript(()=>{
          const root=document.querySelector('.iad-workbench'),title=root.querySelector('h1'),header=title.closest('.iad-header,.exp-heading,.dc-page-heading,.topline,.audit-heading');
          const r=root.getBoundingClientRect(),t=title.getBoundingClientRect(),h=header.getBoundingClientRect(),s=getComputedStyle(title),hs=getComputedStyle(header);
          return {font:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,left:t.left-r.left,top:t.top-r.top,height:h.height,gap:hs.marginBottom,rootPadding:getComputedStyle(root).paddingTop,extra:!!root.querySelector('.eyebrow,.audit-kicker,[aria-label="所在章节"]')};
        });
        headings.push({width,page:label,...metrics});
        const sections={'方向探索':['探索作业','探索结果'],'知识挖掘':['挖掘作业','知识条目'],'数据一致性':['检查作业','标注冲突'],'模型审计':['审计作业','审计结果']}[label];
        if(sections)for(const title of sections){
          const section=await driver.executeScript(name=>{
            const h=[...document.querySelectorAll('.iad-workbench h2')].find(e=>e.textContent.trim()===name);
            if(!h)return null;
            const header=h.closest('header,.panelbar,.exp-selected-head,.dc-section-heading'),s=getComputedStyle(h),hs=getComputedStyle(header),r=header.getBoundingClientRect(),t=h.getBoundingClientRect();
            return {font:s.fontSize,weight:s.fontWeight,line:s.lineHeight,height:r.height,left:hs.paddingLeft,right:hs.paddingRight,border:hs.borderBottomWidth,borderStyle:hs.borderBottomStyle,align:hs.alignItems,offset:t.left-r.left,center:t.top+t.height/2-r.top-r.height/2};
          },title);
          assert.ok(section,label+'显示'+title);
          assert.equal(section.font,'16px',title+'字号');assert.equal(section.weight,'650',title+'字重');assert.equal(section.line,'24px',title+'行高');
          assert.equal(section.height,70,title+'标题栏高度');assert.equal(section.left,'20px');assert.equal(section.right,'20px');
          assert.equal(section.border,'1px');assert.equal(section.borderStyle,'solid');assert.equal(section.align,'center');assert.equal(section.offset,20);assert.ok(Math.abs(section.center)<1,title+'垂直居中');
        }
        assert.equal(metrics.font,'24px',label+'标题字号');assert.equal(metrics.weight,'670',label+'标题字重');
        assert.equal(metrics.lineHeight,'32.4px');assert.equal(metrics.letterSpacing,'-0.4px');
        assert.equal(metrics.left,32,label+'标题左侧位置');assert.equal(metrics.rootPadding,'25px',label+'页面顶部内边距');
        assert.equal(metrics.height,42,label+'标题行高');assert.equal(metrics.gap,'18px',label+'标题下方间距');assert.equal(metrics.extra,false,label+'不显示额外章节小字');
      }
    }
    for(const heading of headings)assert.ok(Math.abs(heading.top-headings[0].top)<.1,JSON.stringify(headings));
    await fs.writeFile('/tmp/iad-v76-headings.json',JSON.stringify(headings,null,2));
    await driver.findElement(By.css('button[aria-label="知识挖掘"]')).click();
    await driver.findElement(By.id('create-btn')).click();
    await driver.wait(until.elementLocated(By.id('kb-setup-page')),5000);
    const creationHeading=await driver.executeScript('const h=document.querySelector("#kb-setup-page h1");return {font:getComputedStyle(h).fontSize,weight:getComputedStyle(h).fontWeight,display:getComputedStyle(h.closest("header")).display}');
    assert.deepEqual(creationHeading,{font:'24px',weight:'670',display:'flex'},'新建挖掘沿用共享标题，移除旧标题规则后仍保留布局');
    await driver.findElement(By.id('kb-setup-back')).click();
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
    const deleted=await driver.executeAsyncScript("const done=arguments[arguments.length-1];fetch('/api/iad/datasets/'+encodeURIComponent(arguments[0]),{method:'DELETE'}).then(async response=>done({status:response.status,data:await response.json()}));",dataset.dataset_id);
    assert.equal(deleted.status,200);await driver.navigate().refresh();
    for(const label of ['数据集管理','图像浏览','方向探索','知识挖掘','数据一致性','模型审计']){
      await driver.findElement(By.css(`button[aria-label="${label}"]`)).click();
      await driver.wait(()=>driver.executeScript('return document.querySelector(".iad-workbench h1")?.textContent===arguments[0]',label),5000,label+'无数据时保留页面标题');
    }
  }finally{releaseSample();releaseCatalog();await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));}
});
