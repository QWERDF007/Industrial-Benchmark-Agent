const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox.js");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const ARTIFACT_DIR = "/home/dell/.gemini/antigravity-cli/brain/a36a5c63-3c83-4b2c-b4ff-8a1730f771df";

async function run() {
  const options = new firefox.Options().addArguments("-headless");
  options.setPreference("javascript.options.intl_segmenter", true);

  if (process.env.FIREFOX_PATH) {
    options.setBinary(process.env.FIREFOX_PATH);
  }

  const service = new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "/tmp/geckodriver");

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();

  try {
    await driver.manage().window().setRect({ width: 1500, height: 950 });

    const logContent = fs.readFileSync("/data1/wt/Industrial-Benchmark-Agent/runs/dsh_web.log", "utf8");
    const matches = [...logContent.matchAll(/token=([^\s\)\&]+)/g)];
    const token = matches.length ? matches[matches.length - 1][1] : "";
    const baseUrl = `http://127.0.0.1:8000/?token=${token}`;
    console.log("Navigating to:", baseUrl);
    await driver.get(baseUrl);
    await driver.sleep(2500);

    // Dismiss welcome/config dialog if present
    try {
      const later = await driver.wait(
        until.elementLocated(By.xpath('//button[contains(., "稍后配置") or @aria-label="稍后配置"]')),
        2000
      );
      await later.click();
      await driver.sleep(1000);
    } catch (_) {}

    // Switch to 知识挖掘
    console.log("Navigating to 知识挖掘...");
    const navItems = await driver.findElements(
      By.xpath('//div[contains(@class, "sidebar")]//span[contains(., "知识挖掘")] | //a[contains(., "知识挖掘")] | //button[contains(., "知识挖掘")]')
    );
    if (navItems.length > 0) {
      await navItems[0].click();
      await driver.sleep(1500);
    } else {
      await driver.get(`http://127.0.0.1:8000/industrial/knowledge?token=${token}`);
      await driver.sleep(1500);
    }

    const kbPage = await driver.wait(until.elementLocated(By.css("#knowledge-page, .iad-knowledge-page")), 5000);
    assert.ok(await kbPage.isDisplayed(), "Knowledge page should be displayed");
    console.log("✓ Knowledge page displayed");

    // 1. Verify normal page layout
    const topline = await driver.findElement(By.css(".topline"));
    assert.ok(await topline.isDisplayed(), "Topline header should be displayed");
    const createBtn = await driver.findElement(By.css("#create-btn"));
    assert.ok(await createBtn.isDisplayed(), "Create button should be displayed");

    const scrMain = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "knowledge_page_main.png"), Buffer.from(scrMain, "base64"));
    console.log("Saved screenshot: knowledge_page_main.png");

    // 2. Click ＋ 新建挖掘
    console.log("Clicking ＋ 新建挖掘 button...");
    await createBtn.click();
    await driver.sleep(600);

    // Verify .kb-creating is present on .kb-v45
    const kbV45 = await driver.findElement(By.css(".kb-v45"));
    const v45Class = await kbV45.getAttribute("class");
    assert.ok(v45Class.includes("kb-creating"), "Container .kb-v45 should have class kb-creating");
    console.log("✓ .kb-v45 has class kb-creating");

    // Verify topline and jobs table are hidden
    assert.ok(!(await topline.isDisplayed()), "Topline should be hidden when creating");
    console.log("✓ Topline header is hidden in create mode");

    // Verify #kb-setup-page is visible and positioned IN-PLACE (not at the bottom of the body!)
    const setupPage = await driver.findElement(By.css("#kb-setup-page"));
    assert.ok(await setupPage.isDisplayed(), "#kb-setup-page should be displayed");

    const setupRect = await setupPage.getRect();
    console.log("#kb-setup-page rect:", setupRect);

    // It must be at the top of the main area (y coordinate < 150px)
    assert.ok(setupRect.y < 150, `#kb-setup-page should be rendered near top in-place, got y=${setupRect.y}`);
    assert.ok(setupRect.width > 800, `#kb-setup-page should fill content width, got width=${setupRect.width}`);
    console.log("✓ #kb-setup-page is rendered IN-PLACE at the top of main area (NOT at bottom of page!)");

    // Check header and back button
    const backBtn = await driver.findElement(By.css("#kb-setup-back"));
    assert.ok(await backBtn.isDisplayed(), "Back button '返回作业与结果' should be displayed");

    // Check panels inside setup page
    const scopeSec = await driver.findElement(By.css(".kb-setup-scope"));
    assert.ok(await scopeSec.isDisplayed(), "Scope section should be displayed");

    const dirSec = await driver.findElement(By.css(".kb-setup-directions"));
    assert.ok(await dirSec.isDisplayed(), "Directions section should be displayed");

    const promptSec = await driver.findElement(By.css(".kb-setup-prompt"));
    assert.ok(await promptSec.isDisplayed(), "Prompt section should be displayed");

    const confirmSec = await driver.findElement(By.css(".kb-setup-confirm"));
    assert.ok(await confirmSec.isDisplayed(), "Confirm section should be displayed");

    const submitBtn = await driver.findElement(By.css("#submit-job"));
    assert.ok(await submitBtn.isDisplayed(), "Submit button '开始挖掘' should be displayed");

    const scrSetup = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "knowledge_setup_page_in_place.png"), Buffer.from(scrSetup, "base64"));
    console.log("Saved screenshot: knowledge_setup_page_in_place.png");

    // 3. Test Tab Switching
    console.log("Testing Direction Tab switching...");
    const tabExplore = await driver.findElement(By.css("#kb-tab-explore"));
    await tabExplore.click();
    await driver.sleep(300);

    const explorePanel = await driver.findElement(By.css("#kb-explore-panel"));
    assert.ok(await explorePanel.isDisplayed(), "Exploration panel should be displayed after clicking tab");

    const presetPanel = await driver.findElement(By.css("#kb-preset-panel"));
    assert.ok(!(await presetPanel.isDisplayed()), "Preset panel should be hidden");
    console.log("✓ Tab switching works properly");

    const tabPreset = await driver.findElement(By.css("#kb-tab-preset"));
    await tabPreset.click();
    await driver.sleep(300);
    assert.ok(await presetPanel.isDisplayed(), "Preset panel should be displayed again");

    // 4. Test Prompt Empty Validation
    console.log("Testing validation when prompt is cleared...");
    const promptText = await driver.findElement(By.css("#prompt-text"));
    await promptText.clear();
    await promptText.sendKeys(Key.chord(Key.CONTROL, "a"), Key.BACK_SPACE);
    await driver.sleep(300);

    const checkText = await (await driver.findElement(By.css("#kb-run-check"))).getText();
    assert.ok(checkText.includes("请填写完整提示词"), `Status should prompt for complete prompt, got: ${checkText}`);
    assert.ok(!(await submitBtn.isEnabled()), "Submit button should be disabled when prompt empty");
    console.log("✓ Validation disables submit when prompt empty");

    // 5. Test Restore Prompt
    console.log("Testing restore prompt button...");
    const composeBtn = await driver.findElement(By.css("#compose-prompt"));
    await composeBtn.click();
    await driver.sleep(400);

    // If confirmation modal appears, accept it
    const confirmAccepts = await driver.findElements(By.css("#confirm-accept"));
    if (confirmAccepts.length > 0 && (await confirmAccepts[0].isDisplayed())) {
      await confirmAccepts[0].click();
      await driver.sleep(300);
    }

    assert.ok(await submitBtn.isEnabled(), "Submit button should be re-enabled after restore");
    console.log("✓ Prompt restore works properly");

    // 6. Test Back Button returns to main jobs view
    console.log("Testing '返回作业与结果' button...");
    await backBtn.click();
    await driver.sleep(500);

    const v45ClassBack = await kbV45.getAttribute("class");
    assert.ok(!v45ClassBack.includes("kb-creating"), ".kb-v45 should NOT have kb-creating after back");
    assert.ok(await topline.isDisplayed(), "Topline should be visible again after back");
    assert.ok(!(await setupPage.isDisplayed()), "#kb-setup-page should be hidden after back");
    console.log("✓ Back button cleanly returns to regular knowledge page view");

    const scrBack = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "knowledge_page_back_to_main.png"), Buffer.from(scrBack, "base64"));
    console.log("Saved screenshot: knowledge_page_back_to_main.png");

    console.log("\n==========================================");
    console.log("ALL KNOWLEDGE MINING IN-PLACE SETUP CHECKS PASSED!");
    console.log("==========================================");
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
