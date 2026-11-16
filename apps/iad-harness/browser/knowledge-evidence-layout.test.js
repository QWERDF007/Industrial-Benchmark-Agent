import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {Builder,By,until,Select as NativeSelect} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {auditPageBundle} from '../test/fixtures/audit-page.js';
import {viewport} from './workbench-layout.js';

test('audit reuses source jobs and entry pages with cancellable selection, frozen evidence and optional knowledge submission',{timeout:90000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-knowledge-evidence-layout-'));
  const workspace=findWorkspaceRoot(),database=path.join(root,'evidence.db');
  let bridge,server,driver;
  t.after(async()=>{
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();await fs.rm(root,{recursive:true,force:true});
  });
  const data=JSON.parse(execFileSync(resolvePythonPath(),[
    path.join(workspace,'apps/iad-harness/test/fixtures/audit_dataset.py'),root,database,'knowledge','http://127.0.0.1:9/v1','10',
  ],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  bridge=new PythonBridge({cwd:workspace,dbPath:database});
  const dataset=await bridge.execute('dataset_get',{dataset_id:data.dataset_id});
  const maintained=await bridge.execute('knowledge_check_remove',{version_id:data.knowledge.version_id,
    request:{submission_id:randomUUID(),check_id:'C3'}});
  const bundle=await auditPageBundle(dataset),handler=createIadHttpHandler(bridge),requests=[],writes=[],submissions=[];
  server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(req.method!=='GET')writes.push(url.pathname);
    if(url.pathname==='/api/iad/audit/start'){
      let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
        submissions.push(JSON.parse(body));res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'测试调度暂不可用'}}));
      });return;
    }
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
  await driver.get(`http://127.0.0.1:${server.address().port}/`);await viewport(driver,1920,1080);await click('#audit-new');
  const row=await element('#audit-create-knowledge-jobs tbody tr');
  assert.equal(await(await row.findElement(By.css('td:nth-child(2)'))).getText(),data.knowledge.job_id);
  assert.equal(await(await element('#audit-create-knowledge-jobs th:nth-child(2)')).getText(),'作业ID');
  const choice=await element('input[name="audit-knowledge-source"]');
  assert.equal(await choice.getAttribute('type'),'checkbox');
  assert.equal(await choice.isSelected(),false);
  await choice.click();await choice.click();
  assert.equal(await choice.isSelected(),false,'所选知识来源可取消');
  assert.equal((await driver.findElements(By.css('#audit-create-entries'))).length,0,'取消来源同时清空条目区域');
  await choice.click();
  assert.equal((await driver.findElements(By.css('#audit-create-knowledge-jobs button[title="删除作业"]'))).length,0);
  assert.equal((await driver.findElements(By.css('#audit-create-knowledge-jobs button[title="查看提示词"]'))).length,1);
  assert.ok((await(await element('#audit-create-summary')).getText()).includes(data.knowledge.job_id));
  assert.equal((await driver.findElements(By.css('#audit-create-knowledge-jobs tbody tr'))).length,1,'多个知识版本共用一行作业');
  const versions=await element('select[aria-label="知识结果版本"]');
  assert.equal((await versions.findElements(By.css('option'))).length,2);
  await new NativeSelect(versions).selectByValue(maintained.version_id);
  const entry=await element('#audit-create-entries input[aria-label="选择知识条目 表面变化"]');
  await entry.click();assert.equal(await entry.isSelected(),true);
  await new NativeSelect(await element('select[aria-label="知识结果版本"]')).selectByValue(data.knowledge.version_id);
  await driver.wait(async()=>(await driver.findElements(By.css('#audit-create-entries .knowledge-row'))).length===8,5000);
  assert.equal(await(await element('#audit-create-entries input[aria-label="选择知识条目 表面变化"]')).isSelected(),false,'切换版本清空条目');
  await click('#audit-create-entries input[aria-label="选择知识条目 表面变化"]');
  await click('#audit-create-entries nav button:last-of-type');
  await driver.wait(async()=>(await driver.findElements(By.css('#audit-create-entries .knowledge-row'))).length===2,5000);
  await click('#audit-create-entries input[aria-label="选择知识条目 外观判据9"]');
  await click('#audit-create-entries nav button:first-of-type');
  assert.equal(await(await element('#audit-create-entries input[aria-label="选择知识条目 表面变化"]')).isSelected(),true,'跨页保留已选条目');
  await click('#audit-entries-all');
  assert.match(await(await element('#audit-create-summary')).getText(),/10 条/,'全选覆盖当前版本全部分页');
  await click('#audit-entries-all');
  await click('#audit-create-entries button[data-view-entry]');
  await driver.wait(()=>driver.executeScript('const image=document.querySelector("[data-evidence-role=support] img");return image?.complete&&image.naturalWidth===40'),10000);
  const before=requests.length;
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
  assert.equal(await(await element('#audit-create-submit')).isEnabled(),false,'一致性来源为必选');
  await click('input[name="audit-consistency-source"]');
  await click('#audit-create-entries input[aria-label="选择知识条目 表面变化"]');
  await click('#audit-create-submit');
  await driver.wait(()=>submissions.length===1,5000);await element('#audit-create-view [role="alert"]');
  assert.deepEqual(submissions[0].knowledge,{job_id:data.knowledge.job_id,version_id:data.knowledge.version_id,entry_ids:['C1']});
  assert.equal(submissions[0].consistency_job_id,data.consistency_job_id);
  await click('input[name="audit-knowledge-source"]');
  assert.equal((await driver.findElements(By.css('#audit-create-entries'))).length,0);
  await click('#audit-create-submit');
  await driver.wait(()=>submissions.length===2,5000);await element('#audit-create-view [role="alert"]');
  assert.equal(submissions[1].knowledge,null,'取消知识来源提交零知识');
  assert.equal(submissions[1].consistency_job_id,data.consistency_job_id);
  await click('input[name="audit-consistency-source"]');
  assert.equal(await(await element('#audit-create-submit')).isEnabled(),false,'取消一致性来源重新禁用提交');
  assert.deepEqual(writes,['/api/iad/audit/start','/api/iad/audit/start']);
  await fs.writeFile('/tmp/iad-audit-reuse-setup.png',await driver.takeScreenshot(),'base64');
});
