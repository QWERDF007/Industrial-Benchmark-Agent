import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, until, Key } from 'selenium-webdriver';
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
    await driver.manage().window().setRect({ width: 1600, height: 1050 });
    console.log('[Step 1] Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss welcome modal if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // Navigate to 方向探索
    console.log('[Step 2] Clicking 方向探索...');
    const expNavBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='方向探索' or contains(., '方向探索')]")),
      5000
    );
    await expNavBtn.click();
    await driver.sleep(1200);

    // 1. Check parent dataset select: Option text must be "框胶大数据集" and NOT "框胶_数据增强"
    console.log('[Step 3] Checking parent dataset dropdown...');
    const parentInfo = await driver.executeScript(`
      const sel = document.getElementById('exp-parent');
      if (!sel) return null;
      const opts = Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() }));
      const selectedText = sel.options[sel.selectedIndex]?.text?.trim();
      return { opts, selectedText, value: sel.value };
    `);
    console.log('Parent selector info:', parentInfo);

    const parentCheck = parentInfo &&
      parentInfo.selectedText === '框胶大数据集' &&
      !parentInfo.opts.some(o => o.text === '框胶_数据增强');
    report.checks.push({
      name: 'Parent select shows 框胶大数据集 from start and never flashes child dataset name (框胶_数据增强)',
      passed: !!parentCheck,
      details: parentInfo,
    });

    // 2. Check child dataset button label: should default to single dataset "框胶_数据增强 (120)", not all
    console.log('[Step 4] Checking child dataset initial label and selection...');
    const childTriggerInfo = await driver.executeScript(`
      const btn = document.getElementById('exp-child-toggle');
      const label = document.getElementById('exp-child-label');
      const computed = btn ? window.getComputedStyle(btn) : null;
      return {
        text: label ? label.textContent.trim() : '',
        height: computed ? computed.height : '',
        borderRadius: computed ? computed.borderRadius : '',
        border: computed ? computed.border : '',
      };
    `);
    console.log('Child trigger info:', childTriggerInfo);

    const childInitPass = childTriggerInfo.text.includes('框胶_数据增强') && !childTriggerInfo.text.includes('已选 4 个');
    report.checks.push({
      name: 'Default child selection is single dataset (框胶_数据增强 (120)), not all 4 child datasets',
      passed: childInitPass,
      details: childTriggerInfo,
    });

    // 3. Verify jobs table shows clean empty state for 框胶_数据增强 (0 jobs in DB)
    const initJobsCount = await driver.executeScript(`
      return document.querySelectorAll('.exp-job-list .exp-job-table tbody tr').length;
    `);
    const emptyJobMsg = await driver.executeScript(`
      return document.querySelector('.exp-job-empty')?.textContent?.trim() || '';
    `);
    console.log('Init jobs count for 框胶_数据增强:', initJobsCount, 'Message:', emptyJobMsg);
    report.checks.push({
      name: '框胶_数据增强 correctly shows 0 jobs and clean empty state',
      passed: initJobsCount === 0 && emptyJobMsg.includes('尚无探索作业'),
      details: { initJobsCount, emptyJobMsg },
    });

    const shot01 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '01_child_single_empty_state.png'), shot01, 'base64');

    // 4. Test child dropdown click-outside interaction
    console.log('[Step 5] Testing child dropdown open & click-outside behavior...');
    const childToggleBtn = await driver.findElement(By.id('exp-child-toggle'));
    await childToggleBtn.click();
    await driver.sleep(300);

    const menuOpenState1 = await driver.executeScript(`
      const menu = document.getElementById('exp-child-menu');
      return menu && !menu.hidden && window.getComputedStyle(menu).display !== 'none';
    `);
    console.log('Menu open after click:', menuOpenState1);

    // Click outside on the heading
    const headingEl = await driver.findElement(By.css('.exp-heading h1'));
    await headingEl.click();
    await driver.sleep(300);

    const menuOpenStateAfterOutsideClick = await driver.executeScript(`
      const menu = document.getElementById('exp-child-menu');
      return menu && !menu.hidden && window.getComputedStyle(menu).display !== 'none';
    `);
    console.log('Menu open after outside click:', menuOpenStateAfterOutsideClick);

    const outsideClickPass = menuOpenState1 === true && menuOpenStateAfterOutsideClick === false;
    report.checks.push({
      name: 'Child dropdown opens on click and closes on clicking outside',
      passed: outsideClickPass,
      details: { opened: menuOpenState1, closedAfterOutside: !menuOpenStateAfterOutsideClick },
    });

    // 5. Test Escape key closes dropdown
    await childToggleBtn.click();
    await driver.sleep(300);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(300);

    const menuOpenAfterEscape = await driver.executeScript(`
      const menu = document.getElementById('exp-child-menu');
      return menu && !menu.hidden && window.getComputedStyle(menu).display !== 'none';
    `);
    console.log('Menu open after Escape key:', menuOpenAfterEscape);
    report.checks.push({
      name: 'Child dropdown closes on Escape key',
      passed: !menuOpenAfterEscape,
      details: { closed: !menuOpenAfterEscape },
    });

    // 6. Multi-select: Check 框胶_Test (ds_8bf1c1e9ef8042869adb044a36b7e2a0)
    console.log('[Step 6] Checking 框胶_Test in child dropdown...');
    await childToggleBtn.click();
    await driver.sleep(300);

    const shotMenuOpen = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '02_child_menu_dropdown.png'), shotMenuOpen, 'base64');

    await driver.executeScript(`
      const chk = document.querySelector('input[type="checkbox"][value="ds_8bf1c1e9ef8042869adb044a36b7e2a0"]');
      if (chk) {
        chk.click();
      }
    `);
    await driver.sleep(1200);

    // Close menu by clicking outside
    await headingEl.click();
    await driver.sleep(300);

    const labelAfterCheck1 = await driver.executeScript(`
      return document.getElementById('exp-child-label')?.textContent?.trim();
    `);
    const jobsCountAfterCheck1 = await driver.executeScript(`
      return document.querySelectorAll('.exp-job-list .exp-job-table tbody tr').length;
    `);
    const job1Id = await driver.executeScript(`
      return document.querySelector('.exp-job-list .exp-job-table tbody tr .exp-row-title')?.textContent?.trim();
    `);
    const directionsCount1 = await driver.executeScript(`
      return document.querySelectorAll('.exp-direction-table tbody tr').length;
    `);

    console.log('Label after checking Test:', labelAfterCheck1);
    console.log('Jobs count after checking Test:', jobsCountAfterCheck1, 'Job ID:', job1Id);
    console.log('Directions count:', directionsCount1);

    const check1Pass = labelAfterCheck1.includes('已选 2 个') &&
      jobsCountAfterCheck1 === 1 &&
      job1Id === 'explore_6d3d0d4164a54cb496aee7c5d4951869' &&
      directionsCount1 === 4;

    report.checks.push({
      name: 'Checking 框胶_Test reactively loads its job (explore_6d3d0d41...) and 4 candidate directions',
      passed: check1Pass,
      details: { label: labelAfterCheck1, jobsCount: jobsCountAfterCheck1, job1Id, directionsCount1 },
    });

    const shotChecked1 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '03_checked_test_dataset_jobs.png'), shotChecked1, 'base64');

    // 7. Check 框胶_Train (ds_1cf0c3eba0ed45c58973b6e57fa0cd85) -> both jobs must appear!
    console.log('[Step 7] Checking 框胶_Train in child dropdown...');
    await childToggleBtn.click();
    await driver.sleep(300);

    await driver.executeScript(`
      const chk = document.querySelector('input[type="checkbox"][value="ds_1cf0c3eba0ed45c58973b6e57fa0cd85"]');
      if (chk) {
        chk.click();
      }
    `);
    await driver.sleep(1500);

    await headingEl.click();
    await driver.sleep(300);

    const labelAfterCheck2 = await driver.executeScript(`
      return document.getElementById('exp-child-label')?.textContent?.trim();
    `);
    const jobsCountAfterCheck2 = await driver.executeScript(`
      return document.querySelectorAll('.exp-job-list .exp-job-table tbody tr').length;
    `);
    const jobIdsList = await driver.executeScript(`
      return Array.from(document.querySelectorAll('.exp-job-list .exp-job-table tbody tr .exp-row-title')).map(el => el.textContent.trim());
    `);
    console.log('Label after checking Train:', labelAfterCheck2);
    console.log('Jobs count after checking Train:', jobsCountAfterCheck2, 'Job IDs:', jobIdsList);

    const check2Pass = labelAfterCheck2.includes('已选 3 个') &&
      jobsCountAfterCheck2 === 2 &&
      jobIdsList.includes('explore_6d3d0d4164a54cb496aee7c5d4951869') &&
      jobIdsList.includes('explore_8ae3be86c68c420097520fac26d001f5');

    report.checks.push({
      name: 'Checking both 框胶_Test and 框胶_Train aggregates and displays both jobs simultaneously',
      passed: check2Pass,
      details: { label: labelAfterCheck2, jobsCount: jobsCountAfterCheck2, jobIdsList },
    });

    const shotChecked2 = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '04_two_datasets_jobs_aggregated.png'), shotChecked2, 'base64');

    // 8. Uncheck 框胶_Test -> only 框胶_Train job remains
    console.log('[Step 8] Unchecking 框胶_Test...');
    await childToggleBtn.click();
    await driver.sleep(300);

    await driver.executeScript(`
      const chk = document.querySelector('input[type="checkbox"][value="ds_8bf1c1e9ef8042869adb044a36b7e2a0"]');
      if (chk) {
        chk.click();
      }
    `);
    await driver.sleep(1200);

    await headingEl.click();
    await driver.sleep(300);

    const jobsCountAfterUncheck = await driver.executeScript(`
      return document.querySelectorAll('.exp-job-list .exp-job-table tbody tr').length;
    `);
    const remainingJobId = await driver.executeScript(`
      return document.querySelector('.exp-job-list .exp-job-table tbody tr .exp-row-title')?.textContent?.trim();
    `);
    console.log('Jobs count after unchecking Test:', jobsCountAfterUncheck, 'Remaining ID:', remainingJobId);

    const uncheckPass = jobsCountAfterUncheck === 1 && remainingJobId === 'explore_8ae3be86c68c420097520fac26d001f5';
    report.checks.push({
      name: 'Unchecking 框胶_Test removes its job and leaves only 框胶_Train job',
      passed: uncheckPass,
      details: { jobsCountAfterUncheck, remainingJobId },
    });

    // 9. Uncheck 框胶_Train -> table returns to empty state
    console.log('[Step 9] Unchecking 框胶_Train...');
    await childToggleBtn.click();
    await driver.sleep(300);

    await driver.executeScript(`
      const chk = document.querySelector('input[type="checkbox"][value="ds_1cf0c3eba0ed45c58973b6e57fa0cd85"]');
      if (chk) {
        chk.click();
      }
    `);
    await driver.sleep(1200);

    await headingEl.click();
    await driver.sleep(300);

    const jobsCountEmpty = await driver.executeScript(`
      return document.querySelectorAll('.exp-job-list .exp-job-table tbody tr').length;
    `);
    console.log('Jobs count when only 框胶_数据增强 checked:', jobsCountEmpty);
    report.checks.push({
      name: 'Unchecking all datasets with jobs returns table to clean empty state',
      passed: jobsCountEmpty === 0,
      details: { jobsCountEmpty },
    });

    // 10. Re-check 框胶_Test and open direction dialog to verify large sizing and eye icon
    console.log('[Step 10] Checking direction detail dialog...');
    await childToggleBtn.click();
    await driver.sleep(300);
    await driver.executeScript(`
      const chk = document.querySelector('input[type="checkbox"][value="ds_8bf1c1e9ef8042869adb044a36b7e2a0"]');
      if (chk) {
        chk.click();
      }
    `);
    await driver.sleep(1200);
    await headingEl.click();
    await driver.sleep(300);

    // Click first direction view icon
    const eyeBtn = await driver.findElement(By.css('.exp-direction-view-icon'));
    await eyeBtn.click();
    await driver.sleep(800);

    const dialogDims = await driver.executeScript(`
      const dlg = document.querySelector('.exp-direction-dialog');
      if (!dlg) return null;
      const rect = dlg.getBoundingClientRect();
      const rationaleFont = window.getComputedStyle(dlg.querySelector('.exp-direction-rationale') || dlg).fontSize;
      return { width: Math.round(rect.width), height: Math.round(rect.height), rationaleFont };
    `);
    console.log('Direction dialog dimensions:', dialogDims);

    const dialogPass = dialogDims && dialogDims.width >= 1200 && dialogDims.height >= 700;
    report.checks.push({
      name: 'Direction dialog maintains large spacious dimensions (1440x840 style)',
      passed: !!dialogPass,
      details: dialogDims,
    });

    const shotDialog = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '05_direction_dialog_large_verified.png'), shotDialog, 'base64');

    console.log('\n================ VERIFICATION SUMMARY ================');
    let allPassed = true;
    for (const c of report.checks) {
      console.log(`[${c.passed ? 'PASS' : 'FAIL'}] ${c.name}`);
      if (!c.passed) allPassed = false;
    }
    console.log('======================================================');

    if (!allPassed) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

main();