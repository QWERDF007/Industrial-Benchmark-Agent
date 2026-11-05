const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');
(async()=>{
 const manifestPath='runs/verification/consistency-pairs/selection.json';
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 const refPath='runs/verification/v58-two-small/reference.json';
 const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
 const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
 const read=async route=>{const res=await fetch('http://127.0.0.1:8000/api/iad/'+route);assert.equal(res.status,200);return res.json();};
 const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
 const click=async el=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',el);await el.click();};
 const input=async(selector,value)=>{const el=await element(selector);await el.clear();await el.sendKeys(value,Key.TAB);assert.equal(await el.getAttribute('value'),value);};
 try{
  await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');
  await click(await element('button[aria-label="数据集管理"]'));
  for(const key of ['labelme','anomaly']){
   const state=JSON.parse(await fs.readFile(refPath,'utf8')),old=state.datasets[key],chosen=manifest[key];
   const root=chosen.root+(key==='labelme'?'/images':'');
   let target=(await read('datasets')).datasets.find(d=>d.image_dir===root);
   if(!target){
    for(const close of await driver.findElements(By.css('button[aria-label="关闭详情抽屉"]')))if(await close.isDisplayed())await click(close);
    await click(await element(`[data-add-parent="${old.group_id}"]`));
    await input('#new-name',key==='labelme'?'Test 100图（同像素与相似图，50无标注／50有标注）':'异常检测100图（同像素与相似图，50 OK／50 NG）');
    if(key==='anomaly')await click(await element('input[name="new-format"][value="异常检测目录"]'));
    await input('#new-path',root);
    if(key==='labelme')await input('#new-label-path',chosen.root+'/labels');
    const submit=await element('.modal form button[type="submit"]');await driver.wait(until.elementIsEnabled(submit),20000);await click(submit);
    await driver.wait(async()=>{target=(await read('datasets')).datasets.find(d=>d.image_dir===root);return !!target;},30000);
    await driver.wait(async()=>(await driver.findElements(By.id('new-name'))).length===0,20000);
   }
   assert.equal(target.total_samples,100);assert.equal(target.group_id,old.group_id);
   if(key==='anomaly'){
    for(const close of await driver.findElements(By.css('button[aria-label="关闭详情抽屉"]')))if(await close.isDisplayed())await click(close);
    await click(await element(`.data-row[data-id="${target.dataset_id}"] .name-text`));
    await driver.wait(async()=>(await driver.findElements(By.css('.dataset-drawer .mapping-row select'))).length===4,15000);
    for(const directory of ['公头OK','母头OK','公头NG','母头NG']){
     const selector=`.dataset-drawer select[aria-label="目录 ${directory} 角色"]`,role=directory.endsWith('OK')?'normal':'anomaly';
     await click(await (await element(selector)).findElement(By.css(`option[value="${role}"]`)));
     await driver.wait(async()=>(await(await element(selector)).getAttribute('value'))===role,15000);
    }
    const save=await driver.wait(until.elementLocated(By.xpath('//aside//button[normalize-space(.)="保存映射并重新扫描"]')),15000);
    await driver.wait(until.elementIsEnabled(save),15000);await click(save);
    await driver.wait(async()=>{const value=await read('datasets/'+target.dataset_id);return value.folder_rules?.every(rule=>rule.role===(rule.path.endsWith('OK')?'normal':'anomaly'));},30000);
   }
   if(old.dataset_id!==target.dataset_id){
    state.scope_history||=[];state.scope_history.push({kind:key,...old});
    state.datasets[key]={dataset_id:target.dataset_id,group_id:target.group_id,selected:chosen.selected,
     selection_manifest:manifestPath,stages:{},ui_submissions:{}};
    await fs.writeFile(refPath,JSON.stringify(state,null,2));
   }
   chosen.dataset_id=target.dataset_id;await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
   console.log('已通过界面导入同像素与相似验证集',key,target.dataset_id,100);
  }
  await fs.writeFile('runs/verification/consistency-pairs/datasets.png',await driver.takeScreenshot(),'base64');
 }catch(error){console.error(await driver.executeScript('return document.querySelector(".modal")?.innerText'));
  await fs.writeFile('runs/verification/consistency-pairs/import-failure.png',await driver.takeScreenshot(),'base64');throw error;
 }finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
