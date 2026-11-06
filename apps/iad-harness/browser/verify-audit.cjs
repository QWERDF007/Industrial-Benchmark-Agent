const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const base=process.env.IAD_BASE_URL||'http://127.0.0.1:8000';
  const output=process.env.IAD_BROWSER_OUTPUT||path.resolve('runs/browser/audit');
  const input=process.env.IAD_AUDIT_CASE;
  assert.ok(input,'通过 IAD_AUDIT_CASE 指定 dataset、job 和 sample_id');
  const {dataset,job,sample_id}=JSON.parse(await fs.readFile(input,'utf8'));
  assert.ok(dataset?.dataset_id&&job?.run_id&&sample_id,'必须指定实际作业及样本');
  const read=async route=>{
    const response=await fetch(base+'/api/iad/'+route);
    assert.equal(response.status,200,route);
    return response.json();
  };
  const detail=await read(`audit/jobs/${encodeURIComponent(job.run_id)}/samples/${encodeURIComponent(sample_id)}`);
  const analysis=detail.suggestion?.analysis;
  assert.ok(analysis?.conclusion?.analysis_text,'样本必须已有实际综合审计结果');
  assert.equal(detail.sample.dataset_id,dataset.dataset_id);
  const images=new Map([analysis.overview,...analysis.regions.map(item=>item.image),
    ...analysis.reference_evidence,...analysis.auxiliary_evidence].map(image=>[image.evidence_id,image]));
  const pictures=analysis.image_sources.map(source=>({source,image:images.get(source.overview_evidence_id)}));
  assert.ok(pictures.length>=2,'验证需要真实主图和对照图');
  for(const {source,image} of pictures){
    assert.equal(image.role,'overview');assert.equal(image.representation,'raw');
    assert.deepEqual(image.crop_bbox,[0,0,source.sample.width,source.sample.height]);
  }
  const options=new firefox.Options().addArguments('-headless');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
  const click=async node=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
  const proof={source:'actual-http-and-browser',dataset_id:dataset.dataset_id,run_id:job.run_id,sample_id,
    suggestion_id:detail.suggestion.suggestion_id,job_mutations:false};
  await fs.mkdir(output,{recursive:true});
  try{
    await driver.manage().window().setRect({width:1904,height:1000});await driver.get(base+'/');
    await click(await element('button[aria-label="模型审计"]'));
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="审计视图"] [role="tab"]'))).length===2,15000);
    assert.deepEqual(await Promise.all((await driver.findElements(By.css('[aria-label="审计视图"] [role="tab"]'))).map(tab=>tab.getText())),['模型审计','报告']);
    await click(await element(`#audit-dataset option[value="${dataset.group_id}"]`));
    await click(await element('#audit-child-trigger'));
    for(const box of await driver.findElements(By.css('#audit-child-menu input[type=checkbox]'))){
      if(await box.isSelected()!==((await box.getAttribute('value'))===dataset.dataset_id))await click(box);
    }
    await click(await element('#audit-child-trigger'));
    await click(await element('button[title="新建审计"]'));
    const editor=await element('#audit-create-prompt');
    const {promptDefaults}=await import('../lib/shared/prompt-defaults.generated.js');
    assert.equal(await editor.getAttribute('value'),promptDefaults.audit,'页面应完整显示同一来源的默认提示词');
    assert.equal(await editor.isEnabled(),true);assert.equal(await editor.getDomAttribute('readonly'),null);
    await editor.sendKeys(Key.END,' 浏览器编辑核验');
    await driver.wait(async()=>(await editor.getAttribute('value')).includes('浏览器编辑核验'),3000);
    await click(await element('#audit-create-cancel'));
    proof.complete_editable_default_verified=true;
    const row=await element(`tr[data-run-id="${job.run_id}"]`);await click(await row.findElement(By.css('td')));
    const search=await element('input[aria-label="搜索审计图像"]');
    await search.sendKeys(sample_id.split('/').pop().split(':').pop());
    const card=await element(`.iad-thumbnail-card[data-sample-id="${sample_id}"]`);
    await click(card);
    const dialog=await element('dialog[aria-label="图像审计详情"][open]');
    await driver.wait(async()=>(await dialog.findElement(By.css('[data-audit-section="analysis"]')).getText()).includes(analysis.conclusion.analysis_text),20000);
    const bounds=await dialog.getRect();assert.equal(Math.round(bounds.width),1380);assert.equal(Math.round(bounds.height),820);
    assert.deepEqual(await Promise.all((await dialog.findElements(By.css('[data-audit-section] > h3'))).map(title=>title.getText())),['综合分析','结论','判断依据','图像证据']);
    const sections=await dialog.findElements(By.css('[data-audit-section]'));
    const positions=await Promise.all(sections.map(section=>section.getRect()));
    assert.ok(positions.every((position,index)=>index===0||position.y>positions[index-1].y),'正文应纵向排列');
    assert.ok((await dialog.findElement(By.css('[data-audit-section="conclusion"]')).getText()).includes(analysis.conclusion.description));
    await fs.writeFile(path.join(output,'analysis.png'),await driver.takeScreenshot(),'base64');
    const evidence=await dialog.findElement(By.css('[data-audit-section="evidence"]'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"end"})',evidence);
    await driver.wait(()=>driver.executeScript(()=>[...document.querySelectorAll('.audit-dialog .iad-image-pair img')]
      .filter(image=>image.dataset.mediaLabel==='图像').every(image=>image.complete&&image.naturalWidth>0)),15000);
    const verifyPair=async expected=>{
      const actual=await driver.executeScript(()=>[...document.querySelectorAll('.audit-dialog .iad-image-pair-side')].map(side=>{
        const image=side.querySelector('img[data-media-label="图像"]'),layer=side.querySelector('svg.iad-annotation-layer');
        const rect=side.getBoundingClientRect();
        return {src:image?.src,natural:[image?.naturalWidth,image?.naturalHeight],viewBox:layer?.getAttribute('viewBox'),
          boxes:[...side.querySelectorAll('svg.iad-annotation-layer > g > rect:not([mask])')].map(box=>['x','y','width','height'].map(name=>Number(box.getAttribute(name)))),
          left:rect.left,right:rect.right,top:rect.top};
      }));
      assert.equal(actual.length,2);assert.ok(actual[0].right<=actual[1].left&&Math.abs(actual[0].top-actual[1].top)<=1,'主图和对照图应左右并排');
      for(let i=0;i<2;i++){
        const {source,image}=expected[i];
        assert.ok(actual[i].src.includes(encodeURIComponent(image.evidence_id)),'必须展示对应原图证据');
        assert.deepEqual(actual[i].natural,image.sent_size);
        assert.equal(actual[i].viewBox,`0 0 ${source.sample.width} ${source.sample.height}`);
        assert.deepEqual(actual[i].boxes,source.annotations.filter(annotation=>annotation.geometry_status!=='INVALID'&&annotation.annotation_type!=='mask'&&!annotation.polygon&&annotation.bbox)
          .map(annotation=>[annotation.bbox[0],annotation.bbox[1],annotation.bbox[2]-annotation.bbox[0],annotation.bbox[3]-annotation.bbox[1]]));
      }
      return actual;
    };
    proof.pair=await verifyPair([pictures[0],pictures[1]]);
    if(pictures.length>2){
      const index=pictures.findIndex((picture,index)=>index>1&&picture.source.annotations.some(annotation=>annotation.geometry_status!=='INVALID'));
      const next=index>1?index:2;
      const select=await dialog.findElement(By.css('select[aria-label="选择审计对照图像"]'));
      await click(await select.findElement(By.css(`option[value="${next-1}"]`)));
      await driver.wait(()=>driver.executeScript('const image=document.querySelectorAll(".audit-dialog .iad-image-pair img[data-media-label=图像]")[1];return image?.complete&&image.naturalWidth>0'),15000);
      proof.selected_pair=await verifyPair([pictures[0],pictures[next]]);
    }
    await fs.writeFile(path.join(output,'evidence.png'),await driver.takeScreenshot(),'base64');
    const expand=await dialog.findElement(By.css('button[aria-label="放大主图"]'));await click(expand);
    const viewer=await element('dialog[aria-label="原图检视器"][open]');
    assert.equal(await driver.executeScript('return arguments[0].matches(":modal")',viewer),true);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(()=>driver.executeScript(()=>!document.querySelector('dialog[aria-label="原图检视器"][open]')),5000);
    assert.equal(await driver.executeScript('return arguments[0].matches(":modal")',dialog),true);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(()=>driver.executeScript(()=>!document.querySelector('dialog[aria-label="图像审计详情"][open]')),5000);
    assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',card),true);
    proof.original_images_and_annotations_verified=true;proof.nested_viewer_and_focus_verified=true;
    await fs.writeFile(path.join(output,'proof.json'),JSON.stringify(proof,null,2));
    console.log('LIVE_AUDIT_DETAIL_VERIFIED',dataset.dataset_id,job.run_id,sample_id);
  }catch(error){await fs.writeFile(path.join(output,'failure.png'),await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
