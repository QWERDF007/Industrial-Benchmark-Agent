import fs from 'node:fs/promises';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

async function main() {
  const options = new firefox.Options().addArguments('-headless');
  options.setPreference('javascript.options.intl_segmenter', true);
  if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver'))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });

    const logContent = await fs.readFile('runs/dsh_web.log', 'utf8');
    const match = logContent.match(/http:\/\/127\.0\.0\.1:8000\/\?token=[^\s)]+/);
    if (!match) throw new Error('Could not find login URL in runs/dsh_web.log');
    const loginUrl = match[0];
    console.log('Accessing:', loginUrl);

    await driver.get(loginUrl);
    await new Promise(r => setTimeout(r, 6000));
    const fullHtml = await driver.executeScript('return document.documentElement.outerHTML');
    await fs.writeFile('/tmp/rendered.html', fullHtml);
    console.log('Saved /tmp/rendered.html, length:', fullHtml.length);

    const el = (selector, timeout = 10000) => driver.wait(until.elementLocated(By.css(selector)), timeout);

    // If welcome popup appears, dismiss it
    try {
      const laterBtn = await driver.wait(
        until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later" or normalize-space(.)="稍后配置"]')),
        4000
      );
      await laterBtn.click();
      console.log('Dismissed welcome dialog.');
    } catch {
      // No welcome dialog
    }

    // Click navigation button for datasets
    try {
      const navBtn = await driver.wait(
        until.elementLocated(By.css('button[aria-label="数据集管理"], [data-view-id="industrial-datasets"]')),
        8000
      );
      await driver.executeScript('arguments[0].click()', navBtn);
      console.log('Clicked 数据集管理 navigation.');
    } catch (err) {
      console.log('Navigation button not found directly, checking page content...');
    }

    // Wait for dataset manager table
    const tableEl = await el('table.dataset-table', 10000);
    console.log('Dataset table located successfully!');

    // Wait for parent row group-1 and child rows to be loaded
    const groupRow = await el('tr.data-row.parent-row[data-id="group-1"]', 5000);
    console.log('Parent group row group-1 located!');

    // Wait for child datasets to be fetched and rendered
    await driver.wait(until.elementLocated(By.css('tr.data-row:not(.parent-row)')), 10000);
    console.log('Child dataset rows rendered!');

    // Check table rows
    const rows = await driver.executeScript(() => {
      return Array.from(document.querySelectorAll('table.dataset-table tr')).map(r => ({
        className: r.className,
        datasetId: r.getAttribute('data-id'),
        text: r.textContent.trim().slice(0, 50)
      }));
    });
    console.log('Table rows in live DOM:', rows);

    // Check table styles
    const measured = await driver.executeScript(() => {
      const table = document.querySelector('table.dataset-table');
      const thLast = table.querySelector('th:last-child');
      const parentRow = table.querySelector('tr.parent-row');
      const childRow = table.querySelector('tr.data-row:not(.parent-row)');
      const pencil = childRow.querySelector('.pencil');
      const actions = childRow.querySelector('.actions');
      const drawer = document.querySelector('.dataset-drawer');
      return {
        tableFont: getComputedStyle(table).fontSize,
        rowHeight: parentRow?.getBoundingClientRect().height,
        headerAlign: getComputedStyle(thLast).textAlign,
        pencilMarginLeft: getComputedStyle(pencil).marginLeft,
        actionsJustify: getComputedStyle(actions).justifyContent,
        childPaddingLeft: getComputedStyle(childRow.querySelector('.name-area')).paddingLeft,
        drawerWidth: drawer?.getBoundingClientRect().width,
      };
    });
    console.log('Measured table properties:', measured);

    // Save screenshots
    const runsDir = 'runs/browser/live-verification';
    await fs.mkdir(runsDir, { recursive: true });
    const screen1 = await driver.takeScreenshot();
    await fs.writeFile(path.join(runsDir, '01_live_datasets_table.png'), Buffer.from(screen1, 'base64'));
    console.log('Saved screenshot: 01_live_datasets_table.png');

    // Select child dataset
    const childRow = await driver.findElement(By.css('tr.data-row[data-id="ds_8bf1c1e9ef8042869adb044a36b7e2a0"]'));
    await driver.executeScript('arguments[0].click()', childRow);

    await el('.dataset-drawer .identifier-section', 5000);
    const subTitle = await (await driver.findElement(By.css('#detailSub'))).getText();
    const idValue = await (await driver.findElement(By.css('.identifier-section .identifier-value span'))).getText();
    console.log('Child drawer subtitle:', subTitle, 'identifier:', idValue);

    const screen2 = await driver.takeScreenshot();
    await fs.writeFile(path.join(runsDir, '02_live_child_drawer.png'), Buffer.from(screen2, 'base64'));
    console.log('Saved screenshot: 02_live_child_drawer.png');

    // Click parent group-1
    await driver.executeScript('arguments[0].click()', groupRow);
    await driver.wait(async () => {
      const text = await (await driver.findElement(By.css('#detailSub'))).getText();
      return text === '数据集';
    }, 5000);
    const parentSub = await (await driver.findElement(By.css('#detailSub'))).getText();
    const parentId = await (await driver.findElement(By.css('.identifier-section .identifier-value span'))).getText();
    console.log('Parent drawer subtitle:', parentSub, 'identifier:', parentId);

    const screen3 = await driver.takeScreenshot();
    await fs.writeFile(path.join(runsDir, '03_live_parent_drawer.png'), Buffer.from(screen3, 'base64'));
    console.log('Saved screenshot: 03_live_parent_drawer.png');

    console.log('ALL LIVE VERIFICATIONS PASSED IN REAL DSH INSTANCE (PORT 8000)!');
  } finally {
    await driver.quit();
  }
}

main().catch(err => {
  console.error('Live verification failed:', err);
  process.exit(1);
});
