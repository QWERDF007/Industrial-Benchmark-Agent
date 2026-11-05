const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,until,Key}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');
(async()=>{
  const output='runs/browser/shared-controls';await fs.mkdir(output,{recursive:true});
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),15000);
  const proof={pages:[],dialogs:[],actions:[]};
  const state=JSON.parse(await fs.readFile('runs/verification/v58-two-small/reference.json','utf8'));
  const completedNormal=state.datasets.labelme.previous_narrow_direction_stages.normal.run_id;
  const {navigation}=await import('../lib/shared/navigation.js');
  const collect=()=>driver.executeScript(()=>[...document.querySelectorAll('button.iad-icon-button')].filter(button=>button.getBoundingClientRect().width).map(button=>{
    const r=button.getBoundingClientRect(),svg=button.querySelector('svg'),s=svg?.getBoundingClientRect();
    return {icon:button.dataset.icon,label:button.getAttribute('aria-label'),width:r.width,height:r.height,svgWidth:s?.width,svgHeight:s?.height};
  }));
  try{
    await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');
    for(const [pageId,{label}] of Object.entries(navigation)){
      await(await element(`button[aria-label="${label}"]`)).click();
      await driver.executeScript(`const url=new URL(location.href);url.searchParams.set('iad',JSON.stringify({pageId:arguments[0],datasetId:arguments[1],knowledgeKind:'normal',tab:'results',job:arguments[2]}));
        history.pushState(history.state,'',url);window.dispatchEvent(new PopStateEvent('popstate'));`,pageId,state.datasets.labelme.dataset_id,pageId==='industrial-knowledge'?completedNormal:pageId==='industrial-exploration'?state.datasets.labelme.stages.exploration.run_id:'');
      await element(`[data-page="${pageId}"]`);
      if(pageId==='industrial-exploration')await element('.exp-view-detail-button');
      if(pageId==='industrial-knowledge')await element('[data-detail-entry]');
      const actionSelector={
        'industrial-datasets':'#addBtn',
        'industrial-exploration':'.exp-heading-actions button',
        'industrial-knowledge':'#create-btn',
        'industrial-consistency':'[data-dc="start-check"]',
        'industrial-audit':'button[title="新建审计"]',
      }[pageId];
      if(actionSelector){
        const action=await element(actionSelector);
        const appearance=await driver.executeScript(button=>{
          const style=getComputedStyle(button);
          return {height:button.getBoundingClientRect().height,font:style.fontSize,weight:style.fontWeight,
            color:style.color,background:style.backgroundColor,border:style.borderTopColor,radius:style.borderRadius};
        },action);
        assert.deepEqual(appearance,{height:38,font:'13px',weight:'500',color:'rgb(255, 255, 255)',
          background:'rgb(40, 94, 214)',border:'rgb(40, 94, 214)',radius:'5px'},label);
        proof.actions.push({label,...appearance});
      }
      const buttons=await collect();
      for(const button of buttons)assert.deepEqual([button.width,button.height,button.svgWidth,button.svgHeight],[38,38,18,18],JSON.stringify({label,button}));
      assert.ok(buttons.every(button=>button.label));
      assert.equal(await driver.executeScript(()=>document.querySelector('.iad-header')?.querySelectorAll('small,.chapter,.eyebrow').length||0),0);
      proof.pages.push({label,buttons});
    }
    await(await driver.findElement(By.xpath('//button[@role="tab" and normalize-space()="提供商"]'))).click();
    const add=await driver.wait(until.elementLocated(By.xpath('//button[normalize-space()="添加提供商"]')),10000);
    await driver.wait(until.elementIsEnabled(add),10000);await add.click();
    await element('dialog.iad-provider-dialog');
    const bounds=await driver.executeScript(()=>{const r=document.querySelector('dialog.iad-provider-dialog').getBoundingClientRect();
      return {dx:r.x+r.width/2-innerWidth/2,dy:r.y+r.height/2-innerHeight/2};});
    assert.ok(Math.abs(bounds.dx)<1&&Math.abs(bounds.dy)<1,JSON.stringify(bounds));proof.dialogs.push({type:'provider',...bounds});
    for(const button of await collect())assert.deepEqual([button.width,button.height,button.svgWidth,button.svgHeight],[38,38,18,18],JSON.stringify(button));
    await fs.writeFile(output+'/provider.png',await driver.takeScreenshot(),'base64');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await(await element('button[aria-label="方向探索"]')).click();
    const dataset=state.datasets.labelme.dataset_id;
    await driver.executeScript(`const url=new URL(location.href);url.searchParams.set('iad',JSON.stringify({pageId:'industrial-exploration',datasetId:arguments[0],tab:'results',job:arguments[1]}));
      history.pushState(history.state,'',url);window.dispatchEvent(new PopStateEvent('popstate'));`,dataset,state.datasets.labelme.stages.exploration.run_id);
    await element('.exp-direction-table td.iad-number');
    assert.equal((await driver.findElements(By.css('.exp-direction-mine-icon'))).length,0);
    const remove=await element('.exp-direction-table button[title="删除方向"]');
    const count=(await driver.findElements(By.css('.exp-direction-table tbody tr'))).length;
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',remove);await remove.click();
    await element('dialog[aria-label="删除方向"][open]');
    const confirmActions=await driver.executeScript(()=>[...document.querySelectorAll('dialog[aria-label="删除方向"] button.iad-button')].map(button=>({
      variant:button.dataset.variant,height:button.getBoundingClientRect().height,font:getComputedStyle(button).fontSize,
    })));
    assert.deepEqual(confirmActions,[{variant:'secondary',height:38,font:'13px'},{variant:'danger',height:38,font:'13px'}]);
    proof.dialogs.push({type:'direction-delete',actions:confirmActions});
    await(await element('button[aria-label="取消删除"]')).click();
    assert.equal((await driver.findElements(By.css('.exp-direction-table tbody tr'))).length,count);
    proof.directionDeletion={confirmation:true,cancelPreservesRows:true};
    const alignment=await driver.executeScript(()=>[...document.querySelectorAll('.exp-direction-table .iad-number')].map(cell=>getComputedStyle(cell).textAlign));
    assert.ok(alignment.every(value=>value==='right'),JSON.stringify(alignment));proof.evidenceAlignment=alignment;
    proof.status='PASSED';await fs.writeFile(output+'/verified.json',JSON.stringify(proof,null,2));console.log('SHARED_CONTROLS_AND_CENTERED_DIALOG_PASSED');
  }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
