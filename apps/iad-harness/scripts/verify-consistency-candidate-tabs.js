import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {By,Key,until} from 'selenium-webdriver';

export async function verifyConsistencyCandidateTabs(driver,{base,runId,datasetIds,anchorIds,output}) {
  const root='/api/iad/consistency/checks/'+encodeURIComponent(runId);
  const read=async route=>{
    const result=await driver.executeAsyncScript(function(route,done){
      fetch(route).then(async response=>done({status:response.status,data:await response.json()}))
        .catch(error=>done({error:String(error)}));
    },route);
    assert.equal(result.status,200,result.error);
    return result.data;
  };
  await fs.mkdir(output,{recursive:true});
  const cases=[];
  for(const anchorId of anchorIds){
    await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({
      pageId:'industrial-consistency',datasetIds,batchId:runId})}));
    await driver.wait(until.elementLocated(By.id('dc-filename-search')),30000);
    const filename=anchorId.split('/').pop().split(':').pop();
    await driver.executeScript(function(filename){
      const search=document.getElementById('dc-filename-search');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(search,filename);
      search.dispatchEvent(new Event('input',{bubbles:true}));
    },filename);
    const card=await driver.wait(until.elementLocated(By.css(`.dc-conflict-grid [data-id=${JSON.stringify(anchorId)}]`)),30000);
    const endpoint=root+'/anchors/'+encodeURIComponent(anchorId);
    const [before,members,candidates]=await Promise.all([read(endpoint+'/analysis'),read(endpoint+'/members'),read(endpoint+'/candidates')]);
    await card.click();
    await driver.wait(until.elementLocated(By.id('dc-candidate-panel')),15000);
    assert.deepEqual(await Promise.all((await driver.findElements(By.css('#dc-compare-mask [role=tab]')))
      .map(tab=>tab.getText())),['实际对比','完全一致','相似']);
    await driver.executeScript(function(){
      const original=window.fetch.bind(window);window.__iadComparisonWrites=[];
      window.fetch=function(input,options){
        const method=options?.method||(input instanceof Request?input.method:'GET');
        const url=String(input instanceof Request?input.url:input);
        if(url.includes('/api/iad/')&&method.toUpperCase()!=='GET')window.__iadComparisonWrites.push({url,method});
        return original.apply(this,arguments);
      };
    });
    const anchor=await driver.findElement(By.css('[data-dc=zoom-anchor] img')).getAttribute('src');
    const inspected=[];
    for(const tab of ['compared','exact','similar']){
      await driver.findElement(By.id('dc-candidate-tab-'+tab)).click();
      const expected=tab==='compared'?members.items.map(item=>item.image):
        candidates.items.filter(item=>item.kind===tab).map(item=>item.image);
      await driver.wait(async()=>(await driver.findElements(By.css('#dc-candidate-panel [data-dc=candidate]'))).length===expected.length,15000);
      assert.equal(await driver.findElement(By.css('[data-dc=zoom-anchor] img')).getAttribute('src'),anchor);
      assert.equal(await driver.findElement(By.id('dc-candidate-panel')).getAttribute('aria-labelledby'),'dc-candidate-tab-'+tab);
      if(expected.length){
        const last=expected.length-1;
        await driver.findElement(By.css(`#dc-candidate-panel [data-dc=candidate][data-id="${last}"]`)).click();
        const selected=expected[last].sample.relative_path.split('/').pop();
        await driver.wait(async()=>await driver.findElement(By.css('.dc-compare-cell:last-child .dc-photo-filename')).getText()===selected,15000);
        await driver.wait(()=>driver.executeScript('const image=document.querySelector("[data-dc=zoom-candidate] img");return image?.complete&&image.naturalWidth>0'),15000);
        assert.equal(await driver.findElement(By.css(`#dc-candidate-panel [data-dc=candidate][data-id="${last}"]`)).getAttribute('aria-pressed'),'true');
        assert.equal(await driver.findElement(By.css('[data-dc=zoom-anchor] img')).getAttribute('src'),anchor);
        await driver.findElement(By.css('[data-dc=zoom-candidate]')).click();
        await driver.wait(until.elementLocated(By.css('[aria-label="大图查看区域"]')),15000);
        assert.equal(await driver.findElement(By.id('full-file-name')).getText(),selected);
        assert.equal((await driver.findElements(By.id('prev-img'))).length,1,'一致性大图提供左右切换');
        assert.equal(await driver.findElement(By.id('next-img')).isEnabled(),false,'末尾候选不能继续向右');
        await driver.findElement(By.id('prev-img')).click();
        const previous=last?expected[last-1].sample.relative_path.split('/').pop():filename;
        await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===previous,10000);
        await driver.actions().sendKeys(Key.ARROW_RIGHT).perform();
        await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===selected,10000);
        await driver.findElement(By.id('full-close')).click();
        await driver.findElement(By.css('[data-dc=zoom-anchor]')).click();
        await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===filename,10000);
        assert.equal(await driver.findElement(By.id('prev-img')).isEnabled(),false,'主图位于图集开头');
        await driver.findElement(By.id('next-img')).click();
        await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===expected[0].sample.relative_path.split('/').pop(),10000);
        await fs.writeFile(path.join(output,tab+'-fullscreen-navigation.png'),await driver.takeScreenshot(),'base64');
        await driver.findElement(By.id('full-close')).click();
      }else{
        assert.equal((await driver.findElements(By.css('[data-dc=zoom-candidate] img'))).length,0);
        assert.equal(await driver.findElement(By.css('[data-dc=zoom-candidate]')).getAttribute('aria-disabled'),'true');
      }
      await driver.wait(async()=>(await driver.findElements(By.css('#dc-candidate-panel .iad-annotation-layer'))).length>0,10000);
      const visibleLayers=(await driver.findElements(By.css('#dc-candidate-panel .iad-annotation-layer'))).length;
      const imageUrls=await Promise.all((await driver.findElements(By.css('.dc-compare-photo img'))).map(image=>image.getAttribute('src')));
      const annotationToggle=await driver.findElement(By.xpath('//*[@id="dc-compare-mask"]//header//button[normalize-space()="隐藏标注"]'));
      assert.equal(await annotationToggle.getAttribute('aria-pressed'),'true');
      assert.equal(await driver.executeScript('return arguments[0].previousElementSibling.textContent.trim()',annotationToggle),'下一组');
      await annotationToggle.click();
      await driver.wait(async()=>(await driver.findElements(By.css('#dc-candidate-panel .iad-annotation-layer'))).length===0,5000);
      assert.equal(await annotationToggle.getText(),'显示标注');
      assert.equal(await annotationToggle.getAttribute('aria-pressed'),'false');
      assert.deepEqual(await Promise.all((await driver.findElements(By.css('.dc-compare-photo img'))).map(image=>image.getAttribute('src'))),imageUrls);
      await annotationToggle.sendKeys(Key.ENTER);
      await driver.wait(async()=>(await driver.findElements(By.css('#dc-candidate-panel .iad-annotation-layer'))).length===visibleLayers,5000);
      assert.equal(await annotationToggle.getText(),'隐藏标注');
      assert.equal(await annotationToggle.getAttribute('aria-pressed'),'true');
      await fs.writeFile(path.join(output,filename+'-'+tab+'.png'),await driver.takeScreenshot(),'base64');
      inspected.push({tab,images:expected.length,annotation_layers:visibleLayers,annotation_toggle_verified:true});
    }
    await driver.findElement(By.css('#dc-compare-mask [role=tab][aria-selected=true]')).sendKeys(Key.HOME);
    assert.equal(await driver.findElement(By.id('dc-candidate-tab-compared')).getAttribute('aria-selected'),'true');
    assert.deepEqual(await driver.executeScript('return window.__iadComparisonWrites'),[]);
    assert.deepEqual(await read(endpoint+'/analysis'),before);
    assert.deepEqual(await read(endpoint+'/members'),members);
    assert.deepEqual(await read(endpoint+'/candidates'),candidates);
    cases.push({anchor_id:anchorId,actual_comparisons:members.items.length,tabs:inspected,audit_data_unchanged:true});
  }
  const proof={viewport:await driver.executeScript('return {width:innerWidth,height:innerHeight}'),run_id:runId,cases};
  assert.deepEqual(proof.viewport,{width:1920,height:1080});
  await fs.writeFile(path.join(output,'comparison-tabs.json'),JSON.stringify(proof,null,2));
  return proof;
}
