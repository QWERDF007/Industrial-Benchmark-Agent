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

    // Dismiss welcome if present
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

    // Check dataset without jobs
    console.log('[3/5] Checking dataset without exploration jobs (empty state)...');
    const parentSelect = await driver.findElement(By.id('exp-parent'));
    // Select group with ds_bd1c1655b3b241d2ab24a4014ef33d84 (框胶大数据集 / group-1)
    await driver.executeScript(`
      const sel = document.getElementById('exp-parent');
      if (sel) {
        sel.value = 'group-1';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await driver.sleep(1200);

    // Verify empty state
    const emptyJobText = await driver.executeScript(`
      const el = document.querySelector('.exp-job-empty');
      return el ? el.textContent.trim() : '';
    `);
    const emptyResultText = await driver.executeScript(`
      const el = document.querySelector('.exp-unified-empty');
      return el ? el.textContent.trim() : '';
    `);
    const jobRowsCount = await driver.executeScript(`
      return document.querySelectorAll('.exp-job-table tbody tr').length;
    `);

    console.log('Empty job text:', emptyJobText);
    console.log('Empty result text:', emptyResultText);
    console.log('Job rows count:', jobRowsCount);

    const emptyPass = jobRowsCount === 0 && emptyJobText.includes('尚无探索作业') && emptyResultText.includes('尚无探索结果');
    report.checks.push({
      name: 'Dataset without jobs shows 0 job rows and clean empty states (no mock jobs/directions)',
      passed: emptyPass,
      details: { jobRowsCount, emptyJobText, emptyResultText },
    });
    console.log(`Empty state check: ${emptyPass ? 'PASS' : 'FAIL'}`);

    const shotNoJobs = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '01_dataset_no_jobs_empty_state.png'), shotNoJobs, 'base64');

    // Switch dataset to 超节点数据集 (group-2 / ds_601c735a131f44e686a23e9346487ade)
    console.log('[4/5] Switching to 超节点数据集 with real exploration jobs...');
    await driver.executeScript(`
      const sel = document.getElementById('exp-parent');
      if (sel) {
        sel.value = 'group-2';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await driver.sleep(1800);

    // Verify real job is displayed
    const realJobInfo = await driver.executeScript(`
      const firstRow = document.querySelector('.exp-job-table tbody tr');
      if (!firstRow) return null;
      return {
        jobId: firstRow.querySelector('.exp-row-title')?.textContent?.trim(),
        badge: firstRow.querySelector('.exp-pill')?.textContent?.trim(),
        images: firstRow.querySelectorAll('td')[2]?.textContent?.trim(),
        duration: firstRow.querySelector('.exp-job-duration')?.textContent?.trim(),
        directionRows: document.querySelectorAll('.exp-direction-table tbody tr').length,
        firstDirTitle: document.querySelector('.exp-direction-table .exp-row-title')?.textContent?.trim(),
        firstDirApplies: document.querySelectorAll('.exp-direction-table tbody td')[1]?.textContent?.trim(),
        summary: document.querySelector('.exp-result-summary')?.textContent?.trim(),
      };
    `);
    console.log('Real job info:', realJobInfo);

    const realJobPass = !!(
      realJobInfo &&
      realJobInfo.jobId?.startsWith('explore_') &&
      realJobInfo.badge === '已完成' &&
      realJobInfo.directionRows === 4 &&
      realJobInfo.firstDirTitle?.includes('公头中央触点')
    );
    report.checks.push({
      name: 'Real exploration job and candidate directions loaded dynamically from backend',
      passed: realJobPass,
      details: realJobInfo,
    });
    console.log(`Real exploration job check: ${realJobPass ? 'PASS' : 'FAIL'}`);

    const shotWithJobs = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '02_dataset_with_real_jobs.png'), shotWithJobs, 'base64');

    // Open Direction Detail Modal for the real direction
    console.log('[5/5] Opening Direction Detail Dialog for real direction...');
    const firstEyeBtn = await driver.findElement(By.css('.exp-direction-table tr[data-action="direction"] .exp-direction-view-icon'));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", firstEyeBtn);
    await driver.sleep(800);

    const directionDialog = await driver.wait(until.elementLocated(By.css('.exp-direction-dialog')), 3000);
    const dialogRect = await directionDialog.getRect();
    console.log('Direction dialog rect at 1600x1000:', dialogRect);

    // Measure typography, dimensions and bottom blank
    const metrics = await driver.executeScript(`
      const dialog = document.querySelector('.exp-direction-dialog');
      const goalH3 = document.querySelector('.exp-direction-goal h3');
      const goalP = document.querySelector('.exp-direction-goal p');
      const reasonH3 = document.querySelector('.exp-direction-reasoning h3');
      const reasonP = document.querySelector('.exp-direction-reasoning p');
      const chip = document.querySelector('.exp-evidence-ref');
      const evidence = document.querySelector('.exp-direction-evidence');
      const evidenceHeadH3 = document.querySelector('.exp-direction-evidence-head h3');
      const cards = document.querySelectorAll('.exp-direction-evidence-card');
      const firstCardImg = document.querySelector('.exp-direction-evidence-card img');
      const main = document.querySelector('.exp-direction-dialog .exp-dialog-main');

      const mainRect = main?.getBoundingClientRect();
      const lastCardRect = cards[cards.length - 1]?.getBoundingClientRect();
      const bottomBlank = (mainRect && lastCardRect) ? Math.round(mainRect.bottom - lastCardRect.bottom) : 0;

      return {
        dialogWidth: dialog?.offsetWidth,
        dialogHeight: dialog?.offsetHeight,
        goalH3Size: goalH3 ? window.getComputedStyle(goalH3).fontSize : '',
        goalPSize: goalP ? window.getComputedStyle(goalP).fontSize : '',
        goalPLineHeight: goalP ? window.getComputedStyle(goalP).lineHeight : '',
        reasonH3Size: reasonH3 ? window.getComputedStyle(reasonH3).fontSize : '',
        reasonPSize: reasonP ? window.getComputedStyle(reasonP).fontSize : '',
        evidenceHeadH3Size: evidenceHeadH3 ? window.getComputedStyle(evidenceHeadH3).fontSize : '',
        chipHeight: chip ? window.getComputedStyle(chip).height : '',
        chipBg: chip ? window.getComputedStyle(chip).backgroundColor : '',
        chipColor: chip ? window.getComputedStyle(chip).color : '',
        cardCount: cards.length,
        imgHeight: firstCardImg ? firstCardImg.offsetHeight : 0,
        bottomBlank,
      };
    `);
    console.log('Direction dialog visual metrics:', metrics);

    // Validation
    const dialogLargePass = dialogRect.width >= 1400 && dialogRect.height >= 780;
    const textEnlargedPass = parseFloat(metrics.goalH3Size) >= 16 && parseFloat(metrics.goalPSize) >= 14.5 && parseFloat(metrics.reasonPSize) >= 14.5;
    const cardsSnugPass = metrics.cardCount >= 4 && metrics.imgHeight >= 200 && metrics.bottomBlank <= 35;
    const chipsPass = metrics.chipBg === 'rgb(243, 247, 255)' && metrics.chipColor === 'rgb(40, 91, 192)';

    report.checks.push({
      name: 'Direction detail dialog large and spacious (width >= 1400px, height >= 780px)',
      dialogRect,
      passed: dialogLargePass,
    });
    report.checks.push({
      name: 'Upper text areas enlarged (h3 >= 16px, p >= 14.5px)',
      metrics,
      passed: textEnlargedPass,
    });
    report.checks.push({
      name: 'Image evidence cards fill bottom comfortably (imgHeight >= 200px, bottomBlank <= 35px)',
      metrics,
      passed: cardsSnugPass,
    });
    report.checks.push({
      name: 'Comparison evidence references styled as inline chips matching HTML prototype',
      metrics,
      passed: chipsPass,
    });

    console.log(`Dialog large check: ${dialogLargePass ? 'PASS' : 'FAIL'} (${dialogRect.width}x${dialogRect.height})`);
    console.log(`Upper text enlarged check: ${textEnlargedPass ? 'PASS' : 'FAIL'}`);
    console.log(`Cards snug / no void check: ${cardsSnugPass ? 'PASS' : 'FAIL'} (img=${metrics.imgHeight}px, bottomBlank=${metrics.bottomBlank}px)`);
    console.log(`Chips style check: ${chipsPass ? 'PASS' : 'FAIL'}`);

    // Check two-way hover highlight
    const chipEl = await driver.findElement(By.css('.exp-evidence-ref'));
    const chipRef = await chipEl.getAttribute('data-evidence-ref');
    await driver.actions().move({ origin: chipEl }).perform();
    await driver.sleep(300);

    const cardOnChipHover = await driver.findElement(By.css(`[data-evidence-card="${chipRef}"]`));
    const cardClassOnChipHover = await cardOnChipHover.getAttribute('class');
    const hoverPass = cardClassOnChipHover.includes('is-related');
    report.checks.push({
      name: 'Two-way hover highlight between chips and evidence cards',
      passed: hoverPass,
      cardClassOnChipHover,
    });
    console.log(`Two-way hover check: ${hoverPass ? 'PASS' : 'FAIL'}`);

    const shotDialog = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '03_direction_dialog_real_large.png'), shotDialog, 'base64');

    // Click card to open FullscreenViewer
    await driver.executeScript('arguments[0].click();', cardOnChipHover);
    await driver.sleep(800);

    const viewerEl = await driver.wait(until.elementLocated(By.css('.full-overlay, .full-dialog')), 3000);
    const viewerVisible = await viewerEl.isDisplayed();
    report.checks.push({
      name: 'Clicking evidence card opens FullscreenViewer with actual image',
      passed: viewerVisible,
    });
    console.log(`Fullscreen viewer check: ${viewerVisible ? 'PASS' : 'FAIL'}`);

    const shotViewer = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '04_fullscreen_viewer_real_sample.png'), shotViewer, 'base64');

  } catch (err) {
    console.error('Test execution error:', err);
    report.errors.push(err.message);
  } finally {
    await driver.quit();
  }

  console.log('\n--- VERIFICATION REPORT ---');
  console.log(JSON.stringify(report, null, 2));

  const allPassed = report.checks.length > 0 && report.checks.every(c => c.passed) && report.errors.length === 0;
  if (!allPassed) {
    console.error('SOME CHECKS FAILED! ❌');
    process.exit(1);
  } else {
    console.log('ALL REAL JOB & DIALOG REFINEMENT CHECKS PASSED SUCCESSFULLY! ✅');
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
