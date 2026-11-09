import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {analysisPageBundle} from './fixtures/analysis-page.js';

test('a knowledge entry opens its frozen preset and exact exploration publication beyond the first job page',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-lineage-'));
  let bridge,server,driver;
  const previousDirectory=process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR;
  t.after(async()=>{
    if(driver)await driver.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();
    if(previousDirectory===undefined)delete process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR;
    else process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR=previousDirectory;
    await fs.rm(root,{recursive:true,force:true});
  });
  const database=path.join(root,'lineage.db');
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import sys,json
from pathlib import Path
from uuid import uuid4
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries
from iad_core.exploration.models import DirectionRemoval
from iad_core.workbench.calls import ModelCalls,NativeModelCallStart,NativeModelCallEnd
from iad_core.knowledge.instructions import default_directions
from iad_core.entry import dataset_get
root=Path(sys.argv[1]);images=root/'images';images.mkdir()
for i in range(2):Image.new('RGB',(32,24),(100+i,110,120)).save(images/(str(i)+'.png'))
db=Database(sys.argv[2]);registry=DatasetRegistry(db)
dataset=registry.import_labelme(DatasetImport(format='labelme',name='来源版本',image_dir=str(images),annotation_dir=str(images)))
registry.save(dataset,group_id=registry.create_group('来源组')['group_id'])
runtime=WorkbenchRuntime(db);jobs=AnalysisAgentJobs(runtime);dataset_id=dataset.dataset.id
role=dict(profile=dict(provider_id='swift-30003',model_id='fixture',endpoint='http://127.0.0.1:30003/v1/chat/completions',context_tokens=65536,max_output_tokens=4096),input_modalities=['text','image'],native_profile={'models':[{'id':'fixture'}]})
for module in ['exploration','knowledge']:ModuleSettings(db).save(dict(module=module,expected_revision=0,settings=dict(model=dict(provider_id='swift-30003',model_id='fixture'),batch_size=1)))
def observe(run_id,title,check=False):
 context=jobs.context(run_id);page=AnalysisEvidence(jobs).read(run_id,{'sample_id':context.round.targets[0].sample_id})
 if not check:
  AnalysisEvidence(jobs).crop(run_id,{'sample_id':page.sample_id,'bbox':[4,5,18,16]})
  page=AnalysisEvidence(jobs).read(run_id,{'sample_id':page.sample_id})
 cid='call_'+uuid4().hex;calls=ModelCalls(db)
 calls.start_native(run_id,NativeModelCallStart(call_id=cid,started_at='2026-11-09T12:00:00Z',request={'fixture':'frozen source page'}),sample_id=None,session_id=context.session_id,attempt=1)
 AnalysisEvidence(jobs).delivered(run_id,cid,[i.image.evidence_id for i in page.images]);calls.finish_native(run_id,None,NativeModelCallEnd(call_id=cid,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
 observation=dict(sample_id=page.sample_id,dataset_id=dataset_id,description='本登记可见边缘。',evidence_ids=[i.image.evidence_id for i in page.images])
 change=dict(direction_id='assembly',title=title,instruction=title+'的冻结原文。',applies_to='both',rationale='依据本图边缘['+observation['evidence_ids'][0]+']。',evidence_ids=[observation['evidence_ids'][0]],counter_evidence_ids=[],dataset_ids=[dataset_id],limitations=['标签18含义未知','ROI仅21x17'])
 if check:
  observation['directions']=[dict(direction_ref=d.ref,status='applicable',reason='边缘可见。') for d in context.selected_directions]
  change=dict(check_id='C1',title='来源可追溯判据',subject='主体',location='边缘',criterion='核对边缘。',allowed_variations=[],limitations=[],status='provisional',support_evidence_ids=observation['evidence_ids'],counter_evidence_ids=[],direction_refs=[d.ref for d in context.selected_directions],dataset_ids=[dataset_id])
 return AnalysisCommits(jobs).accept(run_id,dict(commit_key=str(uuid4()),base_revision=context.revision,round_id=context.round.round_id,observations=[observation],summary=title if check else '旧来源摘要：本轮仅有局部发现。',limitations=[],unresolved_questions=[],**({'checks':[change]} if check else {'directions':[change]})))
source=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[dataset_id],normal_images=[dataset_id+':0.png'],prompt={'text':'原探索正文。'}),agent=role)
observe(source['run_id'],'首版探索方向');source_version=jobs.cancel(source['run_id'])['analysis_version_id']
preset=default_directions()[0].model_copy(update={'title':'本场预设动作','instruction':'本场编辑后的预设动作。'}).model_dump(mode='json')
mining=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[dataset_id],mining_prompt=dict(objective='沿两项冻结来源检查。',instruction='本场挖掘正文。',directions=[dict(direction_id='assembly',origin='explored',title='本场探索动作',instruction='本场编辑后的探索动作。',source=dict(origin='explored',run_id=source['run_id'],version_id=source_version,direction_id='assembly')),preset])),agent=role)
while jobs.context(mining['run_id']).round:observe(mining['run_id'],'知识本场观察',check=True)
jobs.jobs.finish_external(mining['run_id']);knowledge_version=AnalysisPublications(db).publish(mining['run_id']).version_id
AnalysisQueries(db).remove_direction(DirectionRemoval(dataset_id=dataset_id,version_id=source_version,direction_id='assembly'))
jobs.resume(source['run_id']);observe(source['run_id'],'后续探索方向');jobs.jobs.finish_external(source['run_id']);latest_version=AnalysisPublications(db).publish(source['run_id']).version_id
for i in range(9):
 other=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[dataset_id],normal_images=[dataset_id+':0.png'],prompt={'text':'其他探索正文。'}),agent=role);jobs.cancel(other['run_id'])
presets=root/'presets';presets.mkdir();(presets/'assembly.txt').write_text('当前目录的新预设\\n当前目录的新指令。')
other_images=root/'other';other_images.mkdir();Image.new('RGB',(32,24),'green').save(other_images/'other.png')
other=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='另一数据集',image_dir=str(other_images),annotation_dir=str(other_images)))
registry.save(other,group_id=registry.create_group('另一组')['group_id'])
other_job=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[other.dataset.id],normal_images=[other.dataset.id+':other.png'],prompt={'text':'另一范围的探索。'}),agent=role);jobs.cancel(other_job['run_id'])
print(json.dumps(dict(other_dataset=dataset_get({'dataset_id':other.dataset.id},db.db_path),other_run=other_job['run_id'],dataset=dataset_get({'dataset_id':dataset_id},db.db_path),source_run=source['run_id'],source_version=source_version,latest_version=latest_version,knowledge_version=knowledge_version,preset_revision=preset['source']['revision'],role=role)))
runtime.close()
`,root,database],{cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  const {PythonBridge}=await import('../lib/server/python-bridge/index.js');
  process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR=path.join(root,'presets');
  bridge=new PythonBridge({cwd:findWorkspaceRoot(),dbPath:database});
  const accepted=[];
  bridge.useModelRouting({async execute(operation,args,signal,dispatch){
    if(operation!=='analysis_start')return dispatch(operation,args,signal);
    const job=await dispatch('analysis_agent_start',{request:args.request,agent:data.role},signal);
    accepted.push({job,request:args.request});return job;
  }});
  const currentPreset=(await bridge.execute('knowledge_presets')).directions[0];
  assert.equal(currentPreset.title,'当前目录的新预设');assert.notEqual(currentPreset.source.revision,data.preset_revision);
  const bundle=await analysisPageBundle('knowledge',data.dataset);
  const api=createIadHttpHandler(bridge);
  server=http.createServer((req,res)=>{
    if(req.url==='/analysis-browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle);}
    else if(req.url==='/analysis-browser'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/analysis-browser.js"></script>');}
    else return api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1920,height:1080});
  await driver.get(`http://127.0.0.1:${server.address().port}/analysis-browser`);
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  await(await element('button[aria-label="查看知识条目 来源可追溯判据"]')).click();
  await(await element('button[aria-label="查看方向来源 本场预设动作"]')).click();
  const sourceText=await(await element('.iad-prompt-text')).getText();
  assert.ok(sourceText.includes('装配与配合')&&sourceText.includes(data.preset_revision));
  assert.ok(sourceText.includes('本场编辑后的预设动作。'));
  await(await element('button[aria-label="关闭方向来源抽屉"]')).click();
  await(await element('button[aria-label="查看方向来源 本场探索动作"]')).click();
  const exploredText=await(await element('.iad-prompt-text')).getText();
  assert.ok(exploredText.includes('首版探索方向的冻结原文。'));
  assert.ok(exploredText.includes(data.source_version)&&exploredText.includes('本场编辑后的探索动作。'));
  await(await element('button[aria-label="关闭方向来源抽屉"]')).click();
  await(await element('button[aria-label="打开源探索版本 本场探索动作"]')).click();
  await driver.wait(async()=>(await(await element('button[aria-label="导出当前作业成果"]')).getAttribute('data-version-id'))===data.source_version,10000);
  assert.ok((await driver.findElement(By.css('#exploration-page')).getText()).includes('首版探索方向'));
  await element('dialog[aria-label="首版探索方向"]');
  assert.equal(await(await element('dialog .exp-dialog-head strong')).getText(),'首版探索方向');
  await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll("dialog .exp-direction-evidence img")];return images.length>0&&images.every(image=>image.complete&&image.naturalWidth===32)'),10000);
  const citation=await element('.exp-direction-rationale [data-evidence-ref]');
  assert.equal(await citation.getText(),'良品 N1');
  const linkedCard=await element('[data-evidence-card="N1"]');
  const priorFocus=await driver.executeScript('return document.activeElement.getAttribute("aria-label")');
  await driver.actions().move({origin:citation}).perform();
  await driver.wait(async()=>await linkedCard.getAttribute('data-highlighted')==='true',3000);
  assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),priorFocus);
  await driver.actions().move({origin:await element('.exp-direction-goal h3')}).perform();
  await driver.wait(async()=>await linkedCard.getAttribute('data-highlighted')==='false',3000);
  await driver.executeScript('arguments[0].focus()',citation);
  await driver.wait(async()=>await linkedCard.getAttribute('data-highlighted')==='true',3000);
  await linkedCard.click();await element('#full-overlay');
  await driver.wait(()=>driver.executeScript('const image=document.querySelector("#full-overlay img");return image?.complete&&image.naturalWidth===32'),10000);
  await(await element('button[aria-label="下一张图像"]')).click();
  await driver.wait(()=>driver.executeScript('const image=document.querySelector("#full-overlay img");return image?.complete&&image.naturalWidth===14&&document.querySelector("#full-file-name")?.textContent.trim()==="0.png"'),10000);
  await(await element('#full-close')).click();
  assert.ok(!(await driver.findElement(By.css('#exploration-page')).getText()).includes('后续探索方向'));
  const location=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad'));
  assert.equal(location.job,data.source_run);assert.equal(location.version,data.source_version);
  assert.equal(await(await element(`tr[data-id="${data.source_run}"]`)).getAttribute('data-selected'),'true');
  await(await element('button[aria-label="关闭方向详情"]')).click();
  await(await element(`#exp-parent option[value="${data.other_dataset.group_id}"]`)).click();
  const otherRow=await element(`tr[data-id="${data.other_run}"]`);
  await(await otherRow.findElement(By.css('td'))).click();
  await driver.wait(async()=>JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad')).job===data.other_run,10000);
  await(await element(`#exp-parent option[value="${data.dataset.group_id}"]`)).click();
  await driver.wait(async()=>{
    const response=JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get('iad'));
    return !response.job||response.job!==data.other_run;
  },5000,'切换数据集应清除上一范围的所选作业');
  assert.ok(!(await driver.findElement(By.css('#exploration-page')).getText()).includes('所选作业不属于当前数据集'));
  const output=path.resolve('runs/verification/analysis-native-pages');await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,'knowledge-exploration-source-version.png'),await driver.takeScreenshot(),'base64');
  await driver.get(`http://127.0.0.1:${server.address().port}/analysis-browser`);
  await(await element('#create-btn')).click();await(await element('#kb-tab-explore')).click();
  const sourceChoice=await driver.wait(async()=>{
    for(const item of await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))){
      const ref=JSON.parse(await item.getAttribute('data-dir-id'));
      if(ref.run_id===data.source_run&&ref.version_id===data.latest_version)return item;
    }
    return false;
  },10000);
  await sourceChoice.click();
  const userPrompt=await element('#prompt-text');
  await driver.wait(async()=>(await userPrompt.getAttribute('value')).includes('后续探索方向的冻结原文。'),10000);
  const instruction=await userPrompt.getAttribute('value');
  for(const sourceText of ['旧来源摘要：本轮仅有局部发现。','标签18含义未知','ROI仅21x17'])
    assert.ok(!instruction.includes(sourceText),'自动用户要求不应把旧来源背景提升为本场要求：'+sourceText);
  const start=await element('#submit-job');await driver.wait(until.elementIsEnabled(start),10000);
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',start);await start.click();
  await driver.wait(()=>accepted.length===1,10000);
  const frozen=await bridge.execute('analysis_agent_snapshot',{run_id:accepted[0].job.run_id});
  assert.equal(frozen.instruction,instruction);
  assert.equal(frozen.selected_directions[0].source_summary,'旧来源摘要：本轮仅有局部发现。');
  assert.deepEqual(frozen.selected_directions[0].source_limitations,['标签18含义未知','ROI仅21x17']);
  assert.equal(frozen.selected_directions[0].source.version_id,data.latest_version);
  assert.equal((await bridge.execute('analysis_status',{run_id:accepted[0].job.run_id})).model_calls.length,0);

});
