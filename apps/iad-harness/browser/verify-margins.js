import fs from 'node:fs';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

async function main() {
  const options = new firefox.Options().addArguments('-headless');
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver'))
    .build();

  const results = {
    datasets: {},
    images: {},
    aligned: false,
    errors: [],
  };

  try {
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    console.log('Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss any welcome modal if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // 1. Measure 数据集管理 (industrial-datasets)
    console.log('Measuring 数据集管理...');
    const dsNavBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='数据集管理' or contains(., '数据集管理')]")), 5000);
    await dsNavBtn.click();
    await driver.sleep(1500);

    const dsWorkbench = await driver.findElement(By.className('iad-workbench'));
    const dsHeader = await driver.findElement(By.className('iad-header'));
    const dsBreadcrumb = await driver.findElement(By.className('iad-breadcrumb'));
    const dsTable = await driver.findElement(By.className('dataset-table'));

    const dsWbRect = await dsWorkbench.getRect();
    const dsHdrRect = await dsHeader.getRect();
    const dsBcRect = await dsBreadcrumb.getRect();
    const dsTblRect = await dsTable.getRect();

    const dsPadding = await driver.executeScript(`
      const s = window.getComputedStyle(arguments[0]);
      return { top: s.paddingTop, right: s.paddingRight, bottom: s.paddingBottom, left: s.paddingLeft };
    `, dsWorkbench);

    results.datasets = {
      workbenchRect: dsWbRect,
      workbenchPadding: dsPadding,
      headerRect: dsHdrRect,
      breadcrumbRect: dsBcRect,
      contentRightMargin: dsWbRect.x + dsWbRect.width - (dsTblRect.x + dsTblRect.width),
    };
    console.log('Datasets metrics:', results.datasets);

    const dsShot = await driver.takeScreenshot();
    fs.writeFileSync('/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df/aligned_datasets.png', dsShot, 'base64');

    // 2. Measure 图像浏览 (industrial-images)
    console.log('Measuring 图像浏览...');
    const imgNavBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='图像浏览' or contains(., '图像浏览')]")), 5000);
    await imgNavBtn.click();
    await driver.sleep(1500);

    const imgWorkbench = await driver.findElement(By.className('iad-workbench'));
    const imgHeader = await driver.findElement(By.className('iad-header'));
    const imgBreadcrumb = await driver.findElement(By.className('iad-breadcrumb'));
    const imgFilterBar = await driver.findElement(By.className('filter-bar'));

    const imgWbRect = await imgWorkbench.getRect();
    const imgHdrRect = await imgHeader.getRect();
    const imgBcRect = await imgBreadcrumb.getRect();
    const imgFbRect = await imgFilterBar.getRect();

    const imgPadding = await driver.executeScript(`
      const s = window.getComputedStyle(arguments[0]);
      return { top: s.paddingTop, right: s.paddingRight, bottom: s.paddingBottom, left: s.paddingLeft };
    `, imgWorkbench);

    results.images = {
      workbenchRect: imgWbRect,
      workbenchPadding: imgPadding,
      headerRect: imgHdrRect,
      breadcrumbRect: imgBcRect,
      contentRightMargin: imgWbRect.x + imgWbRect.width - (imgFbRect.x + imgFbRect.width),
    };
    console.log('Images metrics:', results.images);

    const imgShot = await driver.takeScreenshot();
    fs.writeFileSync('/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df/aligned_images.png', imgShot, 'base64');

    // 3. Verify alignment
    const xAligned = Math.abs(dsBcRect.x - imgBcRect.x) < 2;
    const yAligned = Math.abs(dsBcRect.y - imgBcRect.y) < 2;
    const paddingAligned = dsPadding.top === imgPadding.top && dsPadding.left === imgPadding.left && dsPadding.right === imgPadding.right;
    const rightMarginAligned = Math.abs(results.datasets.contentRightMargin - results.images.contentRightMargin) < 2;

    results.aligned = xAligned && yAligned && paddingAligned && rightMarginAligned;
    console.log('ALIGNMENT RESULTS:');
    console.log('  xAligned (breadcrumb x):', xAligned, `(${dsBcRect.x} vs ${imgBcRect.x})`);
    console.log('  yAligned (breadcrumb y):', yAligned, `(${dsBcRect.y} vs ${imgBcRect.y})`);
    console.log('  paddingAligned:', paddingAligned, dsPadding, 'vs', imgPadding);
    console.log('  rightMarginAligned:', rightMarginAligned, `(${results.datasets.contentRightMargin} vs ${results.images.contentRightMargin})`);
    console.log('  OVERALL ALIGNED:', results.aligned);

    if (!results.aligned) {
      throw new Error(`Alignment mismatch: x=${xAligned}, y=${yAligned}, padding=${paddingAligned}, rightMargin=${rightMarginAligned}`);
    }
  } catch (err) {
    console.error('Error during verification:', err);
    results.errors.push(err.message);
  } finally {
    await driver.quit();
  }
}

main();
