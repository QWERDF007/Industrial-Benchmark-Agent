const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {createHash}=require('node:crypto');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const inputPath=process.argv.find(arg=>arg.startsWith('--task-file='))?.slice('--task-file='.length);
  assert.ok(inputPath,'必须通过 --task-file 指定本次检查要求');
  const tasks=JSON.parse(await fs.readFile(inputPath,'utf8'));
  const prepareOnly=process.argv.includes('--prepare-only');
  const verifyOnly=process.argv.includes('--verify-only');
  const retryStopped=process.argv.includes('--retry-stopped');
  assert.ok(!retryStopped||verifyOnly,'原范围恢复须与 --verify-only 一起使用');
  const cleanStopped=process.argv.includes('--clean-stopped');
  assert.ok(!cleanStopped||verifyOnly,'清理已停止记录仅用于 --verify-only');
  assert.ok(!process.argv.includes('--retry-failed'),'不支持 --retry-failed');
  const selectedDataset=process.argv.find(arg=>arg.startsWith('--dataset='))?.slice('--dataset='.length);
  assert.ok(!selectedDataset||['anomaly','labelme'].includes(selectedDataset),'子集参数应为 anomaly 或 labelme');
  const reference='runs/verification/v58-two-small/reference.json';
  const state=JSON.parse(await fs.readFile(reference,'utf8'));
  const output='runs/browser/user-submitted-consistency';await fs.mkdir(output,{recursive:true});
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
  const click=async node=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
  const read=async route=>{const response=await fetch('http://127.0.0.1:8000/api/iad/'+route);assert.equal(response.status,200);return response.json();};
  async function chooseChildren(trigger,menu,id){
    await click(await element(trigger));
    const boxes=await driver.findElements(By.css(menu+' input[type=checkbox]'));
    assert.ok((await Promise.all(boxes.map(box=>box.getAttribute('value')))).includes(id),'目标子数据集必须出现在实际选项中');
    for(const checkbox of boxes){
      const chosen=(await checkbox.getAttribute('value'))===id;
      if(await checkbox.isSelected()!==chosen)await click(checkbox);
      assert.equal(await checkbox.isSelected(),chosen);
    }
    await click(await element(trigger));
  }
  try{
    await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');
    await click(await element('button[aria-label="数据一致性"]'));
    const catalog=await read('datasets');
    for(const key of ['anomaly','labelme']){
      if(selectedDataset&&selectedDataset!==key)continue;
      const dataset=state.datasets[key],source=catalog.datasets.find(item=>item.dataset_id===dataset.dataset_id);
      assert.equal(source.total_samples,100);assert.ok(tasks[key]?.trim());
      const saved=dataset.ui_submissions?.consistency;
      assert.ok(!verifyOnly||saved,'检查界面记录前必须已有提交句柄');
      await driver.wait(async()=>!(await (await element('#dc-child-trigger')).getText()).includes('请选择'),10000);
      await click(await element(`#dc-parent option[value="${source.group_id}"]`));
      await driver.wait(async()=>(await (await element('#dc-parent')).getAttribute('value'))===source.group_id,10000,'数据集选择应提交到实际界面');
      await chooseChildren('#dc-child-trigger','#dc-child-options',dataset.dataset_id);
      assert.equal(await (await element('#dc-parent')).getAttribute('value'),source.group_id,'选择子集后父级范围保持一致');
      if(cleanStopped){
        const identity=entry=>entry.run_id||(typeof entry.submission==='object'?entry.submission.run_id:undefined);
        for(const entry of dataset.ui_submission_attempts?.filter(entry=>entry.stage==='consistency')||[]){
          const oldId=identity(entry);assert.ok(oldId&&oldId!==saved.run_id);
          const previous=await read('analysis/status/'+oldId);
          assert.ok(!['PENDING','RUNNING'].includes(previous.status),'活动作业不能作为旧记录删除');
          if(previous.deleted_at)continue;
          await click(await element(`tr[data-dc-row="${previous.program_batch_id}"] button[data-icon="delete"]`));
          const dialog=await element('dialog[aria-label="删除检查作业"][open]');
          await click(await dialog.findElement(By.css('button[data-variant="danger"]')));
          await driver.wait(()=>driver.executeScript(()=>!document.querySelector('dialog[aria-label="删除检查作业"][open]')),10000);
          await driver.wait(async()=>!(await read('analysis/jobs?'+new URLSearchParams({dataset_id:dataset.dataset_id,analysis_kind:'consistency'})))
            .jobs.some(job=>job.root_run_id===oldId),10000);
          const current=JSON.parse(await fs.readFile(reference,'utf8'));
          current.datasets[key].ui_submission_attempts.find(item=>identity(item)===oldId).deleted_from_workbench=true;
          await fs.writeFile(reference,JSON.stringify(current,null,2));
          console.log('已从界面删除已停止的无效记录',key,oldId);
        }
      }
      if(saved&&!prepareOnly){
        const job=await read('analysis/status/'+saved.run_id);assert.equal(job.total_samples,100);
        const row=await element(`tr[data-dc-row="${job.program_batch_id}"]`);
        await driver.wait(until.elementIsVisible(row),20000);
        assert.ok((await row.getText()).includes(source.name),'界面作业行应显示对应子数据集');
        assert.deepEqual(await Promise.all((await row.findElements(By.css('.dc-operations button'))).map(button=>button.getAttribute('aria-label'))),
          [...(job.status==='COMPLETED'?[]:[`查看作业状态 ${job.run_id}`]),'查看统计结果',`删除检查作业 ${job.program_batch_id}`]);
        if(job.status==='RUNNING'&&job.phase==='ANALYZING_CONFLICT_GROUPS'&&job.total_gallery_groups!=null){
          await click(await row.findElement(By.css('td')));
          await driver.wait(async()=>{
            const match=(await (await element('.dc-running-header')).getText()).match(/正在核对图组 (\d+) \/ (\d+) 组/);
            return match&&Number(match[1])>=job.completed_gallery_groups&&Number(match[2])===job.total_gallery_groups;
          },10000);
          assert.equal(await (await element('.dc-stage.current')).getText(),'对比标注');
        }
        if(verifyOnly){
          const trigger=await row.findElement(By.css('button[data-icon="delete"]'));await click(trigger);
          const dialog=await element('dialog[aria-label="删除检查作业"][open]');
          const geometry=await driver.executeScript(`const dialog=arguments[0],trigger=arguments[1],rect=dialog.getBoundingClientRect();
            const close=dialog.querySelector('button[data-icon="close"]').getBoundingClientRect(),icon=trigger.getBoundingClientRect();
            return {centerX:rect.x+rect.width/2-innerWidth/2,centerY:rect.y+rect.height/2-innerHeight/2,width:rect.width,
              close:[close.width,close.height],deletion:[icon.width,icon.height],bodyPadding:getComputedStyle(dialog.querySelector('.iad-dialog-body')).paddingLeft}`,dialog,trigger);
          assert.ok(Math.abs(geometry.centerX)<=1&&Math.abs(geometry.centerY)<=1,JSON.stringify(geometry));
          assert.equal(geometry.width,530);assert.deepEqual(geometry.close,[38,38]);assert.deepEqual(geometry.deletion,[32,32]);
          assert.equal(geometry.bodyPadding,'24px');
          await fs.writeFile(`${output}/${key}-delete-confirm.png`,await driver.takeScreenshot(),'base64');
          await driver.actions().sendKeys(Key.ESCAPE).perform();
          await driver.wait(()=>driver.executeScript(()=>!document.querySelector('dialog[aria-label="删除检查作业"][open]')),5000);
          assert.equal((await read('analysis/status/'+saved.run_id)).deleted_at,null,'验证确认窗不能删除当前作业');
          const statusTrigger=await row.findElement(By.css('.iad-job-status-button'));
          const selectionBefore=await row.getAttribute('aria-selected');await click(statusTrigger);
          const statusDrawer=await element('dialog[aria-label="作业状态"][open]');
          await driver.wait(async()=> (await statusDrawer.getText()).includes(job.run_id),10000);
          const statusGeometry=await driver.executeScript(`const r=arguments[0].getBoundingClientRect();return {width:r.width,right:r.right,viewport:innerWidth,header:arguments[0].querySelector('.iad-dialog-header').getBoundingClientRect().height}`,statusDrawer);
          assert.equal(statusGeometry.width,560);assert.equal(statusGeometry.right,statusGeometry.viewport);assert.equal(statusGeometry.header,64);
          assert.ok((await statusDrawer.getText()).includes(job.phase),'抽屉展示实际阶段代码');
          await fs.writeFile(`${output}/${key}-status.png`,await driver.takeScreenshot(),'base64');
          if(retryStopped){
            assert.ok(['FAILED','PARTIAL','INTERRUPTED','CANCELLED'].includes(job.status),'仅恢复已停止作业');
            await click(await statusDrawer.findElement(By.xpath('.//button[normalize-space(.)="按原图组重试"]')));
            let next;await driver.wait(async()=>{next=await read('analysis/status/'+saved.run_id);return next.run_id!==job.run_id;},30000);
            assert.equal(next.root_run_id,job.root_run_id);assert.equal(next.total_samples,100);assert.ok(next.completed>=job.completed);
            const current=JSON.parse(await fs.readFile(reference,'utf8')),record=current.datasets[key].ui_submissions.consistency;
            record.retry_runs||=[];record.retry_runs.push(next.run_id);await fs.writeFile(reference,JSON.stringify(current,null,2));
            await fs.writeFile(`${output}/${key}-resume.json`,JSON.stringify({root_run_id:saved.run_id,prior_attempt_id:job.run_id,
              resumed_attempt_id:next.run_id,submission:'browser-original-scope-retry',preserved_completed:job.completed},null,2));
            await driver.actions().sendKeys(Key.ESCAPE).perform();
            console.log('界面恢复原范围一致性',key,next.run_id);continue;
          }
          await driver.actions().sendKeys(Key.ESCAPE).perform();
          await driver.wait(()=>driver.executeScript(()=>!document.querySelector('dialog[aria-label="作业状态"][open]')),5000);
          assert.equal(await row.getAttribute('aria-selected'),selectionBefore,'状态入口不改变选中作业');
          assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',statusTrigger),true);

        }
        await fs.writeFile(`${output}/${key}-job.png`,await driver.takeScreenshot(),'base64');
        console.log('已核对界面一致性作业记录',key,saved.run_id,job.status);continue;
      }
      await click(await element('[data-dc="start-check"]'));
      await chooseChildren('#dc-new-child-trigger','#dc-new-child-options',dataset.dataset_id);
      const textarea=await element('#dc-new-prompt');
      const original=await textarea.getAttribute('value');assert.ok(original.length>100,'显示完整提示词');
      const prompt=(tasks[key].trim()+'\n\n'+original).trim();
      await click(textarea);
      await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();
      await textarea.sendKeys(prompt,Key.TAB);
      assert.equal(await textarea.getAttribute('value'),prompt,'实际用户编辑后的完整提示词');
      await fs.writeFile(`${output}/${key}-selected.png`,await driver.takeScreenshot(),'base64');
      if(prepareOnly){await click(await element('[data-dc="close-new"]'));continue;}
      const before=new Set((await read('analysis/jobs?'+new URLSearchParams({dataset_id:dataset.dataset_id,analysis_kind:'consistency'}))).jobs.map(job=>job.run_id));
      const submit=await element('[data-dc="create-job"]');await driver.wait(until.elementIsEnabled(submit),20000);await click(submit);
      await driver.wait(()=>driver.executeScript(()=>!document.querySelector('#dc-new-mask')),30000);
      let root;
      await driver.wait(async()=>{
        root=(await read('analysis/jobs?'+new URLSearchParams({dataset_id:dataset.dataset_id,analysis_kind:'consistency'}))).jobs.find(job=>!before.has(job.run_id));
        return !!root;
      },30000);
      const job=await read('analysis/node/'+root.run_id);
      assert.deepEqual(job.dataset_ids,[dataset.dataset_id]);assert.equal(job.total_samples,100);
      assert.equal(job.request.submission.instruction,prompt);
      assert.equal(job.request.submission.mode,'combined','本次验证必须执行严格同图和相似检索');
      assert.equal(job.request.units[0].request.instruction,prompt);
      const proof={run_id:job.run_id,dataset_id:dataset.dataset_id,total_samples:100,submission:'browser',
        mode:job.request.submission.mode,candidate_batch_size:job.request.submission.candidate_batch_size,
        task:tasks[key],prompt_sha256:createHash('sha256').update(prompt).digest('hex')};
      await fs.writeFile(`${output}/${key}.json`,JSON.stringify(proof,null,2));
      const current=JSON.parse(await fs.readFile(reference,'utf8')),target=current.datasets[key];
      target.ui_submissions||={};target.ui_submissions.consistency=proof;target.stages.consistency={run_id:job.run_id};
      await fs.writeFile(reference,JSON.stringify(current,null,2));
      console.log('已通过界面选择范围、编辑提示词并提交一致性检查',key,job.run_id,job.total_samples);
    }
    console.log(prepareOnly?'CONSISTENCY_SELECTION_PREPARED':'USER_SUBMITTED_CONSISTENCY_SCOPE_AND_PROMPT_VERIFIED');
  }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
