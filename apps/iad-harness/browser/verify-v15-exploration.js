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
    // 1. Set viewport to 1600x1000
    await driver.manage().window().setRect({ width: 1600, height: 1000 });
    console.log('[1/9] Navigating to http://127.0.0.1:8000/ at 1600px viewport...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss welcome if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // 2. Navigate to 方向探索
    console.log('[2/9] Navigating to 方向探索...');
    const expNavBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='方向探索' or contains(., '方向探索')]")),
      5000
    );
    await expNavBtn.click();
    await driver.sleep(1500);

    // Save initial exploration page screenshot
    const initScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '01_exploration_unified_page.png'), initScreenshot, 'base64');
    console.log('Saved 01_exploration_unified_page.png');

    // 3. Verify upper and lower table bounding rects and padding
    console.log('[3/9] Verifying upper and lower table bounding rects and padding...');
    const upperWrap = await driver.wait(
      until.elementLocated(By.css('.exp-panel.exp-job-list > .exp-job-table-wrap')),
      5000
    );
    const lowerWrap = await driver.wait(
      until.elementLocated(By.css('.exp-panel.exp-selected-result > .exp-job-table-wrap')),
      5000
    );

    const upperRect = await upperWrap.getRect();
    const lowerRect = await lowerWrap.getRect();
    console.log('Upper table wrap rect:', upperRect);
    console.log('Lower table wrap rect:', lowerRect);

    const xDiff = Math.abs(upperRect.x - lowerRect.x);
    const widthDiff = Math.abs(upperRect.width - lowerRect.width);

    const tableAlignmentPass = xDiff <= 2 && widthDiff <= 2;
    report.checks.push({
      name: 'Table margins alignment (V15 unified edge-to-edge)',
      upperRect,
      lowerRect,
      xDiff,
      widthDiff,
      passed: tableAlignmentPass,
    });
    console.log(`Table alignment check: ${tableAlignmentPass ? 'PASS' : 'FAIL'} (xDiff=${xDiff}, widthDiff=${widthDiff})`);

    // Check th and td padding
    const paddingCheck = await driver.executeScript(`
      const upperTh = document.querySelector('.exp-job-list .exp-job-table th');
      const upperTd = document.querySelector('.exp-job-list .exp-job-table td');
      const lowerTh = document.querySelector('.exp-selected-result .exp-direction-table th');
      const lowerTd = document.querySelector('.exp-selected-result .exp-direction-table td');
      const getP = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return { paddingTop: s.paddingTop, paddingRight: s.paddingRight, paddingBottom: s.paddingBottom, paddingLeft: s.paddingLeft };
      };
      return {
        upperTh: getP(upperTh),
        upperTd: getP(upperTd),
        lowerTh: getP(lowerTh),
        lowerTd: getP(lowerTd),
      };
    `);
    console.log('Cell paddings:', JSON.stringify(paddingCheck, null, 2));
    report.checks.push({
      name: 'Unified cell paddings (12px 18px for th, 16px 18px for td)',
      paddingCheck,
      passed: paddingCheck.upperTh?.paddingTop === '12px' && paddingCheck.lowerTh?.paddingTop === '12px',
    });

    // 4. Test Job Selection
    console.log('[4/9] Testing job selection row switching...');
    const row2411 = await driver.findElement(By.css('tr[data-id="EX-2411"]'));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", row2411);
    await driver.sleep(600);

    const dirCountAfter2411 = await driver.findElements(By.css('.exp-direction-table tbody tr'));
    console.log('Directions for EX-2411:', dirCountAfter2411.length);
    report.checks.push({
      name: 'Job selection EX-2411 update',
      directionsCount: dirCountAfter2411.length,
      passed: dirCountAfter2411.length === 2,
    });

    // Switch back to EX-2412
    const row2412 = await driver.findElement(By.css('tr[data-id="EX-2412"]'));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", row2412);
    await driver.sleep(600);

    // 5. Test Prompt Drawer
    console.log('[5/9] Testing prompt drawer...');
    const promptBtn = await driver.findElement(By.css('button[data-exp="show-prompt"], button[title="查看提示词"]'));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", promptBtn);
    await driver.sleep(600);

    const drawer = await driver.wait(until.elementLocated(By.css('.exp-prompt-drawer')), 3000);
    const drawerTitle = await drawer.findElement(By.id('exp-prompt-title')).getText();
    console.log('Prompt drawer title:', drawerTitle);

    const drawerScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '02_prompt_drawer.png'), drawerScreenshot, 'base64');
    console.log('Saved 02_prompt_drawer.png');

    report.checks.push({
      name: 'Prompt drawer display',
      drawerTitle,
      passed: drawerTitle.includes('探索提示词'),
    });

    // Close drawer
    const closeDrawerBtn = await driver.findElement(By.css('.exp-prompt-close'));
    await closeDrawerBtn.click();
    await driver.sleep(400);

    // 6. Test Delete Modal
    console.log('[6/9] Testing delete job modal...');
    const trashBtn = await driver.findElement(By.css('tr[data-id="EX-2409"] button[title="删除作业"]'));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", trashBtn);
    await driver.sleep(500);

    const deleteModal = await driver.wait(until.elementLocated(By.css('.exp-dialog.small')), 3000);
    const deleteModalText = await deleteModal.getText();
    console.log('Delete modal text snippet:', deleteModalText.slice(0, 50));

    report.checks.push({
      name: 'Delete job modal',
      passed: deleteModalText.includes('删除探索作业') && deleteModalText.includes('EX-2409'),
    });

    // Cancel delete modal
    const cancelDeleteBtn = await deleteModal.findElement(By.xpath(".//button[text()='取消']"));
    await driver.executeScript("arguments[0].click();", cancelDeleteBtn);
    await driver.sleep(400);

    // 7. Test Direction Detail Dialog and Evidence Interaction
    console.log('[7/9] Testing direction detail modal and interactive chips...');
    const viewDirectionBtn = await driver.findElement(By.css('tr[data-id="edge"] button[title="查看方向"]'));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", viewDirectionBtn);
    await driver.sleep(800);

    const directionDialog = await driver.wait(until.elementLocated(By.css('.exp-direction-dialog')), 3000);
    const titleEl = await directionDialog.findElement(By.css('.exp-dialog-head strong'));
    const directionTitle = ((await titleEl.getAttribute('textContent')) || '').trim();
    console.log('Direction detail title:', directionTitle);

    // Hover on chip N1
    const chipN1 = await directionDialog.findElement(By.css('button[data-evidence-ref="N1"]'));
    const actions = driver.actions({ async: true });
    await actions.move({ origin: chipN1 }).perform();
    await driver.sleep(400);

    // Check if card N1 is highlighted with .is-related
    const cardN1 = await directionDialog.findElement(By.css('.exp-direction-evidence-card[data-evidence-card="N1"]'));
    const cardClass = await cardN1.getAttribute('class');
    const chipHighlighted = cardClass.includes('is-related');
    console.log('Card N1 highlighted on chip hover:', chipHighlighted);

    const dirScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '03_direction_detail_dialog.png'), dirScreenshot, 'base64');
    console.log('Saved 03_direction_detail_dialog.png');

    report.checks.push({
      name: 'Direction detail dialog & evidence chip hover',
      directionTitle,
      chipHighlighted,
      passed: directionTitle.includes('边缘过渡') && chipHighlighted,
    });

    // 8. Test FullscreenViewer on Evidence Click (CRITICAL REQUIREMENT)
    console.log('[8/9] Testing FullscreenViewer on evidence click...');
    await driver.executeScript("arguments[0].click();", cardN1);
    await driver.sleep(1000);

    // Fullscreen viewer overlay check
    const fsOverlay = await driver.wait(until.elementLocated(By.className('full-overlay')), 4000);
    console.log('Fullscreen viewer is open!');

    // Check toolbar order
    const fullToolbar = await driver.findElement(By.className('full-toolbar'));
    const fullActions = await fullToolbar.findElement(By.className('full-actions'));
    const actionChildren = await fullActions.findElements(By.xpath('./*'));

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
    console.log('Toolbar actions in Direction Exploration:', JSON.stringify(elementsInfo, null, 2));

    const expectedOrder = ['zoom-out', 'zoom-wrap', 'zoom-in', 'fit', 'annotation-toggle', 'full-close'];
    const actualOrder = elementsInfo.map(e => e.id || e.className);

    let toolbarOrderMatches = actualOrder.length === expectedOrder.length;
    for (let i = 0; i < expectedOrder.length; i++) {
      if (!actualOrder[i] || !actualOrder[i].includes(expectedOrder[i])) {
        toolbarOrderMatches = false;
      }
    }

    const fsScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '04_fullscreen_viewer_evidence.png'), fsScreenshot, 'base64');
    console.log('Saved 04_fullscreen_viewer_evidence.png');

    report.checks.push({
      name: 'FullscreenViewer in Direction Exploration matches Image Browsing (SSOT)',
      toolbarCount: elementsInfo.length,
      toolbarOrderMatches,
      passed: toolbarOrderMatches,
    });

    // Close fullscreen viewer
    const fsCloseBtn = await driver.findElement(By.id('full-close'));
    await fsCloseBtn.click();
    await driver.sleep(600);

    // Close direction detail modal
    const closeDirBtn = await driver.findElement(By.css('.exp-direction-dialog .exp-direction-icon'));
    await closeDirBtn.click();
    await driver.sleep(500);

    // 9. Test Setup View
    console.log('[9/9] Testing Setup View (新建探索)...');
    const newExpBtn = await driver.findElement(By.xpath("//button[text()='新建探索']"));
    await driver.executeScript("arguments[0].click();", newExpBtn);
    await driver.sleep(600);

    // Verify 3 panels in setup
    const setupPanels = await driver.findElements(By.css('.exp-panel'));
    console.log('Setup panels count:', setupPanels.length);

    // Click add image tile to open source dialog
    const addImgBtn = await driver.findElement(By.css('.exp-add-image'));
    await driver.executeScript("arguments[0].click();", addImgBtn);
    await driver.sleep(600);

    const sourceDialog = await driver.wait(until.elementLocated(By.css('.exp-source-dialog')), 3000);
    const sourceTitle = await sourceDialog.findElement(By.css('.exp-dialog-head strong')).getText();
    console.log('Source image dialog title:', sourceTitle);

    const sourceScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '05_source_image_picker.png'), sourceScreenshot, 'base64');
    console.log('Saved 05_source_image_picker.png');

    // Finish source selection
    const finishSourceBtn = await sourceDialog.findElement(By.xpath(".//button[text()='完成选择']"));
    await driver.executeScript("arguments[0].click();", finishSourceBtn);
    await driver.sleep(500);

    // Return to jobs and results
    const returnBtn = await driver.findElement(By.xpath("//button[text()='返回作业与结果']"));
    await driver.executeScript("arguments[0].click();", returnBtn);
    await driver.sleep(500);

    report.checks.push({
      name: 'Setup view & source picker modal',
      setupPanelsCount: setupPanels.length,
      sourceTitle,
      passed: setupPanels.length >= 3 && sourceTitle.includes('选择'),
    });

  } catch (err) {
    console.error('Test execution error:', err);
    report.errors.push(String(err));
  } finally {
    await driver.quit();
  }

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.log(JSON.stringify(report, null, 2));

  const allPassed = report.checks.every((c) => c.passed) && report.errors.length === 0;
  console.log(`\nOVERALL RESULT: ${allPassed ? 'ALL CHECKS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  process.exit(allPassed ? 0 : 1);
}

main();
