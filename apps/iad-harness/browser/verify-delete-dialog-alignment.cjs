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

    // 1. Verify Exploration Delete Modal
    console.log("[Test] Checking Exploration Delete Modal...");
    const expNav = await driver.findElement(By.xpath('//button[contains(., "方向探索")]'));
    await expNav.click();
    await driver.sleep(2000);

    const expDelBtn = await driver.wait(
      until.elementLocated(By.css('[data-exp="ask-delete-job"], .exp-table [data-delete="true"], .exp-table [title*="删除"]')),
      5000
    );
    await expDelBtn.click();
    await driver.sleep(1000);

    const expInfo = await driver.executeScript(() => {
      const modal = document.querySelector("#exp-modal .exp-dialog");
      if (!modal) return null;
      const head = modal.querySelector(".exp-dialog-head");
      const cancelBtn = Array.from(modal.querySelectorAll("button")).find(b => b.textContent.trim() === "取消");
      const confirmBtn = Array.from(modal.querySelectorAll("button")).find(b => b.textContent.trim() === "删除作业");
      return {
        title: head ? head.textContent.trim() : "",
        cancel: cancelBtn ? {
          bg: window.getComputedStyle(cancelBtn).backgroundColor,
          color: window.getComputedStyle(cancelBtn).color,
          border: window.getComputedStyle(cancelBtn).borderColor,
          height: window.getComputedStyle(cancelBtn).height,
          borderRadius: window.getComputedStyle(cancelBtn).borderRadius
        } : null,
        confirm: confirmBtn ? {
          bg: window.getComputedStyle(confirmBtn).backgroundColor,
          color: window.getComputedStyle(confirmBtn).color,
          border: window.getComputedStyle(confirmBtn).borderColor,
          height: window.getComputedStyle(confirmBtn).height,
          borderRadius: window.getComputedStyle(confirmBtn).borderRadius
        } : null
      };
    });

    console.log("Exploration Delete Modal Info:", JSON.stringify(expInfo, null, 2));
    assert.equal(expInfo.title, "删除探索作业");
    assert.equal(expInfo.cancel.height, "37px");
    assert.equal(expInfo.cancel.borderRadius, "5px");
    assert.equal(expInfo.confirm.bg, "rgb(191, 56, 74)");
    assert.equal(expInfo.confirm.color, "rgb(255, 255, 255)");
    assert.equal(expInfo.confirm.height, "37px");
    assert.equal(expInfo.confirm.borderRadius, "5px");

    const expScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v40_exp_delete_modal.png"), Buffer.from(expScreenshot, "base64"));

    const cancelExp = await driver.findElement(By.xpath('//div[@id="exp-modal"]//button[contains(., "取消")]'));
    await cancelExp.click();
    await driver.sleep(1000);

    // 2. Verify Consistency Delete Modal
    console.log("[Test] Checking Consistency Delete Modal...");
    const dcNav = await driver.findElement(By.xpath('//button[contains(., "数据一致性")]'));
    await dcNav.click();
    await driver.sleep(2000);

    const dcDelBtn = await driver.findElement(By.css('.dc-table [title="删除作业"], .dc-table [data-dc="delete"]'));
    await dcDelBtn.click();
    await driver.sleep(1000);

    const dcInfo = await driver.executeScript(() => {
      const modal = document.querySelector("#dc-delete-mask .exp-dialog");
      if (!modal) return null;
      const head = modal.querySelector(".exp-dialog-head");
      const cancelBtn = Array.from(modal.querySelectorAll("button")).find(b => b.textContent.trim() === "取消");
      const confirmBtn = Array.from(modal.querySelectorAll("button")).find(b => b.textContent.trim() === "删除作业");
      return {
        title: head ? head.textContent.trim() : "",
        cancel: cancelBtn ? {
          bg: window.getComputedStyle(cancelBtn).backgroundColor,
          color: window.getComputedStyle(cancelBtn).color,
          border: window.getComputedStyle(cancelBtn).borderColor,
          height: window.getComputedStyle(cancelBtn).height,
          borderRadius: window.getComputedStyle(cancelBtn).borderRadius
        } : null,
        confirm: confirmBtn ? {
          bg: window.getComputedStyle(confirmBtn).backgroundColor,
          color: window.getComputedStyle(confirmBtn).color,
          border: window.getComputedStyle(confirmBtn).borderColor,
          height: window.getComputedStyle(confirmBtn).height,
          borderRadius: window.getComputedStyle(confirmBtn).borderRadius
        } : null
      };
    });

    console.log("Consistency Delete Modal Info:", JSON.stringify(dcInfo, null, 2));
    assert.equal(dcInfo.title, "删除检查作业");
    assert.equal(dcInfo.cancel.height, "37px");
    assert.equal(dcInfo.cancel.borderRadius, "5px");
    assert.equal(dcInfo.confirm.bg, "rgb(191, 56, 74)");
    assert.equal(dcInfo.confirm.color, "rgb(255, 255, 255)");
    assert.equal(dcInfo.confirm.height, "37px");
    assert.equal(dcInfo.confirm.borderRadius, "5px");

    const dcScreenshot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "v40_consistency_delete_modal.png"), Buffer.from(dcScreenshot, "base64"));

    const cancelDc = await driver.findElement(By.xpath('//div[@id="dc-delete-mask"]//button[contains(., "取消")]'));
    await cancelDc.click();
    await driver.sleep(1000);

    const isClosed = await driver.executeScript(() => {
      return !document.querySelector("#dc-delete-mask");
    });
    assert.equal(isClosed, true, "Dialog should be closed after clicking cancel");

    console.log("All tests passed successfully! Delete dialog styles and button colors are perfectly aligned.");
  } finally {
    await driver.quit();
  }
})();
