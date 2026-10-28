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

test('native datasets retain real directory, metadata and import operations in the supplied layout', {timeout:180000}, async () => {
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
    await element('select[aria-label="目录 公头NG 角色"]');
    await driver.wait(()=>driver.executeScript("return !document.querySelector('.iad-folder-rules')?.textContent.includes('正在预览')"),10000);
    stage='sidebar layout';
    await verifySidebarLayout(driver,path.join(output,'sidebar'));
    stage='layout';
    const measured=await driver.executeScript(()=>{
      const table=document.querySelector('table[aria-label="数据集列表"]'),row=table.querySelector('tbody tr'),panel=document.querySelector('.iad-dataset-detail>.iad-tab-panel'),section=panel.querySelector('.iad-section-layout');
      return {row:row.getBoundingClientRect().height,font:getComputedStyle(table).fontSize,panelBorder:getComputedStyle(panel).borderTopWidth,columns:getComputedStyle(section).gridTemplateColumns,gap:getComputedStyle(section).columnGap};
    });
    assert.equal(measured.font,'13px','数据表使用方案13px字号');assert.ok(Math.abs(measured.row-60)<=1,'方案约60px数据行，含合并边框');assert.equal(measured.panelBorder,'1px');assert.ok(measured.columns.startsWith('180px '));assert.equal(measured.gap,'32px');
    const contentWidth=await driver.executeScript(()=>{const root=document.querySelector('.iad-workbench'),style=getComputedStyle(root);return {available:root.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),list:document.querySelector('.iad-dataset-list').getBoundingClientRect().width,detail:document.querySelector('.iad-dataset-detail').getBoundingClientRect().width};});
    assert.ok(Math.abs(contentWidth.available-contentWidth.list)<2 && Math.abs(contentWidth.available-contentWidth.detail)<2,`数据集内容使用完整桌面宽度：${JSON.stringify(contentWidth)}`);
    assert.equal((await driver.findElements(By.css('.iad-dataset-row td:last-child summary'))).length,0,'删除直接位于操作列');
    const deleteControl=await element('.iad-dataset-row button[aria-label^="删除数据集"]');
    const iconStyle=await driver.executeScript('const s=getComputedStyle(arguments[0]),r=arguments[0].getBoundingClientRect(),svg=arguments[0].querySelector("svg").getBoundingClientRect();return {border:s.borderTopColor,background:s.backgroundColor,width:r.width,height:r.height,icon:svg.width}',deleteControl);
    assert.deepEqual(iconStyle,{border:'rgba(0, 0, 0, 0)',background:'rgba(0, 0, 0, 0)',width:32,height:32,icon:16},'删除与名称编辑采用统一的轻量图标样式');
    await deleteControl.click();await element('dialog[aria-label="删除数据集"]');await button('取消');
    assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',deleteControl),true,'取消删除恢复图标按钮焦点');
    await fs.writeFile(path.join(output,'directories-1920.png'),await driver.takeScreenshot(),'base64');
    assert.equal((await driver.findElements(By.css('.iad-folder-rules tbody tr'))).length,4);
    assert.deepEqual(await driver.executeScript("return [...document.querySelectorAll('.iad-folder-rules select:first-of-type option')].slice(0,4).map(e=>e.value)"),['normal','anomaly','unlabeled','excluded']);
    stage='cancel draft';
    const role=await element('select[aria-label="目录 公头NG 角色"]');const originalRole=await role.getAttribute('value');
    await(await element('select[aria-label="目录 公头NG 角色"] option[value="unlabeled"]')).click();await button('取消更改');
    assert.equal(await(await element('select[aria-label="目录 公头NG 角色"]')).getAttribute('value'),originalRole);
    assert.equal((await api('/datasets/'+dataset.dataset_id)).folder_rules.find(r=>r.path==='公头NG').role,originalRole);
    stage='invalid directory and unsaved guard';
    const directory=await element('input[aria-label="根目录"]');await directory.clear();await directory.sendKeys(path.join(root,'missing-directory'));
    await element('.iad-dataset-detail [role=alert]');
    assert.equal(await(await driver.findElement(By.xpath('//button[normalize-space(.)="保存映射并重新扫描"]'))).isEnabled(),false);
    await(await element('button[aria-label="图像浏览"]')).click();await driver.wait(until.alertIsPresent(),3000);await(await driver.switchTo().alert()).dismiss();
    assert.equal(await(await element('input[aria-label="根目录"]')).getAttribute('value'),path.join(root,'missing-directory'));
    await button('取消更改');await driver.wait(()=>driver.executeScript("return !document.querySelector('.iad-dataset-detail [role=alert]') && !document.querySelector('.iad-folder-rules')?.textContent.includes('正在预览')"),10000);
    assert.equal(await(await element('input[aria-label="根目录"]')).getAttribute('value'),dataset.image_dir);
    stage='basic information';await button('基本信息');
    const basic=await(await element('[aria-label="当前数据集详情"] [role=tabpanel]')).getText();
    for(const text of ['数据集名称','数据格式','图像总数','标注 / 标签','数据集标识',dataset.dataset_id])assert.ok(basic.includes(text),text);
    await(await element('button[aria-label="复制数据集标识"]')).click();await driver.wait(()=>driver.executeScript("return document.querySelector('.iad-dataset-basic [role=status]')?.textContent==='已复制'"),5000);
    await fs.writeFile(path.join(output,'basic-1920.png'),await driver.takeScreenshot(),'base64');
    await(await element('.iad-dataset-detail button[aria-label^="修改数据集名称"]')).click();
    const name=await element('input[aria-label="新的数据集名称"]');await name.clear();await name.sendKeys('真实名称已修改',Key.ENTER);
    await driver.wait(async()=>(await api('/datasets/'+dataset.dataset_id)).name==='真实名称已修改',10000);
    await driver.navigate().refresh();await button('Configure later');await element('.iad-dataset-detail [aria-selected=true]');
    assert.equal(await(await element('.iad-dataset-detail [aria-selected=true]')).getText(),'基本信息');
    stage='responsive';const results=[];
    for(const theme of ['Light','Dark']){
      await setTheme(driver,theme);
      for(const [width,height,zoom] of [[1920,1080,1]]){
        await viewport(driver,width,height);await textZoom(driver,zoom);await button('目录与映射');
        const metrics=await driver.executeScript(()=>{const root=document.querySelector('.iad-workbench'),table=document.querySelector('.iad-folder-rules .iad-table-scroll');return {overflow:root.scrollWidth-root.clientWidth,tableViewport:table.clientWidth,tableWidth:table.scrollWidth,roleHeight:document.querySelector('.iad-folder-rules select').getBoundingClientRect().height};});
        assert.ok(metrics.overflow<=1,JSON.stringify({theme,width,zoom,...metrics}));assert.ok(metrics.roleHeight>=40);
        results.push({theme,width,height,zoom,...metrics});await fs.writeFile(path.join(output,`directories-${theme}-${width}-${zoom}.png`),await driver.takeScreenshot(),'base64');
        await button('基本信息');
        assert.equal(await driver.executeScript("const root=document.querySelector('.iad-workbench');return root.scrollWidth<=root.clientWidth+1"),true,'基本信息及完整标识在桌面不溢出');
        await fs.writeFile(path.join(output,`basic-${theme}-${width}-${zoom}.png`),await driver.takeScreenshot(),'base64');
      }
    }
    await fs.writeFile(path.join(output,'metrics.json'),JSON.stringify(results,null,2));
    stage='keyboard and contrast';
    await verifyWorkbenchLayout(driver,path.join(output,'accessibility'),{pageLabels:['数据集管理'],sizes:[[1920,1080]],zoomLevels:[1]});
    await setTheme(driver,'Light');await viewport(driver,1920,1080);await textZoom(driver,1);
    await button('目录与映射');
    stage='directory browse';
    await button('浏览');await element('[aria-label="根目录浏览"]');await fs.writeFile(path.join(output,'browse.png'),await driver.takeScreenshot(),'base64');await button('关闭');
    stage='search';const search=await element('input[aria-label="搜索数据集"]');await search.sendKeys('does-not-exist');
    assert.equal((await driver.findElements(By.css('.iad-dataset-row'))).length,0);await search.clear();await search.sendKeys('真实名称');assert.equal((await driver.findElements(By.css('.iad-dataset-row'))).length,1);await search.clear();await search.sendKeys(Key.ESCAPE);
    stage='real mapping save';await(await element('select[aria-label="目录 公头NG 角色"] option[value="unlabeled"]')).click();await button('保存映射并重新扫描');await element('[aria-label="扫描结果"]');
    assert.equal((await api('/datasets/'+dataset.dataset_id)).labeled_sample_count,6);
    stage='import labelme';await button('添加数据集');await element('dialog[aria-label="添加数据集"]');
    assert.equal(await driver.executeScript("return getComputedStyle(document.querySelector('dialog.iad-dataset-dialog'),'::backdrop').backgroundColor"),'rgba(17, 30, 51, 0.45)','导入弹窗使用HTML方案遮罩');
    const formatControl=await driver.executeScript(()=>{const label=document.querySelector('.iad-dataset-import [role=radiogroup]>label'),input=label.querySelector('input'),r=input.getBoundingClientRect();return {left:r.left-label.getBoundingClientRect().left,width:r.width};});
    assert.ok(formatControl.left<=20 && formatControl.width<=24,`格式单选框保持原尺寸靠左排列：${JSON.stringify(formatControl)}`);
    await fs.writeFile(path.join(output,'add.png'),await driver.takeScreenshot(),'base64');
    await(await element('#dataset-name')).sendKeys('Labelme真实导入');await(await element('dialog input[aria-label="图像目录"]')).sendKeys(path.join(root,'images'));await(await element('dialog input[aria-label="标注目录"]')).sendKeys(path.join(root,'labels'));await button('导入数据集');
    await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
    const created=(await api('/datasets')).datasets.find(d=>d.name==='Labelme真实导入');assert.equal(created.format,'labelme');assert.equal(created.total_samples,1);
    stage='import dialog responsiveness';
    for(const theme of ['Light','Dark']){
      await setTheme(driver,theme);await button('添加数据集');
      for(const [width,height,zoom] of [[1920,1080,1]]){
        await viewport(driver,width,height);await textZoom(driver,zoom);
        assert.equal(await driver.executeScript("const d=document.querySelector('dialog[aria-label=\"添加数据集\"]');return d.scrollWidth<=d.clientWidth+1"),true,'桌面导入弹窗不溢出');
        await fs.writeFile(path.join(output,`add-${theme}-${width}-${zoom}.png`),await driver.takeScreenshot(),'base64');
      }
      await button('取消');
    }
    stage='configure dataset';
    await(await element('button[aria-label="配置数据集 真实名称已修改"]')).click();
    await driver.wait(()=>driver.executeScript('return document.activeElement?.getAttribute("aria-label")==="当前数据集详情" && document.activeElement.querySelector("h2")?.textContent==="真实名称已修改"'),10000);
    stage='quality history before delete';
    const check=await api('/consistency/start',{subjects:{kind:'datasets',dataset_ids:[created.dataset_id]},corpus_scope:{kind:'datasets',dataset_ids:[dataset.dataset_id]},mode:'exact',request_id:'delete-quality'});
    await driver.wait(async()=>!['PENDING','RUNNING'].includes((await api('/consistency/runs/'+check.batch_id)).status),15000);
    const report=await api('/consistency/report',{selection:{kind:'batch',batch_id:check.batch_id}});
    assert.ok(report.page.total>0,'删除前有真实跨数据集同图证据');
    await(await element('button[aria-label="数据一致性"]')).click();await button('索引与作业');
    await element('[data-batch-id="'+check.batch_id+'"]');
    await button("查看结果");
    await(await element('button[aria-label="数据集管理"]')).click();
    stage='direct delete';
    await(await element('button[aria-label="删除数据集 Labelme真实导入"]')).click();
    await element('dialog[aria-label="删除数据集"]');await button('确认删除');
    await driver.wait(async()=>(await api('/datasets')).datasets.length===1,10000);
    assert.deepEqual((await api('/consistency/runs')).items,[],'删除后批次及索引作业同步清除');
    await(await element('button[aria-label="数据一致性"]')).click();await button('索引与作业');
    await driver.wait(()=>driver.executeScript("return document.querySelector('.iad-consistency')?.textContent.includes('尚无检查作业')"),10000);
    assert.equal((await driver.findElements(By.css('[data-batch-id]'))).length,0);
    await button('重复图组');
    await driver.wait(()=>driver.executeScript("return !document.querySelector('[aria-label=范围一致性结果] [aria-busy=true]') && document.querySelector('[aria-label=范围一致性结果]')?.textContent.includes('尚未执行一致性检查')"),10000);
    assert.equal((await driver.findElements(By.css('.iad-consistency [role=alert]'))).length,0,'已删除批次不残留失效引用');
    for(const label of ['模型审计','人工复核']){
      await(await element('button[aria-label="'+label+'"]')).click();
      await driver.wait(async()=>!(await(await element('select[aria-label="当前数据集"]')).getText()).includes('Labelme真实导入'),10000);
    }
    await fs.access(path.join(root,'images/sample.png'));await fs.access(path.join(root,'labels/sample.json'));
    console.log(JSON.stringify({output,layout:measured,contentWidth,responsiveCases:results.length,realImports:2,realDeletes:1,modelJobsStarted:0}));
  } catch(error) {
    if(driver){await fs.writeFile(path.join(output,'failure.png'),await driver.takeScreenshot(),'base64');console.error(JSON.stringify({stage,text:await driver.executeScript("return document.querySelector('.iad-workbench')?.innerText")}));}throw error;
  } finally {
    await driver?.quit();host.kill('SIGTERM');await Promise.race([new Promise(resolve=>host.once('exit',resolve)),delay(5000)]);if(host.exitCode===null)host.kill('SIGKILL');await fs.rm(root,{recursive:true,force:true});
  }
});
