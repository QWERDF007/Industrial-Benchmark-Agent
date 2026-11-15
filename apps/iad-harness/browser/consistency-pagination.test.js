import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createConsistencyAgentHost} from '../test/fixtures/consistency-agent-host.js';
import {viewport} from './workbench-layout.js';

test('job image pages render from the current page and navigate across page boundaries',{timeout:60000},async()=>{
  const fixture=await createConsistencyAgentHost({candidateCount:24});
  const request={submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'};
  const job=await fixture.bridge.execute('consistency_agent_start',{request});
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {ConsistencyPage} from './src/client/components/ConsistencyPage.tsx';
import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
const workspace=new Workspace(null);workspace.connect({selectPanel(){},panelInfo:{getSnapshot:()=>({activePanelId:'industrial-consistency'}),subscribe:()=>()=>{}}});
workspace.openLocation({pageId:'industrial-consistency',parentId:'__ungrouped__',datasetIds:[${JSON.stringify(fixture.datasetId)}],batchId:${JSON.stringify(job.run_id)}});
createRoot(document.getElementById('root')).render(<WorkspaceContext.Provider value={workspace}><ConsistencyPage/></WorkspaceContext.Provider>);`,
loader:'tsx',resolveDir:path.resolve('apps/iad-harness')},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const handler=createIadHttpHandler(fixture.bridge),reads=[];
  const pageRequested=Promise.withResolvers(),releasePage=Promise.withResolvers();
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if(req.url.startsWith('/api/iad')){
      reads.push(req.url);
      if(req.url.includes('/images?')&&new URL(req.url,'http://localhost').searchParams.get('page')==='2'){
        pageRequested.resolve();await releasePage.promise;
      }
      await handler(req,res);return;
    }
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script src="/browser.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let driver;
  try{
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options().addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await viewport(driver,1920,1080);await driver.get(`http://127.0.0.1:${server.address().port}`);
    const cards=()=>driver.findElements(By.css('[data-dc="job-image"]'));
    await driver.wait(async()=>(await cards()).length===18,15000);
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("[data-dc=job-image] img")].every(image=>image.complete&&image.naturalWidth>0)'),10000);
    assert.ok(reads.some(url=>url.includes('/analysis/jobs?')&&url.includes('summary=true')));
    assert.ok(reads.filter(url=>url.includes('/images?')).every(url=>new URL(url,'http://localhost').searchParams.get('page')==='1'));
    assert.ok(!reads.some(url=>url.includes('/gallery')));
    const last=(await cards()).at(-1);await driver.executeScript('arguments[0].click()',last);
    const dialog=await driver.wait(until.elementLocated(By.id('dc-compare-mask')),10000);
    const next=await dialog.findElement(By.xpath('.//button[normalize-space()="下一组"]'));
    await next.click();await pageRequested.promise;
    await dialog.findElement(By.css('button[aria-label="关闭"]')).click();
    releasePage.resolve();
    await driver.wait(async()=>(await cards()).length===7,10000);
    assert.equal((await driver.findElements(By.id('dc-compare-mask'))).length,0,'A late page must not reopen a dismissed dialog');
    assert.ok(reads.some(url=>url.includes('/images?')&&new URL(url,'http://localhost').searchParams.get('page')==='2'));
    assert.equal(fixture.wires.length,0);
  }finally{
    releasePage.resolve();
    if(driver)await driver.quit();await new Promise(resolve=>server.close(resolve));await fixture.close();
  }
});
