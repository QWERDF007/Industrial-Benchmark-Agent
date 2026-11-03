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

    // Navigate to 数据集管理
    console.log("[Test] Navigating to 数据集管理...");
    const dsNav = await driver.findElement(By.xpath('//button[contains(., "数据集管理") or @aria-label="数据集管理"]'));
    await dsNav.click();
    await driver.sleep(2000);

    // 1. Create a temporary test group
    console.log("[Test] Creating test dataset group...");
    const addGroupBtn = await driver.wait(until.elementLocated(By.css("#addBtn")), 5000);
    await addGroupBtn.click();
    await driver.sleep(1000);

    const testGroupName = `级联大数据集_${Date.now()}`;
    const groupInput = await driver.wait(until.elementLocated(By.css("#new-name")), 3000);
    await groupInput.sendKeys(testGroupName);
    await driver.sleep(500);

    const submitGroupBtn = await driver.findElement(By.css('div.modal-scrim form button[type="submit"]'));
    await submitGroupBtn.click();
    await driver.sleep(2000);

    // Verify group exists
    const groupElement = await driver.wait(
      until.elementLocated(By.xpath(`//tr[contains(@class, "parent-row")]//span[contains(@class, "name-text") and contains(., "${testGroupName}")]`)),
      5000
    );
    assert(groupElement, "Created group should be visible");
    console.log(`[Test] Created group: ${testGroupName}`);

    // 2. Add a child dataset to this group
    console.log("[Test] Adding child dataset to the group...");
    const parentRow = await driver.findElement(By.xpath(`//tr[contains(@class, "parent-row") and .//span[contains(., "${testGroupName}")]]`));
    const addChildBtn = await parentRow.findElement(By.css('button[title="添加子数据集"]'));
    await driver.executeScript("arguments[0].click()", addChildBtn);
    await driver.sleep(1000);

    const testChildName = `测试子集_${Date.now()}`;
    const childNameInput = await driver.wait(until.elementLocated(By.css("#new-name")), 3000);
    await childNameInput.sendKeys(testChildName);
    await driver.sleep(500);

    // Set paths
    const newPathInput = await driver.findElement(By.css("#new-path"));
    await newPathInput.sendKeys("/data1/wt/tmp");
    const newLabelPathInput = await driver.findElement(By.css("#new-label-path"));
    await newLabelPathInput.sendKeys("/data1/wt/tmp");
    await driver.sleep(500);

    const submitChildBtn = await driver.findElement(By.css('div.modal-scrim form button[type="submit"]'));
    await submitChildBtn.click();
    await driver.sleep(2500);

    // Verify child dataset exists in the group
    const childElement = await driver.wait(
      until.elementLocated(By.xpath(`//tr[contains(@class, "data-row") and not(contains(@class, "parent-row"))]//span[contains(@class, "name-text") and contains(., "${testChildName}")]`)),
      5000
    );
    assert(childElement, "Created child dataset should be visible");
    console.log(`[Test] Created child dataset: ${testChildName}`);

    // 3. Click delete on the parent group
    console.log("[Test] Clicking delete on parent group with child dataset...");
    const parentRowAgain = await driver.findElement(By.xpath(`//tr[contains(@class, "parent-row") and .//span[contains(., "${testGroupName}")]]`));
    const deleteGroupBtn = await parentRowAgain.findElement(By.css('button[title="删除数据集"]'));
    await driver.executeScript("arguments[0].click()", deleteGroupBtn);
    await driver.sleep(1000);

    // 4. Inspect modal
    const modalInfo = await driver.executeScript(() => {
      const modal = document.querySelector(".modal-scrim .modal");
      if (!modal) return null;
      const title = modal.querySelector("h2")?.textContent.trim();
      const ps = Array.from(modal.querySelectorAll("p")).map(p => p.textContent.trim());
      const confirmBtn = Array.from(modal.querySelectorAll("button")).find(b => b.textContent.includes("删除"));
      return {
        title,
        ps,
        confirmDisabled: confirmBtn ? confirmBtn.disabled : null,
        confirmText: confirmBtn ? confirmBtn.textContent.trim() : null
      };
    });

    console.log("[Test] Modal Info:", JSON.stringify(modalInfo, null, 2));
    assert.equal(modalInfo.title, "删除大数据集");
    assert.equal(modalInfo.confirmDisabled, false, "Confirm delete button MUST NOT be disabled when children exist!");
    assert(modalInfo.ps.some(p => p.includes("包含 1 个子数据集") && p.includes("一并移除")), "Modal prompt must explain cascade deletion");

    const modalScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v41_cascade_delete_dialog.png"), Buffer.from(modalScreenshot, "base64"));
    console.log("[Test] Saved v41_cascade_delete_dialog.png");

    // 5. Confirm delete
    console.log("[Test] Confirming cascade delete...");
    const confirmDeleteBtn = await driver.findElement(By.xpath('//div[contains(@class, "modal-actions")]//button[contains(., "删除")]'));
    await confirmDeleteBtn.click();
    await driver.sleep(2500);

    // 6. Verify both group and child dataset are gone
    const groupStillExists = await driver.executeScript((name) => {
      return Array.from(document.querySelectorAll("tr.parent-row .name-text")).some(el => el.textContent.includes(name));
    }, testGroupName);
    assert.equal(groupStillExists, false, "Parent group should be deleted");

    const childStillExists = await driver.executeScript((name) => {
      return Array.from(document.querySelectorAll("tr:not(.parent-row) .name-text")).some(el => el.textContent.includes(name));
    }, testChildName);
    assert.equal(childStillExists, false, "Child dataset should be cascaded and deleted");

    const doneScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v41_cascade_deleted_done.png"), Buffer.from(doneScreenshot, "base64"));
    console.log("[Test] Saved v41_cascade_deleted_done.png");

    // 7. Refresh page and verify persistence
    console.log("[Test] Refreshing page to verify persistence...");
    await driver.navigate().refresh();
    await driver.sleep(3000);

    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (e) {}

    const groupAfterRefresh = await driver.executeScript((name) => {
      return Array.from(document.querySelectorAll("tr.parent-row .name-text")).some(el => el.textContent.includes(name));
    }, testGroupName);
    assert.equal(groupAfterRefresh, false, "Parent group should still be absent after refresh");

    console.log("All tests passed successfully! Cascade delete of dataset group and its children works perfectly.");

  } finally {
    await driver.quit();
  }
})();
