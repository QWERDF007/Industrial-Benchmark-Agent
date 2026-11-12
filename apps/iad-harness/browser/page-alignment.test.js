import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {viewport} from './workbench-layout.js';

const pages=[['datasets','数据集管理'],['images','图像浏览'],['exploration','方向探索'],['knowledge','知识挖掘'],['consistency','数据一致性'],['audit','模型审计']];

test('six pages share content edges and job table rhythm while image filters and audit tabs remain usable',{timeout:90000},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-page-alignment-'));
 const workspace=findWorkspaceRoot(),app=path.join(workspace,'apps/iad-harness'),database=path.join(root,'layout.db');
 let bridge,server,driver;
 t.after(async()=>{await driver?.quit();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}bridge?.destroy();await fs.rm(root,{recursive:true,force:true});});
 execFileSync(resolvePythonPath(),[path.join(app,'browser/fixtures/layout-dataset.py'),root,database],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')}});
 bridge=new PythonBridge({cwd:workspace,dbPath:database});
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
 const entries=[],mains=new Map(),listeners=new Set();let panel=null;
 const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
 apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});return()=>{};}}});
 function App(){const[id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>}
 createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const writes=[],handler=createIadHttpHandler(bridge);
 server=http.createServer((req,res)=>{if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
  if(req.url.startsWith('/api/iad')){if(req.method!=='GET')writes.push(req.url);return handler(req,res);}
  res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}nav[aria-label="主导航"]{height:40px;display:flex;align-items:center}#root>.iad-workbench,#root>div>.iad-workbench{height:calc(100dvh - 40px)}</style><div id="root"></div><script src="/browser.js"></script>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const options=new firefox.Options().addArguments('-headless');options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
 driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver').setEnvironment({...process.env,TZ:'Asia/Shanghai'})).build();
 await driver.get(`http://127.0.0.1:${server.address().port}`);await viewport(driver,1920,1080);
 const output=path.join(workspace,'runs/verification/v89-layout');await fs.mkdir(output,{recursive:true});
 const measured={};
 for(const [key,label]of pages){
  await(await driver.wait(until.elementLocated(By.xpath(`//nav[@aria-label="主导航"]/button[normalize-space(.)="${label}"]`)),10000)).click();
  await driver.wait(()=>driver.executeScript('return document.querySelector(".iad-workbench h1")?.textContent===arguments[0]',label),10000);
  if(!['datasets','images'].includes(key))await driver.wait(()=>driver.executeScript('return !!document.querySelector(".iad-workbench table tbody tr")'),10000);
  else await driver.wait(()=>driver.executeScript('return ![...document.querySelectorAll("[role=status]")].some(e=>/正在读取|正在加载/.test(e.textContent))'),10000);
  measured[key]=await driver.executeScript(()=>{
   const root=document.querySelector('.iad-workbench'),header=root.querySelector('.iad-header'),scope=root.querySelector('.iba-scope-selector');
   const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   const panels=[...root.querySelectorAll('section')].filter(e=>e.querySelector(':scope>.iad-section-heading'));
   const table=root.querySelector('.iad-jobs-table');
   const frame=table?.parentElement;
   return {header:rect(header),scope:rect(scope),labels:[...scope?.querySelectorAll(':scope>div>label')||[]].map(rect),controls:[...scope?.querySelectorAll('select,button.iad-multiselect-trigger')||[]].map(rect),
    filter:rect(root.querySelector('.filter-bar,.iad-manager-search-wrap')),tabs:rect(root.querySelector('.audit-tabs')),panels:panels.map(e=>({rect:rect(e),header:rect(e.querySelector('.iad-section-heading'))})),
    columns:table?[...table.querySelectorAll('thead th')].map(node=>node.textContent):[],head:rect(table?.querySelector('thead tr')),headStyle:table?{background:getComputedStyle(table.querySelector('th')).backgroundColor,weight:getComputedStyle(table.querySelector('th')).fontWeight}:null,
    rows:[...table?.querySelectorAll('tbody tr')||[]].map(rect),frame:rect(frame),scroll:frame?{height:frame.clientHeight,total:frame.scrollHeight}:null,
    fields:[...root.querySelectorAll('.iad-section-heading input,.iad-section-heading select')].map(e=>({tag:e.tagName,type:e.type,...rect(e)})),overflow:root.scrollWidth-root.clientWidth};
  });
  await fs.writeFile(path.join(output,'controlled-'+key+'.png'),await driver.takeScreenshot(),'base64');
  if(measured[key].head){
   const action=await driver.findElement(By.css('.iad-job-table-grid button[title="查看作业状态"]'));
   assert.equal(await action.getAttribute('data-icon'),'clock',`${key} status entry uses the prototype clock icon`);
   assert.equal(await action.findElement(By.css('svg path')).getAttribute('d'),'M12 8v4l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z');
   const status=await driver.executeScript(`const button=arguments[0],row=button.closest('tr'),cell=button.closest('td');
    const headings=[...row.closest('table').querySelectorAll('thead th')],index=headings.findIndex(e=>e.textContent.trim()==='提交时间');
    const b=button.getBoundingClientRect(),c=cell.getBoundingClientRect(),r=row.getBoundingClientRect();
    return {left:b.left,cellLeft:c.left,right:b.right,cellRight:c.right,center:b.top+b.height/2,rowCenter:r.top+r.height/2,time:row.cells[index].textContent};`,action);
   measured[key].status=status;
   assert.ok(status.left>=status.cellLeft&&status.right<=status.cellRight,`${key} status action stays inside its operation column: ${JSON.stringify(status)}`);
   assert.ok(Math.abs(status.center-status.rowCenter)<1,`${key} status action is vertically centered`);
   await action.click();
   await driver.wait(until.elementLocated(By.css('dialog[aria-label="作业状态"][open]')),5000);
   const submitted=await driver.executeScript('return [...document.querySelectorAll(".iad-job-meta dt")].find(e=>e.textContent==="提交时间").nextElementSibling.textContent');
   assert.equal(submitted,status.time,`${key} submission time is identical in list and drawer`);
   await driver.actions().sendKeys(Key.ESCAPE).perform();
   await driver.wait(()=>driver.executeScript('return !document.querySelector("dialog[aria-label=作业状态][open]")'),5000);
   const scroll=await driver.executeScript(`const table=document.querySelector('.iad-workbench .iad-job-table-grid'),frame=table.parentElement;
    frame.scrollTop=120;
    return {top:frame.scrollTop,header:table.querySelector('th').getBoundingClientRect().top,frame:frame.getBoundingClientRect().top};`);
   assert.ok(scroll.top>0,`${key} job list scrolls`);
   assert.ok(Math.abs(scroll.header-scroll.frame)<=1,`${key} table header stays visible while scrolling`);
  }
 }
 await fs.writeFile(path.join(output,'controlled-metrics.json'),JSON.stringify(measured,null,2)+'\n');
 for(const [key,m]of Object.entries(measured)){
  assert.equal(m.header.x,32,`${key} content left edge`);assert.ok(Math.abs(m.header.right-measured.datasets.header.right)<1,`${key} content right edge`);
  assert.equal(m.header.height,42,`${key} page title bar`);
  assert.equal(m.overflow,0,`${key} page width contains tables`);
  if(m.scope){assert.equal(m.scope.y-m.header.bottom,20,`${key} title to scope`);assert.equal(m.scope.height,63,`${key} scope row`);for(const label of m.labels)assert.equal(label.height,19,`${key} label`);for(const control of m.controls)assert.equal(control.height,38,`${key} control`);}
  if(m.head){assert.deepEqual(m.columns,['作业ID','状态','数据集','进度','提交时间','耗时','操作'],`${key} shares seven job columns`);for(const p of m.panels){assert.equal(p.header.height,70,`${key} section header`);assert.equal(p.rect.x,m.header.x,`${key} panel left`);assert.equal(p.rect.right,m.header.right,`${key} panel right`);}
   assert.equal(m.panels[1].rect.y-m.panels[0].rect.bottom,20,`${key} panel gap`);
   assert.equal(m.head.height,46,`${key} table header`);for(const row of m.rows)assert.ok(Math.abs(row.height-60)<1,`${key} job row ${row.height}`);
   assert.deepEqual(m.headStyle,measured.exploration.headStyle,`${key} table header appearance`);
   assert.ok(m.frame.height<=347,`${key} bounded scroll area`);assert.ok(m.scroll.total>m.scroll.height,`${key} additional jobs scroll`);
   for(const field of m.fields){assert.equal(field.height,38,`${key} filter height`);assert.equal(field.width,field.tag==='SELECT'?155:200,`${key} filter width`);}
  }
 }
 assert.equal(measured.images.filter.y-measured.images.scope.bottom,20,'image filters retain their own row');
 assert.ok(measured.images.filter.height>=96,'image filter labels remain visible');
 assert.equal(measured.audit.tabs.y-measured.audit.scope.bottom,20,'audit tabs remain between scope and jobs');
 assert.equal(measured.audit.panels[0].rect.y-measured.audit.tabs.bottom,20,'audit tab to panel gap');
 await driver.findElement(By.xpath('//button[@role="tab" and normalize-space(.)="报告"]')).click();
 await driver.wait(until.elementLocated(By.id('audit-report')),10000);
 await viewport(driver,620,900);
 for(const [key,label]of pages){await(await driver.findElement(By.xpath(`//nav[@aria-label="主导航"]/button[normalize-space(.)="${label}"]`))).click();await driver.wait(()=>driver.executeScript('return document.querySelector(".iad-workbench h1")?.textContent===arguments[0]',label),10000);
  const narrow=await driver.executeScript('const root=document.querySelector(".iad-workbench"),header=root.querySelector(".iad-header");return {overflow:root.scrollWidth-root.clientWidth,x:header.getBoundingClientRect().x}');
  assert.equal(narrow.overflow,0,`${key} narrow page`);assert.equal(narrow.x,20,`${key} narrow inset`);
 }
 assert.deepEqual(writes,[],'layout inspection never starts or modifies jobs');
});
