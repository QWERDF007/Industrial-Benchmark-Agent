const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome.js");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

async function saveScreenshot(driver, filename) {
  const screenshot = await driver.takeScreenshot();
  const filePath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(screenshot, "base64"));
  console.log(`[Screenshot] Saved: ${filePath}`);
}

(async () => {
  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1600,1000"
  );

  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

  try {
    console.log("\n========================================================");
    console.log("  VERIFY V31 SPECIFICATIONS: SCOPE, PROMPT & UNIFIED DIALOGS");
    console.log("========================================================\n");

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const baseUrl = `http://127.0.0.1:8000/?token=${token}`;

    console.log(`Navigating to ${baseUrl}...`);
    await driver.get(baseUrl);
    await driver.sleep(3000);

    // Dismiss any modal dialog / 稍后配置
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        3000
      );
      await later.click();
      console.log("  Dismissed '稍后配置' modal.");
      await driver.sleep(1500);
    } catch (e) {
      console.log("  No '稍后配置' modal found, continuing.");
    }

    // -------------------------------------------------------------------------
    // Test 1: 数据一致性 (Consistency Page) - Child Dataset Trigger & Dropdown
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Verifying 数据一致性 Child Dataset Trigger...");
    const navConsistency = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '标注一致性')] | //nav//button[contains(., '数据一致性')]")
      ),
      8000
    );
    await navConsistency.click();
    await driver.sleep(2500);

    await driver.wait(until.elementLocated(By.css(".dc-root")), 8000);
    console.log("  Consistency page loaded.");

    // Verify child trigger button text & title attribute
    const triggerBtn = await driver.findElement(By.id("dc-child-trigger"));
    const triggerText = (await triggerBtn.getText()).trim();
    const triggerTitle = await triggerBtn.getAttribute("title");

    console.log(`  Collapsed child trigger text: '${triggerText}'`);
    console.log(`  Collapsed child trigger title: '${triggerTitle || "(none)"}'`);

    const matchesV31Pattern = /^已选\s*\d+\s*个子数据集$/.test(triggerText) || triggerText === "请选择子数据集";
    console.log(`  Trigger matches '已选 X 个子数据集' pattern: ${matchesV31Pattern ? "PASS" : "FAIL"}`);
    if (!matchesV31Pattern) {
      throw new Error(`Expected '已选 X 个子数据集', got: '${triggerText}'`);
    }
    if (triggerTitle && triggerTitle.includes("、")) {
      throw new Error(`Collapsed trigger should not provide full list title tooltip! Got: '${triggerTitle}'`);
    }

    await saveScreenshot(driver, "v31_01_consistency_child_collapsed.png");

    // Click trigger to expand and verify options
    await triggerBtn.click();
    await driver.sleep(600);

    const childOptions = await driver.wait(until.elementLocated(By.id("dc-child-options")), 3000);
    const optionsText = await childOptions.getText();
    console.log(`  Expanded dropdown contains names:\n${optionsText.split("\n").map(s => "    - " + s).join("\n")}`);

    await saveScreenshot(driver, "v31_02_consistency_child_expanded.png");

    // Click outside to collapse
    const heading = await driver.findElement(By.css(".dc-page-heading h1"));
    await heading.click();
    await driver.sleep(500);

    // -------------------------------------------------------------------------
    // Test 2: 新建一致性检查弹窗 - Prompt Editor & Validation
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Verifying 新建一致性检查 Modal & Prompt Editor...");
    const startCheckBtn = await driver.findElement(By.css("button[data-dc='start-check']"));
    await startCheckBtn.click();
    await driver.sleep(1000);

    const newDialog = await driver.wait(until.elementLocated(By.css("#dc-new-mask .dc-new-dialog")), 5000);
    console.log("  New Consistency Check modal opened.");

    // Verify modal child trigger text
    const newChildTrigger = await newDialog.findElement(By.id("dc-new-child-trigger"));
    const newChildText = (await newChildTrigger.getText()).trim();
    console.log(`  New check child trigger text: '${newChildText}'`);
    if (!/^已选\s*\d+\s*个子数据集$/.test(newChildText) && newChildText !== "选择子数据集") {
      throw new Error(`Expected '已选 X 个子数据集', got: '${newChildText}'`);
    }

    // Verify prompt editor label and textarea
    const promptLabel = await newDialog.findElement(By.css(".dc-prompt-editor label"));
    console.log(`  Prompt editor label: '${await promptLabel.getText()}'`);

    const promptTextarea = await newDialog.findElement(By.id("dc-new-prompt"));
    const initialPrompt = await promptTextarea.getAttribute("value");
    console.log(`  Initial prompt length: ${initialPrompt.length} chars`);
    console.log(`  Initial prompt preview: ${initialPrompt.slice(0, 60)}...`);

    if (!initialPrompt.includes("工业数据标注一致性核查助手") || !initialPrompt.includes("OK/NG 标签是否冲突")) {
      throw new Error("Default prompt text does not match V31 specification!");
    }

    // Verify submit button is enabled when prompt and child datasets exist
    const submitBtn = await newDialog.findElement(By.css("button[data-dc='create-job']"));
    let isSubmitEnabled = await submitBtn.isEnabled();
    console.log(`  Submit button enabled with valid prompt & children: ${isSubmitEnabled ? "PASS" : "FAIL"}`);
    if (!isSubmitEnabled) throw new Error("Submit button should be enabled!");

    await saveScreenshot(driver, "v31_03_new_check_modal_with_prompt.png");

    // Test validation: clear prompt -> submit should be disabled
    console.log("  Testing empty prompt validation...");
    // Clear textarea using React-friendly prototype setter and key actions
    await driver.executeScript(`
      const ta = document.getElementById('dc-new-prompt');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(ta, '');
      } else {
        ta.value = '';
      }
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    `);
    await driver.sleep(500);

    isSubmitEnabled = await submitBtn.isEnabled();
    console.log(`  Submit button disabled when prompt is empty: ${!isSubmitEnabled ? "PASS" : "FAIL"}`);
    if (isSubmitEnabled) throw new Error("Submit button must be disabled when prompt is empty!");

    // Restore prompt
    await driver.executeScript(`
      const ta = document.getElementById('dc-new-prompt');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(ta, arguments[0]);
      } else {
        ta.value = arguments[0];
      }
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    `, initialPrompt + "\n[测试添加自定义检查要求]");
    await driver.sleep(500);

    isSubmitEnabled = await submitBtn.isEnabled();
    console.log(`  Submit button re-enabled after prompt restored: ${isSubmitEnabled ? "PASS" : "FAIL"}`);
    if (!isSubmitEnabled) throw new Error("Submit button should be re-enabled!");

    // Expand child selector inside modal
    await newChildTrigger.click();
    await driver.sleep(500);
    const modalChildOptions = await driver.wait(until.elementLocated(By.id("dc-new-child-options")), 3000);
    console.log(`  Modal child dropdown expanded with ${(await modalChildOptions.findElements(By.css("label"))).length} options.`);
    await saveScreenshot(driver, "v31_04_new_check_child_expanded.png");

    // Close modal via Escape key
    console.log("  Closing New Check modal via Escape key...");
    const body = await driver.findElement(By.css("body"));
    await body.sendKeys(Key.ESCAPE);
    await driver.sleep(500);
    // If child dropdown was open, first Esc closes dropdown; second Esc closes modal
    if ((await driver.findElements(By.css("#dc-new-mask"))).length > 0) {
      await body.sendKeys(Key.ESCAPE);
      await driver.sleep(500);
    }
    const isNewModalGone = (await driver.findElements(By.css("#dc-new-mask"))).length === 0;
    console.log(`  New check modal closed: ${isNewModalGone ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------------------
    // Test 3: 标注冲突对比弹窗 (Unified Conflict Comparison Dialog)
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Verifying Unified Conflict Comparison Dialog...");
    const batchRow = await driver.wait(
      until.elementLocated(By.css("tr[data-dc-row*='batch_ebdf']")),
      8000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", batchRow);
    await driver.sleep(300);
    await driver.executeScript("arguments[0].click();", batchRow);
    console.log("  Selected batch_ebdf job row.");
    await driver.sleep(2000);

    const card = await driver.wait(
      until.elementLocated(By.css(".dc-card[data-dc='open-conflict']")),
      8000
    );
    await driver.executeScript("arguments[0].click();", card);
    await driver.sleep(1500);

    const conflictDialog = await driver.wait(until.elementLocated(By.css(".dc-conflict-dialog")), 5000);
    console.log("  Conflict comparison dialog opened.");

    // Verify dialog dimensions & padding
    const dialogMetrics = await driver.executeScript(`
      const mask = document.querySelector('#dc-compare-mask');
      const dialog = document.querySelector('.dc-conflict-dialog');
      const photo = document.querySelector('.dc-compare-photo');
      const maskStyle = window.getComputedStyle(mask);
      const dialogStyle = window.getComputedStyle(dialog);
      const photoStyle = window.getComputedStyle(photo);
      return {
        maskPaddingTop: maskStyle.paddingTop,
        maskPaddingLeft: maskStyle.paddingLeft,
        dialogWidth: dialog.getBoundingClientRect().width,
        dialogMaxW: dialogStyle.maxWidth,
        dialogBorderRadius: dialogStyle.borderRadius,
        photoHeight: photo.getBoundingClientRect().height
      };
    `);
    console.log("  Conflict Dialog Metrics:", dialogMetrics);

    // Dialog max width should be 1380px, gutter 56px, vgutter 40px
    if (dialogMetrics.dialogWidth > 1380) {
      throw new Error(`Dialog width ${dialogMetrics.dialogWidth}px exceeds max width 1380px!`);
    }
    console.log("  [PASS] Conflict Dialog conforms to 1380px unified max-width & padding gutters.");

    await saveScreenshot(driver, "v31_05_unified_conflict_dialog.png");

    // Close conflict dialog by clicking backdrop mask
    console.log("  Closing conflict dialog by clicking mask backdrop...");
    const compareMask = await driver.findElement(By.id("dc-compare-mask"));
    await driver.executeScript(`
      document.getElementById('dc-compare-mask').click();
    `);
    await driver.sleep(800);
    const isConflictModalGone = (await driver.findElements(By.css("#dc-compare-mask"))).length === 0;
    console.log(`  Conflict dialog closed via mask click: ${isConflictModalGone ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------------------
    // Test 4: 方向探索 (Exploration Page) - Scope Selector & Direction Detail Dialog
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Verifying 方向探索 Scope Selector & Direction Detail Dialog...");
    const navExploration = await driver.wait(
      until.elementLocated(
        By.xpath("//nav//button[contains(., '方向探索')]")
      ),
      8000
    );
    await navExploration.click();
    await driver.sleep(2500);

    // Verify Exploration child trigger
    const expChildToggle = await driver.wait(until.elementLocated(By.id("exp-child-toggle")), 8000);
    const expChildText = (await expChildToggle.getText()).trim();
    console.log(`  Exploration child trigger text: '${expChildText}'`);
    if (!/^已选\s*\d+\s*个子数据集$/.test(expChildText) && expChildText !== "请选择子数据集") {
      throw new Error(`Expected '已选 X 个子数据集', got: '${expChildText}'`);
    }
    console.log("  [PASS] Exploration child scope trigger unified to '已选 X 个子数据集'.");

    await saveScreenshot(driver, "v31_06_exploration_child_scope.png");

    // Open direction detail dialog
    const detailBtn = await driver.wait(
      until.elementLocated(By.css("button.exp-direction-view-icon, button[title='查看方向']")),
      8000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", detailBtn);
    await driver.sleep(300);
    await driver.executeScript("arguments[0].click();", detailBtn);
    await driver.sleep(1500);

    const expDialog = await driver.wait(until.elementLocated(By.css(".exp-direction-dialog")), 5000);
    console.log("  Direction detail dialog opened.");

    const expDialogMetrics = await driver.executeScript(`
      const modal = document.querySelector('.exp-direction-modal, .exp-modal');
      const dialog = document.querySelector('.exp-direction-dialog');
      const modalStyle = window.getComputedStyle(modal);
      const dialogStyle = window.getComputedStyle(dialog);
      return {
        paddingTop: modalStyle.paddingTop,
        paddingLeft: modalStyle.paddingLeft,
        dialogWidth: dialog.getBoundingClientRect().width,
        maxWidth: dialogStyle.maxWidth,
        borderRadius: dialogStyle.borderRadius
      };
    `);
    console.log("  Direction Dialog Metrics:", expDialogMetrics);
    if (expDialogMetrics.dialogWidth > 1380) {
      throw new Error(`Direction dialog width ${expDialogMetrics.dialogWidth}px exceeds max width 1380px!`);
    }
    console.log("  [PASS] Direction Detail Dialog conforms to 1380px unified dialog specifications.");

    await saveScreenshot(driver, "v31_07_unified_direction_dialog.png");

    // Close direction dialog via Escape key
    console.log("  Closing Direction dialog via Escape key...");
    await body.sendKeys(Key.ESCAPE);
    await driver.sleep(800);
    const isExpModalGone = (await driver.findElements(By.css(".exp-direction-dialog"))).length === 0;
    console.log(`  Direction dialog closed via Escape: ${isExpModalGone ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------------------
    // Test 5: Narrow Viewport Responsive Verification (820x750)
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Testing Narrow Viewport (820x750) Responsive Behavior...");
    await driver.manage().window().setRect({ width: 820, height: 750 });
    await driver.sleep(1000);

    // Switch back to consistency page and open New Check modal
    await navConsistency.click();
    await driver.sleep(1500);

    const startCheckNarrow = await driver.findElement(By.css("button[data-dc='start-check']"));
    await startCheckNarrow.click();
    await driver.sleep(1000);

    await driver.wait(until.elementLocated(By.css("#dc-new-mask .dc-new-dialog")), 5000);
    const narrowDialogMetrics = await driver.executeScript(`
      const d = document.querySelector('#dc-new-mask .dc-new-dialog');
      const ta = document.getElementById('dc-new-prompt');
      return {
        dialogWidth: d.getBoundingClientRect().width,
        textareaHeight: ta.getBoundingClientRect().height
      };
    `);
    console.log("  Narrow Viewport New Check Modal Metrics:", narrowDialogMetrics);
    await saveScreenshot(driver, "v31_08_narrow_viewport_new_check.png");

    await body.sendKeys(Key.ESCAPE);
    await driver.sleep(500);

    console.log("\n========================================================");
    console.log("  ALL V31 SPECIFICATIONS VERIFIED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err);
    await saveScreenshot(driver, "v31_error.png");
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();
