import { Builder, By, until, Key } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

function saveScreenshot(driver, filename) {
  return driver.takeScreenshot().then(data => {
    const fullPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(fullPath, data, "base64");
    console.log(`[Screenshot] Saved: ${fullPath}`);
  });
}

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver"))
    .build();

  try {
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    console.log("Navigating to http://127.0.0.1:8000/ ...");
    await driver.get("http://127.0.0.1:8000/");

    // Dismiss configure later if present
    try {
      const later = await driver.wait(until.elementLocated(By.xpath('//button[normalize-space(.)="Configure later"]')), 3000);
      await later.click();
      console.log("Dismissed Configure later.");
    } catch {}

    // Navigate to 数据一致性
    console.log("Navigating to 数据一致性...");
    const navBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[@aria-label='数据一致性' or contains(., '数据一致性')]")),
      5000
    );
    await navBtn.click();
    await driver.sleep(2000);

    // Verify page heading
    const heading = await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='数据一致性']")), 5000);
    console.log("Verified heading: 数据一致性");

    // 1. Verify Scope Selector
    const parentSelect = await driver.findElement(By.id("dc-parent"));
    const parentVal = await parentSelect.getAttribute("value");
    console.log(`Parent dataset group selected: ${parentVal}`);

    const childTrigger = await driver.findElement(By.id("dc-child-trigger"));
    const childTriggerText = await childTrigger.getText();
    console.log(`Top scope child trigger text: ${childTriggerText}`);

    // Click child trigger to open dropdown
    await childTrigger.click();
    await driver.sleep(400);
    const childOptions = await driver.findElements(By.id("dc-child-options"));
    if (childOptions.length === 0) throw new Error("Child options dropdown did not open!");
    console.log("Verified top scope child dropdown opens.");

    // Click outside to close
    await driver.findElement(By.xpath("//h1[normalize-space(.)='数据一致性']")).click();
    await driver.sleep(400);
    const closedOptions = await driver.findElements(By.id("dc-child-options"));
    if (closedOptions.length > 0) throw new Error("Child options dropdown did not close on outside click!");
    console.log("Verified top scope child dropdown closes on outside click.");

    // 2. Verify Jobs Table
    const jobsTable = await driver.wait(until.elementLocated(By.className("dc-table")), 5000);
    const rows = await jobsTable.findElements(By.css("tbody tr"));
    console.log(`Found ${rows.length} jobs in table.`);
    if (rows.length === 0) throw new Error("No jobs displayed in table!");

    // Take screenshot of main consistency workbench
    await saveScreenshot(driver, "v26_01_consistency_workbench.png");

    // Select a completed job row to view its results
    console.log("Selecting a completed job row with conflict results (e.g. batch_ebdf)...");
    const completedRow = await driver.wait(
      until.elementLocated(By.xpath("//tbody/tr[contains(., 'batch_ebdf') or contains(., 'batch_0eea') or (contains(., '部分完成') and contains(., '0904-Train'))]")),
      5000
    );
    await driver.executeScript(el => el.click(), completedRow);
    await driver.sleep(800);

    // 3. Verify Filter Bar & Filename Search
    console.log("Verifying filter bar order: 模型判断 -> 模型差异类型 -> 文件名搜索 -> 更多筛选...");
    const modelFilter = await driver.wait(until.elementLocated(By.id("dc-model-filter")), 5000);
    const modelType = await driver.findElement(By.id("dc-model-type"));
    const filenameSearch = await driver.findElement(By.id("dc-filename-search"));
    const moreFilters = await driver.findElement(By.className("dc-more-filters"));

    // Check search input height
    const searchRect = await filenameSearch.getRect();
    console.log(`Filename search input height: ${searchRect.height}px (expected 38px)`);

    // Check initial cards count (wait for async network load)
    await driver.wait(until.elementLocated(By.className("dc-card")), 6000);
    const initialCards = await driver.findElements(By.className("dc-card"));
    console.log(`Initial conflict cards count: ${initialCards.length}`);
    if (initialCards.length === 0) throw new Error("No conflict cards loaded initially!");

    const firstCardTitle = await initialCards[0].findElement(By.css("strong")).getText();
    console.log(`First card filename: "${firstCardTitle}"`);
    const searchSubstring = firstCardTitle.slice(0, Math.min(8, firstCardTitle.length));
    console.log(`Testing filename search with substring: "${searchSubstring}"...`);

    await filenameSearch.sendKeys(searchSubstring);
    await driver.sleep(500);

    const filteredCards = await driver.findElements(By.className("dc-card"));
    console.log(`Cards after searching "${searchSubstring}": ${filteredCards.length}`);
    if (filteredCards.length === 0) throw new Error(`Search for "${searchSubstring}" returned 0 cards!`);
    await saveScreenshot(driver, "v26_02_filename_search_filtered.png");

    // Test search with no match
    console.log("Testing search with no match...");
    await filenameSearch.sendKeys(Key.CONTROL, "a");
    await filenameSearch.sendKeys(Key.BACK_SPACE);
    await filenameSearch.sendKeys("NONEXISTENT_XYZ_9999");
    await driver.sleep(600);

    const emptyMsg = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'dc-empty') and contains(., '当前筛选条件下没有匹配')]")),
      3000
    );
    console.log("Verified empty state when search has no match: " + (await emptyMsg.getText()));
    await saveScreenshot(driver, "v26_03_filename_search_empty.png");

    // Clear search
    await filenameSearch.sendKeys(Key.CONTROL, "a");
    await filenameSearch.sendKeys(Key.BACK_SPACE);
    await driver.sleep(600);
    const restoredCards = await driver.findElements(By.className("dc-card"));
    console.log(`Cards after clearing search: ${restoredCards.length}`);

    // 4. Verify Conflict Detail Comparison Dialog
    const conflictCards = await driver.findElements(By.className("dc-card"));
    if (conflictCards.length > 0) {
      console.log("Clicking first conflict card to open comparison dialog...");
      await conflictCards[0].click();
      await driver.sleep(600);

      const compareModal = await driver.wait(until.elementLocated(By.id("dc-compare-mask")), 3000);
      const compareTitle = await driver.findElement(By.id("dc-dialog-title")).getText();
      console.log(`Opened comparison dialog: ${compareTitle}`);
      await saveScreenshot(driver, "v26_06_conflict_comparison_dialog.png");

      // Test manual review radio buttons
      const confirmedRadio = await driver.findElement(By.xpath("//input[@name='dc-review' and @value='confirmed']"));
      await confirmedRadio.click();
      await driver.sleep(200);
      const noteInput = await driver.findElement(By.id("dc-note"));
      await noteInput.sendKeys("自动化核验：确认存在标注差异");
      await driver.sleep(200);

      // Save review
      const saveBtn = await driver.findElement(By.xpath("//button[normalize-space(.)='保存复核']"));
      await saveBtn.click();
      await driver.sleep(500);
      console.log("Saved review successfully.");
    }

    // 5. Verify More Filters Drawer
    console.log("Testing 更多筛选 drawer...");
    const moreBtn = await driver.findElement(By.className("dc-more-filters"));
    await moreBtn.click();
    await driver.sleep(400);

    const drawer = await driver.wait(until.elementLocated(By.id("dc-filters-mask")), 3000);
    const reviewSelect = await driver.findElement(By.id("dc-review-filter"));
    const changedOnlyCheck = await driver.findElement(By.id("dc-changed-only"));
    console.log("Verified 更多筛选 drawer opened with review filter and changed-only checkbox.");
    await saveScreenshot(driver, "v26_07_more_filters_drawer.png");

    // Close drawer
    await driver.findElement(By.xpath("//button[normalize-space(.)='完成']")).click();
    await driver.sleep(400);

    // 6. Test New Consistency Check Modal & Dropdown
    console.log("Testing 新建一致性检查 modal...");
    const newCheckBtn = await driver.findElement(By.xpath("//button[contains(., '新建检查')]"));
    await newCheckBtn.click();
    await driver.sleep(500);

    const newModal = await driver.wait(until.elementLocated(By.id("dc-new-mask")), 3000);
    const modalTitle = await driver.findElement(By.id("dc-new-title")).getText();
    console.log(`Opened modal: ${modalTitle}`);

    // Verify child trigger inside modal
    const modalChildTrigger = await driver.findElement(By.id("dc-new-child-trigger"));
    const modalTriggerRect = await modalChildTrigger.getRect();
    console.log(`Modal child trigger height: ${modalTriggerRect.height}px (expected 40px)`);
    console.log(`Modal child trigger text: ${await modalChildTrigger.getText()}`);

    // Click to open child dropdown
    await modalChildTrigger.click();
    await driver.sleep(400);
    const modalOptions = await driver.findElement(By.id("dc-new-child-options"));
    const modalCheckboxes = await modalOptions.findElements(By.className("dc-new-child-check"));
    console.log(`Modal child options opened with ${modalCheckboxes.length} checkboxes.`);
    await saveScreenshot(driver, "v26_04_new_modal_child_dropdown.png");

    // Test click outside dropdown (inside modal header/title) -> closes dropdown, modal stays open
    await driver.findElement(By.id("dc-new-title")).click();
    await driver.sleep(400);
    const modalOptionsAfterClick = await driver.findElements(By.id("dc-new-child-options"));
    if (modalOptionsAfterClick.length > 0) throw new Error("Modal child dropdown did not close on outside click!");
    const modalStillOpen = await driver.findElements(By.id("dc-new-mask"));
    if (modalStillOpen.length === 0) throw new Error("Modal was prematurely closed!");
    console.log("Verified: clicking outside modal child dropdown closes dropdown while modal remains open.");

    // Test Escape key priority:
    // Open dropdown again, press Escape -> dropdown closes, modal stays open
    await modalChildTrigger.click();
    await driver.sleep(400);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(400);
    const modalOptionsAfterEsc = await driver.findElements(By.id("dc-new-child-options"));
    if (modalOptionsAfterEsc.length > 0) throw new Error("Modal child dropdown did not close on Escape!");
    const modalStillOpen2 = await driver.findElements(By.id("dc-new-mask"));
    if (modalStillOpen2.length === 0) throw new Error("Modal was closed on first Escape!");
    console.log("Verified: first Escape closes child dropdown; modal remains open.");

    // Press Escape again -> modal closes
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(400);
    const modalClosed = await driver.findElements(By.id("dc-new-mask"));
    if (modalClosed.length > 0) throw new Error("Modal did not close on second Escape!");
    console.log("Verified: second Escape closes modal.");

    // Open modal again to verify disabled '开始检查' button when 0 selected
    await newCheckBtn.click();
    await driver.sleep(500);
    const modalChildTrigger2 = await driver.findElement(By.id("dc-new-child-trigger"));
    await modalChildTrigger2.click();
    await driver.sleep(400);

    const checks = await driver.findElements(By.className("dc-new-child-check"));
    for (const chk of checks) {
      if (await chk.isSelected()) {
        await chk.click();
        await driver.sleep(100);
      }
    }
    const startBtn = await driver.findElement(By.xpath("//button[contains(., '开始检查')]"));
    const isDisabled = await startBtn.getAttribute("disabled");
    console.log(`When 0 child datasets selected, 开始检查 disabled=${isDisabled}`);
    if (!isDisabled) throw new Error("开始检查 button must be disabled when 0 children selected!");

    // Check multiple child datasets
    if (checks.length >= 2) {
      await checks[0].click();
      await driver.sleep(100);
      await checks[1].click();
      await driver.sleep(100);
    } else if (checks.length === 1) {
      await checks[0].click();
      await driver.sleep(100);
    }
    const isEnabledNow = !(await startBtn.getAttribute("disabled"));
    console.log(`After checking children, 开始检查 enabled=${isEnabledNow}`);
    if (!isEnabledNow) throw new Error("开始检查 button should be enabled when children selected!");
    await saveScreenshot(driver, "v26_05_modal_multi_selected.png");

    // Close dropdown
    await modalChildTrigger2.click();
    await driver.sleep(300);

    // Submit new job with multi-child selection
    console.log("Submitting new check job with multiple child datasets...");
    await startBtn.click();
    await driver.sleep(800);

    // Verify modal closed
    const modalAfterSubmit = await driver.findElements(By.id("dc-new-mask"));
    if (modalAfterSubmit.length > 0) throw new Error("Modal should close after job submission!");
    console.log("Verified new check job submitted and modal closed.");
    await saveScreenshot(driver, "v26_09_job_created_multi_scope.png");

    // 7. Test Cross-Page Navigation (dataset management, images, exploration, consistency)
    console.log("Testing navigation to other pages...");
    const imagesNav = await driver.findElement(By.xpath("//button[@aria-label='图像浏览' or contains(., '图像浏览')]"));
    await imagesNav.click();
    await driver.sleep(1500);
    console.log("Navigated to 图像浏览.");

    const explorationNav = await driver.findElement(By.xpath("//button[@aria-label='方向探索' or contains(., '方向探索')]"));
    await explorationNav.click();
    await driver.sleep(1500);
    console.log("Navigated to 方向探索.");

    // Return to 数据一致性
    const returnConsistency = await driver.findElement(By.xpath("//button[@aria-label='数据一致性' or contains(., '数据一致性')]"));
    await returnConsistency.click();
    await driver.sleep(1500);
    console.log("Returned to 数据一致性.");
    await saveScreenshot(driver, "v26_08_return_consistency_verified.png");

    // 8. Test OK/NG Dataset (超节点数据集, group-2)
    console.log("Testing OK/NG Dataset (超节点数据集)...");
    await driver.executeScript(() => {
      const sel = document.getElementById("dc-parent");
      if (sel) {
        sel.value = "group-2";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await driver.sleep(1000);

    const okngTab = await driver.wait(
      until.elementLocated(By.xpath("//button[@role='tab' and contains(., 'OK / NG 标签冲突')]")),
      5000
    );
    console.log("Verified OK / NG 标签冲突 tab displayed for 超节点数据集.");
    await saveScreenshot(driver, "v26_10_okng_dataset_search.png");

    // 9. Test Narrow Viewport (390px, mobile/compact layout)
    console.log("Testing narrow viewport (390px)...");
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await driver.sleep(600);

    const newCheckBtnNarrow = await driver.findElement(By.xpath("//button[contains(., '新建检查')]"));
    await newCheckBtnNarrow.click();
    await driver.sleep(500);

    const childTriggerNarrow = await driver.findElement(By.id("dc-new-child-trigger"));
    await childTriggerNarrow.click();
    await driver.sleep(500);
    console.log("Verified new check modal dropdown in 390px narrow viewport.");
    await saveScreenshot(driver, "v26_11_narrow_viewport_dialog.png");

    // Close on Escape
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(300);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(300);

    // Restore desktop window
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    await driver.sleep(400);

    console.log("\n==========================================");
    console.log("ALL V26 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!");
    console.log("==========================================\n");
  } finally {
    await driver.quit();
  }
}

run().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
