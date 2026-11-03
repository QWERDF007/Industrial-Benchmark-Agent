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

    // Dismiss welcome
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // Navigate to 图像浏览
    const navBtn = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='图像浏览' or contains(., '图像浏览')]")), 5000);
    await navBtn.click();
    await driver.sleep(1500);

    // Click first card to open detail modal
    console.log('Opening detail modal...');
    const firstCard = await driver.wait(until.elementLocated(By.css('.card[data-idx="0"]')), 5000);
    await firstCard.click();
    await driver.sleep(1000);

    // Click "点击查看大图"
    console.log('Opening fullscreen viewer...');
    const previewBtn = await driver.wait(until.elementLocated(By.id('detail-preview')), 3000);
    await previewBtn.click();
    await driver.sleep(1000);

    // Verify fullscreen viewer and toolbar order
    const fullToolbar = await driver.wait(until.elementLocated(By.className('full-toolbar')), 3000);
    const actions = await fullToolbar.findElement(By.className('full-actions'));

    // Check direct children of .full-actions
    const actionChildren = await actions.findElements(By.xpath('./*'));
    console.log('Action children count:', actionChildren.length);

    const elementsInfo = [];
    for (let i = 0; i < actionChildren.length; i++) {
      const child = actionChildren[i];
      const tag = await child.getTagName();
      const id = await child.getAttribute('id');
      const className = await child.getAttribute('class');
      const title = await child.getAttribute('title');
      const text = await child.getText();
      elementsInfo.push({ index: i, tag, id, className, title, text: text.trim().replace(/\n/g, ' ') });
    }
    console.log('Toolbar actions order:', JSON.stringify(elementsInfo, null, 2));

    // Assert sequence:
    // 0: zoom-out (缩小)
    // 1: zoom-wrap (zoom select)
    // 2: zoom-in (放大)
    // 3: fit (适用窗口)
    // 4: annotation-toggle (查看/隐藏标注)
    // 5: full-close (关闭)
    const expected = ['zoom-out', 'zoom-wrap', 'zoom-in', 'fit', 'annotation-toggle', 'full-close'];
    const actual = elementsInfo.map(e => e.id || e.className);
    console.log('Expected ids/classes:', expected);
    console.log('Actual ids/classes:  ', actual);

    let match = true;
    for (let i = 0; i < expected.length; i++) {
      if (!actual[i] || !actual[i].includes(expected[i])) {
        match = false;
        console.error(`Mismatch at position ${i}: expected ${expected[i]}, got ${actual[i]}`);
      }
    }

    if (!match) {
      throw new Error('Toolbar order does not match requested order!');
    }

    // Take screenshot of toolbar
    const tbScreenshot = await fullToolbar.takeScreenshot();
    fs.writeFileSync('/data1/wt/tmp/fullscreen_toolbar_order.png', Buffer.from(tbScreenshot, 'base64'));
    console.log('Saved /data1/wt/tmp/fullscreen_toolbar_order.png');

    // Take screenshot of full dialog
    const fullDialog = await driver.findElement(By.className('full-dialog'));
    const fdScreenshot = await fullDialog.takeScreenshot();
    fs.writeFileSync('/data1/wt/tmp/fullscreen_viewer_full.png', Buffer.from(fdScreenshot, 'base64'));
    console.log('Saved /data1/wt/tmp/fullscreen_viewer_full.png');

    console.log('SUCCESS! Toolbar order verified perfectly.');
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

main();
