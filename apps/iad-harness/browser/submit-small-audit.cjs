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
  const retryStopped=process.argv.includes('--retry-stopped');
  const selectedDataset=process.argv.find(arg=>arg.startsWith('--dataset='))?.slice('--dataset='.length);
  assert.ok(!selectedDataset||['anomaly','labelme'].includes(selectedDataset),'子集参数应为 anomaly 或 labelme');
  const replaceInvalidCorpus=process.argv.includes('--replace-invalid-corpus');
  const replaceInvalidTarget=process.argv.includes('--replace-invalid-target');
  assert.ok(!(replaceInvalidCorpus&&replaceInvalidTarget),'每次只纠正一个已核实的问题');
  assert.ok(!(replaceInvalidCorpus||replaceInvalidTarget)||selectedDataset,'替换无效验证须明确指定子集');
  assert.ok(!retryStopped||selectedDataset&&!replaceInvalidCorpus&&!replaceInvalidTarget&&!cancelCurrent,'恢复作业须单独指定子集');
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
      let saved=dataset.ui_submissions?.audit;
      let replaced=null;
      if(replaceInvalidCorpus||replaceInvalidTarget){
        assert.ok(saved,'先核对原作业');
        const old=await read('audit/status/'+saved.run_id),raw=await read('analysis/node/'+saved.run_id);
        const corpus=raw.request.consistency_scopes.corpus;
        assert.ok(!['PENDING','RUNNING'].includes(old.status),'先保留并停止范围错误的执行');
        if(replaceInvalidCorpus)assert.ok(corpus.dataset_ids.length!==1||corpus.dataset_ids[0]!==dataset.dataset_id,'不得重复替换范围正确的作业');
        else {
          const {promptDefaults}=await import('../lib/shared/prompt-defaults.generated.js');
          assert.ok(!raw.request.instruction.includes('audit_target')&&promptDefaults.audit.includes('audit_target'),
            '只替换尚未明确单图目标的旧提示词验证');
        }
        replaced={stage:'audit',submission:saved,validation:replaceInvalidCorpus?'INVALID_CORPUS_SCOPE':'INVALID_AUDIT_TARGET_SCOPE',
          generation_signature:raw.request.generation_signature,corpus:corpus.dataset_ids,corpus_sample_count:corpus.sample_count};
        saved=null;
      }
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
        const job=await read('audit/status/'+saved.run_id);assert.equal(job.total_samples,saved.remaining_samples??100);
        if(retryStopped){
          assert.ok(['FAILED','PARTIAL','INTERRUPTED','CANCELLED'].includes(job.status),'只恢复已停止的执行');
          await click(await element(`#audit-dataset option[value="${source.group_id}"]`));
          await click(await element('#audit-child-trigger'));
          for(const checkbox of await driver.findElements(By.css('#audit-child-menu input[type=checkbox]'))){
            const chosen=(await checkbox.getAttribute('value'))===dataset.dataset_id;
            if(await checkbox.isSelected()!==chosen)await click(checkbox);
          }
          await click(await element('#audit-child-trigger'));
          const raw=await read('analysis/node/'+saved.run_id),options=await read('audit/retry/'+saved.run_id);
          assert.ok(options.samples.length&&!options.active_run_id,'原作业应有可恢复范围');
          const before=new Set((await read('audit/jobs?dataset_id='+dataset.dataset_id)).jobs.map(item=>item.run_id));
          await click(await element(`button[aria-label="查看作业 ${saved.run_id}"]`));
          const drawer=await element('dialog[aria-label="作业状态"][open]');
          await click(await drawer.findElement(By.xpath('.//button[normalize-space(.)="选择重试范围"]')));
          const all=await driver.wait(until.elementLocated(By.xpath('//dialog//button[normalize-space(.)="全选"]')),15000);
          await click(all);
          const boxes=await drawer.findElements(By.css('.iad-retry-samples input[type=checkbox]'));
          assert.equal(boxes.length,options.samples.length);assert.ok((await Promise.all(boxes.map(box=>box.isSelected()))).every(Boolean));
          const submit=await drawer.findElement(By.xpath('.//button[starts-with(normalize-space(.),"重试所选 ")]'));
          await driver.wait(until.elementIsEnabled(submit),10000);await click(submit);
          let next;
          await driver.wait(async()=>{next=(await read('audit/jobs?dataset_id='+dataset.dataset_id)).jobs.find(item=>!before.has(item.run_id));return !!next;},30000);
          assert.equal(next.root_run_id,job.root_run_id);
          const resumed=await read('analysis/node/'+next.run_id);
          assert.deepEqual([...resumed.sample_ids].sort(),options.samples.map(sample=>sample.sample_id).sort());
          for(const field of ['instruction','knowledge_version_id','consistency_scopes'])assert.deepEqual(resumed.request[field],raw.request[field]);
          const current=JSON.parse(await fs.readFile(reference,'utf8')),target=current.datasets[key];
          target.ui_submission_attempts||=[];target.ui_submission_attempts.push({stage:'audit',submission:saved,validation:'RETRIED_ORIGINAL_SCOPE'});
          const proof={...saved,run_id:next.run_id,root_run_id:next.root_run_id,remaining_samples:next.total_samples,
            retry_runs:[...(saved.retry_runs||[]),next.run_id],submission:'browser-original-scope-retry'};
          target.ui_submissions.audit=proof;target.stages.audit={run_id:next.run_id};
          await fs.writeFile(reference,JSON.stringify(current,null,2));await fs.writeFile(`${output}/${key}-resume.json`,JSON.stringify(proof,null,2));
          console.log('已通过界面恢复原审计剩余范围',key,next.run_id,options.samples.length);continue;
        }
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
      if(replaceInvalidTarget)assert.ok(prompt.includes('audit_target')&&prompt.includes('input_scope'));
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
      if(replaced){target.ui_submission_attempts||=[];target.ui_submission_attempts.push(replaced);}
      await fs.writeFile(reference,JSON.stringify(current,null,2));await fs.writeFile(`${output}/${key}.json`,JSON.stringify(proof,null,2));
      const raw=await read('analysis/node/'+job.run_id);
      assert.equal(job.total_samples,100);assert.equal(job.dataset_id,dataset.dataset_id);
      assert.equal(raw.request.instruction,prompt);assert.equal(raw.request.consistency_mode,'combined');
      assert.deepEqual(raw.request.consistency_scopes.corpus.dataset_ids,[dataset.dataset_id]);
      assert.equal(raw.request.consistency_scopes.corpus.sample_count,100,'对照检索不得自动扩大到其他已导入数据');
      assert.equal(raw.knowledge_version_id,versions.current_version_id);
      if(replaceInvalidTarget)assert.notEqual(raw.request.generation_signature,replaced.generation_signature,'新协议必须实际重载，不能仅替换前端文字');
      console.log('已通过界面选择范围、编辑提示词并提交审计',key,job.run_id,100);
    }
    console.log(prepareOnly?'AUDIT_SELECTION_PREPARED':'USER_SUBMITTED_AUDIT_SCOPE_KNOWLEDGE_AND_PROMPT_VERIFIED');
  }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
