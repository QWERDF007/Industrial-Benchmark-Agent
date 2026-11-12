import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {findWorkspaceRoot} from '../../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../../lib/server/routes/index.js';

export async function verifyAuditDelegationPage(runtime,data,job,root){
  const dataset=await runtime.bridge.execute('dataset_get',{dataset_id:data.dataset_id});
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {AuditPage} from './src/client/components/AuditPage.tsx';
    import {ModuleSettingsSection} from './src/client/components/ModuleSettingsSection.tsx';
    import {WorkbenchProviders} from './src/client/host/WorkbenchProviders.tsx';
    import {Workspace} from './src/client/workspace.tsx';
    import {WorkbenchSession} from './src/client/workbench-session.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const dataset=${JSON.stringify(dataset)},workspace=new Workspace(new WorkbenchSession({}));
    workspace.selectDataset(dataset.dataset_id);
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    createRoot(document.getElementById('root')).render(<WorkbenchProviders workspace={workspace}>
      <main className="iad-workbench">{location.pathname==='/settings'?<ModuleSettingsSection module="audit"/>:
        <AuditPage dataset={dataset} datasets={[dataset]} groups={[]} refreshRevision={0} onDatasetsChanged={()=>{}}/>}</main>
    </WorkbenchProviders>);
  `,loader:'tsx',resolveDir:path.join(findWorkspaceRoot(),'apps/iad-harness')},bundle:true,format:'iife',write:false,
    target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const handler=createIadHttpHandler(runtime.bridge);
  const server=http.createServer((req,res)=>{
    if(req.url==='/page.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(req.url==='/'||req.url==='/settings'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/page.js"></script>');}
    else void handler(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const click=async css=>{const item=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',item);await item.click();};
  try{
    await driver.manage().window().setRect({width:1440,height:1080});
    await driver.get(base+'/');
    await click('button[role="tab"][id$="reports"]');
    await element('[data-audit-discovery]');
    const images=await driver.findElements(By.css('#audit-report .iad-audit-gallery .iad-thumbnail-card'));
    assert.equal(images.length,2,'图像证据汇集模型所选的完整原图');
    assert.equal((await driver.findElements(By.css('.iad-audit-gallery [role="tab"],.iad-audit-gallery .iad-thumbnail-caption,.iad-audit-gallery>button'))).length,0);
    assert.equal((await driver.findElements(By.css('.iad-audit-gallery nav[aria-label="图像证据分页"]'))).length,0,'单页图证不显示分页栏');
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("#audit-report img")].every(i=>i.complete&&i.naturalWidth===40&&getComputedStyle(i).objectFit==="contain")'),10000);
    const text=await(await element('#audit-report')).getText();
    assert.ok(text.includes('可用于视觉探索')&&text.includes('覆盖画像')&&text.includes('独立性与代表性'));
    assert.ok(text.includes('规则轮廓与多框覆盖')&&text.includes('数据一致性分析'));
    assert.equal((await driver.findElements(By.css('#audit-report [data-chart]'))).length,2);
    assert.ok(!text.includes('跨图一致性复核范围'));
    assert.ok(!text.includes(job.run_id)&&!text.includes(data.dataset_id));
    await click('#audit-report .iad-audit-gallery .iad-thumbnail-card');await element('#full-close');
    await click('#annotation-toggle');await click('#full-close');
    await fs.writeFile(path.join(root,'report-desktop.png'),await driver.takeScreenshot(),'base64');
    await driver.manage().window().setRect({width:800,height:844});await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');
    await driver.wait(()=>driver.executeScript('return innerWidth===390'),5000);
    assert.ok(await driver.executeScript('return document.documentElement.scrollWidth<=innerWidth+1'));
    const html=await runtime.bridge.execute('audit_job_export',{run_id:job.run_id});
    const filename=path.join(root,'offline-report.html');await fs.writeFile(filename,html.html);
    await driver.get(pathToFileURL(filename).href);await element('[data-audit-discovery]');
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("#audit-report img")].every(i=>i.complete&&i.src.startsWith("data:"))'),10000);
    assert.equal((await driver.findElements(By.css('.iad-audit-gallery .iad-thumbnail-card'))).length,2);
    assert.equal((await driver.findElements(By.css('.iad-audit-gallery [role="tab"],.iad-audit-gallery .iad-thumbnail-caption'))).length,0);
    await fs.writeFile(path.join(root,'report-mobile.png'),await driver.takeScreenshot(),'base64');
    await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='';gBrowser.selectedBrowser.style.width='';gBrowser.selectedBrowser.style.flex=''");
    await driver.setContext('content');await driver.manage().window().setRect({width:1440,height:1080});
    await driver.get(base+'/settings');
    assert.equal(await(await element('input[aria-label="主 Agent 联合分析间隔"]')).getAttribute('value'),'8');
    assert.equal(await(await element('input[aria-label="同时运行的子 Agent 数量"]')).getAttribute('value'),'2');
    for(const [label,value] of [['主 Agent 联合分析间隔','3'],['同时运行的子 Agent 数量','1']]){
      const input=await element(`input[aria-label="${label}"]`);await input.clear();await input.sendKeys(value,Key.ENTER);
      await driver.wait(async()=>{const saved=await runtime.bridge.execute('module_settings_get',{module:'audit'});
        return saved.settings[label==='主 Agent 联合分析间隔'?'batch_size':'concurrency']===Number(value);},10000);
    }
    await driver.get(base+'/');await click('#audit-new');
    const fields=['audit-master-prompt-system','audit-master-prompt','audit-observer-prompt-system','audit-observer-prompt','audit-report-prompt'];
    for(const field of fields){
      const input=await element('#'+field);assert.ok(Number.parseInt(await input.getCssValue('height'))>=300);
      await input.clear();await input.sendKeys('独立冻结提示词 '+field);
    }
    await click('input[name="audit-consistency-source"]');await click('#audit-create-submit');
    await driver.wait(async()=>{const jobs=await runtime.bridge.execute('audit_list',{dataset_id:data.dataset_id});return jobs.jobs.length===2;},10000);
    await runtime.scheduler.whenIdle();
    const {jobs}=await runtime.bridge.execute('audit_list',{dataset_id:data.dataset_id});
    const created=jobs.find(item=>item.run_id!==job.run_id);
    const frozen=await runtime.bridge.execute('audit_agent_snapshot',{run_id:created.run_id});
    assert.equal(frozen.settings.batch_size,3);assert.equal(frozen.settings.concurrency,1);
    assert.equal(frozen.master_prompt.system_prompt,'独立冻结提示词 audit-master-prompt-system');
    assert.equal(frozen.observer_prompt.user_prompt,'独立冻结提示词 audit-observer-prompt');
    await driver.get(base+'/');await click('#audit-images [data-sample-id]');
    await element('[data-audit-section="conclusion"]');
    await driver.wait(async()=>/本次|未发现|正常/.test(await(await element('[data-audit-section="conclusion"]')).getText()),10000);
    await driver.wait(()=>driver.executeScript('const image=document.querySelector(".audit-dialog .dc-compare-photo img");return image?.complete&&image.naturalWidth===40'),10000);
    assert.equal((await driver.findElements(By.css('[data-audit-section="references"]'))).length,0);
    assert.ok(await driver.executeScript('return document.querySelector(".audit-dialog .dc-compare-photo").getBoundingClientRect().height>=300'));
    await fs.writeFile(path.join(root,'sample-detail.png'),await driver.takeScreenshot(),'base64');
  }catch(error){
    await fs.writeFile(path.join(root,'browser-failure.png'),await driver.takeScreenshot(),'base64');
    throw error;
  }finally{
    await driver.quit();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
}
