const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome.js");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

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
    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    await driver.get(`http://127.0.0.1:8000/?token=${token}`);
    await driver.sleep(3000);

    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (e) {}

    // -------------------------------------------------------------
    // Test 1: Exploration "查看方向" (Tier 1: Large Detail Dialog)
    // -------------------------------------------------------------
    console.log("[Test 1] Testing Exploration '查看方向' Detail Dialog...");
    const expNav = await driver.findElement(By.xpath('//button[contains(., "方向探索")]'));
    await expNav.click();
    await driver.sleep(2000);

    // Look for a job with direction results or select one
    const jobRows = await driver.findElements(By.css(".exp-table tbody tr"));
    if (jobRows.length > 0) {
      await jobRows[0].click();
      await driver.sleep(1500);
    }

    // Click "查看方向" button
    let viewDirectionBtn;
    try {
      viewDirectionBtn = await driver.wait(
        until.elementLocated(By.css('.exp-direction-table button.exp-btn, button[title*="查看方向"], [data-action="view-direction"]')),
        3000
      );
    } catch (e) {
      // If not in table, find any button with "查看方向"
      viewDirectionBtn = await driver.findElement(By.xpath('//button[contains(., "查看方向")]'));
    }
    await driver.executeScript("arguments[0].click()", viewDirectionBtn);
    await driver.sleep(1500);

    const expDialogInfo = await driver.executeScript(() => {
      const mask = document.querySelector(".exp-modal:has(.exp-direction-dialog), .exp-modal.exp-direction-modal, #exp-modal");
      const dialog = document.querySelector(".exp-direction-dialog");
      if (!dialog) return null;
      const head = dialog.querySelector(".exp-dialog-head");
      const title = head ? head.querySelector("strong, h2") : null;
      const closeBtn = head ? head.querySelector(".exp-direction-icon, .modal-x") : null;
      const maskStyle = mask ? window.getComputedStyle(mask) : null;
      const dialogStyle = window.getComputedStyle(dialog);
      const headStyle = head ? window.getComputedStyle(head) : null;
      const titleStyle = title ? window.getComputedStyle(title) : null;
      const closeStyle = closeBtn ? window.getComputedStyle(closeBtn) : null;
      const rect = dialog.getBoundingClientRect();

      const expectedHeight = Math.min(820, window.innerHeight - 2 * 40);
      return {
        maskPadding: maskStyle ? maskStyle.padding : "",
        maskBg: maskStyle ? maskStyle.backgroundColor : "",
        width: rect.width,
        height: rect.height,
        expectedHeight,
        innerHeight: window.innerHeight,
        borderRadius: dialogStyle.borderRadius,
        boxShadow: dialogStyle.boxShadow,
        headHeight: headStyle ? headStyle.height : "",
        headBorderBottom: headStyle ? headStyle.borderBottom : "",
        titleFontSize: titleStyle ? titleStyle.fontSize : "",
        titleFontWeight: titleStyle ? titleStyle.fontWeight : "",
        titleColor: titleStyle ? titleStyle.color : "",
        closeWidth: closeStyle ? closeStyle.width : "",
        closeHeight: closeStyle ? closeStyle.height : "",
      };
    });

    console.log("[Test 1 Result] Exploration Direction Dialog:", expDialogInfo);
    assert.ok(expDialogInfo, "Exploration direction dialog should be visible");
    assert.strictEqual(Math.round(expDialogInfo.width), 1380, "Direction dialog width should be 1380px");
    assert.strictEqual(Math.round(expDialogInfo.height), expDialogInfo.expectedHeight, `Direction dialog height should match responsive min(820, innerHeight - 80) = ${expDialogInfo.expectedHeight}px`);
    assert.strictEqual(expDialogInfo.borderRadius, "8px", "Border radius should be 8px");
    assert.strictEqual(expDialogInfo.titleFontSize, "17px", "Title font size should be 17px");

    const scrExp = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v42_exploration_direction_dialog.png"), scrExp, "base64");

    // Close direction dialog
    const closeDirBtn = await driver.findElement(By.css('.exp-direction-dialog .exp-direction-icon, .exp-direction-dialog .modal-x'));
    await closeDirBtn.click();
    await driver.sleep(1000);

    // -------------------------------------------------------------
    // Test 2: Image Browser "图像详情" (Tier 1: Large Detail Dialog)
    // -------------------------------------------------------------
    console.log("[Test 2] Testing Image Browser '图像详情' Detail Dialog...");
    const imgNav = await driver.findElement(By.xpath('//button[contains(., "图像浏览")]'));
    await imgNav.click();
    await driver.sleep(2000);

    const imgCard = await driver.wait(
      until.elementLocated(By.css(".grid .card, .card-thumb, .thumb")),
      5000
    );
    await imgCard.click();
    await driver.sleep(1500);

    const imgDialogInfo = await driver.executeScript(() => {
      const dialog = document.querySelector(".detail-dialog");
      if (!dialog) return null;
      const head = dialog.querySelector(".detail-header");
      const title = head ? head.querySelector(".detail-title") : null;
      const rect = dialog.getBoundingClientRect();
      const style = window.getComputedStyle(dialog);
      const headStyle = head ? window.getComputedStyle(head) : null;
      const titleStyle = title ? window.getComputedStyle(title) : null;

      const expectedHeight = Math.min(820, window.innerHeight - 2 * 40);
      return {
        width: rect.width,
        height: rect.height,
        expectedHeight,
        borderRadius: style.borderRadius,
        headHeight: headStyle ? headStyle.height : "",
        titleFontSize: titleStyle ? titleStyle.fontSize : "",
        titleFontWeight: titleStyle ? titleStyle.fontWeight : "",
        titleColor: titleStyle ? titleStyle.color : "",
      };
    });

    console.log("[Test 2 Result] Image Detail Dialog:", imgDialogInfo);
    assert.ok(imgDialogInfo, "Image detail dialog should be visible");
    assert.strictEqual(Math.round(imgDialogInfo.width), 1380, "Image detail dialog width should be 1380px");
    assert.strictEqual(Math.round(imgDialogInfo.height), imgDialogInfo.expectedHeight, `Image detail dialog height should match responsive min(820, innerHeight - 80) = ${imgDialogInfo.expectedHeight}px`);
    assert.strictEqual(imgDialogInfo.borderRadius, "8px", "Border radius should be 8px");
    assert.strictEqual(imgDialogInfo.titleFontSize, "17px", "Title font size should be 17px");

    const scrImg = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v42_images_detail_dialog.png"), scrImg, "base64");

    // Close image detail dialog
    const closeImgBtn = await driver.findElement(By.css('.detail-close, #close'));
    await closeImgBtn.click();
    await driver.sleep(1000);

    // -------------------------------------------------------------
    // Test 3: Consistency Check "新建检查" (Tier 2: Medium Form Dialog)
    // -------------------------------------------------------------
    console.log("[Test 3] Testing Consistency '新建检查' Medium Dialog...");
    const dcNav = await driver.findElement(By.xpath('//button[contains(., "数据一致性")]'));
    await dcNav.click();
    await driver.sleep(2000);

    const newCheckBtn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(., "新建检查") or contains(., "新建作业")]')),
      5000
    );
    await newCheckBtn.click();
    await driver.sleep(1500);

    const newDialogInfo = await driver.executeScript(() => {
      const dialog = document.querySelector("#dc-new-mask .dc-new-dialog");
      if (!dialog) return null;
      const head = dialog.querySelector(".dc-dialog-head");
      const title = head ? head.querySelector("h2") : null;
      const rect = dialog.getBoundingClientRect();
      const style = window.getComputedStyle(dialog);
      const headStyle = head ? window.getComputedStyle(head) : null;
      const titleStyle = title ? window.getComputedStyle(title) : null;

      return {
        width: rect.width,
        borderRadius: style.borderRadius,
        headHeight: headStyle ? headStyle.height : "",
        titleFontSize: titleStyle ? titleStyle.fontSize : "",
        titleColor: titleStyle ? titleStyle.color : "",
      };
    });

    console.log("[Test 3 Result] Consistency New Check Dialog:", newDialogInfo);
    assert.ok(newDialogInfo, "New check dialog should be visible");
    assert.strictEqual(Math.round(newDialogInfo.width), 760, "New check dialog width should be 760px");
    assert.strictEqual(newDialogInfo.borderRadius, "8px", "Border radius should be 8px");
    assert.strictEqual(newDialogInfo.titleFontSize, "17px", "Title font size should be 17px");

    const scrNew = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v42_consistency_new_dialog.png"), scrNew, "base64");

    // Close new check dialog
    const closeNewBtn = await driver.findElement(By.css('#dc-new-mask .dc-icn, #dc-new-mask button[title="关闭"]'));
    await closeNewBtn.click();
    await driver.sleep(1000);

    // -------------------------------------------------------------
    // Test 4: Delete Job Modal (Tier 3: Small Confirmation Dialog)
    // -------------------------------------------------------------
    console.log("[Test 4] Testing Delete Job Small Dialog...");
    const delJobBtn = await driver.wait(
      until.elementLocated(By.css(".dc-table button.danger, .dc-table [title*='删除']")),
      5000
    );
    await driver.executeScript("arguments[0].click()", delJobBtn);
    await driver.sleep(1500);

    const delDialogInfo = await driver.executeScript(() => {
      const dialog = document.querySelector(".dc-delete-dialog, #dc-delete-mask .dc-dialog, #dc-delete-mask .exp-dialog");
      if (!dialog) return null;
      const head = dialog.querySelector(".exp-dialog-head");
      const rect = dialog.getBoundingClientRect();
      const style = window.getComputedStyle(dialog);
      const confirmBtn = dialog.querySelector(".dc-delete-confirm, .exp-delete-confirm");
      const confirmStyle = confirmBtn ? window.getComputedStyle(confirmBtn) : null;

      return {
        width: rect.width,
        borderRadius: style.borderRadius,
        confirmBg: confirmStyle ? confirmStyle.backgroundColor : "",
        confirmColor: confirmStyle ? confirmStyle.color : "",
        confirmHeight: confirmStyle ? confirmStyle.height : "",
      };
    });

    console.log("[Test 4 Result] Delete Job Dialog:", delDialogInfo);
    assert.ok(delDialogInfo, "Delete job dialog should be visible");
    assert.strictEqual(Math.round(delDialogInfo.width), 530, "Delete dialog width should be 530px");
    assert.strictEqual(delDialogInfo.borderRadius, "8px", "Border radius should be 8px");
    assert.strictEqual(delDialogInfo.confirmBg, "rgb(191, 56, 74)", "Confirm button color should be danger red #bf384a");

    const scrDel = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v42_delete_dialog.png"), scrDel, "base64");

    console.log("\n==========================================");
    console.log("  ALL DIALOG SSOT TESTS PASSED PERFECTLY!");
    console.log("==========================================");
  } finally {
    await driver.quit();
  }
})();
