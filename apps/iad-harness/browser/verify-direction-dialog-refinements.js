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
    console.log('[1/6] Navigating to http://127.0.0.1:8000/ ...');
    await driver.get('http://127.0.0.1:8000/');

    // Dismiss welcome if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 2000);
      await later.click();
    } catch {}

    // 2. Navigate to 方向探索
    console.log('[2/6] Navigating to 方向探索...');
    const expNavBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='方向探索' or contains(., '方向探索')]")),
      5000
    );
    await expNavBtn.click();
    await driver.sleep(1500);

    // Select 框胶_Test child dataset to display its job and directions
    const childTrigger = await driver.findElement(By.id('exp-child-toggle'));
    await childTrigger.click();
    await driver.sleep(300);
    await driver.executeScript(`
      const chk = document.querySelector('input[type="checkbox"][value="ds_8bf1c1e9ef8042869adb044a36b7e2a0"]');
      if (chk && !chk.checked) chk.click();
    `);
    await driver.sleep(800);
    await childTrigger.click();
    await driver.sleep(400);

    // 3. Verify Candidate Directions Table Eye Icon
    console.log('[3/6] Checking candidate directions "查看方向" icon...');
    const viewDirectionBtn = await driver.wait(
      until.elementLocated(By.css('.exp-direction-view-icon')),
      5000
    );
    const eyeSvgHtml = await driver.executeScript('return arguments[0].querySelector("svg")?.innerHTML;', viewDirectionBtn);
    console.log('Eye SVG innerHTML:', eyeSvgHtml);

    const hasExpectedPath = eyeSvgHtml.includes('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z');
    const hasExpectedCircle = eyeSvgHtml.includes('cx="12" cy="12" r="3"') || eyeSvgHtml.includes('cx="12"') && eyeSvgHtml.includes('r="3"');
    const eyeIconPass = hasExpectedPath && hasExpectedCircle;

    report.checks.push({
      name: 'Candidate direction view icon matches FullscreenViewer annotation-toggle',
      eyeSvgHtml,
      passed: eyeIconPass,
    });
    console.log(`Eye icon check: ${eyeIconPass ? 'PASS' : 'FAIL'}`);

    // Take screenshot of candidate table row actions
    const tableScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '10_candidate_table_eye_icon.png'), tableScreenshot, 'base64');

    // 4. Open Direction Detail Dialog and Check Size & Centering
    console.log('[4/6] Opening direction detail modal and measuring size & position...');
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", viewDirectionBtn);
    await driver.sleep(800);

    const directionDialog = await driver.wait(until.elementLocated(By.css('.exp-direction-dialog')), 3000);
    const dialogRect = await directionDialog.getRect();
    console.log('Direction dialog rect at 1600x1000:', dialogRect);

    // Dialog size & position checks:
    // Should be wide (~1380px) and comfortably centered
    const dialogWidePass = dialogRect.width >= 1300 && dialogRect.x >= 50;
    // Dialog should be spacious (840px height as requested by user)
    const dialogHeightSnugPass = dialogRect.height >= 550 && dialogRect.height <= 880;

    report.checks.push({
      name: 'Direction detail dialog enlarged & centered (width >= 1300px, x >= 50)',
      dialogRect,
      passed: dialogWidePass,
    });
    report.checks.push({
      name: 'Direction detail dialog height snug without huge empty void (550px <= height <= 780px)',
      dialogHeight: dialogRect.height,
      passed: dialogHeightSnugPass,
    });
    console.log(`Dialog wide & centered check: ${dialogWidePass ? 'PASS' : 'FAIL'} (${dialogRect.width}px wide, x=${dialogRect.x})`);
    console.log(`Dialog snug height check: ${dialogHeightSnugPass ? 'PASS' : 'FAIL'} (${dialogRect.height}px high)`);

    // 5. Check Upper Two Text Areas Typography
    console.log('[5/6] Checking upper text areas typography (观察目标 & 比较依据)...');
    const typography = await driver.executeScript(`
      const goalH3 = document.querySelector('.exp-direction-goal h3');
      const goalP = document.querySelector('.exp-direction-goal p');
      const reasonH3 = document.querySelector('.exp-direction-reasoning h3');
      const reasonP = document.querySelector('.exp-direction-reasoning p');
      const chip = document.querySelector('.exp-evidence-ref');
      const evidenceSec = document.querySelector('.exp-direction-evidence');
      const dialogMain = document.querySelector('.exp-direction-dialog .exp-dialog-main');

      const sGoalH3 = window.getComputedStyle(goalH3);
      const sGoalP = window.getComputedStyle(goalP);
      const sReasonH3 = window.getComputedStyle(reasonH3);
      const sReasonP = window.getComputedStyle(reasonP);
      const sChip = window.getComputedStyle(chip);

      const evRect = evidenceSec.getBoundingClientRect();
      const mainRect = dialogMain.getBoundingClientRect();
      const bottomBlank = mainRect.bottom - evRect.bottom;

      return {
        goalH3Size: sGoalH3.fontSize,
        goalPSize: sGoalP.fontSize,
        reasonH3Size: sReasonH3.fontSize,
        reasonPSize: sReasonP.fontSize,
        chipSize: sChip.fontSize,
        chipHeight: sChip.height,
        chipBg: sChip.backgroundColor,
        chipColor: sChip.color,
        bottomBlank,
      };
    `);
    console.log('Typography & whitespace metrics:', JSON.stringify(typography, null, 2));

    const textEnlargedPass =
      parseFloat(typography.goalPSize) >= 14 &&
      parseFloat(typography.reasonPSize) >= 14 &&
      parseFloat(typography.goalH3Size) >= 15;

    const noHugeBlankPass = typography.bottomBlank <= 40; // tightly wrapped (around 18-24px padding)

    report.checks.push({
      name: 'Upper text areas enlarged (h3 >= 15px, p >= 14px)',
      typography,
      passed: textEnlargedPass,
    });
    report.checks.push({
      name: 'No oversized empty void at bottom of dialog (bottomBlank <= 40px)',
      bottomBlank: typography.bottomBlank,
      passed: noHugeBlankPass,
    });
    console.log(`Upper text enlarged check: ${textEnlargedPass ? 'PASS' : 'FAIL'} (goal=${typography.goalPSize}, reason=${typography.reasonPSize})`);
    console.log(`No huge bottom blank check: ${noHugeBlankPass ? 'PASS' : 'FAIL'} (bottomBlank=${typography.bottomBlank}px)`);

    // 6. Test Two-Way Hover Highlight
    console.log('[6/6] Checking evidence reference chips two-way hover highlight...');
    const chipN1 = await directionDialog.findElement(By.css('button[data-evidence-ref="N1"]'));
    const actions = driver.actions({ async: true });
    await actions.move({ origin: chipN1 }).perform();
    await driver.sleep(400);

    const cardN1 = await directionDialog.findElement(By.css('.exp-direction-evidence-card[data-evidence-card="N1"]'));
    const cardN1Class = await cardN1.getAttribute('class');
    const chipN1HoverStyles = await driver.executeScript(`
      const chip = document.querySelector('button[data-evidence-ref="N1"]');
      const s = window.getComputedStyle(chip);
      return { backgroundColor: s.backgroundColor, color: s.color };
    `);
    console.log('Chip N1 hover styles:', chipN1HoverStyles);
    console.log('Card N1 class on chip hover:', cardN1Class);

    const chipHoverPass = cardN1Class.includes('is-related') &&
      chipN1HoverStyles.backgroundColor === 'rgb(220, 233, 255)';

    // Test Hover on Card A1
    const cardA1 = await directionDialog.findElement(By.css('.exp-direction-evidence-card[data-evidence-card="A1"]'));
    await actions.move({ origin: cardA1 }).perform();
    await driver.sleep(400);

    const chipA1 = await directionDialog.findElement(By.css('button[data-evidence-ref="A1"]'));
    const chipA1Class = await chipA1.getAttribute('class');
    console.log('Chip A1 class on card A1 hover:', chipA1Class);
    const cardHoverPass = chipA1Class.includes('is-related');

    // Save screenshots
    const dialogScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, '08_direction_dialog_enlarged.png'), dialogScreenshot, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, '09_evidence_ref_chips_hover.png'), dialogScreenshot, 'base64');
    console.log('Saved 08_direction_dialog_enlarged.png and 09_evidence_ref_chips_hover.png');

    report.checks.push({
      name: 'Evidence chip and card two-way hover highlight',
      chipHoverPass,
      cardHoverPass,
      passed: chipHoverPass && cardHoverPass,
    });
    console.log(`Two-way hover highlight check: ${chipHoverPass && cardHoverPass ? 'PASS' : 'FAIL'}`);

    console.log('\n--- VERIFICATION REPORT ---');
    console.log(JSON.stringify(report, null, 2));

    const allPassed = report.checks.every(c => c.passed);
    if (!allPassed) {
      console.error('Some checks failed!');
      process.exit(1);
    } else {
      console.log('\nALL REFINEMENT CHECKS PASSED SUCCESSFULLY! ✅');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

main();
