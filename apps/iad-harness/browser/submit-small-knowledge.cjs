const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {createHash}=require('node:crypto');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');
(async()=>{
  assert.ok(!process.argv.some(arg=>arg.startsWith('--kind=')),'统一知识挖掘不接受类型参数');
  const stage='knowledge';
  const prepareOnly=process.argv.includes('--prepare-only');
  const cancelCurrent=process.argv.includes('--cancel-current');
  const cancelReason=process.argv.find(arg=>arg.startsWith('--reason='))?.slice('--reason='.length);
  assert.ok(!cancelCurrent||cancelReason,'取消验证作业时必须通过 --reason 说明原因');
  const retryFailed=process.argv.includes('--retry-failed');
  const datasetKey=process.argv.find(arg=>arg.startsWith('--dataset='))?.slice('--dataset='.length);
  const selectionPath=process.argv.find(arg=>arg.startsWith('--selection='))?.slice('--selection='.length);
  assert.ok(cancelCurrent||selectionPath,'必须通过 --selection=文件 指定本次人工选择的方向');
  const selection=selectionPath?JSON.parse(await fs.readFile(selectionPath,'utf8')):null;
  const reference='runs/verification/v58-two-small/reference.json';
  const output='runs/browser/user-submitted-knowledge';await fs.mkdir(output,{recursive:true});
  const state=JSON.parse(await fs.readFile(reference,'utf8'));
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
  const read=async route=>{const response=await fetch('http://127.0.0.1:8000/api/iad/'+route);assert.equal(response.status,200);return response.json();};
  const click=async node=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
  const select=async(selector,value)=>{
    await element(selector);await click(await element(`${selector} option[value="${value}"]`));
    await driver.wait(async()=>(await(await element(selector)).getAttribute('value'))===value,10000);
  };
  try{
    await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');
    await click(await element('button[aria-label="知识挖掘"]'));
    const catalog=await read('datasets');
    for(const key of ['anomaly','labelme']){
      if(datasetKey&&datasetKey!==key)continue;
      const dataset=state.datasets[key], saved=dataset.ui_submissions?.[stage];
      if(cancelCurrent){
        assert.ok(saved,'没有当前界面提交记录');
        const source=catalog.datasets.find(item=>item.dataset_id===dataset.dataset_id);
        await select('#dataset',source.group_id);await select('#subset',dataset.dataset_id);
        const current=await read('analysis/status/'+saved.run_id);
        if(['PENDING','RUNNING'].includes(current.status)){
          await click(await element(`button[aria-label="查看作业 ${saved.run_id}"]`));
          await click(await driver.wait(until.elementLocated(By.xpath('//dialog//button[normalize-space()="取消挖掘"]')),15000));
          await driver.wait(async()=>(await read('analysis/node/'+saved.run_id)).cancel_requested,10000);
          await click(await element('button[aria-label="关闭作业状态"]'));
        }
        const fresh=JSON.parse(await fs.readFile(reference,'utf8')),target=fresh.datasets[key];
        target.ui_submission_attempts||=[];target.ui_submission_attempts.push({...saved,reason:cancelReason});
        delete target.ui_submissions[stage];delete target.stages[stage];await fs.writeFile(reference,JSON.stringify(fresh,null,2));
        console.log('已通过界面停止待修正的验证作业',key,saved.run_id);continue;
      }
      if(saved&&!prepareOnly){
        const job=await read('analysis/status/'+saved.run_id);assert.equal(job.total_samples,100);
        if(retryFailed&&['FAILED','PARTIAL','INTERRUPTED'].includes(job.status)){
          const source=catalog.datasets.find(item=>item.dataset_id===dataset.dataset_id);
          await select('#dataset',source.group_id);await select('#subset',dataset.dataset_id);
          await click(await element(`button[aria-label="查看作业 ${job.run_id}"]`));
          await click(await driver.wait(until.elementLocated(By.xpath('//dialog//button[normalize-space()="按原图组重试"]')),15000));
          let fresh;
          await driver.wait(async()=>{fresh=await read('analysis/status/'+saved.run_id);return ['RUNNING','PENDING','COMPLETED'].includes(fresh.status);},30000);
          assert.ok(fresh.completed>=job.completed,'重试应保留已完成图像');
          const attempt=fresh.run_id;
          assert.ok(attempt&&attempt!==job.run_id,'实际状态应返回新重试句柄');
          const current=JSON.parse(await fs.readFile(reference,'utf8')),proof=current.datasets[key].ui_submissions[stage];
          proof.retry_runs||=[];if(!proof.retry_runs.includes(attempt))proof.retry_runs.push(attempt);
          await fs.writeFile(reference,JSON.stringify(current,null,2));
          console.log('已通过界面重试原作业剩余范围',key,stage,attempt,'保留已完成',job.completed);
        }else console.log('保留已通过界面提交的作业',key,stage,job.run_id);
        continue;
      }
      const source=catalog.datasets.find(item=>item.dataset_id===dataset.dataset_id);assert.equal(source.total_samples,100);
      await select('#dataset',source.group_id);await select('#subset',dataset.dataset_id);
      await click(await element('#create-btn'));await element('#submit-job');
      assert.equal((await driver.findElements(By.css('input[name="sample-kind"]'))).length,0);
      await driver.wait(async()=>(await driver.findElements(By.css('#general-directions input[type=checkbox]'))).length===15,20000);
      await click(await element('#kb-setup-child-trigger'));
      const children=await driver.findElements(By.css('#kb-setup-child-menu input[type=checkbox]'));
      for(const child of children){const selected=(await child.getAttribute('value'))===dataset.dataset_id;if(await child.isSelected()!==selected)await click(child);}
      await click(await element('#kb-setup-child-trigger'));
      const selected=[];
      const desired=new Set(selection[key]);assert.ok(desired.size,'本次选择的方向不能为空');
      for(const [tab,body] of [['#kb-tab-preset','#general-directions'],['#kb-tab-explore','#explored-directions']]){
        await click(await element(tab));
        const boxes=await driver.findElements(By.css(body+' input[type=checkbox]'));assert.ok(boxes.length);
        let chosenCount=0;
        for(const box of boxes){const chosen=desired.has(await box.getAttribute('data-dir-id'));
          if(await box.isSelected()!==chosen)await click(box);assert.equal(await box.isSelected(),chosen);
          if(!chosen)continue;chosenCount++;
          selected.push({id:await box.getAttribute('data-dir-id'),name:(await box.getAttribute('aria-label')).replace(/^选择/,''),kind:await box.getAttribute('data-dir-kind')});}
        assert.ok(chosenCount>0&&chosenCount<boxes.length,'验证应明确选择一部分预设方向和一部分探索方向');
      }
      assert.deepEqual(selected.map(item=>item.id).sort(),[...desired].sort());
      await click(await element('#compose-prompt'));
      const confirmation=await driver.findElements(By.css('#confirm-accept'));
      if(confirmation.length){
        await driver.wait(until.elementIsVisible(confirmation[0]),5000);await click(confirmation[0]);
        await driver.wait(until.stalenessOf(confirmation[0]),5000);
        await driver.wait(()=>driver.executeScript(()=>document.activeElement?.id==='compose-prompt'),5000);
      }
      const batch=await element('input[aria-label="每批挖掘图像数"]');await click(batch);
      assert.ok(await driver.executeScript('return document.activeElement===arguments[0]',batch),'键盘输入前批量控件应获得焦点');
      await driver.actions().sendKeys(Key.chord(Key.CONTROL,'a'),'20',Key.TAB).perform();
      assert.equal(Number(await batch.getAttribute('value')),20,'实际输入的批图像数应为20');
      const prompt=await(await element('#prompt-text')).getAttribute('value');
      assert.ok(!prompt.includes('必须覆盖')&&!prompt.includes('逐项记录全部已选'),'完整提示词不应强制覆盖全部方向');
      const exploration=await read('exploration?'+new URLSearchParams({dataset_id:dataset.dataset_id}));
      assert.ok(prompt.includes(exploration.exploration.summary),'界面完整提示词应带探索结论');
      for(const direction of selected){assert.ok(prompt.includes(direction.name));assert.ok(prompt.includes(direction.id+' | '),'完整提示词应展示方向ID与名称的对应关系：'+direction.name);}
      assert.match(await(await element('#kb-run-summary')).getText(),new RegExp('挖掘方向 '+selected.length+' 项'));
      await driver.executeScript('document.querySelector("#kb-confirm-title").scrollIntoView({block:"center"})');
      await fs.writeFile(`${output}/${key}-${stage}-selected.png`,await driver.takeScreenshot(),'base64');
      await fs.writeFile(`${output}/${key}-${stage}-prepared.json`,JSON.stringify({dataset_id:dataset.dataset_id,
        selected,batch_size:20,instruction:prompt,prompt_sha256:createHash('sha256').update(prompt).digest('hex')},null,2));
      if(prepareOnly){await click(await element('#kb-setup-back'));continue;}
      const previous=new Set((await read('analysis/jobs?'+new URLSearchParams({dataset_id:dataset.dataset_id,analysis_kind:'knowledge'}))).jobs.map(job=>job.run_id));
      const start=await element('#submit-job');await driver.wait(until.elementIsEnabled(start),15000);await click(start);
      await driver.wait(async()=>driver.executeScript(()=>!document.querySelector('#submit-job')),30000);
      const runId=await driver.executeScript(()=>JSON.parse(new URL(location.href).searchParams.get('iad')).job);
      assert.ok(runId&&!previous.has(runId),'点击开始挖掘应创建新的公开范围作业');
      const job=await read('analysis/node/'+runId);assert.deepEqual(job.dataset_ids,[dataset.dataset_id]);assert.equal(job.total_samples,100);
      assert.ok(!('kind' in job.request.submission));
      const frozen=job.request.units[0].request.mining_prompt;
      assert.equal(frozen.instruction,prompt,'实际冻结提示词必须与界面所见全文相同');
      assert.deepEqual(frozen.configuration.directions.filter(item=>item.enabled).map(item=>item.direction_id).sort(),selected.map(item=>item.id).sort());
      assert.equal(job.request.submission.batch_size,20);
      const proof={run_id:runId,dataset_id:dataset.dataset_id,selected,batch_size:job.request.submission.batch_size,total_samples:100,
        prompt_sha256:createHash('sha256').update(prompt).digest('hex'),submission:'browser'};
      await fs.writeFile(`${output}/${key}-${stage}.json`,JSON.stringify(proof,null,2));
      const current=JSON.parse(await fs.readFile(reference,'utf8')), target=current.datasets[key];
      target.ui_submissions||={};target.ui_submissions[stage]=proof;
      target.stages[stage]={run_id:runId};await fs.writeFile(reference,JSON.stringify(current,null,2));
      console.log('已通过界面明确选择并提交',key,stage,runId,selected.length+'个方向',100+'张');
    }
    console.log(cancelCurrent?'USER_CANCELLED_KNOWLEDGE_SCOPE_VERIFIED':prepareOnly?'EXPLICIT_KNOWLEDGE_SELECTION_PREPARED':'USER_SUBMITTED_KNOWLEDGE_SCOPE_AND_PROMPT_VERIFIED');
  }catch(error){console.error(await driver.executeScript(()=>[...document.querySelectorAll('dialog')].map(d=>({open:d.open,modal:d.matches(':modal'),label:d.getAttribute('aria-label'),display:getComputedStyle(d).display,visibility:getComputedStyle(d).visibility,rect:d.getBoundingClientRect().toJSON(),html:d.outerHTML.slice(0,240),rules:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].filter(rule=>rule.selectorText&&rule.style.display&&d.matches(rule.selectorText)).map(rule=>rule.cssText.slice(0,400))}catch{return []}})}))));await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
