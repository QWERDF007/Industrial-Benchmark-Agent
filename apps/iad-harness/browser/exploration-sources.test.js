import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {explorationSources} from '../test/fixtures/exploration-sources.js';

async function pickerBrowser(t) {
  let bundle,releaseSources;
  const gate=new Promise(resolve=>releaseSources=resolve);
  t.after(()=>releaseSources());
  const fixture=await explorationSources(t,async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle);return true;}
    if(req.url==='/'){
      res.setHeader('Content-Type','text/html;charset=utf-8');
      res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');return true;
    }
    if(req.url.startsWith('/api/iad/analysis/sources'))await gate;
    return false;
  });
  const output=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {ExplorationPage} from './src/client/components/ExplorationPage.tsx';

    import {QueryClientProvider} from '@tanstack/react-query';import {queryClient} from './src/client/query-client.ts';
    import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const workspace=new Workspace(null),style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    function App(){const [dataset,setDataset]=React.useState(null);React.useEffect(()=>{fetch('/api/iad/datasets').then(r=>r.json()).then(data=>{queryClient.setQueryData(['iad','resource','/datasets'],data);setDataset(data.datasets.find(item=>item.name==='labelme-a'));});},[]);
    return <QueryClientProvider client={queryClient}><WorkspaceContext.Provider value={workspace}><main className="iad-workbench">{dataset&&<ExplorationPage dataset={dataset} refreshRevision={0}/>}</main></WorkspaceContext.Provider></QueryClientProvider>}
    createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:fixture.app},
    bundle:true,write:false,format:'iife',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  bundle=output.outputFiles[0].contents;
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  t.after(async()=>{releaseSources();await driver.quit();});
  await driver.manage().window().setRect({width:1440,height:1100});await driver.get(fixture.base);
  const el=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  const button=(label,within=driver)=>within.findElement(By.xpath(`.//button[normalize-space(.)="${label}"]`));
  const open=async(kind='良品')=>{
    const tab=await driver.findElement(By.xpath(`//div[@role="tablist" and @aria-label="对比样例"]//button[starts-with(normalize-space(.),"${kind}样例")]`));
    if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
    await(await el(`button[aria-label="继续添加${kind}图像"]`)).click();
    return el(`dialog[aria-label="选择${kind}图像"][open]`);
  };
  await(await el('#exp-new')).click();
  return {...fixture,driver,el,button,open,releaseSources};
}

test('picker preserves dialog, card and action geometry from loading to full, partial, single and empty grids',{timeout:60000},async t=>{
  const {driver,el,button,open,releaseSources}=await pickerBrowser(t);
  try{
    const dialog=await open();
    const initial=await dialog.getRect();
    assert.equal(initial.width,960);assert.equal(initial.height,820);
    const geometry=()=>driver.executeScript(`return Object.fromEntries(['.iad-dialog-header','.exp-source-filters','.exp-source-scroll','.exp-source-pagination','.iad-dialog-footer'].map(selector=>{const r=document.querySelector('dialog[open] '+selector).getBoundingClientRect();return [selector,[r.x,r.y,r.width,r.height]]}))`);
    const loading=await geometry();
    releaseSources();
    await driver.wait(async()=>(await dialog.findElements(By.css('.iad-thumbnail-card'))).length===24,10000);
    const full=await geometry(),card=await dialog.findElement(By.css('.iad-thumbnail-card')).getRect();
    assert.deepEqual(full,loading);
    await fs.writeFile('/tmp/exploration-picker-full.png',await driver.takeScreenshot(),'base64');
    await(await button('下一页',dialog)).click();
    assert.ok((await dialog.findElements(By.css('.iad-thumbnail-card'))).length<24);
    assert.deepEqual(await geometry(),full);
    const search=await el('#exp-source-search');await search.sendKeys('convention-normal');
    await driver.wait(async()=>(await dialog.findElements(By.css('.iad-thumbnail-card'))).length===1,5000);
    const single=await dialog.findElement(By.css('.iad-thumbnail-card')).getRect();
    assert.equal(single.width,card.width);assert.equal(single.height,card.height);assert.equal(single.x,card.x);
    assert.deepEqual(await geometry(),full);
    await fs.writeFile('/tmp/exploration-picker-single.png',await driver.takeScreenshot(),'base64');
    await search.clear();await search.sendKeys('no-such-image');
    await driver.wait(async()=>(await dialog.findElements(By.css('.iad-thumbnail-card'))).length===0,5000);
    assert.doesNotMatch(await dialog.getText(),/没有符合.*图像/);
    assert.equal((await dialog.findElements(By.css('.iad-pagination'))).length,0);
    assert.deepEqual(await geometry(),full);
    assert.deepEqual(await dialog.getRect(),initial);
    await fs.writeFile('/tmp/exploration-picker-empty.png',await driver.takeScreenshot(),'base64');
    await(await button('完成选择',dialog)).click();
    assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),'继续添加良品图像');
    const abnormal=await open('异常');
    assert.deepEqual(await abnormal.getRect(),initial);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
  }catch(error){await fs.writeFile('/tmp/exploration-picker-failure.png',await driver.takeScreenshot(),'base64');throw error;}
});

test('picker combines fixed roles, filename, subset and LabelMe category filters without changing selections or scope',{timeout:60000},async t=>{
  const {driver,el,button,open,releaseSources,datasets}=await pickerBrowser(t);
  releaseSources();
  try{
    let dialog=await open();
    await driver.wait(async()=>(await dialog.findElements(By.css('.iad-thumbnail-card'))).length===24,10000);
    assert.match(await dialog.getText(),/共 29 张图像/);
    assert.equal((await dialog.findElements(By.id('exp-source-category'))).length,0);
    await(await dialog.findElement(By.css('.iad-thumbnail-card'))).click();
    await(await button('下一页',dialog)).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,5);
    await(await dialog.findElement(By.css('.iad-thumbnail-option input'))).click();
    await(await el('#exp-only-selected')).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,2);
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-option input:checked'))).length,2);
    await(await el('#exp-only-selected')).click();
    const search=await el('#exp-source-search');await search.sendKeys('CONVENTION-NORMAL');
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,1);
    assert.equal(await dialog.findElement(By.css('.iad-thumbnail-card')).getAttribute('title'),'convention-normal.png');
    await search.clear();await search.sendKeys('OK/');
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,0,'directory names are not filenames');
    await(await el('button[aria-label="清除图像筛选"]')).click();
    const subsets=async ids=>{
      const trigger=await el('#exp-source-children');await trigger.click();
      for(const dataset of datasets){
        const checkbox=await el(`#exp-source-children-options input[value="${dataset.dataset_id}"]`);
        if(await checkbox.isSelected()!==ids.includes(dataset.dataset_id))await checkbox.click();
      }
      await trigger.click();
    };
    await subsets([datasets[0].dataset_id]);
    assert.match(await dialog.getText(),/共 26 张图像/);
    await subsets([]);
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,0);
    await(await el('button[aria-label="清除图像筛选"]')).click();
    await(await el('#exp-only-selected')).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,2,'filtering preserves both selections');
    await(await button('完成选择',dialog)).click();
    assert.equal((await driver.findElements(By.css('.exp-preview .iad-thumbnail-card'))).length,2);
    assert.match(await(await el('#exp-child-toggle')).getText(),/已选 4 个子数据集/);
    dialog=await open('异常');
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,4);
    const category=await el('#exp-source-category');
    const options=()=>driver.executeScript('return [...document.querySelectorAll("#exp-source-category option")].map(item=>item.textContent)');
    assert.deepEqual(await options(),['全部类别','凹陷','类别 2','类别 10']);
    await category.findElement(By.css('option[value="类别 2"]')).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,1);
    await(await dialog.findElement(By.css('.iad-thumbnail-card'))).click();
    await subsets([datasets[1].dataset_id]);
    assert.equal(await category.getAttribute('value'),'');
    assert.deepEqual(await options(),['全部类别','凹陷','类别 10']);
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,2);
    await category.findElement(By.css('option[value="凹陷"]')).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,1);
    await subsets([datasets[2].dataset_id]);
    assert.equal((await dialog.findElements(By.id('exp-source-category'))).length,0,'NG is fixed by role, without a redundant category selector');
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,1);
    assert.equal(await dialog.findElement(By.css('.iad-thumbnail-card')).getAttribute('title'),'ng.png');
    await(await el('button[aria-label="清除图像筛选"]')).click();
    await(await el('#exp-only-selected')).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,1,'hidden selected abnormal sample is retained');
    await fs.writeFile('/tmp/exploration-picker-filters.png',await driver.takeScreenshot(),'base64');
    await(await button('完成选择',dialog)).click();
    dialog=await open();
    await(await el('#exp-only-selected')).click();
    assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,2);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
  }catch(error){await fs.writeFile('/tmp/exploration-picker-filters-failure.png',await driver.takeScreenshot(),'base64');throw error;}
});

test('picker keeps filters and actions reachable on narrow and short viewports with keyboard popovers',{timeout:60000},async t=>{
  const {driver,el,open,releaseSources}=await pickerBrowser(t);
  releaseSources();
  try{
    for(const viewport of [{width:450,height:812},{width:750,height:600}]){
      await driver.manage().window().setRect(viewport);
      const dialog=await open('异常');
      await el('#exp-source-category');
      const layout=await driver.executeScript(`
        const dialog=document.querySelector('dialog[open]'),frame=dialog.getBoundingClientRect();
        const boxes=[...dialog.querySelectorAll('.exp-source-filters input,.exp-source-filters select,.exp-source-filters button,.iad-dialog-footer button')].filter(item=>item.getClientRects().length).map(item=>item.getBoundingClientRect());
        return {width:innerWidth,height:innerHeight,frame:{x:frame.x,y:frame.y,right:frame.right,bottom:frame.bottom},
          horizontal:dialog.scrollWidth>dialog.clientWidth,gridHeight:dialog.querySelector('.exp-source-scroll').clientHeight,
          accessible:boxes.every(item=>item.left>=frame.left&&item.right<=frame.right&&item.top>=frame.top&&item.bottom<=frame.bottom)};`);
      assert.equal(layout.horizontal,false,JSON.stringify(layout));
      assert.equal(layout.accessible,true,JSON.stringify(layout));
      assert.ok(layout.frame.x>=0&&layout.frame.y>=0&&layout.frame.right<=layout.width&&layout.frame.bottom<=layout.height,JSON.stringify(layout));
      assert.ok(layout.gridHeight>0,JSON.stringify(layout));
      await(await el('#exp-source-search')).click();
      await driver.actions().sendKeys(Key.TAB).perform();
      assert.equal(await driver.executeScript('return document.activeElement.id'),'exp-source-children');
      await driver.actions().sendKeys(Key.SPACE).perform();
      await driver.wait(()=>driver.executeScript('return document.querySelector("#exp-source-children-options").matches(":popover-open")'),5000);
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      assert.equal(await driver.executeScript('return document.querySelector("#exp-source-children-options").matches(":popover-open")'),false);
      assert.equal(await driver.executeScript('return document.querySelector("dialog[open]").matches(":modal")'),true);
      await fs.writeFile(`/tmp/exploration-picker-${viewport.width}.png`,await driver.takeScreenshot(),'base64');
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),'继续添加异常图像');
    }
  }catch(error){await fs.writeFile('/tmp/exploration-picker-responsive-failure.png',await driver.takeScreenshot(),'base64');throw error;}
});
