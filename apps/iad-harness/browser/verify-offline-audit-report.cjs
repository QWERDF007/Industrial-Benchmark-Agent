const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {Builder}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');
(async()=>{
  const root=path.resolve(process.argv[2]||'runs/verification/v58-small-labelme');
  const output=path.resolve(process.argv[3]||'runs/browser/small-labelme');
  const proof=JSON.parse(await fs.readFile(path.join(root,'result.json'),'utf8'));
  const report=JSON.parse(await fs.readFile(path.join(root,'report.json'),'utf8'));
  assert.equal(proof.status,'PASSED');
  assert.equal(report.run_id,proof.stages.audit.run_id);
  assert.equal(report.audited_samples,report.total_samples);
  assert.ok(report.key_evidence.length>0);
  const options=new firefox.Options().addArguments('-headless');
  options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  try{
    await driver.manage().window().setRect({width:1440,height:1000});
    await driver.get(pathToFileURL(path.join(root,'report.html')).href);
    await driver.wait(async()=>driver.executeScript(min=>document.images.length>=min&&[...document.images].every(img=>img.complete&&img.naturalWidth>0),report.key_evidence.length),20000);
    const images=await driver.executeScript(()=>[...document.images].map(img=>({embedded:img.src.startsWith('data:image/'),width:img.naturalWidth,height:img.naturalHeight})));
    assert.ok(images.every(img=>img.embedded&&img.width>0&&img.height>0));
    await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,'offline-report.png'),await driver.takeScreenshot(),'base64');
    await fs.writeFile(path.join(output,'report-verified.json'),JSON.stringify({status:'PASSED',audit_run_id:report.run_id,
      samples:report.total_samples,embedded_images:images.length},null,2));
    console.log('OFFLINE_AUDIT_REPORT_PASSED',report.run_id,images.length);
  }finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
