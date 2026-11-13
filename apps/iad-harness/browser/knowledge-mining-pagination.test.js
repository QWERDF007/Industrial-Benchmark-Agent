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

test('mining direction pagination preserves the complete selection and edits',{timeout:120000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-mining-pagination-'));
  const workspace=findWorkspaceRoot(),app=path.join(workspace,'apps/iad-harness'),database=path.join(root,'pagination.db');
  const presetsDirectory=path.join(root,'presets'),previousDirectory=process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR;
  let bridge,server,driver;
  t.after(async()=>{
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();
    if(previousDirectory===undefined)delete process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR;
    else process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR=previousDirectory;
    await fs.rm(root,{recursive:true,force:true});
  });
  await fs.mkdir(presetsDirectory);
  const presetFiles=Array.from({length:17},(_,index)=>({file:path.join(presetsDirectory,`direction-${String(index+1).padStart(2,'0')}.txt`),
    content:`预设方向 ${index+1}\n核对第 ${index+1} 项结构。`}));
  await Promise.all(presetFiles.map(item=>fs.writeFile(item.file,item.content)));
  process.env.IAD_KNOWLEDGE_DIRECTIONS_DIR=presetsDirectory;
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys
from pathlib import Path
from uuid import uuid4
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.calls import ModelCalls,NativeModelCallStart,NativeModelCallEnd
from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.commits import AnalysisCommits
from iad_core.entry import dataset_get
root=Path(sys.argv[1]);db=Database(sys.argv[2]);registry=DatasetRegistry(db)
role=dict(profile=dict(provider_id='fixture',model_id='pagination',endpoint='http://127.0.0.1:30003/v1/chat/completions',context_tokens=65536,max_output_tokens=4096),
 native_profile=dict(api='openai-completions',baseURL='http://127.0.0.1:30003/v1'),input_modalities=['text','image'])
for module in ['knowledge','exploration']:
 ModuleSettings(db).save(dict(module=module,expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='pagination'),batch_size=2)))
runtime=WorkbenchRuntime(db);jobs=AnalysisAgentJobs(runtime);groups=[];datasets=[]
for index,count in enumerate([17,9,8,7,0,17]):
 group=registry.create_group('分页数据集 '+str(count)) if index<5 else groups[0]
 if index<5:groups.append(group)
 images=root/str(index);images.mkdir();Image.new('RGB',(32,24),(100+index,110,120)).save(images/'sample.png')
 config=registry.import_labelme(DatasetImport(format='labelme',name='分页子集 '+str(index),image_dir=str(images),annotation_dir=str(images)))
 registry.save(config,group_id=group['group_id']);dataset_id=config.dataset.id
 datasets.append(dataset_get({'dataset_id':dataset_id},db.db_path))
 if not count:continue
 source=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[dataset_id],normal_images=[dataset_id+':sample.png'],prompt=dict(text='核对主体边缘关系。')),agent=role)
 run_id=source['run_id'];context=jobs.context(run_id);evidence=AnalysisEvidence(jobs)
 page=evidence.read(run_id,dict(sample_id=context.round.targets[0].sample_id));eid=page.images[0].image.evidence_id
 calls=ModelCalls(db);call_id='call_'+uuid4().hex
 calls.start_native(run_id,NativeModelCallStart(call_id=call_id,started_at='2026-11-12T12:00:00Z',request=dict(fixture='pagination')),
  sample_id=None,session_id=context.session_id,attempt=1)
 evidence.delivered(run_id,call_id,[item.image.evidence_id for item in page.images])
 calls.finish_native(run_id,None,NativeModelCallEnd(call_id=call_id,finished_at='2026-11-12T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
 directions=[dict(direction_id='direction-'+str(number+1),title='探索方向 '+str(number+1),instruction='核对第 '+str(number+1)+' 项边缘关系。',
  applies_to='both',rationale='主体边缘在本图可见。',dataset_ids=[dataset_id],limitations=['合成样例仅用于界面验收。']) for number in range(count)]
 AnalysisCommits(jobs).accept(run_id,dict(commit_key=str(uuid4()),base_revision=context.revision,round_id=context.round.round_id,
  observations=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description='主体边缘可见。',evidence_ids=[eid])],directions=directions,
  arguments=[dict(entry_id=item['direction_id'],evidence_id=eid,role='support',reason='主体边缘可见。') for item in directions],
  selections=[dict(entry_id=item['direction_id'],key_evidence=[dict(evidence_id=eid,role='support',reason='复查主体边缘。')]) for item in directions],
  summary='主体边缘关系。',limitations=['合成样例。'],unresolved_questions=[]))
 jobs.cancel(run_id)
print(json.dumps(dict(datasets=datasets,groups=groups,role=role)));runtime.close()
`,root,database],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  bridge=new PythonBridge({cwd:workspace,dbPath:database});
  const accepted=[];
  bridge.useModelRouting({async execute(operation,args,signal,dispatch){
    if(operation!=='analysis_start')return dispatch(operation,args,signal);
    const job=await dispatch('analysis_agent_start',{request:args.request,agent:data.role},signal);
    accepted.push({job,request:args.request});return job;
  }});
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {KnowledgeMiningCreate} from './src/client/components/KnowledgeMiningCreate.tsx';
    import {WorkbenchProviders} from './src/client/host/WorkbenchProviders.tsx';
    import {Workspace} from './src/client/workspace.tsx';import {WorkbenchSession} from './src/client/workbench-session.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const data=${JSON.stringify(data)},dataset=data.datasets[0],workspace=new Workspace(new WorkbenchSession({}));
    workspace.openLocation({pageId:'industrial-knowledge',datasetId:dataset.dataset_id});
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    createRoot(document.getElementById('root')).render(<WorkbenchProviders workspace={workspace}>
      <div className="iad-workbench"><KnowledgeMiningCreate dataset={dataset} datasets={data.datasets} groups={data.groups}
        selectedParentId={dataset.group_id} selectedChildIds={[dataset.dataset_id]} onClose={()=>{}} onStarted={()=>{}}/></div>
    </WorkbenchProviders>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge);
  server=http.createServer((req,res)=>{
    if(req.url==='/browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/browser.js"></script>');}
    else void api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1440,height:1080});
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const click=async css=>{const target=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();};
  const fill=async(css,text)=>{
    const input=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',input);await input.click();
    await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await input.sendKeys(text,Key.TAB);
  };
  try{
    await driver.get(base);
    await driver.wait(until.elementIsEnabled(await element('#prompt-text')),10000);
    await t.test('preset directions show eight rows per page and the final remainder',async()=>{
      assert.equal((await driver.findElements(By.css('#general-directions tr'))).length,8);
      const pager=await element('#kb-preset-panel nav[aria-label="通用预设方向分页"]');
      assert.match(await pager.getText(),/共 17 项/);
      assert.equal(await(await pager.findElement(By.css('button:first-child'))).isEnabled(),false);
      await click('#kb-preset-panel button[data-page="3"]');
      assert.equal((await driver.findElements(By.css('#general-directions tr'))).length,1);
      assert.match(await(await element('#general-directions')).getText(),/预设方向 17/);
      assert.equal(await(await pager.findElement(By.css('button:last-of-type'))).isEnabled(),false);
      await click('#kb-preset-panel button[data-page="1"]');
    });
    await t.test('explored directions show eight rows per page and the final remainder',async()=>{
      await click('#kb-tab-explore');
      assert.equal((await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))).length,8);
      const pager=await element('#kb-explore-panel nav[aria-label="方向探索分页"]');
      assert.match(await pager.getText(),/共 17 项/);
      await click('#kb-explore-panel button[data-page="3"]');
      assert.equal((await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))).length,1);
      assert.match(await(await element('#explored-directions')).getText(),/探索方向 17/);
      assert.equal(await(await pager.findElement(By.css('button:last-of-type'))).isEnabled(),false);
      await click('#kb-explore-panel button[data-page="1"]');
    });
    await t.test('changing the dataset scope returns explored directions to the first page',async()=>{
      await click('#kb-explore-panel button[data-page="3"]');
      await(await element(`#kb-setup-dataset option[value="${data.groups[1].group_id}"]`)).click();
      await driver.wait(until.elementIsEnabled(await element('#prompt-text')),10000);
      assert.equal(await(await element('#kb-explore-panel button[aria-current="page"]')).getAttribute('data-page'),'1');
      assert.equal((await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))).length,8);
    });
    await t.test('preset pagination is hidden for zero through eight directions',async()=>{
      for(const [count,rows,pages] of [[0,0,0],[7,7,0],[8,8,0],[9,8,2],[17,8,3]]){
        await Promise.all(presetFiles.map((item,index)=>index<count?fs.writeFile(item.file,item.content):fs.rm(item.file,{force:true})));
        await driver.get(base);
        await driver.wait(until.elementIsEnabled(await element('#prompt-text')),10000);
        assert.equal((await driver.findElements(By.css('#general-directions input[type="checkbox"]'))).length,rows,`${count} preset directions`);
        assert.equal((await driver.findElements(By.css('#kb-preset-panel nav'))).length,pages?1:0);
        if(pages){
          await click(`#kb-preset-panel button[data-page="${pages}"]`);
          assert.equal((await driver.findElements(By.css('#general-directions input[type="checkbox"]'))).length,1);
          assert.match(await(await element('#general-directions')).getText(),new RegExp(`预设方向 ${count}`));
          await click('#kb-preset-panel button[data-page="1"]');
        }
      }
    });
    await t.test('exploration pagination follows the current scope and hides for zero through eight directions',async()=>{
      await click('#kb-tab-explore');
      for(const [index,count,rows,pages] of [[0,17,8,3],[1,9,8,2],[2,8,8,0],[3,7,7,0],[4,0,0,0]]){
        await(await element(`#kb-setup-dataset option[value="${data.groups[index].group_id}"]`)).click();
        await driver.wait(until.elementIsEnabled(await element('#prompt-text')),10000);
        assert.equal((await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))).length,rows,`${count} explored directions`);
        assert.equal((await driver.findElements(By.css('#kb-explore-panel nav'))).length,pages?1:0);
        if(pages){
          assert.equal(await(await element('#kb-explore-panel button[aria-current="page"]')).getAttribute('data-page'),'1');
          await click(`#kb-explore-panel button[data-page="${pages}"]`);
          assert.equal((await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))).length,1);
          assert.match(await(await element('#explored-directions')).getText(),new RegExp(`探索方向 ${count}`));
        }
      }
      assert.match(await(await element('#explored-directions')).getText(),/所选子数据集暂无方向探索结果/);
    });
    await t.test('switching subsets resets the exploration page even when both catalogs have three pages',async()=>{
      await(await element(`#kb-setup-dataset option[value="${data.groups[0].group_id}"]`)).click();
      await driver.wait(until.elementIsEnabled(await element('#prompt-text')),10000);
      await click('#kb-explore-panel button[data-page="3"]');
      for(const dataset of [data.datasets[0],data.datasets[5]]){
        await click('#kb-setup-child-trigger');
        await click(`#kb-setup-child-menu input[value="${dataset.dataset_id}"]`);
        await driver.wait(until.elementIsEnabled(await element('#kb-setup-child-trigger')),10000);
        if(await(await element('#kb-setup-child-trigger')).getAttribute('aria-expanded')==='true')await click('#kb-setup-child-trigger');
      }
      assert.equal(await(await element('#kb-explore-panel button[aria-current="page"]')).getAttribute('data-page'),'1');
      assert.equal((await driver.findElements(By.css('#explored-directions input[type="checkbox"]'))).length,8);
    });
    await t.test('page and tab switches preserve edits and submit selections from every page',async()=>{
      await click('#kb-tab-preset');
      await click('#general-directions input[aria-label="选择预设方向 1"]');
      await click('button[data-edit-id="preset:direction-01"]');
      await fill('#kb-dir-edit-name','已编辑的预设方向');await fill('#kb-dir-edit-text','核对修改后的预设结构。');await click('#kb-dir-save');
      await click('#kb-preset-panel button[data-page="2"]');
      await click('#general-directions input[aria-label="选择预设方向 9"]');
      await click('#kb-tab-explore');
      await click('#explored-directions input[aria-label="选择探索方向 1"]');
      await click('#explored-directions button[data-edit-kind="explore"]');
      await fill('#kb-dir-edit-name','已编辑的探索方向');await fill('#kb-dir-edit-text','核对修改后的探索结构。');await click('#kb-dir-save');
      await click('#kb-explore-panel button[data-page="3"]');
      await click('#explored-directions input[aria-label="选择探索方向 17"]');
      await click('#kb-tab-preset');
      assert.equal(await(await element('#kb-preset-panel button[aria-current="page"]')).getAttribute('data-page'),'2');
      assert.equal(await(await element('#general-directions input[aria-label="选择预设方向 9"]')).isSelected(),true);
      await click('#kb-preset-panel button[data-page="1"]');
      assert.equal(await(await element('#general-directions input[aria-label="选择已编辑的预设方向"]')).isSelected(),true);
      assert.match(await(await element('#general-directions')).getText(),/核对修改后的预设结构/);
      const output=path.join(workspace,'runs/verification/analysis-native-pages');await fs.mkdir(output,{recursive:true});
      await driver.executeScript('document.querySelector(".kb-setup-directions").scrollIntoView({block:"start"})');
      await fs.writeFile(path.join(output,'knowledge-mining-preset-pagination.png'),await driver.takeScreenshot(),'base64');
      await click('#kb-tab-explore');
      assert.equal(await(await element('#kb-explore-panel button[aria-current="page"]')).getAttribute('data-page'),'3');
      assert.equal(await(await element('#explored-directions input[aria-label="选择探索方向 17"]')).isSelected(),true);
      await click('#kb-explore-panel button[data-page="1"]');
      assert.equal(await(await element('#explored-directions input[aria-label="选择已编辑的探索方向"]')).isSelected(),true);
      assert.match(await(await element('#explored-directions')).getText(),/核对修改后的探索结构/);
      await fs.writeFile(path.join(output,'knowledge-mining-explored-pagination.png'),await driver.takeScreenshot(),'base64');
      const titles=['已编辑的预设方向','预设方向 9','已编辑的探索方向','探索方向 17'];
      assert.match(await(await element('#kb-run-summary')).getText(),/挖掘方向 4 项/);
      for(const selector of ['#prompt-text','#kb-observer-prompt']){
        const text=await(await element(selector)).getAttribute('value');
        for(const title of titles)assert.ok(text.includes(title),`${selector} includes ${title}`);
      }
      await click('#submit-job');await driver.wait(()=>accepted.length===1,10000);
      assert.deepEqual(accepted[0].request.mining_prompt.directions.map(item=>item.title),titles);
      const snapshot=await bridge.execute('analysis_agent_snapshot',{run_id:accepted[0].job.run_id});
      assert.deepEqual(snapshot.selected_directions.map(item=>item.title),titles);
      assert.deepEqual(snapshot.selected_directions.map(item=>item.source.origin),['preset','preset','explored','explored']);
      assert.equal(snapshot.selected_directions[0].instruction,'核对修改后的预设结构。');
      assert.equal(snapshot.selected_directions[2].instruction,'核对修改后的探索结构。');
      assert.deepEqual(snapshot.manifest.dataset_ids,[data.datasets[5].dataset_id]);
    });
  }catch(error){
    await fs.writeFile('/tmp/iad-mining-pagination-failure.png',await driver.takeScreenshot(),'base64');
    throw error;
  }
});
