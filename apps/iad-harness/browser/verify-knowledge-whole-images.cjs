const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');
(async()=>{
  const state=JSON.parse(await fs.readFile('runs/verification/v58-two-small/reference.json','utf8'));
  const datasetId=process.argv.find(arg=>arg.startsWith('--dataset-id='))?.slice('--dataset-id='.length);
  const runId=process.argv.find(arg=>arg.startsWith('--run-id='))?.slice('--run-id='.length);
  assert.equal(Boolean(datasetId),Boolean(runId),'显式验证范围须同时提供 --dataset-id 和 --run-id');
  const saved=datasetId?{dataset_id:datasetId}:state.datasets.labelme, root=runId||saved.stages?.knowledge?.run_id;
  assert.ok(root,'当前范围尚无知识作业，请明确指定待验证的已完成范围');
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const read=async route=>{const response=await fetch('http://127.0.0.1:8000/api/iad/'+route);assert.equal(response.status,200);return response.json();};
  const output='runs/browser/knowledge-whole-images';await fs.mkdir(output,{recursive:true});
  try{
    await driver.manage().window().setRect({width:1900,height:1000});
    await driver.get('http://127.0.0.1:8000/');
    await (await driver.wait(until.elementLocated(By.css('button[aria-label="知识挖掘"]')),20000)).click();
    const dataset=(await read('datasets')).datasets.find(item=>item.dataset_id===saved.dataset_id);
    const parent=await driver.wait(until.elementLocated(By.css(`#dataset option[value="${dataset.group_id}"]`)),15000);await parent.click();
    const subset=await driver.wait(until.elementLocated(By.css(`#subset option[value="${saved.dataset_id}"]`)),15000);await subset.click();
    const row=await driver.wait(until.elementLocated(By.css(`tr[data-pick-job="${root}"]`)),20000);
    await row.findElement(By.css('td')).click();
    const entry=await driver.wait(until.elementLocated(By.css('button[data-view-entry]')),15000);
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',entry);await entry.click();
    const dialog=await driver.wait(until.elementLocated(By.css('dialog[aria-label="知识条目详情"][open]')),10000);
    const tabs=await dialog.findElements(By.css('[role="tablist"][aria-label="知识图像证据"] [role="tab"]'));
    assert.deepEqual(await Promise.all(tabs.map(tab=>tab.getText())),['支持证据','反对证据'],'证据Tab只显示名称，不在旁边重复图像数量');
    for(const tab of tabs){
      const style=await driver.executeScript('const s=getComputedStyle(arguments[0]);return [s.borderLeftWidth,s.borderTopWidth,s.borderBottomWidth,s.borderRadius,s.height,s.backgroundColor]',tab);
      assert.deepEqual(style,['0px','0px','2px','0px','44px','rgba(0, 0, 0, 0)']);
    }
    assert.ok((await dialog.getText()).includes('对象与位置'));
    await driver.wait(async()=>(await dialog.findElements(By.css('[data-evidence-role="support"] .iad-thumbnail-card'))).length>0,15000);
    const cards=await dialog.findElements(By.css('.iad-thumbnail-card'));
    const sources=[];
    for(const card of cards){
      const src=await card.findElement(By.css('img')).getAttribute('src');
      const match=new URL(src).pathname.match(/knowledge\/evidence\/([^/]+)\/([^/]+)$/);assert.ok(match);
      const version=decodeURIComponent(match[1]), evidenceId=decodeURIComponent(match[2]);
      const snapshot=(await read('knowledge?'+new URLSearchParams({version_id:version}))).knowledge;
      const evidence=snapshot.evidence.find(item=>item.image.evidence_id===evidenceId);assert.ok(evidence);
      assert.deepEqual(evidence.image.crop_bbox,[0,0,...evidence.image.original_size]);assert.notEqual(evidence.image.role,'roi');
      sources.push({version_id:version,evidence_id:evidenceId,sample_id:evidence.sample_id,sent_size:evidence.image.sent_size});
    }
    const first=cards[0];await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',first);await first.click();
    const viewer=await driver.wait(until.elementLocated(By.css('dialog[aria-label="原图检视器"][open]')),10000);
    await driver.wait(async()=>driver.executeScript(()=>{const image=document.querySelector('.full-image-world>img');return image?.complete&&image.naturalWidth>0;}),10000);
    const image=await viewer.findElement(By.css('.full-image-world>img'));
    const dimensions=await driver.executeScript('return [arguments[0].naturalWidth,arguments[0].naturalHeight]',image);
    assert.deepEqual(dimensions,sources[0].sent_size,'放大查看必须加载该冻结整图的完整像素');
    await fs.writeFile(output+'/whole-image-viewer.png',await driver.takeScreenshot(),'base64');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await tabs[0].sendKeys(Key.ARROW_RIGHT);
    await driver.wait(async()=>(await tabs[1].getAttribute('aria-selected'))==='true',5000);
    assert.equal(await dialog.findElement(By.css('[data-evidence-role="support"]')).isDisplayed(),false);
    await tabs[0].click();
    await driver.wait(async()=>(await tabs[0].getAttribute('aria-selected'))==='true',5000);
    await fs.writeFile(output+'/whole-image-evidence.png',await driver.takeScreenshot(),'base64');
    await fs.writeFile(output+'/proof.json',JSON.stringify({dataset_id:saved.dataset_id,run_id:root,sources,viewer_dimensions:dimensions},null,2));
    console.log('KNOWLEDGE_WHOLE_IMAGE_CARDS_AND_SHARED_VIEWER_PASSED',sources.length,'cards');
  }finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
