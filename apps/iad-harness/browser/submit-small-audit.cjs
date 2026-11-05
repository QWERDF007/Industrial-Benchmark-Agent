const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {createHash}=require('node:crypto');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const inputPath=process.argv.find(arg=>arg.startsWith('--task-file='))?.slice('--task-file='.length);
  assert.ok(inputPath,'必须通过 --task-file 指定本次审计要求');
  const tasks=JSON.parse(await fs.readFile(inputPath,'utf8'));
  const prepareOnly=process.argv.includes('--prepare-only');
  const cancelCurrent=process.argv.includes('--cancel-current');
  const selectedDataset=process.argv.find(arg=>arg.startsWith('--dataset='))?.slice('--dataset='.length);
  assert.ok(!selectedDataset||['anomaly','labelme'].includes(selectedDataset),'子集参数应为 anomaly 或 labelme');
  const reference='runs/verification/v58-two-small/reference.json';
  const state=JSON.parse(await fs.readFile(reference,'utf8'));
  const output='runs/browser/user-submitted-audit';await fs.mkdir(output,{recursive:true});
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
  const click=async node=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
  const read=async route=>{const response=await fetch('http://127.0.0.1:8000/api/iad/'+route);assert.equal(response.status,200);return response.json();};
  try{
    await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');
    await click(await element('button[aria-label="模型审计"]'));
    const catalog=await read('datasets');
    for(const key of ['anomaly','labelme']){
      if(selectedDataset&&selectedDataset!==key)continue;
      const dataset=state.datasets[key],source=catalog.datasets.find(item=>item.dataset_id===dataset.dataset_id);
      assert.equal(source.total_samples,100);assert.ok(tasks[key]?.trim());
      const saved=dataset.ui_submissions?.audit;
      if(cancelCurrent){
        if(!saved)continue;
        await click(await element(`#audit-dataset option[value="${source.group_id}"]`));
        await click(await element('#audit-child-trigger'));
        for(const checkbox of await driver.findElements(By.css('#audit-child-menu input[type=checkbox]'))){
          const chosen=(await checkbox.getAttribute('value'))===dataset.dataset_id;
          if(await checkbox.isSelected()!==chosen)await click(checkbox);
        }
        await click(await element('#audit-child-trigger'));
        const current=await read('audit/status/'+saved.run_id);
        if(['PENDING','RUNNING'].includes(current.status)){
          await click(await element(`button[aria-label="查看作业 ${saved.run_id}"]`));
          await click(await driver.wait(until.elementLocated(By.xpath('//dialog//button[normalize-space(.)="取消审计"]')),15000));
          await driver.wait(async()=>(await read('audit/status/'+saved.run_id)).cancel_requested,10000);
          await click(await element('button[aria-label="关闭作业状态"]'));
        }
        console.log('已从界面停止旧小集审计',key,saved.run_id);continue;
      }
      if(saved&&!prepareOnly){
        const job=await read('audit/status/'+saved.run_id);assert.equal(job.total_samples,100);
        console.log('保留已通过界面提交的审计',key,saved.run_id,job.status);continue;
      }
      const versions=await read('knowledge/versions?dataset_id='+dataset.dataset_id);
      if(!prepareOnly){
          const proof=dataset.ui_submissions?.knowledge;assert.ok(proof,'先通过界面完成统一知识挖掘');
          const job=await read('analysis/status/'+proof.run_id);
          assert.equal(job.status,'COMPLETED');assert.equal(job.completed,100);
          assert.equal(versions.current_version_id,job.knowledge_version_id,'审计应冻结当前验证流程的完整知识');
      }
      await click(await element(`#audit-dataset option[value="${source.group_id}"]`));
      await click(await element('#audit-child-trigger'));
      for(const checkbox of await driver.findElements(By.css('#audit-child-menu input[type=checkbox]'))){
        const chosen=(await checkbox.getAttribute('value'))===dataset.dataset_id;
        if(await checkbox.isSelected()!==chosen)await click(checkbox);assert.equal(await checkbox.isSelected(),chosen);
      }
      await click(await element('#audit-child-trigger'));
      await click(await element('button[title="新建审计"]'));
      await click(await element('#audit-create-mode option[value="combined"]'));
      const textarea=await element('#audit-create-prompt'),original=await textarea.getAttribute('value');
      assert.ok(original.length>100,'应完整显示模型审计提示词');
      const prompt=(tasks[key].trim()+'\n\n'+original).trim();await click(textarea);
      await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();
      await textarea.sendKeys(prompt,Key.TAB);assert.equal(await textarea.getAttribute('value'),prompt);
      await driver.wait(async()=>/1 个子数据集，100 张图像/.test(await(await element('#audit-create-summary')).getText()),20000);
      await click(await element('.audit-create-versions summary'));
      assert.ok((await(await element('.audit-create-versions')).getText()).includes(versions.current_version_id));
      await fs.writeFile(`${output}/${key}-selected.png`,await driver.takeScreenshot(),'base64');
      if(prepareOnly){await click(await element('#audit-create-cancel'));continue;}
      await fs.writeFile(`${output}/${key}-prepared.json`,JSON.stringify({dataset_id:dataset.dataset_id,
        knowledge_version_id:versions.current_version_id,instruction:prompt,consistency_mode:'combined'},null,2));
      const before=new Set((await read('audit/jobs?dataset_id='+dataset.dataset_id)).jobs.map(job=>job.run_id));
      const start=await element('#audit-create-submit');await driver.wait(until.elementIsEnabled(start),20000);await click(start);
      await driver.wait(()=>driver.executeScript(()=>!document.querySelector('#audit-create-submit')),30000);
      let job;
      await driver.wait(async()=>{job=(await read('audit/jobs?dataset_id='+dataset.dataset_id)).jobs.find(item=>!before.has(item.run_id));return !!job;},30000);
      const proof={run_id:job.run_id,dataset_id:dataset.dataset_id,total_samples:job.total_samples,submission:'browser',
        task:tasks[key],prompt_sha256:createHash('sha256').update(prompt).digest('hex')};
      const current=JSON.parse(await fs.readFile(reference,'utf8')),target=current.datasets[key];
      target.ui_submissions||={};target.ui_submissions.audit=proof;target.stages.audit={run_id:job.run_id};
      await fs.writeFile(reference,JSON.stringify(current,null,2));await fs.writeFile(`${output}/${key}.json`,JSON.stringify(proof,null,2));
      const raw=await read('analysis/node/'+job.run_id);
      assert.equal(job.total_samples,100);assert.equal(job.dataset_id,dataset.dataset_id);
      assert.equal(raw.request.instruction,prompt);assert.equal(raw.request.consistency_mode,'combined');
      assert.equal(raw.knowledge_version_id,versions.current_version_id);
      console.log('已通过界面选择范围、编辑提示词并提交审计',key,job.run_id,100);
    }
    console.log(prepareOnly?'AUDIT_SELECTION_PREPARED':'USER_SUBMITTED_AUDIT_SCOPE_KNOWLEDGE_AND_PROMPT_VERIFIED');
  }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
