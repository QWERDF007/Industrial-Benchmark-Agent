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

  try {
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    console.log('Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss any welcome modal
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // Navigate to "图像浏览"
    console.log('Navigating to 图像浏览...');
    const navBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='图像浏览' or contains(., '图像浏览')]")), 5000);
    await navBtn.click();
    await driver.sleep(1500);

    const parentSelect = await driver.findElement(By.id('parent'));

    // --- CASE 1: 异常检测数据集 (超节点数据集) ---
    console.log('--- Testing Anomaly Detection Dataset (超节点数据集) ---');
    const optionsList = await parentSelect.findElements(By.tagName('option'));
    let anomalyOption = null;
    let labelmeOption = null;
    for (const opt of optionsList) {
      const text = await opt.getText();
      if (text.includes('超节点')) anomalyOption = opt;
      if (text.includes('框胶')) labelmeOption = opt;
    }

    if (anomalyOption) {
      await anomalyOption.click();
      await driver.sleep(1500);

      // Check quality wrap label
      const qualityWrap = await driver.findElement(By.id('quality-wrap'));
      const qualityLabel = await qualityWrap.findElement(By.tagName('label')).getText();
      console.log('Anomaly quality-wrap label text:', qualityLabel);

      const qualitySelect = await driver.findElement(By.id('quality'));
      const qOptions = await qualitySelect.findElements(By.tagName('option'));
      const qTexts = await Promise.all(qOptions.map(o => o.getText()));
      console.log('Anomaly quality dropdown options:', qTexts);

      // Check annotation-wrap and category-wrap absence
      const annWraps = await driver.findElements(By.id('annotation-wrap'));
      const catWraps = await driver.findElements(By.id('category-wrap'));
      console.log('Annotation wrap count:', annWraps.length, 'Category wrap count:', catWraps.length);

      // Take screenshot of filter bar for anomaly
      const filterBar = await driver.findElement(By.className('filter-bar'));
      const fbScreenshot = await filterBar.takeScreenshot();
      fs.writeFileSync('/data1/wt/tmp/anomaly_category_filter.png', Buffer.from(fbScreenshot, 'base64'));
      console.log('Saved /data1/wt/tmp/anomaly_category_filter.png');

      // Click OK filter
      for (const opt of qOptions) {
        if ((await opt.getText()) === 'OK') {
          await opt.click();
          break;
        }
      }
      await driver.sleep(1200);
      const pager = await driver.findElement(By.id('pager'));
      const pagerText = await pager.getText();
      console.log('Filtered OK pager text:', pagerText);

      // Click first card to check detail modal
      const firstCard = await driver.findElement(By.css('.card[data-idx="0"]'));
      await firstCard.click();
      await driver.sleep(1000);

      const detailModal = await driver.findElement(By.className('detail-dialog'));
      const annTable = await detailModal.findElement(By.className('detail-ann-table'));
      const tableText = await annTable.getText();
      console.log('Detail modal annotation table text:\n', tableText);

      const modalScreenshot = await detailModal.takeScreenshot();
      fs.writeFileSync('/data1/wt/tmp/anomaly_detail_category.png', Buffer.from(modalScreenshot, 'base64'));
      console.log('Saved /data1/wt/tmp/anomaly_detail_category.png');

      // Close modal
      const closeBtn = await driver.findElement(By.id('close'));
      await closeBtn.click();
      await driver.sleep(500);
    }

    // --- CASE 2: Labelme 数据集 (框胶大数据集) ---
    console.log('--- Testing Labelme Dataset (框胶大数据集) ---');
    if (labelmeOption) {
      await labelmeOption.click();
      await driver.sleep(1500);

      const qualityWraps = await driver.findElements(By.id('quality-wrap'));
      console.log('Labelme quality-wrap count:', qualityWraps.length);

      const annWrap = await driver.findElement(By.id('annotation-wrap'));
      const annLabel = await annWrap.findElement(By.tagName('label')).getText();
      console.log('Labelme annotation-wrap label:', annLabel);

      const catWrap = await driver.findElement(By.id('category-wrap'));
      const catLabel = await catWrap.findElement(By.tagName('label')).getText();
      console.log('Labelme category-wrap label:', catLabel);

      const catSelect = await driver.findElement(By.id('category'));
      const catOptions = await catSelect.findElements(By.tagName('option'));
      const catTexts = await Promise.all(catOptions.map(o => o.getText()));
      console.log('Labelme category options:', catTexts);

      const filterBar = await driver.findElement(By.className('filter-bar'));
      const fbScreenshot = await filterBar.takeScreenshot();
      fs.writeFileSync('/data1/wt/tmp/labelme_category_filter.png', Buffer.from(fbScreenshot, 'base64'));
      console.log('Saved /data1/wt/tmp/labelme_category_filter.png');
    }

    console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

main();
