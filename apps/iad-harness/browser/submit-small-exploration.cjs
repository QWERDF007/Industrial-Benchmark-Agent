const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {createHash}=require('node:crypto');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');
(async()=>{
 const taskFile=process.argv.find(value=>value.startsWith('--task-file='))?.slice(12);
 assert.ok(taskFile,'通过 --task-file 指定本次探索目标');const tasks=JSON.parse(await fs.readFile(taskFile,'utf8'));
 const reference='runs/verification/v58-two-small/reference.json', output='runs/browser/user-submitted-exploration';await fs.mkdir(output,{recursive:true});
 const retryFailed=process.argv.includes('--retry-failed');
 const selectedDataset=process.argv.find(value=>value.startsWith('--dataset='))?.slice(10);
 const replaceIncomplete=process.argv.includes('--replace-incomplete-scope');
 assert.ok(!selectedDataset||['anomaly','labelme'].includes(selectedDataset));
 assert.ok(!replaceIncomplete||selectedDataset,'补齐范围须明确指定数据集');
 const state=JSON.parse(await fs.readFile(reference,'utf8'));
 const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
 const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
 const read=async route=>{const response=await fetch('http://127.0.0.1:8000/api/iad/'+route);assert.equal(response.status,200);return response.json();};
 const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
 const click=async node=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
 const textButton=async text=>driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),15000);
 try{
  await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');await click(await element('button[aria-label="方向探索"]'));
  for(const key of ['anomaly','labelme']){
   if(selectedDataset&&selectedDataset!==key)continue;
   const target=state.datasets[key];
   let saved=target.ui_submissions?.exploration;
   const status=saved?await read('analysis/status/'+saved.run_id):null;
   const replaced=replaceIncomplete?saved:null;
   if(replaceIncomplete){
    assert.ok(saved&&status.total_samples<100&&!['PENDING','RUNNING'].includes(status.status),'仅替换已停止且范围不足的历史验证');
    saved=null;
   }
   if(saved && (!retryFailed || !['FAILED','PARTIAL','INTERRUPTED'].includes(status.status))){console.log('保留已有探索',key,saved.run_id,status.status);continue;}
   const catalog=await read('datasets'),source=catalog.datasets.find(item=>item.dataset_id===target.dataset_id);assert.equal(source.total_samples,100);
   const previous=(await read('analysis/jobs?'+new URLSearchParams({dataset_id:target.dataset_id,analysis_kind:'exploration'}))).jobs;
   if(!saved&&!replaced)assert.equal(previous.length,0,'未登记的真实作业必须先核对，不能重复创建');
   if(replaced)assert.ok(previous.some(job=>job.run_id===replaced.run_id),'保留真实旧范围记录');
   await click(await element(`#exp-parent option[value="${source.group_id}"]`));
   await click(await element('#exp-child-toggle'));
   for(const input of await driver.findElements(By.css('#exp-child-menu input[type=checkbox]'))){const selected=await input.getAttribute('value')===target.dataset_id;if(await input.isSelected()!==selected)await click(input);}
   await click(await element('#exp-child-toggle'));
   if(saved){
    assert.equal(status.total_samples,100,'不重试已确认范围不足的作业');
    await click(await element(`.exp-job-table tr[data-id="${status.run_id}"] .iad-job-status-button`));
    await click(await driver.wait(until.elementLocated(By.xpath('//dialog//button[normalize-space(.)="按原图组重试"]')),15000));
    let next;await driver.wait(async()=>{next=await read('analysis/status/'+saved.run_id);return next.run_id!==status.run_id;},30000);
    assert.ok(next.completed>=status.completed);
    const current=JSON.parse(await fs.readFile(reference,'utf8')),record=current.datasets[key].ui_submissions.exploration;
    record.retry_runs||=[];record.retry_runs.push(next.run_id);await fs.writeFile(reference,JSON.stringify(current,null,2));
    console.log('原范围界面重试',key,next.run_id,'保留已完成',status.completed);continue;
   }
   await click(await textButton('新建探索'));await element('#exp-prompt');
   assert.equal((await driver.findElements(By.css('.exp-preview:not(.add-tile)'))).length,0,'新建探索没有预选样例');
   const selections={};
   for(const [kind,label] of [['normal','良品'],['defect','异常']]){
    await click(await driver.wait(until.elementLocated(By.xpath(`//button[@role='tab' and starts-with(normalize-space(.),'${label}样例')]`)),10000));
    await click(await element(`button[aria-label="继续添加${label}图像"]`));
    await driver.wait(async()=>(await driver.findElements(By.css('#exp-modal .iad-thumbnail-option input[type=checkbox]'))).length>=20,20000);
    const inputs=await driver.findElements(By.css('#exp-modal .iad-thumbnail-option input[type=checkbox]'));selections[kind]=[];
    for(const index of [0,2,5,7,11,13,17,19]){await click(inputs[index]);selections[kind].push(await inputs[index].findElement(By.xpath('..')).getText());}
    await click(await textButton('完成选择'));
   }
   const preset=key==='anomaly'?'assembly':'surface';await click(await element(`#exp-preset option[value="${preset}"]`));
   const textarea=await element('#exp-prompt'),original=await textarea.getAttribute('value');assert.ok(original.includes('{{response_schema}}'));
   const prompt=tasks[key].trim()+'\n\n'+original;await click(textarea);await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await textarea.sendKeys(prompt,Key.TAB);
   const prepared={dataset_id:target.dataset_id,task:tasks[key],preset,selections,prompt};
   await fs.writeFile(`${output}/${key}-prepared.json`,JSON.stringify(prepared,null,2));await fs.writeFile(`${output}/${key}-prepared.png`,await driver.takeScreenshot(),'base64');
   await click(await textButton('启动联合探索'));
   let job;await driver.wait(async()=>{const list=await read('analysis/jobs?'+new URLSearchParams({dataset_id:target.dataset_id,analysis_kind:'exploration'}));job=list.jobs[0];return !!job&&job.run_id!==replaced?.run_id;},30000);
   const frozen=await read('analysis/node/'+job.run_id);assert.equal(frozen.total_samples,100);assert.deepEqual(frozen.dataset_ids,[target.dataset_id]);
   assert.equal(frozen.request.submission.prompt.text,prompt);assert.equal(frozen.request.submission.normal_images.length,8);assert.equal(frozen.request.submission.defect_images.length,8);
   const proof={run_id:job.run_id,dataset_id:target.dataset_id,total_samples:100,submission:'browser',preset,
    initial_priority:{normal:8,defect:8},prompt_sha256:createHash('sha256').update(prompt).digest('hex')};
   const current=JSON.parse(await fs.readFile(reference,'utf8')),record=current.datasets[key];record.ui_submissions||={};record.stages||={};
   if(replaced){record.ui_submission_attempts||=[];record.ui_submission_attempts.push({stage:'exploration',submission:replaced,validation:'INCOMPLETE_SCOPE',actual_total_samples:status.total_samples});}
   record.ui_submissions.exploration=proof;record.stages.exploration={run_id:job.run_id};await fs.writeFile(reference,JSON.stringify(current,null,2));
   await fs.writeFile(`${output}/${key}.json`,JSON.stringify(proof,null,2));console.log('界面提交完整100张探索',key,job.run_id);
   assert.equal(await(await element('#exp-parent')).isEnabled(),true,'后台作业运行期间仍可切换查看其他数据集');
  }
 }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}
 finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
