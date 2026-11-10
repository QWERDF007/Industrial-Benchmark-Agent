const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const {promptDefaults,consistencyTaskPrompts}=await import('../lib/shared/prompt-defaults.generated.js');
  const cases=[
    {page:'方向探索',action:'新建探索',selector:'#exp-prompt',text:'视觉引用使用本轮@v短编号'},
    {page:'知识挖掘',action:'新建挖掘',selector:'#prompt-text',text:promptDefaults.knowledge.normal},
    {page:'数据一致性',action:'新建检查',selector:'#dc-new-prompt',texts:Object.values(consistencyTaskPrompts).map(prompt=>prompt.user)},
    {page:'模型审计',action:'新建审计',selector:'#audit-create-prompt',text:promptDefaults.audit},
  ];
  await fs.mkdir('runs/browser/complete-prompts',{recursive:true});
  for(const spec of cases){
    const options=new firefox.Options().addArguments('-headless');
    options.setBinary('/tmp/iad-firefox128/firefox/firefox');
    const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
    try{
      await driver.manage().window().setRect({width:1904,height:1000});
      await driver.get('http://127.0.0.1:8000/');
      await (await driver.wait(until.elementLocated(By.css(`button[aria-label="${spec.page}"]`)),15000)).click();
      await (await driver.wait(until.elementLocated(By.xpath(`//button[contains(normalize-space(.),"${spec.action}")]`)),10000)).click();
      const editor=await driver.wait(until.elementLocated(By.css(spec.selector)),10000);
      await driver.wait(async()=>{const value=await editor.getAttribute('value');return (spec.texts||[spec.text]).some(text=>value.includes(text));},10000);
      if(spec.page==='知识挖掘'){
        const selected=await driver.executeScript(()=>({
          explored:[...document.querySelectorAll('input[data-dir-kind="explore"]')].map(input=>({id:input.dataset.dirId,checked:input.checked})),
          presets:[...document.querySelectorAll('input[data-dir-kind="preset"]')].map(input=>({id:input.dataset.dirId,checked:input.checked})),
        }));
        assert.ok(selected.explored.length>0,'真实数据应提供可验证的探索方向');
        assert.ok(selected.explored.every(input=>input.checked),'全部实际探索方向默认选中');
        assert.ok(selected.presets.every(input=>!input.checked),'通用预设保留可选，已有探索时不额外默认勾选');
        await fs.writeFile('runs/browser/complete-prompts/knowledge-selection.json',JSON.stringify(selected,null,2));
      }
      assert.equal(await editor.getDomAttribute('readonly'),null);
      assert.equal(await editor.isEnabled(),true);
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',editor);
      await editor.sendKeys(' 用户编辑核验');
      await driver.wait(async()=>(await editor.getAttribute('value')).includes('用户编辑核验'),3000,`${spec.page}提示词编辑应保留用户输入`);
      await fs.writeFile(`runs/browser/complete-prompts/${spec.page}.png`,await driver.takeScreenshot(),'base64');
      console.log('COMPLETE_EDITABLE_PROMPT_PASSED',spec.page);
    }finally{await driver.quit();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
