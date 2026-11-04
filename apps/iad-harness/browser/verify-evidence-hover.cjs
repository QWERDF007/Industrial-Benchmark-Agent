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

    const baseUrl = "http://127.0.0.1:8000/?token=l-akM2eVGWwndl_ZpB6nrMYOEw-JLrrQnYlseXJvh-8";
    console.log("Navigating to:", baseUrl);
    await driver.get(baseUrl);
    await driver.sleep(2000);

    // Switch to 方向探索
    console.log("Navigating to 方向探索...");
    const navItems = await driver.findElements(
      By.xpath('//div[contains(@class, "sidebar")]//span[contains(., "方向探索")] | //a[contains(., "方向探索")] | //button[contains(., "方向探索")]')
    );
    if (navItems.length > 0) {
      await navItems[0].click();
      await driver.sleep(1500);
    } else {
      await driver.get("http://127.0.0.1:8000/industrial/exploration?token=l-akM2eVGWwndl_ZpB6nrMYOEw-JLrrQnYlseXJvh-8");
      await driver.sleep(1500);
    }

    // Check if in step-flow view, if so click "返回作业与结果"
    const backBtns = await driver.findElements(By.xpath('//button[contains(., "返回作业与结果")]'));
    if (backBtns.length > 0) {
      await backBtns[0].click();
      await driver.sleep(1000);
    }

    // Locate direction "表面细线状痕迹与成像伪影的区分"
    console.log("Looking for direction row...");
    const dirTargets = await driver.findElements(
      By.xpath('//tr[contains(., "表面细线状痕迹与成像伪影的区分")] | //div[contains(@class, "exp-direction-card") and contains(., "表面细线状痕迹与成像伪影的区分")]')
    );

    if (dirTargets.length > 0) {
      console.log("Found direction target, clicking...");
      await driver.executeScript("arguments[0].scrollIntoView(); arguments[0].click();", dirTargets[0]);
    } else {
      console.log("Finding any direction row...");
      const rows = await driver.findElements(By.css('tr[data-action="direction"], .exp-direction-view-icon, .exp-view-detail-button'));
      assert.ok(rows.length > 0, "No direction rows found");
      await driver.executeScript("arguments[0].click();", rows[0]);
    }

    const dirDialog = await driver.wait(until.elementLocated(By.css(".exp-direction-dialog")), 4000);
    assert.ok(await dirDialog.isDisplayed(), "Direction detail dialog is displayed");
    console.log("✓ Direction detail dialog opened");

    // Check rationale and chip buttons
    const rationaleSec = await driver.findElement(By.css(".exp-direction-reasoning"));
    const chips = await rationaleSec.findElements(By.css(".exp-evidence-ref"));
    const chipLabels = [];
    for (const chip of chips) {
      chipLabels.push((await chip.getText()).trim());
    }
    console.log("Found chips in rationale:", chipLabels);

    assert.ok(chipLabels.length >= 7, `Expected at least 7 chips in rationale, got ${chipLabels.length}: ${JSON.stringify(chipLabels)}`);
    assert.ok(chipLabels.includes("良品 N1"), "Should include 良品 N1");
    assert.ok(chipLabels.includes("良品 N2"), "Should include 良品 N2");
    assert.ok(chipLabels.includes("良品 N3"), "Should include 良品 N3 (formerly img_adcf480b)");
    assert.ok(chipLabels.includes("异常 A1"), "Should include 异常 A1");
    assert.ok(chipLabels.includes("异常 A2"), "Should include 异常 A2");
    assert.ok(chipLabels.includes("良品 N4"), "Should include 良品 N4");
    assert.ok(chipLabels.includes("良品 N5"), "Should include 良品 N5");
    console.log("✓ All 7 evidence tokens in rationale correctly converted to chips (no unlinked img_ ids)");

    // Find evidence cards
    const evCards = await dirDialog.findElements(By.css(".exp-direction-evidence-card"));
    console.log(`Found ${evCards.length} evidence cards`);
    assert.ok(evCards.length >= 7, `Expected at least 7 evidence cards, got ${evCards.length}`);

    // Find chip for N3
    const n3Chip = await rationaleSec.findElement(By.xpath('.//button[contains(@class, "exp-evidence-ref") and contains(., "良品 N3")]'));
    const cardN3 = await dirDialog.findElement(By.css('[data-evidence-card="N3"]'));

    // Test 1: Hover over N3 chip
    console.log("Hovering over chip 良品 N3...");
    const actions = driver.actions({ async: true });
    await actions.move({ origin: n3Chip }).perform();
    await driver.sleep(300);

    const cardN3Class = await cardN3.getAttribute("class");
    console.log("cardN3 class when N3 chip hovered:", cardN3Class);
    assert.ok(cardN3Class.includes("is-related"), "Card N3 should have class is-related when chip hovered");

    const cardN3BorderColor = await cardN3.getCssValue("border-top-color");
    console.log("cardN3 border-top-color when highlighted:", cardN3BorderColor);
    // #2458d5 is rgb(36, 88, 213)
    assert.ok(
      cardN3BorderColor === "rgb(36, 88, 213)" || cardN3BorderColor === "#2458d5",
      `Expected blue border rgb(36, 88, 213), got ${cardN3BorderColor}`
    );
    console.log("✓ Card N3 has correct blue border upon hovering chip");

    // Take screenshot of hover chip state
    const scrHoverChip = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "direction_detail_evidence_hover_chip_n3.png"), Buffer.from(scrHoverChip, "base64"));
    console.log("Saved screenshot: direction_detail_evidence_hover_chip_n3.png");

    // Test 2: Hover over card A1
    const cardA1 = await dirDialog.findElement(By.css('[data-evidence-card="A1"]'));
    const a1Chip = await rationaleSec.findElement(By.xpath('.//button[contains(@class, "exp-evidence-ref") and contains(., "异常 A1")]'));

    console.log("Hovering over card A1...");
    await actions.move({ origin: cardA1 }).perform();
    await driver.sleep(300);

    const cardA1BorderColor = await cardA1.getCssValue("border-top-color");
    console.log("cardA1 border-top-color when card hovered:", cardA1BorderColor);
    assert.ok(
      cardA1BorderColor === "rgb(36, 88, 213)" || cardA1BorderColor === "#2458d5",
      `Expected blue border rgb(36, 88, 213), got ${cardA1BorderColor}`
    );

    const a1ChipClass = await a1Chip.getAttribute("class");
    console.log("a1Chip class when card A1 hovered:", a1ChipClass);
    assert.ok(a1ChipClass.includes("is-related"), "Chip A1 should have class is-related when card A1 hovered");

    const scrHoverCard = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACT_DIR, "direction_detail_evidence_hover_card_a1.png"), Buffer.from(scrHoverCard, "base64"));
    console.log("Saved screenshot: direction_detail_evidence_hover_card_a1.png");

    console.log("\n==========================================");
    console.log("ALL VERIFICATIONS PASSED SUCCESSFULLY!");
    console.log("==========================================");
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
