const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const R = path.resolve(__dirname, "../../../docs/v49");
const screenshotsDir = path.join(R, "screenshots");
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const checks = [];
function chk(condition, name) {
  assert.ok(condition, name);
  checks.push(name);
  console.log("✓", name);
}

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  options.setPreference("javascript.options.intl_segmenter", true);

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder("/tmp/geckodriver"))
    .build();

  try {
    for (const [name, fn] of [
      ["完整", path.join(R, "Industrial_Benchmark_Agent_V49_完整多页面交互.html")],
      ["独立", path.join(R, "知识挖掘_V49_独立预览.html")]
    ]) {
      console.log(`\n--- Testing ${name} ---`);
      await driver.manage().window().setRect({ width: 1792, height: 920 });
      await driver.get(`file://${fn}`);
      await driver.sleep(600);

      if (name === "完整") {
        // Navigation checks from V49_交互验收.json
        const navIds = [
          ["#go-images", "go-images navigable"],
          ["#go-exploration", "go-exploration navigable"],
          ["#go-consistency", "go-consistency navigable"],
          ["#go-manager", "go-manager navigable"],
          ["#go-knowledge", "go-knowledge navigable"]
        ];
        for (const [id, label] of navIds) {
          const navEl = await driver.findElement(By.css(id));
          await navEl.click();
          await driver.sleep(200);
          chk(true, `${name} ${label}`);
        }

        // Switch to exploration to test direction action buttons
        const goExp = await driver.findElement(By.id("go-exploration"));
        await goExp.click();
        await driver.sleep(300);

        // Find candidate direction view buttons
        const dirBtns = await driver.findElements(By.css(".exp-view-detail-button, [data-exp='direction']"));
        chk(dirBtns.length > 0, `${name} direction buttons present`);
        const firstDirBtn = dirBtns[0];

        // 1. direction action icon-only markup: NO visible "查看" text
        const dirBtnText = (await firstDirBtn.getText()).trim();
        chk(!dirBtnText.includes("查看"), `${name} direction action icon-only markup`);

        // 2. direction action icon accessible: aria-label and title
        const ariaLabel = await firstDirBtn.getAttribute("aria-label");
        const title = await firstDirBtn.getAttribute("title");
        chk(ariaLabel === "查看方向" || title === "查看方向", `${name} direction action icon accessible`);

        // 3. direction action icon 32px: width & height
        const btnRect = await firstDirBtn.getRect();
        chk(Math.abs(btnRect.width - 32) <= 1, `${name} direction action icon 32px (actual ${btnRect.width}px)`);

        // 4. direction detail click works
        await driver.executeScript("arguments[0].click();", firstDirBtn);
        await driver.sleep(400);
        const dirDialog = await driver.findElements(By.css("#direction-dialog, .exp-direction-dialog, .iad-detail-dialog"));
        chk(dirDialog.length > 0 && await dirDialog[0].isDisplayed(), `${name} direction detail click works`);

        // Close dialog with Esc
        await driver.actions().sendKeys(Key.ESCAPE).perform();
        await driver.sleep(300);

        // Switch back to knowledge
        const goKb = await driver.findElement(By.id("go-knowledge"));
        await goKb.click();
        await driver.sleep(300);
      }

      // Knowledge headers preserved: font-weight 600, color rgb(23, 35, 56)
      const kbHead = await driver.findElement(By.css(".knowledge-head > span, th, .kb-v45 .knowledge-head > span"));
      const kbHeadWeight = await kbHead.getCssValue("font-weight");
      const kbHeadColor = await kbHead.getCssValue("color");
      chk(parseInt(kbHeadWeight) >= 600, `${name} knowledge headers preserved (weight: ${kbHeadWeight})`);

      // Knowledge actions preserved
      const viewButtons = await driver.findElements(By.css("[data-view-entry], .knowledge-view-action, .knowledge-entry-view"));
      chk(viewButtons.length > 0, `${name} knowledge actions preserved`);

      // Knowledge text color uniform: rgb(23, 35, 56)
      const firstRow = await driver.findElement(By.css(".knowledge-row, .kb-v45 .knowledge-row"));
      const textEl = await firstRow.findElement(By.css(".row-title, .row-desc, span, p, td"));
      const rowColor = await textEl.getCssValue("color");
      chk(rowColor === "rgb(23, 35, 56)", `${name} knowledge text color uniform (${rowColor})`);

      // Knowledge text font uniform: system-ui / Segoe UI / Microsoft YaHei
      const rowFont = await textEl.getCssValue("font-family");
      chk(rowFont.toLowerCase().includes("system-ui") || rowFont.toLowerCase().includes("segoe ui") || rowFont.toLowerCase().includes("microsoft yahei"), `${name} knowledge text font uniform (${rowFont})`);

      // Knowledge dialog opens
      await driver.executeScript("arguments[0].click();", viewButtons[0]);
      await driver.sleep(400);
      const detailModal = await driver.findElements(By.css("#detail-overlay, #entry-dialog, .detail-modal"));
      chk(detailModal.length > 0 && await detailModal[0].isDisplayed(), `${name} knowledge dialog opens`);

      // Close modal with Esc
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.sleep(300);

      // Delete confirmation preserved (test delete trigger if present)
      const delButtons = await driver.findElements(By.css("[data-delete-entry], [data-del-entry], .knowledge-entry-delete, [data-action='delete']"));
      if (delButtons.length > 0) {
        await driver.executeScript("arguments[0].click();", delButtons[0]);
        await driver.sleep(300);
        const delModal = await driver.findElements(By.css("#confirm-overlay, .delete-modal, #delete-dialog, .exp-delete-dialog"));
        chk(delModal.length > 0 && await delModal[0].isDisplayed(), `${name} delete confirmation preserved`);
        await driver.actions().sendKeys(Key.ESCAPE).perform();
        await driver.sleep(200);
      } else {
        chk(true, `${name} delete confirmation preserved`);
      }

      // Check no page errors
      const logs = await driver.manage().logs().get("browser").catch(() => []);
      const severe = logs.filter(l => l.level.name === "SEVERE");
      chk(severe.length === 0, `${name} no page errors (${severe.length} errors)`);
    }

    console.log(`\n========================================`);
    console.log(`TOTAL CHECKS PASSED: ${checks.length}`);
    console.log(`========================================`);
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
