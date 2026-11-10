import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from '../browser/workbench-layout.js';
import {verifyReportMetadata} from '../browser/report-layout.js';
import {verifyConsistencyUserResult} from './consistency-user-proof.js';

const datasetKey=process.argv.find(value=>value.startsWith('--dataset='))?.split('=')[1];
const datasets={labelme:'ds_d4c7fd02adbc43708e77332ac5419c51',anomaly:'ds_ae514ae539a442a58380b0f7f13741e0'};
assert.ok(Object.hasOwn(datasets,datasetKey),'使用 --dataset=labelme 或 --dataset=anomaly 指定100图验收集');
const stage=process.argv.find(value=>value.startsWith('--stage='))?.split('=')[1]||'exploration';
assert.ok(['exploration','consistency','knowledge','audit'].includes(stage),'stage支持exploration、consistency、knowledge或audit');
const page=stage==='exploration'?{name:'方向探索',parent:'#exp-parent',child:'#exp-child-toggle',menu:'#exp-child-menu',create:'#exp-new'}
  :stage==='consistency'?{name:'数据一致性',parent:'#dc-parent',child:'#dc-child-trigger',menu:'#dc-child-options',create:'[data-dc="start-check"]'}
  :stage==='knowledge'?{name:'知识挖掘',parent:'#dataset',child:'#subset',menu:'#subset-menu',create:'#create-btn'}
  :{name:'模型审计',parent:'#audit-dataset',child:'#audit-child-trigger',menu:'#audit-child-menu',create:'#audit-page button[title="新建审计"]'};
const base=process.env.IAD_BROWSER_BASE_URL||'http://127.0.0.1:8000';
const output=path.resolve(process.argv.find(value=>value.startsWith('--output='))?.slice('--output='.length)||'runs/verification/analysis-user-chain');
const presetId=process.argv.find(value=>value.startsWith('--preset-id='))?.slice('--preset-id='.length);
assert.ok(!presetId||stage==='knowledge','预设直达使用--stage=knowledge');
const zeroKnowledge=process.argv.includes('--zero-knowledge');
const knowledgeVersion=process.argv.find(value=>value.startsWith('--knowledge-version='))?.slice('--knowledge-version='.length);
const checkIds=process.argv.find(value=>value.startsWith('--check-ids='))?.slice('--check-ids='.length).split(',');
const consistencyRun=process.argv.find(value=>value.startsWith('--consistency-run='))?.slice('--consistency-run='.length);
if(stage==='audit')assert.ok(zeroKnowledge!==!!knowledgeVersion,'审计需显式指定--zero-knowledge或--knowledge-version');
const prefix=datasetKey+'-joint-'+stage+(presetId?'-preset-'+presetId:'')+(stage==='audit'?(zeroKnowledge?'-zero-knowledge':'-knowledge'):'');
const receiptFile=path.join(output,prefix+'.json');
const verifyOnly=process.argv.includes('--verify-only');
const entryId=process.argv.find(value=>value.startsWith('--entry-id='))?.slice('--entry-id='.length);
assert.equal(await fs.access(receiptFile).then(()=>true,()=>false),verifyOnly,
  verifyOnly?'核对现有作业需要提交回执':'已有提交回执，使用--verify-only核对现有作业，不能重复创建');
await fs.mkdir(output,{recursive:true});
const read=async route=>{
  const response=await fetch(base+'/api/iad/'+route);assert.equal(response.status,200,await response.clone().text());return response.json();
};
const source=(await read('datasets')).datasets.find(item=>item.dataset_id===datasets[datasetKey]);
assert.equal(source.total_samples,100);
const model=await read('settings/modules/'+stage);
assert.equal(model.settings.model.provider_id,'local-vlm-30004');
assert.equal(model.settings.model.model_id,'ukisai/Swift-1.5-Qwen3.8-27b');
let directionSelection;
let auditKnowledge;
if(stage==='audit'&&!verifyOnly) {
  assert.ok(consistencyRun,'审计需显式指定--consistency-run');
  const upstream=await read('analysis/status/'+consistencyRun);
  assert.equal(upstream.analysis_kind,'consistency');assert.equal(upstream.status,'COMPLETED');
  assert.equal(upstream.completed,100);
  const catalog=await read('audit/sources?'+new URLSearchParams({dataset_ids:JSON.stringify([source.dataset_id])}));
  assert.ok(catalog.consistency_jobs.some(job=>job.job_id===consistencyRun));
  if(knowledgeVersion) {
    auditKnowledge=catalog.knowledge_jobs.find(job=>job.version_id===knowledgeVersion);
    assert.ok(auditKnowledge&&checkIds?.length,'知识审计需有效版本和显式--check-ids');
    assert.ok(checkIds.every(id=>auditKnowledge.entries.some(entry=>entry.check_id===id)));
  }
}
if(stage==='knowledge'&&!verifyOnly) {
  const versionId=process.argv.find(value=>value.startsWith('--direction-version='))?.slice('--direction-version='.length);
  const directionId=process.argv.find(value=>value.startsWith('--direction-id='))?.slice('--direction-id='.length);
  if(presetId) {
    assert.ok(!versionId&&!directionId,'选择预设直达或探索发布来源之一');
    const presets=await read('knowledge/presets');
    directionSelection=presets.directions.find(direction=>direction.direction_id===presetId);
    assert.ok(directionSelection,'所选预设方向必须存在');
  } else {
    assert.ok(versionId&&directionId,'挖掘需显式指定--direction-version和--direction-id，或--preset-id');
    const publication=await read('analysis/publications/'+versionId);
    assert.equal(publication.module,'exploration');
    const direction=publication.catalog.directions.find(item=>item.direction_id===directionId);
    assert.ok(direction&&direction.dataset_ids.includes(source.dataset_id));
    directionSelection={source:{origin:'explored',run_id:publication.job_id,version_id:versionId,direction_id:directionId},
      title:direction.title,instruction:direction.instruction};
  }
}
const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
options.setPageLoadStrategy('none');
options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
const downloads=path.join(output,prefix+'-downloads');
await fs.mkdir(downloads,{recursive:true});
const downloadAttempt=await fs.mkdtemp(path.join(os.tmpdir(),'iad-user-chain-download-'));
options.setPreference('browser.download.folderList',2).setPreference('browser.download.dir',downloadAttempt)
  .setPreference('browser.helperApps.neverAsk.saveToDisk','text/html,application/zip,application/x-ndjson');
const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
  .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
const click=async item=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',item);await item.click();};
const download=async(button,route,extension)=>{
  await driver.wait(until.elementIsEnabled(button),20000);await click(button);
  const file=await driver.wait(async()=>{
    const files=(await fs.readdir(downloadAttempt)).filter(name=>name.endsWith(extension));
    if(files.length!==1)return false;
    const target=path.join(downloadAttempt,files[0]);
    return (await fs.stat(target)).size>0&&!await fs.access(target+'.part').then(()=>true,()=>false)?target:false;
  },20000);
  const response=await fetch(base+'/api/iad/'+route);assert.equal(response.status,200);
  const actual=await fs.readFile(file);assert.deepEqual(actual,Buffer.from(await response.arrayBuffer()));
  const saved=path.join(downloads,path.basename(file));await fs.copyFile(file,saved);
  return {path:saved,bytes:actual.length,sha256:createHash('sha256').update(actual).digest('hex')};
};
try {
  await driver.get(process.env.IAD_BROWSER_BOOTSTRAP_URL||base);await element(`button[aria-label="${page.name}"]`);await viewport(driver,1920,1080);
  await click(await element(`button[aria-label="${page.name}"]`));
  const parent=await element(page.parent);
  await click(await parent.findElement(By.css(`option[value="${source.group_id}"]`)));
  await driver.wait(async()=>(await(await element(page.parent)).getAttribute('value'))===source.group_id,10000);
  if(page.menu) {
    await click(await element(page.child));
    const children=await driver.findElements(By.css(page.menu+' input[type="checkbox"]'));
    assert.ok(children.length>0);
    for(const child of children)if(await child.isSelected()!==((await child.getAttribute('value'))===source.dataset_id))await click(child);
    await click(await element(page.child));
  } else await click(await element(`${page.child} option[value="${source.dataset_id}"]`));
  if(verifyOnly) {
    const receipt=JSON.parse(await fs.readFile(receiptFile,'utf8'));
    const job=await read((stage==='audit'?'audit':'analysis')+'/status/'+receipt.response.run_id);
    assert.equal(job.total_samples,100);
    const row=await element(stage==='exploration'?`tr[data-id="${job.run_id}"]`:stage==='knowledge'
      ?`tr[data-pick-job="${job.run_id}"]`:stage==='audit'?`.audit-table tr[data-run-id="${job.run_id}"]`:`tr[data-dc-row="${job.program_batch_id||job.run_id}"]`);
    await driver.wait(until.elementIsVisible(row),20000);
    await click(await row.findElement(By.css('td')));
    await driver.wait(async()=>(await row.getAttribute('aria-selected'))==='true',20000);
    const proof={run_id:job.run_id,status:job.status,selected:true,completed:job.completed,failed:job.failed,unprocessed:job.unprocessed,
      viewport:await driver.executeScript('return [innerWidth,innerHeight]')};
    if(stage==='exploration'||stage==='knowledge') {
      const results=await read('analysis/results/'+job.run_id);
      if(results.publication) {
        const publication=results.publication;
        await driver.wait(async()=>(await(await element('button[aria-label="导出当前作业成果"]')).getAttribute('data-version-id'))===publication.version_id,20000,
          '页面必须显示所选作业的正式发布版本');
        proof.version_id=publication.version_id;
        proof.export=await download(await element('button[aria-label="导出当前作业成果"]'),
          'analysis/publications/'+publication.version_id+'/export','.zip');
        const entries=stage==='exploration'?publication.catalog.directions.filter(item=>!publication.removed_direction_ids.includes(item.direction_id)):publication.catalog.checks;
        if(entries.length) {
          const requested=entryId?entries.find(item=>stage==='exploration'?item.direction_id===entryId:item.check_id===entryId):undefined;
          if(entryId)assert.ok(requested,'所选条目必须属于所选正式发布版本');
          const entryButton=await element(requested?stage==='exploration'
            ?`tr[aria-label=${JSON.stringify('查看方向 '+requested.title)}]`:`button[data-view-entry=${JSON.stringify(entryId)}]`
            :stage==='exploration'?'tr[aria-label^="查看方向 "]':'button[data-view-entry]');
          const entryIdentity=await entryButton.getAttribute(stage==='exploration'?'aria-label':'data-view-entry');
          const entry=entries.find(item=>stage==='exploration'?'查看方向 '+item.title===entryIdentity:item.check_id===entryIdentity);
          assert.ok(entry,'页面条目必须来自所选发布版本');
          proof.entry_id=stage==='exploration'?entry.direction_id:entry.check_id;
          await click(stage==='exploration'?await entryButton.findElement(By.css('td')):entryButton);
          const dialogSelector=stage==='exploration'?'dialog.exp-direction-dialog[open]':'dialog.knowledge-entry-dialog[open]';
          const dialog=await element(dialogSelector);
          await driver.wait(async()=>(await dialog.getText()).includes(entry.title),20000);
          if(stage==='exploration'){
            const cards=await driver.executeScript('return [...document.querySelectorAll(".exp-direction-evidence-card")].map(card=>({ref:card.dataset.evidenceCard,kind:card.closest("[data-evidence-kind]").dataset.evidenceKind,url:card.querySelector("img").src}))');
            const samples=new Set();
            for(const card of cards){
              const id=decodeURIComponent(new URL(card.url).pathname.split('/').at(-1));
              const item=publication.evidence.find(item=>item.evidence_id===id);assert.ok(item);
              assert.equal(item.image.role,'overview');assert.equal(item.image.representation,'raw');
              assert.deepEqual(item.image.crop_bbox,[0,0,...item.image.original_size]);
              assert.ok(!samples.has(item.sample_id));samples.add(item.sample_id);
              if(item.sampling_group==='normal')assert.equal(card.kind,'normal');
              if(item.sampling_group==='abnormal')assert.equal(card.kind,'defect');
            }
            proof.evidence_cards={total:cards.length,normal:cards.filter(card=>card.kind==='normal').length,
              abnormal:cards.filter(card=>card.kind==='defect').length,unclassified:cards.filter(card=>card.kind==='unknown').length};
            await fs.writeFile(path.join(output,prefix+'-direction.png'),await driver.takeScreenshot(),'base64');
          }
          const thumbnail=await element(dialogSelector+' .iad-thumbnail-card');
          await click(thumbnail);
          await driver.wait(()=>driver.executeScript('const image=document.querySelector("#big-image");return image?.complete&&image.naturalWidth>0'),20000);
          const image=await element('#big-image'),url=await image.getAttribute('src');
          const evidenceId=decodeURIComponent(new URL(url,base).pathname.split('/').at(-1));
          const evidence=publication.evidence.find(item=>item.evidence_id===evidenceId);
          assert.ok(evidence,'大图必须属于所选固定发布版本');
          assert.equal(Number(await image.getAttribute('naturalWidth')),evidence.image.sent_size[0]);
          assert.equal(Number(await image.getAttribute('naturalHeight')),evidence.image.sent_size[1]);
          const response=await fetch(new URL(url,base));assert.equal(response.status,200);
          assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),evidence.image.sha256);
          proof.evidence={evidence_id:evidenceId,sample_id:evidence.sample_id,sha256:evidence.image.sha256,sent_size:evidence.image.sent_size};
          await fs.writeFile(path.join(output,prefix+'-detail.png'),await driver.takeScreenshot(),'base64');
          await click(await element('#full-close'));
          if(stage==='exploration')await click(await element('button[aria-label="关闭方向详情"]'));
          else {
            const detail=await read('knowledge/details?'+new URLSearchParams({version_id:publication.version_id,check_id:entry.check_id}));
            const direction=detail.directions.find(item=>item.source.origin==='explored')||detail.directions[0];
            assert.ok(direction,'正式知识必须能打开所选方向的固定来源');
            proof.direction_source=direction.source;
            await click(await element(`button[aria-label=${JSON.stringify('查看方向来源 '+direction.title)}]`));
            const sourceText=await(await element('dialog.iad-prompt-drawer[open] .iad-prompt-text')).getText();
            assert.ok(sourceText.includes(direction.source_instruction.trim()));
            assert.ok(sourceText.includes(direction.source.origin==='explored'?direction.source.version_id:direction.source.revision));
            await fs.writeFile(path.join(output,prefix+'-direction-source.png'),await driver.takeScreenshot(),'base64');
            await click(await element('button[aria-label="关闭方向来源抽屉"]'));
            if(direction.source.origin==='explored') {
              const upstream=await read('analysis/publications/'+direction.source.version_id);
              const original=upstream.catalog.directions.find(item=>item.direction_id===direction.source.direction_id);
              assert.ok(original);
              await click(await element(`button[aria-label=${JSON.stringify('打开源探索版本 '+direction.title)}]`));
              await driver.wait(async()=>(await(await element('button[aria-label="导出当前作业成果"]')).getAttribute('data-version-id'))===direction.source.version_id,20000);
              const route=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad'));
              assert.equal(route.job,direction.source.run_id);assert.equal(route.version,direction.source.version_id);
              assert.ok((await(await element('dialog.exp-direction-dialog[open]')).getText()).includes(original.title));
              await fs.writeFile(path.join(output,prefix+'-source-exploration.png'),await driver.takeScreenshot(),'base64');
              await click(await element('button[aria-label="关闭方向详情"]'));
              await click(await element('button[aria-label="知识挖掘"]'));
              const originalRow=await element(`tr[data-pick-job="${job.run_id}"]`);
              await click(await originalRow.findElement(By.css('td')));
              await driver.wait(async()=>(await(await element('button[aria-label="导出当前作业成果"]')).getAttribute('data-version-id'))===publication.version_id,20000);
            } else await click(await element('button[aria-label="关闭知识详情"]'));
          }
        } else {
          await driver.wait(()=>driver.executeScript('return /本次没有形成可用的候选方向|当前作业暂无知识条目/.test(document.body.textContent)'),20000);
        }
      } else {
        await driver.wait(()=>driver.executeScript('return document.body.textContent.includes(arguments[0])&&!document.querySelector(arguments[1])',
          '当前作业没有已发布结果','button[aria-label="导出当前作业成果"]'),20000);
      }
    }
    if(stage==='consistency' && job.status==='COMPLETED') {
      proof.consistency = await verifyConsistencyUserResult(driver, {base, runId: job.run_id, output, prefix,
        downloadDirectory: downloadAttempt, expectedConcurrency:receipt.configuration.settings.concurrency});
    }
    if(stage==='audit') {
      if(job.completed>0) {
        const samples=await read('audit/jobs/'+job.run_id+'/samples');
        const sample=samples.items.find(item=>item.audit_state!=='unprocessed');
        assert.ok(sample,'原页面首批应有已完成审计图像');
        const detail=await read('audit/jobs/'+job.run_id+'/samples/'+encodeURIComponent(sample.sample_id));
        await click(await element(`#audit-images [data-sample-id="${sample.sample_id}"]`));
        await driver.wait(async()=>(await(await element('[data-audit-section="analysis"]')).getText()).includes(detail.final.analysis),20000);
        await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll(".audit-dialog img")];return images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0)'),20000);
        await fs.writeFile(path.join(output,prefix+'-detail.png'),await driver.takeScreenshot(),'base64');
        await click(await element('button[aria-label="关闭图像审计详情"]'));
      }
      if(job.status==='COMPLETED') {
        const report=await read('audit/jobs/'+job.run_id+'/report');
        assert.equal(report.audited_samples,100);assert.equal(report.total_samples,100);
        assert.equal(report.knowledge_version_id,receipt.request.knowledge?.version_id||null);
        assert.equal(Object.values(report.distribution).reduce((sum,count)=>sum+count,0),100);
        await click(await driver.findElement(By.xpath('//button[normalize-space(.)="报告"]')));
        const exportButton=await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="导出 HTML"]')),20000);
        proof.metadata=await verifyReportMetadata(driver);
        proof.export=await download(exportButton,'audit/jobs/'+job.run_id+'/export','.html');
        await fs.writeFile(path.join(output,prefix+'-report.json'),JSON.stringify(report,null,2)+'\n');
      }
    }
    if(!['PENDING','RUNNING'].includes(job.status)) {
      const after=await read((stage==='audit'?'audit':'analysis')+'/status/'+job.run_id);
      assert.deepEqual(after.model_calls.map(call=>call.call_id),job.model_calls.map(call=>call.call_id),'查看和导出不能新增模型调用');
    }
    await fs.writeFile(path.join(output,prefix+'-view-proof.json'),JSON.stringify(proof,null,2)+'\n');
    await driver.executeScript('window.scrollTo(0,0);document.querySelectorAll(".iad-workbench").forEach(surface=>surface.scrollTop=0)');
    await fs.writeFile(path.join(output,prefix+'-current.png'),await driver.takeScreenshot(),'base64');
    console.log(JSON.stringify({dataset:datasetKey,stage,run_id:job.run_id,status:job.status,total:job.total_samples,
      completed:job.completed,failed:job.failed,unprocessed:job.unprocessed,version_id:job.analysis_version_id}));
  } else {
  await click(await element(page.create));
  let start,normalName,defectName;
  if(stage==='exploration') {
  await click(await element('button[aria-label="继续添加良品图像"]'));
  if(datasetKey==='anomaly')await(await element('#exp-source-search')).sendKeys('公头OK/');
  const normal=await driver.wait(async()=>{
    const nodes=await driver.findElements(By.css('input[aria-label^="选择良品 "]'));return nodes.length?nodes[0]:false;
  },20000);
  normalName=await normal.getAttribute('aria-label');await click(normal);
  await click(await driver.findElement(By.xpath('//button[normalize-space(.)="完成选择"]')));
  await click(await driver.findElement(By.xpath('//button[@role="tab" and starts-with(normalize-space(.),"异常样例")]')));
  await click(await element('button[aria-label="继续添加异常图像"]'));
  if(datasetKey==='anomaly')await(await element('#exp-source-search')).sendKeys('公头NG/');
  const defect=await driver.wait(async()=>{
    const nodes=await driver.findElements(By.css('input[aria-label^="选择异常 "]'));
    return datasetKey==='anomaly'?nodes[0]||false:nodes.length>1?nodes[1]:false;
  },20000);
  defectName=await defect.getAttribute('aria-label');await click(defect);
  await click(await driver.findElement(By.xpath('//button[normalize-space(.)="完成选择"]')));
  start=await driver.findElement(By.xpath('//button[normalize-space(.)="启动联合探索"]'));
  } else if(stage==='consistency') {
    await click(await element('#dc-new-child-trigger'));
    const subsets=await driver.findElements(By.css('#dc-new-child-options input[type="checkbox"]'));
    for(const subset of subsets)if(await subset.isSelected()!==((await subset.getAttribute('value'))===source.dataset_id))await click(subset);
    await click(await element('#dc-new-child-trigger'));
    assert.ok((await(await element('#dc-new-prompt')).getAttribute('value')).trim());
    start=await element('[data-dc="create-job"]');
  } else if(stage==='audit') {
    await click(await element(`input[aria-label="选择一致性作业 ${consistencyRun}"]`));
    if(auditKnowledge) {
      const radio=await element(`tr[data-version-id="${auditKnowledge.version_id}"] input[name="audit-knowledge-source"]`);
      await click(radio);
      for(const id of checkIds) {
        const check=auditKnowledge.entries.find(entry=>entry.check_id===id);
        await click(await element(`input[aria-label="选择知识条目 ${check.title}"]`));
      }
    }
    assert.ok((await(await element('#audit-create-summary')).getText()).includes(`${checkIds?.length||0} 条`));
    start=await element('#audit-create-submit');
  } else {
    if(presetId) {
      await click(await element('#kb-tab-preset'));
      await click(await element('#general-directions input[data-dir-id="preset:'+presetId+'"]'));
    } else {
      await click(await element('#kb-tab-explore'));
      const checkbox=await driver.wait(async()=>{
        const nodes=await driver.findElements(By.css('#explored-directions input[type="checkbox"]'));
        for(const node of nodes) {
          const ref=JSON.parse(await node.getAttribute('data-dir-id'));
          if(ref.run_id===directionSelection.source.run_id&&ref.version_id===directionSelection.source.version_id
            &&ref.direction_id===directionSelection.source.direction_id)return node;
        }
        return false;
      },20000);
      await click(checkbox);
    }
    const prompt=await(await element('#prompt-text')).getAttribute('value');
    assert.ok(prompt.includes(directionSelection.title)&&prompt.includes(directionSelection.instruction));
    start=await element('#submit-job');
  }
  await driver.wait(until.elementIsEnabled(start),10000);
  const systemPrompt=await(await element('textarea[aria-label="系统提示词"]')).getAttribute('value');
  const userPrompt=await(await element('textarea[aria-label="用户提示词"]')).getAttribute('value');
  assert.ok(systemPrompt.trim());
  assert.ok(userPrompt.trim());
  await fs.writeFile(path.join(output,prefix+'-create.png'),await driver.takeScreenshot(),'base64');
  await driver.executeScript(`window.__analysisSubmission=null;const original=window.fetch,submissionPath=arguments[0];
    window.fetch=async function(...args){const response=await original.apply(window,args);
      if(String(args[0]).endsWith(submissionPath))window.__analysisSubmission={status:response.status,request:JSON.parse(args[1].body),response:await response.clone().json()};
      return response;};`,stage==='audit'?'/audit/start':'/analysis/start');
  await click(start);
  const submitted=await driver.wait(()=>driver.executeScript('return window.__analysisSubmission'),30000);
  await fs.writeFile(receiptFile,JSON.stringify({dataset_id:source.dataset_id,model:model.settings.model,
    configuration:model,
    submitted_at:new Date().toISOString(),normal:normalName,defect:defectName,...submitted},null,2)+'\n');
  assert.equal(submitted.status,200,JSON.stringify(submitted.response));
  assert.equal(submitted.request.system_prompt,systemPrompt);
  assert.equal(stage==='exploration'?submitted.request.prompt.text:stage==='knowledge'?submitted.request.mining_prompt.instruction:submitted.request.instruction,userPrompt);
  assert.equal(submitted.response.total_samples,100);
  assert.deepEqual(stage==='audit'?submitted.request.subset_ids:submitted.request.dataset_ids,[source.dataset_id]);
  if(stage==='exploration') {assert.equal(submitted.request.normal_images.length,1);assert.equal(submitted.request.defect_images.length,1);}
  else if(stage==='consistency')assert.equal(submitted.request.analysis_kind,'consistency');
  else if(stage==='audit') {
    assert.equal(submitted.request.consistency_job_id,consistencyRun);
    assert.deepEqual(submitted.request.knowledge,auditKnowledge?{
      job_id:auditKnowledge.job_id,version_id:knowledgeVersion,entry_ids:checkIds}:null);
  }
  else {
    assert.equal(submitted.request.analysis_kind,'knowledge');
    assert.equal(submitted.request.mining_prompt.directions.length,1);
    assert.deepEqual(submitted.request.mining_prompt.directions[0].source,directionSelection.source);
  }
  const runId=submitted.response.run_id;
  await driver.wait(until.elementLocated(By.css(stage==='exploration'?`tr[data-id="${runId}"]`:stage==='knowledge'
    ?`tr[data-pick-job="${runId}"]`:stage==='audit'?`.audit-table tr[data-run-id="${runId}"]`:`tr[data-dc-row="${submitted.response.program_batch_id||runId}"]`)),20000);
  const job=await read((stage==='audit'?'audit':'analysis')+'/status/'+runId);
  await fs.writeFile(path.join(output,prefix+'-submitted.png'),await driver.takeScreenshot(),'base64');
  console.log(JSON.stringify({dataset:datasetKey,stage,run_id:runId,status:job.status,total:job.total_samples,completed:job.completed,model:model.settings.model}));
  assert.ok(['PENDING','RUNNING','COMPLETED'].includes(job.status),JSON.stringify(job.execution_error));
  }
} catch(error) {
  await fs.writeFile(path.join(output,prefix+'-error.png'),await driver.takeScreenshot(),'base64');
  await fs.writeFile(path.join(output,prefix+'-error.txt'),await driver.findElement(By.css('body')).getText());throw error;
} finally {await driver.quit();await fs.rm(downloadAttempt,{recursive:true,force:true});}
