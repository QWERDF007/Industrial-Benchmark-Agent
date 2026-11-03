import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const ARTIFACT_DIR = '/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df';

async function main() {
  const options = new firefox.Options().addArguments('-headless');
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver'))
    .build();

  const report = {
    checks: [],
    errors: [],
  };

  try {
    await driver.manage().window().setRect({ width: 1600, height: 1000 });
    console.log('[1/5] Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss welcome
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // Navigate to 方向探索
    console.log('[2/5] Navigating to 方向探索...');
    const expNavBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='方向探索' or contains(., '方向探索')]")),
      5000
    );
    await expNavBtn.click();
    await driver.sleep(1500);

    // 1. Check refresh button styles
    console.log('[3/5] Verifying header refresh button styles and hover feedback...');
    const refreshBtn = await driver.findElement(By.id('refresh'));
    const refreshRect = await refreshBtn.getRect();
    console.log('Refresh button dimensions:', refreshRect.width, 'x', refreshRect.height);

    const refreshStyles = await driver.executeScript(`
      const btn = document.getElementById('refresh');
      const s = window.getComputedStyle(btn);
      return {
        width: s.width,
        height: s.height,
        borderRadius: s.borderRadius,
        backgroundColor: s.backgroundColor,
        color: s.color,
        borderWidth: s.borderWidth
      };
    `);
    console.log('Refresh default styles:', refreshStyles);

    // Hover refresh button
    const actions = driver.actions({ async: true });
    await actions.move({ origin: refreshBtn }).perform();
    await driver.sleep(400);

    const refreshHoverStyles = await driver.executeScript(`
      const btn = document.getElementById('refresh');
      const s = window.getComputedStyle(btn);
      return {
        backgroundColor: s.backgroundColor,
        color: s.color
      };
    `);
    console.log('Refresh hover styles:', refreshHoverStyles);

    const refreshScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '06_refresh_button_hover.png'), refreshScreenshot, 'base64');
    console.log('Saved 06_refresh_button_hover.png');

    report.checks.push({
      name: 'Refresh button matches ImagesPage icon button',
      defaultStyles: refreshStyles,
      hoverStyles: refreshHoverStyles,
      passed: refreshStyles.borderWidth === '0px' && refreshHoverStyles.backgroundColor.includes('234, 240, 254'), // #eaf0fe
    });

    // 2. Check row action buttons (document and trash)
    console.log('[4/5] Verifying row action buttons (document and trash)...');
    const docBtn = await driver.findElement(By.css('tr[data-id="EX-2412"] button[title="查看提示词"]'));
    const trashBtn = await driver.findElement(By.css('tr[data-id="EX-2409"] button[title="删除作业"]'));

    const docDefault = await driver.executeScript(`
      const btn = document.querySelector('tr[data-id="EX-2412"] button[title="查看提示词"]');
      const s = window.getComputedStyle(btn);
      return { width: s.width, height: s.height, borderRadius: s.borderRadius, bg: s.backgroundColor, color: s.color };
    `);
    console.log('Document button default styles:', docDefault);

    // Hover document button
    await actions.move({ origin: docBtn }).perform();
    await driver.sleep(400);

    const docHover = await driver.executeScript(`
      const btn = document.querySelector('tr[data-id="EX-2412"] button[title="查看提示词"]');
      const s = window.getComputedStyle(btn);
      return { bg: s.backgroundColor, color: s.color };
    `);
    console.log('Document button hover styles:', docHover);

    // Hover delete button
    await actions.move({ origin: trashBtn }).perform();
    await driver.sleep(400);

    const trashHover = await driver.executeScript(`
      const btn = document.querySelector('tr[data-id="EX-2409"] button[title="删除作业"]');
      const s = window.getComputedStyle(btn);
      return { bg: s.backgroundColor, color: s.color };
    `);
    console.log('Trash button hover styles (should be danger red):', trashHover);

    const actionButtonsScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '07_row_action_buttons_hover.png'), actionButtonsScreenshot, 'base64');
    console.log('Saved 07_row_action_buttons_hover.png');

    report.checks.push({
      name: 'Row document button matches DatasetManager pencil',
      defaultStyles: docDefault,
      hoverStyles: docHover,
      passed: docHover.bg.includes('234, 240, 254'),
    });

    report.checks.push({
      name: 'Row delete button matches DatasetManager delete button (danger red)',
      hoverStyles: trashHover,
      passed: trashHover.bg.includes('254, 228, 226') && trashHover.color.includes('217, 45, 32'), // #fee4e2 and #d92d20
    });

    // 3. Check Direction table eye & mine buttons
    console.log('[5/5] Verifying direction table eye & mine icon buttons...');
    const eyeBtn = await driver.findElement(By.css('tr[data-id="edge"] button[title="查看方向"]'));
    const mineBtn = await driver.findElement(By.css('tr[data-id="edge"] button[title="用该方向进行知识挖掘"]'));

    await actions.move({ origin: eyeBtn }).perform();
    await driver.sleep(400);

    const eyeHover = await driver.executeScript(`
      const btn = document.querySelector('tr[data-id="edge"] button[title="查看方向"]');
      const s = window.getComputedStyle(btn);
      return { bg: s.backgroundColor, color: s.color };
    `);
    console.log('Eye button hover styles:', eyeHover);

    await actions.move({ origin: mineBtn }).perform();
    await driver.sleep(400);

    const mineHover = await driver.executeScript(`
      const btn = document.querySelector('tr[data-id="edge"] button[title="用该方向进行知识挖掘"]');
      const s = window.getComputedStyle(btn);
      return { bg: s.backgroundColor, color: s.color };
    `);
    console.log('Mine button hover styles:', mineHover);

    report.checks.push({
      name: 'Direction table eye and mine button hover styles',
      eyeHover,
      mineHover,
      passed: eyeHover.bg.includes('234, 240, 254') && (mineHover.bg.includes('221, 233, 255') || mineHover.bg.includes('234, 240, 254')),
    });

  } catch (err) {
    console.error('Test execution error:', err);
    report.errors.push(String(err));
  } finally {
    await driver.quit();
  }

  console.log('\n================ ICON BUTTON STYLES SUMMARY ================');
  console.log(JSON.stringify(report, null, 2));

  const allPassed = report.checks.every((c) => c.passed) && report.errors.length === 0;
  console.log(`\nOVERALL RESULT: ${allPassed ? 'ALL ICON BUTTON CHECKS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  process.exit(allPassed ? 0 : 1);
}

main();
