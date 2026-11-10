import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

test('four module forms edit and freeze system and user prompts separately',{timeout:90000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-agent-prompts-'));
  const workspace=findWorkspaceRoot(),app=path.join(workspace,'apps/iad-harness'),database=path.join(root,'audit.db');
  let bridge,server,driver;
  t.after(async()=>{
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    bridge?.destroy();await fs.rm(root,{recursive:true,force:true});
  });
  const env={...process.env,PYTHONPATH:path.join(workspace,'python')};
  const data=JSON.parse(execFileSync(resolvePythonPath(),[path.join(app,'test/fixtures/audit_dataset.py'),root,database,'none','http://127.0.0.1:30003/v1'],{cwd:workspace,env,encoding:'utf8'}));
  execFileSync(resolvePythonPath(),['-c',`
import sys
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry
from iad_core.workbench.module_settings import ModuleSettings
db=Database(sys.argv[1]);registry=DatasetRegistry(db)
registry.save(registry.get(sys.argv[2]),group_id=registry.create_group('提示词验证')['group_id'])
for module in ['exploration','knowledge','consistency']:
 s=ModuleSettings(db).read(module)
 ModuleSettings(db).save(dict(module=module,expected_revision=s.revision,settings={'model':{'provider_id':'fixture','model_id':'native-audit'}}))
`,database,data.dataset_id],{cwd:workspace,env});
  bridge=new PythonBridge({cwd:workspace,dbPath:database});
  const dataset=await bridge.execute('dataset_get',{dataset_id:data.dataset_id});
  const {groups}=await bridge.execute('dataset_group_list',{});
  const role={profile:{provider_id:'fixture',model_id:'native-audit',endpoint:'http://127.0.0.1:30003/v1/chat/completions',context_tokens:65536,max_output_tokens:4096},
    native_profile:{api:'openai-completions',baseURL:'http://127.0.0.1:30003/v1'},input_modalities:['text','image']};
  const accepted=[];
  bridge.useModelRouting({async execute(operation,args,signal,dispatch){
    if(operation==='analysis_start'||operation==='audit_start'){
      const module=operation==='audit_start'?'audit':args.request.analysis_kind;
      const method=module==='audit'?'audit_agent_start':module==='consistency'?'consistency_agent_start':'analysis_agent_start';
      const job=await dispatch(method,{request:args.request,agent:role},signal);
      accepted.push({module,job,request:args.request});return job;
    }
    return dispatch(operation,args,signal);
  }});
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {ExplorationPage} from './src/client/components/ExplorationPage.tsx';
    import {KnowledgePage} from './src/client/components/KnowledgePage.tsx';
    import {ConsistencyPage} from './src/client/components/ConsistencyPage.tsx';
    import {AuditPage} from './src/client/components/AuditPage.tsx';
    import {WorkbenchProviders} from './src/client/host/WorkbenchProviders.tsx';
    import {Workspace} from './src/client/workspace.tsx';
    import {WorkbenchSession} from './src/client/workbench-session.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const dataset=${JSON.stringify(dataset)},module=new URLSearchParams(location.search).get('module');
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    const workspace=new Workspace(new WorkbenchSession({}));
    workspace.openLocation({pageId:'industrial-'+module,datasetId:dataset.dataset_id});
    if(module==='consistency')workspace.updateConsistency({parentId:dataset.group_id,datasetIds:[dataset.dataset_id]},true);
    function Page(){if(module==='consistency')return <ConsistencyPage/>;
      if(module==='audit')return <AuditPage dataset={dataset} datasets={[dataset]} groups={${JSON.stringify(groups)}} refreshRevision={0} onDatasetsChanged={()=>{}}/>;
      const Component=module==='exploration'?ExplorationPage:KnowledgePage;return <Component dataset={dataset} refreshRevision={0}/>;}
    createRoot(document.getElementById('root')).render(<WorkbenchProviders workspace={workspace}><Page/></WorkbenchProviders>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const handler=createIadHttpHandler(bridge);
  server=http.createServer((req,res)=>{
    if(req.url==='/page.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(req.url.startsWith('/page?')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/page.js"></script>');}
    else void handler(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1440,height:1080});
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000).catch(async error=>{
    await fs.writeFile('/tmp/agent-prompt-editors-failure.png',await driver.takeScreenshot(),'base64');
    throw new Error(css+': '+(await driver.findElement(By.css('body')).getText()).slice(-4000),{cause:error});
  });
  const click=async css=>{const target=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();};
  for(const module of ['exploration','knowledge','consistency','audit']){
    await driver.get(`http://127.0.0.1:${server.address().port}/page?module=${module}`);
    await click({exploration:'#exp-new',knowledge:'#create-btn',consistency:'button[data-dc="start-check"]',audit:'button[title="新建审计"]'}[module]);
    const system=await element('textarea[aria-label="系统提示词"]'),user=await element('textarea[aria-label="用户提示词"]');
    const dimensions=await driver.executeScript('return [...document.querySelectorAll("textarea[aria-label$=提示词],#dc-identity-gate_examples")].map(input=>({label:input.getAttribute("aria-label"),height:input.getBoundingClientRect().height,resize:getComputedStyle(input).resize}))');
    assert.ok(dimensions.length>=2);
    for(const dimension of dimensions){assert.equal(dimension.height,400,module+': '+dimension.label);assert.equal(dimension.resize,'none');}
    assert.ok((await system.getAttribute('value')).trim());assert.ok((await user.getAttribute('value')).trim());
    assert.doesNotMatch(await system.getAttribute('value'),
      /\b(?:analysis_\w+|anchor_\w+|audit_\w+|exploration_commit|knowledge_commit|offset|limit|commit_key|base_revision|round_id)\b|JSON/,
      module+'的系统提示词只定义角色、判断原则和禁止事项，工具协议由注册合同提供');
    assert.equal(await system.isEnabled(),true);assert.equal(await user.isEnabled(),true);
    if(module==='exploration'){
      const start=await driver.findElement(By.xpath('//button[normalize-space(.)="启动联合探索"]'));
      assert.equal(await start.isEnabled(),false);
      assert.ok((await driver.findElement(By.css('body')).getText()).includes('至少选择一张样例图像'));
      assert.equal(accepted.length,0);
      const rejected=await fetch(`http://127.0.0.1:${server.address().port}/api/iad/analysis/start`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:randomUUID(),
          analysis_kind:'exploration',dataset_ids:[data.dataset_id],normal_images:[],defect_images:[],prompt:{text:'观察所选样例。'}})});
      assert.equal(rejected.status,422,await rejected.clone().text());
      assert.deepEqual((await bridge.execute('analysis_list',{dataset_id:data.dataset_id,analysis_kind:'exploration'})).jobs,[]);
      assert.equal(accepted.length,0);
    }
    const systemText=`${module}系统规则：使用实际工具提交观察。`,userText=`${module}用户要求：比较边缘。`;
    for(const [input,text] of [[system,systemText],[user,userText]]){
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',input);
      await input.click();await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await input.sendKeys(text,Key.TAB);
    }
    if(module==='exploration'){
      await click('button[aria-label="继续添加良品图像"]');await click('.iad-thumbnail-option input');
      await(await driver.findElement(By.xpath('//button[normalize-space(.)="完成选择"]'))).click();
    } else if(module==='knowledge')await click('#general-directions input[type="checkbox"]');
    else if(module==='audit')await click(`input[aria-label="选择一致性作业 ${data.consistency_job_id}"]`);
    assert.equal(await system.getAttribute('value'),systemText);assert.equal(await user.getAttribute('value'),userText);
    const submit={exploration:'button[data-action="start-exploration"]',knowledge:'#submit-job',consistency:'button[data-dc="create-job"]',audit:'#audit-create-submit'}[module];
    const button=module==='exploration'?await driver.findElement(By.xpath('//button[normalize-space(.)="启动联合探索"]')):await element(submit);
    await driver.wait(until.elementIsEnabled(button),10000).catch(async error=>{
      await fs.writeFile('/tmp/agent-prompt-editors-failure.png',await driver.takeScreenshot(),'base64');
      throw new Error(module+': '+(await driver.findElement(By.css('body')).getText()).slice(-4000),{cause:error});
    });
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',button);
    await fs.writeFile(path.join('/tmp',module+'-separate-prompts.png'),await driver.takeScreenshot(),'base64');
    await button.click();await driver.wait(()=>accepted.some(item=>item.module===module),10000);
    const {job,request}=accepted.find(item=>item.module===module);
    const snapshot=await bridge.execute(module==='consistency'?'consistency_agent_snapshot':module==='audit'?'audit_agent_snapshot':'analysis_agent_snapshot',{run_id:job.run_id});
    assert.equal(request.system_prompt,systemText);assert.equal(snapshot.system_prompt,systemText);assert.equal(snapshot.instruction,userText);
    t.diagnostic(module+'：两个编辑值已由真实作业快照保存');
  }
});
