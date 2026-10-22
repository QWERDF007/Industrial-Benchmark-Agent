import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('authenticated LAN browser saves provider settings and switches models', {timeout: 90000}, async () => {
  const address = Object.values(os.networkInterfaces()).flat().find(item => item?.family === 'IPv4' && !item.internal)?.address;
  assert.ok(address, 'LAN interface required to exercise non-loopback browser settings');
  const calls = [];
  const external = http.createServer(async (req, res) => {
    const chunks=[]; for await (const chunk of req) chunks.push(chunk);
    const body=chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    calls.push({path:req.url, authorization:req.headers.authorization, body});
    const model = req.url.startsWith('/second/') ? 'second-model' : 'first-model';
    let result;
    if (req.url.endsWith('/models')) result={data:[{id:model}]};
    else if (req.url.endsWith('/tokenize')) result={count:1000,max_model_len:262144};
    else {
      const evidence=body.messages[0].content.filter(row=>row.type==='text' && row.text.startsWith('视觉证据：')).map(row=>JSON.parse(row.text.slice(5)));
      const ids=evidence.map(row=>row.evidence_id), view={description:'观察到主体',position_analysis:'居中',illumination_analysis:'均匀'};
      const schema=body.response_format.json_schema.name; let answer;
      if(schema==='DirectionDraft') answer={summary:'比较图组',directions:[{title:'主体轮廓',instruction:'观察轮廓完整性',applies_to:'both',rationale:'主体清晰',evidence_ids:ids,limitations:[]}],limitations:[]};
      else if(schema==='JointAnalysis') {
        const checks=JSON.parse(body.messages[0].content[0].text.split('冻结知识：')[1].split('\n')[0]).checks;
        answer={...view,suggested_label:'PASS',reason_category:'NORMAL',confidence:0.8,evidence_ids:ids,global_view:view,
          region_observations:evidence.filter(row=>row.role==='roi' && row.representation==='raw').map((_,index)=>({...view,region_index:index+1})),
          check_assessments:checks.map(check=>({...view,check_id:check.check_id,status:'normal',evidence_ids:ids})),findings:[]};
      } else if(schema==='KnowledgeVerification') {
        const scope=JSON.parse(body.messages[0].content[0].text.split('待核验疑点：')[1].split('\n请根据图像')[0]);
        answer={findings:scope.findings.map(target=>({finding_id:target.finding_id,status:'insufficient',affected_check_titles:[],description:'合成验证仅核对路由',normal_explanation:'需人工核实',limitations:['隔离测试'],evidence_ids:ids,conflicts:[]}))};
      } else answer={summary:'可见部件知识',checks:[{title:'轮廓可见',subject:'主体',location:'全图',criterion:'主体轮廓可见',allowed_variations:[],support_evidence_ids:ids,counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[]};
      result={choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]};
    }
    res.writeHead(200, {'Content-Type':'application/json'});res.end(JSON.stringify(result));
  });
  await new Promise(resolve=>external.listen(0,'127.0.0.1',resolve));
  const modelBase=`http://127.0.0.1:${external.address().port}`;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-model-settings-'));
  execFileSync('/home/dell/anaconda3/envs/iad_agent/bin/python',[path.join(workspace,'apps/iad-harness/test/fixtures/knowledge_dataset.py'),root]);
  const profile = path.join(root, 'home/profiles/web');
  await fs.mkdir(profile, {recursive: true});
  await fs.mkdir(path.join(profile, 'node_modules/@industrial-benchmark'), {recursive: true});
  await fs.symlink(path.join(workspace, 'apps/iad-harness'), path.join(profile, 'node_modules/@industrial-benchmark/iad-harness'));
  await fs.writeFile(path.join(profile, 'package.json'), JSON.stringify({name: 'iad-model-settings', private: true, type: 'module',
    dsh: {profile: {bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']}}}));
  await fs.writeFile(path.join(profile, 'cordis.yml'), '[]\n');
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, '0.0.0.0', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const patch = path.join(root, 'host.patch.yml');
  await fs.writeFile(patch, `- id: webserver
  config:
    host: 0.0.0.0
    port: ${port}
- insert:
    - id: industrial-harness-plugin
      name: '@industrial-benchmark/iad-harness'
      config:
        cwd: ${JSON.stringify(workspace)}
        dbPath: ${JSON.stringify(path.join(root, 'workbench.db'))}
`);
  await fs.writeFile(path.join(profile, 'cordis.patch.yml'), `- id: ui-settings-general
  config:
    welcomeNoticeVersion: 2026-09-28.1
- id: llm-pi-ai
  config:
    providers:
      first-service:
        displayName: First service
        api: openai-completions
        baseURL: ${modelBase}/first/v1
        apiKeyEnv: IAD_FIRST_TEST_KEY
        models:
          - id: first-model
            name: First model
            input: [text, image]
      second-service:
        displayName: Second service
        api: openai-completions
        baseURL: ${modelBase}/second/v1
        apiKeyEnv: IAD_SECOND_TEST_KEY
        models:
          - id: second-model
            name: Second model
            input: [text, image]
- id: agent-default-model
  config:
    provider: first-service
    model: first-model
`);
  const host = spawn(process.env.IAD_NODE_PATH || process.execPath,
    [path.join(workspace, 'node_modules/@deepseek-ai/dsh/lib/bin.js'), '--profile', 'web', '--patch', patch, '--port', String(port), '--no-open'],
    {cwd: workspace, env: {...process.env, DSH_HOME: path.join(root, 'home'), IAD_FIRST_TEST_KEY:'first-isolated-key', IAD_SECOND_TEST_KEY:'second-isolated-key', IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'}, stdio: ['ignore', 'pipe', 'pipe']});
  let log = '', driver, phase = 'startup';
  host.stdout.on('data', data => {log += data;}); host.stderr.on('data', data => {log += data;});
  try {
    const deadline = Date.now() + 30000;
    while (!log.match(/http:\/\/[^\s)]+/) && host.exitCode === null && Date.now() < deadline) await delay(100);
    const login = log.match(/http:\/\/[^\s)]+/)?.[0];
    assert.ok(login, log.replace(/(token=)[^\s&]+/g, '$1<redacted>'));
    const url = new URL(login); url.hostname = address;
    const options = new firefox.Options().addArguments('-headless');
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || 'geckodriver')).build();
    await driver.manage().window().setRect({width: 1440, height: 1000});
    await driver.get(url.href);
    const api = async (body, route='/models') => driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[1],arguments[0]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[0])}:undefined).then(async response=>done({status:response.status,data:await response.json()})).catch(error=>done({error:String(error)}));`, body || null, route);
    const click = async text => (await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)), 15000)).click();
    const openModels = async () => {
      await driver.wait(async () => {
        const tabs = await driver.findElements(By.xpath("//button[normalize-space(.)='Models']"));
        if (tabs.length && await tabs[0].isDisplayed()) return true;
        for (const text of ['Configure later', 'Continue']) {
          const buttons = await driver.findElements(By.xpath(`//button[.='${text}']`));
          if (buttons.length && await buttons[0].isDisplayed()) await buttons[0].click();
        }
        const buttons = await driver.findElements(By.css('button[aria-label="Settings"]'));
        if (!buttons.length || !await buttons[0].isDisplayed()) return false;
        try {await buttons[0].click(); return false;}
        catch (error) {
          if (['ElementNotInteractableError', 'ElementClickInterceptedError'].includes(error.name)) return false;
          throw error;
        }
      }, 15000);
      await click('Models');
    };
    phase = 'open settings';
    await openModels();
    phase = 'load providers';
    await driver.wait(async () => {
      const text = await driver.findElement(By.css('body')).getText();
      assert.ok(!text.includes('settings are unavailable in this browser'), 'settings are unavailable in this browser');
      return text.includes('First service') && text.includes('Second service');
    }, 10000);
    phase = 'shared workbench configuration';
    const initial = await api();
    assert.equal(initial.status, 200, JSON.stringify(initial));
    const configured = await api({expected_revision: initial.data.revision, selection: {provider_id: 'first-service', model_id: 'first-model', limits: {capacity_mode: 'vllm_tokenize'}}});
    assert.equal(configured.status, 200, JSON.stringify(configured));
    assert.equal(configured.data.ready, true);
    const staleChoice=await api({expected_revision:initial.data.revision,selection:configured.data.selection});
    assert.notEqual(staleChoice.status,200);
    for (const selection of [
      {...configured.data.selection,model_id:'missing-model'},
      {...configured.data.selection,limits:{capacity_mode:null}},
      {...configured.data.selection,provider_id:'deepseek'},
    ]) assert.equal((await api({expected_revision:configured.data.revision,selection})).status,422);
    await (await driver.findElement(By.css('button[aria-label^="Edit First service"]'))).click();
    await (await driver.findElement(By.xpath("//summary[normalize-space(.)='Customized settings']"))).click();
    const name = await driver.findElement(By.css('input[aria-label="Display name"]'));
    await name.clear(); await name.sendKeys('Renamed first service');
    await click('Apply');
    phase = 'save provider';
    await driver.wait(async () => (await driver.findElement(By.css('body')).getText()).includes('Renamed first service'), 10000);
    await driver.navigate().refresh();
    phase = 'reload settings';
    await openModels();
    await driver.wait(async () => (await driver.findElement(By.css('body')).getText()).includes('Renamed first service'), 10000);
    const close = await driver.findElements(By.css('button[aria-label="Close"],button[aria-label="Close settings"]'));
    if (close.length) await close[0].click(); else await driver.actions().sendKeys('\uE00C').perform();
    const selector = await driver.wait(until.elementLocated(By.css('button[aria-label^="Select model,"]')), 10000);
    await selector.click();
    phase = 'switch model';
    await (await driver.wait(until.elementLocated(By.xpath("//button[@role='menuitem'][starts-with(normalize-space(.),'Model')]")), 10000)).click();
    await click('Second model');
    await driver.wait(async () => (await selector.getAttribute('aria-label')).includes('Second model'), 10000);
    assert.equal((await api()).data.selection.model_id, 'first-model', 'DSH session selection must not change the shared workbench model');
    phase = 'independent model settings page';
    await (await driver.wait(until.elementLocated(By.css('button[aria-label="模型设置"]')), 10000)).click();
    await driver.wait(until.elementLocated(By.css('[data-page="industrial-model-settings"]')), 10000);
    const chapter = await driver.findElement(By.css('[aria-label="所在章节"]'));
    assert.equal(await chapter.getText(),'工具');
    const headingSize = await driver.executeScript('return parseFloat(getComputedStyle(document.querySelector(".iad-workbench h1")).fontSize)');
    assert.ok(headingSize >= 28, 'shared page title follows the approved type scale');
    const navigation = await driver.wait(until.elementLocated(By.css('nav[aria-label="工业工作台导航"]')), 5000);
    const navigationText = await navigation.getText();
    for (const chapter of ['数据准备','知识构建','质量审核']) assert.ok(navigationText.includes(chapter));
    const workspaces = await driver.findElement(By.css('details[data-native-workspaces]'));
    assert.equal(await workspaces.getAttribute('open'),null,'native workspaces start folded on business pages');
    await workspaces.findElement(By.css('summary')).click();
    assert.ok((await workspaces.getText()).includes('Default workspace'));
    await workspaces.findElement(By.css('summary')).click();
    assert.equal((await driver.findElements(By.css('select[aria-label="当前数据集"]'))).length, 0);
    assert.equal(await (await driver.findElement(By.css('select[aria-label="工作台提供商"]'))).getAttribute('value'), 'first-service');
    assert.equal(await (await driver.findElement(By.css('select[aria-label="工作台模型"]'))).getAttribute('value'), 'first-model');
    await click('检查连接');
    await driver.wait(async()=>(await driver.findElement(By.css('[data-page]')).getText()).includes('连接正常'),10000);
    assert.equal(calls.length,2);
    assert.ok(calls.every(call=>call.authorization==='Bearer first-isolated-key' && (!call.body || call.body.model==='first-model')));
    await click('提供商');
    await click('添加提供商');
    await (await driver.findElement(By.css('input[aria-label="提供商名称"]'))).sendKeys('Added service');
    await (await driver.findElement(By.css('input[aria-label="服务地址"]'))).sendKeys(modelBase+'/second/v1');
    await (await driver.findElement(By.css('input[aria-label="API 密钥"]'))).sendKeys('new-isolated-key');
    await click('读取模型');
    await driver.wait(until.elementLocated(By.css('input[aria-label="模型 ID 1"]')),10000);
    assert.equal(await (await driver.findElement(By.css('input[aria-label="模型 ID 1"]'))).getAttribute('value'),'second-model');
    const image=await driver.findElement(By.css('.iad-provider-model input[type="checkbox"]'));
    if (!await image.isSelected()) await image.click();
    await click('保存提供商');
    await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,10000);
    const afterAdd=await api();
    const added=afterAdd.data.providers.find(row=>row.name==='Added service');
    assert.ok(added,JSON.stringify(afterAdd)); assert.ok(added.editable && added.removable && added.credential_configured);
    assert.ok(!JSON.stringify(afterAdd).includes('new-isolated-key'));
    const stale=await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/models/providers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[0])}).then(async r=>done({status:r.status,data:await r.json()}));`,
      {expected_revision: initial.data.provider_revision,provider_id:added.provider_id,name:'Stale',endpoint:modelBase+'/second/v1',models:added.models});
    assert.notEqual(stale.status,200,'stale native profile revision must reject writes');
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('[data-page="industrial-model-settings"]')),10000);
    await click('提供商');
    await driver.wait(async()=>(await driver.findElement(By.css('[data-page]')).getText()).includes('Added service'),10000);
    await (await driver.findElement(By.css('button[aria-label="删除提供商 Added service"]'))).click();
    await click('确认删除');
    await driver.wait(async()=>!(await api()).data.providers.some(row=>row.provider_id===added.provider_id),10000);
    assert.equal((await api()).data.selection.model_id,'first-model');
    phase='all industrial functions share selected routing';
    const imported=await api({format:'labelme',name:'Model route test',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')},'/datasets/import');
    assert.equal(imported.status,200);const dataset=imported.data.dataset_id;
    const waitJob=async(kind,job)=>{
      assert.equal(job.status,200,JSON.stringify(job));
      return driver.wait(async()=>{const result=await api(null,`/${kind}/status/${job.data.run_id}`);return !['RUNNING','PENDING'].includes(result.data.status)?result.data:false;},15000);
    };
    const exploration=await waitJob('exploration',await api({dataset_id:dataset,normal_images:[dataset+':part-0.png'],defect_images:[dataset+':part-2.png']},'/exploration/start'));
    assert.equal(exploration.status,'COMPLETED',JSON.stringify(exploration.errors));
    const normal=await waitJob('knowledge',await api({kind:'normal',image_count:2,images:[dataset+':part-0.png',dataset+':part-1.png'],knowledge_preset:[]},'/knowledge/start'));
    assert.equal(normal.status,'COMPLETED',JSON.stringify(normal.errors));
    const defect=await waitJob('knowledge',await api({kind:'defect',image_count:1,images:[dataset+':part-2.png'],knowledge_preset:[normal.knowledge_version_id]},'/knowledge/start'));
    assert.equal(defect.status,'COMPLETED',JSON.stringify(defect.errors));
    const audit=await waitJob('audit',await api({dataset_id:dataset,normal_version_id:normal.knowledge_version_id,sample_ids:[dataset+':part-2.png']},'/audit/start'));
    assert.equal(audit.status,'COMPLETED',JSON.stringify(audit.errors));
    for(const job of [exploration,normal,defect,audit]) {
      assert.equal(job.model_profile.provider_id,'first-service');assert.equal(job.model_name,'first-model');
      assert.ok(!JSON.stringify(job).includes('isolated-key'));
    }
    const generations=calls.filter(row=>row.body?.response_format);
    assert.ok(generations.length>=4);
    assert.ok(generations.every(row=>row.path.startsWith('/first/') && row.body.model==='first-model' && row.authorization==='Bearer first-isolated-key'));

    const selectionBeforeDelete=(await api()).data;
    const removed=await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/models/providers/first-service?expected_revision='+arguments[0],{method:'DELETE'}).then(async r=>done({status:r.status,data:await r.json()}));`,selectionBeforeDelete.provider_revision);
    assert.equal(removed.status,200,JSON.stringify(removed));
    assert.equal(removed.data.ready,false);
    assert.equal(removed.data.selection.provider_id,'first-service','removed references must not silently select another provider');
    const rejected=await api({dataset_id:dataset,normal_images:[dataset+':part-0.png'],defect_images:[dataset+':part-2.png']},'/exploration/start');
    assert.equal(rejected.status,422);

    await driver.manage().window().setRect({width:390,height:844});
    assert.equal(await driver.executeScript('return document.documentElement.scrollWidth > innerWidth'),false,'settings must fit narrow screens');
  } catch (error) {
    if (driver) {
      console.error(phase + '\n' + (await driver.findElement(By.css('body')).getText()).slice(-4500));
      await fs.writeFile(path.join(os.tmpdir(), 'iad-model-settings-failure.png'), await driver.takeScreenshot(), 'base64');
    }
    console.error(log.slice(-3500).replace(/(token=)[^\s&]+/g, '$1<redacted>'));
    throw error;
  } finally {
    await driver?.quit(); host.kill('SIGTERM');
    await Promise.race([new Promise(resolve => host.once('exit', resolve)), delay(3000)]);
    if (host.exitCode === null) host.kill('SIGKILL');
    await new Promise(resolve=>external.close(resolve));
    await fs.rm(root, {recursive: true, force: true});
  }
});
