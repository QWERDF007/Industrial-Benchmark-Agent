import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {viewport, textZoom, setTheme, verifyWorkbenchLayout, verifySidebarLayout} from './workbench-layout.js';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('native datasets retain real directory, metadata and import operations in the V6 layout', {timeout:180000}, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-dataset-design-'));
  const output = path.join(workspace, 'runs/browser/dataset-design', String(Date.now()));
  await fs.mkdir(output, {recursive:true});
  execFileSync(resolvePythonPath(), ['-c', `
from pathlib import Path
from PIL import Image
import json,sys
p=Path(sys.argv[1]);p.joinpath('images').mkdir();p.joinpath('labels').mkdir()
Image.new('RGB',(80,60),'blue').save(p/'images/sample.png')
(p/'labels/sample.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[]}))
for directory,count in [('公头NG',2),('公头OK',3),('母头NG',1),('母头OK',2)]:
 d=p/'classification'/directory;d.mkdir(parents=True)
 for i in range(count):Image.new('RGB',(80,60),'blue').save(d/f'{i}.png')
`, root]);
  const profile = path.join(root, 'home/profiles/web');
  await fs.mkdir(path.join(profile,'node_modules/@industrial-benchmark'), {recursive:true});
  await fs.symlink(path.join(workspace,'apps/iad-harness'),path.join(profile,'node_modules/@industrial-benchmark/iad-harness'));
  await fs.writeFile(path.join(profile,'package.json'),JSON.stringify({name:'iad-dataset-design',private:true,type:'module',dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app']}}}));
  await fs.writeFile(path.join(profile,'cordis.yml'),'[]\n');
  await fs.writeFile(path.join(profile,'cordis.patch.yml'),'- id: ui-settings-general\n  config:\n    welcomeNoticeVersion: 2026-09-28.1\n');
  const reservation=http.createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));
  const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  const patch=path.join(root,'host.patch.yml');
  await fs.writeFile(patch,`- id: webserver
  config:
    host: 127.0.0.1
    port: ${port}
- insert:
    - id: industrial-harness-plugin
      name: '@industrial-benchmark/iad-harness'
      config:
        cwd: ${JSON.stringify(workspace)}
        dbPath: ${JSON.stringify(path.join(root,'test.db'))}
`);
  const host=spawn(process.env.IAD_NODE_PATH||process.execPath,[path.join(workspace,'node_modules/@deepseek-ai/dsh/lib/bin.js'),'--profile','web','--patch',patch,'--port',String(port),'--no-open'],{cwd:workspace,env:{...process.env,DSH_HOME:path.join(root,'home')},stdio:['ignore','pipe','pipe']});
  let log='',driver,stage='startup';host.stdout.on('data',data=>{log+=data;});host.stderr.on('data',data=>{log+=data;});
  try {
    const deadline=Date.now()+30000;
    while(!log.match(/http:\/\/[^\s)]+/) && host.exitCode===null && Date.now()<deadline)await delay(100);
    const login=log.match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login,log.replace(/(token=)[^\s&]+/g,'$1<redacted>'));
    const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await viewport(driver,1920,1080);await driver.get(login);
    const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
    const button=async text=>{const item=await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}' or @aria-label='${text}']`)),10000);await driver.wait(until.elementIsEnabled(item),10000);await item.click();};
    const api=async(endpoint,body,method)=>{
      const result=await driver.executeAsyncScript("const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[0],{method:arguments[2] || (arguments[1]?'POST':'GET'),headers:{'Content-Type':'application/json'},body:arguments[1]?JSON.stringify(arguments[1]):undefined}).then(async r=>done({status:r.status,value:await r.json()})).catch(e=>done({error:String(e)}))",endpoint,body||null,method||null);
      assert.equal(result.status,200,JSON.stringify(result));return result.value;
    };
    await element('button[aria-label="数据集管理"]');
    await(await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')),10000)).click();
    stage='seed real dataset';
    const rules=['公头NG','公头OK','母头NG','母头OK'].map(name=>({path:name,role:name.endsWith('OK')?'normal':'anomaly'}));
    const preview=await api('/datasets/preview',{root_dir:path.join(root,'classification'),rules});
    const dataset=await api('/datasets/import',{format:'folder_classification',name:'超节点异常检测数据',root_dir:path.join(root,'classification'),rules,preview_fingerprint:preview.preview_fingerprint});
    await(await element('button[aria-label="数据集管理"]')).click();
    await(await element(`.data-row[data-id="${dataset.dataset_id}"] .name-text`)).click();
    await element('select[aria-label="目录 公头NG 角色"]');
    stage='drawer rescan dirty guard';
    const rootDirInput = await element('input[aria-label="根目录"]');
    await rootDirInput.clear();
    await rootDirInput.sendKeys(path.join(root,'classification'));
    await (await element('select[aria-label="目录 公头NG 角色"] option[value="unlabeled"]')).click();
    assert.equal(await (await element('#dirtyHelp')).getText(), '有尚未保存的变更');
    await button('取消更改');
    assert.equal(await (await element('#dirtyHelp')).getText(), '');

    stage='sidebar layout';
    await verifySidebarLayout(driver,path.join(output,'sidebar'));
    stage='layout';
    const measured=await driver.executeScript(()=>{
      const table=document.querySelector('table[aria-label="数据集列表"]'),row=table.querySelector('tbody tr'),drawer=document.querySelector('.dataset-drawer'),header=table.querySelector('th:last-child');
      return {row:row.getBoundingClientRect().height,font:getComputedStyle(table).fontSize,headerAlign:getComputedStyle(header).textAlign,drawerWidth:drawer?.getBoundingClientRect().width};
    });
    assert.equal(measured.font,'13px','数据表使用方案13px字号');
    assert.ok(Math.abs(measured.row-55)<=2,'方案约55px数据行');
    assert.equal(measured.headerAlign,'right','表头操作右对齐');
    assert.ok(measured.drawerWidth >= 480, '抽屉宽度符合预期');

    stage='drawer subtitle and identifier';
    const subTitle = await (await element('#detailSub')).getText();
    assert.equal(subTitle, '子数据集', '抽屉标题下方仅显示子数据集');
    const identifier = await (await element('.identifier-section .identifier-value span')).getText();
    assert.equal(identifier, dataset.dataset_id, '抽屉中展示正确的数据集标识');

    stage='pencil and action layout';
    const pencilStyle = await driver.executeScript(()=>{
      const pencil = document.querySelector('.data-row button[data-edit]');
      const style = getComputedStyle(pencil);
      return { marginLeft: style.marginLeft, display: style.display };
    });
    assert.ok(['flex','inline-flex'].includes(pencilStyle.display));

    const actionsStyle = await driver.executeScript(()=>{
      const actions = document.querySelector('.actions');
      const style = getComputedStyle(actions);
      return { justify: style.justifyContent };
    });
    assert.equal(actionsStyle.justify, 'flex-end', '操作列按钮靠右对齐');

    stage='inline rename enter';
    const pencilBtn = await element(`.data-row[data-id="${dataset.dataset_id}"] button[data-edit]`);
    await pencilBtn.click();
    const editInput = await element('input[data-edit-input]');
    await editInput.click();
    await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();
    await editInput.sendKeys('真实名称已修改');
    assert.equal(await editInput.getAttribute('value'),'真实名称已修改');
    await editInput.sendKeys(Key.ENTER);
    await driver.wait(async()=>(await api('/datasets/'+dataset.dataset_id)).name==='真实名称已修改',10000);

    stage='inline rename esc cancel';
    const pencilBtn2 = await element(`.data-row[data-id="${dataset.dataset_id}"] button[data-edit]`);
    await pencilBtn2.click();
    const editInput2 = await element('input[data-edit-input]');
    await editInput2.sendKeys('取消的修改', Key.ESCAPE);
    assert.equal((await driver.findElements(By.css('input[data-edit-input]'))).length, 0);

    stage='copy identifier';
    await (await element('button[aria-label="复制数据集标识"]')).click();
    await driver.wait(()=>driver.executeScript("return document.querySelector('#toast')?.textContent?.includes('已复制')"),5000);

    stage='search';
    const search=await element('input[aria-label="搜索数据集"]');
    await search.sendKeys('does-not-exist');
    assert.equal((await driver.findElements(By.css('.data-row'))).length, 0);
    await search.clear();
    await search.sendKeys('真实名称');
    assert.ok((await driver.findElements(By.css('.data-row'))).length >= 1);
    await search.clear();
    await search.sendKeys(Key.ESCAPE);

    stage='import labelme';
    await button('关闭详情抽屉');
    await button('添加数据集');
    await element('.modal[aria-label="添加数据集"]');
    await (await element('input[name="new-kind"][value="child"]')).click();
    await (await element('#new-name')).sendKeys('Labelme真实导入');
    await (await element('#new-path')).sendKeys(path.join(root,'images'));
    await (await element('#new-label-path')).sendKeys(path.join(root,'labels'));
    await button('添加');
    await driver.wait(async()=>(await driver.findElements(By.css('.modal'))).length===0, 10000);
    const created=(await api('/datasets')).datasets.find(d=>d.name==='Labelme真实导入');
    assert.equal(created.format,'labelme');
    assert.equal(created.total_samples,1);

    stage='direct delete';
    await button('关闭详情抽屉');
    const deleteBtn = await element(`.data-row[data-id="${created.dataset_id}"] button[data-delete]`);
    await deleteBtn.click();
    await element('.modal[aria-label="删除数据集"]');
    await button('确认删除');
    await driver.wait(async()=>(await api('/datasets')).datasets.length===1,10000);

    console.log(JSON.stringify({output,layout:measured,stage:'completed'}));
  } catch(error) {
    if(driver){await fs.writeFile(path.join(output,'failure.png'),await driver.takeScreenshot(),'base64');console.error(JSON.stringify({stage,text:await driver.executeScript("return document.querySelector('.iad-workbench')?.innerText")}));}throw error;
  } finally {
    await driver?.quit();host.kill('SIGTERM');await Promise.race([new Promise(resolve=>host.once('exit',resolve)),delay(5000)]);if(host.exitCode===null)host.kill('SIGKILL');await fs.rm(root,{recursive:true,force:true});
  }
});
