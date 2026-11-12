import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {auditPageBundle} from '../test/fixtures/audit-page.js';

test('audit knowledge selection uses the original job ID and evidence stays visible at a scrollbar column boundary',{timeout:45000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-knowledge-evidence-layout-'));
  const workspace=findWorkspaceRoot(),database=path.join(root,'evidence.db');
  let bridge,server,driver;
  t.after(async()=>{
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();await fs.rm(root,{recursive:true,force:true});
  });
  const data=JSON.parse(execFileSync(resolvePythonPath(),[
    path.join(workspace,'apps/iad-harness/test/fixtures/audit_dataset.py'),root,database,'knowledge','http://127.0.0.1:9/v1',
  ],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  bridge=new PythonBridge({cwd:workspace,dbPath:database});
  const dataset=await bridge.execute('dataset_get',{dataset_id:data.dataset_id});
  const bundle=await auditPageBundle(dataset),handler=createIadHttpHandler(bridge),requests=[],writes=[];
  server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(req.method!=='GET')writes.push(url.pathname);
    if(url.pathname==='/api/iad/knowledge/details')requests.push(url.search);
    if(url.pathname==='/page.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle);}
    else if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/page.js"></script>');}
    else void handler(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access')
    .setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  const click=async selector=>{const item=await element(selector);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',item);await item.click();};
  await driver.manage().window().setRect({width:1280,height:1050});
  await driver.get(`http://127.0.0.1:${server.address().port}/`);await click('#audit-new');
  const row=await element('#audit-create-knowledge-jobs tbody tr');
  assert.equal(await(await row.findElement(By.css('td:nth-child(2)'))).getText(),data.knowledge.job_id);
  assert.equal(await(await element('#audit-create-knowledge-jobs th:nth-child(2)')).getText(),'作业 ID');
  await click('input[name="audit-knowledge-source"]');
  assert.ok((await(await element('#audit-create-summary')).getText()).includes(data.knowledge.job_id));
  await click('#audit-create-entries tbody button');
  await driver.wait(()=>driver.executeScript('const image=document.querySelector("[data-evidence-role=support] img");return image?.complete&&image.naturalWidth===40'),10000);
  const dimensions=await driver.executeScript(`
    const body=document.querySelector('#entry-dialog'),dialog=body.closest('dialog'),grid=body.querySelector('[data-evidence-role=support] .iad-thumbnail-grid');
    const contentHeight=body.lastElementChild.getBoundingClientRect().bottom-body.getBoundingClientRect().top+body.scrollTop+parseFloat(getComputedStyle(body).paddingBottom);
    return {innerHeight,dialogHeight:dialog.getBoundingClientRect().height,bodyHeight:body.clientHeight,
      targetBodyHeight:contentHeight-grid.getBoundingClientRect().height/2};
  `);
  const window=await driver.manage().window().getRect();
  const height=Math.round(window.height-dimensions.innerHeight+dimensions.targetBodyHeight+
    dimensions.dialogHeight-dimensions.bodyHeight+64);
  await driver.manage().window().setRect({width:1280,height});
  const before=requests.length;
  await driver.manage().window().setRect({width:1254,height});
  const stability=await driver.executeAsyncScript(`
    const done=arguments[arguments.length-1],states=[];
    setTimeout(()=>{
      const timer=setInterval(()=>{
        const section=document.querySelector('[data-evidence-role=support]'),images=[...section.querySelectorAll('img')];
        states.push({loading:section.textContent.includes('正在读取证据'),images:images.length,
          loaded:images.every(image=>image.complete&&image.naturalWidth===40)});
      },20);
      setTimeout(()=>{clearInterval(timer);done(states);},1200);
    },300);
  `);
  assert.ok(stability.length>=20);
  assert.ok(stability.every(state=>!state.loading&&state.images===1&&state.loaded),JSON.stringify(stability));
  assert.ok(requests.length-before<=2,'固定窗口不能因滚动条反复改变证据分页并重新请求');
  await click('button[role="tab"][id$="counter"]');
  await driver.wait(()=>driver.executeScript('const image=document.querySelector("[data-evidence-role=counter] img");return image?.complete&&image.naturalWidth===40'),10000);
  await click('[data-evidence-role=counter] .iad-thumbnail-card');await element('#full-close');await click('#full-close');
  await click('#close-detail');
  assert.equal(await(await element('input[name="audit-knowledge-source"]')).isSelected(),true);
  const catalog=await fetch(`http://127.0.0.1:${server.address().port}/api/iad/datasets`,{signal:AbortSignal.timeout(2000)});
  assert.equal(catalog.status,200);assert.equal((await catalog.json()).datasets.length,1);
  assert.deepEqual(writes,[]);
});
